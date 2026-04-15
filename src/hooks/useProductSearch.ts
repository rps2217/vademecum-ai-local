import { useState, useEffect, useRef } from 'react';
import { Product, SafetyStatus } from '../core/types/product.types';
import { getDB } from '../core/database/db';
import { AIService } from '../services/AIService';
import { formatArrayToString } from '../utils/formatters';
import { cosineSimilarity } from '../utils/math';
import { COMMON_PATHOLOGIES } from '../constants/pathologies';

// Índice en memoria para búsquedas ultra-rápidas
interface SearchIndexItem {
  sku: string;
  searchableText: string;
  pathologySearchableText: string;
  product: Product;
  vector?: number[];
}

function normalizeText(text: string): string {
  if (!text) return '';
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export interface CategorizedTags {
  tipos: {tag: string, count: number}[];
  sintomas: {tag: string, count: number}[];
  otros: {tag: string, count: number}[];
}

export type SafetyCondition = 'apto_embarazo' | 'apto_lactancia' | 'apto_pediatria' | 'apto_diabeticos' | 'apto_hipertensos' | 'apto_celiacos';

export const useProductSearch = () => {
  const [query, setQuery] = useState('');
  const [conditionFilters, setConditionFilters] = useState<SafetyCondition[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [indexVersion, setIndexVersion] = useState(0);
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
          searchableText: normalizeText(`
            ${product.sku || ''}
            ${product.nombre_comercial || ''} 
            ${product.categoria_principal || ''}
            ${formatArrayToString(product.principios_activos, ' ')} 
            ${formatArrayToString(product.indicaciones, ' ')}
            ${formatArrayToString(product.tags_ia, ' ')}
            ${product.analisis_componentes || ''}
          `),
          pathologySearchableText: normalizeText(`
            ${formatArrayToString(product.indicaciones, ' ')}
          `)
        }));
        
        isIndexLoaded.current = true;
        setIndexVersion(v => v + 1);
      } catch (error) {
        console.error('Error cargando índice de búsqueda:', error);
      }
    };

    loadIndex();

    // Escuchar cambios en la base de datos para re-indexar automáticamente
    window.addEventListener('db_updated', loadIndex);
    return () => {
      window.removeEventListener('db_updated', loadIndex);
    };
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (!query.trim() && conditionFilters.length === 0) {
        setResults([]);
        return;
      }

      if (!isIndexLoaded.current) {
        setTimeout(searchProducts, 100);
        return;
      }

      setIsSearching(true);
      
      try {
        const normalizedQuery = normalizeText(query);
        
        // Determinar si es una búsqueda de patología frecuente
        const isPathologySearch = COMMON_PATHOLOGIES.some(p => normalizeText(p) === normalizedQuery);
        
        // Stop words comunes en español para ignorar en búsquedas por palabras sueltas
        const stopWords = new Set(['de', 'la', 'el', 'en', 'y', 'o', 'a', 'las', 'los', 'con', 'por', 'para', 'un', 'una']);
        
        // Diccionario de sinónimos para patologías
        const synonymsMap: Record<string, string[]> = {
          "dolor de cabeza": ["migraña", "cefalea", "jaqueca"],
          "migraña": ["dolor de cabeza", "cefalea", "jaqueca"],
          "gripe": ["resfrío", "resfriado", "influenza", "catarro"],
          "resfrio": ["gripe", "resfriado", "catarro", "influenza"],
          "artrosis": ["artritis", "dolor articular", "reumatismo"],
          "artritis": ["artrosis", "dolor articular", "reumatismo"],
          "dolor articular": ["artrosis", "artritis", "reumatismo"],
          "acne": ["espinillas", "granos", "barros"],
          "caida de cabello": ["alopecia", "calvicie"],
          "insomnio": ["trastornos del sueño", "dificultad para dormir", "desvelo"],
          "estres": ["nerviosismo", "ansiedad", "tensión"],
          "ansiedad": ["nerviosismo", "estrés", "angustia"],
          "fatiga": ["cansancio", "agotamiento", "astenia", "debilidad"],
          "sobrepeso": ["obesidad", "adelgazar", "control de peso"],
          "gases y meteorismo": ["flatulencia", "gases", "meteorismo", "hinchazón"],
          "aftas y estomatitis": ["aftas", "estomatitis", "llagas"],
          "hematomas y contusiones": ["hematomas", "contusiones", "moretones", "golpes"],
          "picaduras de insectos": ["picaduras"],
          "pesadez de piernas": ["piernas cansadas", "várices", "mala circulación"],
          "agotamiento intelectual": ["memoria", "concentración", "cansancio mental"]
        };

        // 1. Búsqueda por Texto (Exacta/Keyword) - Peso 1.0
        let textFiltered = searchIndex.current;
        const textResults = new Map<string, { product: Product, score: number }>();
        
        if (normalizedQuery.length > 0) {
          // Preparar frases exactas a buscar (la query original + sinónimos si existen)
          const exactPhrasesToSearch = [normalizedQuery];
          if (synonymsMap[normalizedQuery]) {
            exactPhrasesToSearch.push(...synonymsMap[normalizedQuery].map(normalizeText));
          }

          // Preparar términos individuales ignorando stop words
          const searchTerms = normalizedQuery.split(' ').filter(t => t.length > 0 && !stopWords.has(t));

          textFiltered.forEach(item => {
            const textToSearch = isPathologySearch ? item.pathologySearchableText : item.searchableText;
            let matchedExact = false;

            // Primero intentamos coincidencia de frase exacta (o sinónimos)
            for (const phrase of exactPhrasesToSearch) {
              const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`\\b${escapedPhrase}\\b`, 'i');
              if (regex.test(textToSearch)) {
                matchedExact = true;
                break;
              }
            }

            if (matchedExact) {
              // Coincidencia exacta tiene puntuación máxima
              textResults.set(item.sku, { product: item.product, score: 1.0 });
            } else if (!isPathologySearch && searchTerms.length > 0) {
              // Si no es patología, buscamos por palabras individuales (sin stop words)
              let matchCount = 0;
              searchTerms.forEach(term => {
                const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escapedTerm}\\b`, 'i');
                if (regex.test(textToSearch)) {
                  matchCount++;
                }
              });
              
              if (matchCount > 0) {
                const score = matchCount / searchTerms.length;
                textResults.set(item.sku, { product: item.product, score });
              }
            }
          });
        } else if (conditionFilters.length > 0) {
          // Si no hay términos de búsqueda pero hay filtros, incluimos todos para filtrar después
          textFiltered.forEach(item => {
            textResults.set(item.sku, { product: item.product, score: 1.0 });
          });
        }

        // 2. Búsqueda Semántica (IA) - Peso Variable
        const semanticResults = new Map<string, { product: Product, score: number }>();
        const status = AIService.getStatus();
        
        if (status.isReady && query.trim().length > 3) {
          const queryVector = await AIService.generateEmbedding(query);
          
          searchIndex.current.forEach(item => {
            if (item.vector && item.vector.length > 0) {
              const similarity = cosineSimilarity(queryVector, item.vector);
              if (similarity > 0.7) { // Umbral de relevancia semántica
                semanticResults.set(item.sku, { product: item.product, score: similarity });
              }
            }
          });
        }

        // 3. Combinación Inteligente (Hybrid Search)
        // Damos prioridad a coincidencias de texto exactas pero permitimos que la semántica eleve resultados
        const finalResultsMap = new Map<string, { product: Product, finalScore: number }>();
        
        // Procesar resultados de texto
        textResults.forEach((val, sku) => {
          const semantic = semanticResults.get(sku);
          const semanticScore = semantic ? semantic.score : 0;
          // Fórmula: 70% Texto + 30% Semántica para resultados que tienen ambos
          const finalScore = (val.score * 0.7) + (semanticScore * 0.3);
          finalResultsMap.set(sku, { product: val.product, finalScore });
        });
        
        // Añadir resultados puramente semánticos (que no coincidieron por texto)
        semanticResults.forEach((val, sku) => {
          if (!finalResultsMap.has(sku)) {
            // Penalizamos un poco los puramente semánticos para que no desplacen a los de texto exacto
            finalResultsMap.set(sku, { product: val.product, finalScore: val.score * 0.8 });
          }
        });

        let combined = Array.from(finalResultsMap.values())
          .sort((a, b) => b.finalScore - a.finalScore)
          .map(i => i.product);

        // 4. Aplicar Filtro de Seguridad (Si está activo)
        if (conditionFilters.length > 0) {
          combined = combined.filter(p => {
            // El producto debe ser APTO (SafetyStatus.SI) para TODAS las condiciones seleccionadas
            return conditionFilters.every(condition => p[condition] === SafetyStatus.SI);
          });
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
  }, [query, conditionFilters, indexVersion]);

  return { query, setQuery, conditionFilters, setConditionFilters, results, isSearching };
};
