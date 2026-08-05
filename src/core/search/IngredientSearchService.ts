/**
 * Ingredient Search Service
 * Busqueda de ingredientes en la base de datos local.
 */

import { db } from '@/db';
import type { DbIngredient, IngredientCategory, BodySystem } from '@/db/schema';

export interface SearchFilters {
  query?: string;
  category?: IngredientCategory;
  system?: BodySystem;
  evidenceLevel?: 'A' | 'B' | 'C' | 'D';
}

export interface SearchResult {
  ingredient: DbIngredient;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'synonym';
}

export class IngredientSearchService {
  async search(filters: SearchFilters): Promise<SearchResult[]> {
    const { query, category, system, evidenceLevel } = filters;
    
    let ingredients = await db.ingredients.toArray();
    
    if (category) {
      ingredients = ingredients.filter(i => i.categoria === category);
    }
    
    if (system) {
      ingredients = ingredients.filter(i => i.sistemas.includes(system));
    }
    
    if (evidenceLevel) {
      ingredients = ingredients.filter(i => i.evidencia === evidenceLevel);
    }
    
    if (!query || query.trim() === '') {
      return ingredients.map(i => ({
        ingredient: i,
        score: 1,
        matchType: 'exact' as const,
      }));
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    
    const results: SearchResult[] = ingredients.map(ingredient => {
      if (
        ingredient.id.toLowerCase() === normalizedQuery ||
        ingredient.nombre.toLowerCase() === normalizedQuery
      ) {
        return { ingredient, score: 100, matchType: 'exact' as const };
      }
      
      if (ingredient.sinonimos.some(s => 
        s.toLowerCase().includes(normalizedQuery)
      )) {
        return { ingredient, score: 80, matchType: 'synonym' as const };
      }
      
      if (ingredient.nombre.toLowerCase().includes(normalizedQuery)) {
        return { ingredient, score: 60, matchType: 'fuzzy' as const };
      }
      
      if (ingredient.indicaciones.some(ind => 
        ind.toLowerCase().includes(normalizedQuery)
      )) {
        return { ingredient, score: 40, matchType: 'fuzzy' as const };
      }
      
      if (ingredient.propiedades.some(prop => 
        prop.toLowerCase().includes(normalizedQuery)
      )) {
        return { ingredient, score: 20, matchType: 'fuzzy' as const };
      }
      
      return null;
    }).filter((r): r is SearchResult => r !== null);
    
    results.sort((a, b) => b.score - a.score);
    return results;
  }
}

export const ingredientSearchService = new IngredientSearchService();
