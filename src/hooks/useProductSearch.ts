import { useState, useEffect, useRef } from 'react';
import { Product, SafetyStatus } from '../core/types/product.types';
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

function normalizeText(text: string): string {
  if (!text) return '';
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export interface CategorizedTags {
  tipos: {tag: string, count: number}[];
  sintomas: {tag: string, count: number}[];
  otros: {tag: string, count: number}[];
}

export const useProductSearch = () => {
  const [query, setQuery] = useState('');
  const [safetyFilter, setSafetyFilter] = useState<SafetyStatus | null>(null);
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [categorizedTags, setCategorizedTags] = useState<CategorizedTags>({ tipos: [], sintomas: [], otros: [] });
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
            ${formatArrayToString(product.principios_activos, ' ')} 
            ${formatArrayToString(product.indicaciones, ' ')}
            ${formatArrayToString(product.tags_ia, ' ')}
          `)
        }));
        
        // Extraer tags únicos y contarlos (Motor de Etiquetas Dinámico)
        const tagCounts: Record<string, number> = {};
        
        // Función para normalizar y agrupar sinónimos de etiquetas
        const normalizeTagForDisplay = (rawTag: string): string => {
          let tag = rawTag.toLowerCase().trim();
          
          // Mapeo de sinónimos y correcciones ortográficas comunes
          const synonymMap: Record<string, string> = {
            'suplemento alimentario': 'suplemento alimenticio',
            'suplemento dietario': 'suplemento alimenticio',
            'suplementos alimenticios': 'suplemento alimenticio',
            'analgesico': 'analgésico',
            'antiinflamatorio': 'antiinflamatorio',
            'multivitaminico': 'multivitamínico',
            'vitamina': 'vitaminas',
            'mineral': 'minerales',
            'proteina': 'proteínas',
            'proteinas': 'proteínas',
            'antiseptico': 'antiséptico',
            'antibiotico': 'antibiótico',
            'antihistaminico': 'antihistamínico',
            'corticosteroide': 'corticoides',
            'corticoide': 'corticoides',
            'dolor de cabeza': 'cefalea',
            'hipertension': 'hipertensión',
            'infeccion': 'infección',
            'infecciones': 'infección'
          };

          // Remover acentos solo para la búsqueda en el diccionario
          const tagNoAccents = tag.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          
          // Buscar coincidencia exacta primero
          if (synonymMap[tag]) return synonymMap[tag];
          // Buscar coincidencia sin acentos
          if (synonymMap[tagNoAccents]) return synonymMap[tagNoAccents];

          return tag; 
        };

        allProducts.forEach(p => {
          if (p.tags_ia && Array.isArray(p.tags_ia)) {
            p.tags_ia.forEach(tag => {
              const cleanTag = normalizeTagForDisplay(tag);
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
      if (!query.trim() && !safetyFilter) {
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
        if (safetyFilter) {
          combined = combined.filter(p => {
            // Un producto se considera en el filtro si CUALQUIERA de sus estados de seguridad coincide
            // Esto es útil para buscar "todo lo apto para embarazadas" por ejemplo.
            // Pero como el filtro es global, verificamos si el producto tiene ese estado en algún campo clave.
            return p.apto_embarazo === safetyFilter || 
                   p.apto_lactancia === safetyFilter || 
                   p.apto_pediatria === safetyFilter ||
                   p.apto_diabeticos === safetyFilter ||
                   p.apto_hipertensos === safetyFilter ||
                   p.apto_celiacos === safetyFilter;
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
  }, [query, safetyFilter]);

  return { query, setQuery, safetyFilter, setSafetyFilter, results, isSearching, categorizedTags };
};
