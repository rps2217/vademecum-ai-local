# 🔍 AUDITORÍA TÉCNICA - Conexión Supabase

> **Fecha:** Julio 2026  
> **Auditor:** OpenHands Agent  
> **Versión analizada:** v2.2.0

---

## 0. Resumen Ejecutivo

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Dependencia instalada | ✅ | `@supabase/supabase-js@2.103.3` |
| Cliente Supabase creado | ❌ | No se usa `createClient` |
| Configuración URL/Key | ⚠️ | Definida en variables, no usada |
| SyncService conecta | ❌ | `syncOp()` marca como "synced" sin hacer nada |
| UI de configuración | ⚠️ | Placeholder, no funcional |
| Schema PostgreSQL | ❌ | No definido |
| Auth Supabase | ❌ | No implementado |

**Veredicto: Supabase NO está conectado. Es un esqueleto sin implementación.**

---

## 1. Estado Actual del Código

### 1.1 Dependencias

```json
// package.json
"@supabase/supabase-js": "^2.103.3"
```

**Instalado:** ✅ Sí  
**Usado en código:** ❌ No

### 1.2 Variables de Entorno

```env
# .env.example
SUPABASE_URL="https://yourproject.supabase.co"
SUPABASE_ANON_KEY="your-anon-public-key"
VITE_SUPABASE_URL="https://yourproject.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
```

**En código:** ❌ No se leen

### 1.3 SyncService

**Ubicación:** `src/core/sync/SyncService.ts`

```typescript
// Configuración (definida pero no usada)
export interface SyncConfig {
  enabled: boolean;
  supabaseUrl?: string;
  supabaseKey?: string;
}

// Método syncOp - NO HACE NADA REAL
private async syncOp(op: DbOutboxOp): Promise<void> {
  if (!this.config.enabled || !this.config.supabaseUrl) {
    op.status = 'synced';  // ← Fake! Solo marca como synced
    await db.outbox.put(op);
    return;  // ← Sale sin sincronizar
  }

  op.status = 'in_flight';
  await db.outbox.put(op);

  try {
    // ← AQUÍ FALTA: Llamada real a Supabase
    op.status = 'synced';  // ← Fake!
    await db.outbox.put(op);
  } catch (error) {
    op.status = 'failed';
    await db.outbox.put(op);
  }
}
```

### 1.4 SettingsPage (UI)

**Ubicación:** `src/pages/SettingsPage.tsx`

```tsx
// Tab de sincronización - PLACEHOLDER
{activeTab === 'sync' && (
  <Card className="p-6">
    <h2 className="font-semibold mb-4">Sincronización en la nube</h2>
    <p className="text-muted-foreground mb-4">
      Sincroniza tus datos de forma segura con Supabase.
    </p>
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <p className="font-medium">Estado</p>
        <p className="text-sm text-muted-foreground">Deshabilitado</p>
      </div>
      <Button variant="outline">Configurar</Button>  {/* ← No hace nada */}
    </div>
  </Card>
)}
```

---

## 2. Lo que Existe vs Lo que Falta

### 2.1 Lo que EXISTE ✅

| Componente | Descripción |
|------------|-------------|
| Dependencia | `@supabase/supabase-js@2.103.3` instalado |
| Tipos | Interfaces de sync definidas |
| Outbox | Tabla en Dexie para cola de operaciones |
| Snapshots | Tabla para backups locales |
| UI | Pestaña de configuración placeholder |
| Variables | `.env.example` con nombres correctos |

### 2.2 Lo que FALTA ❌

| Componente | Prioridad | Esfuerzo |
|------------|-----------|----------|
| Cliente Supabase | 🔴 Alta | Bajo |
| Lectura de env vars | 🔴 Alta | Bajo |
| CRUD en Supabase | 🔴 Alta | Medio |
| Auth (login/logout) | 🔴 Alta | Alto |
| Schema PostgreSQL | 🟡 Media | Medio |
| UI configuración | 🟡 Media | Medio |
| Conflict resolution | 🟡 Media | Alto |
| Tests E2E | 🟢 Baja | Medio |

