/**
 * OmniSearchService - Servicio de búsqueda omnipresente unificada.
 *
 * Indexa simultáneamente:
 * 1. Catálogo de Productos Comerciales (nombre comercial, principios activos, fabricante, indicaciones, cómo funciona)
 * 2. Base de Conocimiento "¿Cómo Funciona?" (explicaciones clínicas simplificadas para mostrador)
 * 3. Ingredientes Canónicos (fitoterapia, homeopatía, aceites, vitaminas)
 * 4. Patologías y Cuadros Clínicos
 *
 * Arquitectura local-first con índice invertido en memoria, TF-IDF y tolerancia fuzzy.
 */

import { db } from '@/db';
import type { DbProduct, DbIngredient, DbPathology, DbClinicalExplanation } from '@/db/schema';
import { InvertedIndex, buildTokens } from './searchEngine';
import { humanize, normalize } from '@/lib/text';
import { useEffect, useState } from 'react';

export type OmniCategory = 'all' | 'products' | 'explanations' | 'ingredients' | 'pathologies';

export interface OmniProductResult {
  type: 'product';
  id: string;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'synonym';
  product: DbProduct;
}

export interface OmniExplanationResult {
  type: 'explanation';
  id: string;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'synonym';
  explanation: DbClinicalExplanation;
  ingredient?: DbIngredient;
  pathology?: DbPathology;
}

export interface OmniIngredientResult {
  type: 'ingredient';
  id: string;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'synonym';
  ingredient: DbIngredient;
}

export interface OmniPathologyResult {
  type: 'pathology';
  id: string;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'synonym';
  pathology: DbPathology;
}

export type OmniSearchResult =
  | OmniProductResult
  | OmniExplanationResult
  | OmniIngredientResult
  | OmniPathologyResult;

export interface OmniSearchOptions {
  category?: OmniCategory;
  limit?: number;
}

type OmniFacet = 'type' | 'category' | 'system';

export class OmniSearchService {
  private index = new InvertedIndex<OmniFacet>();
  private productsCache = new Map<string, DbProduct>();
  private ingredientsCache = new Map<string, DbIngredient>();
  private pathologiesCache = new Map<string, DbPathology>();
  private explanationsCache = new Map<string, DbClinicalExplanation>();
  private built = false;
  private buildingPromise: Promise<void> | null = null;

  async buildIndex(): Promise<void> {
    if (this.buildingPromise) return this.buildingPromise;

    this.buildingPromise = (async () => {
      const [products, ingredients, pathologies, explanations] = await Promise.all([
        db.products.toArray(),
        db.ingredients.where('tombstone').equals(0).toArray(),
        db.pathologies.where('tombstone').equals(0).toArray(),
        db.clinicalExplanations.where('tombstone').equals(0).toArray().catch(() => db.clinicalExplanations.filter(e => !e.tombstone).toArray()),
      ]);

      this.index.clear();
      this.productsCache.clear();
      this.ingredientsCache.clear();
      this.pathologiesCache.clear();
      this.explanationsCache.clear();

      // Mapeos rápidos para joins
      for (const ing of ingredients) {
        this.ingredientsCache.set(ing.id, ing);
      }
      for (const pat of pathologies) {
        this.pathologiesCache.set(pat.id, pat);
      }

      // 1. Indexar Productos comerciales
      for (const prod of products) {
        if (prod.tombstone) continue;
        this.productsCache.set(prod.sku, prod);

        const tokens = new Map<string, number>();
        const merge = (sub: Map<string, number>) => {
          for (const [tok, w] of sub) {
            tokens.set(tok, Math.max(tokens.get(tok) ?? 0, w));
          }
        };

        merge(buildTokens(prod.nombreComercial, 100));
        for (const pa of prod.principiosActivos ?? []) {
          merge(buildTokens(pa, 85));
        }
        for (const ind of prod.indicaciones ?? []) {
          merge(buildTokens(ind, 50));
        }
        if (prod.fabricante) {
          merge(buildTokens(prod.fabricante, 35));
        }
        if (prod.comoFunciona || prod.como_funciona) {
          merge(buildTokens(prod.comoFunciona || prod.como_funciona || '', 40));
        }

        this.index.add({
          id: `prod:${prod.sku}`,
          tokens,
          facets: {
            type: new Set(['products']),
            category: prod.categoria ? new Set([normalize(prod.categoria)]) : undefined,
          },
        });
      }

      // 2. Indexar "¿Cómo Funciona?" / Explicaciones Clínicas
      for (const exp of explanations) {
        this.explanationsCache.set(exp.id, exp);
        const ing = this.ingredientsCache.get(exp.ingredienteId);
        const pat = this.pathologiesCache.get(exp.patologiaId);

        const tokens = new Map<string, number>();
        const merge = (sub: Map<string, number>) => {
          for (const [tok, w] of sub) {
            tokens.set(tok, Math.max(tokens.get(tok) ?? 0, w));
          }
        };

        if (ing) {
          merge(buildTokens(ing.nombre, 95));
          for (const s of ing.sinonimos ?? []) {
            merge(buildTokens(s, 70));
          }
        }
        if (pat) {
          merge(buildTokens(pat.nombre, 95));
          merge(buildTokens(pat.id, 90));
          for (const s of pat.sintomas ?? []) {
            merge(buildTokens(s, 60));
          }
        }
        merge(buildTokens(exp.explicacion, 45));

        this.index.add({
          id: `exp:${exp.id}`,
          tokens,
          facets: {
            type: new Set(['explanations']),
          },
        });
      }

      // 3. Indexar Ingredientes
      for (const ing of ingredients) {
        const tokens = new Map<string, number>();
        const merge = (sub: Map<string, number>) => {
          for (const [tok, w] of sub) {
            tokens.set(tok, Math.max(tokens.get(tok) ?? 0, w));
          }
        };

        merge(buildTokens(ing.nombre, 100));
        for (const s of ing.sinonimos ?? []) {
          merge(buildTokens(s, 80));
        }
        for (const ind of ing.indicaciones ?? []) {
          merge(buildTokens(humanize(ind), 60));
        }
        for (const p of ing.propiedades ?? []) {
          merge(buildTokens(p, 45));
        }
        if (ing.beneficioCliente) {
          merge(buildTokens(ing.beneficioCliente, 50));
        }

        this.index.add({
          id: `ing:${ing.id}`,
          tokens,
          facets: {
            type: new Set(['ingredients']),
            category: new Set([normalize(ing.categoria)]),
          },
        });
      }

      // 4. Indexar Patologías
      for (const pat of pathologies) {
        const tokens = new Map<string, number>();
        const merge = (sub: Map<string, number>) => {
          for (const [tok, w] of sub) {
            tokens.set(tok, Math.max(tokens.get(tok) ?? 0, w));
          }
        };

        merge(buildTokens(pat.nombre, 100));
        merge(buildTokens(pat.id, 85));
        for (const s of pat.sintomas ?? []) {
          merge(buildTokens(s, 65));
        }
        merge(buildTokens(pat.definicion, 35));

        this.index.add({
          id: `pat:${pat.id}`,
          tokens,
          facets: {
            type: new Set(['pathologies']),
          },
        });
      }

      this.built = true;
    })();

    return this.buildingPromise;
  }

