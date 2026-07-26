/**
 * useSemanticSearch - Hook para búsqueda semántica
 * Funciona sin Ollama usando Transformers.js o fallback fuzzy
 */

import { useState, useEffect, useCallback } from 'react';
import { embeddingService, type SearchResult } from '../core/semantic-search/embedding-service';
import type { AnalyzedProduct } from '../types';

interface UseSemanticSearchReturn {
  search: (query: string, products: AnalyzedProduct[]) => Promise<SearchResult[]>;
  isReady: boolean;
  isLoading: boolean;
  provider: string;
  error: string | null;
}

export function useSemanticSearch(): UseSemanticSearchReturn {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar servicio
  useEffect(() => {
    const init = async () => {
      try {
        await embeddingService.init();
        setIsReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error initializing');
      }
    };
    init();
  }, []);

  const search = useCallback(async (query: string, products: AnalyzedProduct[]): Promise<SearchResult[]> => {
    if (!query.trim()) return [];

    setIsLoading(true);
    setError(null);

    try {
      const results = await embeddingService.semanticSearch(query, products);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search error');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const state = embeddingService.getState();

  return {
    search,
    isReady,
    isLoading,
    provider: state.provider,
    error,
  };
}

export default useSemanticSearch;
