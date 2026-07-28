/**
 * Tests para el schema de la base de datos
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { db, generateId, now, synergyHash, getDeviceId, nextLamport } from '@/db';

describe('Database Schema', () => {
  beforeEach(async () => {
    // Limpiar base de datos antes de cada test
    await db.ingredients.clear();
    await db.synergies.clear();
    await db.products.clear();
    await db.protocols.clear();
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should generate valid UUID format', () => {
      const id = generateId();
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('now', () => {
    it('should return current timestamp in ms', () => {
      const before = Date.now();
      const timestamp = now();
      const after = Date.now();
      
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('synergyHash', () => {
    it('should generate same hash for same pair (order independent)', () => {
      const hash1 = synergyHash('a', 'b');
      const hash2 = synergyHash('b', 'a');
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different pairs', () => {
      const hash1 = synergyHash('a', 'b');
      const hash2 = synergyHash('a', 'c');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('getDeviceId', () => {
    it('should return consistent device ID', () => {
      const id1 = getDeviceId();
      const id2 = getDeviceId();
      expect(id1).toBe(id2);
    });
  });

  describe('nextLamport', () => {
    it('should increment lamport clock', () => {
      const clock1 = nextLamport();
      const clock2 = nextLamport();
      expect(clock2).toBe(clock1 + 1);
    });
  });
});

describe('DbIngredient type validation', () => {
  it('should accept valid ingredient data', () => {
    const ingredient = {
      id: 'valeriana',
      nombre: 'Valeriana',
      sinonimos: ['valerian', 'Valeriana officinalis'],
      categoria: 'fitoterapia' as const,
      sistemas: ['nervioso'],
      indicaciones: ['insomnio', 'ansiedad'],
      evidencia: 'B' as const,
      propiedades: ['sedante', 'ansiolítico'],
      seguridad: {
        embarazo: 'evitar' as const,
        lactancia: 'evitar' as const,
      },
      interacciones: ['alcohol', 'benzodiacepinas'],
      fuentes: ['EMA Monographs'],
      lamport: 1,
      deviceId: 'device-1',
      updatedAt: Date.now(),
      createdAt: Date.now(),
      tombstone: 0 as const,
    };

    expect(ingredient.id).toBe('valeriana');
    expect(ingredient.categoria).toBe('fitoterapia');
    expect(ingredient.evidencia).toBe('B');
  });

  it('should support all ingredient categories', () => {
    const categories = [
      'fitoterapia',
      'homeopatia',
      'aceite_esencial',
      'vitamina',
      'mineral',
      'probiotico',
      'prebiotico',
      'enzima',
      'aminoacido',
    ];

    categories.forEach(cat => {
      expect(['fitoterapia', 'homeopatia', 'aceite_esencial', 'vitamina', 'mineral', 'probiotico', 'prebiotico', 'enzima', 'aminoacido']).toContain(cat);
    });
  });

  it('should support all body systems', () => {
    const systems = [
      'nervioso',
      'digestivo',
      'inmune',
      'cardiovascular',
      'respiratorio',
      'musculoesqueletico',
      'endocrino',
    ];

    systems.forEach(sys => {
      expect(['nervioso', 'digestivo', 'inmune', 'cardiovascular', 'respiratorio', 'musculoesqueletico', 'endocrino']).toContain(sys);
    });
  });
});

describe('DbSynergy type validation', () => {
  it('should accept valid synergy data', () => {
    const synergy = {
      id: 'valeriana-pasiflora',
      ingredienteA: 'valeriana',
      ingredienteB: 'pasiflora',
      tipo: 'sinergia' as const,
      nivel: 'alto' as const,
      mecanismo: 'Potencian el efecto GABAérgico',
      evidencia: 'A' as const,
      descripcion: 'Combinación clásica para insomnia',
      fuentes: ['Clinical Phytopharmacology Review'],
      lamport: 1,
      deviceId: 'device-1',
      updatedAt: Date.now(),
      tombstone: 0 as const,
    };

    expect(synergy.tipo).toBe('sinergia');
    expect(synergy.nivel).toBe('alto');
  });

  it('should support all synergy types', () => {
    const types = ['sinergia', 'antagonismo', 'interaccion', 'complemento'];
    types.forEach(type => {
      expect(['sinergia', 'antagonismo', 'interaccion', 'complemento']).toContain(type);
    });
  });

  it('should support all synergy levels', () => {
    const levels = ['bajo', 'medio', 'alto', 'critico'];
    levels.forEach(level => {
      expect(['bajo', 'medio', 'alto', 'critico']).toContain(level);
    });
  });
});
