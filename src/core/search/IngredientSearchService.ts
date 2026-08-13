/**
 * Ingredient Search Service
 *
 * Motor de búsqueda optimizado para el mostrador de farmacia.
 *
 * Estrategia: índice invertido en memoria construido al arranque.
 * Cada token (palabra normalizada) apunta al conjunto de IDs que lo
 * contienen en nombre, sinónimos, indicaciones o propiedades. La
 * búsqueda resuelve los IDs coincidentes en O(tokens) en vez de
 * recorrer los N ingredientes por cada keystroke.
 *
 * Antes: db.ingredients.toArray() + filter en cada búsqueda (~545 recorridos).
 * Ahora: lookup en Map<token, Set<id>> (~constante por token).
 */

import { db } from '@/db';
import type { DbIngredient, IngredientCategory, BodySystem } from '@/db/schema';
import { normalize, tokenize, canonicalIndication, expandQueryTokens } from '@/lib/text';
import { useLiveQuery } from 'dexie-react-hooks';

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

interface IndexEntry {
  tokens: Map<string, number>;
  indications: Set<string>;
  categoria: IngredientCategory;
  sistemas: Set<BodySystem>;
  evidencia: string;
}

export class IngredientSearchService {
  private index = new Map<string, IndexEntry>();
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
    // Al indexar NO filtramos stopwords (los nombres propios pueden contenerlas)
    const addTokens = (text: string, weight: number) => {
      for (const tok of tokenize(text, false)) {
        tokens.set(tok, Math.max(tokens.get(tok) ?? 0, weight));
      }
    };

    addTokens(ing.nombre, 100);
    addTokens(ing.id, 100);
    if (ing.familia) addTokens(ing.familia, 30);
    for (const s of ing.sinonimos ?? []) addTokens(s, 80);
    for (const ind of ing.indicaciones ?? []) addTokens(ind, 40);
    for (const prop of ing.propiedades ?? []) addTokens(prop, 20);

    const indications = new Set<string>();
    for (const ind of ing.indicaciones ?? []) indications.add(canonicalIndication(ind));

    this.index.set(ing.id, {
      tokens,
      indications,
      categoria: ing.categoria,
      sistemas: new Set(ing.sistemas ?? []),
      evidencia: ing.evidencia,
    });
    this.cache.set(ing.id, ing);
  }

  reindex(ing: DbIngredient): void {
    this.indexIngredient(ing);
  }

  remove(id: string): void {
    this.index.delete(id);
    this.cache.delete(id);
  }

  isBuilt(): boolean {
    return this.built;
  }

  /** Número de ingredientes indexados (para estado idle / debugging). */
  get size(): number {
    return this.cache.size;
  }

  /** Devuelve un ingrediente del cache (o undefined) por ID. */
  getIngredient(id: string): DbIngredient | undefined {
    return this.cache.get(id);
  }

  /** Cuenta indicaciones normalizadas → nº de ingredientes. Para chips. */
  indicationCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const entry of this.index.values()) {
      for (const ind of entry.indications) {
        counts.set(ind, (counts.get(ind) ?? 0) + 1);
      }
    }
    return counts;
  }

  /** Versión síncrona: requiere que el índice esté construido. */
  searchSync(filters: SearchFilters): SearchResult[] {
    if (!this.built) return [];
    // Reutiliza la lógica asíncrona sin await (el índice ya está en memoria)
    return this.searchInternal(filters);
  }

  async search(filters: SearchFilters): Promise<SearchResult[]> {
    if (!this.built) {
      await this.buildIndex();
    }
    return this.searchInternal(filters);
  }

  private searchInternal(filters: SearchFilters): SearchResult[] {

    const { query, category, system, evidenceLevel, indication } = filters;

    let candidateIds: Set<string> | null = null;

    if (indication) {
      const normInd = normalize(indication);
      const ids = new Set<string>();
      for (const [id, entry] of this.index) {
        // entry.indications guarda la forma canónica (con acentos);
        // comparamos normalizando ambos lados.
        for (const ind of entry.indications) {
          if (normalize(ind) === normInd) { ids.add(id); break; }
        }
      }
      candidateIds = ids;
    }

    if (category) {
      const ids = new Set<string>();
      for (const [id, entry] of this.index) {
        if (entry.categoria === category) ids.add(id);
      }
      candidateIds = candidateIds ? intersect(candidateIds, ids) : ids;
    }

    if (system) {
      const ids = new Set<string>();
      for (const [id, entry] of this.index) {
        if (entry.sistemas.has(system)) ids.add(id);
      }
      candidateIds = candidateIds ? intersect(candidateIds, ids) : ids;
    }

    if (evidenceLevel) {
      const ids = new Set<string>();
      for (const [id, entry] of this.index) {
        if (entry.evidencia === evidenceLevel) ids.add(id);
      }
      candidateIds = candidateIds ? intersect(candidateIds, ids) : ids;
    }

    if (!query || query.trim() === '') {
      const ids = candidateIds ?? new Set(this.index.keys());
      const results: SearchResult[] = [];
      for (const id of ids) {
        const ing = this.cache.get(id);
        if (ing) results.push({ ingredient: ing, score: 1, matchType: 'exact' });
      }
      return results;
    }

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    // Expansión de consulta: inyectar sinónimos (muelas→dental, etc.)
    // Los sinónimos van tras los tokens originales y se penalizan (×0.5).
    const expandedTokens = expandQueryTokens(queryTokens);
    const synonymTokens = new Set(expandedTokens.slice(queryTokens.length));

    const scoreMap = new Map<string, { score: number; bestType: 'exact' | 'fuzzy' | 'synonym' }>();

    for (const token of expandedTokens) {
      const isSynonym = synonymTokens.has(token);
      const synonymFactor = isSynonym ? 0.5 : 1;
      for (const [id, entry] of this.index) {
        if (candidateIds && !candidateIds.has(id)) continue;
        let weight = entry.tokens.get(token) ?? 0;
        let matched = false;

        if (weight === 0) {
          for (const [tok, w] of entry.tokens) {
            if (tok.startsWith(token) || token.startsWith(tok)) {
              weight = Math.max(weight, w * 0.6);
              matched = true;
            }
          }
        } else {
          matched = true;
        }

        if (matched) {
          weight *= synonymFactor;
          const type: 'exact' | 'fuzzy' | 'synonym' =
            isSynonym ? 'synonym' :
            weight >= 100 ? 'exact' : weight >= 80 ? 'synonym' : 'fuzzy';
          const prev = scoreMap.get(id);
          if (prev) {
            prev.score += weight;
            if (rank(type) < rank(prev.bestType)) prev.bestType = type;
          } else {
            scoreMap.set(id, { score: weight, bestType: type });
          }
        }
      }
    }

    const results: SearchResult[] = [];
    for (const [id, { score, bestType }] of scoreMap) {
      const ing = this.cache.get(id);
      if (ing) results.push({ ingredient: ing, score, matchType: bestType });
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }
}

function rank(type: 'exact' | 'fuzzy' | 'synonym'): number {
  return type === 'exact' ? 0 : type === 'synonym' ? 1 : 2;
}

function intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
  const out = new Set<T>();
  for (const x of a) if (b.has(x)) out.add(x);
  return out;
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
