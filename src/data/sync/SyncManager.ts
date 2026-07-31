/**
 * SyncManager Facade
 * 
 * Wrapper de compatibilidad para SyncService.
 * Proporciona una API unificada para los hooks existentes
 * que importaban SyncManager directamente.
 * 
 * @deprecated Usar syncService de @/core/sync directamente cuando sea posible
 */

import { 
  syncService, 
  type SyncService,
  type SyncConfig,
  type SyncStatus,
  type SyncResult
} from '@/core/sync';
import type { SyncOpType, SyncTable } from '@/db/schema';

// Re-exportar tipos para compatibilidad
export type SyncProgress = {
  state: 'idle' | 'syncing' | 'error' | 'offline';
  direction: 'upload' | 'download' | 'bidirectional';
  total: number;
  completed: number;
  errors: string[];
  lastSyncAt: number | null;
};

export type { SyncConfig, SyncStatus, SyncResult };

/**
 * SyncManager Facade
 * 
 * Mantiene compatibilidad con el API anterior mientras delega
 * toda la funcionalidad al SyncService actualizado.
 */
class SyncManagerFacade {
  /**
   * Suscribe un listener a cambios de estado de sync
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    return syncService.subscribe(listener);
  }

  /**
   * Fuerza una sincronización inmediata
   */
  async forceSync(): Promise<SyncResult> {
    return syncService.forceSync();
  }

  /**
   * Obtiene el estado actual de sincronización
   */
  async getStatus(): Promise<SyncStatus> {
    return syncService.getStatus();
  }

  /**
   * Agrega una operación a la cola de sincronización
   */
  async addToOutbox(
    type: SyncOpType,
    table: SyncTable,
    recordId: string,
    payload: unknown
  ): Promise<string> {
    return syncService.addToOutbox(type, table, recordId, payload);
  }

  /**
   * Configura el servicio de sincronización
   */
  configure(config: Partial<SyncConfig>): void {
    syncService.configure(config);
  }

  /**
   * Reintenta operaciones fallidas
   */
  async retryFailedOps(): Promise<number> {
    return syncService.retryFailedOps();
  }

  /**
   * Crea un backup cifrado
   */
  async createBackup(
    encryptedBlob: Uint8Array, 
    nonce: Uint8Array
  ): Promise<{ success: boolean; snapshotId?: string; error?: string }> {
    return syncService.createBackup(encryptedBlob, nonce);
  }

  /**
   * Obtiene todos los snapshots
   */
  async getSnapshots() {
    return syncService.getSnapshots();
  }

  /**
   * Restaura desde un snapshot
   */
  async restoreFromSnapshot(snapshotId: string): Promise<boolean> {
    return syncService.restoreFromSnapshot(snapshotId);
  }

  /**
   * Elimina snapshots antiguos
   */
  async pruneOldSnapshots(keepCount = 5): Promise<number> {
    return syncService.pruneOldSnapshots(keepCount);
  }

  /**
   * Obtiene acceso directo al servicio subyacente
   */
  getService(): SyncService {
    return syncService;
  }
}

// Instancia singleton
export const syncManager = new SyncManagerFacade();
