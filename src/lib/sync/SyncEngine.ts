/**
 * SyncEngine - Motor de sincronización
 * 
 * Implementa el patrón outbox para sincronización eventual.
 * Usa Lamport clock para consistencia.
 */

import { db, generateId, now, getDeviceId, nextLamport, updateLamport, type SyncOpType, type SyncTable, type DbOutboxOp } from '@/db';
import { logger } from '@/services/LoggerService';

export interface SyncConfig {
  supabaseUrl?: string;
  supabaseKey?: string;
  syncInterval?: number;
  maxRetries?: number;
}

export interface SyncStats {
  pendingOps: number;
  lastSyncAt: number | null;
  lastSyncResult: 'success' | 'error' | null;
  errors: string[];
}

class SyncEngineClass {
  private config: SyncConfig = {};
  private running = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private stats: SyncStats = {
    pendingOps: 0,
    lastSyncAt: null,
    lastSyncResult: null,
    errors: [],
  };

  /**
   * Configurar el motor de sync
   */
  configure(config: SyncConfig) {
    this.config = {
      syncInterval: 30000, // 30s default
      maxRetries: 3,
      ...config,
    };
    logger.info('SyncEngine configurado', 'SyncEngine', this.config);
  }

  /**
   * Iniciar el motor de sincronización
   */
  async start() {
    if (this.running) {
      logger.warn('SyncEngine ya está corriendo', 'SyncEngine');
      return;
    }

    this.running = true;
    logger.info('SyncEngine iniciado', 'SyncEngine');

    // Sincronizar inmediatamente
    await this.sync();

    // Programar sincronizaciones periódicas
    if (this.config.syncInterval && this.config.syncInterval > 0) {
      this.syncInterval = setInterval(() => {
        this.sync().catch(err => {
          logger.error('Error en sync periódico', 'SyncEngine', err);
        });
      }, this.config.syncInterval);
    }
  }

  /**
   * Detener el motor de sincronización
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.running = false;
    logger.info('SyncEngine detenido', 'SyncEngine');
  }

  /**
   * Agregar operación a la outbox
   */
  async enqueue(
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
    await this.updateStats();
    
    logger.debug(`Operación encolada: ${type} ${table}/${recordId}`, 'SyncEngine');
    return op.id;
  }

  /**
   * Ejecutar una sincronización
   */
  async sync(): Promise<void> {
    if (!this.config.supabaseUrl || !this.config.supabaseKey) {
      logger.debug('Sync no configurado (sin Supabase)', 'SyncEngine');
      return;
    }

    try {
      const pendingOps = await db.outbox
        .where('status')
        .anyOf(['pending', 'failed'])
        .filter(op => op.retries < (this.config.maxRetries ?? 3))
        .toArray();

      if (pendingOps.length === 0) {
        logger.debug('No hay operaciones pendientes', 'SyncEngine');
        return;
      }

      logger.info(`Sincronizando ${pendingOps.length} operaciones...`, 'SyncEngine');

      for (const op of pendingOps) {
        await this.processOp(op);
      }

      this.stats.lastSyncAt = now();
      this.stats.lastSyncResult = 'success';
      logger.info('Sincronización completada', 'SyncEngine');
    } catch (error) {
      this.stats.lastSyncResult = 'error';
      this.stats.errors.push(String(error));
      if (this.stats.errors.length > 10) {
        this.stats.errors = this.stats.errors.slice(-10);
      }
      logger.error('Error en sincronización', 'SyncEngine', error);
      throw error;
    }
  }

  /**
   * Procesar una operación individual
   */
  private async processOp(op: DbOutboxOp): Promise<void> {
    try {
      // Marcar como en vuelo
      await db.outbox.update(op.id, { status: 'in_flight' });

      // Simular sync (en producción, aquí iría la llamada a Supabase)
      await this.syncToCloud(op);

      // Marcar como sincronizado
      await db.outbox.update(op.id, { status: 'synced' });
      logger.debug(`Op ${op.id} sincronizada`, 'SyncEngine');
    } catch (error) {
      const newRetries = op.retries + 1;
      const newStatus = newRetries >= (this.config.maxRetries ?? 3) ? 'failed' : 'pending';
      
      await db.outbox.update(op.id, {
        retries: newRetries,
        status: newStatus,
        lastError: String(error),
      });
      
      logger.error(`Error procesando op ${op.id}`, 'SyncEngine', error);
    }
  }

  /**
   * Sincronizar operación a la nube
   */
  private async syncToCloud(op: DbOutboxOp): Promise<void> {
    if (!this.config.supabaseUrl || !this.config.supabaseKey) return;

    const url = `${this.config.supabaseUrl}/rest/v1/${op.table}`;
    
    const headers = {
      'apikey': this.config.supabaseKey,
      'Authorization': `Bearer ${this.config.supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    };

    const body = {
      ...(op.payload as object),
      lamport: nextLamport(),
      deviceId: getDeviceId(),
      updatedAt: now(),
      tombstone: op.type === 'delete' ? 1 : 0,
    };

    let response: Response;

    switch (op.type) {
      case 'insert':
      case 'update':
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });
        break;
      case 'delete':
        response = await fetch(`${url}?id=eq.${op.recordId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ tombstone: 1, updatedAt: now() }),
        });
        break;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
  }

  /**
   * Obtener estadísticas de sync
   */
  async getStats(): Promise<SyncStats> {
    await this.updateStats();
    return { ...this.stats };
  }

  /**
   * Actualizar estadísticas
   */
  private async updateStats() {
    this.stats.pendingOps = await db.outbox
      .where('status')
      .anyOf(['pending', 'in_flight'])
      .count();
  }

  /**
   * Limpiar operaciones sincronizadas
   */
  async cleanupSynced(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const cutoff = now() - maxAge;
    
    const toDelete = await db.outbox
      .where('status')
      .equals('synced')
      .filter(op => op.createdAt < cutoff)
      .toArray();

    const ids = toDelete.map(op => op.id);
    await db.outbox.bulkDelete(ids);
    
    logger.info(`Limpiadas ${ids.length} operaciones sincronizadas`, 'SyncEngine');
    return ids.length;
  }

  /**
   * Forzar resolución de conflictos
   */
  async resolveConflict(opId: string, resolution: 'local' | 'remote'): Promise<void> {
    const op = await db.outbox.get(opId);
    if (!op) return;

    if (resolution === 'local') {
      // Reintentar con la versión local
      await db.outbox.update(opId, { status: 'pending', retries: 0 });
    } else {
      // Descartar y usar la versión remota
      await db.outbox.update(opId, { status: 'synced' });
    }
  }
}

export const SyncEngine = new SyncEngineClass();
