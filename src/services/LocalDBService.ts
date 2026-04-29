import { openDB, IDBPDatabase } from 'idb';
import { Product } from '../core/types/product.types';

const DB_NAME = 'VademecumDB';
const DB_VERSION = 1;
const STORE_NAME = 'products';

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

function getDB(): Promise<IDBPDatabase<any>> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME, { keyPath: 'sku' });
      },
    });
  }
  return dbPromise;
}

export const LocalDBService = {
  async getAllProducts(): Promise<Product[]> {
    const db = await getDB();
    return db.getAll(STORE_NAME);
  },

  async getProductBySku(sku: string): Promise<Product | null> {
    const db = await getDB();
    return db.get(STORE_NAME, sku) as Promise<Product | undefined> || null;
  },

  async saveProduct(product: Product): Promise<void> {
    const db = await getDB();
    await db.put(STORE_NAME, product);
  },

  async bulkSaveProducts(products: Product[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await Promise.all(products.map(p => tx.store.put(p)));
    await tx.done;
  },

  async deleteProduct(sku: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORE_NAME, sku);
  },

  async clearAll(): Promise<void> {
    const db = await getDB();
    await db.clear(STORE_NAME);
  }
};
