/**
 * ProductAdapter
 * Adapta productos entre Supabase (remote) y Dexie (local)
 */

import type { DbProduct } from '@/db/schema';
import { SafetyStatus, ProductSource } from '@/db/schema';
import { generateId, now, getDeviceId } from '@/db/schema';

// Tipo para datos remotos de Supabase
export interface RemoteProduct {
  sku: string;
  nombre_comercial: string | null;
  data: {
    sku?: string;
    tags_ia?: string[];
    vectores?: number[];
    posologia?: string;
    source_url?: string;
    descripcion?: string;
    advertencias?: string;
    indicaciones?: string[];
    principios_activos?: string[];
    categoria_principal?: string;
    is_verified?: boolean;
    verified_at?: string;
    verified_by?: string;
    last_updated?: string;
    locked_by_ai?: boolean;
    is_synced_cloud?: boolean;
    skus_relacionados?: string[];
    explicacion_clinica?: string;
    analisis_componentes?: Record<string, unknown>;
    anotaciones_componentes?: Record<string, unknown>;
    sugerencia_complementaria?: string;
    last_synergy_analysis?: number;
    updated_at_cloud?: string;
    last_synced_cloud?: string;
    // Campos de seguridad
    apt celiacos?: string;
    apt o_embarazo?: string;
    apt o_lactancia?: string;
    apt o_pediatria?: string;
    apt o_diabeticos?: string;
    apt o_hipertensos?: string;
    [key: string]: unknown;
  };
  last_updated?: string;
}

// Mapeo de strings de seguridad a SafetyStatus
function mapSafetyStatus(value: string | undefined): SafetyStatus {
  if (!value) return 'desconocido';
  const upper = value.toUpperCase();
  if (upper === 'SI' || upper === 'SÍ' || upper === 'APTO') return 'apto';
  if (upper === 'NO' || upper === 'EVITAR') return 'evitar';
  if (upper === 'CONTRAINDICADO') return 'contraindicado';
  return 'desconocido';
}

/**
 * Convierte producto de Supabase a formato local Dexie
 */
export function toLocal(remote: RemoteProduct): DbProduct {
  const data = remote.data || {};
  
  return {
    sku: remote.sku,
    nombreComercial: remote.nombre_comercial || data.nombre_comercial || remote.sku,
    fabricante: undefined, // No disponible en este schema
    principiosActivos: data.principios_activos || [],
    categoria: data.categoria_principal || '',
    indicaciones: data.indicaciones || [],
    contraindicaciones: [], // No disponible directamente
    embarazo: mapSafetyStatus(data.apto_embarazo),
    lactancia: mapSafetyStatus(data.apto_lactancia),
    pediatria: mapSafetyStatus(data.apto_pediatria),
    hipertension: mapSafetyStatus(data.apto_hipertensos),
    diabetes: mapSafetyStatus(data.apto_diabeticos),
    celiacos: mapSafetyStatus(data.apto_celiacos),
    posologia: data.posologia,
    source: 'supabase' as ProductSource,
    sourceUrl: data.source_url,
    embedding: data.vectores,
    data: data as Record<string, unknown>,
    // Metadatos de sync
    lamport: 1,
    deviceId: 'supabase',
    updatedAt: remote.last_updated 
      ? new Date(remote.last_updated).getTime() 
      : now(),
    createdAt: data.last_updated 
      ? new Date(data.last_updated).getTime() 
      : now(),
    tombstone: 0,
  };
}

/**
 * Convierte producto local Dexie a formato Supabase
 */
export function toRemote(local: DbProduct): {
  sku: string;
  nombre_comercial: string;
  data: Record<string, unknown>;
  last_updated: string;
} {
  return {
    sku: local.sku,
    nombre_comercial: local.nombreComercial,
    data: {
      ...local.data,
      sku: local.sku,
      nombre_comercial: local.nombreComercial,
      principios_activos: local.principiosActivos,
      categoria_principal: local.categoria,
      indicaciones: local.indicaciones,
      posologia: local.posologia,
      source_url: local.sourceUrl,
      vectores: local.embedding,
      apt o_celiacos: local.celiacos === 'apto' ? 'SI' : local.celiacos === 'evitar' ? 'NO' : undefined,
      apt o_embarazo: local.embarazo === 'apto' ? 'SI' : local.embarazo === 'evitar' ? 'NO' : undefined,
      apt o_lactancia: local.lactancia === 'apto' ? 'SI' : local.lactancia === 'evitar' ? 'NO' : undefined,
      apt o_pediatria: local.pediatria === 'apto' ? 'SI' : local.pediatria === 'evitar' ? 'NO' : undefined,
      apt o_diabeticos: local.diabetes === 'apto' ? 'SI' : local.diabetes === 'evitar' ? 'NO' : undefined,
      apt o_hipertensos: local.hipertension === 'apto' ? 'SI' : local.hipertension === 'evitar' ? 'NO' : undefined,
      last_updated: new Date().toISOString(),
    },
    last_updated: new Date().toISOString(),
  };
}

/**
 * Extrae ingredientes activos de un producto
 */
export function extractIngredients(product: RemoteProduct | DbProduct): string[] {
  if ('data' in product && product.data) {
    return (product.data as Record<string, unknown>).principios_activos as string[] || [];
  }
  if ('principiosActivos' in product) {
    return product.principiosActivos;
  }
  return [];
}

/**
 * Verifica si un producto tiene embeddings vectoriales
 */
export function hasEmbeddings(product: RemoteProduct | DbProduct): boolean {
  if ('data' in product && product.data) {
    const vectores = (product.data as Record<string, unknown>).vectores;
    return Array.isArray(vectores) && vectores.length > 0;
  }
  return Array.isArray(product.embedding) && product.embedding.length > 0;
}
