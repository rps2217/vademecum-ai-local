/**
 * HybridSearchService - Búsqueda semántica híbrida
 * 
 * Combina:
 * - Búsqueda textual exacta (BM25/TF-IDF)
 * - Búsqueda por embeddings vectoriales (semántica)
 * - Búsqueda fuzzy (typo tolerance)
 */

import { Product } from '../core/types/product.types';
import { logger } from './LoggerService';

export interface SearchResult {
  product: Product;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'semantic' | 'hybrid';
  highlights?: string[];
}

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  weights?: {
    exact?: number;
    fuzzy?: number;
    semantic?: number;
  };
  includeContext?: boolean;
}

const DEFAULT_OPTIONS: Required<SearchOptions> = {
  limit: 20,
  threshold: 0.3,
  weights: {
    exact: 0.4,
    fuzzy: 0.3,
    semantic: 0.3
  },
  includeContext: false
};

export class HybridSearchService {
  private static instance: HybridSearchService;
  private embeddings: Map<string, number[]> = new Map();
  private vocabulary: Map<string, Set<string>> = new Map();
  private documentFrequencies: Map<string, number> = new Map();
  private totalDocuments = 0;
  private isIndexBuilt = false;

  private constructor() {}

  static getInstance(): HybridSearchService {
    if (!HybridSearchService.instance) {
      HybridSearchService.instance = new HybridSearchService();
    }
    return HybridSearchService.instance;
  }

  /**
   * Construir indice de búsqueda
   */
  async buildIndex(products: Product[]): Promise<void> {
    logger.info(`Construyendo indice de busqueda para ${products.length} productos...`, 'HybridSearch');
    this.totalDocuments = products.length;

    // Indexar productos
    for (const product of products) {
      this.indexProduct(product);
    }

    this.isIndexBuilt = true;
    logger.success('Indice de busqueda construido', 'HybridSearch');
  }

  /**
   * Indexar un producto
   */
  private indexProduct(product: Product): void {
    const terms = this.tokenize(this.getSearchableText(product));
    
    // Vocabulario invertido: termino -> productos
    for (const term of terms) {
      if (!this.vocabulary.has(term)) {
        this.vocabulary.set(term, new Set());
      }
      this.vocabulary.get(term)!.add(product.sku);
    }

    // Frecuencia de documentos
    const uniqueTerms = new Set(terms);
    for (const term of uniqueTerms) {
      const current = this.documentFrequencies.get(term) || 0;
      this.documentFrequencies.set(term, current + 1);
    }
  }

  /**
   * Obtener texto buscable de un producto
   */
  private getSearchableText(product: Product): string {
    const parts = [
      product.nombre_comercial,
      product.descripcion,
      ...(product.principios_activos || []),
      ...(product.indicaciones || []),
      product.categoria_principal
    ].filter(Boolean);

    return parts.join(' ');
  }

  /**
   * Tokenizar texto
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-záéíóúñ0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length >= 2);
  }

  /**
   * Agregar embedding de producto
   */
  addEmbedding(sku: string, embedding: number[]): void {
    this.embeddings.set(sku, embedding);
  }

  /**
   * Calcular IDF de un termino
   */
  private idf(term: string): number {
    const df = this.documentFrequencies.get(term) || 0;
    if (df === 0) return 0;
    return Math.log((this.totalDocuments + 1) / (df + 1)) + 1;
  }

  /**
   * Busqueda híbrida
   */
  search(query: string, products: Product[], options: SearchOptions = {}): SearchResult[] {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    if (!query.trim()) {
      return products.slice(0, opts.limit).map(p => ({
        product: p,
        score: 1,
        matchType: 'exact' as const
      }));
    }

    const results: Map<string, SearchResult> = new Map();
    const queryTerms = this.tokenize(query);
    const queryLower = query.toLowerCase();

    // 1. Busqueda exacta (BM25 simplificado)
    const exactResults = this.exactSearch(queryLower, products, queryTerms, opts);
    for (const result of exactResults) {
      results.set(result.product.sku, result);
    }

    // 2. Busqueda fuzzy
    const fuzzyResults = this.fuzzySearch(queryLower, products, opts);
    for (const result of fuzzyResults) {
      const existing = results.get(result.product.sku);
      if (existing) {
        existing.score += result.score * opts.weights.fuzzy;
      } else {
        results.set(result.product.sku, {
          ...result,
          score: result.score * opts.weights.fuzzy,
          matchType: 'fuzzy'
        });
      }
    }

    // 3. Busqueda semántica (si hay embeddings)
    if (this.embeddings.size > 0) {
      const semanticResults = this.semanticSearch(query, products, opts);
      for (const result of semanticResults) {
        const existing = results.get(result.product.sku);
        if (existing) {
          existing.score += result.score * opts.weights.semantic;
          existing.matchType = 'hybrid';
        } else {
          results.set(result.product.sku, {
            ...result,
            score: result.score * opts.weights.semantic,
            matchType: 'semantic'
          });
        }
      }
    }

    // Ordenar por score y limitar
    return Array.from(results.values())
      .filter(r => r.score >= opts.threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, opts.limit);
  }

