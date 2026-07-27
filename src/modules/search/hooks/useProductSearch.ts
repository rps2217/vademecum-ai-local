import { logger } from '../../../services/LoggerService';
import { useState, useEffect } from 'react';
import { Product } from '../../../core/types';
import { searchService } from '../../../services/SearchService';
import { semanticSearchService } from '../../../services/SemanticSearchService';
import { useSearch } from '../../../context/SearchContext';

export const useProductSearch = (useSemantic = false) => {
  const { query, setQuery, isSearching, setIsSearching } = useSearch();
  const [results, setResults] = useState<Product[]>([]);
  const [refreshBit, setRefreshBit] = useState(0);

  // Inicializar índice al montar
  useEffect(() => {
    searchService.initializeIndex().catch((e) => logger.error('Error inicializando índice', 'useProductSearch', e));
    semanticSearchService.initialize().catch((e) => logger.error('Error inicializando búsqueda semántica', 'useProductSearch', e));
    
    const handleUpdate = () => {
      searchService.initializeIndex().then(() => setRefreshBit(b => b + 1));
      semanticSearchService.initialize().then(() => setRefreshBit(b => b + 1));
    };

    window.addEventListener('db_updated', handleUpdate);
    return () => window.removeEventListener('db_updated', handleUpdate);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        let searchResults: Product[] = [];
        if (useSemantic) {
            const semanticResults = await semanticSearchService.semanticSearch(query);
            searchResults = semanticResults.map(r => r.product);
        } else {
            const searchResult = await searchService.search(query);
            searchResults = Array.isArray(searchResult.products) ? searchResult.products : [];
        }
        setResults(searchResults);
      } catch (error) {
        logger.error('Error in useProductSearch:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(performSearch, 400);
    return () => clearTimeout(timer);
  }, [query, refreshBit, setIsSearching, useSemantic]);

  return { 
    query, 
    setQuery, 
    results, 
    isSearching 
  };
};
