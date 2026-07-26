/**
 * useAnalysis - Hook para análisis de productos con Knowledge Base
 * Centraliza la lógica de análisis de ingredientes y sinergias
 */

import { useMemo, useCallback } from 'react';
import { getCombinedKnowledgeBase } from '../core/knowledge-base';
import { synergyGraphService } from '../core/knowledge-base/SynergyGraph';
import { knowledgeService, type ProductAnalysis } from '../services/KnowledgeService';
import { productCategorizationService } from '../services/ProductCategorizationService';
import type { Product } from '../types';

export interface AnalyzedProduct extends Product {
  ingredientes_encontrados: string[];
  cobertura_kb: number;
  sinergias_detectadas: string[];
  antagonismos_detectados: string[];
  kbAnalysis?: ProductAnalysis | null;
  categorias_inferidas?: string[];
  categoryLabels?: string[];
}

export interface AnalysisResult {
  found: string[];
  sinergias: string[];
  antagonismos: string[];
  kbAnalysis: ProductAnalysis | null;
  cobertura: number;
}

export interface UseAnalysisReturn {
  analyzeProduct: (product: Product) => AnalyzedProduct;
  analyzeIngredients: (principiosActivos: string[]) => AnalysisResult;
  getProductStats: (products: AnalyzedProduct[]) => ProductStats;
  kb: Record<string, any>;
  ingredientCount: number;
}

export interface ProductStats {
  total: number;
  withKb: number;
  withSynergies: number;
  withAntagonisms: number;
  avgCoverage: number;
}

export function useAnalysis(): UseAnalysisReturn {
  const kb = useMemo(() => getCombinedKnowledgeBase(), []);
  const ingredientCount = useMemo(() => Object.keys(kb).length, [kb]);

  const analyzeIngredients = useCallback((principiosActivos: string[]): AnalysisResult => {
    const found: string[] = [];
    const principios = principiosActivos.map(p => String(p).toLowerCase());

    // Buscar ingredientes en la KB
    for (const [id, ing] of Object.entries(kb)) {
      const ingName = String((ing as any).nombre).toLowerCase();
      for (const principio of principios) {
        if (principio.includes(ingName) || ingName.includes(principio)) {
          if (!found.includes(id)) {
            found.push(id);
          }
        }
      }
    }

    // Obtener sinergias y antagonismos
    const sinergias: string[] = [];
    const antagonismos: string[] = [];

    for (const id of found) {
      const sin = synergyGraphService.obtenerSinergiasDe(id);
      for (const s of sin) {
        if (found.includes(s.hacia) && !sinergias.includes(`${id}-${s.hacia}`)) {
          sinergias.push(`${id}-${s.hacia}`);
        }
      }

      const ant = synergyGraphService.obtenerAntagonismosDe(id);
      for (const a of ant) {
        if (found.includes(a.hacia) && !antagonismos.includes(`${id}-${a.hacia}`)) {
          antagonismos.push(`${id}-${a.hacia}`);
        }
      }
    }

    // Análisis de cobertura
    const kbAnalysis = found.length > 0 
      ? knowledgeService.analyzeIngredients(found)
      : null;

    const cobertura = principiosActivos.length > 0
      ? (found.length / principiosActivos.length) * 100
      : 0;

    return { found, sinergias, antagonismos, kbAnalysis, cobertura };
  }, [kb]);

  const analyzeProduct = useCallback((product: Product): AnalyzedProduct => {
    const principiosActivos = product.principios_activos || [];
    const result = analyzeIngredients(principiosActivos);
    
    // Obtener categorización
    const baseProduct = {
      ...product,
      ingredientes_encontrados: result.found,
      cobertura_kb: result.cobertura,
      sinergias_detectadas: result.sinergias,
      antagonismos_detectados: result.antagonismos,
      kbAnalysis: result.kbAnalysis,
    };

    const categorization = productCategorizationService.getCategorizationDetails(baseProduct);
    
    return {
      ...baseProduct,
      categorias_inferidas: categorization.categories,
      categoryLabels: categorization.categoryLabels,
    };
  }, [analyzeIngredients]);

  const getProductStats = useCallback((products: AnalyzedProduct[]): ProductStats => {
    if (products.length === 0) {
      return { total: 0, withKb: 0, withSynergies: 0, withAntagonisms: 0, avgCoverage: 0 };
    }

    const withKb = products.filter(p => p.cobertura_kb > 0).length;
    const withSynergies = products.filter(p => p.sinergias_detectadas?.length > 0).length;
    const withAntagonisms = products.filter(p => p.antagonismos_detectados?.length > 0).length;
    const totalCoverage = products.reduce((acc, p) => acc + (p.cobertura_kb || 0), 0);

    return {
      total: products.length,
      withKb,
      withSynergies,
      withAntagonisms,
      avgCoverage: Math.round(totalCoverage / products.length)
    };
  }, []);

  return {
    analyzeProduct,
    analyzeIngredients,
    getProductStats,
    kb,
    ingredientCount
  };
}

export default useAnalysis;
