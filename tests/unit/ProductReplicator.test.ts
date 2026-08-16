import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mocks: la replicación depende de supabase (cliente + config) y db (syncMeta).
// Testeamos la lógica de resiliencia counter-based sin tocar la red real.

const supabaseMock = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: vi.fn(() => true),
  getSupabase: vi.fn(() => supabaseMock),
}));

// Memoria para syncMeta (el replicador lee/escribe flags aquí).
const metaStore = new Map<string, unknown>();
const dbMock = {
  syncMeta: {
    get: vi.fn(async (key: string) => (metaStore.has(key) ? { key, value: metaStore.get(key) } : undefined)),
    put: vi.fn(async (entry: { key: string; value: unknown }) => {
      metaStore.set(entry.key, entry.value);
    }),
    bulkPut: vi.fn(async (entries: { key: string; value: unknown }[]) => {
      for (const e of entries) metaStore.set(e.key, e.value);
    }),
    delete: vi.fn(async (key: string) => {
      metaStore.delete(key);
    }),
  },
  products: { bulkPut: vi.fn(async () => {}) },
  productIngredients: { bulkPut: vi.fn(async () => {}) },
  productIngredientAnalysis: { bulkPut: vi.fn(async () => {}) },
};

vi.mock('@/db', () => ({ db: dbMock }));

// Importar DESPUÉS de mockear.
const { replicateProducts, forceReplicateProducts } = await import('@/core/sync/ProductReplicator');
const { isSupabaseConfigured, getSupabase } = await import('@/lib/supabase');

// Env var para que getSupabaseUrlSafe() devuelva una URL estable.
beforeEach(() => {
  metaStore.clear();
  vi.clearAllMocks();
  (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
  (getSupabase as ReturnType<typeof vi.fn>).mockReturnValue(supabaseMock);
  import.meta.env.VITE_SUPABASE_URL = 'https://test-project.supabase.co';
});
afterEach(() => {
  // @ts-expect-error cleanup
  delete import.meta.env.VITE_SUPABASE_URL;
});

function networkError(): TypeError {
  return new TypeError('Failed to fetch');
}

/** Mock que simula un fetch exitoso con 0 rows (para todas las tablas). */
function successMock() {
  return () => ({
    select: () => ({
      eq: () => ({
        gte: () => ({ range: () => ({ data: [], error: null }) }),
      }),
      range: () => ({ data: [], error: null }),
    }),
  });
}

describe('ProductReplicator — resiliencia counter-based', () => {
  it('un fallo de red transitorio NO desactiva la replicación (contador=1)', async () => {
    supabaseMock.from.mockImplementationOnce(() => {
      throw networkError();
    });

    const r1 = await replicateProducts();
    expect(r1.skipped).toBe(true);
    expect(r1.reason).toContain('Fallo de red');

    // El contador debe ser 1, no desactivado todavía.
    expect(metaStore.get('productReplicationFailures')).toBe(1);
    expect(metaStore.get('productReplicationDisabled')).toBeUndefined();
  });

  it('dos fallos consecutivos NO desactivan (contador=2, sigue intentando)', async () => {
    // 1er fallo
    supabaseMock.from.mockImplementationOnce(() => { throw networkError(); });
    await replicateProducts();
    expect(metaStore.get('productReplicationFailures')).toBe(1);

    // 2do fallo
    supabaseMock.from.mockImplementationOnce(() => { throw networkError(); });
    await replicateProducts();
    expect(metaStore.get('productReplicationFailures')).toBe(2);

    // Aún no está desactivado: el 3er intento debe llegar a Supabase.
    supabaseMock.from.mockImplementationOnce(() => { throw networkError(); });
    const r3 = await replicateProducts();
    expect(r3.skipped).toBe(true);
    expect(metaStore.get('productReplicationFailures')).toBe(3);
  });

  it('tras MAX_FAILURES (3) fallos consecutivos, la replicación se desactiva', async () => {
    // 3 fallos consecutivos
    for (let i = 0; i < 3; i++) {
      supabaseMock.from.mockImplementationOnce(() => { throw networkError(); });
      await replicateProducts();
    }
    expect(metaStore.get('productReplicationFailures')).toBe(3);

    // 4ta llamada: no debe llegar a Supabase (cortocircuito).
    vi.clearAllMocks();
    (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (getSupabase as ReturnType<typeof vi.fn>).mockReturnValue(supabaseMock);
    supabaseMock.from.mockImplementation(() => {
      throw new Error('NO DEBERÍA LLAMARSE');
    });

    const r4 = await replicateProducts();
    expect(r4.skipped).toBe(true);
    expect(r4.reason).toContain('desactivada');
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it('un éxito reinicia el contador a 0', async () => {
    // 2 fallos
    for (let i = 0; i < 2; i++) {
      supabaseMock.from.mockImplementationOnce(() => { throw networkError(); });
      await replicateProducts();
    }
    expect(metaStore.get('productReplicationFailures')).toBe(2);

    // Éxito (0 rows en todas las tablas)
    supabaseMock.from.mockImplementation(successMock());
    const r = await replicateProducts();
    expect(r.skipped).toBe(false);

    // El contador se reinicia
    expect(metaStore.get('productReplicationFailures')).toBeUndefined();
  });

  it('rehabilita automáticamente si la URL de Supabase cambia', async () => {
    // 3 fallos con URL A → desactivado
    import.meta.env.VITE_SUPABASE_URL = 'https://bad-project.supabase.co';
    for (let i = 0; i < 3; i++) {
      supabaseMock.from.mockImplementationOnce(() => { throw networkError(); });
      await replicateProducts();
    }
    expect(metaStore.get('productReplicationFailures')).toBe(3);

    // La URL cambia → debe reintentar aunque el contador sea 3.
    import.meta.env.VITE_SUPABASE_URL = 'https://good-project.supabase.co';
    supabaseMock.from.mockImplementation(successMock());

    const r = await replicateProducts();
    expect(r.skipped).toBe(false);
    expect(supabaseMock.from).toHaveBeenCalled();
    // Tras el éxito, el contador se limpia.
    expect(metaStore.get('productReplicationFailures')).toBeUndefined();
  });

  it('forceReplicateProducts reinicia el contador y reintenta siempre', async () => {
    // Desactivar tras 3 fallos
    for (let i = 0; i < 3; i++) {
      supabaseMock.from.mockImplementationOnce(() => { throw networkError(); });
      await replicateProducts();
    }
    expect(metaStore.get('productReplicationFailures')).toBe(3);

    // replicateProducts normal → skipped (desactivado)
    supabaseMock.from.mockImplementation(() => {
      throw new Error('NO DEBERÍA LLAMARSE');
    });
    const r1 = await replicateProducts();
    expect(r1.skipped).toBe(true);

    // forceReplicateProducts → limpia contador y reintenta
    vi.clearAllMocks();
    (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (getSupabase as ReturnType<typeof vi.fn>).mockReturnValue(supabaseMock);
    supabaseMock.from.mockImplementation(successMock());

    const r2 = await forceReplicateProducts();
    expect(r2.skipped).toBe(false);
    expect(supabaseMock.from).toHaveBeenCalled();
    expect(metaStore.get('productReplicationFailures')).toBeUndefined();
  });

  it('devuelve skipped sin tocar la red cuando Supabase no está configurado', async () => {
    (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const r = await replicateProducts();
    expect(r.skipped).toBe(true);
    expect(r.reason).toContain('no configurado');
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });
});
