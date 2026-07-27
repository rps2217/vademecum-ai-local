/**
 * Knowledge Service - Servicio Unificado de Conocimiento
 * Centraliza toda la lógica relacionada con la Knowledge Base
 */

import knowledgeBase from '../data/knowledge-base.json';
import { logger } from './LoggerService';

export interface KbIngredient {
  id: string;
  nombre: string;
  sinonimos: string[];
  familia: string;
  tipo: string;
  propiedades: string[];
  sinergias: string[];
  antagonismos: string[];
  contraindicaciones: string[];
  notas: string;
}

export interface SinergiaDetectada {
  ingrediente: string;
  kbId: string;
  tipo: 'sinergia' | 'antagonismo' | 'contraindicacion';
  producto: string;
  descripcion: string;
}

export interface ProductAnalysis {
  sku: string;
  nombre_comercial: string;
  cobertura_kb: number;
  ingredientes_kb: string[];
  sinergias: SinergiaDetectada[];
  antagonismos: SinergiaDetectada[];
  total_sinergias: number;
  total_antagonismos: number;
  recomendaciones: string[];
}

export interface KnowledgeStats {
  total: number;
  families: number;
  types: number;
}

interface KbData {
  version: string;
  description: string;
  lastUpdated: string;
  ingredients: KbIngredient[];
}

const kb = knowledgeBase as KbData;

// Función helper para analizar ingredientes
export function analyzeIngredients(ingredientIds: string[]): { found: string[]; missing: string[]; coverage: number } {
  const found: string[] = [];
  const missing: string[] = [];

  for (const id of ingredientIds) {
    const ing = findIngredientById(id);
    if (ing) {
      found.push(ing.id);
    } else {
      // Buscar por nombre aproximado
      const searchId = id.toLowerCase();
      let foundByName = false;
      for (const kbIng of kb.ingredients) {
        if (kbIng.nombre.toLowerCase().includes(searchId) || searchId.includes(kbIng.nombre.toLowerCase())) {
          found.push(kbIng.id);
          foundByName = true;
          break;
        }
      }
      if (!foundByName) missing.push(id);
    }
  }

  return {
    found,
    missing,
    coverage: ingredientIds.length > 0 ? (found.length / ingredientIds.length) * 100 : 0
  };
}

// Función helper para buscar ingrediente por ID
function findIngredientById(id: string): KbIngredient | null {
  return kb.ingredients.find(i => i.id.toLowerCase() === id.toLowerCase()) || null;
}

