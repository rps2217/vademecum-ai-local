/**
 * Sync Service
 * Servicio de sincronizacion local-first con soporte para Supabase.
 */

import { db } from '@/db';
import type {
  DbOutboxOp,
  DbSnapshot,
  DbIngredient,
  DbSynergy,
  SyncOpType,
  SyncTable
} from '@/db/schema';
import { generateId, now, getDeviceId } from '@/db/schema';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export interface SyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isConfigured: boolean;
  lastSyncAt: number | null;
  pendingOps: number;
  isSyncing: boolean;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  uploaded: number;
  downloaded: number;
  conflicts: number;
  error?: string;
}

export class SyncService {
  private config: SyncConfig = {
    enabled: false,
    autoSync: true,
    syncInterval: 30000,
  };
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncInProgress = false;
  private lastError: string | null = null;
  private syncTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
      if (isSupabaseConfigured()) {
        this.config.enabled = true;
        this.startAutoSync();
      }
    }
  }

  configure(config: Partial<SyncConfig>) {
    this.config = { ...this.config, ...config };
    if (this.config.enabled && this.config.autoSync) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  private startAutoSync() {
    if (this.syncTimer) return;
    this.syncTimer = setInterval(() => {
      if (this.isOnline && isSupabaseConfigured() && !this.syncInProgress) {
        this.performFullSync().catch(console.error);
      }
    }, this.config.syncInterval);
  }

  private stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private handleOnline() {
    this.isOnline = true;
    if (this.config.enabled && this.config.autoSync) {
      this.performFullSync().catch(console.error);
    }
  }

  private handleOffline() {
    this.isOnline = false;
  }

  async getStatus(): Promise<SyncStatus> {
    const pendingOps = await db.outbox
      .where('status')
      .anyOf(['pending', 'in_flight'])
      .count();
    const lastSyncMeta = await db.syncMeta.get('lastSyncAt');
    return {
      isOnline: this.isOnline,
      isConfigured: isSupabaseConfigured(),
      lastSyncAt: lastSyncMeta?.value as number | null,
      pendingOps,
      isSyncing: this.syncInProgress,
      error: this.lastError || undefined,
    };
  }

  async addToOutbox(
    type: SyncOpType,
    table: SyncTable,
    recordId: string,
    payload: unknown
  ): Promise<string> {
    const op: DbOutboxOp = {
      id: generateId(),
      type,
      table,
      recordId,
      payload,
      retries: 0,
      createdAt: now(),
      status: 'pending',
    };
    await db.outbox.put(op);
    if (this.isOnline && !this.syncInProgress && this.config.enabled) {
      this.performFullSync().catch(console.error);
    }
    return op.id;
  }

  async forceSync(): Promise<SyncResult> {
    if (!this.isOnline) {
      return { success: false, uploaded: 0, downloaded: 0, conflicts: 0, error: 'Sin conexion a internet' };
    }
    if (!isSupabaseConfigured()) {
      return { success: false, uploaded: 0, downloaded: 0, conflicts: 0, error: 'Supabase no configurado' };
    }
    return this.performFullSync();
  }

  private triggerSync() {
    if (this.syncInProgress || !this.config.enabled) return;
    setTimeout(() => this.performFullSync(), 1000);
  }

  private async performFullSync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: false, uploaded: 0, downloaded: 0, conflicts: 0, error: 'Sync en progreso' };
    }
    this.syncInProgress = true;
    this.lastError = null;
    let uploaded = 0, downloaded = 0, conflicts = 0;
    try {
      const uploadResult = await this.uploadPendingOps();
      uploaded = uploadResult.count;
      conflicts += uploadResult.conflicts;
      const downloadResult = await this.downloadRemoteChanges();
      downloaded = downloadResult.count;
      await db.syncMeta.put({ key: 'lastSyncAt', value: now(), updatedAt: now() });
      return { success: true, uploaded, downloaded, conflicts };
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Sync failed';
      return { success: false, uploaded, downloaded, conflicts, error: this.lastError };
    } finally {
      this.syncInProgress = false;
    }
  }

  private async uploadPendingOps(): Promise<{ count: number; conflicts: number }> {
    const supabase = getSupabase();
    if (!supabase) return { count: 0, conflicts: 0 };
    const pendingOps = await db.outbox.where('status').equals('pending').toArray();
    let uploaded = 0, conflicts = 0;
    for (const op of pendingOps) {
      try {
        await this.syncOpToSupabase(supabase, op);
        op.status = 'synced';
        await db.outbox.put(op);
        uploaded++;
      } catch (error) {
        if (error instanceof ConflictError) {
          conflicts++;
          op.status = 'conflict';
          op.lastError = 'Conflicto de sincronizacion';
        } else {
          op.status = 'failed';
          op.retries++;
          op.lastError = error instanceof Error ? error.message : 'Unknown error';
        }
        await db.outbox.put(op);
      }
    }
    return { count: uploaded, conflicts };
  }

  private async syncOpToSupabase(supabase: ReturnType<typeof getSupabase>, op: DbOutboxOp): Promise<void> {
    if (!supabase) throw new Error('Supabase not initialized');
    const table = op.table;
    const payload = op.payload as Record<string, unknown>;
    const supabasePayload = this.toSupabaseFormat(payload);
    switch (op.type) {
      case 'insert':
      case 'update': {
        const { error } = await supabase.from(table).upsert(supabasePayload, { onConflict: 'id' });
        if (error) {
          if (error.code === '23505') throw new ConflictError('Record already exists');
          throw error;
        }
        break;
      }
      case 'delete': {
        const { error } = await supabase.from(table).update({ tombstone: 1, updated_at: new Date().toISOString() }).eq('id', op.recordId);
        if (error) throw error;
        break;
      }
    }
  }

  private async downloadRemoteChanges(): Promise<{ count: number }> {
    const supabase = getSupabase();
    if (!supabase) return { count: 0 };
    const lastSyncMeta = await db.syncMeta.get('lastSyncAt');
    const lastSync = lastSyncMeta?.value as number | undefined;
    const lastSyncDate = lastSync ? new Date(lastSync).toISOString() : '1970-01-01T00:00:00Z';
    let downloaded = 0;
    const { data: ingredients, error: ingError } = await supabase.from('ingredients').select('*').eq('tombstone', 0).gte('updated_at', lastSyncDate);
    if (ingError) console.error('Error downloading ingredients:', ingError);
    else if (ingredients) {
      for (const ing of ingredients) {
        await this.mergeRemoteIngredient(ing);
        downloaded++;
      }
    }
    const { data: synergies, error: synError } = await supabase.from('synergies').select('*').eq('tombstone', 0).gte('updated_at', lastSyncDate);
    if (synError) console.error('Error downloading synergies:', synError);
    else if (synergies) {
      for (const syn of synergies) {
        await this.mergeRemoteSynergy(syn);
        downloaded++;
      }
    }
    return { count: downloaded };
  }

  private async mergeRemoteIngredient(remote: Record<string, unknown>): Promise<void> {
    const local = await db.ingredients.get(remote.id as string);
    const remoteLamport = (remote.lamport as number) || 0;
    const localLamport = local?.lamport || 0;
    if (!local || remoteLamport > localLamport) {
      const ingredient: DbIngredient = {
        id: remote.id as string,
        nombre: remote.nombre as string,
        sinonimos: (remote.sinonimos as string[]) || [],
        categoria: remote.categoria as DbIngredient['categoria'],
        familia: remote.familia as string | undefined,
        sistemas: (remote.sistemas as DbIngredient['sistemas']) || [],
        indicaciones: (remote.indicaciones as string[]) || [],
        evidencia: (remote.evidencia as DbIngredient['evidencia']) || 'C',
        propiedades: (remote.propiedades as string[]) || [],
        seguridad: (remote.seguridad as DbIngredient['seguridad']) || {},
        interacciones: (remote.interacciones as string[]) || [],
        fuentes: (remote.fuentes as string[]) || [],
        lamport: remoteLamport,
        deviceId: remote.device_id as string,
        updatedAt: new Date(remote.updated_at as string).getTime(),
        createdAt: new Date(remote.created_at as string).getTime(),
        tombstone: (remote.tombstone as 0 | 1) || 0,
      };
      await db.ingredients.put(ingredient);
    }
  }

  private async mergeRemoteSynergy(remote: Record<string, unknown>): Promise<void> {
    const local = await db.synergies.get(remote.id as string);
    const remoteLamport = (remote.lamport as number) || 0;
    const localLamport = local?.lamport || 0;
    if (!local || remoteLamport > localLamport) {
      const synergy: DbSynergy = {
        id: remote.id as string,
        ingredienteA: remote.ingrediente_a as string,
        ingredienteB: remote.ingrediente_b as string,
        tipo: remote.tipo as DbSynergy['tipo'],
        nivel: (remote.nivel as DbSynergy['nivel']) || 'medio',
        mecanismo: remote.mecanismo as string | undefined,
        evidencia: (remote.evidencia as DbSynergy['evidencia']) || 'C',
        descripcion: remote.descripcion as string | undefined,
        fuentes: (remote.fuentes as string[]) || [],
        lamport: remoteLamport,
        deviceId: remote.device_id as string,
        updatedAt: new Date(remote.updated_at as string).getTime(),
        tombstone: (remote.tombstone as 0 | 1) || 0,
      };
      await db.synergies.put(synergy);
    }
  }

  private toSupabaseFormat(payload: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      result[snakeKey] = value;
    }
    return result;
  }

  async retryFailedOps(): Promise<number> {
    const failedOps = await db.outbox.where('status').equals('failed').filter((op) => op.retries < 3).toArray();
    for (const op of failedOps) {
      op.status = 'pending';
      op.retries += 1;
      await db.outbox.put(op);
    }
    if (failedOps.length > 0 && this.isOnline && this.config.enabled) {
      this.triggerSync();
    }
    return failedOps.length;
  }

  async createBackup(encryptedBlob: Uint8Array, nonce: Uint8Array): Promise<{ success: boolean; snapshotId?: string; error?: string }> {
    try {
      const snapshot: DbSnapshot = {
        id: generateId(),
        type: 'full',
        deviceId: getDeviceId(),
        timestamp: now(),
        size: encryptedBlob.length,
        encryptedBlob,
        nonce,
        recipientPubKey: new Uint8Array(),
      };
      await db.snapshots.put(snapshot);
      return { success: true, snapshotId: snapshot.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getSnapshots() {
    return db.snapshots.orderBy('timestamp').reverse().toArray();
  }

  async restoreFromSnapshot(snapshotId: string): Promise<boolean> {
    const snapshot = await db.snapshots.get(snapshotId);
    if (!snapshot) return false;
    console.log('Restore from snapshot:', snapshotId);
    return true;
  }

  async pruneOldSnapshots(keepCount = 5): Promise<number> {
    const snapshots = await db.snapshots.orderBy('timestamp').reverse().toArray();
    const toDelete = snapshots.slice(keepCount);
    await db.snapshots.bulkDelete(toDelete.map((s) => s.id));
    return toDelete.length;
  }
}

class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export const syncService = new SyncService();
