/**
 * KnowledgeLoader - Servicio de Carga de Datos
 * 
 * Carga modularmente los datos de las diferentes categorias
 * y proporciona una interfaz unificada para acceder a ellos.
 */

import fitoterapiaData from '../data/fitoterapia.json';
import homeopatiaData from '../data/homeopatia.json';
import aceitesData from '../data/aceites.json';
import vitaminasData from '../data/vitaminas_minerales.json';
import synergiesData from '../synergies/synergies.json';

import type {
  IngredientCategory,
  BodySystem,
  Ingredient,
  SynergyRelation,
  AntagonismRelation,
} from '../data/schema';

// Tipos para los datos JSON
interface FitoterapiaData {
  metadata: { total: number };
  ingredientes: any[];
}

interface HomeopatiaData {
  metadata: { total: number };
  ingredientes: any[];
}

interface AceitesData {
  metadata: { total: number };
  ingredientes: any[];
}

interface VitaminasData {
  metadata: { total: number };
  ingredientes: any[];
}

interface SynergiesData {
  metadata: { total: number };
  sinergias: any[];
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
  private byCategory: Map<IngredientCategory, any[]> = new Map();
  private bySystem: Map<BodySystem, any[]> = new Map();
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
   * Cargar todos los datos
   */
  async load(): Promise<void> {
    if (this.loaded) return;

    try {
      // Cargar datos de fitoterapia
      const fitoterapia = fitoterapiaData as FitoterapiaData;
      fitoterapia.ingredientes.forEach(ing => {
        this.ingredients.set(ing.id, ing);
        this.indexByCategory(ing, 'fitoterapia');
      });

      // Cargar datos de homeopatia
      const homeopatia = homeopatiaData as HomeopatiaData;
      homeopatia.ingredientes.forEach(ing => {
        this.ingredients.set(ing.id, ing);
        this.indexByCategory(ing, 'homeopatia');
      });

      // Cargar datos de aceites
      const aceites = aceitesData as AceitesData;
      aceites.ingredientes.forEach(ing => {
        this.ingredients.set(ing.id, ing);
        this.indexByCategory(ing, 'aceite_esencial');
      });

      // Cargar datos de vitaminas/minerales
      const vitaminas = vitaminasData as VitaminasData;
      vitaminas.ingredientes.forEach(ing => {
        this.ingredients.set(ing.id, ing);
        this.indexByCategory(ing, ing.categoria);
      });

      // Cargar sinergias
      const synergies = synergiesData as SynergiesData;
      this.synergies = synergies.sinergias;

      // Indexar sinergias por ingrediente
      this.buildSynergyIndex();

      this.loaded = true;
      console.log(`[KnowledgeLoader] Cargados ${this.ingredients.size} ingredientes`);
    } catch (error) {
      console.error('[KnowledgeLoader] Error cargando datos:', error);
      throw error;
    }
  }

  /**
   * Indexar ingrediente por categoria
   */
  private indexByCategory(ingredient: any, category: IngredientCategory): void {
    if (!this.byCategory.has(category)) {
      this.byCategory.set(category, []);
    }
    this.byCategory.get(category)!.push(ingredient);

    // Indexar por sistemas
    if (ingredient.sistemas) {
      ingredient.sistemas.forEach((system: BodySystem) => {
        if (!this.bySystem.has(system)) {
          this.bySystem.set(system, []);
        }
        this.bySystem.get(system)!.push(ingredient);
      });
    }

    // Indexar por indicaciones
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
   * Construir índice de sinergias
   */
  private buildSynergyIndex(): void {
    // Por ahora las sinergias ya están indexadas por ID en el array
    // Podríamos agregar más índices si es necesario
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
}

// Exportar instancia singleton
export const knowledgeLoader = KnowledgeLoader.getInstance();

// Exportar tipos
export type { Ingredient, SynergyRelation, AntagonismRelation };
