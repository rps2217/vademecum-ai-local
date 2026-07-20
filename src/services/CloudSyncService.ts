import { Product } from '../core/types/product.types';
import { taskQueueService } from './TaskQueueService';
import { configService } from './ConfigService';
import { dataService } from './DataService';
import { EventBus, EventType } from './EventBus';
import { logger } from './LoggerService';
import { supabaseService } from './SupabaseService';
import { RateLimiter } from '../utils/RateLimiter';

export class CloudSyncService {
  private static instance: CloudSyncService;
  private sync_active = true;
  private isSyncing = false;
  
  // Rate limiter para evitar throttling de Supabase (30 req/min para margen)
  private rateLimiter = new RateLimiter({
    maxRequests: 30,
    windowMs: 60 * 1000,
    onLimitReached: () => logger.warn('Rate limit de Supabase próximo', 'CloudSync')
  });

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

  /**
   * Estadísticas del rate limiter
   */
  getRateLimitStats() {
    return this.rateLimiter.getStats();
  }

  /**
   * Estadísticas del estado de sincronización
   */
  getSyncStats() {
    return {
      isSyncing: this.isSyncing
    };
  }

  async handleProductSync(product: Product) {
    if (!this.sync_active) return;
    await taskQueueService.addTask('cloud_sync', product);
  }

  async updateProductsBatch(products: Product[]): Promise<number> {
    if (products.length === 0) return 0;
    if (this.isSyncing) {
      logger.info('Sincronización en progreso, omitiendo...', 'CloudSync');
      return 0;
    }

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

    // Verificar rate limit
    if (!this.rateLimiter.canMakeRequest()) {
      logger.info('Rate limit alcanzado, esperando...', 'CloudSync');
      await this.rateLimiter.waitForSlot();
    }

    this.isSyncing = true;
    logger.info(`Iniciando sincronización de lote (${products.length} productos)`, 'CloudSync');

    try {
      // Esperar slot disponible y registrar request
      await this.rateLimiter.waitForSlot();
      await dataService.syncProductsBatch(products);
      products.forEach(p => EventBus.emit(EventType.PRODUCT_UPDATED, { sku: p.sku, is_synced_cloud: true }));
      return products.length;
    } catch (error) {
      logger.error('Fallo en sincronización de lote masivo', 'CloudSync', error);
      throw error;
    } finally {
      this.isSyncing = false;
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
      
      // Usar rate limiter
      await this.rateLimiter.waitForSlot();
      
      const response = await fetch(`${supabaseUrl}/rest/v1/products?limit=1`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      if (!response.ok) return false;
      const rows = await response.json();
      return rows.length > 0;
    } catch (e) {
      supabaseService.markUnreachable();
      return false;
    }
  }

  async getCloudCount(): Promise<number> {
    try {
      if (!supabaseService.isConfigured()) return 0;
      const { supabaseUrl, supabaseKey } = dataService.getSupabaseInfo();
      
      // Usar rate limiter
      await this.rateLimiter.waitForSlot();
      
      const response = await fetch(`${supabaseUrl}/rest/v1/products?select=count`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Prefer': 'count=exact' }
      });
      if (!response.ok) return 0;
      const count = response.headers.get('content-range')?.split('/')[1];
      return count ? parseInt(count, 10) : 0;
    } catch (e) {
      supabaseService.markUnreachable();
      return 0;
    }
  }

  async claimProductLock(sku: string, nodeId: string): Promise<boolean> {
    if (!navigator.onLine || !supabaseService.isConfigured()) return true;

    try {
      const { supabaseUrl, supabaseKey } = dataService.getSupabaseInfo();
      
      // Usar rate limiter
      await this.rateLimiter.waitForSlot();
      
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
      logger.error('Error claiming lock', 'CloudSync', e);
      supabaseService.markUnreachable();
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
          // Usar rate limiter
          await this.rateLimiter.waitForSlot();
          
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
          logger.error('Failed to release lock', 'CloudSync', e);
          supabaseService.markUnreachable();
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
      const localMap = new Map(localProducts.map(p => [p.sku, p]));

      // Identify which need downloading or conflict resolution
      const toDownload: string[] = [];
      const toResolve = new Map<string, Product>();

      for (const item of cloudInventory) {
        const localProd = localMap.get(item.sku);
        if (!localProd) {
          // Entirely new product
          toDownload.push(item.sku);
        } else {
          // Check if modified in cloud since last local-to-cloud sync
          const cloudLastUpdatedStr = item.last_updated;
          const cloudLastUpdated = cloudLastUpdatedStr ? new Date(cloudLastUpdatedStr).getTime() : 0;
          const localLastSyncedCloud = localProd.last_synced_cloud || 0;

          if (cloudLastUpdated > localLastSyncedCloud) {
            toDownload.push(item.sku);
            toResolve.set(item.sku, localProd);
          }
        }
      }

      if (toDownload.length === 0) {
        logger.success('Base local actualizada.', 'CloudSync');
        return { downloaded: 0, total: cloudInventory.length };
      }

      logger.info(`Detectados ${toDownload.length} cambios. Sincronizando deltas y resolviendo conflictos...`, 'CloudSync');

      const BATCH_SIZE = 50;
      let downloadedCount = 0;

      for (let i = 0; i < toDownload.length; i += BATCH_SIZE) {
        const batchSkus = toDownload.slice(i, i + BATCH_SIZE);
        
        // Usar rate limiter
        await this.rateLimiter.waitForSlot();
        
        const downloadedProducts = await dataService.downloadCloudProducts(batchSkus);

        const finalProductsToSave: Product[] = [];

        for (const cloudProd of downloadedProducts) {
          const localConflict = toResolve.get(cloudProd.sku);
          if (localConflict) {
            // Apply granular conflict resolution field-by-field
            const mergedProduct = resolveProductConflict(localConflict, cloudProd);
            finalProductsToSave.push(mergedProduct);

            // Queue the resolved copy to upload soon so the cloud updates as well
            await taskQueueService.addTask('cloud_sync', { sku: mergedProduct.sku });
          } else {
            // New local insert
            finalProductsToSave.push({
              ...cloudProd,
              is_synced_cloud: true,
              last_synced_cloud: Date.now()
            });
          }
        }

        await dataService.importProducts(JSON.stringify(finalProductsToSave));

        downloadedCount += finalProductsToSave.length;
      }

      logger.success(`Sincronización diferencial y resolución de conflictos completada (${downloadedCount} items).`, 'CloudSync');

      EventBus.emit(EventType.DB_UPDATED, { action: 'pull_complete', count: downloadedCount });
      return { downloaded: downloadedCount, total: cloudInventory.length };

    } catch (error) {
      logger.error('Fallo en la reconciliación', 'CloudSync', error);
      throw error;
    }
  }
}

