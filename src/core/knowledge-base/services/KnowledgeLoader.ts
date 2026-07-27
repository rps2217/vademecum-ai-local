/**
 * KnowledgeLoader - Servicio de Carga de Datos
 * 
 * Carga modularmente los datos de las diferentes categorias
 * y proporciona una interfaz unificada para acceder a ellos.
 */

// Datos JSON
import fitoterapiaData from '../data/fitoterapia.json';
import homeopatiaData from '../data/homeopatia.json';
import aceitesData from '../data/aceites.json';
import vitaminasData from '../data/vitaminas_minerales.json';
import probioticosData from '../data/probioticos.json';
import enzimasData from '../data/enzimas.json';
import prebioticosData from '../data/prebioticos.json';
import aminoacidosData from '../data/aminoacidos.json';
import synergiesData from '../synergies/synergies.json';
import antagonismosData from '../data/antagonismos.json';

import type {
  IngredientCategory,
  BodySystem,
  Ingredient,
  SynergyRelation,
  AntagonismRelation,
} from '../data/schema';
import { logger } from '../../../services/LoggerService';

// Tipos para los datos JSON
interface KBCategoryData {
  metadata: { total: number };
  ingredientes: any[];
}

interface SynergiesData {
  metadata: { total: number };
  sinergias: any[];
}

interface AntagonismsData {
  metadata: { total: number };
  antagonismos: any[];
}

/**
 * KnowledgeLoader - Singleton para cargar y acceder a todos los datos
 */
class KnowledgeLoader {
  private static instance: KnowledgeLoader;
  
  // Datos cargados
  private ingredients: Map<string, any> = new Map();
  private synergies: SynergyRelation[] = [];
  private antagonisms: AntagonismRelation[] = [];
  
  // Índices para búsqueda rápida
  private byCategory: Map<string, any[]> = new Map();
  private bySystem: Map<string, any[]> = new Map();
  private byIndication: Map<string, any[]> = new Map();
  
  private loaded: boolean = false;

  private constructor() {}

  static getInstance(): KnowledgeLoader {
    if (!KnowledgeLoader.instance) {
      KnowledgeLoader.instance = new KnowledgeLoader();
    }
    return KnowledgeLoader.instance;
  }

  /**
   * Cargar todos los datos desde JSON
   */
  async load(): Promise<void> {
    if (this.loaded) return;

    try {
      // Cargar fitoterapia
      const fitoterapia = fitoterapiaData as KBCategoryData;
      fitoterapia.ingredientes?.forEach((ing: any) => {
        ing.categoria = 'fitoterapia';
        this.ingredients.set(ing.id, ing);
        this.indexIngredient(ing);
      });

      // Cargar homeopatia
      const homeopatia = homeopatiaData as KBCategoryData;
      homeopatia.ingredientes?.forEach((ing: any) => {
        ing.categoria = 'homeopatia';
        this.ingredients.set(ing.id, ing);
        this.indexIngredient(ing);
      });

      // Cargar aceites esenciales
      const aceites = aceitesData as KBCategoryData;
      aceites.ingredientes?.forEach((ing: any) => {
        ing.categoria = 'aceite_esencial';
        this.ingredients.set(ing.id, ing);
        this.indexIngredient(ing);
      });

      // Cargar vitaminas/minerales
      const vitaminas = vitaminasData as KBCategoryData;
      vitaminas.ingredientes?.forEach((ing: any) => {
        this.ingredients.set(ing.id, ing);
        this.indexIngredient(ing);
      });

      // Cargar probioticos
      const probioticos = probioticosData as KBCategoryData;
      probioticos.ingredientes?.forEach((ing: any) => {
        ing.categoria = 'probioticos';
        this.ingredients.set(ing.id, ing);
        this.indexIngredient(ing);
      });

      // Cargar enzimas digestivas
      const enzimas = enzimasData as KBCategoryData;
      enzimas.ingredientes?.forEach((ing: any) => {
        ing.categoria = 'enzimas';
        this.ingredients.set(ing.id, ing);
        this.indexIngredient(ing);
      });

      // Cargar prebioticos
      const prebioticos = prebioticosData as KBCategoryData;
      prebioticos.ingredientes?.forEach((ing: any) => {
        ing.categoria = 'prebioticos';
        this.ingredients.set(ing.id, ing);
        this.indexIngredient(ing);
      });

      // Cargar aminoacidos
      const aminoacidos = aminoacidosData as KBCategoryData;
      aminoacidos.ingredientes?.forEach((ing: any) => {
        ing.categoria = 'aminoacidos';
        this.ingredients.set(ing.id, ing);
        this.indexIngredient(ing);
      });

      // Cargar sinergias
      const synergies = synergiesData as SynergiesData;
      this.synergies = synergies.sinergias || [];

      // Cargar antagonismos
      const antagonismos = antagonismosData as AntagonismsData;
      this.antagonisms = antagonismos.antagonismos || [];

      this.loaded = true;
      logger.info(`Cargados ${this.ingredients.size} ingredientes`, 'KnowledgeLoader');
      logger.info(`Cargadas ${this.synergies.length} sinergias`, 'KnowledgeLoader');
      logger.info(`Cargados ${this.antagonisms.length} antagonismos`, 'KnowledgeLoader');
    } catch (error) {
      logger.error('Error cargando datos', 'KnowledgeLoader', error);
      throw error;
    }
  }

