/**
 * Servicio de Sincronización Offline-First
 * 
 * Estrategia:
 * 1. Local es la fuente de verdad
 * 2. Supabase es backup/remoto
 * 3. Sincronización incremental y diferencial
 * 4. Manejo robusto de errores con retry automático
 */

import { Product } from '../types/product.types';
import { localDatabaseService } from './LocalDatabase';
import { logger } from '../../services/LoggerService';

interface SyncResult {
  success: boolean;
  productos_subidos: number;
  productos_descargados: number;
  conflictos_resueltos: number;
  errores: string[];
  duracion_ms: number;
  timestamp: number;
}

interface ConflictItem {
  sku: string;
  local: Partial<Product>;
  remote: Partial<Product>;
  timestamp: number;
}

class OfflineSyncService {
  private isSyncing = false;
  private syncQueue: (() => Promise<void>)[] = [];
  private maxRetries = 3;
  private retryDelay = 5000; // 5 segundos
  
  private supabaseUrl: string | null = null;
  private supabaseKey: string | null = null;
  
  constructor() {
    this.initSupabase();
  }
  
  private initSupabase() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  }
  
  async sincronizar(): Promise<SyncResult> {
    if (this.isSyncing) {
      logger.info('Sincronización ya en progreso, encolando...', 'OfflineSync');
      return new Promise((resolve) => {
        this.syncQueue.push(async () => {
          resolve(await this.sincronizar());
        });
      });
    }
    
    this.isSyncing = true;
    const startTime = Date.now();
    
    const result: SyncResult = {
      success: false,
      productos_subidos: 0,
      productos_descargados: 0,
      conflictos_resueltos: 0,
      errores: [],
      duracion_ms: 0,
      timestamp: Date.now()
    };
    
    try {
      // 1. Subir cambios locales a Supabase
      const subidos = await this.uploadLocalChanges();
      result.productos_subidos = subidos;
      
      // 2. Descargar cambios remotos
      const descargados = await this.downloadRemoteChanges();
      result.productos_descargados = descargados;
      
      // 3. Resolver conflictos
      const conflictos = await this.resolveConflicts();
      result.conflictos_resueltos = conflictos;
      
      // 4. Actualizar timestamp de sincronización
      await localDatabaseService.guardarUltimaSincronizacion(Date.now());
      
      result.success = true;
      logger.success('Sincronización completada', 'OfflineSync');
      
    } catch (error: any) {
      result.errores.push(error.message || 'Error desconocido');
      logger.error('Error en sincronización', 'OfflineSync', error);
      
      // Programar retry
      this.scheduleRetry();
      
    } finally {
      this.isSyncing = false;
      result.duracion_ms = Date.now() - startTime;
      
      // Procesar cola si hay tareas pendientes
      this.processQueue();
    }
    
    return result;
  }
  
  private async uploadLocalChanges(): Promise<number> {
    if (!this.supabaseUrl || !this.supabaseKey) {
      logger.info('Supabase no configurado, saltando upload', 'OfflineSync');
      return 0;
    }
    
    try {
      // Obtener productos modificados localmente desde última sincronización
      const lastSync = await localDatabaseService.obtenerUltimaSincronizacion() || 0;
      const productosLocales = await localDatabaseService.obtenerProductosActualizados(lastSync);
      
      if (productosLocales.length === 0) {
        logger.info('No hay cambios locales para subir', 'OfflineSync');
        return 0;
      }
      
      // Subir en lotes
      const batchSize = 50;
      let totalSubidos = 0;
      
      for (let i = 0; i < productosLocales.length; i += batchSize) {
        const batch = productosLocales.slice(i, i + batchSize);
        
        try {
          const response = await fetch(`${this.supabaseUrl}/rest/v1/productos`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': this.supabaseKey,
              'Authorization': `Bearer ${this.supabaseKey}`,
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(batch)
          });
          
          if (response.ok) {
            totalSubidos += batch.length;
          } else {
            logger.error(`Error subiendo lote: ${response.status}`, 'OfflineSync');
          }
        } catch (error) {
          logger.error('Error en lote', 'OfflineSync', error);
        }
      }
      
      return totalSubidos;
      
    } catch (error) {
      logger.error('Error uploading local changes', 'OfflineSync', error);
      return 0;
    }
  }
  
  private async downloadRemoteChanges(): Promise<number> {
    if (!this.supabaseUrl || !this.supabaseKey) {
      return 0;
    }
    
    try {
      const lastSync = await localDatabaseService.obtenerUltimaSincronizacion() || 0;
      const since = new Date(lastSync).toISOString();
      
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/productos?updated_at=gt.${since}&select=*`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const remoteProducts: Product[] = await response.json();
      
      if (remoteProducts.length === 0) {
        return 0;
      }
      
      // Guardar productos descargados
      await localDatabaseService.guardarProductos(remoteProducts);
      
      return remoteProducts.length;
      
    } catch (error) {
      logger.error('Error downloading remote changes', 'OfflineSync', error);
      return 0;
    }
  }
  
  private async resolveConflicts(): Promise<number> {
    // Implementación básica - en producción sería más compleja
    // Por ahora, el local siempre gana (offline-first)
    return 0;
  }
  
  private scheduleRetry(): void {
    setTimeout(() => {
      logger.info('Reintentando sincronización...', 'OfflineSync');
      this.sincronizar().catch((e) => logger.error('Error en retry', 'OfflineSync', e));
    }, this.retryDelay);
  }
  
  private processQueue(): void {
    if (this.syncQueue.length > 0) {
      const next = this.syncQueue.shift();
      if (next) {
        next().catch((e) => logger.error('Error procesando cola', 'OfflineSync', e));
      }
    }
  }
  
  async sincronizacionCompleta(): Promise<void> {
    // Forzar descarga de todos los datos remotos
    if (!this.supabaseUrl || !this.supabaseKey) {
      return;
    }
    
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/productos?select=*`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }
      );
      
      if (response.ok) {
        const productos: Product[] = await response.json();
        await localDatabaseService.limpiarProductos();
        await localDatabaseService.guardarProductos(productos);
        await localDatabaseService.guardarUltimaSincronizacion(Date.now());
        logger.success(`Sincronización completa: ${productos.length} productos`, 'OfflineSync');
      }
    } catch (error) {
      logger.error('Error en sincronización completa', 'OfflineSync', error);
    }
  }
  
  getStatus() {
    return {
      isSyncing: this.isSyncing,
      queueLength: this.syncQueue.length,
      supabaseConfigured: !!(this.supabaseUrl && this.supabaseKey)
    };
  }
}

export const offlineSyncService = new OfflineSyncService();
