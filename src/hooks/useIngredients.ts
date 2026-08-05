/**
 * Hook para obtener ingredientes de la base de datos local
 * Con soporte para filtros y recargas después de sync usando useLiveQuery
 * OPTIMIZADO: Usa filtrado en Dexie cuando es posible
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
  // OPTIMIZADO: Usa filtrado en Dexie para category
  const ingredientsData = useLiveQuery(
    async () => {
      let collection = db.ingredients;
      
      // Filtrar por categoría usando índice de Dexie
      if (category) {
        collection = collection.where('categoria').equals(category);
      }
      
      const allIngredients = await collection.toArray();
      
      // Filtrado en memoria para system (no hay índice) y query
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
    },
    [category, system, query, limit],
    // Valor por defecto mientras carga
    { ingredients: [], total: 0 }
  );

  const isLoading = ingredientsData === undefined || ingredientsData === null;
  const error = null;

  return {
    ingredients: ingredientsData?.ingredients || [],
    isLoading,
    error,
    total: ingredientsData?.total || 0,
  };
}
