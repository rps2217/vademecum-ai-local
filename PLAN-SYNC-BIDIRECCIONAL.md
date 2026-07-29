# 📋 PLAN COMPLETO - Sync Bidireccional Offline-First

> **Objetivo:** Conectar la aplicación con Supabase de manera infalible y bidireccional
> **Manteniendo:** Funcionalidad 100% offline
> **Versión:** v2.3.0
> **Fecha:** Julio 2026

---

## 0. Estado Actual

### 0.1 Schema Local (Dexie)

```typescript
// Tablas locales
- products (sku, nombreComercial, principiosActivos, ...)
- ingredients (id, nombre, categoria, sistemas, indicaciones, ...)
- synergies (id, ingredienteA, ingredienteB, tipo, ...)
- protocols (id, nombre, objetivo, ingredientes, ...)
- outbox (operaciones pendientes de sync)
- snapshots (backups locales)
```

### 0.2 Schema Supabase (Remoto)

```sql
-- Tablas remotas
products_v2 (
  id UUID PRIMARY KEY,
  sku TEXT UNIQUE,
  nombre_comercial TEXT,
  principios_activos JSONB,
  -- 30+ campos
  -- vectors vector(384)  ← Embeddings
)

extended_ingredients (
  id UUID PRIMARY KEY,
  ingredient_key TEXT UNIQUE,
  name TEXT,
  category TEXT,
  -- 18 campos
)

protocols (
  id UUID PRIMARY KEY,
  name TEXT,
  ingredients JSONB,
  -- 26 campos
)

ingredient_relationships (VACIA)
```

### 0.3 Problemas Identificados

| Problema | Impacto |
|----------|---------|
| Nombres de tablas diferentes | No hay correspondencia |
| IDs diferentes (UUID vs strings) | No se pueden mapear |
| Campos de sync faltantes en Supabase | No hay tracking de cambios |
| ingredient_relationships vacia | Sin datos de sinergias |
| No hay adaptadores de conversion | No se pueden sincronizar |

---

## 1. Arquitectura Objetivo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Vademecum AI App                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    SyncManager (Nuevo)                                 │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐             │  │
│  │  │ SyncQueue   │  │ ConflictResolver│  │ NetworkMonitor │             │  │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘             │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  ┌─────────────────────────────────┴─────────────────────────────────┐   │
│  │                         DataLayer (Adaptado)                         │   │
│  │  ┌─────────────────┐          ┌─────────────────┐                  │   │
│  │  │ LocalDataSource │◄────────►│ RemoteDataSource│                  │   │
│  │  │ (Dexie)         │          │ (Supabase)      │                  │   │
│  │  └─────────────────┘          └─────────────────┘                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────┴─────────────────────────────────┐   │
│  │                    React UI / Componentes                            │   │
│  │  KnowledgePage | SearchPage | ProtocolsPage | SettingsPage           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Supabase Cloud                                      │
│  products_v2 | extended_ingredients | protocols | ingredient_relationships  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Plan de Implementación

### FASE 1: Adaptadores de Datos (4 horas)

#### 2.1 Crear `src/data/adapters/`

```
src/data/adapters/
├── types.ts              # Tipos unificados
├── IngredientAdapter.ts   # extended_ingredients ↔ ingredients
├── ProductAdapter.ts      # products_v2 ↔ products
├── SynergyAdapter.ts     # relationships ↔ synergies
└── ProtocolAdapter.ts    # protocols ↔ protocols
```

#### 2.2 Tipos Unificados

```typescript
// src/data/adapters/types.ts

export interface UnifiedIngredient {
  id: string;
  localId: string;          // ID local (Dexie)
  remoteId: string;         // ID remoto (Supabase UUID)
  syncStatus: SyncStatus;
  
  // Datos
  key: string;              // ingredient_key
  name: string;
  scientificName?: string;
  category: IngredientCategory;
  origin?: {
    type: string;
    description: string;
  };
  description?: string;
  mechanism?: string;
  indications: string[];
  contraindications: string[];
  interactions: string[];
  dosage?: string;
  synonyms: string[];
  
  // Metadata
  lamport: number;
  deviceId: string;
  updatedAt: number;
  createdAt: number;
  tombstone: 0 | 1;
}

export type SyncStatus = 'synced' | 'pending_upload' | 'pending_download' | 'conflict';

export interface SyncableRecord {
  localId: string;
  remoteId: string | null;
  syncStatus: SyncStatus;
  lamport: number;
  deviceId: string;
  updatedAt: number;
  tombstone: 0 | 1;
}
```

