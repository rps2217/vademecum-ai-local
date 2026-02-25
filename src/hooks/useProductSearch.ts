import { useState, useEffect, useRef } from 'react';
import { Product } from '../core/types/product.types';
import { getDB } from '../core/database/db';

// Índice en memoria para búsquedas ultra-rápidas
interface SearchIndexItem {
  sku: string;
  searchableText: string;
  product: Product;
}

export const useProductSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchIndex = useRef<SearchIndexItem[]>([]);
  const isIndexLoaded = useRef(false);

  // Cargar el índice en memoria una sola vez
  useEffect(() => {
    const loadIndex = async () => {
      try {
        const db = await getDB();
        const allProducts = await db.getAll('products');
        
        searchIndex.current = allProducts.map(product => ({
          sku: product.sku,
          product,
          searchableText: `
            ${product.nombre_comercial} 
            ${product.principios_activos.join(' ')} 
            ${product.indicaciones.join(' ')}
            ${product.tags_ia.join(' ')}
          `.toLowerCase()
        }));
        
        isIndexLoaded.current = true;
      } catch (error) {
        console.error('Error cargando índice de búsqueda:', error);
      }
    };

    loadIndex();
  }, []);

  useEffect(() => {
    const searchProducts = () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      if (!isIndexLoaded.current) {
        // Si el índice aún no carga, esperamos un poco y reintentamos
        setTimeout(searchProducts, 100);
        return;
      }

      setIsSearching(true);
      
      try {
        const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 0);
        
        const filtered = searchIndex.current.filter(item => {
          // El producto debe coincidir con TODOS los términos de búsqueda
          return searchTerms.every(term => item.searchableText.includes(term));
        });

        // Limitar a los primeros 50 resultados para no saturar el DOM
        setResults(filtered.slice(0, 50).map(item => item.product));
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
