/**
 * Tipos para la base de datos local
 */

import { SynergyResult } from '../knowledge-base/SynergyEngine';

export interface SynergyCache {
  /** Clave: producto1_sku_producto2_sku */
  id?: string;
  producto1_sku: string;
  producto2_sku: string;
  sinergias: SynergyResult[];
  nivel_promedio: 'alto' | 'medio' | 'bajo';
  fecha_analisis: number;
  analisis_completo: boolean;
  explicacion?: string;
}

export interface SyncMetadata {
  /** Timestamp Unix ms */
  last_sync: number;
  /** Contador de productos sincronizados */
  products_synced: number;
  /** Hash de versión para detectar cambios */
  version_hash: string;
  /** Estado de la última sincronización */
  status: 'success' | 'partial' | 'failed';
  /** Errores si hubo */
  errors?: string[];
}

export interface ConflictResolution {
  sku: string;
  local_version: any;
  remote_version: any;
  resolution: 'local' | 'remote' | 'merge';
  timestamp: number;
}

export interface DatabaseStats {
  total_products: number;
  local_only: number;
  synced: number;
  pending_sync: number;
  cached_synergies: number;
  last_sync: number | null;
  size_estimate: string;
}
