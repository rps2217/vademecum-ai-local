import { getDB } from '../core/database/db';
import { Product, SafetyStatus } from '../core/types/product.types';

export class SyncService {
  private static readonly SYNC_META_ID = 'main_sync';

  /**
   * Simula la conexión con Google Apps Script para obtener los datos más recientes.
   */
  static async fetchFromGoogleSheets(): Promise<Product[]> {
    // Simulación de latencia de red
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock data para probar la UI
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
      },
      {
        sku: 'MED-002',
        nombre_comercial: 'Ibuprofeno 400mg',
        descripcion: 'Antiinflamatorio no esteroideo (AINE).',
        principios_activos: ['Ibuprofeno'],
        posologia: '1 comprimido cada 8 horas con las comidas.',
        indicaciones: ['Dolor muscular', 'Inflamación', 'Fiebre'],
        advertencias: 'Puede causar irritación gástrica. Precaución en asma.',
        tags_ia: ['aine', 'antiinflamatorio', 'dolor', 'muscular', 'otc'],
        vectores: [],
        apto_embarazo: SafetyStatus.NO,
        apto_lactancia: SafetyStatus.PRECAUCION,
        apto_pediatria: SafetyStatus.PRECAUCION,
        apto_diabeticos: SafetyStatus.SI,
        apto_hipertensos: SafetyStatus.PRECAUCION,
        apto_celiacos: SafetyStatus.SI,
        sugerencia_complementaria: 'Tomar con protector gástrico si hay sensibilidad.',
        skus_relacionados: ['MED-001']
      },
      {
        sku: 'FIT-001',
        nombre_comercial: 'Valeriana Extracto Seco',
        descripcion: 'Suplemento fitoterápico relajante.',
        principios_activos: ['Extracto de Valeriana officinalis'],
        posologia: '1 a 2 cápsulas 30 minutos antes de dormir.',
        indicaciones: ['Insomnio leve', 'Ansiedad', 'Nerviosismo'],
        advertencias: 'Puede causar somnolencia. No mezclar con alcohol.',
        tags_ia: ['fitoterapia', 'relajante', 'sueño', 'ansiedad', 'natural'],
        vectores: [],
        apto_embarazo: SafetyStatus.PRECAUCION,
        apto_lactancia: SafetyStatus.PRECAUCION,
        apto_pediatria: SafetyStatus.NO,
        apto_diabeticos: SafetyStatus.SI,
        apto_hipertensos: SafetyStatus.SI,
        apto_celiacos: SafetyStatus.SI,
        sugerencia_complementaria: 'Combinar con infusión de manzanilla.',
        skus_relacionados: []
      }
    ];
  }

  /**
   * Sincroniza los datos remotos con la base de datos local (IndexedDB).
   */
  static async sync(): Promise<{ success: boolean; itemsUpdated: number }> {
    try {
      console.log('[SyncService] Iniciando sincronización...');
      const remoteProducts = await this.fetchFromGoogleSheets();
      
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
