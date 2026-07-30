# 📋 PLAN DE IMPLEMENTACIÓN - Conexión Supabase

> **Objetivo:** Implementar sincronización bidireccional con Supabase
> **Versión:** v2.3.0
> **Fecha:** Julio 2026

---

## 0. Estado Actual

| Componente | Estado | Acción Requerida |
|------------|--------|-----------------|
| Dependencia `@supabase/supabase-js` | ✅ Instalada | Ninguna |
| Cliente Supabase | ❌ No existe | Crear `src/lib/supabase.ts` |
| SyncService | ⚠️ Esqueleto | Implementar `syncToSupabase()` |
| Auth | ❌ No existe | Crear sistema de auth |
| Schema PostgreSQL | ❌ No existe | Crear en Supabase |
| UI Config | ⚠️ Placeholder | Implementar panel real |

---

## 1. Arquitectura Objetivo

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vademecum AI App                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐         ┌─────────────────────────────┐    │
│  │  React UI      │         │     SyncService             │    │
│  │  - SettingsPage │◄──────►│  - addToOutbox()          │    │
│  │  - IngredientDetail│       │  - performSync()          │    │
│  │  - KnowledgePage │        │  - syncToSupabase()       │    │
│  └─────────────────┘         │  - resolveConflicts()       │    │
│                              └──────────────┬──────────────┘    │
│                                             │                    │
│  ┌─────────────────┐                        │                    │
│  │  Dexie (Local) │◄───────────────────────┘                    │
│  │  - ingredients  │                                              │
│  │  - synergies    │                                              │
│  │  - outbox      │                                              │
│  │  - snapshots   │                                              │
│  └─────────────────┘                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS/REST
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase Cloud                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │  PostgREST   │    │     Auth     │    │   Storage    │   │
│  │  /ingredients │    │   Users     │    │  /backups    │   │
│  │  /synergies  │    │   E2EE Keys │    │  (encrypted) │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Fases de Implementación

### FASE 1: Cliente Supabase y Conexión Básica

**Tiempo estimado:** 2 horas  
**Archivos a crear/modificar:** 3

#### 1.1 Crear `src/lib/supabase.ts`

```typescript
// src/lib/supabase.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let configError: string | null = null;

/**
 * Verifica si Supabase está configurado
 */
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key && url !== 'yourproject.supabase.co');
}

/**
 * Obtiene la URL de Supabase configurada
 */
export function getSupabaseUrl(): string | null {
  return import.meta.env.VITE_SUPABASE_URL || null;
}

/**
 * Obtiene el cliente Supabase (singleton)
 */
export function getSupabase(): SupabaseClient | null {
  if (configError) {
    console.error('Supabase config error:', configError);
    return null;
  }

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    configError = 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set';
    return null;
  }

  if (url === 'yourproject.supabase.co') {
    configError = 'Please configure real Supabase credentials';
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      configError = err instanceof Error ? err.message : 'Failed to create client';
      return null;
    }
  }

  return supabaseInstance;
}

/**
 * Prueba la conexión a Supabase
 */
export async function testConnection(): Promise<{
  success: boolean;
  error?: string;
  version?: string;
}> {
  const supabase = getSupabase();
  
  if (!supabase) {
    return { 
      success: false, 
      error: configError || 'Supabase not configured' 
    };
  }

  try {
    const { data, error } = await supabase.from('ingredients').select('count');
    
    if (error) {
      if (error.code === '42P01') {
        return { success: true, version: 'connected (schema missing)' };
      }
      return { success: false, error: error.message };
    }
    
    return { success: true, version: 'connected' };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Connection test failed' 
    };
  }
}

/**
 * Resetea el cliente (útil para re-configuración)
 */
export function resetSupabaseClient(): void {
  supabaseInstance = null;
  configError = null;
}
```

---

### FASE 2: Schema PostgreSQL en Supabase

**Tiempo estimado:** 1 hora  
**Ubicación:** Supabase SQL Editor

#### SQL Schema Completo