#### 2.3 IngredientAdapter

```typescript
// src/data/adapters/IngredientAdapter.ts

import type { DbIngredient } from '@/db/schema';
import type { UnifiedIngredient } from './types';

export class IngredientAdapter {
  
  /**
   * Convierte formato local (Dexie) a formato remoto (Supabase)
   */
  static toRemote(local: DbIngredient): Record<string, unknown> {
    return {
      id: local.id,  // Mantener mismo ID para compatibilidad
      ingredient_key: local.id,
      name: local.nombre,
      scientific_name: local.sinonimos.find(s => s.includes(' ')) || null,
      category: local.categoria,
      origin_type: 'medicinal',
      origin_description: null,
      description: local.propiedades[0] || null,
      mechanism: local.propiedades.find(p => p.includes('Mecanismo')) || null,
      indications: local.indicaciones,
      contraindications: local.seguridad 
        ? Object.entries(local.seguridad)
            .filter(([, val]) => val === 'evitar' || val === 'contraindicado')
            .map(([key]) => key)
        : [],
      interactions: local.interacciones,
      dosage: null,
      side_effects: null,
      synonyms: local.sinonimos,
      warnings: local.propiedades.filter(p => p.includes('Advertencia')),
      created_at: new Date(local.createdAt).toISOString(),
      updated_at: new Date(local.updatedAt).toISOString(),
    };
  }

  /**
   * Convierte formato remoto (Supabase) a formato local (Dexie)
   */
  static toLocal(remote: Record<string, unknown>): Partial<DbIngredient> {
    return {
      id: remote.ingredient_key as string || remote.id as string,
      nombre: remote.name as string,
      sinonimos: (remote.synonyms as string[]) || [],
      categoria: remote.category as DbIngredient['categoria'],
      sistemas: [],  // Supabase no tiene este campo
      indicaciones: (remote.indications as string[]) || [],
      evidencia: 'C',  // Valor por defecto
      propiedades: [
        remote.description as string,
        remote.mechanism as string,
      ].filter(Boolean) as string[],
      seguridad: this.extractSafety(remote),
      interacciones: (remote.interactions as string[]) || [],
      fuentes: [],
      updatedAt: new Date(remote.updated_at as string).getTime(),
      createdAt: new Date(remote.created_at as string).getTime(),
    };
  }

  private static extractSafety(remote: Record<string, unknown>): DbIngredient['seguridad'] {
    const contraindications = (remote.contraindications as string[]) || [];
    return {
      embarazo: contraindications.some(c => c.toLowerCase().includes('embarazo')) 
        ? 'evitar' : undefined,
      lactancia: contraindications.some(c => c.toLowerCase().includes('lactancia')) 
        ? 'evitar' : undefined,
      pediatria: contraindications.some(c => c.toLowerCase().includes('pedia')) 
        ? 'evitar' : undefined,
    };
  }
}
```

---

### FASE 2: SyncManager (6 horas)

#### 2.1 Crear `src/data/sync/SyncManager.ts`

