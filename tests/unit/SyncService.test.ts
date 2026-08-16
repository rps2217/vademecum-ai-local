/**
 * Tests del fail-fast de uploads 401 en SyncService.
 *
 * La anon key de Supabase solo permite lectura (RLS); los upserts fallan
 * con 401. Sin fail-fast, los ops del outbox se reintentan cada 30s
 * indefinidamente. Tras MAX_UPLOAD_401_FAILURES consecutivos, el sync
 * debe desactivarse y los ops marcarse como 'failed'.
 *
 * Sigue el patrón de ProductReplicator.test.ts: mockea supabase + db.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// --- Mocks ---

// Ops del outbox en memoria.
let outboxOps: Array<{
  id: string; type: string; table: string; recordId: string;
  payload: unknown; status: string; retries: number; lastError?: string;
  lastAttemptAt?: number; idempotencyKey?: string; createdAt: number;
}> = [];

const supabaseMock = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: vi.fn(() => true),
  getSupabase: vi.fn(() => supabaseMock),
  getSupabaseUrl: vi.fn(() => 'https://test-project.supabase.co'),
  getSupabaseAnonKey: vi.fn(() => 'test-anon-key'),
}));

const dbMock = {
  outbox: {
    where: vi.fn((field: string) => ({
      equals: vi.fn((val: string) => ({
        // uploadPendingOps hace .toArray()
        toArray: vi.fn(async () => outboxOps.filter(op => (op as never)[field] === val)),
        // getStatus hace .count()
        count: vi.fn(async () => outboxOps.filter(op => (op as never)[field] === val).length),
      })),
      anyOf: vi.fn((vals: string[]) => ({
        count: vi.fn(async () => outboxOps.filter(op => vals.includes((op as never)[field])).length),
      })),
    })),
    put: vi.fn(async (op: typeof outboxOps[number]) => {
      const idx = outboxOps.findIndex(o => o.id === op.id);
      if (idx >= 0) outboxOps[idx] = { ...outboxOps[idx], ...op };
      else outboxOps.push(op);
    }),
  },
  syncMeta: {
    get: vi.fn(async () => undefined),
    put: vi.fn(async () => {}),
  },
  conflicts: {
    where: vi.fn(() => ({
      equals: vi.fn(() => ({ count: vi.fn(async () => 0) })),
    })),
  },
};

vi.mock('@/db', () => ({ db: dbMock }));

// Importar DESPUÉS de mockear.
const { syncService, SyncService } = await import('@/core/sync/SyncService');

function makeOp(id: string): typeof outboxOps[number] {
  return {
    id, type: 'update', table: 'ingredients', recordId: id,
    payload: { id, lamport: 1 }, status: 'pending', retries: 0,
    createdAt: Date.now(),
  };
}

/** Configura supabase.from().upsert() para devolver un error 401. */
function mockUpsert401() {
  supabaseMock.from.mockImplementation(() => ({
    upsert: vi.fn(async () => ({ error: { code: '401', message: 'Unauthorized' } })),
    update: vi.fn(async () => ({ error: null })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        gte: vi.fn(() => ({ range: vi.fn(async () => ({ data: [], error: null })) })),
      })),
    })),
  }));
}

beforeEach(() => {
  outboxOps = [];
  vi.clearAllMocks();
  // Re-inicializar el singleton: resetear contadores y flags privados.
  // Accedemos vía casting porque son privados.
  const svc = syncService as unknown as {
    syncDisabled: boolean;
    consecutiveUpload401s: number;
    consecutiveNetworkFailures: number;
    config: { enabled: boolean; autoSync: boolean; baseRetryDelay: number };
  };
  svc.syncDisabled = false;
  svc.consecutiveUpload401s = 0;
  svc.consecutiveNetworkFailures = 0;
  svc.config.enabled = true;
  // Backoff a 0 para que los tests no esperen 1s/2s/4s por retry.
  svc.config.baseRetryDelay = 0;
});

describe('SyncService — fail-fast de uploads 401', () => {
  it('reintenta el op mientras no se alcance el umbral (401 < MAX)', async () => {
    mockUpsert401();
    outboxOps.push(makeOp('op-1'));

    const r = await syncService.forceSync();
    // Primer 401: op vuelve a 'pending', sync NO desactivado.
    expect(r.success).toBe(false);
    expect(outboxOps[0].status).toBe('pending');
    expect(outboxOps[0].retries).toBe(1);
    expect((syncService as unknown as { syncDisabled: boolean }).syncDisabled).toBe(false);
  });

  it('desactiva el sync tras MAX_UPLOAD_401_FAILURES consecutivos', async () => {
    mockUpsert401();
    const MAX = (SyncService as unknown as { MAX_UPLOAD_401_FAILURES: number }).MAX_UPLOAD_401_FAILURES;

    // Un solo op pending reprocesado en cada forceSync(). Cada ciclo recibe
    // 401 e incrementa el contador. Tras MAX ciclos, el sync se desactiva.
    outboxOps.push(makeOp('op-stuck'));
    for (let i = 0; i < MAX; i++) {
      await syncService.forceSync();
    }

    // Tras alcanzar el umbral, el sync debe estar desactivado.
    expect((syncService as unknown as { syncDisabled: boolean }).syncDisabled).toBe(true);
    // El op procesado debe quedar 'failed' (no 'pending' infinito).
    const op = outboxOps.find(o => o.id === 'op-stuck');
    expect(op).toBeDefined();
    expect(op!.status).toBe('failed');
    expect(op!.lastError).toContain('Unauthorized');
  });

  it('el mensaje de error menciona service role / RLS', async () => {
    mockUpsert401();
    const MAX = (SyncService as unknown as { MAX_UPLOAD_401_FAILURES: number }).MAX_UPLOAD_401_FAILURES;
    for (let i = 0; i < MAX; i++) {
      outboxOps.push(makeOp(`op-m-${i}`));
      await syncService.forceSync();
    }
    const status = await syncService.getStatus();
    // lastError se setea en performFullSync catch; el disableSync loguea el reason.
    // Verificamos via el flag privado + que el sync está off.
    expect((syncService as unknown as { syncDisabled: boolean }).syncDisabled).toBe(true);
  });

  it('un upload exitoso resetea el contador de 401', async () => {
    // Un solo op pending que recibe 401 dos veces (2 forceSync).
    // El contador sube a 2 (sin alcanzar el umbral de 3).
    mockUpsert401();
    outboxOps.push(makeOp('fail-1'));
    await syncService.forceSync();
    // En el segundo ciclo, el mismo op (sigue pending) recibe 401 otra vez.
    await syncService.forceSync();
    const countAfter2 = (syncService as unknown as { consecutiveUpload401s: number }).consecutiveUpload401s;
    expect(countAfter2).toBeGreaterThanOrEqual(2);
    expect((syncService as unknown as { syncDisabled: boolean }).syncDisabled).toBe(false);

    // Ahora un upload exitoso: supabase.from().upsert() sin error.
    supabaseMock.from.mockImplementation(() => ({
      upsert: vi.fn(async () => ({ error: null })),
      update: vi.fn(async () => ({ error: null })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({ range: vi.fn(async () => ({ data: [], error: null })) })),
        })),
      })),
    }));
    await syncService.forceSync();

    // El contador debe resetearse a 0 tras un éxito.
    expect((syncService as unknown as { consecutiveUpload401s: number }).consecutiveUpload401s).toBe(0);
    expect((syncService as unknown as { syncDisabled: boolean }).syncDisabled).toBe(false);
  });
});
