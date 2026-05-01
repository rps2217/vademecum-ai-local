import { Product, SafetyStatus, ClinicalSearchInterpretation } from '../core/types';
import { formatArrayToString } from '../utils/formatters';
import { cosineSimilarity } from '../utils/math';
import { aiService } from './AIService';
import { dataService } from './DataService';
import Fuse from 'fuse.js';

export interface SearchIndexItem {
  sku: string;
  searchableText: string;
  pathologySearchableText: string;
  product: Product;
  vector?: number[];
  principios?: string;
  nombre?: string;
}

export type SafetyCondition = 'apto_embarazo' | 'apto_lactancia' | 'apto_pediatria' | 'apto_diabeticos' | 'apto_hipertensos' | 'apto_celiacos';

const STOP_WORDS = new Set(['de', 'la', 'el', 'en', 'y', 'o', 'a', 'las', 'los', 'con', 'por', 'para', 'un', 'una']);

const SYNONYMS_MAP: Record<string, string[]> = {
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

export class SearchService {
  private static instance: SearchService;
  private index: SearchIndexItem[] = [];
  private isInitialized = false;
  private fuse: Fuse<SearchIndexItem> | null = null;

  private constructor() {}

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  normalizeText(text: string): string {
    if (!text) return '';
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  async initializeIndex(): Promise<void> {
    try {
      const allProducts = await dataService.getAllProducts();
      this.index = allProducts.map(product => {
        const searchableText = `${product.sku || ''} ${product.nombre_comercial || ''} ${product.categoria_principal || ''} ${formatArrayToString(product.principios_activos, ' ')} ${formatArrayToString(product.indicaciones, ' ')} ${formatArrayToString(product.tags_ia, ' ')} ${product.analisis_componentes || ''}`;
        
        const pathologySearchableText = formatArrayToString(product.indicaciones, ' ');

        return {
          sku: product.sku,
          product,
          vector: product.vectores,
          searchableText: this.normalizeText(searchableText),
          pathologySearchableText: this.normalizeText(pathologySearchableText),
          principios: product.principios_activos?.join(' ') || '',
          nombre: product.nombre_comercial || ''
        };
      });

      this.fuse = new Fuse(this.index, {
        keys: [
          { name: 'nombre', weight: 1.0 },
          { name: 'principios', weight: 0.8 },
          { name: 'searchableText', weight: 0.4 }
        ],
        includeScore: true,
        threshold: 0.35,
        minMatchCharLength: 2,
        ignoreLocation: true,
        useExtendedSearch: true
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing search index:', error);
      throw error;
    }
  }

  async search(query: string, commonPathologies: string[]): Promise<Product[]> {
    if (!this.isInitialized) await this.initializeIndex();
    if (!query.trim()) return [];

    const normalizedQuery = this.normalizeText(query);
    const autoFilters = this.detectSafetyFilters(normalizedQuery);
    
    // 1. Text Search (Fuzzy with Fuse.js)
    const textResults = this.performFuzzySearch(normalizedQuery);

    // 2. Semantic Search (Vector)
    const semanticResults = await this.performSemanticSearch(query);

    // 3. Merge and Filter
    let combined = this.mergeResults(textResults, semanticResults);

    if (autoFilters.length > 0) {
      combined = combined.filter(p => {
        return autoFilters.every(condition => p[condition] === SafetyStatus.SI);
      });
    }

    return combined.slice(0, 50);
  }

  private performFuzzySearch(query: string): Map<string, { product: Product, score: number }> {
    const results = new Map<string, { product: Product, score: number }>();
    if (!this.fuse) return results;

    const fuseResults = this.fuse.search(query);
    fuseResults.forEach(res => {
      // Fuse score 0 is perfect, 1 is terrible. We invert for our merge logic.
      const inverseScore = 1 - (res.score || 0);
      results.set(res.item.sku, { product: res.item.product, score: inverseScore });
    });

    return results;
  }

  private detectSafetyFilters(normalizedQuery: string): SafetyCondition[] {
    const filters: SafetyCondition[] = [];
    if (normalizedQuery.includes('embarazo') || normalizedQuery.includes('gestante')) filters.push('apto_embarazo');
    if (normalizedQuery.includes('lactancia')) filters.push('apto_lactancia');
    if (normalizedQuery.includes('niño') || normalizedQuery.includes('pediatrico') || normalizedQuery.includes('infantil')) filters.push('apto_pediatria');
    if (normalizedQuery.includes('diabetico') || normalizedQuery.includes('azucar')) filters.push('apto_diabeticos');
    if (normalizedQuery.includes('hipertenso') || normalizedQuery.includes('presion') || normalizedQuery.includes('tension')) filters.push('apto_hipertensos');
    if (normalizedQuery.includes('celiaco') || normalizedQuery.includes('gluten')) filters.push('apto_celiacos');
    return [...new Set(filters)];
  }

  private async performSemanticSearch(query: string): Promise<Map<string, { product: Product, score: number }>> {
    const results = new Map<string, { product: Product, score: number }>();
    const aiStatus = aiService.getStatus();
    
    if (aiStatus.isReady && query.trim().length > 3) {
      try {
        const queryVector = await aiService.generateEmbedding(query);
        this.index.forEach(item => {
          if (item.vector && item.vector.length > 0) {
            const similarity = cosineSimilarity(queryVector, item.vector);
            if (similarity > 0.7) {
              results.set(item.sku, { product: item.product, score: similarity });
            }
          }
        });
      } catch (err) {
        console.error('Semantic search failed:', err);
      }
    }
    return results;
  }

  private mergeResults(
    textResults: Map<string, { product: Product, score: number }>, 
    semanticResults: Map<string, { product: Product, score: number }>
  ): Product[] {
    const finalMap = new Map<string, { product: Product, finalScore: number }>();
    
    textResults.forEach((val, sku) => {
      const semantic = semanticResults.get(sku);
      const finalScore = (val.score * 0.7) + ((semantic?.score || 0) * 0.3);
      finalMap.set(sku, { product: val.product, finalScore });
    });
    
    semanticResults.forEach((val, sku) => {
      if (!finalMap.has(sku)) {
        finalMap.set(sku, { product: val.product, finalScore: val.score * 0.8 });
      }
    });

    return Array.from(finalMap.values())
      .sort((a, b) => b.finalScore - a.finalScore)
      .map(i => i.product);
  }
}

export const searchService = SearchService.getInstance();
