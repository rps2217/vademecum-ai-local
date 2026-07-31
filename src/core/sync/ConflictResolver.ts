/**
 * Conflict Resolver
 * 
 * Manejo de conflictos de sincronización usando Lamport Clocks
 * y estrategias de resolución configurables.
 */

import { db } from '@/db';
import { generateId, now } from '@/db/schema';
import type { DbConflict, SyncTable } from '@/db/schema';
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

/**
 * Resuelve conflictos de sincronización usando Lamport Clocks
 */
export class ConflictResolver {
  /**
   * Detecta si hay un conflicto entre versiones local y remota
   */
  static detectConflict(
    localLamport: number,
    remoteLamport: number,
    localUpdatedAt: number,
    remoteUpdatedAt: number
  ): boolean {
    // Conflicto si ambos tienen timestamps recientes y clocks diferentes
    const isRecent = (ts: number) => now() - ts < 60000; // 1 minuto
    return localLamport !== remoteLamport && isRecent(localUpdatedAt) && isRecent(remoteUpdatedAt);
  }

  /**
   * Registra un conflicto en la base de datos
   */
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
      localLamport: info.localLamport,
      remoteLamport: info.remoteLamport,
    });

    return conflict.id;
  }

  /**
   * Obtiene conflictos pendientes
   */
  static async getPendingConflicts(): Promise<DbConflict[]> {
    return db.conflicts
      .where('resolution')
      .equals('pending')
      .toArray();
  }

  /**
   * Obtiene conflictos para un registro específico
   */
  static async getConflictsForRecord(
    table: SyncTable,
    recordId: string
  ): Promise<DbConflict[]> {
    return db.conflicts
      .where('[table+recordId]')
      .equals([table, recordId])
      .toArray();
  }

  /**
   * Resuelve un conflicto usando la estrategia especificada
   */
  static async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution,
    mergedData?: Record<string, unknown>
  ): Promise<ConflictResolutionResult> {
    const conflict = await db.conflicts.get(conflictId);
    
    if (!conflict) {
      return {
        success: false,
        resolution: 'pending',
        error: 'Conflicto no encontrado',
      };
    }

    try {
      // Actualizar el conflicto con la resolución
      conflict.resolution = resolution;
      conflict.resolvedAt = now();

      if (resolution === 'local') {
        // Mantener versión local, descartar remota
        await this.applyLocalVersion(conflict);
      } else if (resolution === 'remote') {
        // Mantener versión remota, descartar local
        await this.applyRemoteVersion(conflict);
      } else if (resolution === 'merged' && mergedData) {
        // Aplicar datos mezclados
        await this.applyMergedVersion(conflict, mergedData);
      } else if (resolution !== 'pending') {
        return {
          success: false,
          resolution: 'pending',
          error: 'Estrategia de resolución no soportada',
        };
      }

      // Marcar conflicto como resuelto
      conflict.resolvedBy = 'user';
      await db.conflicts.put(conflict);

      logger.log('[ConflictResolver] Conflicto resuelto:', {
        id: conflictId,
        resolution,
      });

      return {
        success: true,
        resolution,
        mergedData,
      };
    } catch (error) {
      logger.error('[ConflictResolver] Error al resolver conflicto:', error);
      return {
        success: false,
        resolution: 'pending',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Aplica la versión local del conflicto
   */
  private static async applyLocalVersion(conflict: DbConflict): Promise<void> {
    // Actualizar el registro local con la versión local (no hacer nada, ya está)
    logger.log('[ConflictResolver] Aplicando versión local:', conflict.recordId);
  }

  /**
   * Aplica la versión remota del conflicto
   */
  private static async applyRemoteVersion(conflict: DbConflict): Promise<void> {
    const table = conflict.table;
    
    switch (table) {
      case 'ingredients':
        await db.ingredients.put({
          ...conflict.remoteVersion as any,
          updatedAt: now(),
          tombstone: 0,
        });
        break;
      case 'synergies':
        await db.synergies.put({
          ...conflict.remoteVersion as any,
          updatedAt: now(),
          tombstone: 0,
        });
        break;
      case 'products':
        await db.products.put({
          ...conflict.remoteVersion as any,
          updatedAt: now(),
          tombstone: 0,
        });
        break;
      case 'protocols':
        await db.protocols.put({
          ...conflict.remoteVersion as any,
          updatedAt: now(),
          tombstone: 0,
        });
        break;
    }
    
    logger.log('[ConflictResolver] Aplicando versión remota:', conflict.recordId);
  }

  /**
   * Aplica la versión mezclada del conflicto
   */
  private static async applyMergedVersion(
    conflict: DbConflict,
    mergedData: Record<string, unknown>
  ): Promise<void> {
    const table = conflict.table;
    
    switch (table) {
      case 'ingredients':
        await db.ingredients.put({
          ...mergedData as any,
          updatedAt: now(),
          tombstone: 0,
        });
        break;
      case 'synergies':
        await db.synergies.put({
          ...mergedData as any,
          updatedAt: now(),
          tombstone: 0,
        });
        break;
      case 'products':
        await db.products.put({
          ...mergedData as any,
          updatedAt: now(),
          tombstone: 0,
        });
        break;
      case 'protocols':
        await db.protocols.put({
          ...mergedData as any,
          updatedAt: now(),
          tombstone: 0,
        });
        break;
    }
    
    logger.log('[ConflictResolver] Aplicando versión mezclada:', conflict.recordId);
  }

  /**
   * Resuelve automáticamente conflictos simples usando Last-Write-Wins
   * con timestamp (para uso automático en background)
   */
  static async autoResolveSimpleConflict(
    conflictId: string
  ): Promise<ConflictResolutionResult> {
    const conflict = await db.conflicts.get(conflictId);
    
    if (!conflict) {
      return {
        success: false,
        resolution: 'pending',
        error: 'Conflicto no encontrado',
      };
    }

    // Solo resolver automáticamente si los datos son similares
    const localData = conflict.localVersion;
    const remoteData = conflict.remoteVersion;
    
    // Comparar solo campos que no sean timestamps o metadata
    const importantFields = ['nombre', 'categoria', 'indicaciones', 'propiedades'];
    const hasDifferences = importantFields.some(field => 
      JSON.stringify(localData[field]) !== JSON.stringify(remoteData[field])
    );

    if (!hasDifferences) {
      // Datos similares, resolver automáticamente con el más reciente
      const resolution = conflict.remoteVersion['updatedAt'] > conflict.localVersion['updatedAt']
        ? 'remote'
        : 'local';
      
      return this.resolveConflict(conflictId, resolution);
    }

    // Diferencias significativas, marcar como pendiente para resolución manual
    return {
      success: false,
      resolution: 'pending',
      error: 'Conflicto requiere resolución manual',
    };
  }

  /**
   * Limpia conflictos antiguos resueltos
   */
  static async pruneOldConflicts(olderThanMs: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    const cutoff = now() - olderThanMs;
    const oldConflicts = await db.conflicts
      .where('resolvedAt')
      .below(cutoff)
      .toArray();
    
    await db.conflicts.bulkDelete(oldConflicts.map(c => c.id));
    
    return oldConflicts.length;
  }
}
