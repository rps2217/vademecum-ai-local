/**
 * Knowledge Base - Índice de módulos
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
