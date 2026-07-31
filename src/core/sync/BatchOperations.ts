/**
 * Batch Operations
 * 
 * Utilidades para operaciones en lote con Supabase.
 * Mejora el rendimiento del sync al reducir round-trips.
 */

import { getSupabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { DbOutboxOp, SyncTable } from '@/db/schema';

export interface BatchResult {
  success: number;
  failed: number;
  errors: Array<{ opId: string; error: string }>;
}

/**
 * Ejecuta operaciones en batch a Supabase
 */
export class BatchOperations {
  private static readonly BATCH_SIZE = 50; // Máximo de operaciones por batch

  /**
   * Procesa operaciones pendientes en batches
   */
  static async processBatch(
    ops: DbOutboxOp[]
  ): Promise<BatchResult> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: 0, failed: ops.length, errors: ops.map(op => ({ opId: op.id, error: 'Supabase no configurado' })) };
    }

    const result: BatchResult = { success: 0, failed: 0, errors: [] };

    // Dividir en batches
    const batches = this.splitIntoBatches(ops, this.BATCH_SIZE);

    for (const batch of batches) {
      const batchResult = await this.executeBatch(supabase, batch);
      result.success += batchResult.success;
      result.failed += batchResult.failed;
      result.errors.push(...batchResult.errors);
    }

    return result;
  }

  /**
   * Divide un array en batches
   */
  private static splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Ejecuta un batch de operaciones
   */
  private static async executeBatch(
    supabase: ReturnType<typeof getSupabase>,
    ops: DbOutboxOp[]
  ): Promise<BatchResult> {
    if (!supabase) {
      return { success: 0, failed: ops.length, errors: ops.map(op => ({ opId: op.id, error: 'Supabase no inicializado' })) };
    }

    const result: BatchResult = { success: 0, failed: 0, errors: [] };

    // Agrupar operaciones por tipo y tabla
    const inserts = ops.filter(op => op.type === 'insert');
    const updates = ops.filter(op => op.type === 'update');
    const deletes = ops.filter(op => op.type === 'delete');

    // Procesar inserts en batch
    for (const table of [...new Set(inserts.map(op => op.table))]) {
      const tableInserts = inserts.filter(op => op.table === table);
      const batchResult = await this.batchUpsert(supabase, table, tableInserts);
      result.success += batchResult.success;
      result.failed += batchResult.failed;
      result.errors.push(...batchResult.errors);
    }

    // Procesar updates en batch
    for (const table of [...new Set(updates.map(op => op.table))]) {
      const tableUpdates = updates.filter(op => op.table === table);
      const batchResult = await this.batchUpsert(supabase, table, tableUpdates);
      result.success += batchResult.success;
      result.failed += batchResult.failed;
      result.errors.push(...batchResult.errors);
    }

    // Procesar deletes
    for (const table of [...new Set(deletes.map(op => op.table))]) {
      const tableDeletes = deletes.filter(op => op.table === table);
      const batchResult = await this.batchDelete(supabase, table, tableDeletes);
      result.success += batchResult.success;
      result.failed += batchResult.failed;
      result.errors.push(...batchResult.errors);
    }

    return result;
  }

  /**
   * Realiza upsert en batch para una tabla
   */
  private static async batchUpsert(
    supabase: ReturnType<typeof getSupabase>,
    table: SyncTable,
    ops: DbOutboxOp[]
  ): Promise<BatchResult> {
    if (!supabase || ops.length === 0) {
      return { success: 0, failed: ops.length, errors: ops.map(op => ({ opId: op.id, error: 'No hay operaciones' })) };
    }

    try {
      // Preparar payloads
      const payloads = ops.map(op => this.toSnakeCase(op.payload as Record<string, unknown>));

      // Añadir idempotency keys si están disponibles
      const headers: Record<string, string> = {};
      const firstOpWithKey = ops.find(op => op.idempotencyKey);
      if (firstOpWithKey?.idempotencyKey) {
        headers['x-idempotency-key'] = firstOpWithKey.idempotencyKey;
      }

      // Ejecutar bulk upsert
      const { data, error } = await supabase
        .from(table)
        .upsert(payloads, { onConflict: 'id' });

      if (error) {
        // Si el error es de bulk, intentar uno por uno
        if (error.code === '23505') {
          return this.fallbackToIndividualUpsert(supabase, table, ops);
        }
        
        logger.error(`[BatchOps] Error en batch upsert para ${table}:`, error);
        return {
          success: 0,
          failed: ops.length,
          errors: ops.map(op => ({ opId: op.id, error: error.message })),
        };
      }

      return {
        success: ops.length,
        failed: 0,
        errors: [],
      };
    } catch (err) {
      logger.error(`[BatchOps] Excepción en batch upsert para ${table}:`, err);
      return {
        success: 0,
        failed: ops.length,
        errors: ops.map(op => ({ opId: op.id, error: err instanceof Error ? err.message : 'Error desconocido' })),
      };
    }
  }

  /**
   * Fallback: upsert uno por uno si el bulk falla
   */
  private static async fallbackToIndividualUpsert(
    supabase: ReturnType<typeof getSupabase>,
    table: SyncTable,
    ops: DbOutboxOp[]
  ): Promise<BatchResult> {
    if (!supabase) {
      return { success: 0, failed: ops.length, errors: ops.map(op => ({ opId: op.id, error: 'Supabase no inicializado' })) };
    }

    const result: BatchResult = { success: 0, failed: 0, errors: [] };

    for (const op of ops) {
      try {
        const payload = this.toSnakeCase(op.payload as Record<string, unknown>);
        const { error } = await supabase
          .from(table)
          .upsert(payload, { onConflict: 'id' });

        if (error) {
          result.failed++;
          result.errors.push({ opId: op.id, error: error.message });
        } else {
          result.success++;
        }
      } catch (err) {
        result.failed++;
        result.errors.push({ opId: op.id, error: err instanceof Error ? err.message : 'Error desconocido' });
      }
    }

    return result;
  }

  /**
   * Realiza deletes en batch
   */
  private static async batchDelete(
    supabase: ReturnType<typeof getSupabase>,
    table: SyncTable,
    ops: DbOutboxOp[]
  ): Promise<BatchResult> {
    if (!supabase || ops.length === 0) {
      return { success: 0, failed: ops.length, errors: ops.map(op => ({ opId: op.id, error: 'No hay operaciones' })) };
    }

    try {
      const ids = ops.map(op => op.recordId);
      
      const { data, error } = await supabase
        .from(table)
        .update({ tombstone: 1, updated_at: new Date().toISOString() })
        .in('id', ids);

      if (error) {
        logger.error(`[BatchOps] Error en batch delete para ${table}:`, error);
        return {
          success: 0,
          failed: ops.length,
          errors: ops.map(op => ({ opId: op.id, error: error.message })),
        };
      }

      return {
        success: ops.length,
        failed: 0,
        errors: [],
      };
    } catch (err) {
      logger.error(`[BatchOps] Excepción en batch delete para ${table}:`, err);
      return {
        success: 0,
        failed: ops.length,
        errors: ops.map(op => ({ opId: op.id, error: err instanceof Error ? err.message : 'Error desconocido' })),
      };
    }
  }

  /**
   * Convierte claves de camelCase a snake_case
   */
  private static toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      result[snakeKey] = value;
    }
    return result;
  }

  /**
   * Descarga datos remotos en batches
   */
  static async downloadBatch<T>(
    table: string,
    lastSyncDate: string,
    batchSize: number = 100,
    onBatch: (data: T[]) => Promise<void>
  ): Promise<{ success: boolean; total: number; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, total: 0, error: 'Supabase no configurado' };
    }

    let total = 0;
    let hasMore = true;
    let lastId: string | undefined;

    try {
      while (hasMore) {
        let query = supabase
          .from(table)
          .select('*')
          .eq('tombstone', 0)
          .gte('updated_at', lastSyncDate)
          .order('updated_at')
          .limit(batchSize);

        if (lastId) {
          query = query.gt('updated_at', lastId);
        }

        const { data, error } = await query;

        if (error) {
          if (error.code === 'PGRST204' || error.message?.includes('column')) {
            logger.warn(`[BatchOps] Schema mismatch en ${table}`);
            return { success: true, total, error: 'Schema mismatch' };
          }
          throw error;
        }

        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }

        await onBatch(data as T[]);
        total += data.length;
        lastId = data[data.length - 1].updated_at as string;

        if (data.length < batchSize) {
          hasMore = false;
        }
      }

      return { success: true, total };
    } catch (err) {
      logger.error(`[BatchOps] Error descargando ${table}:`, err);
      return { 
        success: false, 
        total, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
    }
  }
}
