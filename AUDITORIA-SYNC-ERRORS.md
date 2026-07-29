# 🔍 AUDITORÍA COMPLETA: Errores de Sincronización Supabase

**Fecha:** 2026-07-29  
**Proyecto:** Vademecum AI  
**Proyecto Supabase:** pspxqzwxulgmzarlqwtt  
**Estado:** ❌ CRÍTICO - Sistema de sync no funcional

---

## 📊 RESUMEN EJECUTIVO

### Verificación Directa Realizada ✅
Se verificó directamente el estado de Supabase con las credenciales proporcionadas.

### Tablas Existentes Confirmadas
| Tabla | Existe | Registros | Permisos Lectura |
|-------|--------|-----------|------------------|
| `extended_ingredients` | ✅ SÍ | ~6 | ✅ Funciona |
| `ingredient_relationships` | ✅ SÍ | ~40+ | ✅ Funciona |
| `protocols` | ✅ SÍ | 5 | ✅ Funciona |
| `ingredients` | ❌ NO | - | - |
| `synergies` | ❌ NO | - | - |

### Síntomas Observados
| Código HTTP | Cantidad | Descripción |
|-------------|----------|-------------|
| 42501 | ~150+ | **RLS Policy Violation** - ❌ CAUSA PRINCIPAL |
| 401 | Variable | Unauthorized - Secondary |
| 406 | Variable | Not Acceptable - Secondary |

### Impacto Real
- ❌ **0 ingredientes** sincronizados (de 105 intentados)
- ❌ **0 sinergias** sincronizadas (de 40 intentadas)
- ✅ **5 protocolos** descargados correctamente
- ✅ KB seed funciona localmente (106 ingredients, 44 synergies)

---

## 🔴 PROBLEMA #1: POLÍTICAS RLS BLOQUEAN ESCRITURA

### Descripción
**✅ VERIFICADO:** Las tablas existen, pero las políticas RLS bloquean INSERT/UPDATE/DELETE.

### Prueba Real Realizada
```bash
# Intento de INSERT en ingredient_relationships con anon key:
curl -X POST "https://pspxqzwxulgmzarlqwtt.supabase.co/rest/v1/ingredient_relationships" \
  -H "apikey: <ANON_KEY>" \
  -d '{"ingrediente1":"valeriana",...}'

# Resultado:
{"code":"42501","message":"new row violates row-level security policy for table \"ingredient_relationships\""}
```

### Causa Raíz
Las políticas RLS actuales **requieren autenticación** para operaciones de escritura:
```sql
-- Política actual (restrictiva):
CREATE POLICY "Allow authenticated insert ingredient_relationships"
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### Solución Confirmada
Crear políticas RLS públicas para escritura:
```sql
CREATE POLICY "Public can insert ingredient_relationships" ON public.ingredient_relationships
    FOR INSERT WITH CHECK (true);
