import { Product } from '../core/types/product.types';
import { TaskQueueService } from './TaskQueueService';
import { ConfigService } from './ConfigService';
import { DataService } from './DataService';
import { EventBus, EventType } from './EventBus';

/**
 * Sincronización Inteligente: 
 * Implementa Change Detection para ahorrar cuota y CPU.
 */
export const CloudSyncService = {
  sync_active: true,

  init: () => {
    console.log('[CloudSync] Motor de sincronización inteligente listo (modo TaskQueue).');
  },

  handleProductSync: async (product: Product) => {
    if (!CloudSyncService.sync_active) return;
    await TaskQueueService.addTask('cloud_sync', product);
  },

  updateProductsBatch: async (products: Product[]): Promise<number> => {
    if (products.length === 0) return 0;
    
    const config = ConfigService.getConfig();
    if (!config.autoSyncCloud) return 0;

    if (!navigator.onLine) {
      throw new Error('Offline');
    }

    console.log(`[CloudSync] Procesando lote de ${products.length} productos.`);
    let successCount = 0;

    for (const product of products) {
      try {
        await DataService.syncToSupabase(product);
        successCount++;
        EventBus.emit(EventType.PRODUCT_UPDATED, { sku: product.sku, synced: true });
      } catch (error) {
        console.error(`[CloudSync] Error sincronizando ${product.sku}:`, error);
      }
    }
    return successCount;
  },

  uploadLocalProducts: async (): Promise<number> => {
    const products = await DataService.getAllProducts();
    return await CloudSyncService.updateProductsBatch(products);
  },

  checkCloudData: async (): Promise<boolean> => {
    try {
      const { supabaseUrl, supabaseKey } = DataService.getSupabaseInfo();
      const response = await fetch(`${supabaseUrl}/rest/v1/products?limit=1`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      if (!response.ok) return false;
      const rows = await response.json();
      return rows.length > 0;
    } catch (e) {
      return false;
    }
  }
};
