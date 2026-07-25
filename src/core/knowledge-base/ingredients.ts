/**
 * Base de Conocimiento Médico - Ingredientes
 */

// Re-exportar tipos
export * from './types';

// Re-exportar la base de conocimiento combinada
import { KNOWLEDGE_BASE_EXPANDED, getCombinedKnowledgeBase } from './ExpandedIngredients';
import type { IngredientInfo } from './types';

export const KNOWLEDGE_BASE = KNOWLEDGE_BASE_EXPANDED;
export { getCombinedKnowledgeBase };

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
export function getIngredientsByCategory(categoria: string): IngredientInfo[] {
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
export function checkSynergy(ingredientId1: string, ingredientId2: string) {
  const kb = getCombinedKnowledgeBase();
  const ing1 = kb[ingredientId1];
  if (!ing1) return undefined;
  
  return ing1.sinergias.find(s => s.ingrediente_id === ingredientId2);
}
