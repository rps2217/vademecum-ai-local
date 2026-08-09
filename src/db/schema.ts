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

/** Escala clínica validada (IPSS, PHQ-9, GAD-7, etc.) */
export interface EscalaClinica {
  nombre: string;                      // "IPSS (International Prostate Symptom Score)"
  uso: string;                          // qué mide y para qué sirve
  rango?: string;                       // "0-35 (leve 0-7, moderado 8-19, severo 20-35)"
  interpretacion?: string;              // puntos de corte y significado
}

/** Consideraciones en poblaciones especiales */
export interface PoblacionEspecial {
  poblacion: string;                    // "Embarazo", "Lactancia", "Pediatría", "Anciano", "Insuficiencia renal", "Insuficiencia hepática"
  consideraciones: string;              // precauciones, ajustes, contraindicaciones
}

/** Patología / condición clínica */
export interface DbPathology {
  id: string;                          // coincide con tag de indicaciones (ej: "ansiedad")
  nombre: string;                      // "Ansiedad generalizada"
  definicion: string;                  // definición clínica
  causas: string[];                    // factores etiológicos
  sintomas: string[];                  // cuadro clínico
  sistemas: BodySystem[];              // sistemas afectados
  tratamientoAlopatico: {
    primeraLinea: string[];            // tratamientos convencionales
    mecanismo: string;                 // cómo funcionan
    efectosSecundarios: string[];
  };
  tratamientoNatural: {
    fitoterapia: string[];             // IDs de ingredientes
    suplementos: string[];             // IDs de ingredientes
    homeopatia: string[];              // IDs de ingredientes
    aceites: string[];                 // IDs de ingredientes
    cuandoPreferir: string;            // cuándo preferir natural
  };
  prevencion: string[];                // hábitos, dieta
  cuandoConsultar: string;             // red flags
  // Contexto clínico extendido
  epidemiologia?: string;              // prevalencia, incidencia, demografía
  factoresRiesgo?: string[];           // factores de riesgo modificables y no
  diagnostico?: string;                // criterios diagnósticos y pruebas
  criteriosDiagnostico?: string[];     // criterios clínicos/analíticos
  escalasClinicas?: EscalaClinica[];   // escalas validadas (IPSS, PHQ-9, etc.)
  diagnosticoDiferencial?: string[];   // diagnósticos diferenciales
  pronostico?: string;                 // evolución y pronóstico
  poblacionesEspeciales?: PoblacionEspecial[]; // embarazo, pediatría, anciano, renal, hepático
  alertasFarmaceuticas?: string[];     // interacciones farmacológicas clave
  evidencia: EvidenceLevel;
  fuentes: string[];
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

// ============================================
// TIPOS AUXILIARES
// ============================================

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
  pathologies!: EntityTable<DbPathology, 'id'>;
  outbox!: EntityTable<DbOutboxOp, 'id'>;
  conflicts!: EntityTable<DbConflict, 'id'>;
  snapshots!: EntityTable<DbSnapshot, 'id'>;
  syncMeta!: EntityTable<DbSyncMeta, 'key'>;

  constructor() {
    super('VademecumDB');

    // ============================================
    // MIGRACIONES
    // ============================================

    this.version(1).stores({
      products: 'sku, nombreComercial, categoria, source, updatedAt, tombstone',
      ingredients: 'id, nombre, categoria, updatedAt, tombstone',
      synergies: 'id, ingredienteA, ingredienteB, tipo, nivel, tombstone',
      protocols: 'id, updatedAt, tombstone',
      outbox: 'id, status, createdAt, table, idempotencyKey',
      conflicts: 'id, table, recordId, detectedAt, resolution',
      snapshots: 'id, type, timestamp',
      syncMeta: 'key, updatedAt',
    });

    // v2: añade tabla pathologies para contexto clínico de patologías
    this.version(2).stores({
      products: 'sku, nombreComercial, categoria, source, updatedAt, tombstone',
      ingredients: 'id, nombre, categoria, updatedAt, tombstone',
      synergies: 'id, ingredienteA, ingredienteB, tipo, nivel, tombstone',
      protocols: 'id, updatedAt, tombstone',
      pathologies: 'id, nombre, updatedAt, tombstone',
      outbox: 'id, status, createdAt, table, idempotencyKey',
      conflicts: 'id, table, recordId, detectedAt, resolution',
      snapshots: 'id, type, timestamp',
      syncMeta: 'key, updatedAt',
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
 * Obtener siguiente Lamport clock.
 *
 * El Lamport clock se persiste en `syncMeta` para sobrevivir recargas de
 * página. Si la DB aún no se ha inicializado, usa el valor en memoria
 * (que se hidrata async en `initLamportFromDb`).
 */
let _lamport = 0;

export function nextLamport(): number {
  _lamport += 1;
  void persistLamport();
  return _lamport;
}

export function updateLamport(received: number): number {
  _lamport = Math.max(_lamport, received) + 1;
  void persistLamport();
  return _lamport;
}

/**
 * Hidrata el Lamport clock desde la DB al arrancar la app.
 * Debe llamarse una vez tras `db.open()`.
 */
export async function initLamportFromDb(): Promise<void> {
  const meta = await db.syncMeta.get('lamport_clock');
  const stored = (meta?.value as number) ?? 0;
  if (stored > _lamport) _lamport = stored;
}

async function persistLamport(): Promise<void> {
  try {
    await db.syncMeta.put({
      key: 'lamport_clock',
      value: _lamport,
      updatedAt: Date.now(),
    });
  } catch {
    // Ignorar errores de persistencia (la DB puede no estar abierta aún).
  }
}
// Alias para compatibilidad
export type Ingredient = DbIngredient;
export type Synergy = DbSynergy;
