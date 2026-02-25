import { getDB } from '../core/database/db';
import { Product, SafetyStatus } from '../core/types/product.types';

export class SyncService {
  private static readonly SYNC_META_ID = 'main_sync';

  /**
   * Obtiene el catálogo de productos desde el archivo estático generado por el scraper.
   */
  static async fetchCatalog(): Promise<Product[]> {
    try {
      // Intentamos cargar el archivo generado por el scraper (alojado en public/)
      const response = await fetch('/catalog.json');
      if (!response.ok) {
        throw new Error(`Error al cargar el catálogo: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as Product[];
      
    } catch (error) {
      console.warn('[SyncService] No se pudo cargar /catalog.json, usando datos de respaldo:', error);
      
      // Mock data de respaldo por si el archivo aún no existe
      return [
        {
          sku: 'MED-001',
          nombre_comercial: 'Paracetamol 500mg',
          descripcion: 'Analgésico y antipirético de uso común.',
          principios_activos: ['Paracetamol'],
          posologia: '1 comprimido cada 8 horas.',
          indicaciones: ['Dolor leve a moderado', 'Fiebre', 'Cefalea'],
          advertencias: 'No exceder 4g diarios. Riesgo de toxicidad hepática.',
          tags_ia: ['analgesico', 'antipiretico', 'dolor', 'fiebre', 'otc'],
          vectores: [],
          apto_embarazo: SafetyStatus.SI,
          apto_lactancia: SafetyStatus.SI,
          apto_pediatria: SafetyStatus.PRECAUCION,
          apto_diabeticos: SafetyStatus.SI,
          apto_hipertensos: SafetyStatus.SI,
          apto_celiacos: SafetyStatus.SI,
          sugerencia_complementaria: 'Mantener buena hidratación.',
          skus_relacionados: []
        }
      ];
    }
  }

  /**
   * Sincroniza los datos remotos con la base de datos local (IndexedDB).
   */
  static async sync(): Promise<{ success: boolean; itemsUpdated: number }> {
    try {
      console.log('[SyncService] Iniciando sincronización...');
      const remoteProducts = await this.fetchCatalog();
      
      const db = await getDB();
      const tx = db.transaction(['products', 'sync_metadata'], 'readwrite');
      
      const productStore = tx.objectStore('products');
      
      // Upsert de productos
      for (const product of remoteProducts) {
        await productStore.put(product);
      }
      
      // Actualizar metadatos de sincronización
      const metaStore = tx.objectStore('sync_metadata');
      await metaStore.put({
        id: this.SYNC_META_ID,
        lastSyncTime: Date.now(),
        version: '1.0.0'
      });
      
      await tx.done;
      
      console.log(`[SyncService] Sincronización completada. ${remoteProducts.length} items actualizados.`);
      return { success: true, itemsUpdated: remoteProducts.length };
    } catch (error) {
      console.error('[SyncService] Error durante la sincronización:', error);
      return { success: false, itemsUpdated: 0 };
    }
  }

  /**
   * Obtiene la fecha de la última sincronización exitosa.
   */
  static async getLastSyncTime(): Promise<number | null> {
    const db = await getDB();
    const meta = await db.get('sync_metadata', this.SYNC_META_ID);
    return meta ? meta.lastSyncTime : null;
  }
}
