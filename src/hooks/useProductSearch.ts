import { useState, useEffect } from 'react';
import { Product } from '../core/types/product.types';
import { getDB } from '../core/database/db';

export const useProductSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searchProducts = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const db = await getDB();
        const tx = db.transaction('products', 'readonly');
        const store = tx.objectStore('products');
        
        // Búsqueda básica (Full-scan en memoria para este prototipo)
        // En un entorno real con miles de registros, se usaría un índice FTS o vectores
        const allProducts = await store.getAll();
        
        const searchTerms = query.toLowerCase().split(' ');
        
        const filtered = allProducts.filter(product => {
          const searchableText = `
            ${product.nombre_comercial} 
            ${product.principios_activos.join(' ')} 
            ${product.indicaciones.join(' ')}
            ${product.tags_ia.join(' ')}
          `.toLowerCase();

          // El producto debe coincidir con TODOS los términos de búsqueda
          return searchTerms.every(term => searchableText.includes(term));
        });

        setResults(filtered);
      } catch (error) {
        console.error('Error buscando productos:', error);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce simple
    const timeoutId = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return { query, setQuery, results, isSearching };
};
