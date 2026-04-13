import { useState, useEffect, useRef } from 'react';
import { Product, SafetyStatus } from '../core/types/product.types';
import { getDB } from '../core/database/db';
import { AIService } from '../services/AIService';
import { formatArrayToString } from '../utils/formatters';
import { cosineSimilarity } from '../utils/math';

// Índice en memoria para búsquedas ultra-rápidas
interface SearchIndexItem {
  sku: string;
  searchableText: string;
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
  const [categorizedTags, setCategorizedTags] = useState<CategorizedTags>({ tipos: [], sintomas: [], otros: [] });
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
          `)
        }));
        
        // Extraer tags únicos y contarlos (Motor de Etiquetas Dinámico)
        const tagCounts: Record<string, number> = {};
        
        // Procesar todos los tags de todos los productos (Sin normalización externa)
        allProducts.forEach(p => {
          if (p.tags_ia && Array.isArray(p.tags_ia)) {
            p.tags_ia.forEach(tag => {
              const cleanTag = tag.trim();
              if (cleanTag) {
                tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
              }
            });
          }
        });
        
        // Convertir a array, ordenar por frecuencia y tomar los top 60
        const sortedTags = Object.entries(tagCounts)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 60);
          
        const keywordsTipos = ['suplemento', 'vitamina', 'mineral', 'analgesico', 'analgésico', 'aine', 'antibiotico', 'antibiótico', 'crema', 'pomada', 'jarabe', 'capsula', 'cápsula', 'pastilla', 'comprimido', 'gel', 'locion', 'gotas', 'inyectable', 'vacuna', 'probiotico', 'probiótico', 'corticoide', 'antihistaminico', 'antihistamínico', 'proteina', 'proteína', 'aminoacido'];
        const keywordsSintomas = ['dolor', 'fiebre', 'tos', 'resfrio', 'gripe', 'diabetes', 'hipertension', 'hipertensión', 'alergia', 'infeccion', 'infección', 'inflamacion', 'inflamación', 'acidez', 'reflujo', 'asma', 'colesterol', 'insomnio', 'ansiedad', 'estres', 'estrés', 'hongo', 'dermatitis', 'herida', 'quemadura', 'nauseas', 'vómitos', 'diarrea', 'estreñimiento'];

        const newCategorized: CategorizedTags = { tipos: [], sintomas: [], otros: [] };

        sortedTags.forEach(t => {
          const lowerTag = t.tag.toLowerCase();
          const isTipo = keywordsTipos.some(kw => lowerTag.includes(kw));
          const isSintoma = keywordsSintomas.some(kw => lowerTag.includes(kw));

          if (isTipo) {
            newCategorized.tipos.push(t);
          } else if (isSintoma) {
            newCategorized.sintomas.push(t);
          } else {
            newCategorized.otros.push(t);
          }
        });

        setCategorizedTags(newCategorized);
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
        const searchTerms = normalizeText(query).split(' ').filter(t => t.length > 0);
        
        // 1. Búsqueda por Texto (Exacta/Keyword) - Peso 1.0
        let textFiltered = searchIndex.current;
        const textResults = new Map<string, { product: Product, score: number }>();
        
        if (searchTerms.length > 0) {
          textFiltered.forEach(item => {
            let matchCount = 0;
            searchTerms.forEach(term => {
              if (item.searchableText.includes(term)) matchCount++;
            });
            
            if (matchCount > 0) {
              // Puntuación basada en cuántos términos coinciden
              const score = matchCount / searchTerms.length;
              textResults.set(item.sku, { product: item.product, score });
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

  return { query, setQuery, conditionFilters, setConditionFilters, results, isSearching, categorizedTags };
};
