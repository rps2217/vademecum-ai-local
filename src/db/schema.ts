/**
 * VademecumDB - Schema de Dexie (IndexedDB)
 * 
 * Base de datos local principal para Vademecum AI.
 * Sistema local-first con sync opcional a Supabase.
 */

import Dexie, { type EntityTable } from 'dexie';

// ============================================
// VERSIÓN DE LA DB
// ============================================

export const DB_VERSION = 2;

// ============================================
// INTERFACES DE ENTIDADES
// ============================================

/** Producto de farmacia */
export interface DbProduct {
  sku: string;
  nombreComercial: string;
  fabricante?: string;
  principiosActivos: string[];
  categoria?: string;
  indicaciones: string[];
  contraindicaciones: string[];
  embarazo: SafetyStatus;
  lactancia: SafetyStatus;
  pediatria: SafetyStatus;
  hipertension: SafetyStatus;
  diabetes: SafetyStatus;
  celiacos: SafetyStatus;
  posologia?: string;
  source: ProductSource;
  sourceUrl?: string;
  embedding?: number[];
  data: Record<string, unknown>;
  // Metadatos de sync (Lamport clock)
  lamport: number;
  deviceId: string;
  updatedAt: number;
  createdAt: number;
  tombstone: 0 | 1;
}

/** Ingrediente de la base de conocimiento */
export interface DbIngredient {
  id: string;
  nombre: string;
  sinonimos: string[];
  categoria: IngredientCategory;
  familia?: string;
  sistemas: BodySystem[];
  indicaciones: string[];
  evidencia: EvidenceLevel;
  propiedades: string[];
  seguridad: IngredientSafety;
  interacciones: string[];
  fuentes: string[];
  embedding?: number[];
  // Metadatos de sync
  lamport: number;
  deviceId: string;
  updatedAt: number;
  createdAt: number;
  tombstone: 0 | 1;
}

/** Relación de sinergia entre ingredientes */
export interface DbSynergy {
  id: string;
  ingredienteA: string;
  ingredienteB: string;
  tipo: SynergyType;
  nivel: SynergyLevel;
  mecanismo?: string;
  evidencia: EvidenceLevel;
  descripcion?: string;
  fuentes: string[];
  // Metadatos de sync
  lamport: number;
  deviceId: string;
  updatedAt: number;
  tombstone: 0 | 1;
}

/** Protocolo de suplementación */
export interface DbProtocol {
  id: string;
  nombre: string;
  objetivo: string;
  ingredientes: ProtocolIngredient[];
  duracionDias: number;
  advertencias: string[];
  notas?: string;
  // Colaborativo
  ydoc?: Uint8Array;
  // Metadatos de sync
  lamport: number;
  deviceId: string;
  updatedAt: number;
  createdAt: number;
  tombstone: 0 | 1;
}

/** Operación pendiente de sync (outbox pattern) */
export interface DbOutboxOp {
  id: string;
  type: SyncOpType;
  table: SyncTable;
  recordId: string;
  payload: unknown;
  retries: number;
  lastError?: string;
  createdAt: number;
  status: OutboxStatus;
}

/** Snapshot cifrado de backup */
export interface DbSnapshot {
  id: string;
  type: SnapshotType;
  deviceId: string;
  timestamp: number;
  size: number;
  encryptedBlob: Uint8Array;
  nonce: Uint8Array;
  recipientPubKey: Uint8Array;
}

/** Metadatos de sincronización */
export interface DbSyncMeta {
  key: string;
  value: unknown;
  updatedAt: number;
}

/** Historial de búsquedas */
export interface DbSearchHistory {
  id: string;
  query: string;
  results: number;
  timestamp: number;
}

// ============================================
// TIPOS AUXILIARES
// ============================================

export type SafetyStatus = 'apto' | 'evitar' | 'contraindicado' | 'desconocido';
export type ProductSource = 'local' | 'scraped' | 'supabase' | 'seed';
export type IngredientCategory = 
  | 'fitoterapia' 
  | 'homeopatia' 
  | 'aceite_esencial' 
  | 'vitamina' 
  | 'mineral' 
  | 'probiotico' 
  | 'prebiotico' 
  | 'enzima' 
  | 'aminoacido';
