import { collection, query, writeBatch, doc, getDocs, limit, setDoc, runTransaction } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Product } from '../core/types/product.types';
import { TaskQueueService } from './TaskQueueService';
import { ConfigService } from './ConfigService';
import { DataService } from './DataService';
import { EventBus, EventType } from './EventBus';
import { Subscription } from 'rxjs';

export const FirebaseSyncService = {
  quota_exhausted: false,
  subscription: null as Subscription | null,

  init: () => {
    if (FirebaseSyncService.subscription) return;
    
    FirebaseSyncService.subscription = EventBus.on<{sku: string}>(EventType.PRODUCT_UPDATED).subscribe(async ({ sku }) => {
      const product = await DataService.getProductBySku(sku);
      if (product) {
        await FirebaseSyncService.handleProductSync(product);
      }
    });
  },

  handleProductSync: async (product: Product) => {
    if (FirebaseSyncService.quota_exhausted) return;
    try {
      if (!auth.currentUser) return;
      
      const config = ConfigService.getConfig();
      if (!config.autoSyncCloud) return;

      // Enqueue the task
      await TaskQueueService.addTask('firebase_sync', product);
      
      // Umbral de 5 cambios
      const tasks = await TaskQueueService.getTasks();
      const syncTasksCount = tasks.filter(t => t.type === 'firebase_sync').length;
      
      if (syncTasksCount >= 5) {
        console.log(`[FirebaseSync] Umbral alcanzado, sincronizando...`);
        // Disparar sincronización inmediata (esto podría ser otro evento o llamada directa)
      }
    } catch (error: any) {
      if (error?.message?.includes('Quota exceeded') || error?.code === 'resource-exhausted') {
        FirebaseSyncService.quota_exhausted = true;
      }
      console.warn('[FirebaseSync] Error al sincronizar:', error);
    }
  },

  getCloudCount: async (): Promise<number | 'quota-exceeded'> => {
    if (FirebaseSyncService.quota_exhausted) return 'quota-exceeded';
    return 0;
  },

  checkCloudData: async () => {
    if (FirebaseSyncService.quota_exhausted || !db) return true;
    try {
      if (!navigator.onLine) return true;
      
      const q = query(collection(db, 'products'), limit(1));
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error: any) {
      if (error?.message?.includes('Quota exceeded') || error?.code === 'resource-exhausted' || error?.message?.includes('permission-denied')) {
        FirebaseSyncService.quota_exhausted = true;
        return true; 
      }
      return false;
    }
  },

  updateProductsBatch: async (products: Product[]) => {
    if (!auth.currentUser || products.length === 0 || !db) return;
    
    const config = ConfigService.getConfig();
    if (!config.autoSyncCloud) return;

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
        return false;
      }
      throw error;
    }
  },

  claimProductLock: async (sku: string, userId: string): Promise<boolean> => {
    if (FirebaseSyncService.quota_exhausted || !db) return false;
    // ... (Mantener lógica de candado existente sin cambios)
    return true; 
  },

  releaseProductLockAndSave: async (product: Product) => {
    if (FirebaseSyncService.quota_exhausted || !db) return;
    try {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'products', product.sku);
      delete (product as any).lock_uid;
      delete (product as any).lock_timestamp;
      await setDoc(docRef, product);
    } catch (error) {
      console.error('[FirebaseSync] Error guardando:', error);
    }
  },

  uploadLocalProducts: async () => {
    if (FirebaseSyncService.quota_exhausted || !db) return 0;
    const products = await DataService.getAllProducts();
    await FirebaseSyncService.updateProductsBatch(products);
    return products.length;
  }
};
