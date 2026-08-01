/**
 * VademecumDB - Schema de Dexie (IndexedDB)
 * 
 * Base de datos local principal para Vademecum AI.
 * Sistema local-first con sync opcional a Supabase.
 */

import Dexie, { type EntityTable } from 'dexie';
import type {
  BodySystem,
  IngredientCategory,
  EvidenceLevel,
  SynergyType,
  SynergyLevel,
  SafetyStatus,
  ProductSource,
  SyncOpType,
  SyncTable,
  OutboxStatus,
  SnapshotType,
  IngredientSafety,
} from '@/types/shared-enums';
import { logger } from '@/lib/logger';

// Re-exportar tipos compartidos
export type {
  BodySystem,
  IngredientCategory,
  EvidenceLevel,
  SynergyType,
  SynergyLevel,
  SafetyStatus,
  ProductSource,
  SyncOpType,
  SyncTable,
  OutboxStatus,
  SnapshotType,
  IngredientSafety,
} from '@/types/shared-enums';

// ============================================
// VERSIÓN DE LA DB
// ============================================

export const DB_VERSION = 1;

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
  // Idempotency key para evitar duplicados
  idempotencyKey?: string;
  // Timestamp del último intento
  lastAttemptAt?: number;
}

/** Conflicto de sincronización */
export interface DbConflict {
  id: string;
  table: SyncTable;
  recordId: string;
  localVersion: Record<string, unknown>;
  remoteVersion: Record<string, unknown>;
  localLamport: number;
  remoteLamport: number;
  detectedAt: number;
  resolvedAt?: number;
  resolution?: 'local' | 'remote' | 'merged' | 'pending';
  resolvedBy?: string;
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

/** Audit log para compliance */
export interface DbAuditLog {
  id: string;
  timestamp: number;
  deviceId: string;
  userId?: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
  previousHash?: string;
  hash: string;
}

// ============================================
// DOMINIO: PACIENTES Y CONSULTAS
// ============================================

/** Paciente */
export interface DbPatient {
  id: string;
  nombre: string;
  apellidos?: string;
  fechaNacimiento?: number;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
  // Metadatos de sync
  lamport: number;
  deviceId: string;
  updatedAt: number;
  createdAt: number;
  tombstone: 0 | 1;
}

/** Alergia de paciente */
export interface DbPatientAllergy {
  id: string;
  pacienteId: string;
  sustancia: string; // Principio activo o sustancia
  severidad: AllergySeverity;
  notas?: string;
  // Metadatos de sync
  lamport: number;
  deviceId: string;
  updatedAt: number;
  createdAt: number;
  tombstone: 0 | 1;
}

/** Condición médica crónica */
export interface DbPatientCondition {
  id: string;
  pacienteId: string;
  condicion: string;
  diagnosticoFecha?: number;
  notas?: string;
  // Metadatos de sync
  lamport: number;
  deviceId: string;
  updatedAt: number;
  createdAt: number;
  tombstone: 0 | 1;
}

/** Medicamento actual del paciente */
export interface DbPatientMedication {
  id: string;
  pacienteId: string;
  nombre: string;
  principioActivo?: string;
  dosis?: string;
  frecuencia?: string;
  inicioFecha?: number;
  finFecha?: number;
  activo: boolean;
  // Metadatos de sync
  lamport: number;
  deviceId: string;
  updatedAt: number;
  createdAt: number;
  tombstone: 0 | 1;
}

/** Sesión de consulta */
export interface DbConsultation {
  id: string;
  pacienteId: string;
  fecha: number;
  motivo: string;
  notas: string;
  diagnostico?: string;
  duracionMinutos?: number;
  // Metadatos de sync
  lamport: number;
  deviceId: string;
  updatedAt: number;
  createdAt: number;
  tombstone: 0 | 1;
}

/** Producto recomendado en consulta */
export interface DbRecommendation {
  id: string;
  consultaId: string;
  productoSku?: string;
  ingredienteId?: string;
  nombre: string;
  cantidad?: string;
  instrucciones?: string;
  motivacion?: string;
  aceptado: boolean;
  // Metadatos de sync
  lamport: number;
  deviceId: string;
  updatedAt: number;
  createdAt: number;
  tombstone: 0 | 1;
}

/** Prescripción formal */
export interface DbPrescription {
  id: string;
  consultaId: string;
  pacienteId: string;
  fecha: number;
  instrucciones: string;
  validezDias?: number;
  // Metadatos de sync
  lamport: number;
  deviceId: string;
  updatedAt: number;
  createdAt: number;
  tombstone: 0 | 1;
}

// ============================================
// TIPOS AUXILIARES
// ============================================

export type AllergySeverity = 'leve' | 'moderada' | 'grave' | 'severa';

export type UserRole = 
  | 'admin_farmacia' 
  | 'farmaceutico' 
  | 'asistente' 
  | 'readonly_auditor';

export interface User {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
  farmaciaId?: string;
  createdAt: number;
  lastLoginAt?: number;
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
  conflicts!: EntityTable<DbConflict, 'id'>;
  snapshots!: EntityTable<DbSnapshot, 'id'>;
  syncMeta!: EntityTable<DbSyncMeta, 'key'>;
  searchHistory!: EntityTable<DbSearchHistory, 'id'>;
  auditLog!: EntityTable<DbAuditLog, 'id'>;
  
  // Dominio: Pacientes y Consultas
  patients!: EntityTable<DbPatient, 'id'>;
  patientAllergies!: EntityTable<DbPatientAllergy, 'id'>;
  patientConditions!: EntityTable<DbPatientCondition, 'id'>;
  patientMedications!: EntityTable<DbPatientMedication, 'id'>;
  consultations!: EntityTable<DbConsultation, 'id'>;
  recommendations!: EntityTable<DbRecommendation, 'id'>;
  prescriptions!: EntityTable<DbPrescription, 'id'>;

  constructor() {
    super('VademecumDB');

    // ============================================
    // MIGRACIONES
    // ============================================
    
    // Versión 1: Schema limpio - todas las tablas
    this.version(1).stores({
      products: 'sku, nombreComercial, categoria, source, updatedAt, tombstone',
      ingredients: 'id, nombre, categoria, updatedAt, tombstone',
      synergies: 'id, ingredienteA, ingredienteB, tipo, nivel, tombstone',
      protocols: 'id, updatedAt, tombstone',
      outbox: 'id, status, createdAt, table, idempotencyKey',
      conflicts: 'id, table, recordId, detectedAt',
      snapshots: 'id, type, timestamp',
      syncMeta: 'key, updatedAt',
      searchHistory: 'id, timestamp',
      auditLog: 'id, timestamp, hash',
      patients: 'id, nombre, updatedAt, tombstone',
      patientAllergies: 'id, pacienteId, updatedAt',
      patientConditions: 'id, pacienteId, updatedAt',
      patientMedications: 'id, pacienteId, activo, updatedAt',
      consultations: 'id, pacienteId, fecha, updatedAt',
      recommendations: 'id, consultaId, updatedAt',
      prescriptions: 'id, consultaId, pacienteId, fecha, updatedAt',
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
