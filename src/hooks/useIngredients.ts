/**
 * Hook para obtener ingredientes de la base de datos local.
 * Usa el motor de búsqueda indexado (índice invertido) en vez de
 * toArray+filter en memoria. Reacciona a cambios de la KB via useSearchIndex.
 */

import { useMemo } from 'react';
import { ingredientSearchService, useSearchIndex } from '@/core/search';
import type { DbIngredient, IngredientCategory, BodySystem } from '@/db/schema';

export interface UseIngredientsOptions {
  category?: IngredientCategory;
  system?: BodySystem;
  query?: string;
  limit?: number;
}

export interface UseIngredientsResult {
  ingredients: DbIngredient[];
  isLoading: boolean;
  error: Error | null;
  total: number;
}

export function useIngredients(options: UseIngredientsOptions = {}): UseIngredientsResult {
  const { category, system, query, limit = 100 } = options;
  const { ready } = useSearchIndex();

  const data = useMemo(() => {
    if (!ready) return { ingredients: [] as DbIngredient[], total: 0 };
    const results = ingredientSearchService.searchSync({
      query,
      category,
      system,
    });
    const ingredients = results.map(r => r.ingredient);
    return {
      ingredients: ingredients.slice(0, limit),
      total: ingredients.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, category, system, query, limit]);

  return {
    ingredients: data.ingredients,
    isLoading: !ready,
    error: null,
    total: data.total,
  };
}
