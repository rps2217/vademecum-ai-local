/**
 * Knowledge Sync Service
 * Sincroniza la base de conocimiento con Supabase para acceso multi-dispositivo y offline
 */

import { supabaseService } from './SupabaseService';
import knowledgeBaseData from '../data/knowledge-base.json';

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
}

export interface KbSyncMetadata {
  version: string;
  lastUpdated: string;
  totalIngredients: number;
  syncedAt: string;
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
        console.log('[KnowledgeSync] KB cargada desde localStorage:', data.ingredients.length, 'ingredientes');
      }
    } catch (e) {
      console.error('[KnowledgeSync] Error cargando desde localStorage:', e);
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
      console.log('[KnowledgeSync] KB guardada en localStorage');
    } catch (e) {
      console.error('[KnowledgeSync] Error guardando en localStorage:', e);
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
      console.error('[KnowledgeSync] Error leyendo localStorage:', e);
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
    return {
      version: kb.version,
      lastUpdated: kb.lastUpdated,
      totalIngredients: kb.ingredients.length,
      syncedAt: this.getLastSyncTime()?.toISOString() || 'never'
    };
  }

  /**
   * Sincronizar KB con Supabase
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, error: 'Ya hay una sincronización en progreso' };
    }

    const client = supabaseService.getClient();
    if (!client) {
      return { success: false, error: 'Supabase no está configurado' };
    }

    this.isSyncing = true;
    this.notifyListeners({ status: 'syncing', progress: 0 });

    try {
      console.log('[KnowledgeSync] Iniciando sincronización...');

      // 1. Obtener KB del bundle
      const bundleKb = knowledgeBaseData as KbData;
      
      // 2. Obtener versión de Supabase
      const { data: remoteMeta, error: metaError } = await client
        .from('kb_metadata')
        .select('*')
        .single();

      if (metaError && metaError.code !== 'PGRST116') {
        console.log('[KnowledgeSync] No existe metadata en Supabase, creando...');
        // Primera vez - crear estructura
        await this.initializeRemoteKb(client, bundleKb);
        this.notifyListeners({ status: 'syncing', progress: 50 });
      }

      // 3. Obtener ingredientes remotos
      const { data: remoteIngredients, error: ingredientsError } = await client
        .from('knowledge_base')
        .select('*');

      if (ingredientsError) {
        throw new Error('Error obteniendo ingredientes remotos');
      }

      this.notifyListeners({ status: 'syncing', progress: 75 });

      // 4. Combinar KB local con remota
      const mergedKb = this.mergeKnowledgeBases(bundleKb, remoteIngredients || []);
      
      // 5. Guardar localmente
      this.saveToLocalStorage(mergedKb);

      // 6. Actualizar Supabase con datos locales (si hay cambios)
      await this.pushLocalChanges(client, mergedKb);

      this.notifyListeners({ status: 'syncing', progress: 100 });

      const result: SyncResult = {
        success: true,
        localVersion: bundleKb.version,
        remoteVersion: remoteMeta?.version || bundleKb.version,
        ingredientsCount: mergedKb.ingredients.length,
        mergedAt: new Date().toISOString()
      };

      this.notifyListeners({ status: 'synced', ...result });
      console.log('[KnowledgeSync] Sincronización completada:', result);
      return result;

    } catch (error: any) {
      console.error('[KnowledgeSync] Error:', error);
      this.notifyListeners({ status: 'error', error: error.message });
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Inicializar estructura de KB en Supabase
   */
  private async initializeRemoteKb(client: any, kb: KbData): Promise<void> {
    try {
      // Crear metadata
      await client.from('kb_metadata').upsert({
        id: 1,
        version: kb.version,
        last_updated: kb.lastUpdated,
        description: kb.description
      });

      // Crear ingredientes
      const ingredientsToInsert = kb.ingredients.map(ing => ({
        id: ing.id,
        nombre: ing.nombre,
        sinonimos: ing.sinonimos,
        familia: ing.familia,
        tipo: ing.tipo,
        propiedades: ing.propiedades,
        sinergias: ing.sinergias,
        antagonismos: ing.antagonismos,
        contraindicaciones: ing.contraindicaciones,
        notas: ing.notas,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await client
        .from('knowledge_base')
        .upsert(ingredientsToInsert, { onConflict: 'id' });

      if (error) {
        console.error('[KnowledgeSync] Error inicializando remoto:', error);
      }

    } catch (e) {
      console.error('[KnowledgeSync] Error en inicialización:', e);
    }
  }

  /**
   * Combinar KBs local y remota
   */
  private mergeKnowledgeBases(local: KbData, remote: any[]): KbData {
    const merged = new Map<string, KbIngredient>();

    // Agregar ingredientes locales
    for (const ing of local.ingredients) {
      merged.set(ing.id, ing);
    }

    // Sobrescribir con datos remotos (más recientes)
    for (const remoteIng of remote) {
      const localIng = merged.get(remoteIng.id);
      
      if (!localIng) {
        // Nuevo ingrediente del remoto
        merged.set(remoteIng.id, {
          id: remoteIng.id,
          nombre: remoteIng.nombre,
          sinonimos: remoteIng.sinonimos || [],
          familia: remoteIng.familia,
          tipo: remoteIng.tipo,
          propiedades: remoteIng.propiedades || [],
          sinergias: remoteIng.sinergias || [],
          antagonismos: remoteIng.antagonismos || [],
          contraindicaciones: remoteIng.contraindicaciones || [],
          notas: remoteIng.notas || ''
        });
      } else {
        // Actualizar si remoto es más nuevo
        const localDate = new Date(localIng.notas ? Date.now() : 0);
        const remoteDate = new Date(remoteIng.updated_at || 0);
        
        if (remoteDate > localDate) {
          merged.set(remoteIng.id, {
            ...localIng,
            nombre: remoteIng.nombre || localIng.nombre,
            sinonimos: remoteIng.sinonimos || localIng.sinonimos,
            propiedades: remoteIng.propiedades || localIng.propiedades,
            sinergias: remoteIng.sinergias || localIng.sinergias,
            antagonismos: remoteIng.antagonismos || localIng.antagonismos,
            contraindicaciones: remoteIng.contraindicaciones || localIng.contraindicaciones,
            notas: remoteIng.notas || localIng.notas
          });
        }
      }
    }

    return {
      ...local,
      version: `${local.version}-merged-${Date.now()}`,
      ingredients: Array.from(merged.values())
    };
  }

  /**
   * Subir cambios locales a Supabase
   */
  private async pushLocalChanges(client: any, kb: KbData): Promise<void> {
    try {
      const ingredientsToUpsert = kb.ingredients.map(ing => ({
        id: ing.id,
        nombre: ing.nombre,
        sinonimos: ing.sinonimos,
        familia: ing.familia,
        tipo: ing.tipo,
        propiedades: ing.propiedades,
        sinergias: ing.sinergias,
        antagonismos: ing.antagonismos,
        contraindicaciones: ing.contraindicaciones,
        notas: ing.notas,
        updated_at: new Date().toISOString()
      }));

      await client
        .from('knowledge_base')
        .upsert(ingredientsToUpsert, { onConflict: 'id' });

      // Actualizar metadata
      await client.from('kb_metadata').update({
        version: kb.version,
        last_updated: kb.lastUpdated,
        updated_at: new Date().toISOString()
      }).eq('id', 1);

    } catch (e) {
      console.error('[KnowledgeSync] Error push changes:', e);
    }
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

    const lastSync = this.getLastSyncTime();
    if (!lastSync) return true;

    // Sincronizar si han pasado más de 1 hora
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return lastSync < hourAgo;
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
  error?: string;
}

export const knowledgeSyncService = new KnowledgeSyncService();
export default knowledgeSyncService;
