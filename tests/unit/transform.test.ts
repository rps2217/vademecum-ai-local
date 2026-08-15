import { describe, it, expect } from 'vitest';
import {
  toSupabaseFormat,
  fromSupabaseIngredient,
  fromSupabaseSynergy,
  fromSupabasePathology,
  fromSnakeCase,
} from '@/core/sync/transform';

describe('toSupabaseFormat', () => {
  it('convierte claves camelCase a snake_case', () => {
    const result = toSupabaseFormat({ ingredienteA: 'a', ingredienteB: 'b' });
    expect(result).toEqual({ ingrediente_a: 'a', ingrediente_b: 'b' });
  });

  it('convierte deviceId a device_id', () => {
    const result = toSupabaseFormat({ deviceId: 'dev1' });
    expect(result).toEqual({ device_id: 'dev1' });
  });

  it('convierte bodySystems a body_systems', () => {
    const result = toSupabaseFormat({ bodySystems: ['nervioso'] });
    expect(result).toEqual({ body_systems: ['nervioso'] });
  });

  it('convierte updatedAt (epoch ms number) a ISO string para TIMESTAMPTZ', () => {
    const result = toSupabaseFormat({ updatedAt: 1695000000000 });
    expect(result.updated_at).toBe('2023-09-18T01:20:00.000Z');
    expect(typeof result.updated_at).toBe('string');
  });

  it('convierte lastSyncAt (epoch ms number) a ISO string', () => {
    const result = toSupabaseFormat({ lastSyncAt: 1695000000000 });
    expect(result.last_sync_at).toBe('2023-09-18T01:20:00.000Z');
  });

  it('preserva updatedAt como string si ya viene como string', () => {
    const result = toSupabaseFormat({ updatedAt: '2023-09-18T01:20:00.000Z' });
    expect(result.updated_at).toBe('2023-09-18T01:20:00.000Z');
  });

  it('transforma un payload completo de sinergia correctamente', () => {
    const synergy = {
      id: 'sin_valeriana_pasiflora',
      ingredienteA: 'valeriana',
      ingredienteB: 'pasiflora',
      tipo: 'sinergia',
      nivel: 'alto',
      evidencia: 'A',
      fuentes: ['pubmed'],
      lamport: 5,
      deviceId: 'dev1',
      updatedAt: 1695000000000,
      tombstone: 0,
    };
    const result = toSupabaseFormat(synergy);
    expect(result).toEqual({
      id: 'sin_valeriana_pasiflora',
      ingrediente_a: 'valeriana',
      ingrediente_b: 'pasiflora',
      tipo: 'sinergia',
      nivel: 'alto',
      evidencia: 'A',
      fuentes: ['pubmed'],
      lamport: 5,
      device_id: 'dev1',
      updated_at: '2023-09-18T01:20:00.000Z',
      tombstone: 0,
    });
  });

  it('maneja claves con mayúsculas consecutivas (httpURL → http_url)', () => {
    const result = toSupabaseFormat({ httpURL: 'x' });
    expect(result).toEqual({ http_url: 'x' });
  });

  it('transforma un payload completo de patología correctamente (upload path)', () => {
    const pathology = {
      id: 'ansiedad',
      nombre: 'Ansiedad',
      definicion: 'Trastorno caracterizado por preocupación excesiva',
      causas: ['Genética'],
      sintomas: ['Preocupación'],
      sistemas: ['nervioso'],
      tratamientoAlopatico: {
        primeraLinea: ['ISRS'],
        mecanismo: 'Serotonina',
        efectosSecundarios: ['Náuseas'],
      },
      tratamientoNatural: {
        fitoterapia: ['valeriana'],
        suplementos: ['magnesio'],
        homeopatia: ['ignatia'],
        aceites: ['lavanda_aceite'],
        cuandoPreferir: 'Casos leves',
      },
      prevencion: ['Reducir cafeína'],
      cuandoConsultar: 'Si hay ideas suicidas',
      epidemiologia: 'Prevalencia 10%',
      factoresRiesgo: ['Estrés crónico'],
      diagnostico: 'Criterios DSM-5',
      criteriosDiagnostico: ['Preocupación 6+ meses'],
      escalasClinicas: [{ nombre: 'GAD-7', uso: 'Screening ansiedad' }],
      diagnosticoDiferencial: ['Hipertiroidismo'],
      pronostico: 'Bueno con tratamiento',
      poblacionesEspeciales: [{ poblacion: 'Embarazo', consideraciones: 'Evitar hiperico' }],
      alertasFarmaceuticas: ['ISRS + IMAO = síndrome serotoninérgico'],
      evidencia: 'A',
      fuentes: ['DSM-5'],
      lamport: 3,
      deviceId: 'dev1',
      updatedAt: 1695000000000,
      createdAt: 1694000000000,
      tombstone: 0,
    };
    const result = toSupabaseFormat(pathology);
    expect(result).toEqual({
      id: 'ansiedad',
      nombre: 'Ansiedad',
      definicion: 'Trastorno caracterizado por preocupación excesiva',
      causas: ['Genética'],
      sintomas: ['Preocupación'],
      sistemas: ['nervioso'],
      tratamiento_alopatico: {
        primeraLinea: ['ISRS'],
        mecanismo: 'Serotonina',
        efectosSecundarios: ['Náuseas'],
      },
      tratamiento_natural: {
        fitoterapia: ['valeriana'],
        suplementos: ['magnesio'],
        homeopatia: ['ignatia'],
        aceites: ['lavanda_aceite'],
        cuandoPreferir: 'Casos leves',
      },
      prevencion: ['Reducir cafeína'],
      cuando_consultar: 'Si hay ideas suicidas',
      epidemiologia: 'Prevalencia 10%',
      factores_riesgo: ['Estrés crónico'],
      diagnostico: 'Criterios DSM-5',
      criterios_diagnostico: ['Preocupación 6+ meses'],
      escalas_clinicas: [{ nombre: 'GAD-7', uso: 'Screening ansiedad' }],
      diagnostico_diferencial: ['Hipertiroidismo'],
      pronostico: 'Bueno con tratamiento',
      poblaciones_especiales: [{ poblacion: 'Embarazo', consideraciones: 'Evitar hiperico' }],
      alertas_farmaceuticas: ['ISRS + IMAO = síndrome serotoninérgico'],
      evidencia: 'A',
      fuentes: ['DSM-5'],
      lamport: 3,
      device_id: 'dev1',
      updated_at: '2023-09-18T01:20:00.000Z',
      created_at: '2023-09-06T11:33:20.000Z',
      tombstone: 0,
    });
  });
});

