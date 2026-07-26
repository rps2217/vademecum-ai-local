/**
 * SynergyEngineV2 - Motor de Detección de Sinergias
 * 
 * Versión mejorada que usa la red de relaciones curadas
 * y puede detectar sinergias automáticamente.
 */

import { knowledgeLoader } from './KnowledgeLoader';
import type { SynergyRelation, SynergyType, SynergyLevel } from '../data/schema';

export interface SynergyResult {
  ingredienteA: string;
  ingredienteB: string;
  tipo: SynergyType;
  nivel: SynergyLevel;
  descripcion: string;
  beneficios: string[];
  precauciones: string[];
  evidencia: string;
}

export interface ProductSynergyAnalysis {
  productos: string[];
  ingredientes: string[];
  sinergiasDetectadas: SynergyResult[];
  sinergiasPotenciales: SynergyResult[];
  puntuacion: number; // 0-100
  recomendacion: string;
}

/**
 * SynergyEngineV2
 */
class SynergyEngineV2 {
  private static instance: SynergyEngineV2;

  private constructor() {}

  static getInstance(): SynergyEngineV2 {
    if (!SynergyEngineV2.instance) {
      SynergyEngineV2.instance = new SynergyEngineV2();
    }
    return SynergyEngineV2.instance;
  }

  /**
   * Analizar sinergias entre una lista de ingredientes/productos
   */
  analyze(ingredientIds: string[]): ProductSynergyAnalysis {
    const uniqueIngredients = [...new Set(ingredientIds)];
    const sinergiasDetectadas: SynergyResult[] = [];
    const sinergiasPotenciales: SynergyResult[] = [];

    // Verificar sinergias conocidas entre los ingredientes
    for (let i = 0; i < uniqueIngredients.length; i++) {
      for (let j = i + 1; j < uniqueIngredients.length; j++) {
        const idA = uniqueIngredients[i];
        const idB = uniqueIngredients[j];

        // Buscar sinergia curada
        const synergy = knowledgeLoader.findSynergy(idA, idB);
        if (synergy) {
          sinergiasDetectadas.push({
            ingredienteA: idA,
            ingredienteB: idB,
            tipo: synergy.tipo,
            nivel: synergy.nivelEvidencia as SynergyLevel || 'medio',
            descripcion: synergy.descripcion,
            beneficios: synergy.beneficios || [],
            precauciones: synergy.precauciones || [],
            evidencia: synergy.nivelEvidencia || 'B',
          });
        } else {
          // Buscar sinergia potencial por categorías o sistemas
          const potencial = this.findPotentialSynergy(idA, idB);
          if (potencial) {
            sinergiasPotenciales.push(potencial);
          }
        }
      }
    }

    // Calcular puntuación
    const puntuacion = this.calculateScore(sinergiasDetectadas, sinergiasPotenciales, uniqueIngredients.length);

    // Generar recomendación
    const recomendacion = this.generateRecommendation(sinergiasDetectadas, sinergiasPotenciales);

    return {
      productos: ingredientIds,
      ingredientes: uniqueIngredients,
      sinergiasDetectadas,
      sinergiasPotenciales,
      puntuacion,
      recomendacion,
    };
  }

  /**
   * Encontrar sinergia potencial entre dos ingredientes
   */
  private findPotentialSynergy(idA: string, idB: string): SynergyResult | null {
    const ingA = knowledgeLoader.getById(idA);
    const ingB = knowledgeLoader.getById(idB);

    if (!ingA || !ingB) return null;

    // Verificar sistemas en común
    const sistemasA = new Set(ingA.sistemas || []);
    const sistemasB = new Set(ingB.sistemas || []);
    const commonSystems = [...sistemasA].filter(s => sistemasB.has(s));

    if (commonSystems.length > 0) {
      return {
        ingredienteA: idA,
        ingredienteB: idB,
        tipo: 'complementario',
        nivel: 'bajo',
        descripcion: `Ambos actúan sobre el sistema ${commonSystems.join(', ')}. Posible sinergia no documentada.`,
        beneficios: [`Acción complementaria en ${commonSystems.join(', ')}`],
        precauciones: ['Verificar tolerabilidad individual'],
        evidencia: 'Potencial - no verificado clínicamente',
      };
    }

    // Verificar categorías en común
    if (ingA.categoria === ingB.categoria) {
      return {
        ingredienteA: idA,
        ingredienteB: idB,
        tipo: 'potenciador',
        nivel: 'bajo',
        descripcion: 'Misma categoría - posible sinergia por mecanismo similar.',
        beneficios: ['Efecto potencialmente potenciado'],
        precauciones: ['Ajustar dosis'],
        evidencia: 'Potencial - no verificado clínicamente',
      };
    }

    return null;
  }

