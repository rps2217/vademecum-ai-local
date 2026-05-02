import { openDB, IDBPDatabase } from 'idb';
import { Product } from '../core/types/product.types';
import { EventBus, EventType } from './EventBus';
import { taskQueueService } from './TaskQueueService';
import { logger } from './LoggerService';

const DB_NAME = 'VademecumDB';
const DB_VERSION = 1;
const STORE_NAME = 'products';

export class DataService {
  private static instance: DataService;
  private dbPromise: Promise<IDBPDatabase<any>> | null = null;

  private constructor() {}

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  private getDB(): Promise<IDBPDatabase<any>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'sku' });
          }
        },
      });
    }
    return this.dbPromise;
  }

  getSupabaseInfo() {
    const fallbackUrl = 'https://pspxqzwxulgmzarlqwtt.supabase.co';
    const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcHhxend4dWxnbXphcmxxd3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NzQ1ODQsImV4cCI6MjA5MjE1MDU4NH0.hX0V1F5S6T0I5G1qA1e9D9v1o9Y-H6p9j2V_YI3C1P0'; 
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || (window as any)._env_?.VITE_SUPABASE_URL || fallbackUrl;
    const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (window as any)._env_?.VITE_SUPABASE_ANON_KEY || fallbackKey;
    return { supabaseUrl, supabaseKey };
  }

  async getAllProducts(): Promise<Product[]> {
    const db = await this.getDB();
    return db.getAll(STORE_NAME);
  }

  private validateProduct(product: Product) {
    if (!product.sku) throw new Error('Product must have a SKU');
    if (!product.nombre_comercial) throw new Error('Product must have a common name');
    return true;
  }

  async saveProduct(product: Product, options: { silent?: boolean } = {}): Promise<void> {
    try {
      this.validateProduct(product);
      const db = await this.getDB();
      await db.put(STORE_NAME, product);

      if (!options.silent) {
        await taskQueueService.addTask('cloud_sync', product);
        
        // Auto-enqueue ingredient analysis if missing
        if (!product.anotaciones_componentes || Object.keys(product.anotaciones_componentes).length === 0) {
          if (product.principios_activos && product.principios_activos.length > 0) {
            await taskQueueService.addTask('ingredient_analysis', { sku: product.sku });
          }
        }

        EventBus.emit(EventType.PRODUCT_UPDATED, { sku: product.sku });
      }
    } catch (error) {
      logger.error('Fallo al guardar producto en IndexedDB', 'Database', error);
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
      
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      await Promise.all(validProducts.map(p => tx.store.put(p)));
      await tx.done;

      if (validProducts.length > 0) {
        logger.success(`Importación exitosa: ${validProducts.length} productos cargados localmente`, 'Database');
      }
      if (errorCount > 0) {
        logger.warn(`${errorCount} productos omitidos por errores de validación`, 'Database');
      }

      return { success: validProducts.length, errors: errorCount };
    } catch (e) {
      logger.error('Error al importar productos JSON', 'Database', e);
      console.error('[DataService] Import failed', e);
      return { success: 0, errors: 1 };
    }
  }

  async getProductBySku(sku: string): Promise<Product | null> {
    const db = await this.getDB();
    return await db.get(STORE_NAME, sku) as Product || null;
  }

  async updateProduct(sku: string, updates: Partial<Product>): Promise<void> {
    const product = await this.getProductBySku(sku);
    if (product) {
      await this.saveProduct({ ...product, ...updates });
    }
  }

  async clearAll(): Promise<void> {
    const db = await this.getDB();
    await db.clear(STORE_NAME);
    EventBus.emit(EventType.DB_UPDATED, { action: 'cleared' });
  }

  async exportProducts(): Promise<string> {
    const products = await this.getAllProducts();
    return JSON.stringify(products, null, 2);
  }

  async syncToSupabase(product: Product): Promise<void> {
    return this.syncProductsBatch([product]);
  }

  async syncProductsBatch(products: Product[]): Promise<void> {
    if (!navigator.onLine || products.length === 0) return;
    try {
        const { supabaseUrl, supabaseKey } = this.getSupabaseInfo();
        const now = new Date().toISOString();
        
        const payloads = products.map(product => ({
          sku: product.sku,
          data: {
            ...product,
            synced: true,
            last_synced: Date.now(),
            updated_at_cloud: now
          }
        }));

        const response = await fetch(`${supabaseUrl}/rest/v1/products`, {
            method: 'POST',
            headers: { 
                'apikey': supabaseKey, 
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(payloads)
        });

        if (response.ok) {
            const db = await this.getDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            for (const product of products) {
              await tx.store.put({ ...product, synced: true, last_synced: Date.now() });
            }
            await tx.done;
            
            if (products.length === 1) {
              logger.success(`Producto ${products[0].sku} respaldado en la nube`, 'CloudSync');
            } else {
              logger.success(`Lote de ${products.length} productos respaldado en la nube`, 'CloudSync');
            }
        } else {
            throw new Error(`Status ${response.status}`);
        }
    } catch (e) {
        const skus = products.map(p => p.sku).join(', ');
        logger.error(`Error al respaldar lote: ${skus}`, 'CloudSync', e);
        console.error('[DataService] Batch Sync failed', e);
        throw e;
    }
  }

  async fetchCloudInventory(): Promise<{ sku: string }[]> {
    const { supabaseUrl, supabaseKey } = this.getSupabaseInfo();
    const response = await fetch(`${supabaseUrl}/rest/v1/products?select=sku`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    if (!response.ok) throw new Error('Failed to fetch cloud inventory');
    return response.json();
  }

  async downloadCloudProducts(skus: string[]): Promise<Product[]> {
    if (skus.length === 0) return [];
    
    const { supabaseUrl, supabaseKey } = this.getSupabaseInfo();
    const skuList = skus.join(',');
    const response = await fetch(`${supabaseUrl}/rest/v1/products?sku=in.(${skuList})&select=sku,data`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    if (!response.ok) throw new Error('Failed to download cloud products');
    const result = await response.json();
    
    return result.map((r: any) => ({
      ...r.data,
      sku: r.sku || r.data.sku 
    }));
  }

  async deleteProduct(sku: string): Promise<void> {
    const db = await this.getDB();
    await db.delete(STORE_NAME, sku);

    if (navigator.onLine) {
      try {
        const { supabaseUrl, supabaseKey } = this.getSupabaseInfo();
        await fetch(`${supabaseUrl}/rest/v1/products?sku=eq.${sku}`, {
            method: 'DELETE',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
      } catch (e) {
        console.error('[DataService] Sync delete failed', e);
      }
    }
    EventBus.emit(EventType.PRODUCT_DELETED, { sku });
  }
}

export const dataService = DataService.getInstance();