```typescript
// src/data/sync/SyncManager.ts

import { db } from '@/db';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { generateId, now, getDeviceId } from '@/db/schema';
import type { DbIngredient, DbSynergy, DbProtocol } from '@/db/schema';

export type SyncDirection = 'upload' | 'download' | 'bidirectional';
export type SyncState = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncProgress {
  state: SyncState;
  direction: SyncDirection;
  total: number;
  completed: number;
  errors: string[];
  lastSyncAt: number | null;
}

export interface ConflictResolution {
  recordId: string;
  table: string;
  localVersion: unknown;
  remoteVersion: unknown;
  resolution: 'local' | 'remote' | 'merge' | 'manual';
}

export class SyncManager {
  private state: SyncState = 'idle';
  private progress: SyncProgress;
  private listeners: Set<(progress: SyncProgress) => void> = new Set();
  private networkListener: () => void;
  
  constructor() {
    this.progress = this.createInitialProgress();
    
    // Escuchar cambios de red
    this.networkListener = () => {
      if (navigator.onLine) {
        this.triggerSync();
      } else {
        this.setState('offline');
      }
    };
    
    window.addEventListener('online', this.networkListener);
    window.addEventListener('offline', this.networkListener);
  }

  private createInitialProgress(): SyncProgress {
    return {
      state: 'idle',
      direction: 'bidirectional',
      total: 0,
      completed: 0,
      errors: [],
      lastSyncAt: null,
    };
  }

  // ============ LISTENERS ============

  subscribe(listener: (progress: SyncProgress) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.progress));
  }

  // ============ STATE MANAGEMENT ============

  private setState(state: SyncState) {
    this.progress.state = state;
    this.notify();
  }

  // ============ MAIN SYNC ============

  async sync(): Promise<SyncProgress> {
    // Verificar precondiciones
    if (!navigator.onLine) {
      this.setState('offline');
      return this.progress;
    }

    if (!isSupabaseConfigured()) {
      this.progress.errors.push('Supabase no configurado');
      this.setState('error');
      return this.progress;
    }

    try {
      this.setState('syncing');
      this.progress.errors = [];

      // 1. Upload: Local → Supabase
      await this.uploadAll();

      // 2. Download: Supabase → Local
      await this.downloadAll();

      // 3. Actualizar timestamp
      this.progress.lastSyncAt = now();
      this.progress.state = 'idle';

    } catch (error) {
      this.progress.errors.push(error instanceof Error ? error.message : 'Sync failed');
      this.setState('error');
    }

    this.notify();
    return this.progress;
  }

  /**
   * Dispara sync con debounce
   */
  triggerSync() {
    if (this.state === 'syncing') return;
    
    // Debounce: esperar 2 segundos
    setTimeout(() => this.sync(), 2000);
  }

  // ============ UPLOAD (Local → Remote) ============

  private async uploadAll() {
    const supabase = getSupabase();
    if (!supabase) return;

    // 1. Upload ingredients
    await this.uploadIngredients(supabase);
    
    // 2. Upload synergies  
    await this.uploadSynergies(supabase);
    
    // 3. Upload protocols
    await this.uploadProtocols(supabase);
  }

  private async uploadIngredients(supabase: ReturnType<typeof getSupabase>) {
    // Obtener todos los ingredientes locales
    const locals = await db.ingredients.toArray();
    this.progress.total += locals.length;

    for (const local of locals) {
      try {
        const remote = IngredientAdapter.toRemote(local);
        
        const { error } = await supabase
          .from('extended_ingredients')
          .upsert(remote, { onConflict: 'ingredient_key' });

        if (error) throw error;
        
        // Guardar mapping local → remote
        await this.saveMapping('ingredients', local.id, local.id);
        
        this.progress.completed++;
        this.notify();
      } catch (error) {
        this.progress.errors.push(`Ingredient ${local.id}: ${error}`);
      }
    }
  }

  private async uploadSynergies(supabase: ReturnType<typeof getSupabase>) {
    const locals = await db.synergies.toArray();
    this.progress.total += locals.length;

    for (const local of locals) {
      try {
        const remote = {
          id: local.id,
          ingrediente1: local.ingredienteA,
          ingrediente2: local.ingredienteB,
          tipo_relacion: local.tipo,
          intensidad: local.nivel,
          descripcion: local.descripcion || local.mecanismo,
          evidencia: local.evidencia,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('ingredient_relationships')
          .upsert(remote, { onConflict: 'id' });

        if (error) throw error;
        
        this.progress.completed++;
        this.notify();
      } catch (error) {
        this.progress.errors.push(`Synergy ${local.id}: ${error}`);
      }
    }
  }

  private async uploadProtocols(supabase: ReturnType<typeof getSupabase>) {
    const locals = await db.protocols.toArray();
    this.progress.total += locals.length;

    for (const local of locals) {
      try {
        const remote = {
          id: local.id,
          name: local.nombre,
          description: local.objetivo,
          category: 'general',
          objetivo_principal: local.objetivo,
          duracion_dias: local.duracionDias,
          dificultad: 'media',
          ingredients: local.ingredientes.map(i => ({
            nombre: i.id,
            dosis: i.cantidad,
            momento: i.momento,
          })),
          contraindicaciones: local.advertencias,
          evidencia_level: 'C',
          is_active: true,
          is_featured: false,
          created_at: new Date(local.createdAt).toISOString(),
          updated_at: new Date(local.updatedAt).toISOString(),
        };

        const { error } = await supabase
          .from('protocols')
          .upsert(remote, { onConflict: 'id' });

        if (error) throw error;
        
        this.progress.completed++;
        this.notify();
      } catch (error) {
        this.progress.errors.push(`Protocol ${local.id}: ${error}`);
      }
    }
  }

  // ============ DOWNLOAD (Remote → Local) ============

  private async downloadAll() {
    const supabase = getSupabase();
    if (!supabase) return;

    // 1. Download ingredients
    await this.downloadIngredients(supabase);
    
    // 2. Download synergies
    await this.downloadSynergies(supabase);
    
    // 3. Download protocols
    await this.downloadProtocols(supabase);
  }

  private async downloadIngredients(supabase: ReturnType<typeof getSupabase>) {
    const lastSync = await this.getLastSyncTime('ingredients');
    
    const { data, error } = await supabase
      .from('extended_ingredients')
      .select('*')
      .gte('updated_at', lastSync);

    if (error) {
      this.progress.errors.push(`Download ingredients: ${error.message}`);
      return;
    }

    if (!data) return;

    for (const remote of data) {
      // Verificar si existe localmente
      const localId = await this.getLocalId('ingredients', remote.ingredient_key || remote.id);
      
      if (localId) {
        // Merge: actualizar solo si remoto es más nuevo
        const local = await db.ingredients.get(localId);
        const remoteTime = new Date(remote.updated_at).getTime();
        
        if (!local || remoteTime > local.updatedAt) {
          const merged = IngredientAdapter.toLocal(remote);
          await db.ingredients.put({
            ...local!,
            ...merged,
            lamport: (merged.lamport || 0) + 1,
            updatedAt: now(),
          });
        }
      } else {
        // Insertar nuevo
        const local = IngredientAdapter.toLocal(remote);
        await db.ingredients.put({
          ...local,
          id: remote.ingredient_key || remote.id,
          lamport: 1,
          deviceId: getDeviceId(),
          createdAt: now(),
          updatedAt: now(),
          tombstone: 0,
        } as DbIngredient);
        
        await this.saveMapping('ingredients', remote.id, remote.id);
      }
    }
  }

  private async downloadSynergies(supabase: ReturnType<typeof getSupabase>) {
    const lastSync = await this.getLastSyncTime('synergies');
    
    const { data, error } = await supabase
      .from('ingredient_relationships')
      .select('*')
      .gte('updated_at', lastSync);

    if (error) {
      this.progress.errors.push(`Download synergies: ${error.message}`);
      return;
    }

    if (!data) return;

    for (const remote of data) {
      const synergy: DbSynergy = {
        id: remote.id,
        ingredienteA: remote.ingrediente1,
        ingredienteB: remote.ingrediente2,
        tipo: remote.tipo_relacion as DbSynergy['tipo'],
        nivel: (remote.intensidad || 'medio') as DbSynergy['nivel'],
        mecanismo: remote.descripcion,
        evidencia: (remote.evidencia || 'C') as DbSynergy['evidencia'],
        fuentes: [],
        lamport: 1,
        deviceId: 'supabase',
        updatedAt: new Date(remote.updated_at).getTime(),
        tombstone: 0,
      };

      await db.synergies.put(synergy);
    }
  }

  private async downloadProtocols(supabase: ReturnType<typeof getSupabase>) {
    const lastSync = await this.getLastSyncTime('protocols');
    
    const { data, error } = await supabase
      .from('protocols')
      .select('*')
      .eq('is_active', true)
      .gte('updated_at', lastSync);

    if (error) {
      this.progress.errors.push(`Download protocols: ${error.message}`);
      return;
    }

    if (!data) return;

    for (const remote of data) {
      const protocol: DbProtocol = {
        id: remote.id,
        nombre: remote.name,
        objetivo: remote.objetivo_principal || remote.description,
        ingredientes: (remote.ingredients || []).map((i: any) => ({
          id: i.nombre,
          cantidad: i.dosis,
          momento: i.momento,
        })),
        duracionDias: remote.duracion_dias,
        advertencias: (remote.contraindicaciones || []) as string[],
        lamport: 1,
        deviceId: 'supabase',
        createdAt: new Date(remote.created_at).getTime(),
        updatedAt: new Date(remote.updated_at).getTime(),
        tombstone: 0,
      };

      await db.protocols.put(protocol);
    }
  }

  // ============ MAPPINGS ============

  private async saveMapping(table: string, localId: string, remoteId: string) {
    await db.syncMeta.put({
      key: `mapping_${table}_${localId}`,
      value: { remoteId },
      updatedAt: now(),
    });
  }

  private async getLocalId(table: string, remoteId: string): Promise<string | null> {
    const mapping = await db.syncMeta.get(`mapping_${table}_${remoteId}`);
    return (mapping?.value as { remoteId: string })?.remoteId || null;
  }

  private async getLastSyncTime(table: string): Promise<string> {
    const meta = await db.syncMeta.get(`lastSync_${table}`);
    return (meta?.value as string) || '1970-01-01T00:00:00Z';
  }

  // ============ CLEANUP ============

  destroy() {
    window.removeEventListener('online', this.networkListener);
    window.removeEventListener('offline', this.networkListener);
    this.listeners.clear();
  }
}

// Singleton
export const syncManager = new SyncManager();
```

