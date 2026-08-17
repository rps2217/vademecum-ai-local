/**
 * useFavorites - Hook para gestionar ingredientes favoritos (marcadores).
 *
 * Persiste en IndexedDB (tabla `favorites`). Expone:
 * - `favorites`: lista de DbFavorite ordenada por createdAt desc
 * - `favoriteIngredients`: ingredientes resueltos (para renderizar cards)
 * - `isFavorite(id)`: check síncrono
 * - `toggleFavorite(id)`: añade/elimina
 */

import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateId } from '@/db';
import type { DbIngredient } from '@/db/schema';

export function useFavorites() {
  const favorites = useLiveQuery(
    () => db.favorites.orderBy('createdAt').reverse().toArray(),
    [],
  );

  const favoriteIngredients = useLiveQuery(
    () => favorites && favorites.length > 0
      ? db.ingredients.bulkGet(favorites.map((f) => f.ingredientId)) as Promise<(DbIngredient | undefined)[]>
      : Promise.resolve([]),
    [favorites],
  );

  const isFavorite = useCallback((ingredientId: string) => {
    return favorites?.some((f) => f.ingredientId === ingredientId) ?? false;
  }, [favorites]);

  const toggleFavorite = useCallback(async (ingredientId: string) => {
    const existing = await db.favorites.where('ingredientId').equals(ingredientId).first();
    if (existing) {
      await db.favorites.delete(existing.id);
    } else {
      await db.favorites.add({ id: generateId(), ingredientId, createdAt: Date.now() });
    }
  }, []);

  return {
    favorites,
    favoriteIngredients: favoriteIngredients?.filter((x): x is DbIngredient => x !== undefined) ?? [],
    isFavorite,
    toggleFavorite,
  };
}
