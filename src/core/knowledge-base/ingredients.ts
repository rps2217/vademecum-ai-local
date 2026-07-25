/**
 * Base de Conocimiento Médico - Tipos y Utilidades
 */

// Tipos de datos
export interface IngredientInfo {
  id: string;
  nombre: string;
  nombre_latin?: string;
  categoria: IngredientCategory;
  descripcion: string;
  mecanismo_accion: string;
  beneficios: string[];
  fuentes_alimentarias?: string[];
  dosis_recomendada?: string;
  interacciones?: string[];
  contraindicaciones?: Contraindicacion[];
  sinergias: SynergyRelation[];
  antagonismos?: AntagonismRelation[];
  objetivos_salud: HealthObjective[];
}

export type IngredientCategory = 
  | 'vitaminas' 
  | 'minerales' 
  | 'aminoacidos' 
  | 'botanicos' 
  | 'enzimas' 
  | 'acidos_grasos' 
  | 'probioticos' 
  | 'antioxidantes'
  | 'extractos'
  | 'otros';

export interface Contraindicacion {
  condicion: string;
  nivel: 'absoluta' | 'relativa' | 'precaución';
  descripcion: string;
}

export type HealthObjective = 
  | 'inmunidad'
  | 'energia'
  | 'sueno'
  | 'articula'
  | 'cerebro'
  | 'deporte'
  | 'digestion'
  | 'corazon'
  | 'piel'
  | 'antiedad'
  | 'vision'
  | 'huesos'
  | 'peso'
  | 'fertilidad'
  | 'detox';

export interface SynergyRelation {
  ingrediente_id: string;
  tipo: 'potenciador' | 'complementario' | 'cofactor';
  descripcion: string;
  nivel: 'alto' | 'medio' | 'bajo';
}

export interface AntagonismRelation {
  ingrediente_id: string;
  tipo: 'competidor' | 'inhibidor' | 'bloqueador';
  descripcion: string;
  nivel: 'alto' | 'medio' | 'bajo';
}

// Importar la base combinada desde ExpandedIngredients
import { getCombinedKnowledgeBase } from './ExpandedIngredients';

// Re-exportar la base de conocimiento
export const KNOWLEDGE_BASE = getCombinedKnowledgeBase();

// Función de búsqueda
export function findIngredient(searchTerm: string): IngredientInfo | undefined {
  const normalized = searchTerm.toLowerCase().trim();
  const kb = getCombinedKnowledgeBase();
  
  if (kb[normalized]) {
    return kb[normalized];
  }
  
  for (const key of Object.keys(kb)) {
    const info = kb[key];
    if (info.nombre.toLowerCase().includes(normalized) || 
        (info.nombre_latin && info.nombre_latin.toLowerCase().includes(normalized))) {
      return info;
    }
  }
  
  return undefined;
}

// Obtener todos los ingredientes de una categoría
export function getIngredientsByCategory(categoria: IngredientCategory): IngredientInfo[] {
  const kb = getCombinedKnowledgeBase();
  return Object.values(kb).filter(i => i.categoria === categoria);
}

// Obtener sinergias de un ingrediente
export function getSynergies(ingredientId: string): IngredientInfo[] {
  const kb = getCombinedKnowledgeBase();
  const ingredient = kb[ingredientId];
  if (!ingredient) return [];
  
  return ingredient.sinergias
    .map(s => kb[s.ingrediente_id])
    .filter(Boolean);
}

// Verificar si dos ingredientes tienen sinergia
export function checkSynergy(ingredientId1: string, ingredientId2: string): SynergyRelation | undefined {
  const kb = getCombinedKnowledgeBase();
  const ing1 = kb[ingredientId1];
  if (!ing1) return undefined;
  
  return ing1.sinergias.find(s => s.ingrediente_id === ingredientId2);
}
