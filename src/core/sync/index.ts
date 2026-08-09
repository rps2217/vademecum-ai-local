/**
 * Sync Module
 *
 * Sincronización offline-first con Supabase como backend opcional.
 * El hook useSync expone el estado; cuando Supabase no está configurado
 * (isSupabaseConfigured() === false), la app funciona 100% local.
 */

export { 
  SyncService, 
  syncService, 
  type SyncConfig, 
  type SyncStatus,
  type SyncResult 
} from './SyncService';

export { 
  ConflictResolver, 
  type ConflictInfo, 
  type ConflictResolution,
  type ConflictResolutionResult 
} from './ConflictResolver';
