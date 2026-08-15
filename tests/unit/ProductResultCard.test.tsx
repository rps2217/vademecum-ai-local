import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ProductResultCard } from '@/ui/ProductResultCard';
import type { ProductSearchResult } from '@/core/search';
import type { DbProduct } from '@/db/schema';

function makeProduct(overrides: Partial<DbProduct> = {}): DbProduct {
  return {
    sku: 'SKU-1',
    nombreComercial: 'Infusión Insomnio',
    principiosActivos: ['Valeriana', 'Lavanda'],
    categoria: 'fitoterapia',
    indicaciones: ['insomnio'],
    contraindicaciones: [],
    embarazo: 'evitar',
    lactancia: 'evitar',
    pediatria: 'evitar',
    hipertension: 'apto',
    diabetes: 'apto',
    celiacos: 'apto',
    source: 'bridge',
    data: {},
    lamport: 0,
    deviceId: 'test',
    updatedAt: 1,
    createdAt: 1,
    tombstone: 0,
    ...overrides,
  };
}

function makeResult(product: DbProduct): ProductSearchResult {
  return { product, score: 100, matchType: 'exact', categoria: 'fitoterapia' };
}

describe('ProductResultCard', () => {
  it('al hacer click invoca onClick con el producto completo (regresión modal no abre)', () => {
    // Bug: el handler re-buscaba el producto en el cache del servicio con
    // getProduct(sku). Durante un rebuild del índice (cache.clear) ese lookup
    // devolvía undefined y el modal ProductDetail nunca se abría. El fix usa
    // el producto que la card ya tiene en result.product.
    const product = makeProduct();
    const onClick = vi.fn();
    const { getByLabelText } = render(
      <ProductResultCard result={makeResult(product)} onClick={onClick} />,
    );

    fireEvent.click(getByLabelText('Ver detalle de Infusión Insomnio'));

    expect(onClick).toHaveBeenCalledTimes(1);
    // El callback recibe el DbProduct completo, NO un sku string.
    expect(onClick).toHaveBeenCalledWith(product);
    expect(typeof onClick.mock.calls[0][0]).toBe('object');
    expect((onClick.mock.calls[0][0] as DbProduct).sku).toBe('SKU-1');
  });
});
