/**
 * Knowledge Service
 * Servicio para cruzar productos con la base de conocimiento fitoterapéutico
 */

import knowledgeBase from '../data/knowledge-base.json';

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

interface KbData {
  version: string;
  description: string;
  lastUpdated: string;
  ingredients: KbIngredient[];
}

const kb = knowledgeBase as KbData;

class KnowledgeService {
  private ingredientMap: Map<string, KbIngredient> = new Map();
  private synonymMap: Map<string, KbIngredient> = new Map();
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.initialized) return;

    for (const ingredient of kb.ingredients) {
      // Map por ID
      this.ingredientMap.set(ingredient.id.toLowerCase(), ingredient);
      
      // Map por nombre
      this.ingredientMap.set(ingredient.nombre.toLowerCase(), ingredient);
      
      // Map por sinónimos
      for (const synonym of ingredient.sinonimos) {
        this.synonymMap.set(synonym.toLowerCase(), ingredient);
        this.ingredientMap.set(synonym.toLowerCase(), ingredient);
      }
    }

    this.initialized = true;
    console.log(`[KnowledgeService] Inicializado con ${kb.ingredients.length} ingredientes`);
  }

  /**
   * Busca un ingrediente en la KB por nombre o sinónimo
   */
  findIngredient(searchTerm: string): KbIngredient | null {
    const normalized = searchTerm.toLowerCase().trim();
    
    // Buscar en mapas
    return this.ingredientMap.get(normalized) || this.synonymMap.get(normalized) || null;
  }

  /**
   * Analiza los principios activos de un producto contra la KB
   */
  analyzeProduct(product: { sku: string; nombre_comercial: string; principios_activos?: string[] }): ProductAnalysis {
    const foundIngredients: string[] = [];
    const sinergias: SinergiaDetectada[] = [];
    const antagonismos: SinergiaDetectada[] = [];
    const contraindicaciones: SinergiaDetectada[] = [];
    const kbIngredients: KbIngredient[] = [];

    // Analizar cada principio activo
    if (product.principios_activos && product.principios_activos.length > 0) {
      for (const principio of product.principios_activos) {
        const kbIng = this.findIngredient(principio);
        
        if (kbIng) {
          foundIngredients.push(principio);
          kbIngredients.push(kbIng);
        }
      }
    }

    // Detectar sinergias entre ingredientes KB
    for (let i = 0; i < kbIngredients.length; i++) {
      for (let j = i + 1; j < kbIngredients.length; j++) {
        const ing1 = kbIngredients[i];
        const ing2 = kbIngredients[j];

        // Verificar si ing1 sinergiza con ing2
        if (ing1.sinergias.some(s => 
          s.toLowerCase() === ing2.id.toLowerCase() || 
          s.toLowerCase() === ing2.nombre.toLowerCase()
        )) {
          sinergias.push({
            ingrediente: ing2.nombre,
            kbId: ing2.id,
            tipo: 'sinergia',
            producto: product.nombre_comercial || product.sku,
            descripcion: `${ing1.nombre} + ${ing2.nombre}: Sinergia conocida`
          });
        }

        // Verificar si ing1 antagoniza con ing2
        if (ing1.antagonismos.some(a => 
          a.toLowerCase() === ing2.id.toLowerCase() || 
          a.toLowerCase() === ing2.nombre.toLowerCase()
        )) {
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

    // Generar recomendaciones
    const recomendaciones: string[] = [];
    
    if (sinergias.length > 0) {
      recomendaciones.push(`✨ Este producto tiene ${sinergias.length} sinergia(s) conocida(s) con otros componentes`);
    }
    
    if (antagonismos.length > 0) {
      recomendaciones.push(`⚠️ Este producto tiene ${antagonismos.length} posible(s) antagonismo(s)`);
    }
    
    if (kbIngredients.length > 3) {
      recomendaciones.push(`📋 Alta concentración de ingredientes KB (${kbIngredients.length})`);
    }

    // Calcular cobertura KB (porcentaje de principios en KB)
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

  /**
   * Analiza una lista de productos y detecta sinergias cruzadas
   */
  analyzeProductList(products: Array<{ sku: string; nombre_comercial: string; principios_activos?: string[] }>): Map<string, ProductAnalysis> {
    const results = new Map<string, ProductAnalysis>();
    
    for (const product of products) {
      results.set(product.sku, this.analyzeProduct(product));
    }

    return results;
  }

  /**
   * Obtiene todos los ingredientes KB
   */
  getAllIngredients(): KbIngredient[] {
    return kb.ingredients;
  }

  /**
   * Busca ingredientes KB por familia
   */
  getByFamily(family: string): KbIngredient[] {
    return kb.ingredients.filter(i => 
      i.familia.toLowerCase().includes(family.toLowerCase())
    );
  }

  /**
   * Busca ingredientes KB por tipo
   */
  getByType(tipo: string): KbIngredient[] {
    return kb.ingredients.filter(i => 
      i.tipo.toLowerCase() === tipo.toLowerCase()
    );
  }

  /**
   * Obtiene estadísticas de la KB
   */
  getStats(): { total: number; familias: number; tipos: number } {
    const familias = new Set(kb.ingredients.map(i => i.familia));
    const tipos = new Set(kb.ingredients.map(i => i.tipo));

    return {
      total: kb.ingredients.length,
      familias: familias.size,
      tipos: tipos.size
    };
  }

  /**
   * Sugiere combinaciones sinérgicas basado en ingredientes
   */
  suggestSynergies(ingredients: string[]): Array<{ ing1: string; ing2: string; reason: string }> {
    const suggestions: Array<{ ing1: string; ing2: string; reason: string }> = [];
    const kbIngs = ingredients
      .map(i => this.findIngredient(i))
      .filter((i): i is KbIngredient => i !== null);

    for (const ing of kbIngs) {
      for (const synergyId of ing.sinergias) {
        const synergyIng = this.findIngredient(synergyId);
        if (synergyIng && !kbIngs.find(i => i.id === synergyIng.id)) {
          suggestions.push({
            ing1: ing.nombre,
            ing2: synergyIng.nombre,
            reason: ing.notas || `Sinergia clásica`
          });
        }
      }
    }

    return suggestions;
  }
}

export const knowledgeService = new KnowledgeService();
export default knowledgeService;
