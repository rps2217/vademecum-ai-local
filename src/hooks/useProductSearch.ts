import { useState, useEffect, useRef } from 'react';
import { Product } from '../core/types/product.types';
import { getDB } from '../core/database/db';
import { AIService } from '../services/AIService';
import { formatArrayToString } from '../utils/formatters';

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
  const [availableTags, setAvailableTags] = useState<{tag: string, count: number}[]>([]);
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
            ${product.sku || ''}
            ${product.nombre_comercial || ''} 
            ${formatArrayToString(product.principios_activos, ' ')} 
            ${formatArrayToString(product.indicaciones, ' ')}
            ${formatArrayToString(product.tags_ia, ' ')}
          `.toLowerCase()
        }));
        
        // Extraer tags únicos y contarlos (Motor de Etiquetas Dinámico)
        const tagCounts: Record<string, number> = {};
        allProducts.forEach(p => {
          if (p.tags_ia && Array.isArray(p.tags_ia)) {
            p.tags_ia.forEach(tag => {
              const cleanTag = tag.trim().toLowerCase();
              if (cleanTag) {
                tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
              }
            });
          }
        });
        
        // Convertir a array, ordenar por frecuencia y tomar los top 30
        const sortedTags = Object.entries(tagCounts)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 30);
          
        setAvailableTags(sortedTags);
        isIndexLoaded.current = true;
      } catch (error) {
        console.error('Error cargando índice de búsqueda:', error);
      }
    };

    loadIndex();

    // Escuchar cambios en la base de datos para re-indexar automáticamente
    window.addEventListener('db_updated', loadIndex);
    return () => window.removeEventListener('db_updated', loadIndex);
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

  return { query, setQuery, results, isSearching, availableTags };
};
