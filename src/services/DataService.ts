import { Product } from '../core/types/product.types';
import { SQLiteService } from '../core/database/sqliteService';

export class DataService {
  private static initialized = false;
  private static failedRequests = 0;
  private static readonly MAX_FAILURES = 5;

  static async ensureInitialized() {
    if (!this.initialized) {
      await SQLiteService.initialize();
      this.initialized = true;
    }
  }

  static async getAllProducts(): Promise<Product[]> {
    await this.ensureInitialized();
    const db = SQLiteService.getDB();
    
    // Try fetching from server first (online)
    try {
      if (navigator.onLine && this.failedRequests < this.MAX_FAILURES) {
        // Only log first encounter or when debugging origin
        if (this.failedRequests === 0) {
          console.log(`[DataService] Probando conectividad con el backend...`);
        }
        
        const response = await fetch('/api/products');
        
        if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        this.failedRequests = 0; // Reset on success

        // Update local SQLite
        db.run('DELETE FROM products');
        const stmt = db.prepare('INSERT INTO products (sku, nombre_comercial, data) VALUES (?, ?, ?)');
        for (const p of products) {
          stmt.run([p.sku, p.nombre_comercial, JSON.stringify(p)]);
        }
        stmt.free();
        await SQLiteService.save();
        return products;
      }
    } catch (e) {
      this.failedRequests++;
      if (this.failedRequests === 1) {
        console.warn(`[DataService] Backend no disponible. Operando en modo offline local.`);
      }
    }

    // Fallback to local
    try {
      const res = db.prepare('SELECT data FROM products').all();
      return res
        .map(p => {
          try {
            return p.data ? JSON.parse(p.data as string) : null;
          } catch (e) { return null; }
        })
        .filter((p): p is Product => p !== null && !!p.sku);
    } catch (e) {
      console.error('[DataService] Error leyendo base de datos local:', e);
      return [];
    }
  }

  static async saveProduct(product: Product): Promise<void> {
    await this.ensureInitialized();
    const db = SQLiteService.getDB();
    
    // Always save to local first
    db.prepare('INSERT OR REPLACE INTO products (sku, nombre_comercial, data) VALUES (?, ?, ?)')
      .run(product.sku, product.nombre_comercial, JSON.stringify(product));
    await SQLiteService.save();

    // Try sync to server
    if (navigator.onLine && this.failedRequests < this.MAX_FAILURES) {
      try {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product)
        });
        
        if (!response.ok) {
          if (response.status === 404) this.failedRequests = this.MAX_FAILURES; // Cortar inmediatamente si no existe endpoint
          throw new Error(`Sync failed with status: ${response.status}`);
        }
        
        this.failedRequests = 0;
      } catch (e) {
        this.failedRequests++;
        console.error('[DataService] Sync failed:', e);
      }
    }
    window.dispatchEvent(new CustomEvent('db_updated'));
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
    await this.ensureInitialized();
    const db = SQLiteService.getDB();
    const res = db.prepare('SELECT data FROM products WHERE sku = ?').get([sku]);
    return res ? JSON.parse(res.data as string) : null;
  }

  static async clearAll(): Promise<void> {
    await this.ensureInitialized();
    const db = SQLiteService.getDB();
    db.run('DELETE FROM products');
    await SQLiteService.save();
    window.dispatchEvent(new CustomEvent('db_updated'));
  }

  static async exportProducts(): Promise<string> {
    const products = await this.getAllProducts();
    return JSON.stringify(products, null, 2);
  }

  static async deleteProduct(sku: string): Promise<void> {
    await this.ensureInitialized();
    const db = SQLiteService.getDB();
    db.run('DELETE FROM products WHERE sku = ?', [sku]);
    await SQLiteService.save();

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
    window.dispatchEvent(new CustomEvent('db_updated'));
  }
}
