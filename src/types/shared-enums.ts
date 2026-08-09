/**
 * Shared Enums
 * 
 * Tipos y enums compartidos entre el cliente (Dexie) y el servidor (Supabase).
 * Asegura consistencia de schema entre ambos lados de la sincronización.
 * 
 * @module types/shared-enums
 */

// ============================================
// BODY SYSTEMS (Sistemas Corporales)
// ============================================

export const BODY_SYSTEMS = [
  'nervioso',
  'digestivo',
  'inmune',
  'cardiovascular',
  'respiratorio',
  'musculoesqueletico',
  'endocrino',
  'dermatologico',
  'urinario',
  'reproductivo',
  'ocular',
  'hepatico',
  'metabolico',
] as const;

export type BodySystem = typeof BODY_SYSTEMS[number];

// Enums legacy para compatibilidad
export type LegacyBodySystem = 
  | 'nervioso' 
  | 'digestivo' 
  | 'inmune' 
  | 'cardiovascular' 
  | 'respiratorio' 
  | 'musculoesqueletico' 
  | 'endocrino';

export const LEGACY_BODY_SYSTEMS: LegacyBodySystem[] = [
  'nervioso',
  'digestivo',
  'inmune',
  'cardiovascular',
  'respiratorio',
  'musculoesqueletico',
  'endocrino',
];

// ============================================
// INGREDIENT CATEGORIES (Categorías de Ingredientes)
// ============================================

export const INGREDIENT_CATEGORIES = [
  'fitoterapia',
  'homeopatia',
  'aceite_esencial',
  'vitamina',
  'mineral',
  'aminoacido',
  'probiotico',
  'prebiotico',
  'enzima',
] as const;

export type IngredientCategory = typeof INGREDIENT_CATEGORIES[number];

// Mapping de Supabase (plural) a Local (singular)
export const CATEGORY_MAPPING: Record<string, IngredientCategory> = {
  // Supabase -> Local
  'fitoterapia': 'fitoterapia',
  'homeopatia': 'homeopatia',
  'aceite_esencial': 'aceite_esencial',
  'vitaminas': 'vitamina',
  'vitamina': 'vitamina',
  'minerales': 'mineral',
  'mineral': 'mineral',
  'aminoacidos': 'aminoacido',
  'aminoacido': 'aminoacido',
  'probioticos': 'probiotico',
  'probiotico': 'probiotico',
  'prebioticos': 'prebiotico',
  'prebiotico': 'prebiotico',
  'enzimas': 'enzima',
  'enzima': 'enzima',
  'otros': 'fitoterapia', // Default para 'otros'
};

// ============================================
// EVIDENCE LEVEL (Nivel de Evidencia)
// ============================================

export const EVIDENCE_LEVELS = ['A', 'B', 'C', 'D'] as const;
export type EvidenceLevel = typeof EVIDENCE_LEVELS[number];

// Mapping de diferentes formatos de evidencia
export const EVIDENCE_MAPPING: Record<string, EvidenceLevel> = {
  'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D',
  'alto': 'A', 'medio': 'B', 'bajo': 'C', 'critico': 'D',
  'high': 'A', 'medium': 'B', 'low': 'C',
  'strong': 'A', 'moderate': 'B', 'weak': 'C',
};

// ============================================
// SYNERGY TYPES (Tipos de Sinergia)
// ============================================

// Tipos locales
export const SYNERGY_TYPES_LOCAL = [
  'sinergia',
  'antagonismo',
  'interaccion',
  'complemento',
] as const;
export type SynergyTypeLocal = typeof SYNERGY_TYPES_LOCAL[number];

// Tipos de Supabase
export const SYNERGY_TYPES_REMOTE = [
  'potenciador',
  'complementario',
  'cofactor',
  'secuencial',
  'bioactivador',
] as const;
export type SynergyTypeRemote = typeof SYNERGY_TYPES_REMOTE[number];

// Todos los tipos posibles
export const SYNERGY_TYPES_ALL = [...SYNERGY_TYPES_LOCAL, ...SYNERGY_TYPES_REMOTE] as const;
export type SynergyType = typeof SYNERGY_TYPES_ALL[number];

// Mapping bidireccional
export const SYNERGY_TYPE_MAPPING: Record<string, SynergyType> = {
  // Local -> Remote
  'sinergia': 'potenciador',
  'antagonismo': 'bioactivador',
  'interaccion': 'cofactor',
  'complemento': 'complementario',
  // Remote -> Local (reverse)
  'potenciador': 'sinergia',
  'complementario': 'complemento',
  'cofactor': 'interaccion',
  'secuencial': 'interaccion',
  'bioactivador': 'antagonismo',
};