describe('fromSupabaseIngredient', () => {
  it('mapea snake_case → camelCase y parsea timestamps ISO a epoch ms', () => {
    const remote = {
      id: 'valeriana',
      nombre: 'Valeriana',
      sinonimos: ['valeriana officinalis'],
      categoria: 'fitoterapia',
      familia: 'Caprifoliaceae',
      sistemas: ['nervioso'],
      indicaciones: ['insomnio', 'ansiedad'],
      evidencia: 'B',
      propiedades: ['sedante'],
      posologia: '300-600 mg extracto',
      seguridad: { embarazo: 'evitar' },
      interacciones: ['alcohol'],
      fuentes: ['pubmed'],
      embedding: [0.1, 0.2],
      lamport: 5,
      device_id: 'dev1',
      updated_at: '2023-09-18T01:20:00.000Z',
      created_at: '2023-09-06T11:33:20.000Z',
      tombstone: 0,
    };
    const result = fromSupabaseIngredient(remote);
    expect(result.id).toBe('valeriana');
    expect(result.ingredienteA).toBeUndefined();
    expect(result.posologia).toBe('300-600 mg extracto');
    expect(result.embedding).toEqual([0.1, 0.2]);
    expect(result.deviceId).toBe('dev1');
    expect(result.updatedAt).toBe(1695000000000);
    expect(result.createdAt).toBe(1694000000000);
    expect(result.tombstone).toBe(0);
    expect(result.evidencia).toBe('B');
  });

  it('no pierde posologia ni embedding (regresión del bug de data-loss)', () => {
    const remote = {
      id: 'passiflora',
      nombre: 'Pasiflora',
      sinonimos: [],
      categoria: 'fitoterapia',
      sistemas: ['nervioso'],
      indicaciones: ['ansiedad'],
      evidencia: 'C',
      propiedades: [],
      seguridad: {},
      interacciones: [],
      fuentes: [],
      posologia: '2-4 ml tintura',
      embedding: [0.3, 0.4, 0.5],
      lamport: 1,
      device_id: 'dev2',
      updated_at: '2023-09-18T01:20:00.000Z',
      tombstone: 1,
    };
    const result = fromSupabaseIngredient(remote);
    expect(result.posologia).toBe('2-4 ml tintura');
    expect(result.embedding).toEqual([0.3, 0.4, 0.5]);
    expect(result.tombstone).toBe(1);
  });

  it('aplica defaults seguros para campos ausentes', () => {
    const result = fromSupabaseIngredient({ id: 'x', nombre: 'X' });
    expect(result.sinonimos).toEqual([]);
    expect(result.sistemas).toEqual([]);
    expect(result.evidencia).toBe('C');
    expect(result.seguridad).toEqual({});
    expect(result.lamport).toBe(0);
    expect(result.updatedAt).toBe(0);
    expect(result.createdAt).toBe(0);
    expect(result.tombstone).toBe(0);
    expect(result.posologia).toBeUndefined();
    expect(result.embedding).toBeUndefined();
  });
});

