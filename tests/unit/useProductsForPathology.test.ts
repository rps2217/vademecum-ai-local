import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { db } from '@/db/schema';
import { useProductsForPathology } from '@/hooks/useProductsForPathology';
import type { DbProduct, DbProductIngredient } from '@/db/schema';

function makeProduct(sku: string, nombre: string, principios: string[]): DbProduct {
  return {
    sku,
    nombreComercial: nombre,
    fabricante: 'Lab Test',
    principiosActivos: principios,
    categoria: undefined,
    indicaciones: [],
    contraindicaciones: [],
    embarazo: 'apto', lactancia: 'apto', pediatria: 'apto',
    hipertension: 'apto', diabetes: 'apto', celiacos: 'apto',
    source: 'scraped', data: {},
    lamport: 0, deviceId: 'test', updatedAt: 1, createdAt: 1, tombstone: 0,
  } as DbProduct;
}

function makeBridge(productoSku: string, principioText: string, ingredientId: string | null, matched = true): DbProductIngredient {
  return {
    id: `${productoSku}|${principioText}`,
    productoSku,
    principioText,
    ingredientId,
    matchType: 'exact',
    matchScore: 1,
    matchedVia: 'test',
    isMatched: matched,
  };
}

describe('useProductsForPathology — lookup transitivo patología→producto', () => {
  beforeEach(async () => {
    await db.products.clear();
    await db.productIngredients.clear();

    await db.products.bulkPut([
      makeProduct('sku-arnica', 'Ungüento Arnica', ['Arnica']),
      makeProduct('sku-valeriana-mag', 'Valeriana + Magnesio', ['Valeriana', 'Magnesio']),
      makeProduct('sku-borraja', 'Aceite Borraja', ['Borraja']),
      makeProduct('sku-deleted', 'Borrado', ['Valeriana']),
    ]);
    // Marcar sku-deleted como tombstone
    await db.products.update('sku-deleted', { tombstone: 1 });

    await db.productIngredients.bulkPut([
      // arnica-1 (ingrediente de la patología) → sku-arnica
      makeBridge('sku-arnica', 'Arnica', 'ing-arnica'),
      // valeriana-1 + magnesio-1 → sku-valeriana-mag (cubre 2 ingredientes)
      makeBridge('sku-valeriana-mag', 'Valeriana', 'ing-valeriana'),
      makeBridge('sku-valeriana-mag', 'Magnesio', 'ing-magnesio'),
      // ingrediente NO linkeado → sku-borraja (no debe aparecer: ingredientId null)
      makeBridge('sku-borraja', 'Borraja', null),
      // bridge a producto tombstone → no debe aparecer
      makeBridge('sku-deleted', 'Valeriana', 'ing-valeriana'),
      // bridge no matched → debe filtrarse
      makeBridge('sku-arnica', 'Arnica2', 'ing-arnica', false),
    ]);
  });

  it('devuelve productos que contienen los ingredientes de la patología', async () => {
    const { result } = renderHook(() => useProductsForPathology(['ing-arnica']));
    await waitFor(() => expect(result.current).toBeDefined());
    expect(result.current!.length).toBe(1);
    expect(result.current![0].product.sku).toBe('sku-arnica');
    expect(result.current![0].matchedCount).toBe(1);
  });

  it('ordena por nº de ingredientes cubiertos (más primero)', async () => {
    const { result } = renderHook(() =>
      useProductsForPathology(['ing-arnica', 'ing-valeriana', 'ing-magnesio']),
    );
    await waitFor(() => expect(result.current!.length).toBeGreaterThan(0));
    // sku-valeriana-mag cubre 2, sku-arnica cubre 1 → valeriana+magnesio primero
    expect(result.current![0].product.sku).toBe('sku-valeriana-mag');
    expect(result.current![0].matchedCount).toBe(2);
    expect(result.current![1].product.sku).toBe('sku-arnica');
    expect(result.current![1].matchedCount).toBe(1);
  });

  it('excluye productos tombstone', async () => {
    const { result } = renderHook(() => useProductsForPathology(['ing-valeriana']));
    await waitFor(() => expect(result.current).toBeDefined());
    expect(result.current!.some((p) => p.product.sku === 'sku-deleted')).toBe(false);
    expect(result.current!.length).toBe(1); // solo sku-valeriana-mag
  });

  it('excluye bridge rows con ingredientId null (gap de cobertura)', async () => {
    const { result } = renderHook(() => useProductsForPathology(['ing-borraja']));
    await waitFor(() => expect(result.current).toBeDefined());
    // sku-borraja tiene bridge con ingredientId null → no debe aparecer
    expect(result.current!.length).toBe(0);
  });

  it('excluye bridge rows con isMatched=false', async () => {
    const { result } = renderHook(() => useProductsForPathology(['ing-arnica']));
    await waitFor(() => expect(result.current).toBeDefined());
    // sku-arnica tiene 2 bridge: 1 matched (ing-arnica) + 1 no-matched (ing-arnica)
    // Solo debe contar 1 (el matched)
    const arnica = result.current!.find((p) => p.product.sku === 'sku-arnica');
    expect(arnica?.matchedCount).toBe(1);
  });

  it('devuelve [] cuando no hay ingredientes', async () => {
    const { result } = renderHook(() => useProductsForPathology([]));
    await waitFor(() => expect(result.current).toEqual([]));
  });

  it('devuelve [] cuando los ingredientes no matchean ningún producto', async () => {
    const { result } = renderHook(() => useProductsForPathology(['ing-inexistente']));
    await waitFor(() => expect(result.current).toEqual([]));
  });
});
