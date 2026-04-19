import { Product } from '../core/types/product.types';
import { getDB, waitForDB } from './DatabaseService';
import { EventBus, EventType } from './EventBus';
import { TaskQueueService } from './TaskQueueService';

export class DataService {
  private static failedRequests = 0;
  private static readonly MAX_FAILURES = 5;

  static async getDB() {
    return await waitForDB();
  }

  static async getAllProducts(): Promise<Product[]> {
    const db = await waitForDB();
    if (!db) return [];

    // Priorizar local para velocidad del UI
    const allLocalDocs = await db.products.find().exec();
    const localProducts = allLocalDocs.map((p: any) => p.toJSON());

    // Try fetching from server ONLY IF ONLINE and we haven't failed too much
    // Y no lo hacemos tan seguido para ahorrar batería y cuota (Throttling)
    const lastFetch = Number(localStorage.getItem('last_cloud_fetch') || 0);
    const now = Date.now();

    if (navigator.onLine && (now - lastFetch > 60000) && this.failedRequests < this.MAX_FAILURES) {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const cloudProducts = await response.json();
          this.failedRequests = 0;
          localStorage.setItem('last_cloud_fetch', now.toString());

          // Solo hacer upsert si hay cambios (Evita triggers innecesarios)
          if (JSON.stringify(cloudProducts) !== JSON.stringify(localProducts)) {
            await db.products.bulkUpsert(cloudProducts);
            EventBus.emit(EventType.DB_UPDATED, { products: cloudProducts });
            return cloudProducts;
          }
        }
      } catch (e) {
        this.failedRequests++;
      }
    }

    return localProducts;
  }

  static async saveProduct(product: Product, options: { silent?: boolean } = {}): Promise<void> {
    const db = await waitForDB();
    if (!db) return;
    
    // 1. Change Detection: No guardar si es idéntico al local (Ahorra CPU/DB)
    const existing = await this.getProductBySku(product.sku);
    if (existing && JSON.stringify(existing) === JSON.stringify(product)) {
      return;
    }

    const localProduct: Product = {
      ...product,
      synced: product.synced ?? false,
      last_synced: product.last_synced ?? Date.now()
    };

    // 2. Guardado Local Inmediato
    await db.products.upsert(localProduct);

    // 3. Sincronización Inteligente: Encolar tarea en lugar de fetch inmediato
    // Esto garantiza que el UI no se bloquee y que el Thermal Guard controle la carga
    if (!options.silent) {
       await TaskQueueService.addTask('cloud_sync', localProduct);
       EventBus.emit(EventType.PRODUCT_UPDATED, { sku: product.sku });
    }
  }
  
  static async importProducts(jsonString: string): Promise<{ success: number; errors: number }> {
    try {
      const data = JSON.parse(jsonString);
      const products: Product[] = Array.isArray(data) ? data : [data];
      
      let success = 0;
      let errors = 0;

      for (const p of products) {
        if (!p.nombre_comercial || !p.sku) {
          errors++;
          continue;
        }
        await this.saveProduct(p);
        success++;
      }
      return { success, errors };
    } catch (e) {
      console.error('[DataService] Error:', e);
      throw new Error('El archivo JSON no es válido.');
    }
  }

  static async getProductBySku(sku: string): Promise<Product | null> {
    const db = await waitForDB();
    if (!db) return null;
    const doc = await db.products.findOne({ selector: { sku } }).exec();
    return doc ? doc.toJSON() : null;
  }

  static async clearAll(): Promise<void> {
    const db = await waitForDB();
    if (!db) return;
    await db.products.remove();
    EventBus.emit(EventType.DB_UPDATED, { action: 'cleared' });
  }

  static async exportProducts(): Promise<string> {
    const products = await this.getAllProducts();
    return JSON.stringify(products, null, 2);
  }

  static async deleteProduct(sku: string): Promise<void> {
    const db = await waitForDB();
    if (!db) return;

    // Delete local
    const doc = await db.products.findOne({ selector: { sku } }).exec();
    if (doc) await doc.remove();

    // Sync to server
    if (navigator.onLine && this.failedRequests < this.MAX_FAILURES) {
      try {
        const response = await fetch(`/api/products/${sku}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Delete sync failed');
        this.failedRequests = 0;
      } catch (e) {
        this.failedRequests++;
        console.error('[DataService] Sync delete failed', e);
      }
    }
    EventBus.emit(EventType.PRODUCT_DELETED, { sku });
  }
}