---

### FASE 3: Hooks de Datos (3 horas)

#### 3.1 Crear `src/hooks/useSync.ts`

```typescript
// src/hooks/useSync.ts

import { useState, useEffect, useCallback } from 'react';
import { syncManager, type SyncProgress, type SyncState } from '@/data/sync/SyncManager';
import { isSupabaseConfigured } from '@/lib/supabase';

export interface UseSyncResult {
  isOnline: boolean;
  isConfigured: boolean;
  syncState: SyncState;
  progress: SyncProgress;
  sync: () => Promise<SyncProgress>;
  lastSyncAt: number | null;
}

export function useSync(): UseSyncResult {
  const [progress, setProgress] = useState<SyncProgress>(syncManager['progress']);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    // Suscribirse a cambios
    const unsubscribe = syncManager.subscribe(setProgress);
    
    // Listener de red
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sync = useCallback(async () => {
    return syncManager.sync();
  }, []);

  return {
    isOnline,
    isConfigured,
    syncState: progress.state,
    progress,
    sync,
    lastSyncAt: progress.lastSyncAt,
  };
}
```

#### 3.2 Crear `src/hooks/useIngredients.ts`

```typescript
// src/hooks/useIngredients.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/db';
import { syncManager } from '@/data/sync/SyncManager';
import type { DbIngredient, IngredientCategory, BodySystem } from '@/db/schema';

export interface UseIngredientsOptions {
  category?: IngredientCategory;
  system?: BodySystem;
  query?: string;
  limit?: number;
}

export interface UseIngredientsResult {
  ingredients: DbIngredient[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useIngredients(options: UseIngredientsOptions = {}): UseIngredientsResult {
  const { category, system, query, limit = 100 } = options;
  const [ingredients, setIngredients] = useState<DbIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadIngredients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let collection = db.ingredients.toCollection();

      // Aplicar filtros
      if (category) {
        collection = db.ingredients.where('categoria').equals(category);
      }

      const results = await collection.toArray();

      // Filtrado adicional en memoria
      let filtered = results;

      if (system) {
        filtered = filtered.filter(i => i.sistemas.includes(system));
      }

      if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(i =>
          i.nombre.toLowerCase().includes(q) ||
          i.sinonimos.some(s => s.toLowerCase().includes(q)) ||
          i.indicaciones.some(ind => ind.toLowerCase().includes(q))
        );
      }

      setIngredients(filtered.slice(0, limit));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error loading ingredients'));
    } finally {
      setIsLoading(false);
    }
  }, [category, system, query, limit]);

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  // Recargar después de sync
  useEffect(() => {
    const unsubscribe = syncManager.subscribe((progress) => {
      if (progress.state === 'idle' && progress.completed > 0) {
        loadIngredients();
      }
    });

    return unsubscribe;
  }, [loadIngredients]);

  return {
    ingredients,
    isLoading,
    error,
    refetch: loadIngredients,
  };
}
```

