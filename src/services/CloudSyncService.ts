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
    
    if (localStorage.getItem('force_supabase_direct') === 'true') {
        return true; // Asumimos que hay datos si pasamos directo a Supabase
    }
    
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

    console.log(`[CloudSync] Procesando lote de ${products.length} productos.`);

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
             isSynced = await CloudSyncService.directSupabaseUpsert(product);
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
                } else {
                     const errorText = await response.text();
                     console.error(`[CloudSync] Fallo en servidor para ${product.sku}: ${response.status} - ${errorText}`);
                     if (response.status === 404) {
                         localStorage.setItem('force_supabase_direct', 'true');
                         isSynced = await CloudSyncService.directSupabaseUpsert(product);
                     }
                }
            } catch (e) {
                console.warn(`[CloudSync] Error CORS o Red al intentar proxy a ${apiUrl}:`, e);
                isSynced = await CloudSyncService.directSupabaseUpsert(product);
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
            console.error(`[CloudSync] Falló sincronización crítica de ${product.sku} en todos los canales.`);
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
          // Buscamos las variables de entorno sin depender estrictamente del prefijo VITE_
          // si estamos en un enviroment configurado vía secretos de plataforma
          const getEnv = (key: string) => import.meta.env[key] || process.env[key] || ((window as any)._env_ && (window as any)._env_[key]);
          
          const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
          const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');
          
          if (!supabaseUrl || !supabaseKey) {
            console.error(`[CloudSync] Credenciales de Supabase faltantes. URL detectada: ${!!supabaseUrl}, KEY detectada: ${!!supabaseKey}`);
            return false;
          }
          
          const payload = {
              sku: product.sku,
              nombre_comercial: product.nombre_comercial,
              ...product,
              last_updated: new Date().toISOString()
          };

          console.log(`[CloudSync] Intentando fetch a ${supabaseUrl}/rest/v1/products`);

          const response = await fetch(`${supabaseUrl}/rest/v1/products?on_conflict=sku`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[CloudSync] Supabase Upsert Fallido para ${product.sku}: ${response.status} - ${errorText}`);
        } else {
            console.log(`[CloudSync] Supabase Upsert Éxito para ${product.sku}`);
        }

        return response.ok;
    } catch (e) {
        console.error(`[CloudSync] Error catastrófico conectando a Supabase para ${product.sku}:`, e);
        return false;
    }
  },

  /**
   * Bloqueo Distribuido (Clúster) para Tareas IA.
   * Evita que 3 PCs en la misma oficina analicen el mismo medicamento en segundo plano simultáneamente.
   */
  claimProductLock: async (sku: string, _userId: string): Promise<boolean> => {
    try {
      const db = await DataService.getDB();
      if (!db) return false;

      // 1. Verificación Local Inmediata
      const localData = await db.products.findOne(sku).exec();
      if (!localData) return false;

      const now = Date.now();
      const lockTimeout = 15 * 60 * 1000; // 15 minutos de timeout para una tarea

      if (localData.locked_by_ai && localData.lock_timestamp) {
        if (now - localData.lock_timestamp < lockTimeout) {
          return false; // Alguien más del clúster (o esta máquina) lo está procesando.
        }
      }

      // 2. Aplicar "Bloqueo" en Base de datos local para que sincronice a la Nube.
      // Al guardar, CloudSyncService lo subirá a Supabase alertándole al resto de PCs de la oficina
      await localData.incrementalPatch({
        locked_by_ai: true,
        lock_timestamp: now
      });

      return true; // Tenemos el bloqueo exitoso, podemos procesar.
    } catch (e) {
      console.warn('[ClusterStatus] Fallo al reclamar bloqueo.', e);
      return false;
    }
  },

  releaseProductLockAndSave: async (product: Product) => {
    // Al finalizar IA, quita el candado y marca como analizado
    const finalizedProduct = {
      ...product,
      locked_by_ai: false,
      lock_timestamp: 0
    };
    await DataService.saveProduct(finalizedProduct);
  },

  uploadLocalProducts: async () => {
    const products = await DataService.getAllProducts();
    await CloudSyncService.updateProductsBatch(products);
    return products.length;
  }
};