// ============================================
// SYNERGY LEVELS (Niveles de Sinergia)
// ============================================

export const SYNERGY_LEVELS = ['bajo', 'medio', 'alto', 'critico'] as const;
export type SynergyLevel = typeof SYNERGY_LEVELS[number];

// ============================================
// SAFETY STATUS (Estado de Seguridad)
// ============================================

export const SAFETY_STATUSES = ['apto', 'evitar', 'contraindicado', 'desconocido'] as const;
export type SafetyStatus = typeof SAFETY_STATUSES[number];

/**
 * Perfil de seguridad de un ingrediente por población especial.
 * Cada campo indica el estado de seguridad para esa población.
 * `undefined` significa "sin datos" (se trata como desconocido).
 */
export interface IngredientSafety {
  embarazo?: SafetyStatus;
  lactancia?: SafetyStatus;
  pediatria?: SafetyStatus;
  hipertension?: SafetyStatus;
  diabetes?: SafetyStatus;
  celiacos?: SafetyStatus;
}

/**
 * Tipo de snapshot cifrado de backup.
 * - 'full': snapshot completo de la KB.
 * - 'incremental': cambios desde el último snapshot.
 */
export const SNAPSHOT_TYPES = ['full', 'incremental'] as const;
export type SnapshotType = typeof SNAPSHOT_TYPES[number];

// ============================================
// PRODUCT SOURCE (Origen del Producto)
// ============================================

export const PRODUCT_SOURCES = ['local', 'scraped', 'supabase', 'seed'] as const;
export type ProductSource = typeof PRODUCT_SOURCES[number];

// ============================================
// SYNC STATUS (Estado de Sync)
// ============================================

export const OUTBOX_STATUSES = ['pending', 'in_flight', 'failed', 'synced', 'conflict'] as const;
export type OutboxStatus = typeof OUTBOX_STATUSES[number];

export const SYNC_OP_TYPES = ['insert', 'update', 'delete'] as const;
export type SyncOpType = typeof SYNC_OP_TYPES[number];

export const SYNC_TABLES = ['products', 'ingredients', 'synergies', 'protocols', 'settings'] as const;
export type SyncTable = typeof SYNC_TABLES[number];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Valida si un valor es un BodySystem válido
 */
export function isValidBodySystem(value: string): value is BodySystem {
  return BODY_SYSTEMS.includes(value as BodySystem);
}

/**
 * Valida si un valor es una IngredientCategory válida
 */
export function isValidIngredientCategory(value: string): value is IngredientCategory {
  return INGREDIENT_CATEGORIES.includes(value as IngredientCategory);
}

/**
 * Valida si un valor es un EvidenceLevel válido
 */
export function isValidEvidenceLevel(value: string): value is EvidenceLevel {
  return EVIDENCE_LEVELS.includes(value as EvidenceLevel);
}

/**
 * Valida si un valor es un SynergyLevel válido
 */
export function isValidSynergyLevel(value: string): value is SynergyLevel {
  return SYNERGY_LEVELS.includes(value as SynergyLevel);
}

/**
 * Normaliza un valor de categoría desde cualquier fuente
 */
export function normalizeCategory(value: string): IngredientCategory {
  const normalized = value.toLowerCase().trim();
  return CATEGORY_MAPPING[normalized] ?? 'fitoterapia';
}

/**
 * Normaliza un valor de sistema corporal
 */
export function normalizeBodySystem(value: string): BodySystem {
  const normalized = value.toLowerCase().trim();
  if (isValidBodySystem(normalized)) {
    return normalized;
  }
  // Si no es válido, intentar mapping
  const bodySystemMapping: Partial<Record<string, BodySystem>> = {
    'skin': 'dermatologico',
    'dermatologico': 'dermatologico',
    'urinary': 'urinario',
    'urinario': 'urinario',
    'reproductivo': 'reproductivo',
    'sexual': 'reproductivo',
    'ocular': 'ocular',
    'eye': 'ocular',
    'hepatico': 'hepatico',
    'liver': 'hepatico',
    'hepatic': 'hepatico',
    'metabolico': 'metabolico',
    'metabolic': 'metabolico',
  };
  return bodySystemMapping[normalized] ?? 'inmune';
}

/**
 * Normaliza el nivel de evidencia
 */
export function normalizeEvidenceLevel(value: string): EvidenceLevel {
  const normalized = value.toLowerCase().trim();
  return EVIDENCE_MAPPING[normalized] ?? 'C';
}

/**
 * Normaliza el tipo de sinergia
 */
export function normalizeSynergyType(value: string): SynergyType {
  const normalized = value.toLowerCase().trim();
  return SYNERGY_TYPE_MAPPING[normalized] ?? normalized as SynergyType;
}