export function resolveProductConflict(local: Product, cloud: Product): Product {
  // If local wasn't modified since last sync, cloud wins
  const localLastUpdated = local.last_updated || 0;
  const cloudLastUpdated = cloud.last_updated || 0;
  const localLastSyncedCloud = local.last_synced_cloud || 0;

  // No local changes since last sync -> simple override with cloud
  if (localLastUpdated <= localLastSyncedCloud) {
    return { ...cloud, last_synced_cloud: Date.now(), is_synced_cloud: true };
  }

  // No cloud changes since last sync -> local wins, mark for sync up soon
  if (cloudLastUpdated <= localLastSyncedCloud) {
    return { ...local, last_synced_cloud: localLastSyncedCloud, is_synced_cloud: false };
  }

  // Conflict case: BOTH were updated. Let's merge them field-by-field!
  const merged: Product = { ...cloud };

  const localIsNewer = localLastUpdated > cloudLastUpdated;

  // Merge each major clinical or inventory field:
  merged.nombre_comercial = localIsNewer ? local.nombre_comercial : cloud.nombre_comercial;
  merged.descripcion = localIsNewer ? local.descripcion : cloud.descripcion;

  // Stock: merge/prefer newest edit
  const localStockVal = (local as any).stock;
  const cloudStockVal = (cloud as any).stock;
  if (localStockVal !== undefined && cloudStockVal !== undefined) {
    (merged as any).stock = localIsNewer ? localStockVal : cloudStockVal;
  } else if (localStockVal !== undefined) {
    (merged as any).stock = localStockVal;
  } else if (cloudStockVal !== undefined) {
    (merged as any).stock = cloudStockVal;
  }

  // Tags: combine uniquely so no tags are lost from either side
  const combinedTags = new Set([
    ...(local.tags_ia || []),
    ...(cloud.tags_ia || [])
  ]);
  merged.tags_ia = Array.from(combinedTags);

  // Core Clinical definitions
  merged.posologia = localIsNewer ? local.posologia : cloud.posologia;
  merged.advertencias = localIsNewer ? local.advertencias : cloud.advertencias;
  merged.indicaciones = localIsNewer ? local.indicaciones : cloud.indicaciones;
  merged.principios_activos = localIsNewer ? local.principios_activos : cloud.principios_activos;

  // Component annotations (AI extractions)
  if (local.anotaciones_componentes || cloud.anotaciones_componentes) {
    merged.anotaciones_componentes = {
      ...(cloud.anotaciones_componentes || {}),
      ...(local.anotaciones_componentes || {})
    };
  }

  // Locks & Vectors
  merged.locked_by_ai = cloud.locked_by_ai;
  merged.lock_uid = cloud.lock_uid;
  merged.lock_timestamp = cloud.lock_timestamp;
  merged.vectores = localIsNewer ? local.vectores : cloud.vectores;

  // Patient safety lights
  merged.apto_embarazo = localIsNewer ? local.apto_embarazo : cloud.apto_embarazo;
  merged.apto_lactancia = localIsNewer ? local.apto_lactancia : cloud.apto_lactancia;
  merged.apto_pediatria = localIsNewer ? local.apto_pediatria : cloud.apto_pediatria;
  merged.apto_diabeticos = localIsNewer ? local.apto_diabeticos : cloud.apto_diabeticos;
  merged.apto_hipertensos = localIsNewer ? local.apto_hipertensos : cloud.apto_hipertensos;
  merged.apto_celiacos = localIsNewer ? local.apto_celiacos : cloud.apto_celiacos;

  // Synergy relations
  merged.sugerencia_complementaria = localIsNewer ? local.sugerencia_complementaria : cloud.sugerencia_complementaria;
  merged.skus_relacionados = localIsNewer ? local.skus_relacionados : cloud.skus_relacionados;
  merged.explicacion_clinica = localIsNewer ? local.explicacion_clinica : cloud.explicacion_clinica;
  merged.synergy_analyzed = localIsNewer ? local.synergy_analyzed : cloud.synergy_analyzed;
  merged.last_synergy_analysis = localIsNewer ? local.last_synergy_analysis : cloud.last_synergy_analysis;

  // Final metadata
  merged.last_updated = Math.max(localLastUpdated, cloudLastUpdated);
  merged.last_synced_cloud = Date.now();
  merged.is_synced_cloud = false; // Mark for upload sync to push merged results back

  return merged;
}

export const cloudSyncService = CloudSyncService.getInstance();
