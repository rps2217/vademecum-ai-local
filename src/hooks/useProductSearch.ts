import { useState, useEffect, useRef } from 'react';
import { Product } from '../core/types/product.types';
import { getDB } from '../core/database/db';
import { AIService } from '../services/AIService';

// Índice en memoria para búsquedas ultra-rápidas
interface SearchIndexItem {
  sku: string;
  searchableText: string;
  product: Product;
  vector?: number[];
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
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
          vector: product.vectores,
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
    const searchProducts = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      if (!isIndexLoaded.current) {
        setTimeout(searchProducts, 100);
        return;
      }

      setIsSearching(true);
      
      try {
        const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 0);
        
        // 1. Búsqueda por Texto (Exacta/Keyword)
        const textFiltered = searchIndex.current.filter(item => {
          return searchTerms.every(term => item.searchableText.includes(term));
        });

        // 2. Búsqueda Semántica (Si hay motor de IA listo)
        let semanticFiltered: { product: Product, score: number }[] = [];
        
        const status = AIService.getStatus();
        if (status.isReady) {
          const queryVector = await AIService.generateEmbedding(query);
          
          semanticFiltered = searchIndex.current
            .filter(item => item.vector && item.vector.length > 0)
            .map(item => ({
              product: item.product,
              score: cosineSimilarity(queryVector, item.vector!)
            }))
            .filter(item => item.score > 0.65) // Umbral de similitud
            .sort((a, b) => b.score - a.score);
        }

        // Combinar y eliminar duplicados
        const combined = [...textFiltered.map(i => i.product)];
        const seenSkus = new Set(combined.map(p => p.sku));
        
        for (const item of semanticFiltered) {
          if (!seenSkus.has(item.product.sku)) {
            combined.push(item.product);
            seenSkus.add(item.product.sku);
          }
        }

        setResults(combined.slice(0, 50));
      } catch (error) {
        console.error('Error buscando productos:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchProducts, 400);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return { query, setQuery, results, isSearching };
};