---

### FASE 4: Actualizar Componentes UI (4 horas)

#### 4.1 SyncStatusBar

```typescript
// src/components/sync/SyncStatusBar.tsx

import { useSync } from '@/hooks/useSync';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Cloud, CloudOff, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SyncStatusBar() {
  const { isOnline, isConfigured, syncState, progress, sync } = useSync();

  if (!isConfigured) {
    return (
      <div className="flex items-center gap-2 text-amber-600">
        <CloudOff className="w-4 h-4" />
        <span className="text-sm">Sync no configurado</span>
      </div>
    );
  }

  const isSyncing = syncState === 'syncing';

  return (
    <div className="flex items-center gap-3">
      {/* Indicador de estado */}
      <Badge variant={isOnline ? 'success' : 'danger'}>
        {isOnline ? (
          <>
            <Cloud className="w-3 h-3 mr-1" />
            Online
          </>
        ) : (
          <>
            <CloudOff className="w-3 h-3 mr-1" />
            Offline
          </>
        )}
      </Badge>

      {/* Progreso */}
      {isSyncing && (
        <span className="text-sm text-muted-foreground">
          Sincronizando... {progress.completed}/{progress.total}
        </span>
      )}

      {/* Botón de sync */}
      <Button
        size="sm"
        variant="ghost"
        onClick={sync}
        disabled={isSyncing || !isOnline}
        className="gap-2"
      >
        {isSyncing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
        )}
        {isSyncing ? 'Sync' : 'Sync'}
      </Button>
    </div>
  );
}
```

