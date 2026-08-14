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
      makeProduct({ sku: 'magnesio-1', nombreComercial: 'Magnesio Quelado 400mg', principiosActivos: ['Magnesio', 'Vitamina B6'], fabricante: 'Pharma' }),
      makeProduct({ sku: 'valeriana-1', nombreComercial: 'Valeriana Extracto', principiosActivos: ['Valeriana'], indicaciones: ['Insomnio'] }),
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
});