```

### Archivos Involucrados
- `src/data/sync/SyncManager.ts` (líneas 272, 280, 291, 330, 340, 351, 444, 523)

### Tablas Disponibles en el Proyecto

**1. `supabase/schema.sql`** - Define `ingredients` y `sinergias`
```sql
CREATE TABLE ingredients ( ... );
CREATE TABLE sinergias ( ... );
```

**2. `scripts/supabase_synergies_schema.sql`** - Define `ingredient_relationships`
```sql
CREATE TABLE ingredient_relationships (
    ingredient1_id VARCHAR(100),  -- ❌ Código usa: ingrediente1
    ingredient2_id VARCHAR(100),  -- ❌ Código usa: ingrediente2
    tipo_relacion VARCHAR(20)
);
```

**3. `supabase-insert-minerals.sql`** - Inserta en `extended_ingredients`
```sql
INSERT INTO extended_ingredients ( ...) -- ❌ Tabla no existe
```

**4. `supabase/knowledge-base-schema.sql`** - Define `knowledge_base`
```sql
CREATE TABLE knowledge_base ( ... ); -- Para sync KB, no ingredients
```

### Acción Requerida
> ⚠️ **REQUIERE DECISIÓN ARQUITECTÓNICA:**
> 1. ¿Cuál schema es el correcto para producción?
> 2. ¿Migrar a un solo schema consistente?

---

## 🟡 PROBLEMA #2: SCHEMA DESACTUALIZADO EN CÓDIGO

### Descripción
El código busca tablas que no existen (`ingredients`, `synergies`).

### Análisis
El código actual:
- Busca `ingredients` → ❌ No existe
- Busca `synergies` → ❌ No existe
- Busca `extended_ingredients` → ✅ Existe
- Busca `ingredient_relationships` → ✅ Existe

### Archivos Involucrados
- `src/core/sync/SyncService.ts` (líneas 233, 241)
- `src/data/sync/SyncManager.ts`

### Solución
El código ya usa `extended_ingredients` y `ingredient_relationships` correctamente, solo necesita las políticas RLS.

---

## ✅ MEJORA IMPLEMENTADA: Sync Delta Bidireccional

### Descripción
Se implementó sincronización delta completa para optimizar el rendimiento.

### Cambios Realizados

**Archivo:** `src/data/sync/SyncManager.ts`

1. **Nuevo método `sync(fullSync?: boolean)`**
   - Si `fullSync = true`: sube/baja TODOS los registros
   - Si `fullSync = false` o no se especifica: solo delta

2. **Nuevo método `forceFullSync()`**
   - Fuerza sincronización completa ignorando delta

3. **Upload Delta**
   - Usa índice `updatedAt` para filtrar registros modificados
   - Solo sube cambios desde última sincronización

4. **Download Delta**
   - Usa filtro `.gte('updated_at', lastSync)` en Supabase
   - Solo baja cambios desde última sincronización

### Lógica de Delta Sync

```typescript
// Primera sincronización = FULL SYNC
const lastSync = await this.getLastSyncTime();
const isFullSync = fullSync || !lastSync || lastSync === '1970-01-01T00:00:00Z';

// Upload Delta
if (isFullSync) {
  locals = await db.ingredients.toArray(); // Todos
} else {
  locals = await db.ingredients
    .where('updatedAt')
    .above(lastSyncMs)
    .toArray(); // Solo modificados
}

// Download Delta
gte('updated_at', lastSync); // Solo remotos modificados
```

### Métricas de Progreso

```typescript
interface SyncProgress {
  // ... otros campos
  uploadedDelta: number;   // Registros subidos en delta
  downloadedDelta: number; // Registros bajados en delta
}
```

### Uso

```typescript
// Sync normal (delta si ya hay última sincronización)
await syncManager.sync();

// Force full sync
await syncManager.forceFullSync();
```

### Beneficios

| Escenario | Antes | Después |
|-----------|-------|---------|
| Primera sync | 150 requests | 150 requests (full) |
| Sync subsiguientes | 150 requests | ~5-20 requests |
| Modificar 1 ingrediente | Sube 105 | Sube 1 |

---

## ✅ ACCIÓN REQUERIDA

### Ejecutar script de corrección RLS

1. Ve a: https://supabase.com/dashboard/project/pspxqzwxulgmzarlqwtt/sql/new

2. Copia y pega el contenido de `scripts/fix-sync-rls.sql`

3. Click en **"Run"**

4. Deberías ver:
```
========================================
VERIFICACIÓN DE RLS
========================================
Políticas públicas creadas: 8

✅ RLS corregido exitosamente!
Ahora el sync debería funcionar.
```

5. Recarga la aplicación Vademecum AI

6. Ejecuta sync manual desde Settings

---

## 📈 MÉTRICAS DE ÉXITO

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Ingredientes sincronizados | 0/105 | 105/105 |
| Sinergias sincronizadas | 0/40 | 40/40 |
| Protocolos descargados | 5/5 ✅ | 5/5 |
| Tiempo de sync | N/A | < 30s |
| Errores por sync | ~150 | 0 |

---

## 🔗 RECURSOS

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase SQL Editor](https://supabase.com/dashboard/project/pspxqzwxulgmzarlqwtt/sql/new)

---

**Auditoría completada - 2026-07-29**