#### 4.2 Actualizar SettingsPage Sync Tab

```typescript
// Agregar en SettingsPage.tsx - SyncTab

import { useSync } from '@/hooks/useSync';

function SyncTab() {
  const { isOnline, isConfigured, syncState, progress, sync, lastSyncAt } = useSync();
  const [isSyncing, setIsSyncing] = useState(false);

  async function handleSync() {
    setIsSyncing(true);
    await sync();
    setIsSyncing(false);
  }

  return (
    <div className="space-y-6">
      {/* Estado de conexión */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
            <div>
              <p className="font-medium">
                {isConfigured ? 'Supabase configurado' : 'Supabase no configurado'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isOnline ? 'Conexión activa' : 'Sin conexión'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-2xl font-bold">{progress.completed}</p>
          <p className="text-sm text-muted-foreground">Registros sync</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium">
            {lastSyncAt
              ? new Date(lastSyncAt).toLocaleString('es-ES')
              : 'Nunca'}
          </p>
          <p className="text-sm text-muted-foreground">Última sync</p>
        </Card>
      </div>

      {/* Botón principal */}
      <Button
        onClick={handleSync}
        disabled={isSyncing || !isOnline || !isConfigured}
        className="w-full"
      >
        {isSyncing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sincronizando...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Sincronizar ahora
          </>
        )}
      </Button>

      {/* Errores */}
      {progress.errors.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <h4 className="font-medium text-red-800 mb-2">Errores de sincronización</h4>
          <ul className="text-sm text-red-600 space-y-1">
            {progress.errors.slice(0, 5).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
```

---

### FASE 5: Poblar ingredient_relationships (2 horas)

#### 5.1 Script de migración

```typescript
// src/scripts/populateRelationships.ts

/**
 * Script para poblar ingredient_relationships desde local DB
 * Ejecutar una sola vez o periódicamente
 */

import { db } from '@/db';
import { getSupabase } from '@/lib/supabase';

export async function populateRelationships() {
  const supabase = getSupabase();
  if (!supabase) {
    console.error('Supabase no configurado');
    return;
  }

  // Obtener todas las sinergias locales
  const synergies = await db.synergies.toArray();

  console.log(`Poblando ${synergies.length} relaciones...`);

  for (const syn of synergies) {
    const record = {
      id: syn.id,
      ingrediente1: syn.ingredienteA,
      ingrediente2: syn.ingredienteB,
      tipo_relacion: syn.tipo,
      intensidad: syn.nivel,
      descripcion: syn.descripcion || syn.mecanismo,
      evidencia: syn.evidencia,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('ingredient_relationships')
      .upsert(record, { onConflict: 'id' });

    if (error) {
      console.error(`Error upserting ${syn.id}:`, error);
    }
  }

  console.log('Done!');
}

// Ejecutar si se llama directamente
if (typeof window === 'undefined') {
  // Node.js environment
  populateRelationships().catch(console.error);
}
```

