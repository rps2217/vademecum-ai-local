/**
 * Tipos TypeScript para el Schema de Supabase V2
 * 
 * Basado en: supabase/migrations/002_migration_products_v2.sql
 */

// ============================================
// PRODUCTOS V2
// ============================================

export interface ProductV2 {
  id: string;
  sku: string;
  nombre_comercial: string | null;
  
  // Datos principales
  descripcion: string | null;
  principios_activos: string[] | null;
  indicaciones: string[] | null;
  advertencias: string | null;
  posologia: string | null;
  marca: string | null;
  categoria: string | null;
  
  // Seguridad del paciente
  apto_celiacos: boolean;
  apto_embarazo: boolean;
  apto_lactancia: boolean;
  apto_pediatria: boolean;
  apto_diabeticos: boolean;
  alto_consumo_sodio: boolean;
  
  // IA y Análisis
  tags_ia: string[] | null;
  vectors: Buffer | null;
  vectors_dims: number;
  synergy_analyzed: boolean;
  sugerencia_complementaria: string | null;
  analysis_notes: Record<string, any> | null;
  
  // Seguridad
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  locked_by_ai: boolean;
  lock_timestamp: number | null;
  lock_uid: string | null;
  
  // SKUs relacionados
  skus_relacionados: string[] | null;
  source_url: string | null;
  
  // Sync
  is_synced_cloud: boolean;
  last_synced_cloud: string | null;
  
  // Estados
  is_active: boolean;
  is_featured: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
  last_updated: string | null;
}

// Versión ligera para búsqueda
export interface ProductV2Summary {
  id: string;
  sku: string;
  nombre_comercial: string | null;
  marca: string | null;
  principios_activos: string[] | null;
  sync_analyzed: boolean;
  is_verified: boolean;
}

// ============================================
// PROTOCOLS
// ============================================

export interface ProtocolPhase {
  fase: string;
  nombre: string;
  dias: string;
  ingredientes: ProtocolIngredient[];
  notas?: string;
}

export interface ProtocolIngredient {
  nombre: string;
  dosis: string;
  momento: string;
  duracion?: string;
  sku?: string;
}

export type ProtocolDifficulty = 'baja' | 'intermedia' | 'alta';
export type EvidenceLevel = 'A' | 'B' | 'C' | 'D';

export interface Protocol {
  id: string;
  
  // Identificación
  name: string;
  description: string | null;
  category: string | null;
  icon: string | null;
  color: string | null;
  
  // Objetivo
  objetivo_principal: string | null;
  duracion_dias: number | null;
  dificultad: ProtocolDifficulty;
  
  // Fases
  phases: ProtocolPhase[] | null;
  
  // Ingredientes
  ingredients: ProtocolIngredient[] | null;
  
  // Resultados esperados
  resultados_esperados: string[] | null;
  indicadores_seguir: string[] | null;
  
  // Precauciones
  contraindicaciones: string[] | null;
  advertencias: string | null;
  interacciones: string[] | null;
  
  // Evidencia
  evidencia_level: EvidenceLevel;
  referencias: string[] | null;
  estudios_clinicos: string[] | null;
  
  // Estados
  is_active: boolean;
  is_featured: boolean;
  is_verified: boolean;
  
  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
  version: number;
}

// Versión ligera para listados
export interface ProtocolSummary {
  id: string;
  name: string;
  category: string | null;
  objetivo_principal: string | null;
  duracion_dias: number | null;
  dificultad: ProtocolDifficulty;
  evidencia_level: EvidenceLevel;
  total_ingredientes: number;
  is_featured: boolean;
}

// ============================================
// SINERGIA Y ANTAGONISMOS
// ============================================

export type SynergyType = 'potenciador' | 'complementario' | 'cofactor' | 'secuencial' | 'bioactivador';
export type SeverityLevel = 'alta' | 'media' | 'baja';

export interface Synergy {
  id: string;
  ingredient_a_id: string;
  ingredient_b_id: string;
  ingredient_a_name?: string;
  ingredient_b_name?: string;
  synergy_type: SynergyType;
  evidence_level: EvidenceLevel;
  description: string | null;
  mechanism: string | null;
  benefits: string[] | null;
  precautions: string[] | null;
  dosage_notes: string | null;
  is_validated: boolean;
  validated_by: string | null;
  validated_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Antagonism {
  id: string;
  ingredient_a_id: string;
  ingredient_b_id: string;
  ingredient_a_name?: string;
  ingredient_b_name?: string;
  severity: SeverityLevel;
  description: string | null;
  mechanism: string | null;
  alternatives: string[] | null;
  references: string[] | null;
  is_validated: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// INGREDIENTS (existente)
// ============================================

export type IngredientCategory = 
  | 'fitoterapia' 
  | 'homeopatia' 
  | 'aceite_esencial'
  | 'vitaminas' 
  | 'minerales' 
  | 'aminoacidos' 
  | 'probioticos'
  | 'enzimas'
  | 'otros';

export type BodySystem = 
  | 'nervioso' 
  | 'digestivo' 
  | 'inmune' 
  | 'cardiovascular'
  | 'respiratorio' 
  | 'musculoesqueletico' 
  | 'endocrino'
  | 'dermatologico' 
  | 'urinario' 
  | 'reproductivo'
  | 'ocular' 
  | 'hepatico' 
  | 'metabolico';

export interface Ingredient {
  id: string;
  ingredient_key: string;
  name: string;
  scientific_name: string | null;
  family: string | null;
  category: IngredientCategory;
  description: string | null;
  mechanism: string | null;
  evidence_level: EvidenceLevel;
  origin_type: string | null;
  origin_description: string | null;
  search_terms: string[] | null;
  synonyms: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

// ============================================
// HELPERS
// ============================================

/**
 * Convierte "SI"/"NO" a boolean
 */
export function parseSafetyField(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  return value.toUpperCase() === 'SI';
}

/**
 * Convierte boolean a "SI"/"NO"
 */
export function safetyToString(value: boolean): 'SI' | 'NO' {
  return value ? 'SI' : 'NO';
}

/**
 * Genera un resumen de seguridad para mostrar
 */
export function getSafetySummary(product: Partial<ProductV2>): string[] {
  const warnings: string[] = [];
  
  if (!product.apto_embarazo) warnings.push('⚠️ No aptas para embarazo');
  if (!product.apto_lactancia) warnings.push('⚠️ No aptas para lactancia');
  if (!product.apto_pediatria) warnings.push('⚠️ No aptas para niños');
  if (!product.apto_diabeticos) warnings.push('⚠️ Precaución diabéticos');
  if (!product.apto_celiacos) warnings.push('⚠️ Contiene gluten');
  
  return warnings;
}

/**
 * Obtiene el color según nivel de evidencia
 */
export function getEvidenceColor(level: EvidenceLevel): string {
  switch (level) {
    case 'A': return 'emerald';  // Verde - sólido
    case 'B': return 'blue';    // Azul - bueno
    case 'C': return 'amber';   // Amarillo - moderado
    case 'D': return 'red';     // Rojo - limitado
    default: return 'gray';
  }
}

/**
 * Obtiene el icono según dificultad del protocolo
 */
export function getDifficultyIcon(difficulty: ProtocolDifficulty): string {
  switch (difficulty) {
    case 'baja': return '🟢';
    case 'intermedia': return '🟡';
    case 'alta': return '🔴';
    default: return '⚪';
  }
}

// ============================================
// LOGGING
// ============================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success' | 'ai';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  module: string;
  message: string;
  details?: any;
}
