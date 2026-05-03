import { Product, SafetyStatus } from '../core/types/product.types';
import { EventBus, EventType } from './EventBus';
import { taskQueueService } from './TaskQueueService';
import { logger } from './LoggerService';
import { database, productsCollection } from '../database';
import { Q } from '@nozbe/watermelondb';
import ProductModel from '../database/Product';
import { applyProductToRecord } from '../database/productMapper';
import { supabaseService } from './SupabaseService';
export class DataService {
  private static instance: DataService;

  private constructor() {}

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }



  getSupabaseInfo() {
    // Credentials come exclusively from environment variables (set in .env, exposed by Vite).
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string || '';
    if (!supabaseUrl || !supabaseKey) {
      console.warn('[DataService] VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no configuradas.');
    }
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
        
        if (existing.length > 0) {
          await existing[0].update(r => applyProductToRecord(r, product));
        } else {
          await productsCollection.create(r => applyProductToRecord(r, product, { includeSku: true }));
        }
      });

      if (!options.silent) {
        await taskQueueService.addTask('cloud_sync', { sku: product.sku });
        
        if (!product.anotaciones_componentes || Object.keys(product.anotaciones_componentes).length === 0) {
          if (product.principios_activos && product.principios_activos.length > 0) {
            await taskQueueService.addTask('ingredient_analysis', { sku: product.sku });
          }
        }
        
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
        } catch (e) {
          errorCount++;
        }
      }
      
      await database.write(async () => {
        // Bulk upsert logic for WatermelonDB
        for (const product of validProducts) {
          const existing = await productsCollection.query(Q.where('sku', product.sku)).fetch();
          if (existing.length > 0) {
            await existing[0].update(r => applyProductToRecord(r, product));
          } else {
            await productsCollection.create(r => applyProductToRecord(r, product, { includeSku: true }));
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
        const currentData = record.asJSON();
        await record.update(r => applyProductToRecord(r, { ...currentData, ...updates }));
        
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
  }

  async exportProducts(): Promise<string> {
    const products = await this.getAllProducts();
    return JSON.stringify(products, null, 2);
  }


  async syncProductsBatch(products: Product[]): Promise<void> {
    if (!navigator.onLine || products.length === 0) return;
    try {
        const response = await fetch('/api/products/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Fallo en la sincronización del lote');
        }

        const now = Date.now();
        await database.write(async () => {
          for (const product of products) {
            const existing = await productsCollection.query(Q.where('sku', product.sku)).fetch();
            if (existing.length > 0) {
              await existing[0].update(r => applyProductToRecord(r, {
                ...r.asJSON(),
                is_synced_cloud: true,
                last_synced_cloud: now,
                last_updated: now
              }));
            }
          }
        });
        
        if (products.length === 1) {
          logger.success(`Producto ${products[0].sku} respaldado en la nube`, 'CloudSync');
        } else {
          logger.success(`Lote de ${products.length} productos respaldado en la nube`, 'CloudSync');
        }
    } catch (e: any) {
        const skus = products.map(p => p.sku).join(', ');
        logger.error(`Error al respaldar lote: ${skus}`, 'CloudSync', e.message);
        console.error('[DataService] Batch Sync failed', e);
        throw e;
    }
  }

  async fetchCloudInventory(): Promise<{ sku: string }[]> {
    const response = await fetch('/api/products/inventory');
    if (!response.ok) throw new Error('Failed to fetch cloud inventory');
    return await response.json();
  }

  async downloadCloudProducts(skus: string[]): Promise<Product[]> {
    if (skus.length === 0) return [];
    const response = await fetch('/api/products/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skus })
    });
    
    if (!response.ok) throw new Error('Failed to download products');
    return await response.json();
  }

  async deleteProduct(sku: string): Promise<void> {
    const existing = await productsCollection.query(Q.where('sku', sku)).fetch();
    if (existing.length > 0) {
        await database.write(async () => {
          await existing[0].destroyPermanently();
        });
    }

    if (navigator.onLine) {
      try {
        await fetch(`/api/products/${sku}`, { method: 'DELETE' });
      } catch (e) {
        console.error('[DataService] Sync delete failed', e);
      }
    }
  }
}

export const dataService = DataService.getInstance();