  /**
   * Calcular puntuación de sinergia (0-100)
   */
  private calculateScore(
    detectadas: SynergyResult[],
    potenciales: SynergyResult[],
    totalIngredients: number
  ): number {
    if (totalIngredients < 2) return 0;

    // Puntos por sinergias detectadas (alto: 30, medio: 20, bajo: 10)
    const pointsDetected = detectadas.reduce((sum, s) => {
      switch (s.nivel) {
        case 'alto': return sum + 30;
        case 'medio': return sum + 20;
        case 'bajo': return sum + 10;
        default: return sum + 15;
      }
    }, 0);

    // Puntos por sinergias potenciales (la mitad)
    const pointsPotential = potenciales.reduce((sum, s) => {
      switch (s.nivel) {
        case 'alto': return sum + 15;
        case 'medio': return sum + 10;
        case 'bajo': return sum + 5;
        default: return sum + 7;
      }
    }, 0);

    // Normalizar por número de ingredientes (ideal: 1 synergia por par)
    const idealPairs = (totalIngredients * (totalIngredients - 1)) / 2;
    const actualPairs = detectadas.length + potenciales.length;
    const ratio = actualPairs / idealPairs;

    // Score final
    const rawScore = pointsDetected + pointsPotential;
    const normalizedScore = Math.min(100, Math.round(rawScore * ratio));

    return normalizedScore;
  }

  /**
   * Generar recomendación basada en sinergias
   */
  private generateRecommendation(
    detectadas: SynergyResult[],
    potenciales: SynergyResult[]
  ): string {
    if (detectadas.length === 0 && potenciales.length === 0) {
      return 'No se detectaron sinergias específicas entre estos ingredientes.';
    }

    if (detectadas.length > 0) {
      const altos = detectadas.filter(s => s.nivel === 'alto');
      if (altos.length > 0) {
        return `✓ Combinación SINÉRGICA recomendada. Se detectaron ${detectadas.length} sinergia(s) con evidencia alta.`;
      }
      
      return `✓ Combinación POTENCIALMENTE beneficiosa. Se detectaron ${detectadas.length} sinergia(s) conocidas.`;
    }

    if (potenciales.length > 0) {
      return `⚠ Sinergias potenciales detectadas (${potenciales.length}). La evidencia no está confirmada clínicamente.`;
    }

    return 'Revisar interacciones individuales antes de combinar.';
  }

  /**
   * Obtener todas las sinergias de un ingrediente
   */
  getSynergiesFor(ingredientId: string): SynergyResult[] {
    const synergies = knowledgeLoader.getSynergiesFor(ingredientId);
    
    return synergies.map(s => ({
      ingredienteA: s.ingredienteA,
      ingredienteB: s.ingredienteB,
      tipo: s.tipo,
      nivel: s.nivelEvidencia as SynergyLevel || 'medio',
      descripcion: s.descripcion,
      beneficios: s.beneficios || [],
      precauciones: s.precauciones || [],
      evidencia: s.nivelEvidencia || 'B',
    }));
  }

  /**
   * Sugerir mejores compañeros sinérgicos
   */
  suggestPartners(
    ingredientId: string,
    system?: string,
    limit: number = 5
  ): Array<{ ingredient: any; synergy: SynergyResult }> {
    const suggestions = knowledgeLoader.suggestSynergies(ingredientId, 20);
    
    // Filtrar por sistema si se especifica
    let filtered = suggestions;
    if (system) {
      filtered = suggestions.filter(
        s => s.ingredient?.sistemas?.includes(system)
      );
    }

    return filtered.slice(0, limit).map(s => ({
      ingredient: s.ingredient,
      synergy: {
        ingredienteA: ingredientId,
        ingredienteB: s.ingredient.id,
        tipo: s.synergy.tipo,
        nivel: s.synergy.nivelEvidencia as SynergyLevel || 'medio',
        descripcion: s.synergy.descripcion,
        beneficios: s.synergy.beneficios || [],
        precauciones: s.synergy.precauciones || [],
        evidencia: s.synergy.nivelEvidencia || 'B',
      },
    }));
  }

  /**
   * Verificar antagonismos conocidos
   */
  checkAntagonisms(ingredientIds: string[]): string[] {
    // Por ahora devolvemos array vacío - se puede expandir con datos de antagonismos
    const warnings: string[] = [];
    
    // Ejemplo de verificación básica
    for (const id of ingredientIds) {
      const ing = knowledgeLoader.getById(id);
      if (ing?.advertencias) {
        ing.advertencias.forEach((warn: string) => {
          if (!warnings.includes(warn)) {
            warnings.push(warn);
          }
        });
      }
    }

    return warnings;
  }
}

// Exportar singleton
export const synergyEngineV2 = SynergyEngineV2.getInstance();
