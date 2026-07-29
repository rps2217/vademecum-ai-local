# 🛠️ PLAN DE CORRECCIÓN - Sincronización Supabase

## Diagnóstico de Errores

### Error 1: UUID Inválido (Causa Principal)

```
{code: '22P02', message: 'invalid input syntax for type uuid: "equinacea"'}
```

**Problema**: 
- La tabla `extended_ingredients` tiene `id` definido como `UUID PRIMARY KEY`
- Estamos enviando `{ id: "equinacea", ... }`
- PostgreSQL rechaza strings que no son UUIDs válidos

**Solución**: 
- NO enviar el campo `id` en uploads (Supabase genera UUID automáticamente)
- Usar `ingredient_key` como identificador local
- Si necesitamos el UUID devuelto, obtenerlo después del insert

### Error 2: on_conflict Inválido

```
extended_ingredients?on_conflict=ingredient_key
```

**Problema**:
- `on_conflict` solo funciona con campos `UNIQUE`
- `ingredient_key` es `UNIQUE`, pero el conflict resolution falla porque `id` no es válido

**Solución**:
- Eliminar `on_conflict` del upsert
- Usar `insert` con `onConflict` del SDK de Supabase
- O usar `rpc` para manejo de upserts

### Error 3: Auto-Sync Infinito

```
Uploading 105 ingredients...
Uploading 105 ingredients...
Uploading 105 ingredients...
```

**Problema**:
- El sync se ejecuta múltiples veces
- No se guarda correctamente `lastSyncAll`
- El auto-sync no tiene debounce suficiente

**Solución**:
- Verificar que `saveLastSyncTime()` se ejecute
- Agregar flag `isSyncing` para evitar múltiples sincronizaciones simultáneas
- Guardar timestamp ANTES de sync, no después

---

## Plan de Implementación

### 1. Corregir IngredientAdapter

```typescript
// ANTES (incorrecto)
{
  id: local.id, // "equinacea" - NO ES UUID!
  ingredient_key: local.id,
  ...
}

// DESPUÉS (correcto)
{
  // NO incluir id - Supabase genera UUID automáticamente
  ingredient_key: local.id,
  name: local.nombre,
  ...
}
```

### 2. Corregir SyncManager Upload

```typescript
// ANTES
const { error } = await supabase
  .from('extended_ingredients')
  .upsert(remote, { onConflict: 'ingredient_key' });

// DESPUÉS  
const { data, error } = await supabase
  .from('extended_ingredients')
  .upsert(remote, { 
    onConflict: 'ingredient_key',
    // NO incluir id en remote
  });
```

### 3. Deshabilitar Auto-Sync Temporalmente

```typescript
// En SyncManager constructor
this.config = {
  enabled: false,  // Deshabilitado hasta corregir
  autoSync: false,
  syncInterval: 60000,
  syncOnStart: false,
};
```

### 4. Verificar Supabase Schema

Necesitamos verificar que `ingredient_key` tiene constraint UNIQUE:

```sql
-- Verificar en Supabase SQL Editor:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'extended_ingredients';
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/data/adapters/IngredientAdapter.ts` | No enviar campo `id` |
| `src/data/sync/SyncManager.ts` | Corregir upsert, deshabilitar auto-sync |
| `src/data/adapters/SynergyAdapter.ts` | No enviar campo `id` |

---

## Verificación

Después de corregir:

1. **Sync manual** debería funcionar sin errores 400
2. **Auto-sync** debería detenerse después de una ejecución
3. **Protocols** ya funcionan (no tienen el problema de UUID)

---

## Script de Prueba

```bash
# Verificar que ingredient_key es único
curl -s -X POST "https://pspxqzwxulgmzarlqwtt.supabase.co/rest/v1/extended_ingredients" \
  -H "apikey: ..." \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{
    "ingredient_key": "test_correccion",
    "name": "Test",
    "category": "test",
    "synonyms": [],
    "indications": [],
    "contraindications": [],
    "interactions": []
  }'
```

Si funciona, el problema es el campo `id`. Si falla, el problema es el schema.