---

## 3. Arquitectura Ideal

### 3.1 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                      Aplicación                              │
├─────────────────────────────────────────────────────────────┤
│  Dexie (IndexedDB)                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ ingredients  │  │  synergies   │  │   outbox     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                              │              │
│                                              ▼              │
│                        ┌──────────────────────────┐        │
│                        │      SyncService         │        │
│                        │  - addToOutbox()         │        │
│                        │  - performSync()          │        │
│                        │  - syncOp()              │        │
│                        └──────────────────────────┘        │
│                                     │                       │
└─────────────────────────────────────┼─────────────────────┘
                                      │ fetch/REST
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                               │
├─────────────────────────────────────────────────────────────┤
│  PostgREST API          Auth           Storage            │
│  ┌──────────────┐    ┌──────────┐    ┌──────────┐       │
│  │ /ingredients  │    │  Users   │    │ /backups  │       │
│  │ /synergies   │    │  (E2EE)  │    │  (encrypted)│     │
│  │ /products    │    └──────────┘    └──────────┘       │
│  └──────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Cliente Supabase Faltante

```typescript
// src/lib/supabase.ts (NO EXISTE)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 4. Implementación Recomendada

### 4.1 Paso 1: Cliente Supabase

```typescript
// src/lib/supabase.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured');
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
  }

  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  return !!(
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
}
```

### 4.2 Paso 2: SyncService Completo

```typescript
// src/core/sync/SyncService.ts - AGREGAR

import { getSupabase } from '@/lib/supabase';

private async syncToSupabase(op: DbOutboxOp): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('Supabase not configured, skipping sync');
    return;
  }

  const endpoint = `${op.table}`;
  
  try {
    switch (op.type) {
      case 'insert':
        await supabase.from(endpoint).insert(op.payload);
        break;
      case 'update':
        const recordId = op.recordId;
        await supabase.from(endpoint).update(op.payload).eq('id', recordId);
        break;
      case 'delete':
        await supabase.from(endpoint).delete().eq('id', op.recordId);
        break;
    }
  } catch (error) {
    console.error('Supabase sync error:', error);
    throw error;
  }
}
```

### 4.3 Paso 3: Schema PostgreSQL (Supabase)

```sql
-- Ejecutar en Supabase SQL Editor

-- Tabla de ingredientes
CREATE TABLE ingredients (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  sinonimos TEXT[],
  categoria TEXT NOT NULL,
  sistemas TEXT[],
  indicaciones TEXT[],
  evidencia TEXT DEFAULT 'C',
  propiedades TEXT[],
  seguridad JSONB,
  interacciones TEXT[],
  fuentes TEXT[],
  lamport INTEGER DEFAULT 0,
  device_id TEXT NOT NULL,
  updated_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL,
  tombstone INTEGER DEFAULT 0
);

-- Tabla de sinergias
CREATE TABLE synergies (
  id TEXT PRIMARY KEY,
  ingrediente_a TEXT NOT NULL,
  ingrediente_b TEXT NOT NULL,
  tipo TEXT NOT NULL,
  nivel TEXT DEFAULT 'medio',
  mecanismo TEXT,
  evidencia TEXT DEFAULT 'C',
  descripcion TEXT,
  fuentes TEXT[],
  lamport INTEGER DEFAULT 0,
  device_id TEXT NOT NULL,
  updated_at BIGINT NOT NULL,
  tombstone INTEGER DEFAULT 0
);

-- RLS (Row Level Security)
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE synergies ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (para anon key)
CREATE POLICY "Public read" ON ingredients FOR SELECT USING (true);
CREATE POLICY "Public insert" ON ingredients FOR INSERT WITH CHECK (true);
```

### 4.4 Paso 4: UI de Configuración

```tsx
// SettingsPage.tsx - COMPLETAR

