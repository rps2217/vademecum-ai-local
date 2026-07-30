/**
 * Hook para obtener ingredientes de la base de datos local
 * Con soporte para filtros y recargas después de sync usando useLiveQuery
 */

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
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

  // useLiveQuery re-renderiza automáticamente cuando los datos cambian
  const allIngredients = useLiveQuery(
    async () => {
      if (category) {
        return db.ingredients.where('categoria').equals(category).toArray();
      }
      return db.ingredients.toArray();
    },
    [category],
    // Valor por defecto mientras carga
    undefined
  );

  // Filtrado y memoización
  const { ingredients, total } = useMemo(() => {
    if (!allIngredients) {
      return { ingredients: [], total: 0 };
    }

    let filtered = allIngredients;

    if (system) {
      filtered = filtered.filter(i => i.sistemas.includes(system));
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(i =>
        i.nombre.toLowerCase().includes(q) ||
        i.sinonimos.some(s => s.toLowerCase().includes(q)) ||
        i.indicaciones.some(ind => ind.toLowerCase().includes(q))
      );
    }

    return {
      ingredients: filtered.slice(0, limit),
      total: filtered.length,
    };
  }, [allIngredients, system, query, limit]);

  const isLoading = allIngredients === undefined;
  const error = null; // Dexie throws and React error boundary catches

  return {
    ingredients,
    isLoading,
    error,
    total,
  };
}

/**
 * Hook para obtener un ingrediente específico usando useLiveQuery
 */
export function useIngredient(id: string): {
  ingredient: DbIngredient | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const ingredient = useLiveQuery(
    () => db.ingredients.get(id),
    [id],
    // Valor por defecto
    undefined
  );

  const isLoading = ingredient === undefined;
  const error = null;

  return { ingredient, isLoading, error };
}
