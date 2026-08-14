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
});
