import { describe, it, expect } from 'vitest';
import { toSupabaseFormat } from '@/core/sync/transform';

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
