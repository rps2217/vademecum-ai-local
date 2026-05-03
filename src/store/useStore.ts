import { create } from 'zustand';
import { Product } from '@/core/types/product.types';
import { PendingTask } from '@/services/TaskQueueService';

interface AppState {
  // UI - Selection
  viewedProductSku: string | null;
  comparisonSkus: string[];
  
  // Tasks / Queue
  pendingTasks: PendingTask[];
  taskStats: { pending: number; failed: number };
  
  // History / Logs
  logs: any[];
  
  // Actions
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
  // UI selection initial state
  viewedProductSku: null,
  comparisonSkus: [],
  
  // Tasks initial state
  pendingTasks: [],
  taskStats: { pending: 0, failed: 0 },
  
  // Logs initial state
  logs: [],
  
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
