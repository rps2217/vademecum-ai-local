import { collection, onSnapshot, query, writeBatch, doc, getDocs, limit, setDoc, runTransaction } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { getDB } from '../core/database/db';
import { Product } from '../core/types/product.types';

export const FirebaseSyncService = {
  /**
   * Escucha cambios en Firestore y los sincroniza con IndexedDB local (Modo Delta)
   */
  startSync: () => {
    let unsubscribe: (() => void) | null = null;

    const initSync = async () => {
      const localDb = await getDB();
      const metadata = await localDb.get('sync_metadata', 'cloud_sync');
      const lastSyncTime = metadata?.lastSyncTime || 0;

      // Solo pedir documentos que hayan cambiado desde la última sincronización
      const productsRef = collection(db, 'products');
      const q = query(
        productsRef,
        // Eliminamos el filtro de tiempo aquí para onSnapshot inicial, 
        // pero lo usaremos para optimizar la carga inicial si fuera necesario.
        // Por ahora, onSnapshot maneja bien los deltas internos de Firebase.
      );
      
      unsubscribe = onSnapshot(q, async (snapshot) => {
        const tx = localDb.transaction(['products', 'sync_metadata'], 'readwrite');
        const productStore = tx.objectStore('products');
        const metaStore = tx.objectStore('sync_metadata');
        
        let maxTimestamp = lastSyncTime;

        for (const change of snapshot.docChanges()) {
          const product = change.doc.data() as Product;
          if (change.type === 'added' || change.type === 'modified') {
            await productStore.put(product);
            if (product.last_updated && product.last_updated > maxTimestamp) {
              maxTimestamp = product.last_updated;
            }
          } else if (change.type === 'removed') {
            await productStore.delete(product.sku);
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
      const docRef = doc(db, 'products', product.sku);
      await setDoc(docRef, product);
    } catch (error) {
      console.warn('[FirebaseSync] No se pudo actualizar en la nube:', error);
    }
  },

  /**
   * Intenta adquirir un candado para procesar un producto de forma distribuida
   */
  claimProductLock: async (sku: string, userId: string): Promise<boolean> => {
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
    } catch (e) {
      console.warn("[FirebaseSync] No se pudo adquirir el candado:", e);
      return false;
    }
  },

  /**
   * Libera el candado y guarda los resultados del análisis
   */
  releaseProductLockAndSave: async (product: Product) => {
    try {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'products', product.sku);
      
      const productToSave = { ...product };
      delete productToSave.lock_uid;
      delete productToSave.lock_timestamp;

      await setDoc(docRef, productToSave);
    } catch (error) {
      console.error('[FirebaseSync] Error liberando candado y guardando:', error);
    }
  }
};
