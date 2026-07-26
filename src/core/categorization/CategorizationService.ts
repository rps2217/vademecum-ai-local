/**
 * CategorizationService - Deriva categorías para productos desde la KB
 */

import type { Product } from '../../types';
import type { KbIngredient } from '../../types';
import { 
  PRODUCT_TYPES, 
  THERAPEUTIC_FUNCTIONS,
  BODY_SYSTEMS,
  KB_FAMILY_TO_TYPE,
  KB_PROPERTY_TO_FUNCTION,
  type ProductType,
  type TherapeuticFunction,
  type BodySystem,
} from './categories';

export interface ProductCategories {
  type: ProductType | null;
  functions: TherapeuticFunction[];
  systems: BodySystem[];
  inferredFrom: string[];
}

class CategorizationService {
  /**
   * Derivar categorías para un producto basándose en sus principios activos
   */
  categorizeProduct(product: Product, kb: Record<string, KbIngredient>): ProductCategories {
    const functions = new Set<TherapeuticFunction>();
    const systems = new Set<BodySystem>();
    const inferredFrom: string[] = [];
    let type: ProductType | null = null;

    const principios = product.principios_activos || [];

    for (const principio of principios) {
      const kbKey = principio.toLowerCase();
      const ingredient = kb[kbKey] || kb[principio];

      if (ingredient) {
        // Derivar tipo desde familia
        const familia = ingredient.familia?.toLowerCase();
        if (familia && KB_FAMILY_TO_TYPE[familia]) {
          type = KB_FAMILY_TO_TYPE[familia];
          inferredFrom.push(`${principio} → ${familia}`);
        }

        // Derivar funciones desde propiedades
        const propiedades = ingredient.propiedades || [];
        for (const prop of propiedades) {
          const propKey = prop.toLowerCase();
          if (KB_PROPERTY_TO_FUNCTION[propKey]) {
            functions.add(KB_PROPERTY_TO_FUNCTION[propKey]);
          }
        }

        // Derivar sistemas desde tipo
        const tipo = ingredient.tipo?.toLowerCase();
        if (tipo) {
          const system = this.tipoToSystem(tipo);
          if (system) {
            systems.add(system);
          }
        }

        // Agregar sinergias/antagonismos
        if (ingredient.sinergias?.length) {
          inferredFrom.push(`${principio}: ${ingredient.sinergias.length} sinergias`);
        }
      }
    }

    // Si no se encontró tipo, intentar inferir desde categoría existente
    if (!type && product.categoria_principal) {
      type = this.inferTypeFromCategory(product.categoria_principal);
    }

    return {
      type,
      functions: Array.from(functions),
      systems: Array.from(systems),
      inferredFrom,
    };
  }

  /**
   * Inferir tipo de producto desde categoría existente
   */
  private inferTypeFromCategory(categoria: string): ProductType | null {
    const cat = categoria.toLowerCase();
    
    if (cat.includes('vitamina') || cat.includes('mineral') || cat.includes('planta') || cat.includes('fitoterap')) {
      return PRODUCT_TYPES.FITOTERAPIA;
    }
    if (cat.includes('homeopat')) {
      return PRODUCT_TYPES.HOMEOPATIA;
    }
    if (cat.includes('suplemento') || cat.includes('proteina') || cat.includes('aminoacido')) {
      return PRODUCT_TYPES.SUPLEMENTO;
    }
    if (cat.includes('dispositivo') || cat.includes('instrumento')) {
      return PRODUCT_TYPES.DISPOSITIVO;
    }
    if (cat.includes('cosmetico') || cat.includes('dermatico')) {
      return PRODUCT_TYPES.COSMETICO;
    }
    if (cat.includes('medicamento') || cat.includes('farmaco')) {
      return PRODUCT_TYPES.MEDICAMENTO;
    }
    
    return null;
  }

  /**
   * Convertir tipo de ingrediente a sistema corporal
   */
  private tipoToSystem(tipo: string): BodySystem | null {
    const t = tipo.toLowerCase();
    
    if (t.includes('musculo') || t.includes('hueso') || t.includes('articul')) {
      return BODY_SYSTEMS.MUSCULOESQUELETICO;
    }
    if (t.includes('nervio') || t.includes('cerebral') || t.includes('neuro')) {
      return BODY_SYSTEMS.NERVIOSO;
    }
    if (t.includes('inmune') || t.includes('inmun')) {
      return BODY_SYSTEMS.INMUNE;
    }
    if (t.includes('digest') || t.includes('hepatico') || t.includes('intestinal')) {
      return BODY_SYSTEMS.DIGESTIVO;
    }
    if (t.includes('cardio') || t.includes('vascular') || t.includes('corazon')) {
      return BODY_SYSTEMS.CARDIOVASCULAR;
    }
    if (t.includes('respirat') || t.includes('pulmon') || t.includes('bronquial')) {
      return BODY_SYSTEMS.RESPIRATORIO;
    }
    if (t.includes('dermat') || t.includes('piel') || t.includes('cutaneo')) {
      return BODY_SYSTEMS.DERMATOLOGICO;
    }
    if (t.includes('metabol') || t.includes('glucosa') || t.includes('lipido')) {
      return BODY_SYSTEMS.METABOLICO;
    }
    if (t.includes('endocrino') || t.includes('hormonal') || t.includes('tiroides')) {
      return BODY_SYSTEMS.ENDOCRINO;
    }
    
    return null;
  }

  /**
   * Obtener todas las categorías únicas de una lista de productos
   */
  getAllCategories(products: Product[], kb: Record<string, KbIngredient>) {
    const types = new Set<ProductType | null>();
    const functions = new Set<TherapeuticFunction>();
    const systems = new Set<BodySystem>();

    for (const product of products) {
      const cats = this.categorizeProduct(product, kb);
      types.add(cats.type);
      cats.functions.forEach(f => functions.add(f));
      cats.systems.forEach(s => systems.add(s));
    }

    return {
      types: Array.from(types).filter(Boolean) as ProductType[],
      functions: Array.from(functions),
      systems: Array.from(systems),
    };
  }
}

export const categorizationService = new CategorizationService();
export default categorizationService;
