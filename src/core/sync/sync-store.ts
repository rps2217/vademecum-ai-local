/**
 * Sync Store - Estado de sincronización con Supabase
 * Gestiona datos remotos y alertas de seguridad
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tipos para alertas de seguridad
export interface SecurityAlert {
  id: string;
  type: 'warning' | 'critical' | 'recall' | 'contraindication';
  title: string;
  message: string;
  affectedProducts?: string[];
  affectedIngredients?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  read: boolean;
  expiresAt?: string;
  source: string;
  url?: string;
}

// Tipos para datos de ingredientes sincronizados
export interface SyncIngredientData {
  id: string;
  name: string;
  scientificName?: string;
  category: string;
  description: string;
  mechanism: string;
  indications: string[];
  contraindications: string[];
  interactions: string[];
  dosage: string;
  sideEffects?: string[];
  synonyms: string[];
  warnings?: string[];
  lastUpdated: string;
}

// Tipos para datos de productos sincronizados
export interface SyncProductData {
  sku: string;
  description?: string;
  indications?: string[];
  posologia?: string;
  contraindications?: string[];
  interactions?: string[];
  sideEffects?: string[];
  lastUpdated: string;
}

// Estado del store
interface SyncState {
  // Alertas de seguridad
  alerts: SecurityAlert[];
  unreadAlertsCount: number;
  
  // Datos de ingredientes sincronizados
  ingredients: Record<string, SyncIngredientData>;
  ingredientsLastSync: string | null;
  
  // Datos de productos sincronizados
  productsData: Record<string, SyncProductData>;
  productsLastSync: string | null;
  
  // Estado de conexión
  isOnline: boolean;
  isSyncing: boolean;
  lastError: string | null;
  
  // Acciones
  setAlerts: (alerts: SecurityAlert[]) => void;
  addAlert: (alert: SecurityAlert) => void;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  clearExpiredAlerts: () => void;
  
  setIngredients: (ingredients: Record<string, SyncIngredientData>) => void;
  updateIngredient: (id: string, data: SyncIngredientData) => void;
  
  setProductsData: (data: Record<string, SyncProductData>) => void;
  updateProductData: (sku: string, data: SyncProductData) => void;
  
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setError: (error: string | null) => void;
  
  // Sincronización
  syncAll: () => Promise<void>;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      alerts: [],
      unreadAlertsCount: 0,
      ingredients: {},
      ingredientsLastSync: null,
      productsData: {},
      productsLastSync: null,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: false,
      lastError: null,

      // Acciones
      setAlerts: (alerts) => {
        const unreadCount = alerts.filter(a => !a.read).length;
        set({ alerts, unreadAlertsCount: unreadCount });
      },

      addAlert: (alert) => {
        const { alerts } = get();
        if (alerts.some(a => a.id === alert.id)) return;
        
        const newAlerts = [alert, ...alerts];
        const unreadCount = newAlerts.filter(a => !a.read).length;
        set({ alerts: newAlerts, unreadAlertsCount: unreadCount });
      },

      markAlertRead: (id) => {
        const { alerts } = get();
        const newAlerts = alerts.map(a => 
          a.id === id ? { ...a, read: true } : a
        );
        const unreadCount = newAlerts.filter(a => !a.read).length;
        set({ alerts: newAlerts, unreadAlertsCount: unreadCount });
      },

      markAllAlertsRead: () => {
        const { alerts } = get();
        const newAlerts = alerts.map(a => ({ ...a, read: true }));
        set({ alerts: newAlerts, unreadAlertsCount: 0 });
      },

      clearExpiredAlerts: () => {
        const { alerts } = get();
        const now = new Date();
        const validAlerts = alerts.filter(a => {
          if (!a.expiresAt) return true;
          return new Date(a.expiresAt) > now;
        });
        const unreadCount = validAlerts.filter(a => !a.read).length;
        set({ alerts: validAlerts, unreadAlertsCount: unreadCount });
      },

      setIngredients: (ingredients) => {
        set({ 
          ingredients, 
          ingredientsLastSync: new Date().toISOString() 
        });
      },

      updateIngredient: (id, data) => {
        const { ingredients } = get();
        set({ 
          ingredients: { ...ingredients, [id]: data } 
        });
      },

      setProductsData: (data) => {
        set({ 
          productsData: data, 
          productsLastSync: new Date().toISOString() 
        });
      },

      updateProductData: (sku, data) => {
        const { productsData } = get();
        set({ 
          productsData: { ...productsData, [sku]: data } 
        });
      },

      setOnline: (online) => set({ isOnline: online }),
      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setError: (error) => set({ lastError: error }),

      syncAll: async () => {
        const { setSyncing, setError } = get();
        setSyncing(true);
        setError(null);
        
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Error de sincronización');
        } finally {
          setSyncing(false);
        }
      },
    }),
    {
      name: 'vademecum-sync-storage',
      partialize: (state) => ({
        alerts: state.alerts,
        ingredients: state.ingredients,
        productsData: state.productsData,
        ingredientsLastSync: state.ingredientsLastSync,
        productsLastSync: state.productsLastSync,
      }),
    }
  )
);
