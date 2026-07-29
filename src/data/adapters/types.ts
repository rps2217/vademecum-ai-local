/**
 * Tipos unificados para sync entre Dexie y Supabase
 */

import type { DbIngredient, DbSynergy, DbProtocol } from '@/db/schema';

/**
 * Estado de sincronización de un registro
 */
export type SyncStatus = 'synced' | 'pending_upload' | 'pending_download' | 'conflict';

/**
 * Dirección de sync
 */
export type SyncDirection = 'upload' | 'download' | 'bidirectional';

/**
 * Registro que puede ser sincronizado
 */
export interface SyncableRecord {
  localId: string;
  remoteId: string | null;
  syncStatus: SyncStatus;
  lamport: number;
  deviceId: string;
  updatedAt: number;
  tombstone: 0 | 1;
}

/**
 * Mapeo entre ID local y remoto
 */
export interface IdMapping {
  table: string;
  localId: string;
  remoteId: string;
  updatedAt: number;
}

/**
 * Ingrediente unificado
 */
export interface UnifiedIngredient {
  id: string;
  localId: string;
  remoteId: string;
  syncStatus: SyncStatus;

  // Datos
  key: string;
  name: string;
  scientificName?: string;
  category: string;
  origin?: {
    type: string;
    description: string;
  };
  description?: string;
  mechanism?: string;
  indications: string[];
  contraindications: string[];
  interactions: string[];
  dosage?: string;
  synonyms: string[];

  // Metadata
  lamport: number;
  deviceId: string;
  updatedAt: number;
  createdAt: number;
  tombstone: 0 | 1;
}

/**
 * Sinergia unificada
 */
export interface UnifiedSynergy {
  id: string;
  localId: string;
  remoteId: string;
  syncStatus: SyncStatus;

  ingredienteA: string;
  ingredienteB: string;
  tipo: 'sinergia' | 'antagonismo' | 'interaccion' | 'complemento';
  nivel: 'bajo' | 'medio' | 'alto' | 'critico';
  mecanismo?: string;
  evidencia: 'A' | 'B' | 'C' | 'D';
  descripcion?: string;
  fuentes: string[];

  lamport: number;
  deviceId: string;
  updatedAt: number;
  tombstone: 0 | 1;
}

/**
 * Protocolo unificado
 */
export interface UnifiedProtocol {
  id: string;
  localId: string;
  remoteId: string;
  syncStatus: SyncStatus;

  name: string;
  description?: string;
  category: string;
  objetivo: string;
  duracionDias: number;
  ingredients: ProtocolIngredient[];
  contraindicaciones: string[];
  advertencias: string[];
  evidenciaLevel: 'A' | 'B' | 'C' | 'D';

  lamport: number;
  deviceId: string;
  createdAt: number;
  updatedAt: number;
  tombstone: 0 | 1;
}

export interface ProtocolIngredient {
  id: string;
  cantidad: string;
  momento: string;
}

/**
 * Registro remoto de Supabase (ingredientes)
 */
export interface RemoteIngredient {
  id: string;
  ingredient_key: string;
  name: string;
  scientific_name?: string;
  category: string;
  origin_type?: string;
  origin_description?: string;
  description?: string;
  mechanism?: string;
  indications: string[];
  contraindications: string[];
  interactions: string[];
  dosage?: string;
  side_effects?: string;
  synonyms: string[];
  warnings?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Registro remoto de Supabase (sinergias)
 */
export interface RemoteSynergy {
  id: string;
  ingrediente1: string;
  ingrediente2: string;
  tipo_relacion: string;
  intensidad?: string;
  descripcion?: string;
  evidencia?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Registro remoto de Supabase (protocolos)
 */
export interface RemoteProtocol {
  id: string;
  name: string;
  description?: string;
  category: string;
  objetivo_principal?: string;
  duracion_dias: number;
  ingredients: RemoteProtocolIngredient[];
  contraindicaciones: string[];
  evidencia_level?: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface RemoteProtocolIngredient {
  nombre: string;
  dosis: string;
  momento: string;
}
