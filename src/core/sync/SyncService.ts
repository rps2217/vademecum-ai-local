/**
 * Sync Service
 * Servicio de sincronizacion local-first con soporte para backup cifrado.
 */

import { db } from '@/db';
import type { 
  DbOutboxOp, 
  DbSnapshot,
  SyncOpType,
  SyncTable 
} from '@/db/schema';
import { generateId, now, getDeviceId } from '@/db/schema';

export interface SyncConfig {
  enabled: boolean;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncAt: number | null;
  pendingOps: number;
  isSyncing: boolean;
}

export class SyncService {
  private config: SyncConfig = { enabled: false };
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncInProgress = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  configure(config: Partial<SyncConfig>) {
    this.config = { ...this.config, ...config };
  }

  private handleOnline() {
    this.isOnline = true;
    this.triggerSync();
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
      lastSyncAt: lastSyncMeta?.value as number | null,
      pendingOps,
      isSyncing: this.syncInProgress,
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
    
    if (this.isOnline && !this.syncInProgress) {
      this.triggerSync();
    }
    
    return op.id;
  }

  async createBackup(encryptedBlob: Uint8Array, nonce: Uint8Array): Promise<{
    success: boolean;
    snapshotId?: string;
    error?: string;
  }> {
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
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
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
    const snapshots = await db.snapshots
      .orderBy('timestamp')
      .reverse()
      .toArray();
    
    const toDelete = snapshots.slice(keepCount);
    await db.snapshots.bulkDelete(toDelete.map(s => s.id));
    return toDelete.length;
  }

  async retryFailedOps(): Promise<number> {
    const failedOps = await db.outbox
      .where('status')
      .equals('failed')
      .filter(op => op.retries < 3)
      .toArray();
    
    for (const op of failedOps) {
      op.status = 'pending';
      op.retries += 1;
      await db.outbox.put(op);
    }
    
    if (failedOps.length > 0 && this.isOnline) {
      this.triggerSync();
    }
    
    return failedOps.length;
  }

  private triggerSync() {
    if (this.syncInProgress || !this.config.enabled) return;
    setTimeout(() => this.performSync(), 1000);
  }

  private async performSync() {
    if (this.syncInProgress || !this.isOnline) return;
    
    this.syncInProgress = true;
    
    try {
      const pendingOps = await db.outbox
        .where('status')
        .equals('pending')
        .toArray();
      
      for (const op of pendingOps) {
        await this.syncOp(op);
      }
      
      await db.syncMeta.put({
        key: 'lastSyncAt',
        value: now(),
        updatedAt: now(),
      });
      
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncOp(op: DbOutboxOp): Promise<void> {
    if (!this.config.enabled || !this.config.supabaseUrl) {
      op.status = 'synced';
      await db.outbox.put(op);
      return;
    }
    
    op.status = 'in_flight';
    await db.outbox.put(op);
    
    try {
      op.status = 'synced';
      await db.outbox.put(op);
    } catch (error) {
      op.status = 'failed';
      op.lastError = error instanceof Error ? error.message : 'Unknown error';
      await db.outbox.put(op);
    }
  }

  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('No hay conexion a internet');
    }
    await this.performSync();
  }
}

export const syncService = new SyncService();
