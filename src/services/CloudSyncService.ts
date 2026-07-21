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
  private nodeId: string;

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

  private constructor() {
    // Generar ID único para este nodo/cliente
    this.nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getInstance(): CloudSyncService {
    if (!CloudSyncService.instance) {
      CloudSyncService.instance = new CloudSyncService();
    }
    return CloudSyncService.instance;
  }

  init() {
    logger.info('Motor de sincronización inteligente listo (modo TaskQueue).', 'CloudSync');
    logger.info(`Nodo de sincronización: ${this.nodeId}`, 'CloudSync');
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
      isSyncing: this.isSyncing,
      nodeId: this.nodeId
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

    if (!supabaseService.isConfigured()) {
      throw new Error('Supabase no configurado');
    }

    const supabase = supabaseService.getClient();
    if (!supabase) {
      throw new Error('Cliente Supabase no disponible');
    }

    this.isSyncing = true;
    logger.info(`Iniciando sincronización de lote (${products.length} productos)`, 'CloudSync');

    try {
      // Esperar slot disponible
      await this.rateLimiter.waitForSlot();
      
      // Preparar payloads para Supabase
      const now = Date.now();
      const payloads = products.map(product => ({
        sku: product.sku,
        data: {
          ...product,
          is_synced_cloud: true,
          last_synced_cloud: now,
          last_updated: product.last_updated || now
        },
        last_updated: new Date(now).toISOString()
      }));

      // Usar el cliente de Supabase JS (API unificada)
      const { error, count } = await supabase
        .from('products')
        .upsert(payloads, { 
          onConflict: 'sku',
          ignoreDuplicates: false 
        });

      if (error) {
        logger.error('Error en upsert a Supabase:', 'CloudSync', error);
        throw error;
      }

      // ✅ Verificar que se guardó correctamente
      logger.success(`Sincronizados ${products.length} productos a la nube`, 'CloudSync');
      
      // Actualizar estado local con confirmación de sync exitoso
      await dataService.syncProductsBatch(products);
      
      products.forEach(p => EventBus.emit(EventType.PRODUCT_UPDATED, { sku: p.sku, is_synced_cloud: true }));
      return products.length;
      
    } catch (error) {
      logger.error('Fallo en sincronización de lote', 'CloudSync', error);
      supabaseService.markUnreachable();
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
      const supabase = supabaseService.getClient();
      if (!supabase) return false;

      // Usar el cliente de Supabase JS
      const { data, error } = await supabase
        .from('products')
        .select('sku')
        .limit(1);

      if (error) throw error;
      return (data?.length || 0) > 0;
    } catch (e) {
      supabaseService.markUnreachable();
      return false;
    }
  }

  async getCloudCount(): Promise<number> {
    try {
      if (!supabaseService.isConfigured()) return 0;
      const supabase = supabaseService.getClient();
      if (!supabase) return 0;

      // Usar el cliente de Supabase JS con count
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (e) {
      supabaseService.markUnreachable();
      return 0;
    }
  }

  async claimProductLock(sku: string, nodeId: string): Promise<boolean> {
    if (!navigator.onLine || !supabaseService.isConfigured()) return true;

    try {
      const supabase = supabaseService.getClient();
      if (!supabase) return false;

      const now = Date.now();
      const timeout = 15 * 60 * 1000; // 15 minutos

      // Obtener el producto actual de la nube
      const { data: existingData, error: fetchError } = await supabase
        .from('products')
        .select('data')
        .eq('sku', sku)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      
      // Si no existe el producto, se puede crear
      if (!existingData) return true;

      const cloudProduct: Product = existingData.data;

      // Verificar si está bloqueado por otro nodo
      if (cloudProduct.locked_by_ai &&
          cloudProduct.lock_uid !== nodeId &&
          cloudProduct.lock_timestamp &&
          (now - cloudProduct.lock_timestamp < timeout)) {
        logger.info(`Producto ${sku} bloqueado por otro nodo`, 'CloudSync');
        return false;
      }

      // Bloquear el producto
      const lockedProduct = {
        ...cloudProduct,
        locked_by_ai: true,
        lock_uid: nodeId,
        lock_timestamp: now,
        is_synced_cloud: false
      };

      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          data: {
            ...lockedProduct,
            updated_at_cloud: new Date().toISOString()
          }
        })
        .eq('sku', sku);

      if (updateError) throw updateError;

      // Guardar localmente también
      await dataService.saveProduct(lockedProduct, { silent: true });
      return true;
      
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
      const supabase = supabaseService.getClient();
      if (supabase) {
        try {
          const { error } = await supabase
            .from('products')
            .update({ 
              data: {
                ...unlockedProduct,
                updated_at_cloud: new Date().toISOString()
              }
            })
            .eq('sku', product.sku);

          cloudSuccess = !error;
          
          if (cloudSuccess) {
            logger.success(`Sinergia de ${product.nombre_comercial} guardada en la nube`, 'CloudSync');
          } else {
            logger.error('Error al guardar en nube:', 'CloudSync', error);
          }
        } catch (e) {
          logger.error('Failed to release lock', 'CloudSync', e);
          supabaseService.markUnreachable();
          logger.warn(`No se pudo subir a la nube ${product.sku}, se guardó solo localmente`, 'CloudSync');
        }
      }
    }

    await dataService.saveProduct({ ...unlockedProduct, is_synced_cloud: cloudSuccess }, { silent: true });

    EventBus.emit(EventType.PRODUCT_UPDATED, { sku: product.sku, is_synced_cloud: cloudSuccess });
    EventBus.emit(EventType.DB_UPDATED, { action: 'saved', sku: product.sku });
  }

  async pullCloudData(): Promise<{ downloaded: number; total: number }> {
    try {
      if (!supabaseService.isConfigured()) return { downloaded: 0, total: 0 };
      
      const supabase = supabaseService.getClient();
      if (!supabase) return { downloaded: 0, total: 0 };
      
      logger.info('Iniciando sincronización inteligente...', 'CloudSync');

      // Obtener inventario de la nube
      const { data: cloudInventory, error: inventoryError } = await supabase
        .from('products')
        .select('sku, last_updated');

      if (inventoryError) throw inventoryError;
      if (!cloudInventory) return { downloaded: 0, total: 0 };

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

      // Descargar en lotes
      for (let i = 0; i < toDownload.length; i += BATCH_SIZE) {
        const batchSkus = toDownload.slice(i, i + BATCH_SIZE);
        
        // Obtener productos de la nube
        const { data: cloudProducts, error: downloadError } = await supabase
          .from('products')
          .select('data')
          .in('sku', batchSkus);

        if (downloadError) {
          logger.error(`Error descargando lote ${i / BATCH_SIZE + 1}:`, 'CloudSync', downloadError);
          continue;
        }

        const finalProductsToSave: Product[] = [];

        for (const row of cloudProducts || []) {
          const cloudProd: Product = row.data;
          
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

        if (finalProductsToSave.length > 0) {
          await dataService.importProducts(JSON.stringify(finalProductsToSave));
          downloadedCount += finalProductsToSave.length;
        }
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

/**
 * Resuelve conflictos entre productos local y cloud
 * Usa timestamps para determinar qué versión es más reciente
 * y combina los campos de manera inteligente
 */
export function resolveProductConflict(local: Product, cloud: Product): Product {
  const localLastUpdated = local.last_updated || 0;
  const cloudLastUpdated = cloud.last_updated || 0;
  const localLastSyncedCloud = local.last_synced_cloud || 0;

  // Caso 1: Local no modificado desde último sync -> cloud gana
  if (localLastUpdated <= localLastSyncedCloud) {
    logger.debug(`Conflicto resuelto: Cloud gana para ${local.sku}`, 'CloudSync');
    return { ...cloud, last_synced_cloud: Date.now(), is_synced_cloud: true };
  }

  // Caso 2: Cloud no modificado desde último sync -> local gana
  if (cloudLastUpdated <= localLastSyncedCloud) {
    logger.debug(`Conflicto resuelto: Local gana para ${local.sku}`, 'CloudSync');
    return { ...local, last_synced_cloud: localLastSyncedCloud, is_synced_cloud: false };
  }

  // Caso 3: Ambos modificados después del último sync -> MERGE
  logger.info(`Conflicto detectado para ${local.sku}. Resolviendo con merge...`, 'CloudSync');
  
  const merged: Product = { ...cloud };
  const localIsNewer = localLastUpdated > cloudLastUpdated;

  // Información básica: el más nuevo gana
  merged.nombre_comercial = localIsNewer ? local.nombre_comercial : cloud.nombre_comercial;
  merged.descripcion = localIsNewer ? local.descripcion : cloud.descripcion;

  // Tags: COMBINAR (nunca perder información)
  const combinedTags = new Set([
    ...(local.tags_ia || []),
    ...(cloud.tags_ia || [])
  ]);
  merged.tags_ia = Array.from(combinedTags);

  // Datos clínicos: el más nuevo gana
  merged.posologia = localIsNewer ? local.posologia : cloud.posologia;
  merged.advertencias = localIsNewer ? local.advertencias : cloud.advertencias;
  merged.indicaciones = localIsNewer ? local.indicaciones : cloud.indicaciones;
  merged.principios_activos = localIsNewer ? local.principios_activos : cloud.principios_activos;

  // Anotaciones AI: COMBINAR (merge)
  if (local.anotaciones_componentes || cloud.anotaciones_componentes) {
    merged.anotaciones_componentes = {
      ...(cloud.anotaciones_componentes || {}),
      ...(local.anotaciones_componentes || {})
    };
  }

  // Locks: El más reciente gana (basado en timestamp)
  if (local.lock_timestamp && cloud.lock_timestamp) {
    if (local.lock_timestamp > cloud.lock_timestamp) {
      merged.locked_by_ai = local.locked_by_ai;
      merged.lock_uid = local.lock_uid;
      merged.lock_timestamp = local.lock_timestamp;
    }
    // Si cloud es más nuevo o igual, mantener cloud (ya está en merged)
  } else if (local.lock_timestamp) {
    merged.locked_by_ai = local.locked_by_ai;
    merged.lock_uid = local.lock_uid;
    merged.lock_timestamp = local.lock_timestamp;
  }
  // Si cloud tiene locks pero local no, mantener cloud (ya está en merged)

  // Vectores: el más nuevo gana
  merged.vectores = localIsNewer ? local.vectores : cloud.vectores;

  // Seguridad del paciente: el más nuevo gana
  merged.apto_embarazo = localIsNewer ? local.apto_embarazo : cloud.apto_embarazo;
  merged.apto_lactancia = localIsNewer ? local.apto_lactancia : cloud.apto_lactancia;
  merged.apto_pediatria = localIsNewer ? local.apto_pediatria : cloud.apto_pediatria;
  merged.apto_diabeticos = localIsNewer ? local.apto_diabeticos : cloud.apto_diabeticos;
  merged.apto_hipertensos = localIsNewer ? local.apto_hipertensos : cloud.apto_hipertensos;
  merged.apto_celiacos = localIsNewer ? local.apto_celiacos : cloud.apto_celiacos;

  // Sinergias: el más nuevo gana
  merged.sugerencia_complementaria = localIsNewer ? local.sugerencia_complementaria : cloud.sugerencia_complementaria;
  merged.skus_relacionados = localIsNewer ? local.skus_relacionados : cloud.skus_relacionados;
  merged.explicacion_clinica = localIsNewer ? local.explicacion_clinica : cloud.explicacion_clinica;
  merged.synergy_analyzed = localIsNewer ? local.synergy_analyzed : cloud.synergy_analyzed;
  merged.last_synergy_analysis = localIsNewer ? local.last_synergy_analysis : cloud.last_synergy_analysis;

  // Metadata final
  merged.last_updated = Math.max(localLastUpdated, cloudLastUpdated);
  merged.last_synced_cloud = Date.now();
  merged.is_synced_cloud = false; // Marcar para subir a la nube

  return merged;
}

export const cloudSyncService = CloudSyncService.getInstance();