```sql
-- SCHEMA PARA VADEMECUM AI - SUPABASE
-- Ejecutar en: Supabase Dashboard > SQL Editor

-- TABLA: ingredients
CREATE TABLE IF NOT EXISTS public.ingredients (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    sinonimos TEXT[] DEFAULT '{}',
    categoria TEXT NOT NULL,
    familia TEXT,
    sistemas TEXT[] DEFAULT '{}',
    indicaciones TEXT[] DEFAULT '{}',
    evidencia TEXT DEFAULT 'C' CHECK (evidencia IN ('A', 'B', 'C', 'D')),
    propiedades TEXT[] DEFAULT '{}',
    seguridad JSONB DEFAULT '{}',
    interacciones TEXT[] DEFAULT '{}',
    fuentes TEXT[] DEFAULT '{}',
    lamport INTEGER DEFAULT 0,
    device_id TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tombstone INTEGER DEFAULT 0 CHECK (tombstone IN (0, 1))
);

-- TABLA: synergies
CREATE TABLE IF NOT EXISTS public.synergies (
    id TEXT PRIMARY KEY,
    ingrediente_a TEXT NOT NULL,
    ingrediente_b TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('sinergia', 'complemento', 'interaccion', 'antagonismo')),
    nivel TEXT DEFAULT 'medio' CHECK (nivel IN ('bajo', 'medio', 'alto', 'critico')),
    mecanismo TEXT,
    evidencia TEXT DEFAULT 'C' CHECK (evidencia IN ('A', 'B', 'C', 'D')),
    descripcion TEXT,
    fuentes TEXT[] DEFAULT '{}',
    lamport INTEGER DEFAULT 0,
    device_id TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    tombstone INTEGER DEFAULT 0 CHECK (tombstone IN (0, 1))
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_ingredients_categoria ON public.ingredients(categoria);
CREATE INDEX IF NOT EXISTS idx_synergies_ingrediente_a ON public.synergies(ingrediente_a);

-- ROW LEVEL SECURITY
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synergies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read ingredients" ON public.ingredients FOR SELECT USING (true);
CREATE POLICY "Public can insert ingredients" ON public.ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update ingredients" ON public.ingredients FOR UPDATE USING (true);
CREATE POLICY "Public can delete ingredients" ON public.ingredients FOR DELETE USING (true);

CREATE POLICY "Public can read synergies" ON public.synergies FOR SELECT USING (true);
CREATE POLICY "Public can insert synergies" ON public.synergies FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update synergies" ON public.synergies FOR UPDATE USING (true);
CREATE POLICY "Public can delete synergies" ON public.synergies FOR DELETE USING (true);
```

---

### FASE 3: SyncService Completo

**Tiempo estimado:** 4 horas  
**Archivos a modificar:** 1

#### Método syncOp a implementar en `src/core/sync/SyncService.ts`

```typescript
// AGREGAR a SyncService.ts

private async syncToSupabase(op: DbOutboxOp): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('Supabase not configured, skipping sync');
    return;
  }

  const endpoint = op.table;
  const payload = op.payload as Record<string, unknown>;

  try {
    switch (op.type) {
      case 'insert':
      case 'update':
        const { error: upsertError } = await supabase
          .from(endpoint)
          .upsert(payload, { onConflict: 'id' });
        if (upsertError) throw upsertError;
        break;
        
      case 'delete':
        const { error: deleteError } = await supabase
          .from(endpoint)
          .update({ tombstone: 1 })
          .eq('id', op.recordId);
        if (deleteError) throw deleteError;
        break;
    }
  } catch (error) {
    console.error('Supabase sync error:', error);
    throw error;
  }
}
```

---

### FASE 4: UI de Configuración Funcional

**Tiempo estimado:** 3 horas  
**Archivos a modificar:** 1 (`src/pages/SettingsPage.tsx`)

El tab de sync debe mostrar:
- Estado de conexión (Conectado/Desconectado)
- Última sincronización
- Operaciones pendientes
- Botón "Sincronizar ahora"
- Indicador de conexión online/offline

---

## 3. Estimación de Tiempo Total

| Fase | Tiempo | Acumulado |
|------|--------|-----------|
| FASE 1: Cliente Supabase | 2h | 2h |
| FASE 2: Schema PostgreSQL | 1h | 3h |
| FASE 3: SyncService completo | 4h | 7h |
| FASE 4: UI de configuración | 3h | 10h |
| FASE 5: Tests y verificación | 2h | 12h |
| **TOTAL** | **12h** | - |

---

## 4. Archivos a Crear/Modificar

### Crear
```
src/lib/supabase.ts           # Cliente Supabase
src/types/supabase.ts        # Tipos de sync
```

### Modificar
```
src/core/sync/SyncService.ts  # Implementación completa
src/pages/SettingsPage.tsx    # UI de sync
.env.example                  # Agregar vars de Supabase
```

---

## 5. Dependencias Adicionales

No se requieren dependencias adicionales. Todo lo necesario ya está instalado:
- `@supabase/supabase-js` ✅
- `dexie` ✅
- `vitest` ✅

---

## 6. Checklist de Implementación

### Antes de empezar
- [ ] Crear cuenta en Supabase
- [ ] Crear nuevo proyecto
- [ ] Copiar Project URL y anon/public key
- [ ] Crear archivo `.env` con credenciales

### Durante implementación
- [ ] FASE 1: Crear `src/lib/supabase.ts`
- [ ] FASE 2: Ejecutar SQL en Supabase SQL Editor
- [ ] FASE 3: Actualizar `SyncService.ts`
- [ ] FASE 4: Implementar UI en SettingsPage

### Después de implementar
- [ ] Probar en múltiples dispositivos
- [ ] Verificar sync bidireccional
- [ ] Documentar credenciales necesarias
- [ ] Actualizar README con instrucciones
