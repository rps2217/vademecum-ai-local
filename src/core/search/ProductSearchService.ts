/**
 * Product Search Service
 *
 * Motor de búsqueda de productos comerciales del catálogo de farmacia.
 * Reutiliza el mismo `searchEngine` (índice invertido + TF-IDF + fuzzy) que
 * IngredientSearchService, de modo que "valerina" (typo) encuentra tanto el
 * ingrediente "valeriana" como el producto "Ungüento Valeriana" con la misma
 * tolerancia a errores. 100% offline e instantáneo.
 *
 * Pesos por campo (el nombre comercial y los principios activos son los más
 * importantes para el mostrador):
 *   - nombreComercial: 100  (lo que el cliente pide en el mostrador)
 *   - principiosActivos: 90 (lo que el farmacéutico conoce del activo)
 *   - indicaciones: 40      (torceduras, contusiones…)
 *   - fabricante: 30        (laboratorio)
 *   - sku: 20               (código de barras, raro pero exacto)
 */

import { db } from '@/db';
import type { DbProduct } from '@/db/schema';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  InvertedIndex, buildTokens, type ScoredDoc,
} from './searchEngine';
import { categorizeProduct, type ProductCategory } from '@/core/catalog';

export interface ProductSearchResult {
  product: DbProduct;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'synonym';
  categoria: ProductCategory;
}

/** Facets disponibles para filtrado en la búsqueda de productos. */
export type ProductFacet = 'categoria';

/**
 * ProductSearchService — singleton gemelo de IngredientSearchService.
 *
 * Indexa db.products en un InvertedIndex al arranque y expone searchSync()
 * para la búsqueda unificada del mostrador (ver SearchPage).
 */
export class ProductSearchService {
  private index = new InvertedIndex<ProductFacet>();
  private cache = new Map<string, DbProduct>();
  private built = false;

  async buildIndex(): Promise<void> {
    const products = await db.products.toArray();
    this.index.clear();
    this.cache.clear();
    for (const prod of products) {
      if (prod.tombstone) continue;
      this.indexProduct(prod);
    }
    this.built = true;
  }

  private indexProduct(prod: DbProduct): void {
    const tokens = new Map<string, number>();
    const merge = (m: Map<string, number>) => {
      for (const [tok, w] of m) tokens.set(tok, Math.max(tokens.get(tok) ?? 0, w));
    };
    merge(buildTokens(prod.nombreComercial, 100));
    for (const pa of prod.principiosActivos ?? []) merge(buildTokens(pa, 90));
    for (const ind of prod.indicaciones ?? []) merge(buildTokens(ind, 40));
    if (prod.fabricante) merge(buildTokens(prod.fabricante, 30));
    merge(buildTokens(prod.sku, 20));

    const categoria = categorizeProduct(prod);
    this.index.add({
      id: prod.sku,
      tokens,
      facets: { categoria: new Set([categoria]) },
    });
    this.cache.set(prod.sku, prod);
  }

  reindex(prod: DbProduct): void {
    this.index.remove(prod.sku);
    this.cache.delete(prod.sku);
    if (!prod.tombstone) this.indexProduct(prod);
  }

  remove(sku: string): void {
    this.index.remove(sku);
    this.cache.delete(sku);
  }

  isBuilt(): boolean {
    return this.built;
  }

  get size(): number {
    return this.cache.size;
  }

  getProduct(sku: string): DbProduct | undefined {
    return this.cache.get(sku);
  }

  searchSync(query?: string, facets?: Partial<Record<ProductFacet, string>>): ProductSearchResult[] {
    if (!this.built) return [];
    if ((!query || query.trim().length < 2) && !facets) return [];
    const scored: ScoredDoc[] = this.index.rank({ query, facets });
    const results: ProductSearchResult[] = [];
    for (const s of scored) {
      const prod = this.cache.get(s.id);
      if (prod) {
        const entry = this.index.docs.get(s.id);
        const categoria = entry?.facets.categoria?.values().next().value as ProductCategory ?? 'otros';
        results.push({ product: prod, score: s.score, matchType: s.matchType, categoria });
      }
    }
    return results;
  }

  async search(query?: string, facets?: Partial<Record<ProductFacet, string>>): Promise<ProductSearchResult[]> {
    if (!this.built) await this.buildIndex();
    return this.searchSync(query, facets);
  }

  /** Cuenta productos por categoría (para chips dinámicos en el catálogo). */
  categoriaCounts(): Map<ProductCategory, number> {
    const counts = new Map<ProductCategory, number>();
    for (const entry of this.index.docs.values()) {
      const cat = entry.facets.categoria?.values().next().value as ProductCategory | undefined;
      if (cat) counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
    return counts;
  }
}

export const productSearchService = new ProductSearchService();

/**
 * Hook: construye el índice de productos reactivamente cuando el catálogo
 * cambia (useLiveQuery sobre el count de productos) y expone el estado.
 */
export function useProductIndex(): { ready: boolean } {
  useLiveQuery(async () => {
    const count = await db.products.count();
    const current = productSearchService.size;
    if (count !== current || !productSearchService.isBuilt()) {
      await productSearchService.buildIndex();
    }
    return count;
  }, []);
  return { ready: productSearchService.isBuilt() };
}