---

## 3. Modificaciones al Schema Local

### 3.1 Agregar tabla de mappings

```typescript
// src/db/schema.ts - AGREGAR

export interface DbSyncMapping {
  table: string;
  localId: string;
  remoteId: string;
  updatedAt: number;
}

// En la clase VademecumDB:
mappings!: EntityTable<DbSyncMapping, 'id'>;

// En stores:
mappings: 'table, localId',
```

### 3.2 Migrar datos existentes

```typescript
// src/db/migrations.ts

import { db } from './schema';

export async function migrateToSync() {
  // Agregar campos faltantes a ingredientes
  const ingredients = await db.ingredients.toArray();
  
  for (const ing of ingredients) {
    if (!ing.lamport) {
      await db.ingredients.update(ing.id, {
        lamport: 1,
        deviceId: 'initial',
        createdAt: Date.now(),
      });
    }
  }
  
  console.log('Migración completada');
}
```

---

## 4. Variables de Entorno

### 4.1 Actualizar .env.example

```bash
# Supabase Configuration
VITE_SUPABASE_URL="https://pspxqzwxulgmzarlqwtt.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcHhxend4dWxnbXphcmxxd3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NzQ1ODQsImV4cCI6MjA5MjE1MDU4NH0.5P_XIDqdiuxf4IP8Jxah81ZJTiln8MnBkX9_sZgubMU"
```

---

## 5. Estimación de Tiempo

| Fase | Descripción | Tiempo |
|------|-------------|--------|
| FASE 1 | Adaptadores de datos | 4h |
| FASE 2 | SyncManager completo | 6h |
| FASE 3 | Hooks de datos | 3h |
| FASE 4 | UI components | 4h |
| FASE 5 | Poblar relationships | 2h |
| **TOTAL** | | **19h** |

---

## 6. Checklist de Implementación

### Antes de empezar
- [ ] Actualizar `.env` con credenciales de Supabase
- [ ] Verificar conexión a Supabase

### FASE 1: Adaptadores
- [ ] Crear `src/data/adapters/types.ts`
- [ ] Crear `src/data/adapters/IngredientAdapter.ts`
- [ ] Crear `src/data/adapters/SynergyAdapter.ts`
- [ ] Crear `src/data/adapters/ProtocolAdapter.ts`

### FASE 2: SyncManager
- [ ] Crear `src/data/sync/SyncManager.ts`
- [ ] Implementar upload/download
- [ ] Implementar mapeos local ↔ remote
- [ ] Implementar listeners de red

### FASE 3: Hooks
- [ ] Crear `src/hooks/useSync.ts`
- [ ] Crear `src/hooks/useIngredients.ts`
- [ ] Crear `src/hooks/useSynergies.ts`
- [ ] Crear `src/hooks/useProtocols.ts`

### FASE 4: UI
- [ ] Crear `src/components/sync/SyncStatusBar.tsx`
- [ ] Actualizar `SettingsPage.tsx` Sync tab
- [ ] Integrar SyncStatusBar en layout

### FASE 5: Datos
- [ ] Ejecutar script populateRelationships
- [ ] Verificar datos en Supabase
- [ ] Testing de sync bidireccional

### Verificación
- [ ] Probar offline → online
- [ ] Probar cambios locales sync a cloud
- [ ] Probar cambios remotos sync a local
- [ ] Verificar conflictos se manejan

---

## 7. Archivos a Crear

```
src/
├── data/
│   ├── adapters/
│   │   ├── types.ts
│   │   ├── IngredientAdapter.ts
│   │   ├── SynergyAdapter.ts
│   │   └── ProtocolAdapter.ts
│   └── sync/
│       └── SyncManager.ts
├── hooks/
│   ├── useSync.ts
│   ├── useIngredients.ts
│   ├── useSynergies.ts
│   └── useProtocols.ts
└── components/
    └── sync/
        └── SyncStatusBar.tsx
```

