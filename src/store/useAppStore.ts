/**
 * Zustand Store - Estado Global Centralizado
 * Reemplaza estado fragmentado en múltiples lugares
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  AnalyzedProduct, 
  ViewType, 
  ProductFilters, 
  SyncStatus, 
  KbStats,
  ScrapingState 
} from '../types';

// ==================== ESTADO ====================

interface AppStore {
  // Productos
  products: AnalyzedProduct[];
  setProducts: (products: AnalyzedProduct[]) => void;
  addProduct: (product: AnalyzedProduct) => void;
  updateProduct: (sku: string, updates: Partial<AnalyzedProduct>) => void;
  
  // Vista actual
  view: ViewType;
  setView: (view: ViewType) => void;
  
  // Producto seleccionado
  selectedProduct: AnalyzedProduct | null;
  setSelectedProduct: (product: AnalyzedProduct | null) => void;
  
  // Filtros
  filters: ProductFilters;
  setFilters: (filters: Partial<ProductFilters>) => void;
  resetFilters: () => void;
  
  // Estado de scraping
  scrapeStates: Record<string, ScrapingState>;
  setScrapeState: (sku: string, state: ScrapingState) => void;
  
  // Sincronización KB
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
  
  // Estadísticas KB
  kbStats: KbStats;
  setKbStats: (stats: KbStats) => void;
  
  // Loading states
  loading: boolean;
  loadingMessage: string;
  setLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  
  // Acciones asíncronas
  loadProducts: () => Promise<void>;
  syncKnowledgeBase: () => Promise<void>;
  
  // Cache de KB local
  kbCache: Record<string, unknown> | null;
  setKbCache: (cache: Record<string, unknown> | null) => void;
}

// ==================== VALORES INICIALES ====================

const initialFilters: ProductFilters = {
  search: '',
  category: 'todas',
  hasIngredients: false,
  hasSynergies: false,
  hasAntagonisms: false,
};

const initialSyncStatus: SyncStatus = {
  status: 'idle',
};

const initialKbStats: KbStats = {
  total: 0,
  families: 0,
  types: 0,
  version: '0.0.0',
};

// ==================== STORE ====================

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Productos
      products: [],
      setProducts: (products) => set({ products }),
      addProduct: (product) => set((state) => ({
        products: [...state.products.filter(p => p.sku !== product.sku), product]
      })),
      updateProduct: (sku, updates) => set((state) => ({
        products: state.products.map(p => 
          p.sku === sku ? { ...p, ...updates } : p
        )
      })),
      
      // Vista
      view: 'buscar',
      setView: (view) => set({ view }),
      
      // Producto seleccionado
      selectedProduct: null,
      setSelectedProduct: (product) => set({ selectedProduct: product }),
      
      // Filtros
      filters: initialFilters,
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      })),
      resetFilters: () => set({ filters: initialFilters }),
      
      // Scraping
      scrapeStates: {},
      setScrapeState: (sku, state) => set((prev) => ({
        scrapeStates: { ...prev.scrapeStates, [sku]: state }
      })),
      
      // Sincronización
      syncStatus: initialSyncStatus,
      setSyncStatus: (status) => set({ syncStatus: status }),
      
      // KB Stats
      kbStats: initialKbStats,
      setKbStats: (stats) => set({ kbStats: stats }),
      
      // Loading
      loading: false,
      loadingMessage: '',
      setLoading: (loading) => set({ loading }),
      setLoadingMessage: (message) => set({ loadingMessage: message }),
      
      // Cache KB
      kbCache: null,
      setKbCache: (cache) => set({ kbCache: cache }),
      
      // Acciones
      loadProducts: async () => {
        // Esta función se implementará con DataService
        // Por ahora es un placeholder
        set({ loading: true, loadingMessage: 'Cargando productos...' });
        try {
          // Import dinámico para evitar ciclos
          const { dataService } = await import('../services/DataService');
          const products = await dataService.getAllProducts();
          set({ products, loading: false });
        } catch (error) {
          console.error('Error loading products:', error);
          set({ loading: false });
        }
      },
      
      syncKnowledgeBase: async () => {
        set({ 
          syncStatus: { status: 'syncing', progress: 0 }
        });
        try {
          const { knowledgeSyncService } = await import('../services/KnowledgeSyncService');
          const result = await knowledgeSyncService.sync();
          
          if (result.success) {
            set({ 
              syncStatus: { 
                status: 'synced', 
                lastSyncAt: result.mergedAt 
              }
            });
          } else {
            set({ 
              syncStatus: { 
                status: 'error', 
                error: result.error 
              }
            });
          }
        } catch (error: any) {
          set({ 
            syncStatus: { 
              status: 'error', 
              error: error.message 
            }
          });
        }
      },
    }),
    {
      name: 'vademecum-storage',
      partialize: (state) => ({
        // Solo persistir lo necesario
        view: state.view,
        filters: state.filters,
        kbCache: state.kbCache,
      }),
    }
  )
);

// ==================== SELECTORES ====================

export const selectFilteredProducts = (state: AppStore) => {
  const { products, filters } = state;
  
  return products.filter(product => {
    // Filtro de búsqueda
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesSearch = 
        product.nombre_comercial?.toLowerCase().includes(search) ||
        product.principios_activos?.some(p => p.toLowerCase().includes(search)) ||
        product.sku?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    
    // Filtro de categoría
    if (filters.category && filters.category !== 'todas') {
      const matchesCategory = product.categoria_principal === filters.category;
      if (!matchesCategory) return false;
    }
    
    // Filtro por ingredientes en KB
    if (filters.hasIngredients) {
      if ((product.cobertura_kb || 0) === 0) return false;
    }
    
    // Filtro por sinergias
    if (filters.hasSynergies) {
      if (!product.kbAnalysis?.synergies?.length) return false;
    }
    
    // Filtro por antagonismos
    if (filters.hasAntagonisms) {
      if (!product.kbAnalysis?.antagonisms?.length) return false;
    }
    
    return true;
  });
};

export const selectProductsByCategory = (state: AppStore) => {
  const categories = new Map<string, AnalyzedProduct[]>();
  
  state.products.forEach(product => {
    const cat = product.categoria_principal || 'Sin categoría';
    if (!categories.has(cat)) {
      categories.set(cat, []);
    }
    categories.get(cat)!.push(product);
  });
  
  return categories;
};

export const selectStats = (state: AppStore) => ({
  total: state.products.length,
  withIngredients: state.products.filter(p => (p.cobertura_kb || 0) > 0).length,
  withSynergies: state.products.filter(p => (p.kbAnalysis?.synergies?.length || 0) > 0).length,
  withAntagonisms: state.products.filter(p => (p.kbAnalysis?.antagonisms?.length || 0) > 0).length,
});

export default useAppStore;
