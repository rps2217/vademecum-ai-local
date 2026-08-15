import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mocks: la replicación depende de supabase (cliente + config) y db (syncMeta).
// Testeamos la lógica de resiliencia (contador de fallos) sin tocar la red real.

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

/** Configura supabaseMock para que devuelva data vacía (éxito, 0 registros). */
function mockEmptySuccess() {
  supabaseMock.from.mockImplementation(() => ({
    select: () => ({
      eq: () => ({ gt: () => ({ range: () => ({ data: [], error: null }) }) }),
      range: () => ({ data: [], error: null }),
    }),
  }));
}

describe('ProductReplicator — resiliencia con contador de fallos', () => {
  it('un fallo de red transitorio NO desactiva la replicación (cuenta 1/3)', async () => {
    supabaseMock.from.mockImplementationOnce(() => {
      throw networkError();
    });

    const r = await replicateProducts();
    expect(r.skipped).toBe(true);
    expect(r.reason).toContain('Fallo de red');

    // El contador debe marcar 1, no desactivado.
    expect(metaStore.get('productReplicationFailures')).toBe(1);
    expect(metaStore.get('productReplicationDisabled')).toBeUndefined();
  });

  it('sigue reintentando tras 1 o 2 fallos (no cortocircuita)', async () => {
    // Fallo 1.
    supabaseMock.from.mockImplementationOnce(() => { throw networkError(); });
    await replicateProducts();
    expect(metaStore.get('productReplicationFailures')).toBe(1);

    // Fallo 2: debe volver a llamar a Supabase (no está desactivado).
    vi.clearAllMocks();
    (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (getSupabase as ReturnType<typeof vi.fn>).mockReturnValue(supabaseMock);
    supabaseMock.from.mockImplementationOnce(() => { throw networkError(); });
    await replicateProducts();
    expect(metaStore.get('productReplicationFailures')).toBe(2);
    expect(supabaseMock.from).toHaveBeenCalled();
  });

  it('desactiva tras 3 fallos consecutivos y entonces no llama a Supabase', async () => {
    // Llevamos el contador a 2.
    supabaseMock.from.mockImplementationOnce(() => { throw networkError(); });
    await replicateProducts();
    supabaseMock.from.mockImplementationOnce(() => { throw networkError(); });
    await replicateProducts();
    expect(metaStore.get('productReplicationFailures')).toBe(2);

    // Fallo 3 → alcanza el umbral (MAX_FAILURES = 3) → desactivado.
    vi.clearAllMocks();
    (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (getSupabase as ReturnType<typeof vi.fn>).mockReturnValue(supabaseMock);
    supabaseMock.from.mockImplementationOnce(() => { throw networkError(); });
    await replicateProducts();
    expect(metaStore.get('productReplicationFailures')).toBe(3);

    // Ahora la 4ª llamada NO debe llegar a Supabase (cortocircuito).
    vi.clearAllMocks();
    (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (getSupabase as ReturnType<typeof vi.fn>).mockReturnValue(supabaseMock);
    supabaseMock.from.mockImplementation(() => { throw new Error('NO DEBERÍA LLAMARSE'); });

    const r4 = await replicateProducts();
    expect(r4.skipped).toBe(true);
    expect(r4.reason).toContain('desactivada');
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it('forceReplicateProducts limpia el contador y reintenta aunque estuviera desactivado', async () => {
    // Llevamos a desactivado (3 fallos).
    for (let i = 0; i < 3; i++) {
      supabaseMock.from.mockImplementationOnce(() => { throw networkError(); });
      await replicateProducts();
    }
    expect(metaStore.get('productReplicationFailures')).toBe(3);

    // force limpia el contador y reintenta → éxito (data vacía).
    vi.clearAllMocks();
    (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (getSupabase as ReturnType<typeof vi.fn>).mockReturnValue(supabaseMock);
    mockEmptySuccess();

    const r = await forceReplicateProducts();
    expect(r.skipped).toBe(false);
    expect(supabaseMock.from).toHaveBeenCalled();
    // El contador queda limpio tras el éxito.
    expect(metaStore.get('productReplicationFailures')).toBeUndefined();
  });

  it('un éxito reinicia el contador de fallos', async () => {
    // Dos fallos previos.
    supabaseMock.from.mockImplementationOnce(() => { throw networkError(); });
    await replicateProducts();
    supabaseMock.from.mockImplementationOnce(() => { throw networkError(); });
    await replicateProducts();
    expect(metaStore.get('productReplicationFailures')).toBe(2);

    // Ahora éxito (data vacía) → el contador se limpia.
    vi.clearAllMocks();
    (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (getSupabase as ReturnType<typeof vi.fn>).mockReturnValue(supabaseMock);
    mockEmptySuccess();

    await replicateProducts();
    expect(metaStore.get('productReplicationFailures')).toBeUndefined();
  });

  it('rehabilita automáticamente si la URL de Supabase cambia', async () => {
    // Desactiva con URL A (3 fallos).
    import.meta.env.VITE_SUPABASE_URL = 'https://bad-project.supabase.co';
    for (let i = 0; i < 3; i++) {
      supabaseMock.from.mockImplementationOnce(() => { throw networkError(); });
      await replicateProducts();
    }
    expect(metaStore.get('productReplicationFailures')).toBe(3);

    // La URL cambia (corregida en Vercel) → debe reintentar.
    import.meta.env.VITE_SUPABASE_URL = 'https://good-project.supabase.co';
    vi.clearAllMocks();
    (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (getSupabase as ReturnType<typeof vi.fn>).mockReturnValue(supabaseMock);
    mockEmptySuccess();

    const r = await replicateProducts();
    expect(r.skipped).toBe(false);
    expect(supabaseMock.from).toHaveBeenCalled();
    // El contador se limpia tras el éxito.
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
