/**
 * Synergy Search Service
 *
 * Motor de búsqueda de sinergias que reutiliza el mismo `searchEngine`
 * (índice invertido + TF-IDF + fuzzy Levenshtein) que IngredientSearchService
 * y ProductSearchService, de modo que "valerina" (typo) encuentre tanto el
 * ingrediente como las sinergias que lo involucran con la misma tolerancia.
 *
 * Pesos por campo:
 *   - ingredienteA nombre: 100  (lo más buscado)
 *   - ingredienteB nombre: 100
 *   - mecanismo: 40             (descripción del mecanismo de acción)
 *   - descripcion: 30
 *   - id de ingrediente: 90     (para match exacto por id interno)
 *
 * Facets:
 *   - tipo: sinergia, complemento, interacción, antagonismo…
 *   - evidencia: A, B, C, D
 *   - nivel: bajo, medio, alto, critico
 *
 * 100% offline e instantáneo (<5ms para ~1170 sinergias).
 */

import { db } from '@/db';
import type { DbSynergy, EvidenceLevel } from '@/db/schema';
import type { SynergyType, SynergyLevel } from '@/types/shared-enums';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  InvertedIndex, buildTokens, type FacetFilter, type ScoredDoc,
} from './searchEngine';

export interface SynergySearchFilters {
  query?: string;
  tipo?: SynergyType;
  evidencia?: EvidenceLevel;
  nivel?: SynergyLevel;
  /** Filtrar por ingrediente (id) — sinergias donde participa A o B */
  ingredientId?: string;
}

export interface SynergySearchResult {
  synergy: DbSynergy;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'synonym';
}

/** Facets de sinergia. */
type SynFacet = 'tipo' | 'evidencia' | 'nivel';

/**
 * SynergySearchService — singleton gemelo de IngredientSearchService.
 *
 * Indexa db.synergies en un InvertedIndex al arranque y expone searchSync()
 * para la búsqueda de la página de Sinergias. Necesita un map de ingredientes
 * (id → nombre) para resolver los nombres al indexar y al filtrar.
 */
export class SynergySearchService {
  private index = new InvertedIndex<SynFacet>();
  private cache = new Map<string, DbSynergy>();
  /** id ingrediente → nombre, para indexar/buscar por nombre */
  private ingredientNames = new Map<string, string>();
  private built = false;

  async buildIndex(): Promise<void> {
    const [synergies, ingredients] = await Promise.all([
      db.synergies.toArray(),
      db.ingredients.toArray(),
    ]);
    this.index.clear();
    this.cache.clear();
    this.ingredientNames.clear();
    for (const ing of ingredients) {
      this.ingredientNames.set(ing.id, ing.nombre);
    }
    for (const syn of synergies) {
      if (syn.tombstone) continue;
      this.indexSynergy(syn);
    }
    this.built = true;
  }

  private indexSynergy(syn: DbSynergy): void {
    const tokens = new Map<string, number>();
    const merge = (m: Map<string, number>) => {
      for (const [tok, w] of m) tokens.set(tok, Math.max(tokens.get(tok) ?? 0, w));
    };

    const nameA = this.ingredientNames.get(syn.ingredienteA);
    const nameB = this.ingredientNames.get(syn.ingredienteB);
    if (nameA) merge(buildTokens(nameA, 100));
    if (nameB) merge(buildTokens(nameB, 100));
    // IDs internos con peso alto (match exacto por id, ej. al venir de un click)
    merge(buildTokens(syn.ingredienteA, 90));
    merge(buildTokens(syn.ingredienteB, 90));
    if (syn.mecanismo) merge(buildTokens(syn.mecanismo, 40));
    if (syn.descripcion) merge(buildTokens(syn.descripcion, 30));

    this.index.add({
      id: syn.id,
      tokens,
      facets: {
        tipo: new Set([syn.tipo]),
        evidencia: new Set([syn.evidencia]),
        nivel: new Set([syn.nivel]),
      },
    });
    this.cache.set(syn.id, syn);
  }

  reindex(syn: DbSynergy): void {
    this.index.remove(syn.id);
    this.cache.delete(syn.id);
    if (!syn.tombstone) this.indexSynergy(syn);
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

  getSynergy(id: string): DbSynergy | undefined {
    return this.cache.get(id);
  }

  getIngredientName(id: string): string | undefined {
    return this.ingredientNames.get(id);
  }

  /** Map completo id→nombre de ingrediente (para la UI). */
  getIngredientNames(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [id, nombre] of this.ingredientNames) out[id] = nombre;
    return out;
  }

  /** Cuenta tipos → nº de sinergias. Para chips de filtro. */
  tipoCounts(): Map<string, number> {
    return this.index.facetCounts('tipo');
  }

  /** Cuenta niveles de evidencia → nº de sinergias. */
  evidenciaCounts(): Map<string, number> {
    return this.index.facetCounts('evidencia');
  }

  searchSync(filters: SynergySearchFilters): SynergySearchResult[] {
    if (!this.built) return [];
    return this.runSearch(filters);
  }

  async search(filters: SynergySearchFilters): Promise<SynergySearchResult[]> {
    if (!this.built) await this.buildIndex();
    return this.runSearch(filters);
  }

  private runSearch(filters: SynergySearchFilters): SynergySearchResult[] {
    const { query, tipo, evidencia, nivel, ingredientId } = filters;

    const facetFilter: FacetFilter<SynFacet> = {};
    if (tipo) facetFilter.tipo = tipo;
    if (evidencia) facetFilter.evidencia = evidencia;
    if (nivel) facetFilter.nivel = nivel;

    const scored: ScoredDoc[] = this.index.rank({
      query: query && query.length >= 2 ? query : undefined,
      facets: Object.keys(facetFilter).length > 0 ? facetFilter : undefined,
    });

    const results: SynergySearchResult[] = [];
    for (const s of scored) {
      const syn = this.cache.get(s.id);
      if (!syn) continue;
      // Filtro por ingrediente participante (no es un facet, es A-or-B)
      if (ingredientId && syn.ingredienteA !== ingredientId && syn.ingredienteB !== ingredientId) {
        continue;
      }
      results.push({ synergy: syn, score: s.score, matchType: s.matchType });
    }
    return results;
  }
}

export const synergySearchService = new SynergySearchService();

/**
 * Hook: construye el índice de sinergias reactivamente cuando cambian
 * (useLiveQuery sobre el count de sinergias) y expone el estado.
 */
export function useSynergyIndex(): { ready: boolean } {
  useLiveQuery(async () => {
    const count = await db.synergies.count();
    const current = synergySearchService.size;
    if (count !== current || !synergySearchService.isBuilt()) {
      await synergySearchService.buildIndex();
    }
    return count;
  }, []);
  return { ready: synergySearchService.isBuilt() };
}
