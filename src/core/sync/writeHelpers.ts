/**
 * Write Helpers — capa fina sobre Dexie que encola ops de sync.
 *
 * Todas las escrituras de entidades sincronizables (ingredients, synergies,
 * products, protocols) deben pasar por aquí para que los cambios locales se
 * propaguen al backend (Supabase) cuando el sync esté activado.
 *
 * Si el sync no está configurado, los ops quedan en el outbox como pendientes
 * (no hacen daño) y se procesan si el usuario activa el sync más adelante.
 */

import { db } from '@/db';
import { nextLamport, getDeviceId, now } from '@/db/schema';
import type { DbIngredient, DbSynergy, DbProduct, DbProtocol, SyncTable } from '@/db/schema';
import { syncService } from './SyncService';
import { logger } from '@/lib/logger';

function withSyncMeta<T extends { lamport?: number; deviceId?: string; updatedAt?: number }>(
  record: T
): T {
  return {
    ...record,
    lamport: record.lamport ?? nextLamport(),
    deviceId: record.deviceId ?? getDeviceId(),
    updatedAt: now(),
  };
}

async function enqueue(table: SyncTable, recordId: string, type: 'insert' | 'update' | 'delete', payload: unknown): Promise<void> {
  try {
    await syncService.addToOutbox(type, table, recordId, payload);
  } catch (err) {
    // El sync es best-effort: no bloquear la escritura local si falla el encolado.
    logger.warn('[writeHelpers] No se pudo encolar op de sync:', err);
  }
}

export async function saveIngredient(ingredient: DbIngredient): Promise<void> {
  const record = withSyncMeta(ingredient);
  await db.ingredients.put(record);
  await enqueue('ingredients', record.id, 'update', record);
}

export async function deleteIngredient(id: string): Promise<void> {
  const updatedAt = now();
  await db.ingredients.update(id, { tombstone: 1, updatedAt });
  await enqueue('ingredients', id, 'delete', { id, tombstone: 1, updatedAt });
}

export async function saveSynergy(synergy: DbSynergy): Promise<void> {
  const record = withSyncMeta(synergy);
  await db.synergies.put(record);
  await enqueue('synergies', record.id, 'update', record);
}

export async function deleteSynergy(id: string): Promise<void> {
  const updatedAt = now();
  await db.synergies.update(id, { tombstone: 1, updatedAt });
  await enqueue('synergies', id, 'delete', { id, tombstone: 1, updatedAt });
}

export async function saveProduct(product: DbProduct): Promise<void> {
  const record = withSyncMeta(product);
  await db.products.put(record);
  await enqueue('products', record.sku, 'update', record);
}

export async function saveProtocol(protocol: DbProtocol): Promise<void> {
  const record = withSyncMeta(protocol);
  await db.protocols.put(record);
  await enqueue('protocols', record.id, 'update', record);
}
