/**
 * SyncManager
 * Gestiona la sincronización bidireccional entre Dexie (local) y Supabase (remoto)
 * 
 * Características:
 * - Offline-first: siempre funciona localmente
 * - Bidireccional: upload y download
 * - Conflict resolution con Lamport clock
 * - Mapeo de IDs entre local y remoto
 */

import { db } from '@/db';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { generateId, now, getDeviceId } from '@/db/schema';
import type { DbIngredient, DbSynergy, DbProtocol } from '@/db/schema';
import { IngredientAdapter } from '../adapters/IngredientAdapter';
import { SynergyAdapter } from '../adapters/SynergyAdapter';
import { ProtocolAdapter } from '../adapters/ProtocolAdapter';

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

export interface SyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number;
  syncOnStart: boolean;
}

const DEFAULT_CONFIG: SyncConfig = {
  enabled: false,
  autoSync: true,
  syncInterval: 30000, // 30 segundos
  syncOnStart: true,
};

export class SyncManager {
  private config: SyncConfig = { ...DEFAULT_CONFIG };
  private state: SyncState = 'idle';
  private progress: SyncProgress;
  private listeners: Set<(progress: SyncProgress) => void> = new Set();
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private networkListenerOnline: () => void;
  private networkListenerOffline: () => void;
  private initialized = false;

  constructor() {
    this.progress = this.createInitialProgress();
    
    // Listeners de red
    this.networkListenerOnline = () => {
      console.log('[SyncManager] Online - triggering sync');
      this.setState('idle');
      if (this.config.autoSync && this.config.enabled) {
        this.triggerSync();
      }
    };
    
    this.networkListenerOffline = () => {
      console.log('[SyncManager] Offline');
      this.setState('offline');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.networkListenerOnline);
      window.addEventListener('offline', this.networkListenerOffline);
      
      // TEMPORALMENTE DESHABILITADO hasta corregir sync
      // El usuario debe hacer sync manual desde Settings
      if (isSupabaseConfigured()) {
        this.config.enabled = true;
        // this.startAutoSync(); // DESHABILITADO
        this.initialized = true;
        console.log('[SyncManager] Habilitado para sync manual (auto-sync deshabilitado)');
      }
    }
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

  // ============ SUBSCRIBERS ============

