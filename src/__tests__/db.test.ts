/**
 * Tests para la base de datos
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { db } from '../db/schema';
import type { DbIngredient, DbSynergy, IngredientCategory } from '../db/schema';

describe('Database Schema', () => {
  beforeAll(async () => {
    await db.open();
  });

  afterEach(async () => {
    await db.ingredients.clear();
    await db.synergies.clear();
  });

  it('should have correct table definitions', () => {
    expect(db.ingredients).toBeDefined();
    expect(db.synergies).toBeDefined();
    expect(db.products).toBeDefined();
    expect(db.protocols).toBeDefined();
  });

  it('should insert and retrieve an ingredient', async () => {
    const ingredient: DbIngredient = {
      id: 'test-ingredient',
      nombre: 'Test Ingredient',
      sinonimos: ['Test', 'Example'],
      categoria: 'fitoterapia' as IngredientCategory,
      sistemas: ['nervioso'],
      indicaciones: ['test'],
      evidencia: 'B',
      propiedades: ['Test property'],
      seguridad: {},
      interacciones: [],
      fuentes: ['Test source'],
      lamport: 0,
      deviceId: 'test-device',
      updatedAt: Date.now(),
      createdAt: Date.now(),
      tombstone: 0,
    };

    await db.ingredients.put(ingredient);
    const retrieved = await db.ingredients.get('test-ingredient');

    expect(retrieved).toBeDefined();
    expect(retrieved?.nombre).toBe('Test Ingredient');
    expect(retrieved?.categoria).toBe('fitoterapia');
  });

  it('should insert and retrieve a synergy', async () => {
    const synergy: DbSynergy = {
      id: 'test-synergy',
      ingredienteA: 'valeriana',
      ingredienteB: 'pasiflora',
      tipo: 'sinergia',
      nivel: 'alto',
      mecanismo: 'Test mechanism',
      evidencia: 'A',
      fuentes: ['Test'],
      lamport: 0,
      deviceId: 'test-device',
      updatedAt: Date.now(),
      tombstone: 0,
    };

    await db.synergies.put(synergy);
    const retrieved = await db.synergies.get('test-synergy');

    expect(retrieved).toBeDefined();
    expect(retrieved?.ingredienteA).toBe('valeriana');
    expect(retrieved?.tipo).toBe('sinergia');
  });
});
