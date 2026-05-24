import { create } from 'zustand';
import { Product } from '@/core/types/product.types';
import { PendingTask } from '@/services/TaskQueueService';
import { storage } from '@/utils/storage';
import { EventBus, EventType } from '@/services/EventBus';

interface AppState {
  // Data
  products: Product[];
  isLoadingProducts: boolean;
  
  // UI - Selection
  viewedProductSku: string | null;
  comparisonSkus: string[]; // Kept for backwards compatibility
  
  // Tasks / Queue
  pendingTasks: PendingTask[];
  taskStats: { pending: number; failed: number };
  
  // History / Logs
  logs: any[];

  // Consolidated UI States
  searchQuery: string;
  isSearching: boolean;
  tray: Product[];
  selectedProducts: Product[]; // Used for Consultation
  comparisonList: Product[]; // Used for Comparison
  
  // Actions
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (sku: string, updates: Partial<Product>) => void;
  deleteProduct: (sku: string) => void;
  setLoadingProducts: (loading: boolean) => void;
  
  setViewedProduct: (sku: string | null) => void;
  addToComparisonOld: (sku: string) => void;
  removeFromComparisonOld: (sku: string) => void;
  clearComparisonOld: () => void;
  
  setTasks: (tasks: PendingTask[]) => void;
  setTaskStats: (stats: { pending: number; failed: number }) => void;
  
  addLog: (log: any) => void;
  clearHistory: () => void;

  // Consolidated UI Actions
  // Search
  setSearchQuery: (query: string) => void;
  setIsSearching: (isSearching: boolean) => void;

  // Tray
  toggleTrayProduct: (product: Product) => void;
  clearTray: () => void;
  isInTray: (sku: string) => boolean;

  // Consultation
  addToConsultation: (product: Product) => void;
  removeFromConsultation: (sku: string) => void;
  clearConsultation: () => void;
  isInConsultation: (sku: string) => boolean;

  // Comparison
  addToComparison: (product: Product) => void;
  removeFromComparison: (sku: string) => void;
  clearComparison: () => void;
  isInComparison: (sku: string) => boolean;
}

export const useStore = create<AppState>((set, get) => ({
  // Data initial state
  products: [],
  isLoadingProducts: false,
  
  // UI selection initial state
  viewedProductSku: null,
  comparisonSkus: [],
  
  // Tasks initial state
  pendingTasks: [],
  taskStats: { pending: 0, failed: 0 },
  
  // Logs initial state
  logs: [],

  // Consolidated states
  searchQuery: '',
  isSearching: false,
  tray: storage.get<Product[]>('vademecum_tray', []),
  selectedProducts: storage.get<Product[]>('vademecum_consultation', []),
  comparisonList: [],
  
  // Data actions
  setProducts: (products) => set({ products }),
  addProduct: (product) => set((state) => ({ 
    products: [...state.products.filter(p => p.sku !== product.sku), product] 
  })),
  updateProduct: (sku, updates) => set((state) => ({
    products: state.products.map((p) => p.sku === sku ? { ...p, ...updates } : p)
  })),
  deleteProduct: (sku) => set((state) => ({
    products: state.products.filter((p) => p.sku !== sku)
  })),
  setLoadingProducts: (loading) => set({ isLoadingProducts: loading }),
  
  // UI actions
  setViewedProduct: (sku) => set({ viewedProductSku: sku }),
  addToComparisonOld: (sku) => set((state) => ({
    comparisonSkus: state.comparisonSkus.includes(sku) 
      ? state.comparisonSkus 
      : [...state.comparisonSkus, sku].slice(-4)
  })),
  removeFromComparisonOld: (sku) => set((state) => ({
    comparisonSkus: state.comparisonSkus.filter(s => s !== sku)
  })),
  clearComparisonOld: () => set({ comparisonSkus: [] }),
  
  // Task actions
  setTasks: (tasks) => set({ pendingTasks: tasks }),
  setTaskStats: (stats) => set({ taskStats: stats }),
  
  // Log actions
  addLog: (log) => set((state) => ({ 
    logs: [log, ...state.logs].slice(0, 100) 
  })),
  clearHistory: () => set({ logs: [] }),

  // Consolidated UI actions
  // Search
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsSearching: (isSearching) => set({ isSearching }),

  // Tray
  toggleTrayProduct: (product) => set((state) => {
    const exists = state.tray.find(p => p.sku === product.sku);
    const newTray = exists 
      ? state.tray.filter(p => p.sku !== product.sku)
      : [...state.tray, product];
    storage.set('vademecum_tray', newTray);
    EventBus.emit(EventType.TRAY_CHANGED, { products: newTray });
    return { tray: newTray };
  }),
  clearTray: () => set(() => {
    storage.set('vademecum_tray', []);
    EventBus.emit(EventType.TRAY_CHANGED, { products: [] });
    return { tray: [] };
  }),
  isInTray: (sku) => get().tray.some(p => p.sku === sku),

  // Consultation
  addToConsultation: (product) => set((state) => {
    if (state.selectedProducts.some(p => p.sku === product.sku)) return state;
    if (state.selectedProducts.length >= 5) {
      return state;
    }
    const newSelected = [...state.selectedProducts, product];
    storage.set('vademecum_consultation', newSelected);
    return { selectedProducts: newSelected };
  }),
  removeFromConsultation: (sku) => set((state) => {
    const newSelected = state.selectedProducts.filter(p => p.sku !== sku);
    storage.set('vademecum_consultation', newSelected);
    return { selectedProducts: newSelected };
  }),
  clearConsultation: () => set(() => {
    storage.set('vademecum_consultation', []);
    return { selectedProducts: [] };
  }),
  isInConsultation: (sku) => get().selectedProducts.some(p => p.sku === sku),

  // Comparison
  addToComparison: (product) => set((state) => {
    if (state.comparisonList.some(p => p.sku === product.sku)) return state;
    if (state.comparisonList.length >= 3) {
      return state;
    }
    const newList = [...state.comparisonList, product];
    EventBus.emit(EventType.COMPARISON_CHANGED, { products: newList });
    return { comparisonList: newList };
  }),
  removeFromComparison: (sku) => set((state) => {
    const newList = state.comparisonList.filter(p => p.sku !== sku);
    EventBus.emit(EventType.COMPARISON_CHANGED, { products: newList });
    return { comparisonList: newList };
  }),
  clearComparison: () => set(() => {
    EventBus.emit(EventType.COMPARISON_CHANGED, { products: [] });
    return { comparisonList: [] };
  }),
  isInComparison: (sku) => get().comparisonList.some(p => p.sku === sku),
}));
