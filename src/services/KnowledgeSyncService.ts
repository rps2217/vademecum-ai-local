/**
 * Knowledge Sync Service
 * Sincroniza la base de conocimiento con Supabase usando sincronización delta
 */

import { supabaseService } from './SupabaseService';
import { deltaSyncService, DeltaSyncResult } from './DeltaSyncService';
import knowledgeBaseData from '../data/knowledge-base.json';
import { logger } from './LoggerService';

export interface KbIngredient {
  id: string;
  nombre: string;
  sinonimos: string[];
  familia: string;
  tipo: string;
  propiedades: string[];
  sinergias: string[];
  antagonismos: string[];
  contraindicaciones: string[];
  notas: string;
  created_at?: string;
  updated_at?: string;
}

export interface KbSyncMetadata {
  version: string;
  lastUpdated: string;
  totalIngredients: number;
  syncedAt: string;
  lastSyncTimestamp: number | null;
  pendingChanges: number;
}

interface KbData {
  version: string;
  description: string;
  lastUpdated: string;
  ingredients: KbIngredient[];
}

const LOCAL_KB_VERSION_KEY = 'kb_version';
const LOCAL_KB_DATA_KEY = 'kb_local_data';
const LAST_SYNC_KEY = 'kb_last_sync';

class KnowledgeSyncService {
  private isSyncing = false;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    this.loadFromLocalStorage();
    // Replicar eventos del DeltaSyncService
    deltaSyncService.addListener((status) => {
      if (status.phase === 'complete') {
        this.notifyListeners({ status: 'synced' });
      } else if (status.phase === 'error') {
        this.notifyListeners({ status: 'error', error: status.error });
      } else {
        this.notifyListeners({ 
          status: 'syncing', 
          progress: status.progress 
        });
      }
    });
  }

  /**
   * Registrar listener para cambios de estado de sincronización
   */
  addSyncListener(callback: (status: SyncStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(status: SyncStatus): void {
    this.listeners.forEach(callback => callback(status));
  }

  /**
   * Cargar KB desde localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const cached = localStorage.getItem(LOCAL_KB_DATA_KEY);
      if (cached) {
        const data = JSON.parse(cached) as KbData;
        logger.info(`KB cargada desde localStorage: ${data.ingredients.length} ingredientes`, 'KnowledgeSync');
      }
    } catch (e) {
      logger.error('Error cargando KB desde localStorage', 'KnowledgeSync', e);
    }
  }

  /**
   * Guardar KB en localStorage
   */
  private saveToLocalStorage(data: KbData): void {
    try {
      localStorage.setItem(LOCAL_KB_DATA_KEY, JSON.stringify(data));
      localStorage.setItem(LOCAL_KB_VERSION_KEY, data.version);
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      logger.info('KB guardada en localStorage', 'KnowledgeSync');
    } catch (e) {
      logger.error('Error guardando KB en localStorage', 'KnowledgeSync', e);
    }
  }

  /**
   * Obtener la versión local de la KB
   */
  getLocalVersion(): string | null {
    return localStorage.getItem(LOCAL_KB_VERSION_KEY);
  }

  /**
   * Obtener última fecha de sincronización
   */
  getLastSyncTime(): Date | null {
    const lastSync = localStorage.getItem(LAST_SYNC_KEY);
    return lastSync ? new Date(lastSync) : null;
  }

  /**
   * Obtener KB local (desde localStorage o bundle)
   */
  getLocalKb(): KbData {
    try {
      const cached = localStorage.getItem(LOCAL_KB_DATA_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      logger.error('Error leyendo localStorage', 'KnowledgeSync', e);
    }
    // Fallback a KB del bundle
    return knowledgeBaseData as KbData;
  }

  /**
   * Obtener todos los ingredientes (combina local con sync)
   */
  async getAllIngredients(): Promise<KbIngredient[]> {
    const kb = this.getLocalKb();
    return kb.ingredients;
  }

  /**
   * Obtener metadata de sincronización
   */
  getSyncMetadata(): KbSyncMetadata {
    const kb = this.getLocalKb();
    const deltaStats = deltaSyncService.getSyncStats();
    return {
      version: kb.version,
      lastUpdated: kb.lastUpdated,
      totalIngredients: kb.ingredients.length,
      syncedAt: this.getLastSyncTime()?.toISOString() || 'never',
      lastSyncTimestamp: deltaStats.lastSync?.getTime() || null,
      pendingChanges: deltaStats.pendingChanges
    };
  }

  /**
   * Sincronizar KB con Supabase usando DELTA SYNC
   * Solo sincroniza lo que ha cambiado desde la última sincronización
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, error: 'Ya hay una sincronización en progreso' };
    }

    this.isSyncing = true;
    this.notifyListeners({ status: 'syncing', progress: 0 });

    try {
      logger.info('Iniciando sincronización DELTA...', 'KnowledgeSync');
      
      // Usar el servicio de sincronización delta
      const deltaResult: DeltaSyncResult = await deltaSyncService.sync();

      if (deltaResult.success) {
        // Refrescar KB local después del sync
        const kb = this.getLocalKb();
        
        const result: SyncResult = {
          success: true,
          localVersion: kb.version,
          remoteVersion: kb.version,
          ingredientsCount: kb.ingredients.length,
          mergedAt: new Date().toISOString(),
          changesDownloaded: deltaResult.changesDownloaded,
          changesUploaded: deltaResult.changesUploaded,
          conflicts: deltaResult.conflicts
        };

        logger.success('Sincronización delta completada', 'KnowledgeSync');
        return result;
      } else {
        return { success: false, error: deltaResult.error };
      }

    } catch (error: any) {
      logger.error('Error en sincronización', 'KnowledgeSync', error);
      this.notifyListeners({ status: 'error', error: error.message });
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Forzar sincronización completa (no delta)
   * Útil para resolver problemas de consistencia
   */
  async fullSync(): Promise<SyncResult> {
    // Limpiar checkpoint para forzar sync completa
    localStorage.removeItem('kb_delta_checkpoint');
    return this.sync();
  }

  /**
   * Buscar ingrediente por ID
   */
  async findIngredient(id: string): Promise<KbIngredient | null> {
    const kb = this.getLocalKb();
    return kb.ingredients.find(ing => ing.id === id) || null;
  }

  /**
   * Buscar ingredientes por tipo/familia
   */
  async getByType(tipo: string): Promise<KbIngredient[]> {
    const kb = this.getLocalKb();
    return kb.ingredients.filter(ing => 
      ing.tipo.toLowerCase().includes(tipo.toLowerCase())
    );
  }

  async getByFamily(familia: string): Promise<KbIngredient[]> {
    const kb = this.getLocalKb();
    return kb.ingredients.filter(ing => 
      ing.familia.toLowerCase().includes(familia.toLowerCase())
    );
  }

  /**
   * Verificar si necesita sincronización
   */
  needsSync(): boolean {
    const client = supabaseService.getClient();
    if (!client) return false;
    return deltaSyncService.needsSync();
  }

  /**
   * Obtener estadísticas
   */
  getStats(): { total: number; families: number; types: number } {
    const kb = this.getLocalKb();
    const families = new Set(kb.ingredients.map(i => i.familia));
    const types = new Set(kb.ingredients.map(i => i.tipo));

    return {
      total: kb.ingredients.length,
      families: families.size,
      types: types.size
    };
  }

  /**
   * Obtener estado de sincronización delta
   */
  getDeltaSyncStats() {
    return deltaSyncService.getSyncStats();
  }
}

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'synced' | 'error';
  progress?: number;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  localVersion?: string;
  remoteVersion?: string;
  ingredientsCount?: number;
  mergedAt?: string;
  changesDownloaded?: number;
  changesUploaded?: number;
  conflicts?: number;
  error?: string;
}

export const knowledgeSyncService = new KnowledgeSyncService();
export default knowledgeSyncService;
