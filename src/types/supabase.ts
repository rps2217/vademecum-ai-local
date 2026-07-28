/**
 * Tipos para sincronizacion con Supabase
 */

/**
 * Ingrediente en formato Supabase (snake_case)
 */
export interface SupabaseIngredient {
  id: string;
  nombre: string;
  sinonimos: string[];
  categoria: string;
  familia?: string;
  sistemas: string[];
  indicaciones: string[];
  evidencia: 'A' | 'B' | 'C' | 'D';
  propiedades: string[];
  seguridad: {
    embarazo?: string;
    lactancia?: string;
    pediatria?: string;
  };
  interacciones: string[];
  fuentes: string[];
  lamport: number;
  device_id: string;
  updated_at: string;
  created_at: string;
  tombstone: 0 | 1;
}

/**
 * Sinergia en formato Supabase (snake_case)
 */
export interface SupabaseSynergy {
  id: string;
  ingrediente_a: string;
  ingrediente_b: string;
  tipo: 'sinergia' | 'complemento' | 'interaccion' | 'antagonismo';
  nivel: 'bajo' | 'medio' | 'alto' | 'critico';
  mecanismo?: string;
  evidencia: 'A' | 'B' | 'C' | 'D';
  descripcion?: string;
  fuentes: string[];
  lamport: number;
  device_id: string;
  updated_at: string;
  tombstone: 0 | 1;
}

/**
 * Metadata de sincronizacion
 */
export interface SupabaseSyncMeta {
  key: string;
  value: unknown;
  updated_at: string;
}

/**
 * Registro de sincronizacion para outbox
 */
export interface SyncRecord {
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  localTimestamp: number;
  deviceId: string;
}

/**
 * Resultado de sincronizacion
 */
export interface SyncResult {
  success: boolean;
  uploaded: number;
  downloaded: number;
  conflicts: number;
  error?: string;
  timestamp: number;
}

/**
 * Conflicto de sincronizacion
 */
export interface SyncConflict {
  localRecord: Record<string, unknown>;
  remoteRecord: Record<string, unknown>;
  table: string;
  recordId: string;
  localLamport: number;
  remoteLamport: number;
  resolution: 'local' | 'remote' | 'merge' | 'pending';
}

/**
 * Estado de conexion Supabase
 */
export interface SupabaseConnectionStatus {
  configured: boolean;
  connected: boolean;
  lastChecked: number;
  error?: string;
}

/**
 * Estadisticas de sync
 */
export interface SyncStats {
  pendingOps: number;
  lastSyncAt: number | null;
  totalUploaded: number;
  totalDownloaded: number;
  conflictCount: number;
}
