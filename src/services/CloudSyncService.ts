import { Product } from '../core/types/product.types';
import { TaskQueueService } from './TaskQueueService';
import { ConfigService } from './ConfigService';
import { DataService } from './DataService';
import { EventBus, EventType } from './EventBus';
import { Subscription } from 'rxjs';

/**
 * Servicio de Sincronización en la Nube (Abstracción de Supabase vía Backend)
 * 
 * Este servicio orquestra la subida de datos locales al servidor,
 * el cual se encarga de persistirlos en Supabase.
 */
export const CloudSyncService = {
  sync_active: true,
  subscription: null as Subscription | null,

  init: () => {
    if (CloudSyncService.subscription) return;
    
    // Escuchar actualizaciones de productos para disparar sincronización reactiva
    CloudSyncService.subscription = EventBus.on<{sku: string}>(EventType.PRODUCT_UPDATED).subscribe(async ({ sku }) => {
      const product = await DataService.getProductBySku(sku);
      if (product) {
        await CloudSyncService.handleProductSync(product);
      }
    });
    
    console.log('[CloudSync] Servicio inicializado y escuchando cambios.');
  },

  handleProductSync: async (product: Product) => {
    if (!CloudSyncService.sync_active) return;
    
    try {
      const config = ConfigService.getConfig();
      if (!config.autoSyncCloud) return;

      // Usar DataService para guardar (que ya implementa la llamada al API /api/products)
      await DataService.saveProduct(product, { silent: true });
      
    } catch (error: any) {
      console.warn('[CloudSync] Fallo en sincronización reactiva:', error);
    }
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
