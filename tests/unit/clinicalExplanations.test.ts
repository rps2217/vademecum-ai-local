import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db';
import { generateClinicalExplanation } from '@/core/analysis/clinicalExplanation';
import explicacionesData from '@/db/seeders/data/explicaciones_clinicas.json';

describe('ClinicalExplanations table and knowledge base', () => {
  beforeEach(async () => {
    await db.clinicalExplanations.clear();
  });

  it('can store and query clinical explanations via compound query', async () => {
    await db.clinicalExplanations.put({
      id: 'exp_valeriana_ansiedad',
      ingredienteId: 'valeriana',
      patologiaId: 'ansiedad',
      explicacion: 'Valeriana modula los receptores GABA-A reduciendo la sobreexcitación nerviosa.',
      lamport: 0,
      deviceId: 'dev1',
      updatedAt: Date.now(),
      tombstone: 0,
    });

    const res = await db.clinicalExplanations
      .where({ ingredienteId: 'valeriana', patologiaId: 'ansiedad' })
      .first();

    expect(res).toBeDefined();
    expect(res?.explicacion).toContain('GABA-A');
  });

  it('verifies explicaciones_clinicas.json data integrity (Ponytail protocol)', () => {
    const list = explicacionesData.explicaciones;
    expect(list.length).toBeGreaterThanOrEqual(3000);

    const ids = new Set<string>();
    for (const item of list) {
      expect(item.id).toBeDefined();
      expect(item.ingredienteId).toBeDefined();
      expect(item.patologiaId).toBeDefined();
      expect(item.explicacion).toBeDefined();
      expect(item.explicacion.trim().length).toBeGreaterThan(15);
      expect(ids.has(item.id)).toBe(false);
      ids.add(item.id);
    }
  });

  it('generates well-formed clinical explanation fallback with correct parameter order', () => {
    const text = generateClinicalExplanation(
      'Valeriana',
      'ingredient',
      'Ansiedad',
      'Modula los receptores GABA-A aumentando la relajación.',
      'Planta medicinal tranquilizante.'
    );

    expect(text).toContain('Valeriana');
    expect(text).toContain('Ansiedad');
    expect(text).not.toContain('ingredient es eficaz');
  });
});
