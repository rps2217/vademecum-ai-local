import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DbIngredient, DbSynergy } from '@/db/schema';
import type { SafetyVerdict } from '@/contexts/ClientProfileContext';

// Mock de db.synergies (findInteractions consulta el índice ingredienteA).
const synergiesStore: DbSynergy[] = [];
const dbMock = {
  synergies: {
    where: vi.fn((field: string) => ({
      anyOf: vi.fn((ids: string[]) => {
        if (field !== 'ingredienteA') return { toArray: async () => [] };
        return {
          toArray: async () => synergiesStore.filter((s) => ids.includes(s.ingredienteA)),
        };
      }),
    })),
  },
};

vi.mock('@/db', () => ({ db: dbMock }));

const {
  findInteractions,
  evaluateWarnings,
  findUntestedPairs,
  isBeneficial,
  isRisky,
} = await import('@/core/analysis/InteractionChecker');

function makeSynergy(overrides: Partial<DbSynergy> = {}): DbSynergy {
  return {
    id: 'syn-1',
    ingredienteA: 'valeriana',
    ingredienteB: 'pasiflora',
    tipo: 'sinergia',
    nivel: 'medio',
    evidencia: 'B',
    fuentes: [],
    lamport: 0,
    deviceId: 'test',
    updatedAt: 1,
    tombstone: 0,
    ...overrides,
  };
}

function makeIngredient(overrides: Partial<DbIngredient> = {}): DbIngredient {
  return {
    id: 'valeriana',
    nombre: 'Valeriana',
    sinonimos: [],
    categoria: 'fitoterapia',
    sistemas: ['nervioso'],
    indicaciones: ['insomnio'],
    evidencia: 'B',
    propiedades: [],
    interacciones: [],
    fuentes: [],
    lamport: 0,
    deviceId: 'test',
    updatedAt: 1,
    createdAt: 1,
    tombstone: 0,
    ...overrides,
  };
}

beforeEach(() => {
  synergiesStore.length = 0;
  vi.clearAllMocks();
});

