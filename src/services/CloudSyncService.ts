import { Product } from '../core/types/product.types';
import { taskQueueService } from './TaskQueueService';
import { configService } from './ConfigService';
import { dataService } from './DataService';
import { EventBus, EventType } from './EventBus';
import { logger } from './LoggerService';
import { supabaseService } from './SupabaseService';

export class CloudSyncService {
  private static instance: CloudSyncService;
  private sync_active = true;

  // 1. Detección de perfil de red adaptativo
  private getNetworkProfile() {
    const conn = (navigator as any).connection;
    if (!conn) return 'standard';
    return conn.saveData ? 'low-bandwidth' : (conn.effectiveType === '4g' ? 'high-bandwidth' : 'standard');
  }

  private constructor() {}

  static getInstance(): CloudSyncService {
    if (!CloudSyncService.instance) {
      CloudSyncService.instance = new CloudSyncService();
    }
    return CloudSyncService.instance;
  }

  init() {
    logger.info('Motor de sincronización inteligente listo (modo TaskQueue).', 'CloudSync');
  }

  async handleProductSync(product: Product) {
    if (!this.sync_active) return;
    await taskQueueService.addTask('cloud_sync', product);
  }

  async updateProductsBatch(products: Product[]): Promise<number> {
    if (products.length === 0) return 0;
    
    const config = configService.getConfig();
    if (!config.autoSyncCloud) return 0;

    const profile = this.getNetworkProfile();
    if (profile === 'low-bandwidth' && products.length > 5) {
       logger.warn(`Network low-bandwidth: Fragmentando lote de ${products.length} a 5 elementos.`, 'CloudSync');
       return await this.updateProductsBatch(products.slice(0, 5));
    }
    
    if (!navigator.onLine) {
      throw new Error('Offline');
    }

    logger.info(`Iniciando sincronización de lote (${products.length} productos)`, 'CloudSync');
    
    try {
      await dataService.syncProductsBatch(products);
      products.forEach(p => EventBus.emit(EventType.PRODUCT_UPDATED, { sku: p.sku, is_synced_cloud: true }));
      return products.length;
    } catch (error) {
      logger.error('Fallo en sincronización de lote masivo', 'CloudSync', error);
      throw error;
    }
  }

  async uploadLocalProducts(): Promise<number> {
    const products = await dataService.getAllProducts();
    return await this.updateProductsBatch(products);
  }

  async checkCloudData(): Promise<boolean> {
    try {
      if (!supabaseService.isConfigured()) return false;
      const { supabaseUrl, supabaseKey } = dataService.getSupabaseInfo();
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

  async getCloudCount(): Promise<number> {
    try {
      if (!supabaseService.isConfigured()) return 0;
      const { supabaseUrl, supabaseKey } = dataService.getSupabaseInfo();
      const response = await fetch(`${supabaseUrl}/rest/v1/products?select=count`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Prefer': 'count=exact' }
      });
      if (!response.ok) return 0;
      const count = response.headers.get('content-range')?.split('/')[1];
      return count ? parseInt(count, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  async claimProductLock(sku: string, nodeId: string): Promise<boolean> {
    if (!navigator.onLine || !supabaseService.isConfigured()) return true; 
    
    try {
      const { supabaseUrl, supabaseKey } = dataService.getSupabaseInfo();
      const now = Date.now();
      const timeout = 15 * 60 * 1000; 

      const checkResponse = await fetch(`${supabaseUrl}/rest/v1/products?sku=eq.${sku}&select=data`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      
      if (!checkResponse.ok) return false;
      const result = await checkResponse.json();
      if (result.length === 0) return true; 

      const cloudProduct: Product = result[0].data;
      
      if (cloudProduct.locked_by_ai && 
          cloudProduct.lock_uid !== nodeId && 
          cloudProduct.lock_timestamp && 
          (now - cloudProduct.lock_timestamp < timeout)) {
        return false;
      }

      const lockedProduct = {
        ...cloudProduct,
        locked_by_ai: true,
        lock_uid: nodeId,
        lock_timestamp: now,
        is_synced_cloud: false 
      };

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
        await dataService.saveProduct(lockedProduct, { silent: true });
        return true;
      }

      return false;
    } catch (e) {
      console.error('[CloudSync] Error claiming lock:', e);
      return false;
    }
  }

  async releaseProductLockAndSave(product: Product): Promise<void> {
    const unlockedProduct = {
      ...product,
      locked_by_ai: false,
      lock_uid: null as any,
      lock_timestamp: null as any,
      is_synced_cloud: true,
      last_synced_cloud: Date.now()
    };
    
    let cloudSuccess = false;
    if (supabaseService.isConfigured()) {
        const { supabaseUrl, supabaseKey } = dataService.getSupabaseInfo();
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
            logger.success(`Sinergia de ${product.nombre_comercial} guardada en la nube`, 'CloudSync');
          }
        } catch (e) {
          console.error('[CloudSync] Failed to release lock:', e);
          logger.warn(`No se pudo subir a la nube ${product.sku}, se guardó solo localmente`, 'CloudSync');
        }
    }

    await dataService.saveProduct({ ...unlockedProduct, is_synced_cloud: cloudSuccess }, { silent: true });
    
    EventBus.emit(EventType.PRODUCT_UPDATED, { sku: product.sku, is_synced_cloud: cloudSuccess });
    EventBus.emit(EventType.DB_UPDATED, { action: 'saved', sku: product.sku });
  }

  async pullCloudData(): Promise<{ downloaded: number; total: number }> {
    try {
      if (!supabaseService.isConfigured()) return { downloaded: 0, total: 0 };
      logger.info('Iniciando sincronización inteligente...', 'CloudSync');
      
      const cloudInventory = await dataService.fetchCloudInventory();
      const localProducts = await dataService.getAllProducts();
      const localMap = new Map(localProducts.map(p => [p.sku, p.last_synced_cloud || 0]));

      const toDownload = cloudInventory.filter(item => {
        return !localMap.has(item.sku);
      }).map(item => item.sku);
      
      if (toDownload.length === 0) {
        logger.success('Base local actualizada.', 'CloudSync');
        return { downloaded: 0, total: cloudInventory.length };
      }

      logger.info(`Detectados ${toDownload.length} cambios. Sincronizando deltas...`, 'CloudSync');

      const BATCH_SIZE = 50;
      let downloadedCount = 0;

      for (let i = 0; i < toDownload.length; i += BATCH_SIZE) {
        const batchSkus = toDownload.slice(i, i + BATCH_SIZE);
        const products = await dataService.downloadCloudProducts(batchSkus);
        const syncedProducts = products.map(p => ({ ...p, is_synced_cloud: true, last_synced_cloud: Date.now() }));
        
        await dataService.importProducts(JSON.stringify(syncedProducts));
        
        downloadedCount += syncedProducts.length;
      }

      logger.success(`Sincronización diferencial completada (${downloadedCount} items).`, 'CloudSync');

      EventBus.emit(EventType.DB_UPDATED, { action: 'pull_complete', count: downloadedCount });
      return { downloaded: downloadedCount, total: cloudInventory.length };

    } catch (error) {
      logger.error('Fallo en la reconciliación', 'CloudSync', error);
      throw error;
    }
  }
}

export const cloudSyncService = CloudSyncService.getInstance();