  subscribe(listener: (progress: SyncProgress) => void): () => void {
    this.listeners.add(listener);
    // Notificar inmediatamente con estado actual
    listener(this.progress);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.progress));
  }

  // ============ CONFIG ============

  configure(config: Partial<SyncConfig>) {
    this.config = { ...this.config, ...config };
    
    if (this.config.enabled && this.config.autoSync) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
    
    console.log('[SyncManager] Config updated:', this.config);
  }

  // ============ AUTO SYNC ============

  private startAutoSync() {
    if (this.syncTimer) return;
    if (!isSupabaseConfigured()) {
      console.log('[SyncManager] Supabase not configured, skipping auto-sync');
      return;
    }

    this.syncTimer = setInterval(() => {
      if (this.canSync()) {
        this.sync().catch(console.error);
      }
    }, this.config.syncInterval);

    console.log('[SyncManager] Auto-sync started');

    // Sync inicial si está habilitado
    if (this.config.syncOnStart) {
      setTimeout(() => this.sync().catch(console.error), 2000);
    }
  }

  private stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('[SyncManager] Auto-sync stopped');
    }
  }

  private canSync(): boolean {
    return (
      navigator.onLine &&
      isSupabaseConfigured() &&
      this.config.enabled &&
      this.state !== 'syncing'
    );
  }

  // ============ STATE MANAGEMENT ============

  private setState(state: SyncState) {
    this.progress.state = state;
    this.notify();
  }

  // ============ MAIN SYNC ============

  /**
   * Ejecuta sincronización completa bidireccional
   */
  async sync(): Promise<SyncProgress> {
    // Verificar precondiciones
    if (!navigator.onLine) {
      this.setState('offline');
      this.progress.errors.push('Sin conexión a internet');
      return this.progress;
    }

    if (!isSupabaseConfigured()) {
      this.setState('error');
      this.progress.errors.push('Supabase no configurado');
      return this.progress;
    }

    if (this.state === 'syncing') {
      console.log('[SyncManager] Sync already in progress');
      return this.progress;
    }

    try {
      this.setState('syncing');
      this.progress.errors = [];
      this.progress.total = 0;
      this.progress.completed = 0;

      // 1. Upload: Local → Supabase
      console.log('[SyncManager] Starting upload...');
      await this.uploadAll();

      // 2. Download: Supabase → Local
      console.log('[SyncManager] Starting download...');
      await this.downloadAll();

      // 3. Actualizar timestamp de sync
      this.progress.lastSyncAt = now();
      await this.saveLastSyncTime(now());

      console.log('[SyncManager] Sync completed successfully');
      this.setState('idle');

    } catch (error) {
      console.error('[SyncManager] Sync error:', error);
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
    if (!this.canSync()) return;
    
    console.log('[SyncManager] Sync triggered');
    setTimeout(() => this.sync(), 1000);
  }

  // ============ UPLOAD (Local → Remote) ============

  private async uploadAll(): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('[SyncManager] Supabase not available for upload');
      return;
    }

    // Upload ingredients
    await this.uploadIngredients(supabase);
    
    // Upload synergies
    await this.uploadSynergies(supabase);
    
    // Upload protocols
    await this.uploadProtocols(supabase);
  }

  private async uploadIngredients(supabase: ReturnType<typeof getSupabase>): Promise<void> {
    if (!supabase) return;

    const locals = await db.ingredients.toArray();
    this.progress.total += locals.length;

    console.log(`[SyncManager] Uploading ${locals.length} ingredients...`);

    for (const local of locals) {
      try {
        const remote = IngredientAdapter.toRemote(local);
        
        // Verificar si ya existe para decidir upsert vs insert
        const { data: existing } = await supabase
          .from('extended_ingredients')
          .select('id')
          .eq('ingredient_key', local.id)
          .single();

        if (existing) {
          // Actualizar si existe
          const { error } = await supabase
            .from('extended_ingredients')
            .update(remote)
            .eq('ingredient_key', local.id);

          if (error) {
            console.error(`[SyncManager] Error updating ingredient ${local.id}:`, error);
            this.progress.errors.push(`Ingredient ${local.nombre}: ${error.message}`);
          }
        } else {
          // Insertar si no existe
          const { error } = await supabase
            .from('extended_ingredients')
            .insert(remote);

          if (error) {
            console.error(`[SyncManager] Error inserting ingredient ${local.id}:`, error);
            this.progress.errors.push(`Ingredient ${local.nombre}: ${error.message}`);
          }
        }

        // Guardar mapping
        await this.saveMapping('ingredients', local.id, local.id);
        this.progress.completed++;
        this.notify();
      } catch (error) {
        console.error(`[SyncManager] Exception uploading ingredient ${local.id}:`, error);
        this.progress.errors.push(`Ingredient ${local.id}: ${error}`);
      }
    }

    console.log(`[SyncManager] Finished uploading ingredients`);
  }

  private async uploadSynergies(supabase: ReturnType<typeof getSupabase>): Promise<void> {
    if (!supabase) return;

    const locals = await db.synergies.toArray();
    this.progress.total += locals.length;

    console.log(`[SyncManager] Uploading ${locals.length} synergies...`);

    for (const local of locals) {
      try {
        const remote = SynergyAdapter.toRemote(local);
        
        // Crear clave única para evitar duplicados
        const uniqueKey = `${local.ingredienteA}_${local.ingredienteB}_${local.tipo}`;
        
        // Verificar si ya existe
        const { data: existing } = await supabase
          .from('ingredient_relationships')
          .select('id')
          .eq('ingrediente1', local.ingredienteA)
          .eq('ingrediente2', local.ingredienteB)
          .eq('tipo_relacion', remote.tipo_relacion as string)
          .single();

        if (existing) {
          // Actualizar si existe
          const { error } = await supabase
            .from('ingredient_relationships')
            .update(remote)
            .eq('id', existing.id);

          if (error) {
            console.error(`[SyncManager] Error updating synergy ${local.id}:`, error);
            this.progress.errors.push(`Synergy: ${error.message}`);
          }
        } else {
          // Insertar si no existe
          const { error } = await supabase
            .from('ingredient_relationships')
            .insert(remote);

          if (error) {
            console.error(`[SyncManager] Error inserting synergy ${local.id}:`, error);
            this.progress.errors.push(`Synergy: ${error.message}`);
          }
        }

        this.progress.completed++;
        this.notify();
      } catch (error) {
        console.error(`[SyncManager] Exception uploading synergy ${local.id}:`, error);
      }
    }
  }

  private async uploadProtocols(supabase: ReturnType<typeof getSupabase>): Promise<void> {
    if (!supabase) return;

    const locals = await db.protocols.toArray();
    this.progress.total += locals.length;

    console.log(`[SyncManager] Uploading ${locals.length} protocols...`);

    for (const local of locals) {
      try {
        const remote = ProtocolAdapter.toRemote(local);
        
        // Verificar si ya existe por nombre
        const { data: existing } = await supabase
          .from('protocols')
          .select('id')
          .eq('name', local.nombre)
          .single();

        if (existing) {
          // Actualizar si existe
          const { error } = await supabase
            .from('protocols')
            .update(remote)
            .eq('id', existing.id);

          if (error) {
            console.error(`[SyncManager] Error updating protocol ${local.id}:`, error);
            this.progress.errors.push(`Protocol ${local.nombre}: ${error.message}`);
          }
        } else {
          // Insertar si no existe
          const { error } = await supabase
            .from('protocols')
            .insert(remote);

          if (error) {
            console.error(`[SyncManager] Error inserting protocol ${local.id}:`, error);
            this.progress.errors.push(`Protocol ${local.nombre}: ${error.message}`);
          }
        }

        this.progress.completed++;
        this.notify();
      } catch (error) {
        console.error(`[SyncManager] Exception uploading protocol ${local.id}:`, error);
      }
    }
  }

  // ============ DOWNLOAD (Remote → Local) ============

  private async downloadAll(): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('[SyncManager] Supabase not available for download');
      return;
    }

    // Download ingredients
    await this.downloadIngredients(supabase);
    
    // Download synergies
    await this.downloadSynergies(supabase);
    
    // Download protocols
    await this.downloadProtocols(supabase);
  }

  private async downloadIngredients(supabase: ReturnType<typeof getSupabase>): Promise<void> {
    if (!supabase) return;

    const lastSync = await this.getLastSyncTime();
    console.log(`[SyncManager] Downloading ingredients since ${lastSync}...`);

    const { data, error } = await supabase
      .from('extended_ingredients')
      .select('*')
      .gte('updated_at', lastSync);

    if (error) {
      console.error('[SyncManager] Error downloading ingredients:', error);
      this.progress.errors.push(`Download ingredients: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      console.log('[SyncManager] No new ingredients to download');
      return;
    }

    console.log(`[SyncManager] Downloading ${data.length} ingredients...`);
    this.progress.total += data.length;

    for (const remote of data) {
      try {
        const localId = remote.ingredient_key || remote.id;
        
        // Verificar si existe localmente
        const existing = await db.ingredients.get(localId);
        
        if (existing) {
          // Merge: actualizar solo si remoto es más nuevo (comparar timestamps)
          const remoteTime = new Date(remote.updated_at).getTime();
          if (remoteTime > existing.updatedAt) {
            const merged = IngredientAdapter.toLocal(remote);
            await db.ingredients.update(localId, {
              ...merged,
              lamport: (existing.lamport || 0) + 1,
              updatedAt: remoteTime,
            });
            console.log(`[SyncManager] Updated ingredient: ${localId}`);
          }
        } else {
          // Insertar nuevo
          const local = IngredientAdapter.toLocal(remote);
          const newIngredient: DbIngredient = {
            id: localId,
            nombre: local.nombre || remote.name,
            sinonimos: local.sinonimos || [],
            categoria: local.categoria || 'fitoterapia',
            sistemas: local.sistemas || [],
            indicaciones: local.indicaciones || [],
            evidencia: local.evidencia || 'C',
            propiedades: local.propiedades || [],
            seguridad: local.seguridad || {},
            interacciones: local.interacciones || [],
            fuentes: local.fuentes || [],
            lamport: 1,
            deviceId: 'supabase',
            createdAt: new Date(remote.created_at).getTime(),
            updatedAt: new Date(remote.updated_at).getTime(),
            tombstone: 0,
          };
          
          await db.ingredients.put(newIngredient);
          await this.saveMapping('ingredients', localId, remote.id);
          console.log(`[SyncManager] Added new ingredient: ${localId}`);
        }
        
        this.progress.completed++;
        this.notify();
      } catch (error) {
        console.error(`[SyncManager] Error processing ingredient:`, error);
      }
    }
  }

  private async downloadSynergies(supabase: ReturnType<typeof getSupabase>): Promise<void> {
    if (!supabase) return;

    const lastSync = await this.getLastSyncTime();
    console.log(`[SyncManager] Downloading synergies since ${lastSync}...`);

    const { data, error } = await supabase
      .from('ingredient_relationships')
      .select('*')
      .gte('updated_at', lastSync);

    if (error) {
      console.error('[SyncManager] Error downloading synergies:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('[SyncManager] No new synergies to download');
      return;
    }

    console.log(`[SyncManager] Downloading ${data.length} synergies...`);
    this.progress.total += data.length;

    for (const remote of data) {
      try {
        const synergy: DbSynergy = {
          id: remote.id,
          ingredienteA: remote.ingrediente1,
          ingredienteB: remote.ingrediente2,
          tipo: SynergyAdapter.mapTipoFromRemote(remote.tipo_relacion),
          nivel: SynergyAdapter.mapNivel(remote.intensidad) || 'medio',
          mecanismo: remote.descripcion,
          evidencia: SynergyAdapter.mapEvidencia(remote.evidencia) || 'C',
          fuentes: [],
          lamport: 1,
          deviceId: 'supabase',
          updatedAt: new Date(remote.updated_at).getTime(),
          tombstone: 0,
        };

        await db.synergies.put(synergy);
        this.progress.completed++;
        this.notify();
      } catch (error) {
        console.error(`[SyncManager] Error processing synergy:`, error);
      }
    }
  }

  private async downloadProtocols(supabase: ReturnType<typeof getSupabase>): Promise<void> {
    if (!supabase) return;

    const lastSync = await this.getLastSyncTime();
    console.log(`[SyncManager] Downloading protocols since ${lastSync}...`);

    const { data, error } = await supabase
      .from('protocols')
      .select('*')
      .eq('is_active', true)
      .gte('updated_at', lastSync);

    if (error) {
      console.error('[SyncManager] Error downloading protocols:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('[SyncManager] No new protocols to download');
      return;
    }

    console.log(`[SyncManager] Downloading ${data.length} protocols...`);
    this.progress.total += data.length;

    for (const remote of data) {
      try {
        const local = ProtocolAdapter.toLocal(remote);
        const protocol: DbProtocol = {
          id: remote.id,
          nombre: remote.name,
          objetivo: local.objetivo || remote.description || '',
          ingredientes: local.ingredientes || [],
          duracionDias: remote.duracion_dias,
          advertencias: local.advertencias || [],
          lamport: 1,
          deviceId: 'supabase',
          createdAt: new Date(remote.created_at).getTime(),
          updatedAt: new Date(remote.updated_at).getTime(),
          tombstone: 0,
        };

        await db.protocols.put(protocol);
        this.progress.completed++;
        this.notify();
      } catch (error) {
        console.error(`[SyncManager] Error processing protocol:`, error);
      }
    }
  }

  // ============ MAPPINGS & METADATA ============

  private async saveMapping(table: string, localId: string, remoteId: string): Promise<void> {
    try {
      await db.syncMeta.put({
        key: `mapping_${table}_${localId}`,
        value: { remoteId, localId },
        updatedAt: now(),
      });
    } catch (error) {
      console.error('[SyncManager] Error saving mapping:', error);
    }
  }

  private async getLocalId(table: string, remoteId: string): Promise<string | null> {
    try {
      const mapping = await db.syncMeta.get(`mapping_${table}_${remoteId}`);
      return (mapping?.value as { localId: string })?.localId || null;
    } catch {
      return null;
    }
  }

  private async getLastSyncTime(): Promise<string> {
    try {
      const meta = await db.syncMeta.get('lastSyncAll');
      return (meta?.value as string) || '1970-01-01T00:00:00Z';
    } catch {
      return '1970-01-01T00:00:00Z';
    }
  }

  private async saveLastSyncTime(timestamp: number): Promise<void> {
    try {
      await db.syncMeta.put({
        key: 'lastSyncAll',
        value: new Date(timestamp).toISOString(),
        updatedAt: now(),
      });
    } catch (error) {
      console.error('[SyncManager] Error saving sync time:', error);
    }
  }

  // ============ CLEANUP ============

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.networkListenerOnline);
      window.removeEventListener('offline', this.networkListenerOffline);
    }
    this.stopAutoSync();
    this.listeners.clear();
  }
}

// Singleton
export const syncManager = new SyncManager();