{activeTab === 'sync' && (
  <Card className="p-6">
    <h2 className="font-semibold mb-4">Sincronización en la nube</h2>
    
    {!isSupabaseConfigured ? (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Para habilitar la sincronización, configura las credenciales de Supabase.
        </p>
        <div className="space-y-2">
          <label className="text-sm font-medium">URL de Supabase</label>
          <input 
            type="url" 
            className="w-full p-2 border rounded"
            placeholder="https://xxx.supabase.co"
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Clave Anon</label>
          <input 
            type="text" 
            className="w-full p-2 border rounded"
            placeholder="eyJhbGciOiJIUzI1NiIs..."
            value={supabaseKey}
            onChange={(e) => setSupabaseKey(e.target.value)}
          />
        </div>
        <Button onClick={saveSupabaseConfig}>Guardar y conectar</Button>
      </div>
    ) : (
      <SyncStatusPanel />
    )}
  </Card>
)}
```

---

## 5. Plan de Implementación

### Fase 1: Conexión Básica (2h)

```bash
# 1. Crear src/lib/supabase.ts
# 2. Actualizar SyncService para usar el cliente
# 3. Agregar lectura de variables de entorno
# 4. Probar conexión básica
```

### Fase 2: CRUD de Ingredientes (4h)

```bash
# 1. Crear schema en Supabase
# 2. Implementar sync de ingredients
# 3. Implementar sync de synergies
# 4. Probar bidireccional
```

### Fase 3: Auth y Conflictos (8h)

```bash
# 1. Implementar auth con Supabase
# 2. Sistema de recuperación de cuenta
# 3. Resolución de conflictos (CRDT/Lamport)
# 4. UI completa de settings
```

### Fase 4: Testing y Polish (4h)

```bash
# 1. Tests E2E de sync
# 2. Manejo de errores
# 3. Optimización de performance
# 4. Documentación
```

---

## 6. Riesgos y Consideraciones

### 6.1 Seguridad

| Riesgo | Mitigación |
|--------|------------|
| Datos sensibles en Supabase | Cifrado E2EE antes de subir |
| Acceso no autorizado | RLS policies |
| Perdida de datos | Backups automaticos |
| Conflictos de sync | Lamport clock ya implementado |

### 6.2 Performance

| Concern | Solución |
|---------|----------|
| Sincronizacion constante | Outbox con debounce |
| Datos grandes | Compresion antes de upload |
| Latencia | Sync en background |
| Offline | Queue en outbox |

### 6.3 Costos (Supabase)

| Plan | Limite | Costo |
|------|--------|-------|
| Free | 500MB, 2GB transfer | $0 |
| Pro | 8GB, 50GB transfer | $25/mes |
| Team | 100GB, 1TB transfer | $599/mes |

**Recomendación:** Empezar con Free, escalar si es necesario.

---

## 7. Conclusión

### Estado Actual

Supabase está **instalado pero NO conectado**. La aplicación funciona 100% offline con Dexie, pero la sincronización en la nube es un esqueleto sin implementación.

### Próximos Pasos Recomendados

1. **Inmediato:** Crear `src/lib/supabase.ts` con cliente básico
2. **Corto plazo:** Implementar sync unidireccional (local → cloud)
3. **Medio plazo:** Auth + sync bidireccional
4. **Largo plazo:** Conflict resolution + optimizaciones

### Alternativas a Supabase

Si Supabase no es la mejor opción, considerar:

| Servicio | Pros | Contras |
|----------|------|---------|
| Firebase | Mas maduro, mejor docs | Vendor lock-in |
| PocketBase | Simple, self-hosted | Menos features |
| Turso | SQLite distribuido | Setup complejo |
| LiteSync | Sync local-native | Beta |

---

## Anexo: Archivos Analizados

```
src/
├── core/
│   └── sync/
│       └── SyncService.ts    # Esqueleto sin implementacion
├── pages/
│   └── SettingsPage.tsx      # UI placeholder
├── db/
│   ├── schema.ts            # Tabla outbox para sync
│   └── seeders/            # Datos locales
└── lib/                    # ← NO EXISTE supabase.ts
```

```
package.json
.env.example
```
