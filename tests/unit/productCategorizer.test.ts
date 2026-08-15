import { describe, it, expect } from 'vitest';
import { categorizeProduct } from '@/core/catalog';
import type { DbProduct } from '@/db/schema';

function makeProduct(overrides: Partial<DbProduct> = {}): DbProduct {
  return {
    sku: 'test-sku',
    nombreComercial: 'Test Product',
    principiosActivos: [],
    indicaciones: [],
    contraindicaciones: [],
    embarazo: 'no_data',
    lactancia: 'no_data',
    pediatria: 'no_data',
    hipertension: 'no_data',
    diabetes: 'no_data',
    celiacos: 'no_data',
    source: 'manual',
    data: {},
    lamport: 0,
    deviceId: 'test',
    updatedAt: 0,
    createdAt: 0,
    tombstone: 0,
    ...overrides,
  };
}

describe('categorizeProduct', () => {
  it('clasifica homeopatía por tag explícito', () => {
    const p = makeProduct({
      nombreComercial: 'Flucoccinum',
      data: { tags_ia: ['Homeopatía', 'Coadyuvante'] },
    });
    expect(categorizeProduct(p)).toBe('homeopatia');
  });

  it('clasifica homeopatía por dilución C/D en principios activos', () => {
    const p = makeProduct({
      nombreComercial: 'Nux Vomica',
      principiosActivos: ['Nux Vomica D4'],
    });
    expect(categorizeProduct(p)).toBe('homeopatia');
  });

  it('clasifica homeopatía por dilución C-200 con guion', () => {
    const p = makeProduct({
      nombreComercial: 'Influenzinum',
      principiosActivos: ['Influenzinum C200'],
    });
    expect(categorizeProduct(p)).toBe('homeopatia');
  });

  it('clasifica aceites antes que cosmética', () => {
    const p = makeProduct({
      nombreComercial: 'Aceite de masaje con Calendula',
    });
    expect(categorizeProduct(p)).toBe('aceites');
  });

  it('clasifica fitoterapia por nombre de planta', () => {
    const p = makeProduct({
      nombreComercial: 'Propolis Jarabe 125 mL',
    });
    expect(categorizeProduct(p)).toBe('fitoterapia');
  });

  it('clasifica suplementos por tag', () => {
    const p = makeProduct({
      nombreComercial: 'Aminomag-B',
      principiosActivos: ['Magnesio quelado', 'Vitamina B6'],
      data: { tags_ia: ['Suplemento alimenticio', 'Vitamínico'] },
    });
    expect(categorizeProduct(p)).toBe('suplementos');
  });

  it('clasifica cosmética por keyword', () => {
    const p = makeProduct({
      nombreComercial: 'Toalla Higiénica Normal',
    });
    expect(categorizeProduct(p)).toBe('cosmetica');
  });

  it('clasifica como otros cuando no hay match', () => {
    const p = makeProduct({
      nombreComercial: 'Test de Embarazo',
    });
    expect(categorizeProduct(p)).toBe('otros');
  });

  it('prioriza homeopatía sobre fitoterapia (tag explícito gana)', () => {
    const p = makeProduct({
      nombreComercial: 'Arnica Complex',
      principiosActivos: ['Arnica C30', 'Belladonna C30'],
      data: { tags_ia: ['Homeopático'] },
    });
    expect(categorizeProduct(p)).toBe('homeopatia');
  });

  it('maneja data undefined sin fallar', () => {
    const p = makeProduct({ data: undefined as unknown as Record<string, unknown> });
    expect(['otros', 'cosmetica', 'suplementos', 'fitoterapia', 'aceites', 'homeopatia'])
      .toContain(categorizeProduct(p));
  });

  it('maneja tags_ia vacío', () => {
    const p = makeProduct({ data: { tags_ia: [] } });
    expect(['otros', 'cosmetica', 'suplementos', 'fitoterapia', 'aceites', 'homeopatia'])
      .toContain(categorizeProduct(p));
  });
});
