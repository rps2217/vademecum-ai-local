/**
 * Ingredient Search Service
 *
 * Motor de búsqueda optimizado para el mostrador de farmacia.
 *
 * Estrategia: índice invertido en memoria construido al arranque.
 * Cada token (palabra normalizada + bigramas de palabras) apunta al
 * conjunto de IDs que lo contienen en nombre, sinónimos, indicaciones
 * o propiedades. La búsqueda resuelve los IDs coincidentes en O(tokens).
 *
 * Capas de matching (combinadas):
 *   A. Índice invertido con pesos por campo (nombre 100, sinónimos 80…)
 *   B. Normalización: NFD, acentos, guiones bajos, stopwords en query
 *   C. Expansión de sinónimos coloquiales (muelas→dental, etc.)
 *   D. Bigramas de palabras: frases compuestas ("dolor de cabeza")
 *   E. Fuzzy: distancia de Levenshtein ≤ umbral para tolerar typos
 *   F. TF-IDF: IDF por token (tokens raros pesan más) + cosine-like
 *      normalización para ranking por relevancia real.
 *
 * Antes: db.ingredients.toArray() + filter en cada búsqueda (~545 recorridos).
 * Ahora: lookup en Map<token, weight> (~constante por token).
 */

import { db } from '@/db';
import type { DbIngredient, IngredientCategory, BodySystem } from '@/db/schema';
import { canonicalIndication } from '@/lib/text';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  InvertedIndex, buildTokens, type FacetFilter, type ScoredDoc,
} from './searchEngine';

export interface SearchFilters {
  query?: string;
  category?: IngredientCategory;
  system?: BodySystem;
  evidenceLevel?: 'A' | 'B' | 'C' | 'D';
  indication?: string;
}

export interface SearchResult {
  ingredient: DbIngredient;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'synonym';
}

/** Facets de ingrediente usados para filtrado barato. */
type IngFacet = 'categoria' | 'sistema' | 'evidencia' | 'indication';

/**
 * Ingredient Search Service
 *
 * Motor de búsqueda optimizado para el mostrador de farmacia. Delega el
 * scoring TF-IDF + fuzzy en `searchEngine` (compartido con ProductSearchService)
 * y añade la lógica específica de indexación de ingredientes (pesos por campo,
 * canonicalIndication para las indicaciones).
 *
 * Capas de matching (en `@/lib/text` + `searchEngine`):
 *   A. Índice invertido con pesos por campo (nombre 100, sinónimos 80…)
 *   B. Normalización: NFD, acentos, guiones bajos, stopwords en query
 *   C. Expansión de sinónimos coloquiales (muelas→dental, etc.)
 *   D. Bigramas de palabras: frases compuestas ("dolor de cabeza")
 *   E. Fuzzy: distancia de Levenshtein ≤ umbral para tolerar typos
 *   F. TF-IDF: IDF por token (tokens raros pesan más)
 */
export class IngredientSearchService {
  private index = new InvertedIndex<IngFacet>();
  private cache = new Map<string, DbIngredient>();
  private built = false;

  async buildIndex(): Promise<void> {
    const ingredients = await db.ingredients.toArray();
    this.index.clear();
    this.cache.clear();
    for (const ing of ingredients) {
      this.indexIngredient(ing);
    }
    this.built = true;
  }

  private indexIngredient(ing: DbIngredient): void {
    const tokens = new Map<string, number>();
    const merge = (m: Map<string, number>) => {
      for (const [tok, w] of m) tokens.set(tok, Math.max(tokens.get(tok) ?? 0, w));
    };
    merge(buildTokens(ing.nombre, 100));
    merge(buildTokens(ing.id, 100));
    if (ing.familia) merge(buildTokens(ing.familia, 30));
    for (const s of ing.sinonimos ?? []) merge(buildTokens(s, 80));
    for (const ind of ing.indicaciones ?? []) merge(buildTokens(ind, 40));
    for (const prop of ing.propiedades ?? []) merge(buildTokens(prop, 20));

    const indications = new Set<string>();
    for (const ind of ing.indicaciones ?? []) indications.add(canonicalIndication(ind));

    this.index.add({
      id: ing.id,
      tokens,
      facets: {
        categoria: new Set([ing.categoria]),
        sistema: new Set(ing.sistemas ?? []),
        evidencia: new Set([ing.evidencia]),
        indication: indications,
      },
    });
    this.cache.set(ing.id, ing);
  }

  reindex(ing: DbIngredient): void {
    this.index.remove(ing.id);
    this.indexIngredient(ing);
  }

  remove(id: string): void {
    this.index.remove(id);
    this.cache.delete(id);
  }

  isBuilt(): boolean {
    return this.built;
  }

  get size(): number {
    return this.cache.size;
  }

  getIngredient(id: string): DbIngredient | undefined {
    return this.cache.get(id);
  }

  /** Cuenta indicaciones normalizadas → nº de ingredientes. Para chips. */
  indicationCounts(): Map<string, number> {
    return this.index.facetCounts('indication');
  }

  searchSync(filters: SearchFilters): SearchResult[] {
    if (!this.built) return [];
    return this.runSearch(filters);
  }

  async search(filters: SearchFilters): Promise<SearchResult[]> {
    if (!this.built) await this.buildIndex();
    return this.runSearch(filters);
  }

  private runSearch(filters: SearchFilters): SearchResult[] {
    const { query, category, system, evidenceLevel, indication } = filters;
    // El facet 'indication' se compara normalizando (canonicalIndication se
    // guardó ya canonical, y el filtro llega como etiqueta cruda).
    const facetFilter: FacetFilter<IngFacet> = {};
    if (category) facetFilter.categoria = category;
    if (system) facetFilter.sistema = system;
    if (evidenceLevel) facetFilter.evidencia = evidenceLevel;
    if (indication) facetFilter.indication = canonicalIndication(indication);

    const scored: ScoredDoc[] = this.index.rank({
      query: query && query.length >= 2 ? query : undefined,
      facets: Object.keys(facetFilter).length > 0 ? facetFilter : undefined,
    });

    const results: SearchResult[] = [];
    for (const s of scored) {
      const ing = this.cache.get(s.id);
      if (ing) results.push({ ingredient: ing, score: s.score, matchType: s.matchType });
    }
    return results;
  }
}

export const ingredientSearchService = new IngredientSearchService();

/**
 * Hook: construye el índice reactivamente cuando la KB cambia
 * (useLiveQuery sobre el count de ingredientes) y expone el estado.
 */
export function useSearchIndex(): { ready: boolean } {
  useLiveQuery(async () => {
    const count = await db.ingredients.count();
    const current = ingredientSearchService.size;
    if (count !== current || !ingredientSearchService.isBuilt()) {
      await ingredientSearchService.buildIndex();
    }
    return count;
  }, []);
  return { ready: ingredientSearchService.isBuilt() };
}
