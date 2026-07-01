import { Product, SafetyStatus } from '../core/types/product.types';
import { EventBus, EventType } from './EventBus';
import { taskQueueService } from './TaskQueueService';
import { logger } from './LoggerService';
import { database, productsCollection } from '../database';
import { Q } from '@nozbe/watermelondb';
import ProductModel from '../database/Product';
import { supabaseService } from './SupabaseService';
import { useStore } from '../store/useStore';

// Helper para mapear campos de Product a ProductModel
interface ProductFields {
  nombreComercial?: string;
  descripcion?: string;
  _principiosActivosJson?: string;
  posologia?: string;
  _indicacionesJson?: string;
  advertencias?: string;
  _tagsIaJson?: string;
  categoriaPrincipal?: string;
  analisisComponentes?: string;
  _anotacionesComponentesJson?: string;
  _vectoresJson?: string;
  aptoEmbarazo?: string;
  aptoLactancia?: string;
  aptoPediatria?: string;
  aptoDiabeticos?: string;
  aptoHipertensos?: string;
  aptoCeliacos?: string;
  sugerenciaComplementaria?: string;
  _skusRelacionadosJson?: string;
  explicacionClinica?: string;
  synergyAnalyzed?: boolean;
  lastSynergyAnalysis?: number;
  synergyRetries?: number;
  lockedByAi?: boolean;
  lockUid?: string;
  lockTimestamp?: number;
  sourceUrl?: string;
  lastUpdated?: number;
  isVerified?: boolean;
  verifiedAt?: number;
  verifiedBy?: string;
  isSyncedCloud?: boolean;
  lastSyncedCloud?: number;
}

const mapProductToRecord = (product: Product): ProductFields => {
  return {
    nombreComercial: product.nombre_comercial,
    descripcion: product.descripcion,
    _principiosActivosJson: JSON.stringify(product.principios_activos || []),
    posologia: product.posologia || '',
    _indicacionesJson: JSON.stringify(product.indicaciones || []),
    advertencias: product.advertencias || '',
    _tagsIaJson: JSON.stringify(product.tags_ia || []),
    categoriaPrincipal: product.categoria_principal,
    analisisComponentes: product.analisis_componentes,
    _anotacionesComponentesJson: JSON.stringify(product.anotaciones_componentes || {}),
    _vectoresJson: JSON.stringify(product.vectores || []),
    aptoEmbarazo: product.apto_embarazo,
    aptoLactancia: product.apto_lactancia,
    aptoPediatria: product.apto_pediatria,
    aptoDiabeticos: product.apto_diabeticos,
    aptoHipertensos: product.apto_hipertensos,
    aptoCeliacos: product.apto_celiacos,
    sugerenciaComplementaria: product.sugerencia_complementaria,
    _skusRelacionadosJson: JSON.stringify(product.skus_relacionados || []),
    explicacionClinica: product.explicacion_clinica,
    synergyAnalyzed: product.synergy_analyzed,
    lastSynergyAnalysis: product.last_synergy_analysis,
    synergyRetries: product.synergy_retries,
    lockedByAi: product.locked_by_ai,
    lockUid: product.lock_uid,
    lockTimestamp: product.lock_timestamp,
    sourceUrl: product.source_url,
    lastUpdated: product.last_updated || Date.now(),
    isVerified: product.is_verified,
    verifiedAt: product.verified_at,
    verifiedBy: product.verified_by,
    isSyncedCloud: product.is_synced_cloud,
    lastSyncedCloud: product.last_synced_cloud,
  };
};

export class DataService {
  private static instance: DataService;

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

  private validateProduct(product: Product) {
    if (!product.sku) throw new Error('Product must have a SKU');
    if (!product.nombre_comercial) throw new Error('Product must have a common name');
    return true;
  }

  async saveProduct(product: Product, options: { silent?: boolean } = {}): Promise<void> {
    try {
      this.validateProduct(product);
      
      await database.write(async () => {
        const existing = await productsCollection.query(Q.where('sku', product.sku)).fetch();
        const fields = mapProductToRecord(product);
        
        if (existing.length > 0) {
          const record = existing[0];
          await record.update(r => {
            r.sku = product.sku;
            Object.assign(r, fields);
          });
        } else {
          await productsCollection.create(r => {
            r.sku = product.sku;
            Object.assign(r, fields);
          });
        }
      });

      if (!options.silent) {
        await taskQueueService.addTask('cloud_sync', { sku: product.sku });
        
        if (!product.anotaciones_componentes || Object.keys(product.anotaciones_componentes).length === 0) {
          if (product.principios_activos && product.principios_activos.length > 0) {
            await taskQueueService.addTask('ingredient_analysis', { sku: product.sku });
          }
        }

        // Sync with Zustand
        useStore.getState().addProduct(product);
        
        EventBus.emit(EventType.PRODUCT_UPDATED, { sku: product.sku });
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
        } catch {
          errorCount++;
        }
      }
      
      await database.write(async () => {
        for (const product of validProducts) {
          const existing = await productsCollection.query(Q.where('sku', product.sku)).fetch();
          const fields = mapProductToRecord(product);
          if (existing.length > 0) {
            await existing[0].update(r => {
              Object.assign(r, fields);
            });
          } else {
            await productsCollection.create(r => {
              r.sku = product.sku;
              Object.assign(r, fields);
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
          sku: product.sku,
          data: {
            ...product,
            is_synced_cloud: true,
            last_synced_cloud: new Date(now).toISOString(),
            last_updated: new Date(now).toISOString()
          },
          last_updated: new Date(now).toISOString()
        }));

        const { error } = await supabase
            .from('products')
            .upsert(payloads);

        if (!error) {
            const records = await productsCollection.query().fetch();
            for (const r of records) {
              await r.update(doc => {
                doc.isSyncedCloud = true;
                doc.lastSyncedCloud = now;
                doc.lastUpdated = now;
              });
            }
            
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
        console.error('[DataService] Batch Sync failed', e);
        throw e;
    }
  }

  async fetchCloudInventory(): Promise<{ sku: string; last_updated?: string }[]> {
    if (!supabaseService.isConfigured()) return [];
    const supabase = supabaseService.getClient();
    if (!supabase) return [];
    const { data, error } = await supabase.from('products').select('sku, last_updated');
    if (error) throw error;
    return (data || []) as { sku: string; last_updated?: string }[];
  }

  async downloadCloudProducts(skus: string[]): Promise<Product[]> {
    if (!supabaseService.isConfigured() || skus.length === 0) return [];
    const supabase = supabaseService.getClient();
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('products')
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
            await supabase.from('products').delete().eq('sku', sku);
        }
      } catch (e) {
        console.error('[DataService] Sync delete failed', e);
      }
    }

    // Sync with Zustand
    useStore.getState().deleteProduct(sku);
    
    EventBus.emit(EventType.PRODUCT_DELETED, { sku });
  }
}

export const dataService = DataService.getInstance();
