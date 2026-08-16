/**
 * useSearchResults — Debounce + búsqueda unificada de ingredientes y productos
 *
 * Extraído de SearchPage.tsx (hallazgo 5.7). Encapsula:
 * - Debounce único (150ms) de la consulta de texto
 * - Búsqueda de ingredientes (ingredientSearchService.searchSync)
 * - Búsqueda de productos (productSearchService.searchSync)
 * - Estado de paginación + reset automático al cambiar búsqueda/filtros
 *
 * El componente mantiene el sorting (sortedResults) y el slicing
 * (visibleResults = sortedResults.slice(0, visibleCount)).
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ingredientSearchService, useSearchIndex, productSearchService, useProductIndex } from '@/core/search';
import type { SearchResult, ProductSearchResult } from '@/core/search';
import type { IngredientCategory } from '@/db/schema';
import type { BodySystem } from '@/types/shared-enums';
import type { EvidenceLevel } from '@/ui/searchConfig';
import { RESULTS_PAGE_SIZE } from '@/ui/searchConfig';
import { logger } from '@/lib/logger';

export interface SearchFilters {
  category: string;
  indication: string;
  system: BodySystem | '';
  evidence: EvidenceLevel | '';
}

export function useSearchResults(query: string, filters: SearchFilters) {
  const { ready } = useSearchIndex();
  const { ready: productsReady } = useProductIndex();
  const { category, indication, system, evidence } = filters;

  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [visibleCount, setVisibleCount] = useState(RESULTS_PAGE_SIZE);
  const [visibleProductCount, setVisibleProductCount] = useState(RESULTS_PAGE_SIZE);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  const isSearching = query !== debouncedQuery;

  const results = useMemo<SearchResult[]>(() => {
    if (!ready) return [];
    try {
      return ingredientSearchService.searchSync({
        query: debouncedQuery.length >= 2 ? debouncedQuery : undefined,
        category: (category || undefined) as IngredientCategory | undefined,
        system: (system || undefined) as BodySystem | undefined,
        evidenceLevel: (evidence || undefined) as 'A' | 'B' | 'C' | 'D' | undefined,
        indication: indication || undefined,
      });
    } catch (error) {
      logger.error('Search error:', error);
      return [];
    }
  }, [debouncedQuery, category, indication, system, evidence, ready]);

  const productResults = useMemo<ProductSearchResult[]>(() => {
    if (!productsReady) return [];
    try {
      return productSearchService.searchSync(debouncedQuery.length >= 2 ? debouncedQuery : undefined);
    } catch (error) {
      logger.error('Product search error:', error);
      return [];
    }
  }, [debouncedQuery, productsReady]);

  // Reset de paginación al cambiar la búsqueda o los filtros.
  // Patrón "adjust state during render" recomendado por React.
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const searchKey = `${debouncedQuery}|${category}|${indication}|${system}|${evidence}`;
  const [prevSearchKey, setPrevSearchKey] = useState(searchKey);
  if (searchKey !== prevSearchKey) {
    setPrevSearchKey(searchKey);
    setVisibleCount(RESULTS_PAGE_SIZE);
    setVisibleProductCount(RESULTS_PAGE_SIZE);
  }

  const loadMore = useCallback(() => {
    setVisibleCount((c) => c + RESULTS_PAGE_SIZE);
  }, []);

  const loadMoreProducts = useCallback(() => {
    setVisibleProductCount((c) => c + RESULTS_PAGE_SIZE);
  }, []);

  return {
    debouncedQuery,
    results,
    productResults,
    isSearching,
    visibleCount,
    visibleProductCount,
    loadMore,
    loadMoreProducts,
  };
}