export class KnowledgeService {
  private ingredientMap: Map<string, KbIngredient> = new Map();
  private synonymMap: Map<string, KbIngredient> = new Map();
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.initialized) return;

    for (const ingredient of kb.ingredients) {
      this.ingredientMap.set(ingredient.id.toLowerCase(), ingredient);
      this.ingredientMap.set(ingredient.nombre.toLowerCase(), ingredient);
      
      for (const synonym of ingredient.sinonimos) {
        this.synonymMap.set(synonym.toLowerCase(), ingredient);
        this.ingredientMap.set(synonym.toLowerCase(), ingredient);
      }
    }

    this.initialized = true;
    logger.info(`Inicializado con ${kb.ingredients.length} ingredientes`, 'KnowledgeService');
  }

  findIngredient(searchTerm: string): KbIngredient | null {
    const normalized = searchTerm.toLowerCase().trim();
    return this.ingredientMap.get(normalized) || this.synonymMap.get(normalized) || null;
  }

  getIngredientById(id: string): KbIngredient | undefined {
    return findIngredientById(id) || undefined;
  }

  searchIngredients(query: string): KbIngredient[] {
    if (!query || query.trim().length === 0) return [];
    const normalized = query.toLowerCase().trim();
    return kb.ingredients.filter(ing =>
      ing.nombre.toLowerCase().includes(normalized) ||
      ing.sinonimos.some(s => s.toLowerCase().includes(normalized)) ||
      ing.id.toLowerCase().includes(normalized)
    );
  }

  analyzeProduct(product: { sku: string; nombre_comercial?: string; principios_activos?: string[] }): ProductAnalysis {
    const foundIngredients: string[] = [];
    const sinergias: SinergiaDetectada[] = [];
    const antagonismos: SinergiaDetectada[] = [];
    const kbIngredients: KbIngredient[] = [];

    if (product.principios_activos && product.principios_activos.length > 0) {
      for (const principio of product.principios_activos) {
        const kbIng = this.findIngredient(principio);
        if (kbIng) {
          foundIngredients.push(principio);
          kbIngredients.push(kbIng);
        }
      }
    }

    // Detectar sinergias y antagonismos
    for (let i = 0; i < kbIngredients.length; i++) {
      for (let j = i + 1; j < kbIngredients.length; j++) {
        const ing1 = kbIngredients[i];
        const ing2 = kbIngredients[j];

        if (ing1.sinergias.some(s => s.toLowerCase() === ing2.id.toLowerCase() || s.toLowerCase() === ing2.nombre.toLowerCase())) {
          sinergias.push({
            ingrediente: ing2.nombre,
            kbId: ing2.id,
            tipo: 'sinergia',
            producto: product.nombre_comercial || product.sku,
            descripcion: `${ing1.nombre} + ${ing2.nombre}: Sinergia conocida`
          });
        }

        if (ing1.antagonismos.some(a => a.toLowerCase() === ing2.id.toLowerCase() || a.toLowerCase() === ing2.nombre.toLowerCase())) {
          antagonismos.push({
            ingrediente: ing2.nombre,
            kbId: ing2.id,
            tipo: 'antagonismo',
            producto: product.nombre_comercial || product.sku,
            descripcion: `${ing1.nombre} + ${ing2.nombre}: Posible antagonismo`
          });
        }
      }
    }

    const recomendaciones: string[] = [];
    if (sinergias.length > 0) recomendaciones.push(`✨ Este producto tiene ${sinergias.length} sinergia(s) conocida(s)`);
    if (antagonismos.length > 0) recomendaciones.push(`⚠️ Este producto tiene ${antagonismos.length} posible(s) antagonismo(s)`);
    if (kbIngredients.length > 3) recomendaciones.push(`📋 Alta concentración de ingredientes KB (${kbIngredients.length})`);

    const cobertura_kb = product.principios_activos && product.principios_activos.length > 0
      ? Math.round((foundIngredients.length / product.principios_activos.length) * 100)
      : 0;

    return {
      sku: product.sku,
      nombre_comercial: product.nombre_comercial || '',
      cobertura_kb,
      ingredientes_kb: foundIngredients,
      sinergias,
      antagonismos,
      total_sinergias: sinergias.length,
      total_antagonismos: antagonismos.length,
      recomendaciones
    };
  }

  analyzeProductList(products: Array<{ sku: string; nombre_comercial?: string; principios_activos?: string[] }>): Map<string, ProductAnalysis> {
    const results = new Map<string, ProductAnalysis>();
    for (const product of products) {
      results.set(product.sku, this.analyzeProduct(product));
    }
    return results;
  }

  getAllIngredients(): KbIngredient[] {
    return kb.ingredients;
  }

  getByFamily(family: string): KbIngredient[] {
    return kb.ingredients.filter(i => i.familia.toLowerCase().includes(family.toLowerCase()));
  }

  getByType(tipo: string): KbIngredient[] {
    return kb.ingredients.filter(i => i.tipo.toLowerCase() === tipo.toLowerCase());
  }

  getSynergies(ingredientId: string): Array<{ from: string; to: string }> {
    const ingredient = this.findIngredient(ingredientId);
    if (!ingredient) return [];
    return ingredient.sinergias.map(synId => ({ from: ingredient.id, to: synId }));
  }

  getAntagonisms(ingredientId: string): Array<{ from: string; to: string }> {
    const ingredient = this.findIngredient(ingredientId);
    if (!ingredient) return [];
    return ingredient.antagonismos.map(antId => ({ from: ingredient.id, to: antId }));
  }

  getStats(): KnowledgeStats {
    const families = new Set(kb.ingredients.map(i => i.familia));
    const types = new Set(kb.ingredients.map(i => i.tipo));
    return { total: kb.ingredients.length, families: families.size, types: types.size };
  }

  getVersion(): string {
    return kb.metadata?.version || '1.0.0';
  }

  suggestSynergies(ingredients: string[]): Array<{ ing1: string; ing2: string; reason: string }> {
    const suggestions: Array<{ ing1: string; ing2: string; reason: string }> = [];
    const kbIngs = ingredients.map(i => this.findIngredient(i)).filter((i): i is KbIngredient => i !== null);

    for (const ing of kbIngs) {
      for (const synergyId of ing.sinergias) {
        const synergyIng = this.findIngredient(synergyId);
        if (synergyIng && !kbIngs.find(i => i.id === synergyIng.id)) {
          suggestions.push({ ing1: ing.nombre, ing2: synergyIng.nombre, reason: ing.notas || 'Sinergia clásica' });
        }
      }
    }
    return suggestions;
  }
}

export const knowledgeService = new KnowledgeService();
export default knowledgeService;
