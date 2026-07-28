/**
 * Dexie Hooks para React
 * 
 * Hooks reactivos para usar con Dexie + React.
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { useState, useEffect, useCallback } from 'react';
import { db, type DbIngredient, type DbSynergy, type DbProduct, type DbProtocol } from './schema';

/**
 * Hook para ingredientes activos (no eliminados)
 */
export function useIngredients() {
  return useLiveQuery(
    () => db.ingredients.where('tombstone').equals(0).toArray(),
    [],
    [] as DbIngredient[]
  );
}

/**
 * Hook para un ingrediente específico
 */
export function useIngredient(id: string | null) {
  return useLiveQuery(
    () => id ? db.ingredients.get(id) : undefined,
    [id],
    undefined
  );
}

/**
 * Hook para buscar ingredientes
 */
export function useSearchIngredients(query: string) {
  const ingredients = useIngredients();

  if (!query.trim()) return ingredients;

  const lowerQuery = query.toLowerCase();
  return ingredients.filter(ing => 
    ing.nombre.toLowerCase().includes(lowerQuery) ||
    ing.sinonimos.some(s => s.toLowerCase().includes(lowerQuery)) ||
    ing.indicaciones.some(i => i.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Hook para sinergias activas
 */
export function useSynergies() {
  return useLiveQuery(
    () => db.synergies.where('tombstone').equals(0).toArray(),
    [],
    [] as DbSynergy[]
  );
}

/**
 * Hook para sinergias de un ingrediente
 */
export function useSynergiesFor(ingredientId: string) {
  return useLiveQuery(
    () => db.synergies
      .where('tombstone').equals(0)
      .filter(s => s.ingredienteA === ingredientId || s.ingredienteB === ingredientId)
      .toArray(),
    [ingredientId],
    [] as DbSynergy[]
  );
}

/**
 * Hook para productos
 */
export function useProducts() {
  return useLiveQuery(
    () => db.products.where('tombstone').equals(0).toArray(),
    [],
    [] as DbProduct[]
  );
}

/**
 * Hook para un producto específico
 */
export function useProduct(sku: string | null) {
  return useLiveQuery(
    () => sku ? db.products.get(sku) : undefined,
    [sku],
    undefined
  );
}

/**
 * Hook para protocolos
 */
export function useProtocols() {
  return useLiveQuery(
    () => db.protocols.where('tombstone').equals(0).toArray(),
    [],
    [] as DbProtocol[]
  );
}

/**
 * Hook para estadísticas de la DB
 */
export function useDbStats() {
  return useLiveQuery(async () => {
    const [
      totalIngredients,
      totalSynergies,
      totalProducts,
      totalProtocols,
    ] = await Promise.all([
      db.ingredients.where('tombstone').equals(0).count(),
      db.synergies.where('tombstone').equals(0).count(),
      db.products.where('tombstone').equals(0).count(),
      db.protocols.where('tombstone').equals(0).count(),
    ]);

    return {
      totalIngredients,
      totalSynergies,
      totalProducts,
      totalProtocols,
    };
  }, {}, { totalIngredients: 0, totalSynergies: 0, totalProducts: 0, totalProtocols: 0 });
}

/**
 * Hook para historial de búsquedas
 */
export function useSearchHistory(limit: number = 10) {
  return useLiveQuery(
    () => db.searchHistory.orderBy('timestamp').reverse().limit(limit).toArray(),
    [limit],
    []
  );
}

/**
 * Estado de conexión de la DB
 */
export function useDbReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    db.open().then(() => {
      setReady(true);
    }).catch((error) => {
      console.error('Error opening database:', error);
    });

    return () => {
      db.close();
    };
  }, []);

  return ready;
}

/**
 * Hook genérico para una query
 */
export function useQuery<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = [],
  defaultValue: T
): T {
  const [result, setResult] = useState<T>(defaultValue);

  useEffect(() => {
    queryFn().then(setResult).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return result;
}
