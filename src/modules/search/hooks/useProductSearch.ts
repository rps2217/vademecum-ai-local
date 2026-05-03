import { useState, useEffect } from 'react';
import { Product } from '../../../core/types';
import { searchService } from '../../../services/SearchService';
import { COMMON_PATHOLOGIES } from '../../../constants/pathologies';
import { useSearch } from '../../../context/SearchContext';

export const useProductSearch = () => {
  const { query, setQuery, isSearching, setIsSearching } = useSearch();
  const [results, setResults] = useState<Product[]>([]);
  const [refreshBit, setRefreshBit] = useState(0);

  // Inicializar índice al montar
  useEffect(() => {
    searchService.initializeIndex().catch(console.error);
    
    const handleUpdate = () => {
      searchService.initializeIndex().then(() => setRefreshBit(b => b + 1));
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
        // Simulación de asincronía para liberar el event loop (worker-like)
        const searchResults = await new Promise<Product[]>((resolve) => {
          setTimeout(async () => {
             const res = await searchService.search(query);
             resolve(res);
          }, 0);
        });
        setResults(searchResults);
      } catch (error) {
        console.error('Error in useProductSearch:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(performSearch, 400);
    return () => clearTimeout(timer);
  }, [query, refreshBit, setIsSearching]);

  return { 
    query, 
    setQuery, 
    results, 
    isSearching 
  };
};
