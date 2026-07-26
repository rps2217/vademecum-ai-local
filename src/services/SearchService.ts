import { logger } from '../services/LoggerService';
import { Product, SafetyStatus, ClinicalSearchInterpretation } from '../core/types';
import { formatArrayToString } from '../utils/formatters';
import { cosineSimilarity } from '../utils/math';
import { aiService } from './AIService';
import { dataService } from './DataService';
import { database, productsCollection } from '../database';
import MiniSearch from 'minisearch';
import { findByOrganOrPathology, type OrganMapping } from '../core/knowledge/organs-pathologies-map';

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

export interface SearchFacets {
  categories: string[];
  activePrinciples: string[];
  principlesWithCounts?: { principle: string, count: number }[];
}

export interface SearchResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export class SearchService {
  private static instance: SearchService;
  private index: SearchIndexItem[] = [];
  private isInitialized = false;
  private miniSearch: MiniSearch<SearchIndexItem> | null = null;
  private latestResults: Product[] = [];
  private facets: SearchFacets = {
      categories: [],
      activePrinciples: [],
      principlesWithCounts: []
  };
  
  // Performance optimization: debounce index updates
  private updateTimeout: number | null = null;
  private readonly UPDATE_DEBOUNCE_MS = 500;
  
  // Pagination
  private readonly DEFAULT_PAGE_SIZE = 50;

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
          this.debouncedIndexUpdate().catch((e) => logger.error('Error en index update', 'SearchService', e));
      });
  }

  /**
   * Debounced index update to prevent multiple full rebuilds
   */
  private async debouncedIndexUpdate(): Promise<void> {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    
    return new Promise((resolve) => {
      this.updateTimeout = window.setTimeout(async () => {
        await this.incrementalIndexUpdate();
        resolve();
      }, this.UPDATE_DEBOUNCE_MS);
    });
  }

  /**
   * Incremental update - only update changed items instead of full rebuild
   */
  private async incrementalIndexUpdate(): Promise<void> {
    try {
      const allProducts = await dataService.getAllProducts();
      const existingSkus = new Set(this.index.map(i => i.sku));
      const newSkus = new Set(allProducts.map(p => p.sku));
      
      // Find removed products
      const removedSkus = [...existingSkus].filter(sku => !newSkus.has(sku));
      
      // Find added products
      const addedProducts = allProducts.filter(p => !existingSkus.has(p.sku));
      
      // Find updated products
      const updatedProducts = allProducts.filter(p => {
        const existing = this.index.find(i => i.sku === p.sku);
        if (!existing) return false;
        return existing.product.last_updated !== p.last_updated;
      });

      // Apply incremental changes
      if (removedSkus.length > 0 || addedProducts.length > 0 || updatedProducts.length > 0) {
        // For simplicity, we still do a full rebuild if there are many changes
        // But for small changes, we can do incremental updates
        const totalChanges = removedSkus.length + addedProducts.length + updatedProducts.length;
        const changeRatio = totalChanges / Math.max(this.index.length, 1);
        
        if (changeRatio > 0.1) {
          // More than 10% changed - full rebuild is faster
          await this.initializeIndex();
        } else {
          // Incremental update
          this.applyIncrementalChanges(removedSkus, addedProducts, updatedProducts);
        }
      }
    } catch (error) {
      logger.warn('[SearchService] Incremental update failed, falling back to full rebuild:', error);
      await this.initializeIndex();
    }
  }

  /**
   * Apply incremental changes to the index
   */
  private applyIncrementalChanges(
    removedSkus: string[],
    addedProducts: Product[],
    updatedProducts: Product[]
  ): void {
    // Remove deleted items
    this.index = this.index.filter(item => !removedSkus.includes(item.sku));
    
    // Add new items
    const newItems = addedProducts.map(product => this.createIndexItem(product));
    this.index.push(...newItems);
    
    // Update existing items
    for (const product of updatedProducts) {
      const idx = this.index.findIndex(i => i.sku === product.sku);
      if (idx !== -1) {
        this.index[idx] = this.createIndexItem(product);
      }
    }
    
    // Rebuild MiniSearch index
    this.rebuildMiniSearchIndex();
    
    // Update facets incrementally
    this.updateFacetsIncremental(removedSkus, addedProducts, updatedProducts);
    
    logger.info(`[SearchService] Incremental update: ${addedProducts.length} added, ${updatedProducts.length} updated, ${removedSkus.length} removed`);
  }

  /**
   * Rebuild MiniSearch index from current state
   */
  private rebuildMiniSearchIndex(): void {
    this.miniSearch = new MiniSearch({
      fields: ['nombre', 'principios', 'sku', 'searchableText', 'categoria'],
      storeFields: ['id', 'sku'],
      searchOptions: {
        boost: { nombre: 2, principios: 1.5, sku: 1, categoria: 0.8 },
        fuzzy: 0.2,
        prefix: true
      }
    });
    this.miniSearch.addAll(this.index);
  }

  /**
   * Incremental facets update
   */
  private updateFacetsIncremental(
    removedSkus: string[],
    addedProducts: Product[],
    updatedProducts: Product[]
  ): void {
    // Simple approach: recalculate affected facets
    // For large datasets, this could be optimized further
    const cats = new Set<string>();
    const principles = new Set<string>();
    const principlesCount = new Map<string, number>();

    this.index.forEach(item => {
      const p = item.product;
      if (p.categoria_principal) cats.add(p.categoria_principal);
      if (p.principios_activos) {
        p.principios_activos.forEach(pa => {
          const pName = pa?.trim();
          if (pName) {
            principles.add(pName);
            principlesCount.set(pName, (principlesCount.get(pName) || 0) + 1);
          }
        });
      }
    });

    const principlesWithCounts = Array.from(principlesCount.entries())
      .map(([principle, count]) => ({ principle, count }))
      .sort((a, b) => b.count - a.count);

    this.facets = {
      categories: Array.from(cats).sort(),
      activePrinciples: Array.from(principles).sort().slice(0, 50),
      principlesWithCounts
    };
  }

  /**
   * Create an index item from a product
   */
  private createIndexItem(product: Product): SearchIndexItem {
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
  }

  normalizeText(text: string): string {
    if (!text) return '';
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  async initializeIndex(): Promise<void> {
    try {
      const allProducts = await dataService.getAllProducts();
      this.index = allProducts.map(product => this.createIndexItem(product));

      this.rebuildMiniSearchIndex();
      this.updateFacetsIncremental([], allProducts, []);
      this.isInitialized = true;
      
      logger.info(`[SearchService] Index initialized with ${this.index.length} products`);
    } catch (error) {
      logger.error('Error initializing search index:', error);
      throw error;
    }
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

  /**
   * Search with pagination support and organ/pathology search
   */
  async search(
    query: string, 
    options: { 
      category?: string; 
      principle?: string;
      page?: number;
      pageSize?: number;
      includeOrganSearch?: boolean;
    } = {}
  ): Promise<SearchResult> {
    if (!this.isInitialized) await this.initializeIndex();
    
    const page = options.page ?? 1;
    const pageSize = Math.min(options.pageSize ?? this.DEFAULT_PAGE_SIZE, 100);
    
    let combinedItems: { product: Product, score: number }[] = [];
    const normalizedQuery = query ? this.normalizeText(query) : '';
    
    // Primero, buscar por órganos y patologías
    let organMatches: OrganMapping[] = [];
    if (normalizedQuery && normalizedQuery.trim()) {
      organMatches = findByOrganOrPathology(normalizedQuery);
      
      // Si hay coincidencias de órganos, buscar productos relacionados
      if (organMatches.length > 0 && options.includeOrganSearch !== false) {
        const allIngredients = new Set<string>();
        organMatches.forEach(m => {
          m.ingredients.forEach(i => allIngredients.add(i.toLowerCase()));
        });
        
        // Buscar productos que contengan estos ingredientes
        const organProducts = this.index.filter(item => {
          if (!item.product.principios_activos) return false;
          const principios = item.product.principios_activos.map(p => p.toLowerCase());
          return principios.some(p => {
            // Buscar coincidencia exacta o parcial
            return Array.from(allIngredients).some(ing => 
              p.includes(ing) || ing.includes(p) ||
              p.split(/\s+/).some(word => ing.includes(word))
            );
          });
        }).map(item => ({ product: item.product, score: 10 })); // Alta puntuación para resultados de órganos
        
        combinedItems.push(...organProducts);
      }
    }
    
    // Búsqueda normal por texto
    if (normalizedQuery && normalizedQuery.trim()) {
        if (this.miniSearch) {
            const results = this.miniSearch.search(normalizedQuery);
            const textResults = results.map(res => {
                const indexItem = this.index.find(i => i.id === res.id);
                return {
                    product: indexItem!.product,
                    score: res.score
                };
            });
            // Combinar resultados evitando duplicados
            const existingSkus = new Set(combinedItems.map(c => c.product.sku));
            textResults.forEach(r => {
              if (!existingSkus.has(r.product.sku)) {
                combinedItems.push(r);
              }
            });
        }
    } else {
        combinedItems = this.index.map(i => ({ product: i.product, score: 0 }));
    }

    // Ordenar por score
    combinedItems.sort((a, b) => b.score - a.score);
    let combined = combinedItems.map(i => i.product);

    // Apply Facets/Filters
    if (options.category) {
        combined = combined.filter(p => p.categoria_principal === options.category);
    }
    if (options.principle) {
        combined = combined.filter(p => p.principios_activos?.includes(options.principle!));
    }

    const total = combined.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedResults = combined.slice(startIndex, startIndex + pageSize);
    
    this.latestResults = paginatedResults;
    
    return {
      products: paginatedResults,
      total,
      page,
      pageSize,
      hasMore: startIndex + pageSize < total
    };
  }

  /**
   * Get organ/pathology search results for UI display
   */
  async searchWithOrgans(query: string): Promise<{
    products: Product[];
    organMatches: OrganMapping[];
    total: number;
  }> {
    const organMatches = findByOrganOrPathology(query);
    const result = await this.search(query, { includeOrganSearch: true, pageSize: 50 });
    
    return {
      products: result.products,
      organMatches,
      total: result.total
    };
  }

  /**
   * Legacy method for backward compatibility
   */
  async searchLegacy(query: string, options: { category?: string, principle?: string } = {}): Promise<Product[]> {
    const result = await this.search(query, options);
    return result.products;
  }
}

export const searchService = SearchService.getInstance();
