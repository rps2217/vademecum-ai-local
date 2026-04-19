import { Product } from '../core/types/product.types';
import { TaskQueueService } from './TaskQueueService';
import { ConfigService } from './ConfigService';
import { DataService } from './DataService';
import { EventBus, EventType } from './EventBus';
import { Subscription } from 'rxjs';

/**
 * Sincronización Inteligente: 
 * Implementa Change Detection para ahorrar cuota y CPU.
 */
export const CloudSyncService = {
  sync_active: true,

  init: () => {
    // Ya no usamos suscripción reactiva aquí para evitar bucles.
    // El DataService se encarga de encolar las tareas de sincronización.
    console.log('[CloudSync] Motor de sincronización inteligente listo (modo TaskQueue).');
  },

  handleProductSync: async (product: Product) => {
    if (!CloudSyncService.sync_active) return;
    await TaskQueueService.addTask('cloud_sync', product);
  },

  getCloudCount: async (): Promise<number> => {
    // Implementar si se requiere conteo remoto
    return 0;
  },

  checkCloudData: async () => {
    if (!navigator.onLine) return true;
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) && data.length > 0;
      }
      return false;
    } catch {
      return false;
    }
  },

  updateProductsBatch: async (products: Product[]) => {
    if (products.length === 0) return true;
    
    const config = ConfigService.getConfig();
    if (!config.autoSyncCloud) return true;

    try {
      const db = await DataService.getDB();
      if (!db) return false;

      for (const product of products) {
        if (!navigator.onLine) break;

        const apiUrl = '/api/products';
        let isSynced = false;
        const useDirectMode = localStorage.getItem('force_supabase_direct') === 'true';

        if (useDirectMode) {
             console.log(`[CloudSync] Modo directo activo. Subiendo ${product.sku} a Supabase...`);
             isSynced = await this.directSupabaseUpsert(product);
        } else {
            try {
                console.log(`[CloudSync] POSTing to: ${window.location.origin}${apiUrl} for ${product.sku}`);
                const response = await fetch(apiUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(product)
                });

                if (response.ok) {
                    isSynced = true;
                } else if (response.status === 404) {
                     console.warn(`[CloudSync] API 404. Cambiando a modo directo Supabase de forma permanente...`);
                     localStorage.setItem('force_supabase_direct', 'true');
                     isSynced = await this.directSupabaseUpsert(product);
                } else {
                     console.warn(`[CloudSync] Fallo en servidor para ${product.sku}: ${response.status}`);
                }
            } catch (e) {
                console.warn(`[CloudSync] Error CORS o Red. Intentando proxy directo a Supabase...`);
                isSynced = await this.directSupabaseUpsert(product);
            }
        }

        if (isSynced) {
          // Marcar como sincronizado localmente tras éxito
          await db.products.upsert({
            ...product,
            synced: true,
            last_synced: Date.now()
          });
          EventBus.emit(EventType.PRODUCT_UPDATED, { sku: product.sku, synced: true });
          console.log(`[CloudSync] Sincronizado correctamente: ${product.sku}`);
        } else {
            console.warn(`[CloudSync] Falló sincronización de ${product.sku} en todos los canales.`);
            return false;
        }
      }
      return true;
    } catch (error: any) {
      console.error('[CloudSync] Error general en guardado por lotes:', error);
      return false;
    }
  },

  // Fallback para subir datos directamente si el backend Node Express no responde (ej: hosting estático Vercel)
  directSupabaseUpsert: async (product: Product): Promise<boolean> => {
      try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          // Atención: Las políticas (RLS) deben permitir el insert/update al usuario o anon, 
          // caso contrario, esto será rechazado si Supabase es estricto con RLS. 
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY; 
          
          if (!supabaseUrl || !supabaseKey) return false;
          
          const payload = {
              sku: product.sku,
              nombre_comercial: product.nombre_comercial,
              data: product,
              last_updated: new Date().toISOString()
          };

          const response = await fetch(`${supabaseUrl}/rest/v1/products?on_conflict=sku`, {
              method: 'POST',
              headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'resolution=merge-duplicates'
              },
              body: JSON.stringify(payload) // Supabase Rest Upsert 
          });

          return response.ok;
      } catch (e) {
          return false;
      }
  },

  /**
   * Stub para compatibilidad con lógica de bloqueo distribuido.
   * En la arquitectura centralizada en el servidor, los conflictos se resuelven en el backend.
   */
  claimProductLock: async (_sku: string, _userId: string): Promise<boolean> => {
    return true; 
  },

  releaseProductLockAndSave: async (product: Product) => {
    await DataService.saveProduct(product);
  },

  uploadLocalProducts: async () => {
    const products = await DataService.getAllProducts();
    await CloudSyncService.updateProductsBatch(products);
    return products.length;
  }
};
