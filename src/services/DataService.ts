import { Product } from '../core/types/product.types';
import { getDB, waitForDB } from './DatabaseService';
import { EventBus, EventType } from './EventBus';

export class DataService {
  private static failedRequests = 0;
  private static readonly MAX_FAILURES = 5;

  static async getDB() {
    return await waitForDB();
  }

  static async getAllProducts(): Promise<Product[]> {
    const db = await waitForDB();
    if (!db) return [];

    // Try fetching from server first (online)
    try {
      if (navigator.onLine && this.failedRequests < this.MAX_FAILURES) {
        const response = await fetch('/api/products');
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const products = await response.json();
        this.failedRequests = 0; // Reset on success

        // Bulk insert/update into RxDB
        await db.products.bulkUpsert(products);
        EventBus.emit(EventType.DB_UPDATED, { products });
        return products;
      }
    } catch (e) {
      this.failedRequests++;
      console.warn(`[DataService] Backend no disponible o error:`, e);
    }

    // Fallback to local RxDB
    try {
      const allProducts = await db.products.find().exec();
      return allProducts.map((p: any) => p.toJSON());
    } catch (e) {
      console.error('[DataService] Error leyendo base de datos local:', e);
      return [];
    }
  }

  static async saveProduct(product: Product, options: { silent?: boolean } = {}): Promise<void> {
    const db = await waitForDB();
    if (!db) return;
    
    // Always save to local RxDB first
    await db.products.upsert(product);

    // Try sync to server
    if (navigator.onLine && this.failedRequests < this.MAX_FAILURES) {
      try {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product)
        });
        
        if (!response.ok) throw new Error(`Sync failed with status: ${response.status}`);
        
        this.failedRequests = 0;
      } catch (e) {
        this.failedRequests++;
        console.error('[DataService] Sync failed:', e);
      }
    }

    if (!options.silent) {
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
