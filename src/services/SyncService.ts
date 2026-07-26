/**
 * SyncService - Servicio de sincronización en la nube con soporte offline
 * Permite respaldar y sincronizar la base de conocimiento entre dispositivos
 */

import { logger } from './LoggerService';
import { getExtendedIngredientDatabase } from '../core/ingredient-database/ingredients';
import { ORGANS_PATHOLOGIES_MAP } from '../core/knowledge/organs-pathologies-map';

export interface SyncData {
  version: string;
  timestamp: number;
  ingredients: Record<string, any>;
  organs: typeof ORGANS_PATHOLOGIES_MAP;
  keywords: string[];
  lastSync: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: number;
  pendingChanges: number;
  syncInProgress: boolean;
  error: string | null;
}

const DB_NAME = 'vademecum-sync';
const DB_VERSION = 1;
const STORE_NAME = 'sync-data';
const SYNC_KEY = 'last-sync-data';

class SyncService {
  private static instance: SyncService;
  private db: IDBDatabase | null = null;
  private status: SyncStatus = {
    isOnline: navigator.onLine,
    lastSync: 0,
    pendingChanges: 0,
    syncInProgress: false,
    error: null
  };
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  private constructor() {
    this.initDatabase();
    this.setupOnlineListener();
    this.loadLastSync();
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Inicializar IndexedDB para almacenamiento offline
   */
  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error('[SyncService] Error al abrir IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.info('[SyncService] IndexedDB inicializado correctamente');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains('backup')) {
          db.createObjectStore('backup', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Configurar listener para cambios de conexión
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      this.status.isOnline = true;
      this.notifyListeners();
      logger.info('[SyncService] Conexión恢复: intentando sincronizar...');
      this.syncToCloud().catch(console.error);
    });

    window.addEventListener('offline', () => {
      this.status.isOnline = false;
      this.notifyListeners();
      logger.info('[SyncService] Sin conexión - modo offline');
    });
  }

  /**
   * Cargar última sincronización desde localStorage
   */
  private loadLastSync(): void {
    try {
      const lastSync = localStorage.getItem('lastSyncTimestamp');
      if (lastSync) {
        this.status.lastSync = parseInt(lastSync, 10);
      }
    } catch (e) {
      logger.warn('[SyncService] Error al cargar última sincronización:', e);
    }
  }