describe('InteractionChecker — findInteractions', () => {
  it('devuelve [] si hay menos de 2 ingredientes', async () => {
    expect(await findInteractions([])).toEqual([]);
    expect(await findInteractions(['valeriana'])).toEqual([]);
  });

  it('devuelve solo relaciones donde AMBOS ingredientes están en el conjunto', async () => {
    // valeriana↔pasiflora (ambos en conjunto) + valeriana↔melisa (melisa fuera)
    synergiesStore.push(
      makeSynergy({ id: 'syn-1', ingredienteA: 'valeriana', ingredienteB: 'pasiflora' }),
      makeSynergy({ id: 'syn-2', ingredienteA: 'valeriana', ingredienteB: 'melisa' }),
    );
    const result = await findInteractions(['valeriana', 'pasiflora']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('syn-1');
  });

  it('excluye sinergias con tombstone=1 (soft-deleted)', async () => {
    synergiesStore.push(
      makeSynergy({ id: 'syn-1', ingredienteA: 'valeriana', ingredienteB: 'pasiflora', tombstone: 1 }),
    );
    const result = await findInteractions(['valeriana', 'pasiflora']);
    expect(result).toEqual([]);
  });

  it('encuentra relaciones en ambas direcciones (A→B y B→A)', async () => {
    synergiesStore.push(
      makeSynergy({ id: 'syn-1', ingredienteA: 'valeriana', ingredienteB: 'pasiflora' }),
      makeSynergy({ id: 'syn-2', ingredienteA: 'pasiflora', ingredienteB: 'valeriana' }),
    );
    const result = await findInteractions(['valeriana', 'pasiflora']);
    expect(result).toHaveLength(2);
  });
});

describe('InteractionChecker — evaluateWarnings', () => {
  const evalFn = (verdict: SafetyVerdict | null) =>
    (_ing: DbIngredient): SafetyVerdict | null => verdict;

  it('devuelve [] si todos los ingredientes son aptos o null', () => {
    const ings = [makeIngredient({ id: 'a', nombre: 'A' }), makeIngredient({ id: 'b', nombre: 'B' })];
    expect(evaluateWarnings(ings, evalFn('apto'))).toEqual([]);
    expect(evaluateWarnings(ings, evalFn(null))).toEqual([]);
  });

  it('genera warning de precaución para ingredientes no-aptos', () => {
    const ings = [makeIngredient({ id: 'a', nombre: 'Arnica' })];
    const warnings = evaluateWarnings(ings, evalFn('precaucion'));
    expect(warnings).toHaveLength(1);
    expect(warnings[0].verdict).toBe('precaucion');
    expect(warnings[0].ingredientName).toBe('Arnica');
    expect(warnings[0].reason).toContain('Precaución');
  });

  it('genera warning de contraindicación con el reason correcto', () => {
    const ings = [makeIngredient({ id: 'a', nombre: 'Efedra' })];
    const warnings = evaluateWarnings(ings, evalFn('contraindicado'));
    expect(warnings).toHaveLength(1);
    expect(warnings[0].verdict).toBe('contraindicado');
    expect(warnings[0].reason).toContain('Contraindicado');
  });

  it('mezcla aptos y no-aptos: solo devuelve los no-aptos', () => {
    const ings = [
      makeIngredient({ id: 'a', nombre: 'Apto' }),
      makeIngredient({ id: 'b', nombre: 'Precaución' }),
      makeIngredient({ id: 'c', nombre: 'Contraindicado' }),
    ];
    // evalFn devuelve verdict según el nombre del ingrediente
    const dynamicEval = (ing: DbIngredient): SafetyVerdict | null => {
      if (ing.nombre === 'Apto') return 'apto';
      if (ing.nombre === 'Precaución') return 'precaucion';
      if (ing.nombre === 'Contraindicado') return 'contraindicado';
      return null;
    };
    const warnings = evaluateWarnings(ings, dynamicEval);
    expect(warnings).toHaveLength(2);
    expect(warnings.map((w) => w.verdict)).toEqual(['precaucion', 'contraindicado']);
  });
});

describe('InteractionChecker — findUntestedPairs', () => {
  it('devuelve todos los pares si no hay relaciones encontradas', () => {
    const ids = ['a', 'b', 'c'];
    const untested = findUntestedPairs(ids, []);
    // C(3,2) = 3 pares
    expect(untested).toHaveLength(3);
  });

  it('excluye pares que ya tienen relación conocida (orden-independiente)', () => {
    const ids = ['a', 'b', 'c'];
    const found = [
      makeSynergy({ ingredienteA: 'a', ingredienteB: 'b' }),
      makeSynergy({ ingredienteA: 'c', ingredienteB: 'a' }), // orden inverso
    ];
    const untested = findUntestedPairs(ids, found);
    // a-b y a-c están testeados → solo queda b-c
    expect(untested).toHaveLength(1);
    // El par restante debe ser [b, c] (ordenado)
    const pair = untested[0].sort();
    expect(pair).toEqual(['b', 'c']);
  });

  it('devuelve [] si todos los pares están testeados', () => {
    const ids = ['a', 'b'];
    const found = [makeSynergy({ ingredienteA: 'a', ingredienteB: 'b' })];
    expect(findUntestedPairs(ids, found)).toEqual([]);
  });
});

describe('InteractionChecker — isBeneficial / isRisky', () => {
  it('isBeneficial: true para tipos sinérgicos', () => {
    expect(isBeneficial(makeSynergy({ tipo: 'sinergia' }))).toBe(true);
    expect(isBeneficial(makeSynergy({ tipo: 'potenciador' }))).toBe(true);
    expect(isBeneficial(makeSynergy({ tipo: 'complemento' }))).toBe(true);
    expect(isBeneficial(makeSynergy({ tipo: 'complementario' }))).toBe(true);
    expect(isBeneficial(makeSynergy({ tipo: 'cofactor' }))).toBe(true);
  });

  it('isBeneficial: false para tipos de riesgo', () => {
    expect(isBeneficial(makeSynergy({ tipo: 'antagonismo' }))).toBe(false);
    expect(isBeneficial(makeSynergy({ tipo: 'interaccion' }))).toBe(false);
  });

  it('isRisky: true para tipos de antagonismo/interacción', () => {
    expect(isRisky(makeSynergy({ tipo: 'antagonismo' }))).toBe(true);
    expect(isRisky(makeSynergy({ tipo: 'interaccion' }))).toBe(true);
  });

  it('isRisky: false para tipos sinérgicos', () => {
    expect(isRisky(makeSynergy({ tipo: 'sinergia' }))).toBe(false);
    expect(isRisky(makeSynergy({ tipo: 'potenciador' }))).toBe(false);
  });

  it('isBeneficial e isRisky son mutuamente excluyentes para tipos conocidos', () => {
    const allTypes = ['sinergia', 'antagonismo', 'interaccion', 'complemento',
      'potenciador', 'complementario', 'cofactor', 'secuencial', 'bioactivador'] as const;
    for (const tipo of allTypes) {
      const s = makeSynergy({ tipo });
      // secuencial y bioactivador no están en ningún set → ambos false
      if (isBeneficial(s)) expect(isRisky(s)).toBe(false);
      if (isRisky(s)) expect(isBeneficial(s)).toBe(false);
    }
  });
});
