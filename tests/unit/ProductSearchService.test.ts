import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db';
import { productSearchService } from '@/core/search';
import type { DbProduct } from '@/db/schema';

function makeProduct(overrides: Partial<DbProduct> = {}): DbProduct {
  return {
    sku: 'test-sku',
    nombreComercial: 'Ungüento Arnica Pote 35 Gr',
    fabricante: 'Lab Test',
    principiosActivos: ['Arnica'],
    categoria: undefined,
    indicaciones: ['Torceduras', 'Contusiones'],
    contraindicaciones: [],
    embarazo: 'evitar',
    lactancia: 'evitar',
    pediatria: 'evitar',
    hipertension: 'apto',
    diabetes: 'apto',
    celiacos: 'apto',
    posologia: '1-2 gramos, 2-4 veces al día',
    source: 'scraped',
    data: {},
    lamport: 0,
    deviceId: 'test',
    updatedAt: 1,
    createdAt: 1,
    tombstone: 0,
    ...overrides,
  } as DbProduct;
}

describe('ProductSearchService', () => {
  beforeEach(async () => {
    await db.products.clear();
    await db.products.bulkPut([
      makeProduct({ sku: 'arnica-1', nombreComercial: 'Ungüento Arnica Pote 35 Gr', principiosActivos: ['Arnica'], fabricante: 'Knop' }),
      makeProduct({ sku: 'magnesio-1', nombreComercial: 'Magnesio Quelado 400mg', principiosActivos: ['Magnesio', 'Vitamina B6'], fabricante: 'Pharma', embarazo: 'apto', lactancia: 'apto' }),
      makeProduct({ sku: 'valeriana-1', nombreComercial: 'Valeriana Extracto', principiosActivos: ['Valeriana'], indicaciones: ['Insomnio'], embarazo: 'contraindicado', diabetes: 'evitar' }),
      makeProduct({ sku: 'deleted-1', nombreComercial: 'Producto Borrado', tombstone: 1 }),
    ]);
    await productSearchService.buildIndex();
  });

  it('indexa los productos no borrados', () => {
    expect(productSearchService.size).toBe(3);
  });

  it('encuentra un producto por nombre comercial exacto', () => {
    const r = productSearchService.searchSync('Ungüento Arnica');
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r[0].product.sku).toBe('arnica-1');
  });

  it('encuentra un producto por principio activo', () => {
    const r = productSearchService.searchSync('Magnesio');
    expect(r.some((x) => x.product.sku === 'magnesio-1')).toBe(true);
  });

  it('tolera errores tipográficos (fuzzy): "valerina" → valeriana', () => {
    const r = productSearchService.searchSync('valerina');
    expect(r.some((x) => x.product.sku === 'valeriana-1')).toBe(true);
  });

  it('prefix matching: "arnic" → Arnica', () => {
    const r = productSearchService.searchSync('arnic');
    expect(r.some((x) => x.product.sku === 'arnica-1')).toBe(true);
  });

  it('no devuelve nada para queries de 1 char', () => {
    expect(productSearchService.searchSync('a')).toEqual([]);
  });

  it('no devuelve nada sin query', () => {
    expect(productSearchService.searchSync()).toEqual([]);
  });

  it('reindex actualiza un producto', async () => {
    const updated = makeProduct({ sku: 'arnica-1', nombreComercial: 'Arnica Gel Reformulado' });
    productSearchService.reindex(updated);
    const r = productSearchService.searchSync('Reformulado');
    expect(r.some((x) => x.product.sku === 'arnica-1')).toBe(true);
  });

  it('remove desindexa un producto', () => {
    productSearchService.remove('magnesio-1');
    expect(productSearchService.size).toBe(2);
    const r = productSearchService.searchSync('Magnesio');
    expect(r.some((x) => x.product.sku === 'magnesio-1')).toBe(false);
  });

  it('getProduct devuelve el producto del cache', () => {
    const p = productSearchService.getProduct('valeriana-1');
    expect(p?.nombreComercial).toBe('Valeriana Extracto');
  });

  it('ordena por score descendente', () => {
    const r = productSearchService.searchSync('Arnica');
    expect(r.length).toBeGreaterThanOrEqual(1);
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].score).toBeGreaterThanOrEqual(r[i].score);
    }
  });

  // ─── Safety facet tests ──────────────────────────────────────────

  it('safetyCounts cuenta productos por valor de seguridad', () => {
    const embarazoCounts = productSearchService.safetyCounts('embarazo');
    // arnica-1=evitar (default), magnesio-1=apto, valeriana-1=contraindicado
    expect(embarazoCounts.get('evitar')).toBe(1);
    expect(embarazoCounts.get('apto')).toBe(1);
    expect(embarazoCounts.get('contraindicado')).toBe(1);
  });

  it('filtra por safety facet sin query (lista completa filtrada)', () => {
    const r = productSearchService.searchSync(undefined, { embarazo: 'apto' });
    expect(r.length).toBe(1);
    expect(r[0].product.sku).toBe('magnesio-1');
  });

  it('filtra por safety facet "evitar" sin query', () => {
    const r = productSearchService.searchSync(undefined, { embarazo: 'evitar' });
    expect(r.length).toBe(1);
    expect(r[0].product.sku).toBe('arnica-1');
  });

  it('filtra por safety facet "contraindicado"', () => {
    const r = productSearchService.searchSync(undefined, { embarazo: 'contraindicado' });
    expect(r.length).toBe(1);
    expect(r[0].product.sku).toBe('valeriana-1');
  });

  it('combina safety facet con query de texto', () => {
    // Buscar "extracto" filtrando solo aptos en embarazo → valeriana es contraindicado, no aparece
    const r = productSearchService.searchSync('extracto', { embarazo: 'apto' });
    expect(r.length).toBe(0);
    // Sin filtro de safety, "extracto" encuentra valeriana
    const r2 = productSearchService.searchSync('extracto');
    expect(r2.some((x) => x.product.sku === 'valeriana-1')).toBe(true);
  });

  it('combina múltiples safety facets con AND', () => {
    // apto en embarazo AND apto en lactancia → solo magnesio-1
    const r = productSearchService.searchSync(undefined, { embarazo: 'apto', lactancia: 'apto' });
    expect(r.length).toBe(1);
    expect(r[0].product.sku).toBe('magnesio-1');
  });

  it('combina safety facet con categoría', () => {
    // Categoría + safety: arnica-1 es fitoterapia + evitar en embarazo
    const r = productSearchService.searchSync(undefined, { categoria: 'fitoterapia', embarazo: 'evitar' });
    expect(r.length).toBe(1);
    expect(r[0].product.sku).toBe('arnica-1');
  });

  it('filtra por diabetes: valeriana-1 es evitar', () => {
    const r = productSearchService.searchSync(undefined, { diabetes: 'evitar' });
    expect(r.length).toBe(1);
    expect(r[0].product.sku).toBe('valeriana-1');
  });
});
