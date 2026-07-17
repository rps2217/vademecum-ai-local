import { logger } from '../services/LoggerService';
export class EmbeddingCacheService {
  private static instance: EmbeddingCacheService;
  private memoryCache = new Map<string, number[]>();
  private dbName = 'vademecum_embedding_cache';
  private storeName = 'embeddings';
  private db: IDBDatabase | null = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): EmbeddingCacheService {
    if (!EmbeddingCacheService.instance) {
      EmbeddingCacheService.instance = new EmbeddingCacheService();
    }
    return EmbeddingCacheService.instance;
  }

  private initDB(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      try {
        const request = indexedDB.open(this.dbName, 1);
        
        request.onupgradeneeded = (e: any) => {
          const database = e.target.result;
          if (!database.objectStoreNames.contains(this.storeName)) {
            database.createObjectStore(this.storeName);
          }
        };

        request.onsuccess = (e: any) => {
          this.db = e.target.result;
          logger.info('[EmbeddingCache] IndexedDB cache initialized successfully.');
          resolve();
        };

        request.onerror = (e) => {
          logger.warn('[EmbeddingCache] IndexedDB failed to load, falling back to memory-only cache:', e);
          resolve();
        };
      } catch (err) {
        logger.warn('[EmbeddingCache] Exception initializing IndexedDB, falling back to memory-only:', err);
        resolve();
      }
    });

    return this.initPromise;
  }

  /**
   * Normalizes text prior to hashing or caching.
   */
  private normalizeText(text: string): string {
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /**
   * Fetches the embedding vector from the cache (in-memory or indexedDB).
   */
  async get(text: string): Promise<number[] | null> {
    const cleanText = this.normalizeText(text);
    if (!cleanText) return null;

    // 1. Memory check
    if (this.memoryCache.has(cleanText)) {
      return this.memoryCache.get(cleanText) || null;
    }

    // 2. Disk check (IndexedDB)
    await this.initDB();
    if (!this.db) return null;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const req = store.get(cleanText);

        req.onsuccess = () => {
          const val = req.result;
          if (val) {
            this.memoryCache.set(cleanText, val); // elevate to memory
            resolve(val);
          } else {
            resolve(null);
          }
        };

        req.onerror = () => {
          resolve(null);
        };
      } catch (err) {
        resolve(null);
      }
    });
  }

  /**
   * Saves the embedding vector in the cache (memory & indexedDB).
   */
  async set(text: string, vector: number[]): Promise<void> {
    const cleanText = this.normalizeText(text);
    if (!cleanText || !vector || vector.length === 0) return;

    // Save in memory
    this.memoryCache.set(cleanText, vector);

    // Save on disk (IndexedDB)
    await this.initDB();
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const req = store.put(vector, cleanText);

        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch (err) {
        resolve();
      }
    });
  }

  /**
   * Clears all cache entries from memory and IndexedDB.
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    await this.initDB();
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const req = store.clear();

        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch (err) {
        resolve();
      }
    });
  }

  /**
   * Gets stats on cached embeddings for debugging/diagnostic views.
   */
  getStats() {
    return {
      memoryEntries: this.memoryCache.size,
      hasPersistentDB: !!this.db
    };
  }
}

export const embeddingCacheService = EmbeddingCacheService.getInstance();
