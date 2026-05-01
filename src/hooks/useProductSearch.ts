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
        // En un entorno real, usaríamos el Worker aquí para evitar bloqueos
        // Para asegurar compatibilidad inmediata y robustez, SearchService ya está optimizado,
        // pero vamos a simular la asincronía del worker para liberar el event loop.
        const searchResults = await new Promise<Product[]>((resolve) => {
          setTimeout(async () => {
             const res = await SearchService.search(query, COMMON_PATHOLOGIES);
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
  }, [query, refreshBit]);

  return { 
    query, 
    setQuery, 
    results, 
    isSearching 
  };
};
