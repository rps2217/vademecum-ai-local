import { create } from 'zustand';
import { Product } from '@/core/types/product.types';
import { PendingTask } from '@/services/TaskQueueService';

interface AppState {
  // Data
  products: Product[];
  isLoadingProducts: boolean;
  
  // UI - Selection
  viewedProductSku: string | null;
  comparisonSkus: string[];
  
  // Tasks / Queue
  pendingTasks: PendingTask[];
  taskStats: { pending: number; failed: number };
  
  // History / Logs
  logs: any[];
  
  // Actions
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (sku: string, updates: Partial<Product>) => void;
  deleteProduct: (sku: string) => void;
  setLoadingProducts: (loading: boolean) => void;
  
  setViewedProduct: (sku: string | null) => void;
  addToComparison: (sku: string) => void;
  removeFromComparison: (sku: string) => void;
  clearComparison: () => void;
  
  setTasks: (tasks: PendingTask[]) => void;
  setTaskStats: (stats: { pending: number; failed: number }) => void;
  
  addLog: (log: any) => void;
  clearHistory: () => void;
}

export const useStore = create<AppState>((set) => ({
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
  addToComparison: (sku) => set((state) => ({
    comparisonSkus: state.comparisonSkus.includes(sku) 
      ? state.comparisonSkus 
      : [...state.comparisonSkus, sku].slice(-4) // Max 4 products
  })),
  removeFromComparison: (sku) => set((state) => ({
    comparisonSkus: state.comparisonSkus.filter(s => s !== sku)
  })),
  clearComparison: () => set({ comparisonSkus: [] }),
  
  // Task actions
  setTasks: (tasks) => set({ pendingTasks: tasks }),
  setTaskStats: (stats) => set({ taskStats: stats }),
  
  // Log actions
  addLog: (log) => set((state) => ({ 
    logs: [log, ...state.logs].slice(0, 100) 
  })),
  clearHistory: () => set({ logs: [] }),
}));
