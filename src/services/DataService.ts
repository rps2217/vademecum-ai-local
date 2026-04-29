import { Product } from '../core/types/product.types';
import { EventBus, EventType } from './EventBus';
import { TaskQueueService } from './TaskQueueService';
import { LocalDBService } from './LocalDBService';

export class DataService {
  static getSupabaseInfo() {
    const fallbackUrl = 'https://pspxqzwxulgmzarlqwtt.supabase.co';
    const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcHhxend4dWxnbXphcmxxd3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NzQ1ODQsImV4cCI6MjA5MjE1MDU4NH0.hX0V1F5S6T0I5G1qA1e9D9v1o9Y-H6p9j2V_YI3C1P0'; 
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || (window as any)._env_?.VITE_SUPABASE_URL || fallbackUrl;
    const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (window as any)._env_?.VITE_SUPABASE_ANON_KEY || fallbackKey;
    return { supabaseUrl, supabaseKey };
  }

  static async getDB() {
    return null;
  }

  static async getAllProducts(): Promise<Product[]> {
    return LocalDBService.getAllProducts();
  }

  static async saveProduct(product: Product, options: { silent?: boolean } = {}): Promise<void> {
    await LocalDBService.saveProduct(product);

    if (!options.silent) {
       await TaskQueueService.addTask('cloud_sync', product);
       EventBus.emit(EventType.PRODUCT_UPDATED, { sku: product.sku });
    }
  }

  static async importProducts(jsonString: string): Promise<{ success: number; errors: number }> {
    try {
      const data = JSON.parse(jsonString);
      const newProducts: Product[] = Array.isArray(data) ? data : [data];
      
      await LocalDBService.bulkSaveProducts(newProducts);

      return { success: newProducts.length, errors: 0 };
    } catch (e) {
      console.error('[DataService] Import failed', e);
      return { success: 0, errors: 1 };
    }
  }

  static async getProductBySku(sku: string): Promise<Product | null> {
    return LocalDBService.getProductBySku(sku);
  }

  static async clearAll(): Promise<void> {
    await LocalDBService.clearAll();
    EventBus.emit(EventType.DB_UPDATED, { action: 'cleared' });
  }

  static async exportProducts(): Promise<string> {
    const products = await this.getAllProducts();
    return JSON.stringify(products, null, 2);
  }

  static async syncToSupabase(product: Product): Promise<void> {
    if (!navigator.onLine) return;
    try {
        const { supabaseUrl, supabaseKey } = this.getSupabaseInfo();
        await fetch(`${supabaseUrl}/rest/v1/products`, {
            method: 'POST',
            headers: { 
                'apikey': supabaseKey, 
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({ sku: product.sku, data: product })
        });
    } catch (e) {
        console.error('[DataService] Sync failed', e);
        throw e;
    }
  }

  static async deleteProduct(sku: string): Promise<void> {
    await LocalDBService.deleteProduct(sku);

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