---

## 8. Flujo de Datos Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO ACCIÓN                            │
│  (Crear/Editar/Eliminar ingrediente, synergy, protocol)          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATOS LOCAL (Dexie)                         │
│  - Guardar cambios localmente inmediatamente                     │
│  - Marcar como 'pending_upload'                                  │
│  - UI actualiza instantáneamente                                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SYNC TRIGGER                               │
│  - Online: sync automático (debounce 2s)                        │
│  - Botón manual: sync inmediato                                  │
│  - Offline: cola para después                                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SYNC MANAGER                                 │
│  1. Upload cambios pendientes                                    │
│  2. Download cambios remotos                                     │
│  3. Resolver conflictos (Lamport clock)                         │
│  4. Guardar mapeos                                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Cloud)                              │
│  - extended_ingredients                                          │
│  - ingredient_relationships                                      │
│  - protocols                                                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   OTRO DISPOSITIVO                               │
│  - Recibe cambios                                               │
│  - Merge con datos locales                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Manejo de Conflictos

### 9.1 Estrategia: Last-Write-Wins con Lamport Clock

```typescript
// En SyncManager.downloadAll()

if (local && remote) {
  // Comparar Lamport clocks
  if (remote.lamport > local.lamport) {
    // Remoto gana: actualizar local
    await db.ingredients.put(remoteVersion);
  } else if (remote.lamport < local.lamport) {
    // Local gana: no hacer nada (ya está actualizado)
    // O forzar upload
    await uploadRecord(local);
  } else {
    // Mismo Lamport: usar timestamp
    if (remote.updatedAt > local.updatedAt) {
      await db.ingredients.put(remoteVersion);
    }
    // Si no, local gana
  }
}
```

### 9.2 Conflictos Graves

Si hay un conflicto real (mismo ID, datos diferentes, mismo Lamport):

1. Guardar ambas versiones
2. Notificar al usuario
3. Permitir selección manual

```typescript
// Guardar en cola de conflictos
await db.outbox.put({
  id: generateId(),
  type: 'conflict',
  table: 'ingredients',
  recordId: id,
  payload: { local: localVersion, remote: remoteVersion },
  status: 'pending',
  createdAt: now(),
});
```

---

## 10. Testing

### 10.1 Tests de Sync

```typescript
// src/__tests__/sync.test.ts

describe('SyncManager', () => {
  it('should upload local changes to remote', async () => {
    // Given: un ingrediente local con cambios
    const localIng = await createTestIngredient();
    
    // When: se dispara sync
    await syncManager.sync();
    
    // Then: el ingrediente está en Supabase
    const remote = await supabase
      .from('extended_ingredients')
      .select('*')
      .eq('ingredient_key', localIng.id)
      .single();
    
    expect(remote.data.name).toBe(localIng.nombre);
  });

  it('should download remote changes to local', async () => {
    // Given: un ingrediente en Supabase
    await createRemoteIngredient();
    
    // When: se dispara sync
    await syncManager.sync();
    
    // Then: el ingrediente está localmente
    const local = await db.ingredients.get('remote-test-id');
    expect(local).toBeDefined();
  });

  it('should handle offline mode gracefully', async () => {
    // Given: offline
    setOffline();
    
    // When: se intenta sync
    const result = await syncManager.sync();
    
    // Then: estado es offline
    expect(result.state).toBe('offline');
  });
});
```

---

## 11. Rollback Plan

Si algo sale mal:

1. **Deshabilitar sync** temporalmente
2. **Backup local** de IndexedDB
3. **Restaurar datos** desde Supabase si es necesario
4. **Revisar logs** de errores

```typescript
// En caso de emergencia:
export async function emergencyRollback() {
  // 1. Deshabilitar sync
  syncManager.configure({ enabled: false });
  
  // 2. Limpiar datos locales
  await db.ingredients.clear();
  await db.synergies.clear();
  await db.protocols.clear();
  
  // 3. Descargar todo desde Supabase
  await syncManager.sync();
}
```
