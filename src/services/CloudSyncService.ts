import { Product } from '../core/types/product.types';
import { TaskQueueService } from './TaskQueueService';
import { ConfigService } from './ConfigService';
import { DataService } from './DataService';
import { EventBus, EventType } from './EventBus';
import { Subscription } from 'rxjs';

/**
 * Sincronización Inteligente: 
 * Implementa Change Detection para ahorrar cuota y CPU.
 */
export const CloudSyncService = {
  sync_active: true,

  init: () => {
    // Ya no usamos suscripción reactiva aquí para evitar bucles.
    // El DataService se encarga de encolar las tareas de sincronización.
    console.log('[CloudSync] Motor de sincronización inteligente listo (modo TaskQueue).');
  },

  handleProductSync: async (product: Product) => {
    if (!CloudSyncService.sync_active) return;
    await TaskQueueService.addTask('cloud_sync', product);
  },

  getCloudCount: async (): Promise<number> => {
    // Implementar si se requiere conteo remoto
    return 0;
  },

  checkCloudData: async () => {
    if (!navigator.onLine) return true;
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) && data.length > 0;
      }
      return false;
    } catch {
      return false;
    }
  },

  updateProductsBatch: async (products: Product[]) => {
    if (products.length === 0) return true;
    
    const config = ConfigService.getConfig();
    if (!config.autoSyncCloud) return true;

    try {
      // Enviar uno a uno o implementar endpoint bulk en backend
      // Por ahora para compatibilidad usamos el bucle saveProduct
      for (const product of products) {
        await DataService.saveProduct(product, { silent: true });
      }
      return true;
    } catch (error: any) {
      console.error('[CloudSync] Error en guardado por lotes:', error);
      return false;
    }
  },

  /**
   * Stub para compatibilidad con lógica de bloqueo distribuido.
   * En la arquitectura centralizada en el servidor, los conflictos se resuelven en el backend.
   */
  claimProductLock: async (_sku: string, _userId: string): Promise<boolean> => {
    return true; 
  },

  releaseProductLockAndSave: async (product: Product) => {
    await DataService.saveProduct(product);
  },

  uploadLocalProducts: async () => {
    const products = await DataService.getAllProducts();
    await CloudSyncService.updateProductsBatch(products);
    return products.length;
  }
};
