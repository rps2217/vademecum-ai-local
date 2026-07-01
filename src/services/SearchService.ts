import { Product, SafetyStatus, ClinicalSearchInterpretation } from '../core/types';
import { formatArrayToString } from '../utils/formatters';
import { cosineSimilarity } from '../utils/math';
import { aiService } from './AIService';
import { dataService } from './DataService';
import { database, productsCollection } from '../database';
import MiniSearch from 'minisearch';

export interface SearchIndexItem {
  id: string;
  sku: string;
  searchableText: string;
  pathologySearchableText: string;
  product: Product;
  vector?: number[];
  principios?: string;
  nombre?: string;
  categoria?: string;
}

export type SafetyCondition = 'apto_embarazo' | 'apto_lactancia' | 'apto_pediatria' | 'apto_diabeticos' | 'apto_hipertensos' | 'apto_celiacos';

export interface SearchFacets {
  categories: string[];
  activePrinciples: string[];
  principlesWithCounts?: { principle: string; count: number }[];
}

export class SearchService {
  private static instance: SearchService;
  private index: SearchIndexItem[] = [];
  private isInitialized = false;
  private isInitializing = false;
  private miniSearch: MiniSearch<SearchIndexItem> | null = null;
  private latestResults: Product[] = [];
  private facets: SearchFacets = {
    categories: [],
    activePrinciples: [],
    principlesWithCounts: [],
  };
  private initPromise: Promise<void> | null = null;
  private searchCache = new Map<string, Product[]>();
  private readonly MAX_CACHE_SIZE = 100;

  private constructor() {
    this.initObserver();
  }

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  private initObserver(): void {
    productsCollection.changes.subscribe(() => {
      this.invalidateCache();
      this.initializeIndex().catch(console.error);
    });
  }

  normalizeText(text: string): string {
    if (!text) return '';
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  private getCacheKey(query: string, options: { category?: string; principle?: string }): string {
    return `${query}|${options.category || ''}|${options.principle || ''}`;
  }

  private invalidateCache(): void {
    this.searchCache.clear();
  }

  async initializeIndex(): Promise<void> {
    if (this.isInitialized) return;
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      const allProducts = await dataService.getAllProducts();

      this.index = allProducts.map((product) => {
        const searchableText = [
          product.sku || '',
          product.nombre_comercial || '',
          product.categoria_principal || '',
          formatArrayToString(product.principios_activos, ' '),
          formatArrayToString(product.indicaciones, ' '),
          formatArrayToString(product.tags_ia, ' '),
          product.analisis_componentes || '',
        ].join(' ');

        return {
          id: product.sku,
          sku: product.sku,
          product,
          vector: product.vectores,
          searchableText: this.normalizeText(searchableText),
          pathologySearchableText: this.normalizeText(
            formatArrayToString(product.indicaciones, ' ')
          ),
          principios: product.principios_activos?.join(' ') || '',
          nombre: product.nombre_comercial || '',
          categoria: product.categoria_principal || '',
        };
      });

      this.miniSearch = new MiniSearch<SearchIndexItem>({
        fields: ['nombre', 'principios', 'sku', 'searchableText', 'categoria'],
        storeFields: ['id', 'sku'],
        searchOptions: {
          boost: { nombre: 2, principios: 1.5, sku: 1, categoria: 0.8 },
          fuzzy: 0.2,
          prefix: true,
        },
      });

      this.miniSearch.addAll(this.index);
      this.updateFacets(allProducts);
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing search index:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  private updateFacets(products: Product[]): void {
    const cats = new Set<string>();
    const principlesCount = new Map<string, number>();

    for (const p of products) {
      if (p.categoria_principal) cats.add(p.categoria_principal);
      if (p.principios_activos) {
        for (const pa of p.principios_activos) {
          const pName = pa?.trim();
          if (pName) {
            principlesCount.set(pName, (principlesCount.get(pName) || 0) + 1);
          }
        }
      }
    }

    this.facets = {
      categories: Array.from(cats).sort(),
      activePrinciples: Array.from(principlesCount.keys()).sort().slice(0, 50),
      principlesWithCounts: Array.from(principlesCount.entries())
        .map(([principle, count]) => ({ principle, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  getFacets(): SearchFacets {
    return this.facets;
  }

  getAllIndexedProducts(): Product[] {
    return this.index.map((i) => i.product);
  }

  getLatestResults(): Product[] {
    return this.latestResults;
  }

  async search(
    query: string,
    options: { category?: string; principle?: string } = {}
  ): Promise<Product[]> {
    if (!this.isInitialized) await this.initializeIndex();

    const cacheKey = this.getCacheKey(query, options);
    const cached = this.searchCache.get(cacheKey);
    if (cached) return cached;

    let combinedItems: { product: Product; score: number }[] = [];
    const normalizedQuery = query ? this.normalizeText(query) : '';

    if (normalizedQuery.trim()) {
      if (this.miniSearch) {
        const results = this.miniSearch.search(normalizedQuery);
        combinedItems = results
          .map((res) => {
            const indexItem = this.index.find((i) => i.id === res.id);
            return indexItem ? { product: indexItem.product, score: res.score } : null;
          })
          .filter((item): item is { product: Product; score: number } => item !== null);
      }
    } else {
      combinedItems = this.index.map((i) => ({ product: i.product, score: 0 }));
    }

    let combined = combinedItems.map((i) => i.product);

    if (options.category) {
      combined = combined.filter((p) => p.categoria_principal === options.category);
    }
    if (options.principle) {
      combined = combined.filter((p) => p.principios_activos?.includes(options.principle!));
    }

    combined = combined.slice(0, 50);
    this.latestResults = combined;

    if (this.searchCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.searchCache.keys().next().value;
      if (firstKey) this.searchCache.delete(firstKey);
    }
    this.searchCache.set(cacheKey, combined);

    return combined;
  }
}

export const searchService = SearchService.getInstance();