  isReady(): boolean {
    return this.built;
  }

  searchSync(query: string, options: OmniSearchOptions = {}): OmniSearchResult[] {
    if (!this.built || !query.trim()) return [];

    const category = options.category ?? 'all';
    const limit = options.limit ?? 25;

    const facetFilter = category !== 'all' ? { type: category } : undefined;
    const scoredDocs = this.index.rankDocs(query, facetFilter);

    const results: OmniSearchResult[] = [];
    const seenExplanations = new Set<string>();

    for (const doc of scoredDocs) {
      if (results.length >= limit) break;

      const [prefix, id] = doc.id.split(':');

      if (prefix === 'prod') {
        const product = this.productsCache.get(id);
        if (product) {
          results.push({
            type: 'product',
            id: doc.id,
            score: doc.score,
            matchType: doc.matchType,
            product,
          });
        }
      } else if (prefix === 'exp') {
        const explanation = this.explanationsCache.get(id);
        if (explanation) {
          // Evitar redundancias de la misma pareja
          if (seenExplanations.has(explanation.id)) continue;
          seenExplanations.add(explanation.id);

          const ingredient = this.ingredientsCache.get(explanation.ingredienteId);
          const pathology = this.pathologiesCache.get(explanation.patologiaId);

          results.push({
            type: 'explanation',
            id: doc.id,
            score: doc.score,
            matchType: doc.matchType,
            explanation,
            ingredient,
            pathology,
          });
        }
      } else if (prefix === 'ing') {
        const ingredient = this.ingredientsCache.get(id);
        if (ingredient) {
          results.push({
            type: 'ingredient',
            id: doc.id,
            score: doc.score,
            matchType: doc.matchType,
            ingredient,
          });
        }
      } else if (prefix === 'pat') {
        const pathology = this.pathologiesCache.get(id);
        if (pathology) {
          results.push({
            type: 'pathology',
            id: doc.id,
            score: doc.score,
            matchType: doc.matchType,
            pathology,
          });
        }
      }
    }

    return results;
  }
}

export const omniSearchService = new OmniSearchService();

/** Hook para inicializar y observar el estado del índice omnipresente */
export function useOmniSearchIndex() {
  const [ready, setReady] = useState(omniSearchService.isReady());

  useEffect(() => {
    let mounted = true;
    if (!omniSearchService.isReady()) {
      omniSearchService.buildIndex().then(() => {
        if (mounted) setReady(true);
      });
    }
    return () => {
      mounted = false;
    };
  }, []);

  return { ready };
}
