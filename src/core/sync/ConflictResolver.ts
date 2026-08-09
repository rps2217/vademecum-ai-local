/**
 * Conflict Resolver
 * 
 * Manejo de conflictos de sincronización usando Lamport Clocks.
 */

import { db } from '@/db';
import { generateId, now } from '@/db/schema';
import type { DbConflict, DbIngredient, DbSynergy, DbProduct, DbProtocol, SyncTable } from '@/db/schema';
import { logger } from '@/lib/logger';

export type ConflictResolution = 'local' | 'remote' | 'merged' | 'pending';

export interface ConflictInfo {
  table: SyncTable;
  recordId: string;
  localVersion: Record<string, unknown>;
  remoteVersion: Record<string, unknown>;
  localLamport: number;
  remoteLamport: number;
}

export interface ConflictResolutionResult {
  success: boolean;
  resolution: ConflictResolution;
  mergedData?: Record<string, unknown>;
  error?: string;
}

export class ConflictResolver {
  static detectConflict(
    localLamport: number,
    remoteLamport: number,
    localUpdatedAt: number,
    remoteUpdatedAt: number
  ): boolean {
    const isRecent = (ts: number) => now() - ts < 60000;
    return localLamport !== remoteLamport && isRecent(localUpdatedAt) && isRecent(remoteUpdatedAt);
  }

  static async registerConflict(info: ConflictInfo): Promise<string> {
    const conflict: DbConflict = {
      id: generateId(),
      table: info.table,
      recordId: info.recordId,
      localVersion: info.localVersion,
      remoteVersion: info.remoteVersion,
      localLamport: info.localLamport,
      remoteLamport: info.remoteLamport,
      detectedAt: now(),
      resolution: 'pending',
    };

    await db.conflicts.put(conflict);
    logger.warn('[ConflictResolver] Conflicto detectado:', {
      table: info.table,
      recordId: info.recordId,
    });

    return conflict.id;
  }

  static async getPendingConflicts(): Promise<DbConflict[]> {
    return db.conflicts
      .where('resolution')
      .equals('pending')
      .toArray();
  }

  static async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution,
    mergedData?: Record<string, unknown>
  ): Promise<ConflictResolutionResult> {
    const conflict = await db.conflicts.get(conflictId);
    
    if (!conflict) {
      return { success: false, resolution: 'pending', error: 'Conflicto no encontrado' };
    }

    try {
      conflict.resolution = resolution;
      conflict.resolvedAt = now();

      if (resolution === 'local') {
        // No hacer nada, versión local ya está en DB
      } else if (resolution === 'remote' || resolution === 'merged') {
        const data = resolution === 'remote' ? conflict.remoteVersion : mergedData;
        if (data) {
          await this.applyRemoteData(conflict.table, data as Record<string, unknown>);
        }
      }

      conflict.resolvedBy = 'user';
      await db.conflicts.put(conflict);
      logger.log('[ConflictResolver] Conflicto resuelto:', { id: conflictId, resolution });

      return { success: true, resolution, mergedData };
    } catch (error) {
      logger.error('[ConflictResolver] Error al resolver conflicto:', error);
      return {
        success: false,
        resolution: 'pending',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  private static async applyRemoteData(
    table: SyncTable,
    data: Record<string, unknown>
  ): Promise<void> {
    const record = { ...data, updatedAt: now(), tombstone: 0 } as Record<string, unknown>;
    switch (table) {
      case 'ingredients':
        await db.ingredients.put(record as unknown as DbIngredient);
        break;
      case 'synergies':
        await db.synergies.put(record as unknown as DbSynergy);
        break;
      case 'products':
        await db.products.put(record as unknown as DbProduct);
        break;
      case 'protocols':
        await db.protocols.put(record as unknown as DbProtocol);
        break;
      case 'settings':
        logger.warn('[ConflictResolver] settings table no soportada en applyRemoteData');
        break;
    }
  }
}
