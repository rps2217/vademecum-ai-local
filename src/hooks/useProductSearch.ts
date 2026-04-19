import { useState, useEffect, useRef } from 'react';
import { Product, SafetyStatus } from '../core/types/product.types';
import { AIService } from '../services/AIService';
import { DataService } from '../services/DataService';
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
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [indexVersion, setIndexVersion] = useState(0);
  const searchIndex = useRef<SearchIndexItem[]>([]);
  const isIndexLoaded = useRef(false);

  // Cargar el índice en memoria una sola vez
  useEffect(() => {
    const loadIndex = async () => {
      try {
        // Usamos DataService para obtener los productos.
        // DataService ya maneja el circuito cortado, manejo de 404s y fallback a SQLite.
        const allProducts = await DataService.getAllProducts();
        
        if (!allProducts || !Array.isArray(allProducts)) {
          throw new Error('Data format invalid');
        }

        searchIndex.current = allProducts
          .filter(p => p && p.sku)
          .map((product: Product) => {
            const searchableText = normalizeText(`
              ${product.sku || ''}
              ${product.nombre_comercial || ''} 
              ${product.categoria_principal || ''}
              ${formatArrayToString(product.principios_activos, ' ')} 
              ${formatArrayToString(product.indicaciones, ' ')}
              ${formatArrayToString(product.tags_ia, ' ')}
              ${product.analisis_componentes || ''}
            `);
            
            const pathologySearchableText = normalizeText(`
              ${formatArrayToString(product.indicaciones, ' ')}
            `);

            return {
              sku: product.sku,
              product,
              vector: product.vectores,
              searchableText,
              pathologySearchableText
            };
          });
      } catch (error) {
        console.warn('Índice de búsqueda cargado parcialmente o vacío debido a error de datos:', error);
      } finally {
        isIndexLoaded.current = true;
        setIndexVersion(v => v + 1);
      }
    };

    loadIndex();

    // Escuchar cambios en el servidor para re-indexar automáticamente con debounce agresivo
    let debounceTimer: number | null = null;
    const debouncedLoadIndex = () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(loadIndex, 30000); // Solo re-indexar cada 30 seg máximo
    };

    window.addEventListener('db_updated', debouncedLoadIndex);
    return () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      window.removeEventListener('db_updated', debouncedLoadIndex);
    };
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
        const normalizedQuery = normalizeText(query);
        
        // Detección automática de filtros de seguridad en la query
        const autoFilters: SafetyCondition[] = [];
        if (normalizedQuery.includes('embarazo') || normalizedQuery.includes('gestante')) autoFilters.push('apto_embarazo');
        if (normalizedQuery.includes('lactancia')) autoFilters.push('apto_lactancia');
        if (normalizedQuery.includes('niño') || normalizedQuery.includes('pediatrico') || normalizedQuery.includes('infantil')) autoFilters.push('apto_pediatria');
        if (normalizedQuery.includes('diabetico') || normalizedQuery.includes('azucar')) autoFilters.push('apto_diabeticos');
        if (normalizedQuery.includes('hipertenso') || normalizedQuery.includes('presion') || normalizedQuery.includes('tension')) autoFilters.push('apto_hipertensos');
        if (normalizedQuery.includes('celiaco') || normalizedQuery.includes('gluten')) autoFilters.push('apto_celiacos');

        const activeFilters = [...new Set([...autoFilters])];
        
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

          // Pre-compilar expresiones regulares fuera del bucle para mejorar drásticamente el rendimiento
          const exactPhraseRegexes = exactPhrasesToSearch.map(phrase => {
            const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return new RegExp(`\\b${escapedPhrase}\\b`, 'i');
          });

          const searchTermsRegexes = searchTerms.map(term => {
            const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return new RegExp(`\\b${escapedTerm}\\b`, 'i');
          });

          textFiltered.forEach(item => {
            const textToSearch = isPathologySearch ? item.pathologySearchableText : item.searchableText;
            let matchedExact = false;

            // Primero intentamos coincidencia de frase exacta (o sinónimos)
            for (const regex of exactPhraseRegexes) {
              if (regex.test(textToSearch)) {
                matchedExact = true;
                break;
              }
            }

            if (matchedExact) {
              textResults.set(item.sku, { product: item.product, score: 1.0 });
            } else if (!isPathologySearch && searchTermsRegexes.length > 0) {
              let matchCount = 0;
              for (const regex of searchTermsRegexes) {
                if (regex.test(textToSearch)) {
                  matchCount++;
                }
              }
              
              if (matchCount > 0) {
                const score = matchCount / searchTermsRegexes.length;
                textResults.set(item.sku, { product: item.product, score });
              }
            }
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
              if (similarity > 0.7) { 
                semanticResults.set(item.sku, { product: item.product, score: similarity });
              }
            }
          });
        }

        // 3. Combinación Inteligente (Hybrid Search)
        const finalResultsMap = new Map<string, { product: Product, finalScore: number }>();
        
        textResults.forEach((val, sku) => {
          const semantic = semanticResults.get(sku);
          const semanticScore = semantic ? semantic.score : 0;
          const finalScore = (val.score * 0.7) + (semanticScore * 0.3);
          finalResultsMap.set(sku, { product: val.product, finalScore });
        });
        
        semanticResults.forEach((val, sku) => {
          if (!finalResultsMap.has(sku)) {
            finalResultsMap.set(sku, { product: val.product, finalScore: val.score * 0.8 });
          }
        });

        let combined = Array.from(finalResultsMap.values())
          .sort((a, b) => b.finalScore - a.finalScore)
          .map(i => i.product);

        // 4. Aplicar Filtros Automáticos (Detectados por texto)
        if (activeFilters.length > 0) {
          combined = combined.filter(p => {
            return activeFilters.every(condition => p[condition] === SafetyStatus.SI);
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
  }, [query, indexVersion]);

  return { 
    query, 
    setQuery, 
    results, 
    isSearching 
  };
};
