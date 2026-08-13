/**
 * Sync Service
 * Servicio de sincronizacion local-first con soporte para Supabase.
 */

import { db } from '@/db';
import { logger } from '@/lib/logger';
import type {
  DbOutboxOp,
  DbIngredient,
  DbSynergy,
  SyncOpType,
  SyncTable
} from '@/db/schema';
import { generateId, now } from '@/db/schema';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { ConflictResolver, type ConflictInfo } from './ConflictResolver';
import { ConflictError, SchemaMismatchError, UnauthorizedError } from './errors';
import { toSupabaseFormat } from './transform';

export interface SyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number;
  maxRetries: number;
  baseRetryDelay: number;
  enableConflictDetection: boolean;
}

export interface SyncStatus {
  isOnline: boolean;
  isConfigured: boolean;
  lastSyncAt: number | null;
  pendingOps: number;
  isSyncing: boolean;
  error?: string;
  pendingConflicts: number;
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
    maxRetries: 3,
    baseRetryDelay: 1000,
    enableConflictDetection: true,
  };
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncInProgress = false;
  private lastError: string | null = null;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  // Fail-fast: si las tablas remotas no existen, desactivar sync para esta
  // sesión y no volver a intentarlo (evita spam de errores de red cada 30s).
  private syncDisabled = false;
  // Contador de fallos de red consecutivos. Si supera el umbral, desactiva
  // sync (probablemente las tablas no existen o el endpoint es inválido).
  private consecutiveNetworkFailures = 0;
  private static readonly MAX_NETWORK_FAILURES = 3;

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

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    this.getStatus().then(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.getStatus().then((status) => {
      this.listeners.forEach((listener) => listener(status));
    });
  }

  private startAutoSync() {
    if (this.syncTimer) return;
    this.syncTimer = setInterval(() => {
      if (this.isOnline && isSupabaseConfigured() && !this.syncInProgress && !this.syncDisabled) {
        this.performFullSync().catch(logger.error);
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
    this.notifyListeners();
    if (this.config.enabled && this.config.autoSync && !this.syncDisabled) {
      this.performFullSync().catch(logger.error);
    }
  }

  private handleOffline() {
    this.isOnline = false;
    this.notifyListeners();
  }

  async getStatus(): Promise<SyncStatus> {
    const pendingOps = await db.outbox
      .where('status')
      .anyOf(['pending', 'in_flight'])
      .count();
    const lastSyncMeta = await db.syncMeta.get('lastSyncAt');
    const pendingConflicts = await db.conflicts
      .where('resolution')
      .equals('pending')
      .count();
    return {
      isOnline: this.isOnline,
      isConfigured: isSupabaseConfigured(),
      lastSyncAt: lastSyncMeta?.value as number | null,
      pendingOps,
      isSyncing: this.syncInProgress,
      error: this.lastError || undefined,
      pendingConflicts,
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
      idempotencyKey: `${table}:${recordId}:${type}:${now()}`,
    };
    await db.outbox.put(op);
    if (this.isOnline && !this.syncInProgress && this.config.enabled) {
      this.performFullSync().catch(logger.error);
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

  private async performFullSync(): Promise<SyncResult> {
    if (this.syncDisabled) {
      return { success: false, uploaded: 0, downloaded: 0, conflicts: 0, error: 'Sync desactivado (tablas remotas inexistentes)' };
    }
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
      this.consecutiveNetworkFailures = 0;
      return { success: true, uploaded, downloaded, conflicts };
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Sync failed';
      // Detectar errores de red (fetch falla antes de llegar a PostgREST).
      // Tras varios fallos consecutivos, desactivar sync para evitar spam.
      if (this.isNetworkError(error)) {
        this.consecutiveNetworkFailures++;
        if (this.consecutiveNetworkFailures >= SyncService.MAX_NETWORK_FAILURES) {
          this.disableSync(`Sync desactivado tras ${this.consecutiveNetworkFailures} fallos de red consecutivos. Verifica la configuración de Supabase y que las tablas existan.`);
        }
      }
      return { success: false, uploaded, downloaded, conflicts, error: this.lastError };
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }
  }

  /**
   * Detecta si un error es de red (fetch rechazado antes de llegar al servidor).
   * El cliente Supabase envuelve los TypeError: Failed to fetch.
   */
  private isNetworkError(error: unknown): boolean {
    if (!error) return false;
    const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
    return msg.includes('failed to fetch') ||
      msg.includes('networkerror') ||
      msg.includes('network request failed') ||
      msg.includes('load failed');
  }

  /**
   * Calcula el delay exponencial para retries
   */
  private calculateRetryDelay(retries: number): number {
    const delay = this.config.baseRetryDelay * Math.pow(2, retries);
    const jitter = Math.random() * 1000; // Añade jitter para evitar thundering herd
    return Math.min(delay, 30000) + jitter; // Máximo 30 segundos
  }

  private async uploadPendingOps(): Promise<{ count: number; conflicts: number }> {
    const supabase = getSupabase();
    if (!supabase) return { count: 0, conflicts: 0 };
    const pendingOps = await db.outbox.where('status').equals('pending').toArray();
    let uploaded = 0, conflicts = 0;
    
    for (const op of pendingOps) {
      op.status = 'in_flight';
      op.lastAttemptAt = now();
      await db.outbox.put(op);
      
      try {
        // Aplicar backoff exponencial si hay retries previos
        if (op.retries > 0) {
          const delay = this.calculateRetryDelay(op.retries);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        await this.syncOpToSupabase(supabase, op);
        op.status = 'synced';
        await db.outbox.put(op);
        uploaded++;
      } catch (error) {
        if (error instanceof ConflictError) {
          conflicts++;
          op.status = 'conflict';
          op.lastError = 'Conflicto de sincronizacion';
          await db.outbox.put(op);
          
          // Registrar conflicto si la detección está habilitada
          if (this.config.enableConflictDetection) {
            await this.registerConflict(op, error);
          }
        } else if (error instanceof SchemaMismatchError) {
          logger.warn('[SyncService] Schema mismatch during upload:', error.message);
          op.status = 'failed';
          op.retries++;
          op.lastError = error.message;
          await db.outbox.put(op);
        } else if (error instanceof UnauthorizedError) {
          logger.warn('[SyncService] Unauthorized - token may need refresh');
          op.status = 'pending'; // Reset para reintentar después de refresh
          op.retries++;
          op.lastError = 'Unauthorized';
          await db.outbox.put(op);
          // Intentar refresh de token
          this.handleUnauthorized();
        } else {
          op.status = op.retries >= this.config.maxRetries - 1 ? 'failed' : 'pending';
          op.retries++;
          op.lastError = error instanceof Error ? error.message : 'Unknown error';
          await db.outbox.put(op);
          
          if (op.retries >= this.config.maxRetries) {
            logger.error('[SyncService] Op reached max retries:', op.id);
          }
        }
      }
    }
    return { count: uploaded, conflicts };
  }

  /**
   * Registra un conflicto detectado
   */
  private async registerConflict(op: DbOutboxOp, _error: ConflictError): Promise<void> {
    try {
      const conflictInfo: ConflictInfo = {
        table: op.table,
        recordId: op.recordId,
        localVersion: op.payload as Record<string, unknown>,
        remoteVersion: {},
        localLamport: (op.payload as Record<string, unknown>)['lamport'] as number || 0,
        remoteLamport: 0,
      };
      await ConflictResolver.registerConflict(conflictInfo);
    } catch (err) {
      logger.error('[SyncService] Error registering conflict:', err);
    }
  }

  /**
   * Maneja errores de autenticación
   */
  private async handleUnauthorized(): Promise<void> {
    const supabase = getSupabase();
    if (supabase?.auth) {
      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          logger.error('[SyncService] Token refresh failed:', error);
        } else {
          logger.log('[SyncService] Token refreshed successfully');
        }
      } catch (err) {
        logger.error('[SyncService] Token refresh error:', err);
      }
    }
  }

  private async syncOpToSupabase(supabase: ReturnType<typeof getSupabase>, op: DbOutboxOp): Promise<void> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const table = op.table;
    const payload = op.payload as Record<string, unknown>;
    const supabasePayload = toSupabaseFormat(payload);
    
    // Usar idempotency key si está disponible
    const headers: Record<string, string> = {};
    if (op.idempotencyKey) {
      headers['x-idempotency-key'] = op.idempotencyKey;
    }
    
    switch (op.type) {
      case 'insert':
      case 'update': {
        const { error } = await supabase.from(table).upsert(supabasePayload, {
          onConflict: 'id',
          headers,
        // headers es soportado por Supabase-js aunque el tipo local no lo refleje; sync es experimental.
        } as Record<string, unknown>);
        if (error) {
          if (error.code === '401') throw new UnauthorizedError('Unauthorized');
          if (error.code === '23505') throw new ConflictError('Record already exists');
          if (error.code === 'PGRST204' || error.message?.includes('column')) {
            throw new SchemaMismatchError(`Schema mismatch for table "${table}". Ensure Supabase schema includes all required columns. Sync is experimental.`);
          }
          throw error;
        }
        break;
      }
      case 'delete': {
        const { error } = await supabase.from(table).update({ tombstone: 1, updated_at: new Date().toISOString() }).eq('id', op.recordId);
        if (error) {
          if (error.code === '401') throw new UnauthorizedError('Unauthorized');
          if (error.code === 'PGRST204' || error.message?.includes('column')) {
            throw new SchemaMismatchError(`Schema mismatch for table "${table}". Ensure Supabase schema includes all required columns.`);
          }
          throw error;
        }
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

    // Download ingredients
    const { data: ingredients, error: ingError } = await supabase.from('ingredients').select('*').eq('tombstone', 0).gte('updated_at', lastSyncDate);
    if (ingError) {
      if (this.isMissingTableError(ingError)) {
        this.disableSync('Las tablas remotas (ingredients/synergies) no existen en Supabase. Sync desactivado.');
      } else if (ingError.code === 'PGRST204' || ingError.message?.includes('column')) {
        logger.warn('[SyncService] Schema mismatch: "ingredients" table columns not found. Sync is experimental.');
      } else {
        logger.error('Error downloading ingredients:', ingError);
      }
    } else if (ingredients) {
      for (const ing of ingredients) {
        const conflict = await this.mergeRemoteIngredient(ing);
        if (!conflict) downloaded++;
      }
    }

    // Skip synergies if sync already disabled by ingredients check
    if (this.syncDisabled) return { count: downloaded };

    // Download synergies
    const { data: synergies, error: synError } = await supabase.from('synergies').select('*').eq('tombstone', 0).gte('updated_at', lastSyncDate);
    if (synError) {
      if (this.isMissingTableError(synError)) {
        this.disableSync('Las tablas remotas (ingredients/synergies) no existen en Supabase. Sync desactivado.');
      } else if (synError.code === 'PGRST204' || synError.message?.includes('column')) {
        logger.warn('[SyncService] Schema mismatch: "synergies" table columns not found. Sync is experimental.');
      } else {
        logger.error('Error downloading synergies:', synError);
      }
    } else if (synergies) {
      for (const syn of synergies) {
        const conflict = await this.mergeRemoteSynergy(syn);
        if (!conflict) downloaded++;
      }
    }
    return { count: downloaded };
  }

  /**
   * Detecta si un error de Supabase indica que la tabla no existe.
   * PostgREST usa PGRST205 (schemaCacheMiss) cuando la tabla no está en el
   * schema cache. También cubrimos mensajes de error comunes.
   */
  private isMissingTableError(error: { code?: string; message?: string }): boolean {
    if (!error) return false;
    const code = error.code?.toUpperCase();
    const msg = (error.message || '').toLowerCase();
    return code === 'PGRST205' ||
      code === '42P01' ||
      msg.includes('could not find the table') ||
      msg.includes('relation') && msg.includes('does not exist') ||
      msg.includes('schema cache miss');
  }

  /**
   * Desactiva el sync para esta sesión y detiene el auto-sync timer.
   * Se invoca cuando las tablas remotas no existen o son inaccesibles,
   * para evitar un spam de errores de red cada 30 segundos.
   */
  private disableSync(reason: string): void {
    if (this.syncDisabled) return;
    this.syncDisabled = true;
    this.config.enabled = false;
    this.stopAutoSync();
    logger.warn(`[SyncService] ${reason}`);
    this.notifyListeners();
  }

  private async mergeRemoteIngredient(remote: Record<string, unknown>): Promise<boolean> {
    const local = await db.ingredients.get(remote.id as string);
    const remoteLamport = (remote.lamport as number) || 0;
    const localLamport = local?.lamport || 0;
    
    // Detectar conflicto si ambos tienen cambios recientes
    if (local && this.config.enableConflictDetection) {
      const hasConflict = ConflictResolver.detectConflict(
        localLamport,
        remoteLamport,
        local.updatedAt,
        new Date(remote.updated_at as string).getTime()
      );
      
      if (hasConflict) {
        const conflictInfo: ConflictInfo = {
          table: 'ingredients',
          recordId: remote.id as string,
          localVersion: local as unknown as Record<string, unknown>,
          remoteVersion: remote,
          localLamport,
          remoteLamport,
        };
        await ConflictResolver.registerConflict(conflictInfo);
        return true;
      }
    }
    
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
    return false;
  }

  private async mergeRemoteSynergy(remote: Record<string, unknown>): Promise<boolean> {
    const local = await db.synergies.get(remote.id as string);
    const remoteLamport = (remote.lamport as number) || 0;
    const localLamport = local?.lamport || 0;
    
    // Detectar conflicto si ambos tienen cambios recientes
    if (local && this.config.enableConflictDetection) {
      const hasConflict = ConflictResolver.detectConflict(
        localLamport,
        remoteLamport,
        local.updatedAt,
        new Date(remote.updated_at as string).getTime()
      );
      
      if (hasConflict) {
        const conflictInfo: ConflictInfo = {
          table: 'synergies',
          recordId: remote.id as string,
          localVersion: local as unknown as Record<string, unknown>,
          remoteVersion: remote,
          localLamport,
          remoteLamport,
        };
        await ConflictResolver.registerConflict(conflictInfo);
        return true;
      }
    }
    
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
    return false;
  }

  /**
   * Obtiene conflictos pendientes
   */
  async getPendingConflicts() {
    return ConflictResolver.getPendingConflicts();
  }

  /**
   * Resuelve un conflicto
   */
  async resolveConflict(conflictId: string, resolution: 'local' | 'remote' | 'merged', mergedData?: Record<string, unknown>) {
    return ConflictResolver.resolveConflict(conflictId, resolution, mergedData);
  }
}

export const syncService = new SyncService();