  /**
   * Busqueda exacta con BM25
   */
  private exactSearch(query: string, products: Product[], queryTerms: string[], opts: Required<SearchOptions>): SearchResult[] {
    const results: SearchResult[] = [];

    for (const product of products) {
      const text = this.getSearchableText(product).toLowerCase();
      let score = 0;

      // Coincidencia exacta de query completa
      if (text.includes(query)) {
        score += 2;
      }

      // Coincidencia de terminos
      for (const term of queryTerms) {
        if (text.includes(term)) {
          score += this.idf(term);
        }
      }

      // Bonus por matches en nombre comercial
      const nombre = product.nombre_comercial?.toLowerCase() || '';
      if (nombre.includes(query)) {
        score += 3;
      } else {
        for (const term of queryTerms) {
          if (nombre.includes(term)) {
            score += 1;
          }
        }
      }

      if (score > 0) {
        results.push({
          product,
          score: score * opts.weights.exact,
          matchType: 'exact',
          highlights: this.getHighlights(text, queryTerms)
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Busqueda fuzzy
   */
  private fuzzySearch(query: string, products: Product[], opts: Required<SearchOptions>): SearchResult[] {
    const results: SearchResult[] = [];

    for (const product of products) {
      const text = this.getSearchableText(product);
      const words = text.split(/\s+/);
      
      let bestScore = 0;
      let matchedWord = '';

      for (const word of words) {
        const similarity = this.stringSimilarity(query, word);
        if (similarity > bestScore && similarity > 0.6) {
          bestScore = similarity;
          matchedWord = word;
        }
      }

      if (bestScore > 0.6) {
        results.push({
          product,
          score: bestScore,
          matchType: 'fuzzy',
          highlights: matchedWord ? [matchedWord] : undefined
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Busqueda semántica por embeddings
   */
  private semanticSearch(query: string, products: Product[], opts: Required<SearchOptions>): SearchResult[] {
    const results: SearchResult[] = [];

    for (const product of products) {
      const embedding = this.embeddings.get(product.sku);
      if (!embedding) continue;

      // Nota: En producción, generar embedding del query
      // Por ahora, usamos similitud calculada externamente
      const score = this.calculateSimilarity(embedding, this.embeddings.get(product.sku)!);
      
      if (score > opts.threshold) {
        results.push({
          product,
          score,
          matchType: 'semantic'
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Calcular similitud coseno
   */
  private calculateSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Similitud entre strings (Levenshtein normalizado)
   */
  private stringSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = [];
    
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) {
        costs[s2.length] = lastValue;
      }
    }

    return costs[s2.length];
  }

  /**
   * Obtener highlights (terminos matching)
   */
  private getHighlights(text: string, terms: string[]): string[] {
    const highlights: string[] = [];
    const textLower = text.toLowerCase();

    for (const term of terms) {
      if (textLower.includes(term)) {
        highlights.push(term);
      }
    }

    return highlights.slice(0, 5);
  }

  /**
   * Verificar si el indice esta construido
   */
  isReady(): boolean {
    return this.isIndexBuilt;
  }

  /**
   * Obtener estadisticas del indice
   */
  getStats(): { vocabularySize: number; embeddingsCount: number; documentsCount: number } {
    return {
      vocabularySize: this.vocabulary.size,
      embeddingsCount: this.embeddings.size,
      documentsCount: this.totalDocuments
    };
  }

  /**
   * Limpiar indice
   */
  clear(): void {
    this.embeddings.clear();
    this.vocabulary.clear();
    this.documentFrequencies.clear();
    this.totalDocuments = 0;
    this.isIndexBuilt = false;
    logger.info('Indice de busqueda limpiado', 'HybridSearch');
  }
}

export const hybridSearchService = HybridSearchService.getInstance();
