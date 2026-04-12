import { collection, onSnapshot, query, writeBatch, doc, getDocs, limit, setDoc, runTransaction } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { getDB } from '../core/database/db';
import { Product } from '../core/types/product.types';

export const FirebaseSyncService = {
  /**
   * Escucha cambios en Firestore y los sincroniza con IndexedDB local
   */
  startSync: () => {
    const productsRef = collection(db, 'products');
    
    // Suscribirse a cambios en tiempo real
    const unsubscribe = onSnapshot(productsRef, async (snapshot) => {
      const localDb = await getDB();
      const tx = localDb.transaction('products', 'readwrite');
      
      snapshot.docChanges().forEach(async (change) => {
        const product = change.doc.data() as Product;
        if (change.type === 'added' || change.type === 'modified') {
          await tx.store.put(product);
        } else if (change.type === 'removed') {
          await tx.store.delete(product.sku);
        }
      });
      
      await tx.done;
      window.dispatchEvent(new CustomEvent('db_updated'));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return unsubscribe;
  },

  /**
   * Sube productos locales a Firestore (Solo para Admins)
   */
  uploadLocalProducts: async () => {
    try {
      const localDb = await getDB();
      const allProducts = await localDb.getAll('products');
      
      // Firestore batches have a limit of 500 operations
      const batchSize = 500;
      for (let i = 0; i < allProducts.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = allProducts.slice(i, i + batchSize);
        
        chunk.forEach(product => {
          const docRef = doc(db, 'products', product.sku);
          batch.set(docRef, product);
        });
        
        await batch.commit();
      }
      
      console.log(`${allProducts.length} productos sincronizados con Firestore.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
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
   * Actualiza un solo producto en Firestore (útil para procesos en segundo plano)
   */
  updateProduct: async (product: Product) => {
    try {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'products', product.sku);
      await setDoc(docRef, product);
    } catch (error) {
      // Silencioso, ya que si no es admin fallará por permisos, lo cual es esperado
      console.warn('[FirebaseSync] No se pudo actualizar en la nube (¿Faltan permisos de Admin?):', error);
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
