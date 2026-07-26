/**
 * AppStore - Estado Global Centralizado con Zustand
 * Unifica el estado de productos, sincronización y UI
 * SIN persistencia - los productos se cargan desde IndexedDB
 */

import { create } from 'zustand';
import type { Product } from '../types';

// Tipos
export type ViewType = 'buscar' | 'catalogo' | 'sinergias' | 'ajustes';

export interface ScrapingState {
  [sku: string]: 'idle' | 'scraping' | 'success' | 'error';
}

export interface AnalyzedProduct extends Product {
  ingredientes_encontrados: string[];
  cobertura_kb: number;
  sinergias_detectadas: string[];
  antagonismos_detectados: string[];
  categorias_inferidas?: string[];
  categoryLabels?: string[];
}

export interface KbStats {
  total: number;
  families: number;
  types: number;
}

export interface SyncState {
  status: 'idle' | 'syncing' | 'synced' | 'error';
  progress?: number;
  error?: string;
  lastSyncTime?: Date;
  pendingChanges: number;
}

// Estado de la aplicación
interface AppState {
  // UI State
  view: ViewType;
  searchQuery: string;
  selectedCategory: string;
  selectedProduct: AnalyzedProduct | null;
  isLoading: boolean;
  loadingMessage: string;
  
  // Products State
  products: AnalyzedProduct[];
  categories: string[];
  
  // Sync State
  syncStatus: SyncState;
  kbStats: KbStats;
  supabaseConnected: boolean;
  
  // Scraping State
  scrapeStates: ScrapingState;
  
  // Knowledge Base
  kb: Record<string, any>;
  ingredientCount: number;
  
  // Acciones - UI
  setView: (view: ViewType) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedProduct: (product: AnalyzedProduct | null) => void;
  setLoading: (loading: boolean, message?: string) => void;
  
  // Acciones - Products
  setProducts: (products: AnalyzedProduct[]) => void;
  updateProduct: (sku: string, updates: Partial<AnalyzedProduct>) => void;
  addProduct: (product: AnalyzedProduct) => void;
  removeProduct: (sku: string) => void;
  setCategories: (categories: string[]) => void;
  
  // Acciones - Sync
  setSyncStatus: (status: SyncState) => void;
  setKbStats: (stats: KbStats) => void;
  setSupabaseConnected: (connected: boolean) => void;
  
  // Acciones - Scraping
  setScrapeState: (sku: string, state: ScrapingState[string]) => void;
  resetScrapeStates: () => void;
  
  // Acciones - KB
  setKb: (kb: Record<string, any>, count: number) => void;
  
  // Computed (calculados en tiempo real)
  getFilteredProducts: () => AnalyzedProduct[];
  getStats: () => { total: number; kbMatch: number; sinergias: number };
}

// Helper para calcular productos filtrados
function filterProducts(
  products: AnalyzedProduct[],
  searchQuery: string,
  selectedCategory: string
): AnalyzedProduct[] {
  let filtered = [...products];
  
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(p => 
      p.nombre_comercial?.toLowerCase().includes(query) ||
      p.sku?.toLowerCase().includes(query) ||
      p.principios_activos?.some(pa => pa.toLowerCase().includes(query))
    );
  }
  
  if (selectedCategory !== 'todas') {
    filtered = filtered.filter(p => 
      p.categoria_principal?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }
  
  return filtered;
}

// Store SIN persistencia (para evitar QuotaExceededError)
// Los productos se cargan desde IndexedDB/SearchService
export const useAppStore = create<AppState>()(
  (set, get) => ({
    // Estado inicial - UI
    view: 'buscar',
    searchQuery: '',
    selectedCategory: 'todas',
    selectedProduct: null,
    isLoading: false,
    loadingMessage: '',
    
    // Estado inicial - Products
    products: [],
    categories: [],
    
    // Estado inicial - Sync
    syncStatus: { status: 'idle', pendingChanges: 0 },
    kbStats: { total: 0, families: 0, types: 0 },
    supabaseConnected: false,
    
    // Estado inicial - Scraping
    scrapeStates: {},
    
    // Estado inicial - KB
    kb: {},
    ingredientCount: 0,
    
    // === ACCIONES ===
    
    // UI Actions
    setView: (view) => set({ view }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
    setSelectedProduct: (selectedProduct) => set({ selectedProduct }),
    setLoading: (isLoading, loadingMessage = '') => set({ isLoading, loadingMessage }),
    
    // Products Actions
    setProducts: (products) => set({ products }),
    
    updateProduct: (sku, updates) => set((state) => ({
      products: state.products.map(p => 
        p.sku === sku ? { ...p, ...updates } : p
      )
    })),
    
    addProduct: (product) => set((state) => ({
      products: [...state.products, product]
    })),
    
    removeProduct: (sku) => set((state) => ({
      products: state.products.filter(p => p.sku !== sku)
    })),
    
    setCategories: (categories) => set({ categories }),
    
    // Sync Actions
    setSyncStatus: (syncStatus) => set({ syncStatus }),
    setKbStats: (kbStats) => set({ kbStats }),
    setSupabaseConnected: (supabaseConnected) => set({ supabaseConnected }),
    
    // Scraping Actions
    setScrapeState: (sku, state) => set((prev) => ({
      scrapeStates: { ...prev.scrapeStates, [sku]: state }
    })),
    resetScrapeStates: () => set({ scrapeStates: {} }),
    
    // KB Actions
    setKb: (kb, ingredientCount) => set({ kb, ingredientCount }),
    
    // Computed getters
    getFilteredProducts: () => {
      const { products, searchQuery, selectedCategory } = get();
      return filterProducts(products, searchQuery, selectedCategory);
    },
    
    getStats: () => {
      const { products } = get();
      return {
        total: products.length,
        kbMatch: products.filter(p => p.cobertura_kb > 0).length,
        sinergias: products.filter(p => (p.sinergias_detectadas?.length || 0) > 0).length
      };
    }
  })
);

export default useAppStore;
