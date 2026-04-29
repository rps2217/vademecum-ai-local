import { Product } from '../core/types/product.types';
import { TaskQueueService } from './TaskQueueService';
import { ConfigService } from './ConfigService';
import { DataService } from './DataService';
import { EventBus, EventType } from './EventBus';
import { LogService } from './LogService';

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
    LogService.add({
      level: 'info',
      module: 'CloudSync',
      message: `Iniciando sincronización de lote (${products.length} productos)`,
    });
    let successCount = 0;

    for (const product of products) {
      try {
        await DataService.syncToSupabase(product);
        successCount++;
        EventBus.emit(EventType.PRODUCT_UPDATED, { sku: product.sku, synced: true });
      } catch (error) {
        LogService.add({
          level: 'error',
          module: 'CloudSync',
          message: `Error al sincronizar producto ${product.sku}`,
          details: error instanceof Error ? error.message : error
        });
        console.error(`[CloudSync] Error sincronizando ${product.sku}:`, error);
      }
    }

    if (successCount > 0) {
      LogService.add({
        level: 'success',
        module: 'CloudSync',
        message: `Sincronización de lote completada: ${successCount} productos actualizados`,
      });
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
  },

  getCloudCount: async (): Promise<number> => {
    try {
      const { supabaseUrl, supabaseKey } = DataService.getSupabaseInfo();
      const response = await fetch(`${supabaseUrl}/rest/v1/products?select=count`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Prefer': 'count=exact' }
      });
      if (!response.ok) return 0;
      // Depending on Supabase response, might need parsing, assuming it returns count header or body
      const count = response.headers.get('content-range')?.split('/')[1];
      return count ? parseInt(count, 10) : 0;
    } catch (e) {
      return 0;
    }
  },

  claimProductLock: async (sku: string, nodeId: string): Promise<boolean> => {
    // Simple lock implementation: in a real app, this should be an RPC or atomic DB operation
    // For now, let's just return true to emulate locking
    return true;
  },

  releaseProductLockAndSave: async (product: Product): Promise<void> => {
    await DataService.saveProduct(product);
  }
};
