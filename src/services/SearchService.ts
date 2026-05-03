import { Product, SafetyStatus, ClinicalSearchInterpretation } from '../core/types';
import { formatArrayToString } from '../utils/formatters';
import { cosineSimilarity } from '../utils/math';
import { aiService } from './AIService';
import { dataService } from './DataService';
import { database, productsCollection } from '../database';
import MiniSearch from 'minisearch';

export interface SearchIndexItem {
  id: string; // MiniSearch requires id
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

export class SearchService {
  private static instance: SearchService;
  private index: SearchIndexItem[] = [];
  private isInitialized = false;
  private miniSearch: MiniSearch<SearchIndexItem> | null = null;
  private latestResults: Product[] = [];
  private facets: { categories: string[], activePrinciples: string[] } = {
      categories: [],
      activePrinciples: []
  };

  private constructor() {
      this.initObserver();
  }

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  private async initObserver() {
      productsCollection.changes.subscribe(() => {
          this.initializeIndex().catch(console.error);
      });
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
          id: product.sku,
          sku: product.sku,
          product,
          vector: product.vectores,
          searchableText: this.normalizeText(searchableText),
          pathologySearchableText: this.normalizeText(pathologySearchableText),
          principios: product.principios_activos?.join(' ') || '',
          nombre: product.nombre_comercial || '',
          categoria: product.categoria_principal || ''
        };
      });

      this.miniSearch = new MiniSearch({
        fields: ['nombre', 'principios', 'sku', 'searchableText', 'categoria'], // fields to index for full-text search
        storeFields: ['id', 'sku'], // fields to return with search results
        searchOptions: {
          boost: { nombre: 2, principios: 1.5, sku: 1, categoria: 0.8 },
          fuzzy: 0.2, // typo tolerance
          prefix: true // prefix matching
        }
      });

      this.miniSearch.addAll(this.index);

      this.updateFacets(allProducts);
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing search index:', error);
      throw error;
    }
  }

  private updateFacets(products: Product[]) {
      const cats = new Set<string>();
      const principles = new Set<string>();

      products.forEach(p => {
          if (p.categoria_principal) cats.add(p.categoria_principal);
          if (p.principios_activos) {
              p.principios_activos.forEach(pa => {
                  if (pa && pa.trim()) principles.add(pa.trim());
              });
          }
      });

      this.facets = {
          categories: Array.from(cats).sort(),
          activePrinciples: Array.from(principles).sort().slice(0, 50)
      };
  }

  getFacets() {
      return this.facets;
  }

  getAllIndexedProducts(): Product[] {
    return this.index.map(i => i.product);
  }

  getLatestResults(): Product[] {
    return this.latestResults;
  }

  async search(query: string, options: { category?: string, principle?: string } = {}): Promise<Product[]> {
    if (!this.isInitialized) await this.initializeIndex();
    
    let combinedItems: { product: Product, score: number }[] = [];
    const normalizedQuery = query ? this.normalizeText(query) : '';
    
    if (normalizedQuery && normalizedQuery.trim()) {
        if (this.miniSearch) {
            const results = this.miniSearch.search(normalizedQuery);
            combinedItems = results.map(res => {
                const indexItem = this.index.find(i => i.id === res.id);
                return {
                    product: indexItem!.product,
                    score: res.score
                };
            });
        }
    } else {
        combinedItems = this.index.map(i => ({ product: i.product, score: 0 }));
    }

    let combined = combinedItems.map(i => i.product);

    // Apply Facets/Filters
    if (options.category) {
        combined = combined.filter(p => p.categoria_principal === options.category);
    }
    if (options.principle) {
        combined = combined.filter(p => p.principios_activos?.includes(options.principle!));
    }

    combined = combined.slice(0, 50);
    this.latestResults = combined;
    return combined;
  }
}

export const searchService = SearchService.getInstance();
