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
  tag_mappings: {
    key: string;
    value: {
      raw: string;
      normalized: string;
      last_updated: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<VademecumDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<VademecumDB>('vademecum-db', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const productStore = db.createObjectStore('products', { keyPath: 'sku' });
          productStore.createIndex('by-nombre', 'nombre_comercial');
          db.createObjectStore('sync_metadata', { keyPath: 'id' });
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('tag_mappings')) {
            db.createObjectStore('tag_mappings', { keyPath: 'raw' });
          }
        }
      },
    });
  }
  return dbPromise;
};
