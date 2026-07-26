/**
 * SyncService - Servicio de sincronización en la nube con soporte offline
 * Usa Supabase como fuente principal y IndexedDB como caché local
 */

import { logger } from './LoggerService';
import { getExtendedIngredientDatabase } from '../core/ingredient-database/ingredients';
import { ORGANS_PATHOLOGIES_MAP } from '../core/knowledge/organs-pathologies-map';
import { supabaseService } from './SupabaseService';

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
  isSupabaseConnected: boolean;
  lastSync: number;
  pendingChanges: number;
  syncInProgress: boolean;
  error: string | null;
  cloudIngredients: number;
  cloudOrgans: number;
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
    isSupabaseConnected: false,
    lastSync: 0,
    pendingChanges: 0,
    syncInProgress: false,
    error: null,
    cloudIngredients: 0,
    cloudOrgans: 0
  };
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  private constructor() {
    this.initDatabase();
    this.setupOnlineListener();
    this.loadLastSync();
    this.checkSupabaseConnection();
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
   * Verificar conexión a Supabase
   */
  private async checkSupabaseConnection(): Promise<void> {
    const connected = supabaseService.isConfigured();
    this.status.isSupabaseConnected = connected;
    
    if (connected) {
      await this.fetchCloudStats();
    }
    
    this.notifyListeners();
  }

  /**
   * Obtener estadísticas de la nube
   */
  private async fetchCloudStats(): Promise<void> {
    const supabase = supabaseService.getClient();
    if (!supabase) return;

    try {
      const [ingredientsResponse, organsResponse] = await Promise.all([
        supabase.from('extended_ingredients').select('*', { count: 'exact', head: true }),
        supabase.from('organs_pathologies').select('*', { count: 'exact', head: true })
      ]);

      this.status.cloudIngredients = ingredientsResponse.count || 0;
      this.status.cloudOrgans = organsResponse.count || 0;
    } catch (error) {
      logger.warn('[SyncService] Error al obtener estadísticas de cloud:', error);
    }
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
   * Verificar si Supabase está conectado
   */
  isSupabaseConfigured(): boolean {
    return supabaseService.isConfigured();
  }

  /**
   * Generar datos de sincronización completos
   */
  async generateSyncData(): Promise<SyncData> {
    const ingredients = getExtendedIngredientDatabase();
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
   * Extraer keywords de ingredientes
   */
  private extractKeywords(): string[] {
    return [
      'aconitum', 'apis', 'arnica', 'arsenicum', 'belladonna', 'bryonia', 'calcarea',
      'calendula', 'chamomilla', 'china', 'colocynthis', 'dulcamara', 'echinacea',
      'gelsemium', 'graphites', 'hamamelis', 'hepar', 'hyoscyamus', 'hypericum',
      'ignatia', 'iris', 'lachesis', 'ledum', 'lycopodium', 'mercurius', 'nux vomica',
      'phosphorus', 'pulsatilla', 'rhus toxicodendron', 'sepia', 'silicea', 'sulfur',
      'thuja', 'veratrum', 'alcachofa', 'ashwagandha', 'cardo mariano', 'curcuma',
      'equinacea', 'espino blanco', 'ginkgo', 'ginseng', 'griffonia', 'jengibre',
      'kava', 'l-teanina', 'maca', 'melatonina', 'melisa', 'ortiga', 'pasiflora',
      'propoleo', 'reishi', 'rodiola', 'salvia', 'schisandra', 'tila', 'tomillo',
      'valeriana', 'vitamina', 'calcio', 'cromo', 'hierro', 'magnesio', 'potasio',
      'selenio', 'zinc', '5-htp', 'arginina', 'carnitina', 'creatina', 'gaba',
      'glicina', 'glutamina', 'lisina', 'nac', 'taurina', 'teanina', 'tirosina',
      'triptofano', 'astaxantina', 'coq10', 'colageno', 'omega-3', 'probióticos',
      'quercetina', 'resveratrol'
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
   * Sincronizar datos a Supabase
   */
  async syncToCloud(): Promise<{ success: boolean; message: string }> {
    if (!this.status.isOnline) {
      return { success: false, message: 'Sin conexión a internet' };
    }

    if (!this.status.isSupabaseConnected) {
      return { success: false, message: 'Supabase no está configurado' };
    }

    if (this.status.syncInProgress) {
      return { success: false, message: 'Sincronización en progreso...' };
    }

    this.status.syncInProgress = true;
    this.status.error = null;
    this.notifyListeners();

    const supabase = supabaseService.getClient();
    if (!supabase) {
      this.status.syncInProgress = false;
      return { success: false, message: 'Cliente Supabase no disponible' };
    }

    try {
      const data = await this.generateSyncData();
      let syncedIngredients = 0;
      let syncedOrgans = 0;

      // Sincronizar ingredientes extendidos a Supabase
      const ingredients = Object.entries(data.ingredients);
      for (const [key, ingredient] of ingredients) {
        const record = {
          ingredient_key: key,
          name: (ingredient as any).name || key,
          scientific_name: (ingredient as any).scientificName || null,
          category: (ingredient as any).category || 'otro',
          origin_type: (ingredient as any).origin?.type || 'sintetico',
          origin_description: (ingredient as any).origin?.description || '',
          description: (ingredient as any).description || '',
          mechanism: (ingredient as any).mechanism || '',
          indications: (ingredient as any).indications || [],
          contraindications: (ingredient as any).contraindications || [],
          interactions: (ingredient as any).interactions || [],
          dosage: (ingredient as any).dosage || '',
          side_effects: (ingredient as any).sideEffects || [],
          synonyms: (ingredient as any).synonyms || [],
          warnings: (ingredient as any).warnings || []
        };

        const { error } = await supabase
          .from('extended_ingredients')
          .upsert(record, { onConflict: 'ingredient_key' });

        if (!error) syncedIngredients++;
      }

      // Sincronizar órganos y patologías a Supabase
      for (const organ of data.organs) {
        const record = {
          organ: organ.organ,
          aliases: organ.aliases,
          pathologies: organ.pathologies,
          categories: organ.categories,
          ingredients: organ.ingredients,
          description: organ.description
        };

        const { error } = await supabase
          .from('organs_pathologies')
          .upsert(record, { onConflict: 'organ' });

        if (!error) syncedOrgans++;
      }

      // Guardar metadatos de sincronización
      await supabase.from('sync_metadata').insert({
        version: data.version,
        last_sync: new Date(data.timestamp).toISOString(),
        ingredients_count: syncedIngredients,
        organs_count: syncedOrgans,
        keywords_count: data.keywords.length
      });

      // Guardar también localmente
      await this.saveLocal(data);

      // Actualizar estadísticas
      this.status.cloudIngredients = syncedIngredients;
      this.status.cloudOrgans = syncedOrgans;
      this.status.lastSync = data.timestamp;

      logger.info(`[SyncService] Sincronizado: ${syncedIngredients} ingredientes, ${syncedOrgans} órganos`);

      return {
        success: true,
        message: `Sincronizado: ${syncedIngredients} ingredientes, ${syncedOrgans} órganos`
      };

    } catch (error) {
      this.status.error = (error as Error).message;
      logger.error('[SyncService] Error en sincronización:', error);
      return {
        success: false,
        message: `Error: ${(error as Error).message}`
      };
    } finally {
      this.status.syncInProgress = false;
      this.notifyListeners();
    }
  }

  /**
   * Restaurar datos desde Supabase
   */
  async restoreFromCloud(): Promise<{ success: boolean; message: string }> {
    if (!this.status.isSupabaseConnected) {
      return { success: false, message: 'Supabase no está configurado' };
    }

    const supabase = supabaseService.getClient();
    if (!supabase) {
      return { success: false, message: 'Cliente Supabase no disponible' };
    }

    try {
      // Cargar ingredientes desde Supabase
      const { data: ingredients, error: ingError } = await supabase
        .from('extended_ingredients')
        .select('*');

      if (ingError) throw ingError;

      // Cargar órganos desde Supabase
      const { data: organs, error: orgError } = await supabase
        .from('organs_pathologies')
        .select('*');

      if (orgError) throw orgError;

      // Guardar localmente
      const data: SyncData = {
        version: '1.0.0',
        timestamp: Date.now(),
        ingredients: {},
        organs: [],
        keywords: this.extractKeywords(),
        lastSync: Date.now()
      };

      // Convertir ingredientes
      if (ingredients) {
        for (const ing of ingredients) {
          data.ingredients[ing.ingredient_key] = {
            name: ing.name,
            scientificName: ing.scientific_name,
            category: ing.category,
            origin: {
              type: ing.origin_type,
              description: ing.origin_description
            },
            description: ing.description,
            mechanism: ing.mechanism,
            indications: ing.indications || [],
            contraindications: ing.contraindications || [],
            interactions: ing.interactions || [],
            dosage: ing.dosage,
            sideEffects: ing.side_effects || [],
            synonyms: ing.synonyms || [],
            warnings: ing.warnings || []
          };
        }
      }

      // Convertir órganos
      if (organs) {
        data.organs = organs.map(o => ({
          organ: o.organ,
          aliases: o.aliases || [],
          pathologies: o.pathologies || [],
          categories: o.categories || [],
          ingredients: o.ingredients || [],
          description: o.description || ''
        }));
      }

      await this.saveLocal(data);
      this.status.lastSync = data.timestamp;

      return {
        success: true,
        message: `Restaurado: ${ingredients?.length || 0} ingredientes, ${organs?.length || 0} órganos`
      };

    } catch (error) {
      logger.error('[SyncService] Error al restaurar desde cloud:', error);
      return {
        success: false,
        message: `Error: ${(error as Error).message}`
      };
    }
  }

  /**
   * Exportar datos a JSON para backup manual
   */
  async exportToJSON(): Promise<string> {
    const data = await this.generateSyncData();
    const json = JSON.stringify(data, null, 2);
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
      
      if (!data.version || !data.ingredients || !data.organs) {
        throw new Error('Archivo de backup inválido');
      }

      await this.saveLocal(data);
      logger.info('[SyncService] Backup importado correctamente');
    } catch (error) {
      logger.error('[SyncService] Error al importar backup:', error);
      throw error;
    }
  }

  /**
   * Obtener tamaño de datos almacenados
   */
  async getStorageSize(): Promise<{ local: number; cloud: number }> {
    let localSize = 0;
    let cloudSize = 0;

    try {
      const localData = await this.loadLocal();
      if (localData) {
        localSize = new Blob([JSON.stringify(localData)]).size;
      }
    } catch (e) {
      logger.warn('[SyncService] Error al calcular tamaño local:', e);
    }

    try {
      // Calcular tamaño en Supabase
      const supabase = supabaseService.getClient();
      if (supabase) {
        const [ingResponse, orgResponse] = await Promise.all([
          supabase.from('extended_ingredients').select('*'),
          supabase.from('organs_pathologies').select('*')
        ]);
        
        const ingSize = ingResponse.data ? new Blob([JSON.stringify(ingResponse.data)]).size : 0;
        const orgSize = orgResponse.data ? new Blob([JSON.stringify(orgResponse.data)]).size : 0;
        cloudSize = ingSize + orgSize;
      }
    } catch (e) {
      logger.warn('[SyncService] Error al calcular tamaño cloud:', e);
    }

    return {
      local: Math.round(localSize / 1024),
      cloud: Math.round(cloudSize / 1024)
    };
  }
}

export const syncService = SyncService.getInstance();
