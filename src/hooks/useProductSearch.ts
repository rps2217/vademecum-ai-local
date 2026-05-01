import { useState, useEffect } from 'react';
import { Product } from '../core/types';
import { SearchService } from '../services/SearchService';
import { COMMON_PATHOLOGIES } from '../constants/pathologies';

export const useProductSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshBit, setRefreshBit] = useState(0);

  // Inicializar índice al montar
  useEffect(() => {
    SearchService.initializeIndex().catch(console.error);
    
    const handleUpdate = () => {
      SearchService.initializeIndex().then(() => setRefreshBit(b => b + 1));
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
        const searchResults = await SearchService.search(query, COMMON_PATHOLOGIES);
        setResults(searchResults);
      } catch (error) {
        console.error('Error in useProductSearch:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(performSearch, 400);
    return () => clearTimeout(timer);
  }, [query, refreshBit]);

  return { 
    query, 
    setQuery, 
    results, 
    isSearching 
  };
};
