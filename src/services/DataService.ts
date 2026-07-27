import { Product, SafetyStatus } from '../core/types/product.types';
import { EventBus, EventType } from './EventBus';
import { taskQueueService } from './TaskQueueService';
import { logger } from './LoggerService';
import { database, productsCollection } from '../database';
import { Q } from '@nozbe/watermelondb';
import ProductModel from '../database/Product';
import { supabaseService } from './SupabaseService';
import { useStore } from '../store/useStore';
import { validateProduct, validateProducts, ProductSchema, type ProductInput } from '../core/schemas/validation';

/**
 * Resultado de la importación del catálogo
 */
export interface CatalogImportResult {
  success: boolean;
  count: number;
  source: 'cloud' | 'local' | 'none';
  error?: string;
}

export class DataService {
  private static instance: DataService;
  private catalogImported = false;

  private constructor() {}

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  private async getDB(): Promise<any> {
    return database;
  }

  getSupabaseInfo() {
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || (window as any)._env_?.VITE_SUPABASE_URL;
    const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (window as any)._env_?.VITE_SUPABASE_ANON_KEY;
    return { supabaseUrl, supabaseKey };
  }

  async getAllProducts(): Promise<Product[]> {
    const records = await productsCollection.query().fetch();
    return records.map(record => record.asJSON());
  }

  /**
   * Importa el catálogo de productos
   * 1. Si ya hay productos locales, los usa directamente
   * 2. Si la BD está vacía, descarga desde Supabase (nube)
   * 3. Si no hay conexión a la nube y BD está vacía, retorna vacío
   */
  async importCatalog(): Promise<CatalogImportResult> {
    if (this.catalogImported) {
      logger.info('Catálogo ya importado previamente', 'DataService');
      return { success: true, count: 0, source: 'none' };
    }

    // Verificar si ya hay productos en la BD local
    const existingProducts = await productsCollection.query().fetchCount();
    if (existingProducts > 0) {
      logger.info(`Base de datos local ya contiene ${existingProducts} productos. Usando datos locales.`, 'DataService');
      this.catalogImported = true;
      EventBus.emit(EventType.DB_UPDATED, {});
      return { success: true, count: existingProducts, source: 'local' };
    }

    // BD vacía: intentar descargar desde Supabase
    if (!supabaseService.isConfigured()) {
      logger.error('❌ Supabase no está configurado. No se puede descargar el catálogo.', 'DataService');
      logger.warn('⚠️ La base de datos permanecerá vacía hasta que haya conexión a la nube.', 'DataService');
      return { 
        success: false, 
        count: 0, 
        source: 'none',
        error: 'Supabase no configurado. Ve a Ajustes para conectar.'
      };
    }

    try {
      logger.info('🌐 Descargando productos desde la nube (Supabase)...', 'DataService');
      const products = await this.downloadAllCloudProducts();
      
      if (products.length === 0) {
        logger.error('❌ La nube no contiene productos. La base de datos permanecerá vacía.', 'DataService');
        return { 
          success: false, 
          count: 0, 
          source: 'none',
          error: 'La nube no contiene productos. Sincroniza datos primero.'
        };
      }

      logger.info(`💾 Guardando ${products.length} productos en la base de datos local...`, 'DataService');
      await this.saveProductsToLocalDB(products);
      
      // Solo guardar la fecha de sync
      localStorage.setItem('last_sync', new Date().toISOString());
      
      this.catalogImported = true;
      logger.success(`✅ Catálogo descargado exitosamente: ${products.length} productos desde la nube`, 'DataService');
      EventBus.emit(EventType.DB_UPDATED, {});
      return { success: true, count: products.length, source: 'cloud' };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error(`❌ Error al descargar desde la nube: ${errorMessage}`, 'DataService', error);
      return { 
        success: false, 
        count: 0, 
        source: 'none',
        error: `Error de conexión: ${errorMessage}. Intenta más tarde.`
      };
    }
  }

