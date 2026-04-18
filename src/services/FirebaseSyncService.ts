import { collection, onSnapshot, query, writeBatch, doc, getDocs, limit, setDoc, runTransaction, getCountFromServer } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Product } from '../core/types/product.types';
import { TaskQueueService } from './TaskQueueService';
import { ConfigService } from './ConfigService';

export const FirebaseSyncService = {
  quota_exhausted: false,

  getCloudCount: async (): Promise<number | 'quota-exceeded'> => {
    if (FirebaseSyncService.quota_exhausted) return 'quota-exceeded';
    return 0;
  },

  startSync: () => {
    console.log('[FirebaseSync] Sincronización local deshabilitada');
    return () => {};
  },

  uploadLocalProducts: async (): Promise<number> => {
    return 0;
  },

  /**
   * Verifica si Firestore tiene datos, si no, ofrece subir los locales
   */
  checkCloudData: async () => {
    if (FirebaseSyncService.quota_exhausted) return true;
    try {
      // Solo intentar si estamos online y no hay errores previos graves
      if (!navigator.onLine) return true;
      
      const q = query(collection(db, 'products'), limit(1));
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error: any) {
      if (error?.message?.includes('Quota exceeded') || error?.code === 'resource-exhausted' || error?.message?.includes('permission-denied')) {
        console.warn('[FirebaseSync] Cuota o permisos insuficientes. Deshabilitando sync en esta sesión.');
        FirebaseSyncService.quota_exhausted = true;
        return true; 
      }
      return false;
    }
  },

  /**
   * Actualiza un solo producto en Firestore (Cualquier usuario autenticado puede colaborar)
   */
  updateProduct: async (product: Product) => {
    if (FirebaseSyncService.quota_exhausted) return;
    try {
      if (!auth.currentUser) return;
      
      const config = ConfigService.getConfig();
      if (!config.autoSyncCloud) {
        console.log('[FirebaseSync] Auto-Sincronización desactivada. Saltando subida de:', product.sku);
        return;
      }

      // En lugar de subir inmediatamente, encolamos la tarea
      await TaskQueueService.addTask('firebase_sync', product);
      
      // Revisar el umbral (5 cambios)
      const tasks = await TaskQueueService.getTasks();
      const syncTasksCount = tasks.filter(t => t.type === 'firebase_sync').length;
      
      if (syncTasksCount >= 5) {
        console.log(`[FirebaseSync] Umbral de 5 cambios alcanzado. Disparando sincronización...`);
        window.dispatchEvent(new CustomEvent('trigger_quota_sync'));
      } else {
        console.log(`[FirebaseSync] Cambio encolado (${syncTasksCount}/5 para sincronización inmediata).`);
      }
    } catch (error: any) {
      if (error?.message?.includes('Quota exceeded') || error?.code === 'resource-exhausted') {
        FirebaseSyncService.quota_exhausted = true;
      }
      console.warn('[FirebaseSync] Error al encolar producto para sincronización:', error);
    }
  },

  updateProductsBatch: async (products: Product[]) => {
    if (!auth.currentUser || products.length === 0) return;
    
    const config = ConfigService.getConfig();
    if (!config.autoSyncCloud) {
      console.log('[FirebaseSync] Auto-Sincronización desactivada. Saltando subida de lote.');
      return;
    }

    const batch = writeBatch(db);
    products.forEach(product => {
      const docRef = doc(db, 'products', product.sku);
      batch.set(docRef, product);
    });

    try {
      await batch.commit();
      return true;
    } catch (error: any) {
      if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota exceeded')) {
        console.warn('[FirebaseSync] Cuota excedida en lote.');
        return false;
      }
      console.error('[FirebaseSync] Error en actualización por lote:', error);
      throw error;
    }
  },

  /**
   * Intenta adquirir un candado para procesar un producto de forma distribuida
   */
  claimProductLock: async (sku: string, userId: string): Promise<boolean> => {
    if (FirebaseSyncService.quota_exhausted) return false;
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const docRef = doc(db, 'products', sku);
        const success = await runTransaction(db, async (transaction) => {
          const sfDoc = await transaction.get(docRef);
          if (!sfDoc.exists()) return false;

          const data = sfDoc.data() as Product;
          const now = Date.now();
          const lockTime = data.lock_timestamp || 0;
          const lockUid = data.lock_uid;

          // Si está bloqueado por otro y el bloqueo tiene menos de 5 minutos, rechazar
          if (lockUid && lockUid !== userId && (now - lockTime) < 5 * 60 * 1000) {
            return false;
          }

          // Adquirir el candado
          transaction.update(docRef, {
            lock_uid: userId,
            lock_timestamp: now
          });
          return true;
        });
        return success;
      } catch (e: any) {
        if (e?.message?.includes('Quota exceeded') || e?.code === 'resource-exhausted') {
          FirebaseSyncService.quota_exhausted = true;
        }
        if (e.code === 'failed-precondition' && i < maxRetries - 1) {
          console.warn(`[FirebaseSync] Conflicto en transacción, reintentando (${i + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
          continue;
        }
        console.warn("[FirebaseSync] No se pudo adquirir el candado:", e);
        return false;
      }
    }
    return false;
  },

  /**
   * Libera el candado y guarda los resultados del análisis
   */
  releaseProductLockAndSave: async (product: Product) => {
    if (FirebaseSyncService.quota_exhausted) return;
    try {
      if (!auth.currentUser) {
        console.warn('[FirebaseSync] No se pudo guardar: Usuario no autenticado.');
        return;
      }
      console.log(`[FirebaseSync] Guardando producto en nube: ${product.sku}`);
      const docRef = doc(db, 'products', product.sku);
      
      const productToSave = { ...product };
      // Asegurar que campos críticos no sean undefined
      productToSave.skus_relacionados = productToSave.skus_relacionados || [];
      productToSave.sugerencia_complementaria = productToSave.sugerencia_complementaria || "";
      
      delete productToSave.lock_uid;
      delete productToSave.lock_timestamp;

      await setDoc(docRef, productToSave);
      console.log(`[FirebaseSync] Producto guardado exitosamente: ${product.sku}`);
    } catch (error) {
      console.error('[FirebaseSync] Error liberando candado y guardando:', error);
    }
  }
};
