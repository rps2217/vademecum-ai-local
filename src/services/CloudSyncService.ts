import { Product } from '../core/types/product.types';
import { TaskQueueService } from './TaskQueueService';
import { ConfigService } from './ConfigService';
import { DataService } from './DataService';
import { EventBus, EventType } from './EventBus';
import { LogService } from './LogService';
import { LocalDBService } from './LocalDBService';

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
    if (!navigator.onLine) return true; // Offline mode defaults to local lock (risky but functional)
    
    try {
      const { supabaseUrl, supabaseKey } = DataService.getSupabaseInfo();
      const now = Date.now();
      const timeout = 15 * 60 * 1000; // 15 minutes timeout

      // CAMBIO DE ESTRATEGIA: Para evitar sobre-escribir el 'data' JSONB accidentalmente
      // y dado que no podemos ejecutar SQL directamente fácilmente sin un helper RPC,
      // usaremos un enfoque de "Optimistic Concurrency" leyendo primero.
      
      const checkResponse = await fetch(`${supabaseUrl}/rest/v1/products?sku=eq.${sku}&select=data`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      
      if (!checkResponse.ok) return false;
      const result = await checkResponse.json();
      if (result.length === 0) return true; // Si no está en la nube, es nuestro.

      const cloudProduct: Product = result[0].data;
      
      // Si ya está bloqueado por otro y no ha expirado
      if (cloudProduct.locked_by_ai && 
          cloudProduct.lock_uid !== nodeId && 
          cloudProduct.lock_timestamp && 
          (now - cloudProduct.lock_timestamp < timeout)) {
        return false;
      }

      // Si está libre o expiró, lo reclamamos
      const lockedProduct = {
        ...cloudProduct,
        locked_by_ai: true,
        lock_uid: nodeId,
        lock_timestamp: now,
        synced: false // Forzar resync local
      };

      // Guardar el reclamo en la nube
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/products?sku=eq.${sku}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          data: {
            ...lockedProduct,
            updated_at_cloud: new Date().toISOString()
          }
        })
      });

      if (updateResponse.ok) {
        // También guardar localmente para que el worker lo sepa (Uso de import dinámico para evitar 'not defined')
        const { LocalDBService: LocalDB } = await import('./LocalDBService');
        await LocalDB.saveProduct(lockedProduct);
        return true;
      }

      return false;
    } catch (e) {
      console.error('[CloudSync] Error claiming lock:', e);
      return false;
    }
  },

  releaseProductLockAndSave: async (product: Product): Promise<void> => {
    const unlockedProduct = {
      ...product,
      locked_by_ai: false,
      lock_uid: null,
      lock_timestamp: null,
      synced: true,
      last_synced: Date.now()
    };
    
    const { supabaseUrl, supabaseKey } = DataService.getSupabaseInfo();
    let cloudSuccess = false;
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/products?sku=eq.${product.sku}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          data: {
            ...unlockedProduct,
            updated_at_cloud: new Date().toISOString()
          }
        })
      });
      cloudSuccess = response.ok;
      if (cloudSuccess) {
        LogService.add({
          level: 'success',
          module: 'CloudSync',
          message: `Sinergia de ${product.nombre_comercial} guardada en la nube`,
        });
      }
    } catch (e) {
      console.error('[CloudSync] Failed to release lock:', e);
      LogService.add({
        level: 'warn',
        module: 'CloudSync',
        message: `No se pudo subir a la nube ${product.sku}, se guardó solo localmente`,
      });
    }

    const { LocalDBService: LocalDB } = await import('./LocalDBService');
    await LocalDB.saveProduct({ ...unlockedProduct, synced: cloudSuccess });
    
    // Notificar actualización de producto
    EventBus.emit(EventType.PRODUCT_UPDATED, { sku: product.sku, synced: cloudSuccess });
    EventBus.emit(EventType.DB_UPDATED, { action: 'saved', sku: product.sku });
  },

  /**
   * Reconciliación Inteligente PRO (Smart Sync):
   * Compara timestamps para descargar solo lo nuevo o actualizado.
   */
  pullCloudData: async (): Promise<{ downloaded: number; total: number }> => {
    try {
      LogService.add({
        level: 'info',
        module: 'CloudSync',
        message: 'Iniciando sincronización inteligente...',
      });
      
      const { LocalDBService: LocalDB } = await import('./LocalDBService');
      const cloudInventory = await DataService.fetchCloudInventory();
      const localProducts = await LocalDB.getAllProducts();
      const localMap = new Map(localProducts.map(p => [p.sku, p.last_synced || 0]));

      const toDownload = cloudInventory.filter(item => {
        return !localMap.has(item.sku);
      }).map(item => item.sku);
      
      if (toDownload.length === 0) {
        LogService.add({
          level: 'success',
          module: 'CloudSync',
          message: 'Base local actualizada.',
        });
        return { downloaded: 0, total: cloudInventory.length };
      }

      LogService.add({
        level: 'info',
        module: 'CloudSync',
        message: `Detectados ${toDownload.length} cambios. Sincronizando deltas...`,
      });

      const BATCH_SIZE = 50;
      let downloadedCount = 0;

      for (let i = 0; i < toDownload.length; i += BATCH_SIZE) {
        const batchSkus = toDownload.slice(i, i + BATCH_SIZE);
        const products = await DataService.downloadCloudProducts(batchSkus);
        const syncedProducts = products.map(p => ({ ...p, synced: true, last_synced: Date.now() }));
        await LocalDB.bulkSaveProducts(syncedProducts);
        downloadedCount += syncedProducts.length;
      }

      LogService.add({
        level: 'success',
        module: 'CloudSync',
        message: `Sincronización diferencial completada (${downloadedCount} items).`,
      });

      EventBus.emit(EventType.DB_UPDATED, { action: 'pull_complete', count: downloadedCount });
      return { downloaded: downloadedCount, total: cloudInventory.length };

    } catch (error) {
      LogService.add({
        level: 'error',
        module: 'CloudSync',
        message: 'Fallo en la reconciliación',
        details: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }
};
