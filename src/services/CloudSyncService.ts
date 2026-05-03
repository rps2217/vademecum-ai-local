import { Product } from '../core/types/product.types';
import { taskQueueService } from './TaskQueueService';
import { configService } from './ConfigService';
import { dataService } from './DataService';
import { EventBus, EventType } from './EventBus';
import { logger } from './LoggerService';

export class CloudSyncService {
  private static instance: CloudSyncService;
  private sync_active = true;

  private constructor() {}

  static getInstance(): CloudSyncService {
    if (!CloudSyncService.instance) {
      CloudSyncService.instance = new CloudSyncService();
    }
    return CloudSyncService.instance;
  }

  init() {
  }

  async handleProductSync(product: Product) {
    if (!this.sync_active) return;
    await taskQueueService.addTask('cloud_sync', product);
  }

  async updateProductsBatch(products: Product[]): Promise<number> {
    if (products.length === 0) return 0;
    
    const config = configService.getConfig();
    if (!config.autoSyncCloud) return 0;

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
      const response = await fetch('/api/cloud-status');
      if (!response.ok) return false;
      const data = await response.json();
      return data.success && data.cloud_product_count > 0;
    } catch (e) {
      return false;
    }
  }

  async getCloudCount(): Promise<number> {
    try {
      const response = await fetch('/api/cloud-status');
      if (!response.ok) return 0;
      const data = await response.json();
      return data.cloud_product_count || 0;
    } catch (e) {
      return 0;
    }
  }

  async claimProductLock(sku: string, nodeId: string): Promise<boolean> {
    if (!navigator.onLine) return true; 
    
    try {
      const response = await fetch('/api/products/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, nodeId })
      });

      if (!response.ok) return false;
      const result = await response.json();
      
      if (result.success && result.product) {
        await dataService.saveProduct(result.product, { silent: true });
        return true;
      }

      return result.success; 
    } catch (e) {
      console.error('[CloudSync] Error claiming lock:', e);
      return false;
    }
  }

  async releaseProductLockAndSave(product: Product): Promise<void> {
    let cloudSuccess = false;
    let finalProduct = product;

    try {
      const response = await fetch('/api/products/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product })
      });
      
      cloudSuccess = response.ok;
      if (cloudSuccess) {
        const result = await response.json();
        finalProduct = result.product;
        logger.success(`Sinergia de ${product.nombre_comercial} guardada en la nube`, 'CloudSync');
      }
    } catch (e) {
      console.error('[CloudSync] Failed to release lock:', e);
      logger.warn(`No se pudo subir a la nube ${product.sku}, se guardó solo localmente`, 'CloudSync');
    }

    await dataService.saveProduct({ ...finalProduct, is_synced_cloud: cloudSuccess }, { silent: true });
    
    EventBus.emit(EventType.PRODUCT_UPDATED, { sku: product.sku, is_synced_cloud: cloudSuccess });
    EventBus.emit(EventType.DB_UPDATED, { action: 'saved', sku: product.sku });
  }

  async pullCloudData(): Promise<{ downloaded: number; total: number }> {
    try {
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
