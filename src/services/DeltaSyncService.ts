/**
 * Delta Sync Service - Sincronización Diferencial
 * Solo sincroniza lo que ha cambiado desde la última sincronización
 */

import { supabaseService } from './SupabaseService';
import knowledgeBaseData from '../data/knowledge-base.json';
import { logger } from './LoggerService';

export interface DeltaChange {
  id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data?: any;
  timestamp: number;
}

export interface DeltaSyncResult {
  success: boolean;
  changesDownloaded: number;
  changesUploaded: number;
  conflicts: number;
  error?: string;
}

export interface SyncCheckpoint {
  lastSyncTimestamp: number;
  localVersion: string;
  remoteVersion: string;
  pendingChanges: number;
}

interface KbIngredient {
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

interface KbData {
  version: string;
  description: string;
  lastUpdated: string;
  ingredients: KbIngredient[];
}

const CHECKPOINT_KEY = 'kb_delta_checkpoint';
const PENDING_CHANGES_KEY = 'kb_pending_changes';
const LOCAL_KB_DATA_KEY = 'kb_local_data';

class DeltaSyncService {
  private listeners: Set<(status: DeltaSyncStatus) => void> = new Set();
  private isSyncing = false;

  constructor() {}

  /**
   * Registrar listener para cambios de estado
   */
  addListener(callback: (status: DeltaSyncStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(status: DeltaSyncStatus): void {
    this.listeners.forEach(cb => cb(status));
  }

  /**
   * Obtener checkpoint de sincronización
   */
  getCheckpoint(): SyncCheckpoint | null {
    try {
      const stored = localStorage.getItem(CHECKPOINT_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Guardar checkpoint después de sincronización exitosa
   */
  private saveCheckpoint(checkpoint: SyncCheckpoint): void {
    localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(checkpoint));
  }

  /**
   * Obtener cambios pendientes locales
   */
  getPendingChanges(): DeltaChange[] {
    try {
      const stored = localStorage.getItem(PENDING_CHANGES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Agregar cambio pendiente
   */
  addPendingChange(change: DeltaChange): void {
    const pending = this.getPendingChanges();
    // Evitar duplicados - si ya existe un cambio para este ID, actualizarlo
    const existingIndex = pending.findIndex(c => c.id === change.id);
    if (existingIndex >= 0) {
      pending[existingIndex] = change;
    } else {
      pending.push(change);
    }
    localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(pending));
  }

  /**
   * Limpiar cambios pendientes después de sync exitosa
   */
  private clearPendingChanges(): void {
    localStorage.removeItem(PENDING_CHANGES_KEY);
  }

  /**
   * Sincronización delta completa
   * Solo transfiere lo que cambió desde la última sincronización
   */
  async sync(): Promise<DeltaSyncResult> {
    if (this.isSyncing) {
      return { success: false, changesDownloaded: 0, changesUploaded: 0, conflicts: 0, error: 'Ya hay sincronización en progreso' };
    }

    const client = supabaseService.getClient();
    if (!client) {
      return { success: false, changesDownloaded: 0, changesUploaded: 0, conflicts: 0, error: 'Supabase no configurado' };
    }

    this.isSyncing = true;
    this.notify({ phase: 'starting', progress: 0 });

    try {
      const checkpoint = this.getCheckpoint();
      const lastSync = checkpoint?.lastSyncTimestamp || 0;
      
      logger.info(`Última sincronización: ${new Date(lastSync).toISOString()}`, 'DeltaSync');

      // 1. OBTENER CAMBIOS REMOTOS (solo los modificados desde última sync)
      this.notify({ phase: 'downloading', progress: 10 });
      const remoteChanges = await this.fetchRemoteChanges(client, lastSync);
      logger.info(`${remoteChanges.length} cambios remotos detectados`, 'DeltaSync');

      // 2. RESOLVER CONFLICTOS Y APLICAR CAMBIOS LOCALES
      this.notify({ phase: 'resolving', progress: 40 });
      const { applied: appliedRemote, conflicts } = await this.applyRemoteChanges(remoteChanges);
      logger.info(`${appliedRemote} cambios remotos aplicados, ${conflicts} conflictos`, 'DeltaSync');

      // 3. SUBIR CAMBIOS LOCALES PENDIENTES
      this.notify({ phase: 'uploading', progress: 70 });
      const pendingChanges = this.getPendingChanges();
      const uploaded = await this.uploadPendingChanges(client, pendingChanges);
      logger.info(`${uploaded} cambios locales subidos`, 'DeltaSync');

      // 4. ACTUALIZAR CHECKPOINT
      this.notify({ phase: 'checkpoint', progress: 90 });
      const newCheckpoint: SyncCheckpoint = {
        lastSyncTimestamp: Date.now(),
        localVersion: (knowledgeBaseData as KbData).version,
        remoteVersion: await this.getRemoteVersion(client),
        pendingChanges: 0
      };
      this.saveCheckpoint(newCheckpoint);
      this.clearPendingChanges();

      this.notify({ phase: 'complete', progress: 100 });

      return {
        success: true,
        changesDownloaded: appliedRemote,
        changesUploaded: uploaded,
        conflicts
      };

    } catch (error: any) {
      logger.error('Error en sincronización delta', 'DeltaSync', error);
      this.notify({ phase: 'error', error: error.message });
      return { success: false, changesDownloaded: 0, changesUploaded: 0, conflicts: 0, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Obtener versión remota actual
   */
  private async getRemoteVersion(client: any): Promise<string> {
    try {
      const { data } = await client
        .from('kb_metadata')
        .select('version')
        .eq('id', 1)
        .single();
      return data?.version || '0';
    } catch {
      return '0';
    }
  }

  /**
   * Obtener cambios remotos desde la última sincronización
   * USA FILTRO DE TIMESTAMP para solo obtener lo que cambió
   */
  private async fetchRemoteChanges(client: any, since: number): Promise<KbIngredient[]> {
    try {
      // Solo obtener ingredientes modificados después de 'since'
      const { data, error } = await client
        .from('knowledge_base')
        .select('*')
        .gt('updated_at', new Date(since).toISOString());

      if (error) throw error;
      return data || [];
    } catch (e) {
      logger.error('Error fetchRemoteChanges', 'DeltaSync', e);
      return [];
    }
  }

  /**
   * Aplicar cambios remotos al almacenamiento local
   */
  private async applyRemoteChanges(remoteChanges: KbIngredient[]): Promise<{ applied: number; conflicts: number }> {
    if (remoteChanges.length === 0) {
      return { applied: 0, conflicts: 0 };
    }

    const localKb = this.getLocalKb();
    const localMap = new Map(localKb.ingredients.map(i => [i.id, i]));
    
    let applied = 0;
    let conflicts = 0;

    for (const remote of remoteChanges) {
      const local = localMap.get(remote.id);
      
      if (!local) {
        // Nuevo ingrediente del remoto - agregar
        localKb.ingredients.push(remote);
        applied++;
      } else {
        // Conflicto potencial - verificar timestamps
        const localTimestamp = new Date(local.updated_at || 0).getTime();
        const remoteTimestamp = new Date(remote.updated_at || 0).getTime();
        
        if (remoteTimestamp > localTimestamp) {
          // Remoto es más nuevo - actualizar local
          const index = localKb.ingredients.findIndex(i => i.id === remote.id);
          if (index >= 0) {
            localKb.ingredients[index] = remote;
            applied++;
          }
        } else {
          conflicts++;
        }
      }
    }

    // Guardar KB actualizada
    this.saveLocalKb(localKb);
    return { applied, conflicts };
  }

  /**
   * Subir cambios pendientes locales
   */
  private async uploadPendingChanges(client: any, changes: DeltaChange[]): Promise<number> {
    if (changes.length === 0) return 0;

    let uploaded = 0;

    for (const change of changes) {
      try {
        if (change.operation === 'DELETE') {
          await client
            .from('knowledge_base')
            .delete()
            .eq('id', change.id);
          uploaded++;
        } else if (change.data) {
          await client
            .from('knowledge_base')
            .upsert({
              ...change.data,
              updated_at: new Date(change.timestamp).toISOString()
            }, { onConflict: 'id' });
          uploaded++;
        }
      } catch (e) {
        logger.error(`Error subiendo cambio ${change.id}`, 'DeltaSync', e);
      }
    }

    return uploaded;
  }

  /**
   * Obtener KB local
   */
  getLocalKb(): KbData {
    try {
      const cached = localStorage.getItem(LOCAL_KB_DATA_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      logger.error('Error leyendo local KB', 'DeltaSync', e);
    }
    return knowledgeBaseData as KbData;
  }

  /**
   * Guardar KB local
   */
  private saveLocalKb(kb: KbData): void {
    localStorage.setItem(LOCAL_KB_DATA_KEY, JSON.stringify(kb));
  }

  /**
   * Marcar un ingrediente como modificado localmente
   */
  markIngredientModified(ingredientId: string, data: Partial<KbIngredient>): void {
    const change: DeltaChange = {
      id: ingredientId,
      operation: 'UPDATE',
      data: { ...data, id: ingredientId },
      timestamp: Date.now()
    };
    this.addPendingChange(change);
  }

  /**
   * Verificar si necesita sincronización
   */
  needsSync(): boolean {
    const checkpoint = this.getCheckpoint();
    if (!checkpoint) return true;
    
    // Necesita sync si han pasado más de 1 hora
    const hourAgo = Date.now() - 60 * 60 * 1000;
    return checkpoint.lastSyncTimestamp < hourAgo;
  }

  /**
   * Obtener estadísticas de sincronización
   */
  getSyncStats(): { lastSync: Date | null; pendingChanges: number; needsSync: boolean } {
    const checkpoint = this.getCheckpoint();
    return {
      lastSync: checkpoint ? new Date(checkpoint.lastSyncTimestamp) : null,
      pendingChanges: this.getPendingChanges().length,
      needsSync: this.needsSync()
    };
  }
}

export interface DeltaSyncStatus {
  phase: 'starting' | 'downloading' | 'resolving' | 'uploading' | 'checkpoint' | 'complete' | 'error';
  progress?: number;
  error?: string;
}

export const deltaSyncService = new DeltaSyncService();
export default deltaSyncService;
