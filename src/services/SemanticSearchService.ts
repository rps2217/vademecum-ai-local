import { Product } from '../core/types/product.types';
import { aiService } from './AIService';
import { dataService } from './DataService';
import { cosineSimilarity } from '../utils/math';

export class SemanticSearchService {
  private static instance: SemanticSearchService;
  private productsWithVectors: { product: Product, vector: number[] }[] = [];
  private isInitialized = false;

  private constructor() {}

  static getInstance(): SemanticSearchService {
    if (!SemanticSearchService.instance) {
      SemanticSearchService.instance = new SemanticSearchService();
    }
    return SemanticSearchService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    const allProducts = await dataService.getAllProducts();
    this.productsWithVectors = allProducts
      .filter(p => p.vectores && p.vectores.length > 0)
      .map(p => ({
        product: p,
        vector: p.vectores!
      }));
    
    this.isInitialized = true;
  }

  async semanticSearch(query: string, limit: number = 10): Promise<{ product: Product, score: number }[]> {
    if (!this.isInitialized) await this.initialize();
    
    const queryVector = await aiService.generateEmbedding(query);
    
    const results = this.productsWithVectors.map(item => ({
      product: item.product,
      score: cosineSimilarity(queryVector, item.vector)
    }));

    // Sort by score descending
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export const semanticSearchService = SemanticSearchService.getInstance();