  /**
   * Indexar un ingrediente para búsqueda rápida
   */
  private indexIngredient(ingredient: any): void {
    const category = ingredient.categoria;
    
    // Por categoría
    if (!this.byCategory.has(category)) {
      this.byCategory.set(category, []);
    }
    this.byCategory.get(category)!.push(ingredient);

    // Por sistemas corporales
    if (ingredient.sistemas) {
      ingredient.sistemas.forEach((system: string) => {
        if (!this.bySystem.has(system)) {
          this.bySystem.set(system, []);
        }
        this.bySystem.get(system)!.push(ingredient);
      });
    }

    // Por indicaciones
    if (ingredient.indicaciones) {
      ingredient.indicaciones.forEach((indication: string) => {
        if (!this.byIndication.has(indication)) {
          this.byIndication.set(indication, []);
        }
        this.byIndication.get(indication)!.push(ingredient);
      });
    }
  }

  /**
   * Obtener todos los ingredientes
   */
  getAll(): any[] {
    return Array.from(this.ingredients.values());
  }

  /**
   * Obtener ingrediente por ID
   */
  getById(id: string): any | undefined {
    return this.ingredients.get(id);
  }

  /**
   * Buscar ingrediente por nombre
   */
  search(query: string): any[] {
    const normalized = query.toLowerCase().trim();
    const results: any[] = [];

    for (const ing of this.ingredients.values()) {
      // Buscar en nombre
      if (ing.nombre.toLowerCase().includes(normalized)) {
        results.push(ing);
        continue;
      }

      // Buscar en nombres alternativos
      if (ing.nombresAlternativos) {
        const found = ing.nombresAlternativos.some((alt: string) =>
          alt.toLowerCase().includes(normalized)
        );
        if (found) {
          results.push(ing);
          continue;
        }
      }

      // Buscar en nombre científico
      if (ing.nombreCientifico && ing.nombreCientifico.toLowerCase().includes(normalized)) {
        results.push(ing);
      }
    }

    return results;
  }

  /**
   * Obtener ingredientes por categoría
   */
  getByCategory(category: IngredientCategory): any[] {
    return this.byCategory.get(category) || [];
  }

  /**
   * Obtener ingredientes por sistema corporal
   */
  getBySystem(system: BodySystem): any[] {
    return this.bySystem.get(system) || [];
  }

  /**
   * Obtener ingredientes por indicación
   */
  getByIndication(indication: string): any[] {
    return this.byIndication.get(indication) || [];
  }

