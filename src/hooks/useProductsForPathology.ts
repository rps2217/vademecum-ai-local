/**
 * useProductsForPathology — lookup inverso patología → productos comerciales.
 *
 * Cadena transitiva:
 *   patología.tratamientoNatural (ids de ingredientes)
 *      → product_ingredients.ingredientId (bridge: qué productos contienen esos ingredientes)
 *      → products (por SKU) + productIngredientAnalysis (cobertura KB)
 *
 * Devuelve productos ordenados por nº de ingredientes de la patología que
 * cubren (más relevante primero), con su análisis de cobertura.
 *
 * 100% reactivo (useLiveQuery): si el replicador baja nuevos productos o el
 * bridge cambia, la lista se actualiza sola.
 */

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import type { DbProduct, DbProductIngredientAnalysis } from '@/db/schema';

export interface PathologyProduct {
  product: DbProduct;
  analysis?: DbProductIngredientAnalysis;
  /** nº de ingredientes de la patología que este producto cubre. */
  matchedCount: number;
}

export function useProductsForPathology(ingredientIds: string[]): PathologyProduct[] | undefined {
  // Estabiliza la lista de IDs para que useLiveQuery no re-dispare innecesariamente.
  const idsKey = useMemo(() => ingredientIds.slice().sort().join(','), [ingredientIds]);
  const ids = useMemo(() => (idsKey ? idsKey.split(',') : []), [idsKey]);

  return useLiveQuery(async () => {
    if (ids.length === 0) return [];

    // 1) Bridge: qué productos contienen alguno de estos ingredientes.
    const bridgeRows = await db.productIngredients
      .where('ingredientId')
      .anyOf(ids)
      .and((row) => row.isMatched && row.ingredientId !== null)
      .toArray();

    if (bridgeRows.length === 0) return [];

    // 2) Contar cuántos ingredientes de la patología cubre cada producto.
    const skuToMatched = new Map<string, Set<string>>();
    for (const row of bridgeRows) {
      const ingredientId = row.ingredientId;
      if (!ingredientId) continue;
      let set = skuToMatched.get(row.productoSku);
      if (!set) {
        set = new Set();
        skuToMatched.set(row.productoSku, set);
      }
      set.add(ingredientId);
    }

    const skus = Array.from(skuToMatched.keys());
    if (skus.length === 0) return [];

    // 3) Cargar productos + análisis en paralelo.
    const [products, analyses] = await Promise.all([
      db.products.bulkGet(skus),
      db.productIngredientAnalysis.bulkGet(skus),
    ]);

    const analysisMap = new Map<string, DbProductIngredientAnalysis>();
    for (const a of analyses) {
      if (a) analysisMap.set(a.productoSku, a);
    }

    // 4) Construir resultado, descartando tombstones y ordenando por cobertura.
    const result: PathologyProduct[] = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p || p.tombstone === 1) continue;
      result.push({
        product: p,
        analysis: analysisMap.get(p.sku),
        matchedCount: skuToMatched.get(p.sku)?.size ?? 0,
      });
    }

    // Ordenamiento clínico jerárquico de más recomendado a menos recomendado:
    // 1. Mayor número de ingredientes activos de la patología cubiertos (matchedCount desc).
    // 2. Mayor porcentaje de cobertura KB del producto (analysis.coberturaKb desc).
    // 3. Menor cantidad de ingredientes sin match / mayor pureza formulativa (sinMatchCount asc).
    // 4. Desempate alfabético por nombre comercial.
    result.sort((a, b) => {
      if (b.matchedCount !== a.matchedCount) {
        return b.matchedCount - a.matchedCount;
      }
      const cobA = a.analysis?.coberturaKb ?? 0;
      const cobB = b.analysis?.coberturaKb ?? 0;
      if (cobB !== cobA) {
        return cobB - cobA;
      }
      const sinA = a.analysis?.sinMatchCount ?? 0;
      const sinB = b.analysis?.sinMatchCount ?? 0;
      if (sinA !== sinB) {
        return sinA - sinB;
      }
      return a.product.nombreComercial.localeCompare(b.product.nombreComercial, 'es');
    });

    return result;
  }, [idsKey]);
}
