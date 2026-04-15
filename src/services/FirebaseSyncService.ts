import { collection, onSnapshot, query, writeBatch, doc, getDocs, limit, setDoc, runTransaction, getCountFromServer } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { getDB } from '../core/database/db';
import { Product } from '../core/types/product.types';
import { TaskQueueService } from './TaskQueueService';
import { ConfigService } from './ConfigService';

export const FirebaseSyncService = {
  /**
   * Obtiene la cantidad total de productos en Firestore
   */
  getCloudCount: async (): Promise<number> => {
    try {
      const coll = collection(db, 'products');
      const snapshot = await getCountFromServer(coll);
      return snapshot.data().count;
    } catch (error) {
      console.error('[FirebaseSync] Error obteniendo conteo de nube:', error);
      return 0;
    }
  },

  /**
   * Escucha cambios en Firestore y los sincroniza con IndexedDB local (Modo Delta)
   */
  startSync: () => {
    let unsubscribe: (() => void) | null = null;

    const initSync = async () => {
      const localDb = await getDB();
      if (!localDb) return;
      
      const metadata = await localDb.get('sync_metadata', 'cloud_sync');
      const lastSyncTime = metadata?.lastSyncTime || 0;

      // Solo pedir documentos que hayan cambiado desde la última sincronización
      const productsRef = collection(db, 'products');
      
      // Verificar si hay datos en la nube antes de sincronizar
      const cloudHasData = await FirebaseSyncService.checkCloudData();
      
      unsubscribe = onSnapshot(productsRef, async (snapshot) => {
        const tx = localDb.transaction(['products', 'sync_metadata'], 'readwrite');
        const productStore = tx.objectStore('products');
        const metaStore = tx.objectStore('sync_metadata');
        
        let maxTimestamp = lastSyncTime;

        // Si es la primera sincronización y la nube no tiene datos, no borrar local
        const isInitialSync = lastSyncTime === 0;

        for (const change of snapshot.docChanges()) {
          const product = change.doc.data() as Product;
          if (change.type === 'added' || change.type === 'modified') {
            await productStore.put(product);
            if (product.last_updated && product.last_updated > maxTimestamp) {
              maxTimestamp = product.last_updated;
            }
          } else if (change.type === 'removed') {
            if (!(isInitialSync && !cloudHasData)) {
              await productStore.delete(product.sku);
            }
          }
        }
        
        // Actualizar timestamp de última sincronización
        await metaStore.put({
          id: 'cloud_sync',
          lastSyncTime: maxTimestamp,
          version: '1.0.0'
        });

        await tx.done;
        window.dispatchEvent(new CustomEvent('db_updated'));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'products');
      });
    };

    initSync();
    return () => unsubscribe?.();
  },

  /**
   * Sube SOLO los productos modificados localmente a Firestore (Sincronización Delta)
   */
  uploadLocalProducts: async (): Promise<number> => {
    try {
      const localDb = await getDB();
      const metadata = await localDb.get('sync_metadata', 'cloud_sync');
      const lastSyncTime = metadata?.lastSyncTime || 0;

      // Obtener todos los productos y filtrar los que tienen last_updated > lastSyncTime
      const allProducts = await localDb.getAll('products');
      const deltaProducts = allProducts.filter(p => (p.last_updated || 0) > lastSyncTime);

      console.log(`[FirebaseSync] Productos para respaldo: ${deltaProducts.length}, lastSyncTime: ${lastSyncTime}`);

      if (deltaProducts.length === 0) return 0;
      
      const batchSize = 500;
      let uploadedCount = 0;

      for (let i = 0; i < deltaProducts.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = deltaProducts.slice(i, i + batchSize);
        
        chunk.forEach(product => {
          const docRef = doc(db, 'products', product.sku);
          batch.set(docRef, product);
          uploadedCount++;
        });
        
        await batch.commit();
        console.log(`[FirebaseSync] Lote subido: ${uploadedCount} productos.`);
      }
      
      // Actualizar el metadata local después de una subida exitosa
      await localDb.put('sync_metadata', {
        id: 'cloud_sync',
        lastSyncTime: Date.now(),
        version: '1.0.0'
      });
      
      console.log(`${uploadedCount} productos (Delta) sincronizados con Firestore.`);
      return uploadedCount;
    } catch (error) {
      console.error('[FirebaseSync] Error en uploadLocalProducts:', error);
      handleFirestoreError(error, OperationType.WRITE, 'products');
      return 0;
    }
  },

  /**
   * Verifica si Firestore tiene datos, si no, ofrece subir los locales
   */
  checkCloudData: async () => {
    const q = query(collection(db, 'products'), limit(1));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  },

  /**
   * Actualiza un solo producto en Firestore (Cualquier usuario autenticado puede colaborar)
   */
  updateProduct: async (product: Product) => {
    try {
      if (!auth.currentUser) return;
      
      const config = ConfigService.getConfig();
      if (!config.autoSyncCloud) {
        console.log('[FirebaseSync] Auto-Sincronización desactivada. Saltando subida de:', product.sku);
        return;
      }

      const docRef = doc(db, 'products', product.sku);
      await setDoc(docRef, product);
    } catch (error: any) {
      if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota exceeded')) {
        console.warn('[FirebaseSync] Cuota excedida, encolando tarea:', product.sku);
        await TaskQueueService.addTask('firebase_sync', product);
      } else {
        console.warn('[FirebaseSync] No se pudo actualizar en la nube:', error);
      }
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