  /**
   * Obtener sinergias de un ingrediente
   */
  getSynergiesFor(ingredientId: string): SynergyRelation[] {
    return this.synergies.filter(
      s => s.ingredienteA === ingredientId || s.ingredienteB === ingredientId
    );
  }

  /**
   * Encontrar sinergia entre dos ingredientes
   */
  findSynergy(idA: string, idB: string): SynergyRelation | undefined {
    return this.synergies.find(
      s => (s.ingredienteA === idA && s.ingredienteB === idB) ||
           (s.ingredienteA === idB && s.ingredienteB === idA)
    );
  }

  /**
   * Obtener todas las sinergias
   */
  getAllSynergies(): SynergyRelation[] {
    return this.synergies;
  }

  /**
   * Obtener estadísticas
   */
  getStats(): {
    total: number;
    byCategory: Record<string, number>;
    bySystem: Record<string, number>;
    totalSynergies: number;
  } {
    const byCategory: Record<string, number> = {};
    const bySystem: Record<string, number> = {};

    this.byCategory.forEach((ings, cat) => {
      byCategory[cat] = ings.length;
    });

    this.bySystem.forEach((ings, sys) => {
      bySystem[sys] = ings.length;
    });

    return {
      total: this.ingredients.size,
      byCategory,
      bySystem,
      totalSynergies: this.synergies.length,
    };
  }

  /**
   * Sugerir combinaciones sinérgicas para un ingrediente
   */
  suggestSynergies(ingredientId: string, limit: number = 5): any[] {
    const sinergias = this.getSynergiesFor(ingredientId);
    
    return sinergias
      .map(s => {
        const partnerId = s.ingredienteA === ingredientId ? s.ingredienteB : s.ingredienteA;
        const partner = this.getById(partnerId);
        return {
          ingredient: partner,
          synergy: s,
        };
      })
      .filter(s => s.ingredient !== undefined)
      .slice(0, limit);
  }

  /**
   * Obtener antagonismos de un ingrediente
   */
  getAntagonismsFor(ingredientId: string): AntagonismRelation[] {
    return this.antagonisms.filter(
      a => a.ingredienteA === ingredientId || a.ingredienteB === ingredientId
    );
  }

  /**
   * Encontrar antagonismo entre dos ingredientes
   */
  findAntagonism(idA: string, idB: string): AntagonismRelation | undefined {
    return this.antagonisms.find(
      a => (a.ingredienteA === idA && a.ingredienteB === idB) ||
           (a.ingredienteA === idB && a.ingredienteB === idA)
    );
  }

  /**
   * Obtener todos los antagonismos
   */
  getAllAntagonisms(): AntagonismRelation[] {
    return this.antagonisms;
  }

  /**
   * Verificar si hay antagonismo entre dos ingredientes
   */
  hasAntagonism(idA: string, idB: string): AntagonismRelation | undefined {
    return this.findAntagonism(idA, idB);
  }

  /**
   * Sugerir alternativas seguras para un ingrediente que tiene antagonismo
   */
  suggestSafeAlternatives(ingredientId: string, limit: number = 5): any[] {
    const antagonismos = this.getAntagonismsFor(ingredientId);
    const antagonistsIds = antagonismos.map(a => 
      a.ingredienteA === ingredientId ? a.ingredienteB : a.ingredienteA
    );
    
    // Obtener ingredientes de la misma categoría que no tienen antagonismo
    const ingredient = this.getById(ingredientId);
    if (!ingredient) return [];
    
    const sameCategory = this.getByCategory(ingredient.categoria as IngredientCategory);
    return sameCategory
      .filter(ing => !antagonistsIds.includes(ing.id) && ing.id !== ingredientId)
      .slice(0, limit);
  }
}

// Exportar instancia singleton
export const knowledgeLoader = KnowledgeLoader.getInstance();

// Exportar tipos
export type { Ingredient, SynergyRelation, AntagonismRelation };
