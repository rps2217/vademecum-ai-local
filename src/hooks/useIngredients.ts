/**
 * Hook para obtener ingredientes de la base de datos local
 * Con soporte para filtros y recargas después de sync
 */

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db';
import { syncManager } from '@/data/sync/SyncManager';
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
  refetch: () => Promise<void>;
}

export function useIngredients(options: UseIngredientsOptions = {}): UseIngredientsResult {
  const { category, system, query, limit = 100 } = options;
  const [ingredients, setIngredients] = useState<DbIngredient[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadIngredients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let collection = db.ingredients.toCollection();

      // Aplicar filtro de categoría usando índice
      if (category) {
        collection = db.ingredients.where('categoria').equals(category);
      }

      const results = await collection.toArray();
      setTotal(results.length);

      // Filtrado adicional en memoria
      let filtered = results;

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

      setIngredients(filtered.slice(0, limit));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error loading ingredients'));
      console.error('[useIngredients] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [category, system, query, limit]);

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  // Recargar después de sync completado
  useEffect(() => {
    const unsubscribe = syncManager.subscribe((progress) => {
      if (progress.state === 'idle' && progress.completed > 0) {
        console.log('[useIngredients] Sync completed, refreshing...');
        loadIngredients();
      }
    });

    return unsubscribe;
  }, [loadIngredients]);

  return {
    ingredients,
    isLoading,
    error,
    total,
    refetch: loadIngredients,
  };
}

/**
 * Hook para obtener un ingrediente específico
 */
export function useIngredient(id: string): {
  ingredient: DbIngredient | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [ingredient, setIngredient] = useState<DbIngredient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const result = await db.ingredients.get(id);
        setIngredient(result || null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error loading ingredient'));
      } finally {
        setIsLoading(false);
      }
    }
    
    if (id) {
      load();
    }
  }, [id]);

  return { ingredient, isLoading, error };
}
