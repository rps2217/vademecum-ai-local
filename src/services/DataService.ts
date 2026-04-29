import { Product } from '../core/types/product.types';
import { EventBus, EventType } from './EventBus';
import { TaskQueueService } from './TaskQueueService';

const STORAGE_KEY = 'products';

export class DataService {
  private static failedRequests = 0;
  private static readonly MAX_FAILURES = 5;

  // Dummy method to maintain API compatibility
  static async getDB() {
    return null;
  }

  static async getAllProducts(): Promise<Product[]> {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private static async saveToLocalStorage(products: Product[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }

  // Fallback directo a Supabase cuando el backend Node no existe (ej. Vercel estático)
  private static async directSupabaseFetch(): Promise<any[] | null> {
      try {
          const fallbackUrl = 'https://pspxqzwxulgmzarlqwtt.supabase.co';
          const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcHhxend4dWxnbXphcmxxd3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NzQ1ODQsImV4cCI6MjA5MjE1MDU4NH0.hX0V1F5S6T0I5G1qA1e9D9v1o9Y-H6p9j2V_YI3C1P0'; 
          const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || (window as any)._env_?.VITE_SUPABASE_URL || fallbackUrl;
          const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (window as any)._env_?.VITE_SUPABASE_ANON_KEY || fallbackKey;
          if (!supabaseUrl || !supabaseKey) return null;
          
          const response = await fetch(`${supabaseUrl}/rest/v1/products?select=data`, {
              headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`
              }
          });
          
          if (response.ok) {
              const rows = await response.json();
              return rows.map((r: any) => r.data).filter(Boolean);
          }
          return null;
      } catch (e) {
          return null;
      }
  }

  static async saveProduct(product: Product, options: { silent?: boolean } = {}): Promise<void> {
    const products = await this.getAllProducts();
    const index = products.findIndex(p => p.sku === product.sku);
    
    if (index !== -1) {
      if (JSON.stringify(products[index]) === JSON.stringify(product)) return;
      products[index] = product;
    } else {
      products.push(product);
    }
    await this.saveToLocalStorage(products);

    if (!options.silent) {
       await TaskQueueService.addTask('cloud_sync', product);
       EventBus.emit(EventType.PRODUCT_UPDATED, { sku: product.sku });
    }
  }
  
  static async importProducts(jsonString: string): Promise<{ success: number; errors: number }> {
    try {
      const data = JSON.parse(jsonString);
      const newProducts: Product[] = Array.isArray(data) ? data : [data];
      const products = await this.getAllProducts();
      
      let success = 0;
      let errors = 0;

      for (const p of newProducts) {
        if (!p.nombre_comercial || !p.sku) {
          errors++;
          continue;
        }

        const sanitizedData: any = { ...p };
        // Sanitize (legacy)
        Object.keys(sanitizedData).forEach(key => {
            if (key.startsWith('_')) {
                delete sanitizedData[key];
            }
        });

        await this.saveProduct(sanitizedData as Product);
        success++;
      }
      return { success, errors };
    } catch (e) {
      console.error('[DataService] Error:', e);
      throw new Error('El archivo JSON no es válido.');
    }
  }

  static async getProductBySku(sku: string): Promise<Product | null> {
    const products = await this.getAllProducts();
    return products.find(p => p.sku === sku) || null;
  }

  static async clearAll(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    EventBus.emit(EventType.DB_UPDATED, { action: 'cleared' });
  }

  static async exportProducts(): Promise<string> {
    const products = await this.getAllProducts();
    return JSON.stringify(products, null, 2);
  }

  static async deleteProduct(sku: string): Promise<void> {
    const products = await this.getAllProducts();
    const filtered = products.filter(p => p.sku !== sku);
    await this.saveToLocalStorage(filtered);

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
