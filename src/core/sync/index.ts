/**
 * Sync Module
 * @deprecated Sync con Supabase es experimental - verificar uso real
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
