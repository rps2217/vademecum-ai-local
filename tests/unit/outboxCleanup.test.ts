import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db';
import { syncService } from '@/core/sync/SyncService';
import type { DbOutboxOp } from '@/db/schema';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function makeOp(overrides: Partial<DbOutboxOp> & { id: string; status: DbOutboxOp['status'] }): DbOutboxOp {
  return {
    type: 'update',
    table: 'ingredients',
    recordId: overrides.id,
    payload: { id: overrides.id, nombre: 'test' },
    retries: 0,
    createdAt: Date.now(),
    status: 'pending',
    lastAttemptAt: Date.now(),
    idempotencyKey: overrides.id,
    ...overrides,
  };
}

// cleanupStaleOutboxOps es private; lo accedemos para test directo.
const cleanup = () => (syncService as unknown as { cleanupStaleOutboxOps: () => Promise<number> }).cleanupStaleOutboxOps();

describe('SyncService — cleanupStaleOutboxOps', () => {
  beforeEach(async () => {
    await db.outbox.clear();
  });

  it('borra ops synced older than 1 hour', async () => {
    const oldSynced = makeOp({ id: 'old-synced', status: 'synced', lastAttemptAt: Date.now() - 2 * HOUR });
    const freshSynced = makeOp({ id: 'fresh-synced', status: 'synced', lastAttemptAt: Date.now() - 5 * 60 * 1000 });
    await db.outbox.bulkPut([oldSynced, freshSynced]);

    const purged = await cleanup();

    expect(purged).toBe(1);
    const remaining = await db.outbox.toArray();
    expect(remaining.map(o => o.id)).toEqual(['fresh-synced']);
  });

  it('borra ops failed older than 24 hours', async () => {
    const oldFailed = makeOp({ id: 'old-failed', status: 'failed', retries: 3, lastAttemptAt: Date.now() - 25 * HOUR });
    const freshFailed = makeOp({ id: 'fresh-failed', status: 'failed', retries: 1, lastAttemptAt: Date.now() - 2 * HOUR });
    await db.outbox.bulkPut([oldFailed, freshFailed]);

    const purged = await cleanup();

    expect(purged).toBe(1);
    const remaining = await db.outbox.toArray();
    expect(remaining.map(o => o.id)).toEqual(['fresh-failed']);
  });

  it('preserva ops pending y conflict (nunca se purgan)', async () => {
    const oldPending = makeOp({ id: 'old-pending', status: 'pending', lastAttemptAt: Date.now() - 48 * HOUR });
    const oldConflict = makeOp({ id: 'old-conflict', status: 'conflict', lastAttemptAt: Date.now() - 48 * HOUR });
    await db.outbox.bulkPut([oldPending, oldConflict]);

    const purged = await cleanup();

    expect(purged).toBe(0);
    const remaining = await db.outbox.toArray();
    expect(remaining.length).toBe(2);
  });

  it('usa createdAt como fallback si lastAttemptAt es undefined', async () => {
    const oldSyncedNoAttempt = makeOp({
      id: 'old-no-attempt',
      status: 'synced',
      createdAt: Date.now() - 3 * HOUR,
      lastAttemptAt: undefined,
    });
    await db.outbox.put(oldSyncedNoAttempt);

    const purged = await cleanup();

    expect(purged).toBe(1);
    expect(await db.outbox.count()).toBe(0);
  });

  it('no borra ops synced frescos aunque createdAt sea viejo', async () => {
    // createdAt viejo pero lastAttemptAt fresco (retry exitoso reciente)
    const op = makeOp({
      id: 'retry-success',
      status: 'synced',
      createdAt: Date.now() - 5 * HOUR,
      lastAttemptAt: Date.now() - 10 * 60 * 1000,
    });
    await db.outbox.put(op);

    const purged = await cleanup();

    expect(purged).toBe(0);
    expect(await db.outbox.count()).toBe(1);
  });

  it('devuelve 0 y no hace nada con outbox vacío', async () => {
    const purged = await cleanup();
    expect(purged).toBe(0);
  });

  it('mezcla: purga solo los stale, conserva el resto', async () => {
    const ops = [
      makeOp({ id: 'synced-old', status: 'synced', lastAttemptAt: Date.now() - 2 * HOUR }),
      makeOp({ id: 'synced-fresh', status: 'synced', lastAttemptAt: Date.now() - 10 * 60 * 1000 }),
      makeOp({ id: 'failed-old', status: 'failed', lastAttemptAt: Date.now() - 26 * HOUR }),
      makeOp({ id: 'failed-fresh', status: 'failed', lastAttemptAt: Date.now() - 5 * HOUR }),
      makeOp({ id: 'pending-old', status: 'pending', lastAttemptAt: Date.now() - 48 * HOUR }),
    ];
    await db.outbox.bulkPut(ops);

    const purged = await cleanup();

    expect(purged).toBe(2);
    const remaining = (await db.outbox.toArray()).map(o => o.id).sort();
    expect(remaining).toEqual(['failed-fresh', 'pending-old', 'synced-fresh']);
  });
});