  /**
   *Fuerza la descarga de productos desde la nube, borrando la BD local primero.
   * Útil cuando los productos en la nube no coinciden con los locales.
   */
  async forceReloadFromCloud(): Promise<CatalogImportResult> {
    logger.warn('🔄 Iniciando descarga forzada desde la nube...', 'DataService');
    
    try {
      // 1. Verificar Supabase
      if (!supabaseService.isConfigured()) {
        return { success: false, count: 0, source: 'none', error: 'Supabase no configurado' };
      }

      // 2. Contar productos en la nube
      const supabase = supabaseService.getClient();
      const { count, error: countError } = await supabase
        .from('products_v2')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        logger.error('Error contando productos en Supabase:', 'DataService', countError);
        return { success: false, count: 0, source: 'none', error: countError.message };
      }
      
      logger.info(`📊 Productos en Supabase: ${count}`, 'DataService');
      
      if (!count || count === 0) {
        return { success: false, count: 0, source: 'none', error: 'La nube no tiene productos' };
      }

      // 3. Descargar productos
      const products = await this.downloadAllCloudProducts();
      
      if (products.length === 0) {
        return { success: false, count: 0, source: 'none', error: 'No se pudieron descargar productos' };
      }

      // 4. Guardar en BD local
      await this.saveProductsToLocalDB(products);
      
      // 5. Resetear el flag y notificar
      this.catalogImported = true;
      EventBus.emit(EventType.DB_UPDATED, {});
      
      // 6. Actualizar Zustand store
      const allProducts = await this.getAllProducts();
      useStore.getState().setProducts(allProducts);
      
      logger.success(`✅ Descarga forzada completada: ${products.length} productos`, 'DataService');
      return { success: true, count: products.length, source: 'cloud' };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error(`❌ Error en descarga forzada: ${errorMessage}`, 'DataService', error);
      return { success: false, count: 0, source: 'none', error: errorMessage };
    }
  }

  /**
   * Descarga todos los productos desde Supabase
   */
  private async downloadAllCloudProducts(): Promise<Product[]> {
    if (!supabaseService.isConfigured()) {
      logger.error('Supabase no está configurado', 'DataService');
      return [];
    }
    
    const supabase = supabaseService.getClient();
    if (!supabase) {
      logger.error('Cliente Supabase no disponible', 'DataService');
      return [];
    }

    try {
      logger.info('Iniciando descarga de productos desde Supabase...', 'DataService');
      
      // Descargar en lotes de 1000 para evitar timeouts
      const allProducts: any[] = [];
      let page = 0;
      const pageSize = 1000;
      
      while (true) {
        const from = page * pageSize;
        const to = (page + 1) * pageSize - 1;
        logger.info(`Descargando lote ${page + 1}: productos ${from}-${to}`, 'DataService');
        
        const { data, error, status } = await supabase
          .from('products_v2')
          .select('*')
          .range(from, to);
        
        if (error) {
          logger.error(`Error de Supabase (status ${status}): ${error.message}`, 'DataService', error);
          // Intentar con count para diagnóstico
          const { count, error: countError } = await supabase
            .from('products_v2')
            .select('*', { count: 'exact', head: true });
          logger.info(`Diagnóstico: productos en Supabase = ${count}, error: ${countError?.message}`, 'DataService');
          throw error;
        }
        
        if (!data || data.length === 0) {
          logger.info(`No más productos para descargar. Total: ${allProducts.length}`, 'DataService');
          break;
        }
        
        logger.info(`Recibidos ${data.length} productos en este lote`, 'DataService');
        
        // products_v2 tiene campos directos, no envueltos en 'data'
        const products = data;
        
        allProducts.push(...products);
        
        if (data.length < pageSize) {
          logger.info(`Último lote recibido. Total acumulado: ${allProducts.length}`, 'DataService');
          break;
        }
        page++;
      }

      logger.success(`Descarga completada: ${allProducts.length} productos`, 'DataService');
      return allProducts as Product[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error(`Error descargando productos: ${errorMessage}`, 'DataService', error);
      return [];
    }
  }

  /**
   * Guarda una lista de productos en la base de datos local
   */
  async saveProductsToLocalDB(products: Product[]): Promise<void> {
    if (!products || products.length === 0) {
      logger.warn('No hay productos para guardar', 'DataService');
      return;
    }

    logger.debug('saveProductsToLocalDB llamado con ' + products.length + ' productos', 'DataService');
    logger.info(`Guardando ${products.length} productos en la base de datos local...`, 'DataService');

    // Validación Zod de todos los productos
    const validation = validateProducts(products);
    if (!validation.success) {
      logger.warn(`Validación Zod: ${validation.errorCount} productos inválidos de ${products.length}`, 'DataService');
      if (validation.errors.length > 0) {
        logger.debug('Errores de validación: ' + JSON.stringify(validation.errors.slice(0, 3)), 'DataService');
      }
    } else {
      logger.debug('Todos los productos pasaron validación Zod', 'DataService');
    }

    // Verificar estructura del primer producto para debug
    if (products[0]) {
      logger.debug('Primer producto: ' + JSON.stringify(products[0]).substring(0, 300), 'DataService');
      logger.debug('Claves del primer producto: ' + Object.keys(products[0]).join(', '), 'DataService');
      logger.info(`Primer producto SKU: ${products[0].sku}`, 'DataService');
      logger.info(`Primer producto nombre: ${products[0].nombre_comercial || 'N/A'}`, 'DataService');
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    try {
      await database.write(async () => {
        for (const product of products) {
          try {
            // Verificar que tenga SKU
            if (!product.sku) {
              logger.debug('Producto sin SKU, omitiendo', 'DataService');
              logger.warn('Producto sin SKU, omitiendo', 'DataService');
              errorCount++;
              continue;
            }

            // Verificar si ya existe
            const existing = await productsCollection.query(Q.where('sku', product.sku)).fetch();
            if (existing.length > 0) {
              logger.debug(`Producto ${product.sku} ya existe`, 'DataService');
              logger.info(`Producto ${product.sku} ya existe, omitiendo`, 'DataService');
              skippedCount++;
              continue;
            }

            logger.debug(`Creando producto: ${product.sku}`, 'DataService');
            
            await productsCollection.create(record => {
              record.sku = product.sku;
              record.nombreComercial = product.nombre_comercial || product.sku;
              record.descripcion = product.descripcion || '';
              record._principiosActivosJson = JSON.stringify(product.principios_activos || []);
              record.posologia = product.posologia || '';
              record._indicacionesJson = JSON.stringify(product.indicaciones || []);
              record.advertencias = product.advertencias || '';
              record._tagsIaJson = JSON.stringify(product.tags_ia || []);
              record.categoriaPrincipal = product.categoria_principal || 'Medicamento';
              record.analisisComponentes = product.analisis_componentes || '';
              record._anotacionesComponentesJson = JSON.stringify(product.anotaciones_componentes || {});
              record._vectoresJson = JSON.stringify(product.vectores || []);
              record.aptoEmbarazo = product.apto_embarazo || 'PRECAUCION';
              record.aptoLactancia = product.apto_lactancia || 'PRECAUCION';
              record.aptoPediatria = product.apto_pediatria || 'PRECAUCION';
              record.aptoDiabeticos = product.apto_diabeticos || 'SI';
              record.aptoHipertensos = product.apto_hipertensos || 'SI';
              record.aptoCeliacos = product.apto_celiacos || 'SI';
              record.sugerenciaComplementaria = product.sugerencia_complementaria || '';
              record._skusRelacionadosJson = JSON.stringify(product.skus_relacionados || []);
              record.lastUpdated = product.last_updated || Date.now();
            });

            successCount++;
            if (successCount % 50 === 0) {
              logger.debug(`Guardados ${successCount} productos...`, 'DataService');
            }
          } catch (e: any) {
            errorCount++;
            logger.error(`Error guardando producto ${product.sku}`, 'DataService', e);
            logger.error(`Error guardando producto ${product.sku}: ${e}`, 'DataService', e);
          }
        }
      });
    } catch (writeError) {
      logger.error('Error en database.write', 'DataService', writeError);
      throw writeError;
    }

    logger.success(`Guardado completado: ${successCount} exitosos, ${skippedCount} omitidos, ${errorCount} errores`, 'DataService');
    logger.info(`Guardado completado: ${successCount} exitosos, ${skippedCount} omitidos, ${errorCount} errores`, 'DataService');
    
    // Verificar count en base de datos
    try {
      const dbCount = await productsCollection.query().fetchCount();
      logger.info(`Total productos en base de datos: ${dbCount}`, 'DataService');
      logger.info(`Total productos en base de datos: ${dbCount}`, 'DataService');
    } catch (countError) {
      logger.error('Error contando productos', 'DataService', countError);
    }
  }

  private validateProduct(product: Product) {
    if (!product.sku) throw new Error('Product must have a SKU');
    if (!product.nombre_comercial) throw new Error('Product must have a common name');
    return true;
  }

  /**
   * Normaliza un producto antes de guardarlo, asignando valores por defecto
   * para campos faltantes o valores inválidos
   */
  private normalizeProduct(product: Partial<Product>): Product {
    // Valores válidos para SafetyStatus
    const validSafetyStatuses = ['SI', 'NO', 'PRECAUCION'];
    
    const normalizeSafetyStatus = (value: any): string => {
      if (value && validSafetyStatuses.includes(value)) return value;
      return 'PRECAUCION'; // Default seguro
    };

    return {
      // Campos requeridos (validación previa asegura que existan)
      sku: product.sku || '',
      nombre_comercial: product.nombre_comercial || 'Sin nombre',
      descripcion: product.descripcion || '',
      principios_activos: Array.isArray(product.principios_activos) ? product.principios_activos : [],
      posologia: product.posologia || '',
      indicaciones: Array.isArray(product.indicaciones) ? product.indicaciones : [],
      advertencias: product.advertencias || '',
      tags_ia: Array.isArray(product.tags_ia) ? product.tags_ia : [],
      
      // Campos opcionales con defaults
      categoria_principal: product.categoria_principal || 'Medicamento',
      analisis_componentes: product.analisis_componentes || '',
      anotaciones_componentes: product.anotaciones_componentes || {},
      vectores: Array.isArray(product.vectores) ? product.vectores : [],
      
      // Safety Status (normalizados)
      apto_embarazo: normalizeSafetyStatus(product.apto_embarazo),
      apto_lactancia: normalizeSafetyStatus(product.apto_lactancia),
      apto_pediatria: normalizeSafetyStatus(product.apto_pediatria),
      apto_diabeticos: normalizeSafetyStatus(product.apto_diabeticos),
      apto_hipertensos: normalizeSafetyStatus(product.apto_hipertensos),
      apto_celiacos: normalizeSafetyStatus(product.apto_celiacos),
      
      // Relaciones
      sugerencia_complementaria: product.sugerencia_complementaria || '',
      skus_relacionados: Array.isArray(product.skus_relacionados) ? product.skus_relacionados : [],
      
      // Análisis de sinergia
      explicacion_clinica: product.explicacion_clinica,
      synergy_analyzed: product.synergy_analyzed,
      last_synergy_analysis: product.last_synergy_analysis,
      synergy_retries: product.synergy_retries,
      
      // Locking
      locked_by_ai: product.locked_by_ai,
      lock_uid: product.lock_uid,
      lock_timestamp: product.lock_timestamp,
      
      // Metadatos
      source_url: product.source_url,
      last_updated: product.last_updated || Date.now(),
      
      // Auditoría
      is_verified: product.is_verified,
      verified_at: product.verified_at,
      verified_by: product.verified_by,
      
      // Sync
      is_synced_cloud: product.is_synced_cloud,
      last_synced_cloud: product.last_synced_cloud,
    };
  }

  async saveProduct(product: Product, options: { silent?: boolean } = {}): Promise<void> {
    try {
      // Normalizar producto antes de guardar
      const normalized = this.normalizeProduct(product);
      this.validateProduct(normalized);
      
      await database.write(async () => {
        const existing = await productsCollection.query(Q.where('sku', normalized.sku)).fetch();
        
        if (existing.length > 0) {
          const record = existing[0];
          await record.update(r => {
            r.nombreComercial = normalized.nombre_comercial;
            r.descripcion = normalized.descripcion;
            r._principiosActivosJson = JSON.stringify(normalized.principios_activos);
            r.posologia = normalized.posologia;
            r._indicacionesJson = JSON.stringify(normalized.indicaciones);
            r.advertencias = normalized.advertencias;
            r._tagsIaJson = JSON.stringify(normalized.tags_ia);
            r.categoriaPrincipal = normalized.categoria_principal;
            r.analisisComponentes = normalized.analisis_componentes;
            r._anotacionesComponentesJson = JSON.stringify(normalized.anotaciones_componentes);
            r._vectoresJson = JSON.stringify(normalized.vectores);
            r.aptoEmbarazo = normalized.apto_embarazo;
            r.aptoLactancia = normalized.apto_lactancia;
            r.aptoPediatria = normalized.apto_pediatria;
            r.aptoDiabeticos = normalized.apto_diabeticos;
            r.aptoHipertensos = normalized.apto_hipertensos;
            r.aptoCeliacos = normalized.apto_celiacos;
            r.sugerenciaComplementaria = normalized.sugerencia_complementaria;
            r._skusRelacionadosJson = JSON.stringify(normalized.skus_relacionados);
            r.explicacionClinica = normalized.explicacion_clinica;
            r.synergyAnalyzed = normalized.synergy_analyzed;
            r.lastSynergyAnalysis = normalized.last_synergy_analysis;
            r.synergyRetries = normalized.synergy_retries;
            r.lockedByAi = normalized.locked_by_ai;
            r.lockUid = normalized.lock_uid;
            r.lockTimestamp = normalized.lock_timestamp;
            r.sourceUrl = normalized.source_url;
            r.lastUpdated = normalized.last_updated;
            r.isVerified = normalized.is_verified;
            r.verifiedAt = normalized.verified_at;
            r.verifiedBy = normalized.verified_by;
            r.isSyncedCloud = normalized.is_synced_cloud;
            r.lastSyncedCloud = normalized.last_synced_cloud;
          });
        } else {
          await productsCollection.create(r => {
            r.sku = normalized.sku;
            r.nombreComercial = normalized.nombre_comercial;
            r.descripcion = normalized.descripcion;
            r._principiosActivosJson = JSON.stringify(normalized.principios_activos);
            r.posologia = normalized.posologia;
            r._indicacionesJson = JSON.stringify(normalized.indicaciones);
            r.advertencias = normalized.advertencias;
            r._tagsIaJson = JSON.stringify(normalized.tags_ia);
            r.categoriaPrincipal = normalized.categoria_principal;
            r.analisisComponentes = normalized.analisis_componentes;
            r._anotacionesComponentesJson = JSON.stringify(normalized.anotaciones_componentes);
            r._vectoresJson = JSON.stringify(normalized.vectores);
            r.aptoEmbarazo = normalized.apto_embarazo;
            r.aptoLactancia = normalized.apto_lactancia;
            r.aptoPediatria = normalized.apto_pediatria;
            r.aptoDiabeticos = normalized.apto_diabeticos;
            r.aptoHipertensos = normalized.apto_hipertensos;
            r.aptoCeliacos = normalized.apto_celiacos;
            r.sugerenciaComplementaria = normalized.sugerencia_complementaria;
            r._skusRelacionadosJson = JSON.stringify(normalized.skus_relacionados);
            r.explicacionClinica = normalized.explicacion_clinica;
            r.synergyAnalyzed = normalized.synergy_analyzed;
            r.lastSynergyAnalysis = normalized.last_synergy_analysis;
            r.synergyRetries = normalized.synergy_retries;
            r.lockedByAi = normalized.locked_by_ai;
            r.lockUid = normalized.lock_uid;
            r.lockTimestamp = normalized.lock_timestamp;
            r.sourceUrl = normalized.source_url;
            r.lastUpdated = normalized.last_updated;
            r.isVerified = normalized.is_verified;
            r.verifiedAt = normalized.verified_at;
            r.verifiedBy = normalized.verified_by;
            r.isSyncedCloud = normalized.is_synced_cloud;
            r.lastSyncedCloud = normalized.last_synced_cloud;
          });
        }
      });

      if (!options.silent) {
        await taskQueueService.addTask('cloud_sync', { sku: normalized.sku });
        
        if (!normalized.anotaciones_componentes || Object.keys(normalized.anotaciones_componentes).length === 0) {
          if (normalized.principios_activos && normalized.principios_activos.length > 0) {
            await taskQueueService.addTask('ingredient_analysis', { sku: normalized.sku });
          }
        }

        // Sync with Zustand
        useStore.getState().addProduct(normalized);
        
        EventBus.emit(EventType.PRODUCT_UPDATED, { sku: normalized.sku });
      }
    } catch (error) {
      logger.error('Fallo al guardar producto en WatermelonDB', 'Database', error);
      throw error;
    }
  }

  async importProducts(jsonString: string): Promise<{ success: number; errors: number }> {
    try {
      const data = JSON.parse(jsonString);
      const newProducts: Product[] = Array.isArray(data) ? data : [data];
      const validProducts: Product[] = [];
      let errorCount = 0;

      for (const p of newProducts) {
        try {
          this.validateProduct(p);
          validProducts.push(p);
        } catch (e) {
          errorCount++;
        }
      }
      
      await database.write(async () => {
        // Bulk upsert logic for WatermelonDB
        for (const product of validProducts) {
          const existing = await productsCollection.query(Q.where('sku', product.sku)).fetch();
          if (existing.length > 0) {
            await existing[0].update(r => {
                r.nombreComercial = product.nombre_comercial;
                r.descripcion = product.descripcion;
                r._principiosActivosJson = JSON.stringify(product.principios_activos || []);
                r.posologia = product.posologia || '';
                r._indicacionesJson = JSON.stringify(product.indicaciones || []);
                r.advertencias = product.advertencias || '';
                r._tagsIaJson = JSON.stringify(product.tags_ia || []);
                r.categoriaPrincipal = product.categoria_principal;
                r.analisisComponentes = product.analisis_componentes;
                r._anotacionesComponentesJson = JSON.stringify(product.anotaciones_componentes || {});
                r._vectoresJson = JSON.stringify(product.vectores || []);
                r.aptoEmbarazo = product.apto_embarazo;
                r.aptoLactancia = product.apto_lactancia;
                r.aptoPediatria = product.apto_pediatria;
                r.aptoDiabeticos = product.apto_diabeticos;
                r.aptoHipertensos = product.apto_hipertensos;
                r.aptoCeliacos = product.apto_celiacos;
                r.sugerenciaComplementaria = product.sugerencia_complementaria;
                r._skusRelacionadosJson = JSON.stringify(product.skus_relacionados || []);
                r.explicacionClinica = product.explicacion_clinica;
                r.synergyAnalyzed = product.synergy_analyzed;
                r.lastSynergyAnalysis = product.last_synergy_analysis;
                r.synergyRetries = product.synergy_retries;
                r.lockedByAi = product.locked_by_ai;
                r.lockUid = product.lock_uid;
                r.lockTimestamp = product.lock_timestamp;
                r.sourceUrl = product.source_url;
                r.lastUpdated = product.last_updated || Date.now();
                r.isVerified = product.is_verified;
                r.verifiedAt = product.verified_at;
                r.verifiedBy = product.verified_by;
                r.isSyncedCloud = product.is_synced_cloud;
                r.lastSyncedCloud = product.last_synced_cloud;
            });
          } else {
            await productsCollection.create(r => {
                r.sku = product.sku;
                r.nombreComercial = product.nombre_comercial;
                r.descripcion = product.descripcion;
                r._principiosActivosJson = JSON.stringify(product.principios_activos || []);
                r.posologia = product.posologia || '';
                r._indicacionesJson = JSON.stringify(product.indicaciones || []);
                r.advertencias = product.advertencias || '';
                r._tagsIaJson = JSON.stringify(product.tags_ia || []);
                r.categoriaPrincipal = product.categoria_principal;
                r.analisisComponentes = product.analisis_componentes;
                r._anotacionesComponentesJson = JSON.stringify(product.anotaciones_componentes || {});
                r._vectoresJson = JSON.stringify(product.vectores || []);
                r.aptoEmbarazo = product.apto_embarazo;
                r.aptoLactancia = product.apto_lactancia;
                r.aptoPediatria = product.apto_pediatria;
                r.aptoDiabeticos = product.apto_diabeticos;
                r.aptoHipertensos = product.apto_hipertensos;
                r.aptoCeliacos = product.apto_celiacos;
                r.sugerenciaComplementaria = product.sugerencia_complementaria;
                r._skusRelacionadosJson = JSON.stringify(product.skus_relacionados || []);
                r.explicacionClinica = product.explicacion_clinica;
                r.synergyAnalyzed = product.synergy_analyzed;
                r.lastSynergyAnalysis = product.last_synergy_analysis;
                r.synergyRetries = product.synergy_retries;
                r.lockedByAi = product.locked_by_ai;
                r.lockUid = product.lock_uid;
                r.lockTimestamp = product.lock_timestamp;
                r.sourceUrl = product.source_url;
                r.lastUpdated = product.last_updated || Date.now();
                r.isVerified = product.is_verified;
                r.verifiedAt = product.verified_at;
                r.verifiedBy = product.verified_by;
                r.isSyncedCloud = product.is_synced_cloud;
                r.lastSyncedCloud = product.last_synced_cloud;
            });
          }
        }
      });

      if (validProducts.length > 0) {
        logger.success(`Importación exitosa: ${validProducts.length} productos cargados localmente`, 'Database');
      }
      if (errorCount > 0) {
        logger.warn(`${errorCount} productos omitidos por errores de validación`, 'Database');
      }

      return { success: validProducts.length, errors: errorCount };
    } catch (e) {
      logger.error('Error al importar productos JSON', 'Database', e);
      return { success: 0, errors: 1 };
    }
  }

  async getProductBySku(sku: string): Promise<Product | null> {
    const existing = await productsCollection.query(Q.where('sku', sku)).fetch();
    return existing.length > 0 ? existing[0].asJSON() : null;
  }

  async updateProduct(sku: string, updates: Partial<Product>): Promise<void> {
    await database.write(async () => {
      const existing = await productsCollection.query(Q.where('sku', sku)).fetch();
      if (existing.length > 0) {
        const record = existing[0];
        await record.update(r => {
          if (updates.nombre_comercial) r.nombreComercial = updates.nombre_comercial;
          if (updates.descripcion) r.descripcion = updates.descripcion;
          if (updates.principios_activos) r._principiosActivosJson = JSON.stringify(updates.principios_activos);
          if (updates.posologia) r.posologia = updates.posologia;
          if (updates.indicaciones) r._indicacionesJson = JSON.stringify(updates.indicaciones);
          if (updates.advertencias) r.advertencias = updates.advertencias;
          if (updates.tags_ia) r._tagsIaJson = JSON.stringify(updates.tags_ia);
          if (updates.categoria_principal) r.categoriaPrincipal = updates.categoria_principal;
          
          if (updates.anotaciones_componentes) r._anotacionesComponentesJson = JSON.stringify(updates.anotaciones_componentes);
          if (updates.vectores) r._vectoresJson = JSON.stringify(updates.vectores);
          
          if (updates.apto_embarazo) r.aptoEmbarazo = updates.apto_embarazo;
          if (updates.apto_lactancia) r.aptoLactancia = updates.apto_lactancia;
          if (updates.apto_pediatria) r.aptoPediatria = updates.apto_pediatria;
          if (updates.apto_diabeticos) r.aptoDiabeticos = updates.apto_diabeticos;
          if (updates.apto_hipertensos) r.aptoHipertensos = updates.apto_hipertensos;
          if (updates.apto_celiacos) r.aptoCeliacos = updates.apto_celiacos;
          
          if (updates.last_updated) r.lastUpdated = updates.last_updated;
          if (updates.is_synced_cloud !== undefined) r.isSyncedCloud = updates.is_synced_cloud;
        });
        
        // Sync with Zustand
        useStore.getState().updateProduct(sku, updates);
        
        EventBus.emit(EventType.PRODUCT_UPDATED, { sku });
      }
    });
  }

  async clearAll(): Promise<void> {
    await database.write(async () => {
      const all = await productsCollection.query().fetch();
      for (const r of all) {
        await r.destroyPermanently();
      }
    });
    EventBus.emit(EventType.DB_UPDATED, { action: 'cleared' });
  }

  async exportProducts(): Promise<string> {
    const products = await this.getAllProducts();
    return JSON.stringify(products, null, 2);
  }


  async syncProductsBatch(products: Product[]): Promise<void> {
    if (!supabaseService.isConfigured() || !navigator.onLine || products.length === 0) return;
    try {
        const supabase = supabaseService.getClient();
        if (!supabase) return;
        const now = Date.now();
        
        const payloads = products.map(product => ({
          ...product,
          last_updated: new Date(now).toISOString()
        }));

        const { error } = await supabase
            .from('products_v2')
            .upsert(payloads);

        if (!error) {
            // Solo actualizar los productos del lote, dentro de database.write()
            const skus = products.map(p => p.sku);
            await database.write(async () => {
              const records = await productsCollection.query(Q.where('sku', Q.oneOf(skus))).fetch();
              for (const r of records) {
                await r.update(doc => {
                  doc.isSyncedCloud = true;
                  doc.lastSyncedCloud = now;
                  doc.lastUpdated = now;
                });
              }
            });
            
            if (products.length === 1) {
              logger.success(`Producto ${products[0].sku} respaldado en la nube`, 'CloudSync');
            } else {
              logger.success(`Lote de ${products.length} productos respaldado en la nube`, 'CloudSync');
            }
        } else {
            throw error;
        }
    } catch (e) {
        const skus = products.map(p => p.sku).join(', ');
        logger.error(`Error al respaldar lote: ${skus}`, 'CloudSync', e);
        throw e;
    }
  }

  async fetchCloudInventory(): Promise<{ sku: string; last_updated?: string }[]> {
    if (!supabaseService.isConfigured()) return [];
    const supabase = supabaseService.getClient();
    if (!supabase) return [];
    const { data, error } = await supabase.from('products_v2').select('sku, last_updated');
    if (error) throw error;
    return (data || []) as { sku: string; last_updated?: string }[];
  }

  async downloadCloudProducts(skus: string[]): Promise<Product[]> {
    if (!supabaseService.isConfigured() || skus.length === 0) return [];
    const supabase = supabaseService.getClient();
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('products_v2')
        .select('sku, data')
        .in('sku', skus);
    
    if (error) throw error;
    
    return (data || []).map((r: any) => ({
      ...r.data,
      sku: r.sku || r.data.sku 
    }));
  }

  async deleteProduct(sku: string): Promise<void> {
    const existing = await productsCollection.query(Q.where('sku', sku)).fetch();
    if (existing.length > 0) {
        await database.write(async () => {
          await existing[0].destroyPermanently();
        });
    }

    if (navigator.onLine && supabaseService.isConfigured()) {
      try {
        const supabase = supabaseService.getClient();
        if (supabase) {
            await supabase.from('products_v2').delete().eq('sku', sku);
        }
      } catch (e) {
        logger.error('[DataService] Sync delete failed', e);
      }
    }

    // Sync with Zustand
    useStore.getState().deleteProduct(sku);
    
    EventBus.emit(EventType.PRODUCT_DELETED, { sku });
  }

  /**
   * Exporta todos los productos locales a JSON
   */
  async exportToJSON(): Promise<string> {
    const products = await this.getAllProducts();
    return JSON.stringify(products, null, 2);
  }

  /**
   * Sube todos los productos locales a Supabase (respaldar en la nube)
   */
  async backupToCloud(): Promise<{ success: boolean; count: number; error?: string }> {
    if (!supabaseService.isConfigured()) {
      return { success: false, count: 0, error: 'Supabase no configurado' };
    }

    try {
      const products = await this.getAllProducts();
      logger.info(`Respaldando ${products.length} productos a la nube...`, 'DataService');

      const batchSize = 100;
      let uploaded = 0;

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        const payloads = batch.map(p => ({
          sku: p.sku,
          data: { ...p, is_synced_cloud: true },
          last_updated: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('products_v2')
          .upsert(payloads, { onConflict: 'sku' });

        if (error) throw error;
        uploaded += batch.length;
      }

      logger.success(`Respaldados ${uploaded} productos a la nube`, 'DataService');
      return { success: true, count: uploaded };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      logger.error(`Error respaldando: ${msg}`, 'DataService', error);
      return { success: false, count: 0, error: msg };
    }
  }
}

export const dataService = DataService.getInstance();
