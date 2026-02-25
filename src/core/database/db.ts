import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Product } from '../types/product.types';

interface VademecumDB extends DBSchema {
  products: {
    key: string;
    value: Product;
    indexes: {
      'by-nombre': string;
    };
  };
  sync_metadata: {
    key: string;
    value: {
      id: string;
      lastSyncTime: number;
      version: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<VademecumDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<VademecumDB>('vademecum-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'sku' });
          productStore.createIndex('by-nombre', 'nombre_comercial');
        }
        if (!db.objectStoreNames.contains('sync_metadata')) {
          db.createObjectStore('sync_metadata', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};
