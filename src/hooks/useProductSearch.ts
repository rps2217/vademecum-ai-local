import { useState, useEffect, useRef } from 'react';
import { Product, SafetyStatus } from '../core/types/product.types';
import { getDB } from '../core/database/db';
import { AIService } from '../services/AIService';
import { TagIntelligenceService } from '../services/TagIntelligenceService';
import { FirebaseSyncService } from '../services/FirebaseSyncService';
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
  const searchIndex = useRef<SearchIndexItem[]>([]);
  const isIndexLoaded = useRef(false);

  // Cargar el índice en memoria una sola vez
  useEffect(() => {
    const loadIndex = async () => {
      try {
        await TagIntelligenceService.init();
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
        
        // Procesar todos los tags de todos los productos
        for (const p of allProducts) {
          if (p.tags_ia && Array.isArray(p.tags_ia)) {
            for (const tag of p.tags_ia) {
              const cleanTag = await TagIntelligenceService.normalizeTag(tag);
              if (cleanTag) {
                tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
              }
            }
          }
        }
        
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
      } catch (error) {
        console.error('Error cargando índice de búsqueda:', error);
      }
    };

    loadIndex();

    // Sincronizar etiquetas en tiempo real
    const unsubscribeTags = FirebaseSyncService.startTagSync();

    // Escuchar cambios en la base de datos para re-indexar automáticamente
    window.addEventListener('db_updated', loadIndex);
    return () => {
      window.removeEventListener('db_updated', loadIndex);
      unsubscribeTags();
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
        
        // 1. Búsqueda por Texto (Exacta/Keyword)
        let textFiltered = searchIndex.current;
        
        if (searchTerms.length > 0) {
          textFiltered = textFiltered.filter(item => {
            return searchTerms.every(term => item.searchableText.includes(term));
          });
        }

        // 2. Búsqueda Semántica (Si hay motor de IA listo y hay query)
        let semanticFiltered: { product: Product, score: number }[] = [];
        
        const status = AIService.getStatus();
        if (status.isReady && query.trim().length > 3) {
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
        let combined = [...textFiltered.map(i => i.product)];
        const seenSkus = new Set(combined.map(p => p.sku));
        
        for (const item of semanticFiltered) {
          if (!seenSkus.has(item.product.sku)) {
            combined.push(item.product);
            seenSkus.add(item.product.sku);
          }
        }

        // 3. Aplicar Filtro de Seguridad (Si está activo)
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
  }, [query, conditionFilters]);

  return { query, setQuery, conditionFilters, setConditionFilters, results, isSearching, categorizedTags };
};