export type BodySystem = 
  | 'nervioso' 
  | 'digestivo' 
  | 'inmune' 
  | 'cardiovascular' 
  | 'respiratorio' 
  | 'musculoesqueletico' 
  | 'endocrino';
export type EvidenceLevel = 'A' | 'B' | 'C' | 'D';
export type SynergyType = 'sinergia' | 'antagonismo' | 'interaccion' | 'complemento';
export type SynergyLevel = 'bajo' | 'medio' | 'alto' | 'critico';
export type SyncOpType = 'insert' | 'update' | 'delete';
export type SyncTable = 'products' | 'ingredients' | 'synergies' | 'protocols' | 'settings';
export type OutboxStatus = 'pending' | 'in_flight' | 'failed' | 'synced' | 'conflict';
export type SnapshotType = 'full' | 'products' | 'ingredients' | 'protocols';

export interface IngredientSafety {
  embarazo?: SafetyStatus;
  lactancia?: SafetyStatus;
  pediatria?: SafetyStatus;
}

export interface ProtocolIngredient {
  id: string;
  cantidad: string;
  momento: string;
}

// ============================================
// DEFINICIÓN DE LA BASE DE DATOS
// ============================================

export class VademecumDB extends Dexie {
  products!: EntityTable<DbProduct, 'sku'>;
  ingredients!: EntityTable<DbIngredient, 'id'>;
  synergies!: EntityTable<DbSynergy, 'id'>;
  protocols!: EntityTable<DbProtocol, 'id'>;
  outbox!: EntityTable<DbOutboxOp, 'id'>;
  snapshots!: EntityTable<DbSnapshot, 'id'>;
  syncMeta!: EntityTable<DbSyncMeta, 'key'>;
  searchHistory!: EntityTable<DbSearchHistory, 'id'>;

  constructor() {
    super('VademecumDB');

    // Migración desde versión 1 (schema corrupto)
    this.version(1).stores({});

    this.version(DB_VERSION).stores({
      // Primary keys y campos básicos
      products: 'sku, nombreComercial, categoria, source, updatedAt, tombstone',
      ingredients: 'id, nombre, categoria, updatedAt, tombstone, [nombre+categoria]',
      synergies: 'id, ingredienteA, ingredienteB, tipo, nivel, tombstone, [tipo+nivel]',
      protocols: 'id, updatedAt, tombstone',
      outbox: 'id, status, createdAt, table',
      snapshots: 'id, type, timestamp',
      syncMeta: 'key, updatedAt',
      searchHistory: 'id, timestamp',
    });
  }
}

// ============================================
// INSTANCIA SINGLETON
// ============================================

export const db = new VademecumDB();

// ============================================
// UTILIDADES DE DB
// ============================================

/**
 * Generar ID único
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Obtener timestamp actual
 */
export function now(): number {
  return Date.now();
}

/**
 * Hash para IDs de sinergia (determinista)
 */
export function synergyHash(a: string, b: string): string {
  const sorted = [a, b].sort();
  const str = sorted.join(':');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Obtener device ID (generado una vez y persistido)
 */
let _deviceId: string | null = null;

export function getDeviceId(): string {
  if (_deviceId) return _deviceId;
  
  const stored = localStorage.getItem('vademecum_device_id');
  if (stored) {
    _deviceId = stored;
    return _deviceId;
  }
  
  _deviceId = generateId();
  localStorage.setItem('vademecum_device_id', _deviceId);
  return _deviceId;
}

/**
 * Obtener siguiente Lamport clock
 */
let _lamport = 0;

export function nextLamport(): number {
  _lamport += 1;
  return _lamport;
}

export function updateLamport(received: number): number {
  _lamport = Math.max(_lamport, received) + 1;
  return _lamport;
}
// Alias para compatibilidad
export type Ingredient = DbIngredient;
export type Synergy = DbSynergy;
