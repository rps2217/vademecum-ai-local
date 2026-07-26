/**
 * Knowledge Base - Índice de módulos
 * 
 * Punto de entrada unificado para acceder a todos los datos
 * de la base de conocimiento de Vademecum AI.
 * 
 * ARQUITECTURA MODULAR:
 * 
 * src/core/knowledge-base/
 * ├── data/                    # Datos estructurados (JSON)
 * │   ├── schema.ts           # Definición de tipos comunes
 * │   ├── fitoterapia.json     # Plantas medicinales
 * │   ├── homeopatia.json     # Remedios homeopáticos
 * │   ├── aceites.json       # Aceites esenciales
 * │   └── vitaminas_minerales.json
 * │
 * ├── synergies/              # Red de relaciones
 * │   └── synergies.json      # Sinergias curadas
 * │
 * ├── services/               # Servicios de datos
 * │   ├── KnowledgeLoader.ts  # Carga modular de datos
 * │   └── SynergyEngineV2.ts # Motor de detección de sinergias
 * │
 * └── index.ts               # Punto de entrada
 */

// Re-exportar types
export * from './types';

// Re-export ExpandedIngredients (base completa)
export * from './ExpandedIngredients';

// Re-export ingredients (compatibilidad)
export * from './ingredients';

// Re-export SynergyEngine
export * from './SynergyEngine';

// Re-export SynergyGraph
export * from './SynergyGraph';

// ==========================================
// BASES DE CONOCIMIENTO ESPECIALIZADAS
// ==========================================

// Fitoterapia - Plantas medicinales
export { PHYTOTHERAPY_DATABASE, getPhytotherapyByObjective, searchPhytotherapy, phytotherapyCount } from './PhytotherapyDatabase';

// Homeopatía - Remedios homeopáticos
export { HOMEOPATHY_DATABASE, getHomeopathyBySystem, searchHomeopathy, homeopathyCount } from './HomeopathyDatabase';

// Aromaterapia - Aceites esenciales
export { ESSENTIAL_OILS_DATABASE, getOilsByCategory, searchOils, oilsCount } from './EssentialOilsDatabase';

// ==========================================
// NUEVA ARQUITECTURA MODULAR (en desarrollo)
// ==========================================

// Servicios nuevos
export { knowledgeLoader, initializeKnowledgeBase, getKnowledgeStats, searchIngredients, getIngredient, analyzeSynergies } from './services/KnowledgeLoader';
export { synergyEngineV2 } from './services/SynergyEngineV2';

// Tipos de la nueva arquitectura
export type { SynergyResult, ProductSynergyAnalysis } from './services/SynergyEngineV2';
export type {
  IngredientCategory,
  BodySystem,
  Indication,
  EvidenceLevel,
  SynergyLevel,
  SynergyType,
  Ingredient,
  SynergyRelation,
  AntagonismRelation,
  BaseIngredient,
} from './data/schema';
