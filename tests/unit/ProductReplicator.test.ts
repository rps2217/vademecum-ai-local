import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mocks: la replicación depende de supabase (cliente + config) y db (syncMeta).
// Testeamos la lógica de fail-fast sin tocar la red real.

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
const { replicateProducts } = await import('@/core/sync/ProductReplicator');
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

describe('ProductReplicator — fail-fast por fallo de red', () => {
  it('marca la replicación como desactivada tras un fallo de red y la recuerda', async () => {
    // El primer fetch a products lanza TypeError (DNS/host inalcanzable).
    supabaseMock.from.mockImplementationOnce(() => {
      throw networkError();
    });

    const r1 = await replicateProducts();
    expect(r1.skipped).toBe(true);
    expect(r1.reason).toContain('Fallo de red');

    // El flag debe quedar persistido en syncMeta.
    expect(dbMock.syncMeta.bulkPut).toHaveBeenCalled();
    expect(metaStore.get('productReplicationDisabled')).toBe(true);
  });

  it('no reintenta tras marcar desactivado (devuelve skipped sin llamar a Supabase)', async () => {
    supabaseMock.from.mockImplementationOnce(() => {
      throw networkError();
    });
    await replicateProducts();

    // Segunda llamada: no debe llegar a supabaseMock.from (cortocircuito).
    vi.clearAllMocks();
    (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (getSupabase as ReturnType<typeof vi.fn>).mockReturnValue(supabaseMock);
    supabaseMock.from.mockImplementation(() => {
      throw new Error('NO DEBERÍA LLAMARSE');
    });

    const r2 = await replicateProducts();
    expect(r2.skipped).toBe(true);
    expect(r2.reason).toContain('desactivada');
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it('rehabilita automáticamente si la URL de Supabase cambia', async () => {
    // Primero falla y se desactiva con URL A.
    import.meta.env.VITE_SUPABASE_URL = 'https://bad-project.supabase.co';
    supabaseMock.from.mockImplementationOnce(() => {
      throw networkError();
    });
    await replicateProducts();
    expect(metaStore.get('productReplicationDisabled')).toBe(true);

    // Ahora la URL cambia (p. ej. corregida en Vercel) → debe reintentar.
    import.meta.env.VITE_SUPABASE_URL = 'https://good-project.supabase.co';
    // El siguiente fetch devuelve 0 rows (data vacía) → éxito, sin excepción.
    supabaseMock.from.mockImplementationOnce(() => ({
      select: () => ({ eq: () => ({ gt: () => ({ range: () => ({ data: [], error: null }) }) }) }),
    }));
    // Bridge y analysis también vacíos.
    supabaseMock.from.mockImplementation(() => ({
      select: () => ({ range: () => ({ data: [], error: null }) }),
    }));

    const r2 = await replicateProducts();
    expect(r2.skipped).toBe(false);
    expect(supabaseMock.from).toHaveBeenCalled();
    // El flag de desactivado se limpia tras el éxito.
    expect(metaStore.get('productReplicationDisabled')).toBeUndefined();
  });

  it('devuelve skipped sin tocar la red cuando Supabase no está configurado', async () => {
    (isSupabaseConfigured as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const r = await replicateProducts();
    expect(r.skipped).toBe(true);
    expect(r.reason).toContain('no configurado');
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });
});