describe('fromSupabaseSynergy', () => {
  it('mapea ingrediente_a/ingrediente_b y parsea timestamps', () => {
    const remote = {
      id: 'sin_val_pas',
      ingrediente_a: 'valeriana',
      ingrediente_b: 'pasiflora',
      tipo: 'sinergia',
      nivel: 'alto',
      mecanismo: 'GABA-A',
      evidencia: 'A',
      descripcion: 'Sinergia sedante',
      fuentes: ['pubmed'],
      lamport: 3,
      device_id: 'dev1',
      updated_at: '2023-09-18T01:20:00.000Z',
      tombstone: 0,
    };
    const result = fromSupabaseSynergy(remote);
    expect(result.ingredienteA).toBe('valeriana');
    expect(result.ingredienteB).toBe('pasiflora');
    expect(result.nivel).toBe('alto');
    expect(result.mecanismo).toBe('GABA-A');
    expect(result.updatedAt).toBe(1695000000000);
  });

  it('aplica defaults para campos ausentes', () => {
    const result = fromSupabaseSynergy({ id: 's1' });
    expect(result.ingredienteA).toBe('');
    expect(result.ingredienteB).toBe('');
    expect(result.tipo).toBe('sinergia');
    expect(result.nivel).toBe('medio');
    expect(result.evidencia).toBe('C');
    expect(result.tombstone).toBe(0);
  });
});

describe('fromSupabasePathology', () => {
  it('mapea tratamiento_alopatico/natural y contexto clínico extendido', () => {
    const remote = {
      id: 'ansiedad',
      nombre: 'Ansiedad',
      definicion: 'Trastorno de ansiedad',
      causas: ['Genética'],
      sintomas: ['Preocupación'],
      sistemas: ['nervioso'],
      tratamiento_alopatico: { primeraLinea: ['ISRS'], mecanismo: 'Serotonina', efectosSecundarios: ['Náuseas'] },
      tratamiento_natural: { fitoterapia: ['valeriana'], suplementos: [], homeopatia: [], aceites: [], cuandoPreferir: 'Leves' },
      prevencion: ['Reducir cafeína'],
      cuando_consultar: 'Ideas suicidas',
      epidemiologia: '10%',
      factores_riesgo: ['Estrés'],
      diagnostico: 'DSM-5',
      escalas_clinicas: [{ nombre: 'GAD-7', uso: 'Screening' }],
      evidencia: 'A',
      fuentes: ['DSM-5'],
      lamport: 2,
      device_id: 'dev1',
      updated_at: '2023-09-18T01:20:00.000Z',
      created_at: '2023-09-06T11:33:20.000Z',
      tombstone: 0,
    };
    const result = fromSupabasePathology(remote);
    expect(result.tratamientoAlopatico.primeraLinea).toEqual(['ISRS']);
    expect(result.tratamientoNatural.fitoterapia).toEqual(['valeriana']);
    expect(result.cuandoConsultar).toBe('Ideas suicidas');
    expect(result.escalasClinicas?.[0].nombre).toBe('GAD-7');
    expect(result.factoresRiesgo).toEqual(['Estrés']);
    expect(result.updatedAt).toBe(1695000000000);
    expect(result.createdAt).toBe(1694000000000);
  });

  it('aplica defaults para tratamiento ausente', () => {
    const result = fromSupabasePathology({ id: 'p', nombre: 'P', definicion: 'D' });
    expect(result.tratamientoAlopatico).toEqual({ primeraLinea: [], mecanismo: '', efectosSecundarios: [] });
    expect(result.tratamientoNatural).toEqual({ fitoterapia: [], suplementos: [], homeopatia: [], aceites: [], cuandoPreferir: '' });
    expect(result.evidencia).toBe('C');
  });
});

describe('fromSnakeCase', () => {
  it('convierte claves snake_case a camelCase', () => {
    const result = fromSnakeCase({ device_id: 'd1', updated_at: 't', nombre_comercial: 'X' });
    expect(result).toEqual({ deviceId: 'd1', updatedAt: 't', nombreComercial: 'X' });
  });
});

describe('round-trip: toSupabaseFormat ↔ from*', () => {
  it('un ingrediente local → Supabase → local preserva los campos clave', () => {
    const local = {
      id: 'valeriana',
      nombre: 'Valeriana',
      sinonimos: ['valeriana officinalis'],
      categoria: 'fitoterapia',
      familia: 'Caprifoliaceae',
      sistemas: ['nervioso'],
      indicaciones: ['insomnio'],
      evidencia: 'B',
      propiedades: ['sedante'],
      posologia: '300 mg',
      seguridad: { embarazo: 'evitar' },
      interacciones: ['alcohol'],
      fuentes: ['pubmed'],
      embedding: [0.1, 0.2],
      lamport: 5,
      deviceId: 'dev1',
      updatedAt: 1695000000000,
      createdAt: 1694000000000,
      tombstone: 0 as const,
    };
    const supabaseRow = toSupabaseFormat(local);
    expect(supabaseRow.posologia).toBe('300 mg');
    expect(supabaseRow.embedding).toEqual([0.1, 0.2]);
    expect(supabaseRow.device_id).toBe('dev1');
    const back = fromSupabaseIngredient(supabaseRow);
    expect(back.posologia).toBe('300 mg');
    expect(back.embedding).toEqual([0.1, 0.2]);
    expect(back.deviceId).toBe('dev1');
    expect(back.updatedAt).toBe(1695000000000);
  });
});