  /**
   * Obtener estado actual de sincronización
   */
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * Suscribirse a cambios de estado
   */
  subscribe(callback: (status: SyncStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.getStatus()));
  }

  /**
   * Generar datos de sincronización completos
   */
  async generateSyncData(): Promise<SyncData> {
    const ingredients = getExtendedIngredientDatabase();
    
    // Extraer todas las keywords del archivo de popover
    const keywords = this.extractKeywords();

    return {
      version: '1.0.0',
      timestamp: Date.now(),
      ingredients,
      organs: ORGANS_PATHOLOGIES_MAP,
      keywords,
      lastSync: Date.now()
    };
  }

  /**
   * Extraer keywords de ingredientes (simplificado)
   */
  private extractKeywords(): string[] {
    // Keywords comunes de ingredientes homeopáticos y fitoterapéuticos
    return [
      // Homeopatía
      'aconitum', 'apis', 'arnica', 'arsenicum', 'belladonna', 'bryonia', 'calcarea',
      'calendula', 'chamomilla', 'china', 'colocynthis', 'dulcamara', 'echinacea',
      'gelsemium', 'graphites', 'hamamelis', 'hepar', 'hyoscyamus', 'hypericum',
      'ignatia', 'iris', 'lachesis', 'ledum', 'lycopodium', 'mercurius', 'nux vomica',
      'phosphorus', 'pulsatilla', 'rhus toxicodendron', 'sepia', 'silicea', 'sulfur',
      'thuja', 'veratrum',
      // Fitoterapia
      'alcachofa', 'ashwagandha', 'cardo mariano', 'curcuma', 'equinacea', 'espino blanco',
      'ginkgo', 'ginseng', 'griffonia', 'jengibre', 'kava', 'l-teanina', 'maca',
      'melatonina', 'melisa', 'ortiga', 'pasiflora', 'propoleo', 'reishi', 'rodiola',
      'salvia', 'schisandra', 'tila', 'tomillo', 'valeriana', 'vitex',
      // Vitaminas y minerales
      'vitamina', 'calcio', 'cromo', 'hierro', 'magnesio', 'potasio', 'selenio', 'zinc',
      // Aminoácidos
      '5-htp', 'arginina', 'carnitina', 'creatina', 'gaba', 'glicina', 'glutamina',
      'lisina', 'nac', 'taurina', 'teanina', 'tirosina', 'triptofano',
      // Suplementos
      'astaxantina', 'coq10', 'colageno', 'omega-3', 'probióticos', 'quercetina',
      'resveratrol'
    ];
  }

  /**
   * Guardar datos localmente en IndexedDB
   */
  async saveLocal(data: SyncData): Promise<void> {
    if (!this.db) await this.initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ id: SYNC_KEY, ...data });

      request.onsuccess = () => {
        this.status.lastSync = data.timestamp;
        localStorage.setItem('lastSyncTimestamp', data.timestamp.toString());
        logger.info('[SyncService] Datos guardados localmente');
        resolve();
      };

      request.onerror = () => {
        logger.error('[SyncService] Error al guardar localmente:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Cargar datos desde IndexedDB
   */
  async loadLocal(): Promise<SyncData | null> {
    if (!this.db) await this.initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(SYNC_KEY);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          delete result.id;
          logger.info('[SyncService] Datos cargados desde local');
          resolve(result as SyncData);
        } else {
          logger.info('[SyncService] No hay datos locales');
          resolve(null);
        }
      };

      request.onerror = () => {
        logger.error('[SyncService] Error al cargar localmente:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Exportar datos a JSON para backup manual
   */
  async exportToJSON(): Promise<string> {
    const data = await this.generateSyncData();
    const json = JSON.stringify(data, null, 2);
    
    // Guardar también en IndexedDB
    await this.saveLocal(data);
    
    return json;
  }

  /**
   * Exportar y descargar archivo JSON
   */
  async downloadBackup(): Promise<void> {
    try {
      const json = await this.exportToJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `vademecum-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      logger.info('[SyncService] Backup descargado correctamente');
    } catch (error) {
      logger.error('[SyncService] Error al descargar backup:', error);
      throw error;
    }
  }

  /**
   * Importar datos desde archivo JSON
   */
  async importFromJSON(jsonString: string): Promise<void> {
    try {
      const data = JSON.parse(jsonString) as SyncData;
      
      // Validar estructura
      if (!data.version || !data.ingredients || !data.organs) {
        throw new Error('Archivo de backup inválido');
      }

      // Guardar localmente
      await this.saveLocal(data);
      
      logger.info('[SyncService] Backup importado correctamente');
    } catch (error) {
      logger.error('[SyncService] Error al importar backup:', error);
      throw error;
    }
  }

  /**
   * Sincronizar con la nube (implementación básica - usar Firebase/Supabase en producción)
   */
  async syncToCloud(): Promise<void> {
    if (!this.status.isOnline) {
      logger.info('[SyncService] Sin conexión - sync postergado');
      return;
    }

    if (this.status.syncInProgress) {
      logger.info('[SyncService] Sincronización en progreso...');
      return;
    }

    this.status.syncInProgress = true;
    this.status.error = null;
    this.notifyListeners();

    try {
      const data = await this.generateSyncData();
      
      // Guardar localmente primero
      await this.saveLocal(data);
      
      // En producción, aquí subiríamos a Firebase/Supabase:
      // await this.uploadToFirebase(data);
      
      // Por ahora, guardamos en localStorage como fallback
      try {
        localStorage.setItem('cloudSyncData', JSON.stringify(data));
        localStorage.setItem('cloudSyncTimestamp', Date.now().toString());
      } catch (e) {
        // localStorage podría estar lleno, no es crítico
        logger.warn('[SyncService] No se pudo guardar en localStorage:', e);
      }

      this.status.lastSync = data.timestamp;
      logger.info('[SyncService] Sincronización completada');
    } catch (error) {
      this.status.error = (error as Error).message;
      logger.error('[SyncService] Error en sincronización:', error);
      throw error;
    } finally {
      this.status.syncInProgress = false;
      this.notifyListeners();
    }
  }

  /**
   * Restaurar desde la nube
   */
  async restoreFromCloud(): Promise<SyncData | null> {
    if (!this.status.isOnline) {
      logger.info('[SyncService] Sin conexión - usando datos locales');
      return this.loadLocal();
    }

    try {
      // En producción, aquí descargaríamos de Firebase/Supabase:
      // const cloudData = await this.downloadFromFirebase();
      
      // Por ahora, intentamos desde localStorage
      const stored = localStorage.getItem('cloudSyncData');
      if (stored) {
        const data = JSON.parse(stored) as SyncData;
        await this.saveLocal(data);
        return data;
      }

      return this.loadLocal();
    } catch (error) {
      logger.error('[SyncService] Error al restaurar desde nube:', error);
      return this.loadLocal();
    }
  }

  /**
   * Obtener tamaño de datos almacenados
   */
  async getStorageSize(): Promise<{ local: number; cloud: number }> {
    let localSize = 0;
    let cloudSize = 0;

    try {
      // Tamaño en IndexedDB
      const localData = await this.loadLocal();
      if (localData) {
        localSize = new Blob([JSON.stringify(localData)]).size;
      }
    } catch (e) {
      logger.warn('[SyncService] Error al calcular tamaño local:', e);
    }

    try {
      // Tamaño en localStorage
      const cloudData = localStorage.getItem('cloudSyncData');
      if (cloudData) {
        cloudSize = new Blob([cloudData]).size;
      }
    } catch (e) {
      logger.warn('[SyncService] Error al calcular tamaño cloud:', e);
    }

    return {
      local: Math.round(localSize / 1024), // KB
      cloud: Math.round(cloudSize / 1024) // KB
    };
  }
}

export const syncService = SyncService.getInstance();
