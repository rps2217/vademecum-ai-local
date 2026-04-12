import { collection, onSnapshot, query, writeBatch, doc, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
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
  }
};
