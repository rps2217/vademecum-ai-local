/**
 * Sync Service
 * Servicio de sincronizacion local-first con soporte para Supabase.
 */

import { db } from '@/db';
import { logger } from '@/lib/logger';
import type {
  DbOutboxOp,
  SyncOpType,
  SyncTable
} from '@/db/schema';
import { generateId, now } from '@/db/schema';
import { getSupabase, isSupabaseConfigured, getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase';
import { ConflictResolver, type ConflictInfo } from './ConflictResolver';
import { ConflictError, SchemaMismatchError, UnauthorizedError } from './errors';
import { toSupabaseFormat, fromSupabaseIngredient, fromSupabaseSynergy, fromSupabasePathology } from './transform';

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
  /** Ops synced se purgan tras 1 hora (ya aplicadas remotamente). */
  private static readonly STALE_SYNCED_MS = 60 * 60 * 1000;
  /** Ops failed se purgan tras 24 horas (evitan crecimiento indefinido del outbox). */
  private static readonly STALE_FAILED_MS = 24 * 60 * 60 * 1000;
  // Fail-fast para uploads 401: la anon key solo permite lectura (RLS);
  // los upserts fallan con 401 y, sin tope, se reintentan cada 30s para
  // siempre. Tras MAX_UPLOAD_401_FAILURES consecutivos, desactivar el sync.
  private consecutiveUpload401s = 0;
  private static readonly MAX_UPLOAD_401_FAILURES = 3;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
      if (isSupabaseConfigured()) {
        this.config.enabled = true;
        this.startAutoSync();
        // Health-check inicial: si el host de Supabase no resuelve o no es
        // alcanzable (DNS failure, config errónea en prod), desactivar sync
        // antes de que el timer dispare 3 reintentos que llenarían la consola
        // de errores "no-response" / "Failed to fetch".
        this.runStartupHealthCheck();
      }
    }
  }

  /** Probar reachabilidad del host Supabase una vez al arrancar.
   *  Usa un fetch HEAD a la tabla `products` con timeout corto (4s).
   *
   *  Antes se hacía HEAD al root `/rest/v1/` SIN apikey, lo que provocaba
   *  un 401 ruidoso en la consola de red del navegador en cada arranque
   *  (PostgREST rechaza el root sin auth). Ahora apuntamos a una tabla real
   *  con la apikey:
   *   - 200 → host reachable + apikey válida + RLS ok → sync habilitado.
   *   - 401/403 → apikey inválida o sin permisos RLS → advertir (no es un
   *     fallo de red, el host sí responde).
   *   - 404 → la tabla no existe, pero el host responde → sync puede correr.
   *   - TypeError/AbortError → fallo de red/DNS → desactivar sync. */
  private async runStartupHealthCheck(): Promise<void> {
    const url = getSupabaseUrl();
    if (!url) return;
    const key = getSupabaseAnonKey();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${url}/rest/v1/products?select=sku&limit=1`, {
        method: 'HEAD',
        headers: { apikey: key ?? '' },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));
      if (res.status === 401 || res.status === 403) {
        logger.warn(
          `[Sync] Health check: Supabase respondió ${res.status}. La apikey ` +
          `anon no tiene permiso de lectura (RLS) o es inválida — verifica ` +
          `VITE_SUPABASE_ANON_KEY. El host sí responde, sync continúa.`
        );
      }
    } catch (err) {
      if (this.isNetworkError(err)) {
        this.disableSync(
          `Sync desactivado al arrancar: el host de Supabase (${url}) no es ` +
          `alcanzable (fallo de red/DNS). Verifica VITE_SUPABASE_URL en el entorno.`
        );
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
      // Purgar ops synced/failed antiguos para que el outbox no crezca indefinidamente.
      await this.cleanupStaleOutboxOps();
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
        // Un upload exitoso indica que las credenciales vuelven a tener
        // permiso de escritura (ej. se rotó a service role). Resetear el
        // contador de fallos 401 para reactivar el fail-fast limpio.
        this.consecutiveUpload401s = 0;
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
          this.consecutiveUpload401s++;
          if (this.consecutiveUpload401s >= SyncService.MAX_UPLOAD_401_FAILURES) {
            // La anon key solo permite lectura (RLS); la escritura requiere
            // service role. Desactivar el sync para evitar reintentos infinitos.
            op.status = 'failed';
            op.lastError = 'Unauthorized (RLS bloquea escritura con anon key)';
            await db.outbox.put(op);
            this.disableSync(
              `Sync desactivado tras ${this.consecutiveUpload401s} fallos de ` +
              `autenticación (401) en uploads. La anon key solo permite lectura ` +
              `(RLS); la escritura a Supabase requiere service role.`
            );
          } else {
            logger.warn(
              `[SyncService] Unauthorized en upload (${this.consecutiveUpload401s}/` +
              `${SyncService.MAX_UPLOAD_401_FAILURES}). Reintentando tras refresh.`
            );
            op.retries++;
            op.lastError = 'Unauthorized';
            // Tras agotar retries por-op, marcar como failed (evita que una
            // op 401 se re-encole indefinidamente entre ciclos de sync).
            op.status = op.retries >= this.config.maxRetries ? 'failed' : 'pending';
            await db.outbox.put(op);
            this.handleUnauthorized();
          }
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
   * Purga ops del outbox que ya no son útiles:
   * - `synced`: exitosos, se borran tras STALE_SYNCED_MS (1h).
   * - `failed`: agotaron retries, se borran tras STALE_FAILED_MS (24h).
   * Los ops `conflict` y `pending` se conservan (requieren acción o retry).
   * Esto evita que la tabla outbox crezca indefinidamente con histórico de
   * operaciones ya completadas o descartadas.
   */
  private async cleanupStaleOutboxOps(): Promise<number> {
    const cutoffSynced = now() - SyncService.STALE_SYNCED_MS;
    const cutoffFailed = now() - SyncService.STALE_FAILED_MS;
    const staleIds: string[] = [];

    // Purga basada en la actividad más reciente (lastAttemptAt ?? createdAt).
    // Un op con createdAt viejo pero lastAttemptAt fresco (retry exitoso)
    // no se purga.
    const syncedOps = await db.outbox
      .where('status').equals('synced')
      .and(op => (op.lastAttemptAt ?? op.createdAt) < cutoffSynced)
      .primaryKeys();
    staleIds.push(...syncedOps);

    const failedOps = await db.outbox
      .where('status').equals('failed')
      .and(op => (op.lastAttemptAt ?? op.createdAt) < cutoffFailed)
      .primaryKeys();
    staleIds.push(...failedOps);

    if (staleIds.length > 0) {
      await db.outbox.bulkDelete(staleIds);
      logger.debug(`[SyncService] Purgadas ${staleIds.length} ops stale del outbox`);
    }
    return staleIds.length;
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

    // Download ingredients.
    // No filtramos por tombstone=0 para que los deletes remotos (soft-delete con
    // tombstone=1) también se descarguen y se propaguen al store local. El merge
    // aplica el tombstone remoto cuando remoteLamport > localLamport; sin este
    // cambio, un ingrediente borrado en Supabase seguiría visible localmente.
    const { data: ingredients, error: ingError } = await supabase.from('ingredients').select('*').gte('updated_at', lastSyncDate);
    if (ingError) {
      if (this.isMissingTableError(ingError)) {
        this.disableSync('Las tablas remotas (ingredients/synergies) no existen en Supabase. Sync desactivado.');
      } else if (ingError.code === '401' || ingError.message?.toLowerCase().includes('jwt') || ingError.message?.toLowerCase().includes('api key')) {
        this.disableSync('Autenticación rechazada por Supabase (401). Verifica VITE_SUPABASE_ANON_KEY en .env.local. Sync desactivado.');
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

    // Download synergies (incluye tombstoned para propagar deletes remotos).
    const { data: synergies, error: synError } = await supabase.from('synergies').select('*').gte('updated_at', lastSyncDate);
    if (synError) {
      if (this.isMissingTableError(synError)) {
        this.disableSync('Las tablas remotas (ingredients/synergies) no existen en Supabase. Sync desactivado.');
      } else if (synError.code === '401' || synError.message?.toLowerCase().includes('jwt') || synError.message?.toLowerCase().includes('api key')) {
        this.disableSync('Autenticación rechazada por Supabase (401). Verifica VITE_SUPABASE_ANON_KEY en .env.local. Sync desactivado.');
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

    // Skip pathologies if sync already disabled by synergies check
    if (this.syncDisabled) return { count: downloaded };

    // Download pathologies (incluye tombstoned para propagar deletes remotos).
    const { data: pathologies, error: pathError } = await supabase.from('pathologies').select('*').gte('updated_at', lastSyncDate);
    if (pathError) {
      if (this.isMissingTableError(pathError)) {
        this.disableSync('Las tablas remotas (ingredients/synergies/pathologies) no existen en Supabase. Sync desactivado.');
      } else if (pathError.code === '401' || pathError.message?.toLowerCase().includes('jwt') || pathError.message?.toLowerCase().includes('api key')) {
        this.disableSync('Autenticación rechazada por Supabase (401). Verifica VITE_SUPABASE_ANON_KEY en .env.local. Sync desactivado.');
      } else if (pathError.code === 'PGRST204' || pathError.message?.includes('column')) {
        logger.warn('[SyncService] Schema mismatch: "pathologies" table columns not found. Sync is experimental.');
      } else {
        logger.error('Error downloading pathologies:', pathError);
      }
    } else if (pathologies) {
      for (const path of pathologies) {
        const conflict = await this.mergeRemotePathology(path);
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
    const remoteUpdatedAt = new Date(remote.updated_at as string).getTime();

    // Detectar conflicto si ambos tienen cambios recientes
    if (local && this.config.enableConflictDetection) {
      const hasConflict = ConflictResolver.detectConflict(
        localLamport,
        remoteLamport,
        local.updatedAt,
        Number.isNaN(remoteUpdatedAt) ? 0 : remoteUpdatedAt
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
      // Usa el transform centralizado para no perder campos (posologia, embedding).
      const ingredient = fromSupabaseIngredient(remote);
      await db.ingredients.put(ingredient);
    }
    return false;
  }

  private async mergeRemoteSynergy(remote: Record<string, unknown>): Promise<boolean> {
    const local = await db.synergies.get(remote.id as string);
    const remoteLamport = (remote.lamport as number) || 0;
    const localLamport = local?.lamport || 0;
    const remoteUpdatedAt = new Date(remote.updated_at as string).getTime();

    // Detectar conflicto si ambos tienen cambios recientes
    if (local && this.config.enableConflictDetection) {
      const hasConflict = ConflictResolver.detectConflict(
        localLamport,
        remoteLamport,
        local.updatedAt,
        Number.isNaN(remoteUpdatedAt) ? 0 : remoteUpdatedAt
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
      const synergy = fromSupabaseSynergy(remote);
      await db.synergies.put(synergy);
    }
    return false;
  }

  private async mergeRemotePathology(remote: Record<string, unknown>): Promise<boolean> {
    const local = await db.pathologies.get(remote.id as string);
    const remoteLamport = (remote.lamport as number) || 0;
    const localLamport = local?.lamport || 0;
    const remoteUpdatedAt = new Date(remote.updated_at as string).getTime();

    if (local && this.config.enableConflictDetection) {
      const hasConflict = ConflictResolver.detectConflict(
        localLamport,
        remoteLamport,
        local.updatedAt,
        Number.isNaN(remoteUpdatedAt) ? 0 : remoteUpdatedAt
      );

      if (hasConflict) {
        const conflictInfo: ConflictInfo = {
          table: 'pathologies',
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
      const pathology = fromSupabasePathology(remote);
      await db.pathologies.put(pathology);
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
