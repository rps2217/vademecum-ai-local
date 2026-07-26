/**
 * Servicio de Análisis Basado en Conocimiento
 * 
 * Integra el Knowledge Base con los servicios existentes de la app.
 * Proporciona análisis completo de productos sin depender de IA externa.
 */

import { Product } from '../core/types/product.types';
import { 
  analyzeProductIngredients, 
  analyzeProductSynergies,
  findComplementaryProducts,
  generateFullProductAnalysis,
  getKnowledgeBaseStats,
  type ProductSynergyAnalysis,
  type SynergyResult 
} from '../core/knowledge-base/SynergyEngine';
import { synergyGraphService, type SynergyEdge } from '../core/knowledge-base/SynergyGraph';
import { localDatabaseService } from '../core/database/LocalDatabase';
import { findIngredient, type IngredientInfo } from '../core/knowledge-base/ingredients';
import { logger } from './LoggerService';

class KnowledgeAnalysisService {
  private static instance: KnowledgeAnalysisService;
  
  private constructor() {}
  
  static getInstance(): KnowledgeAnalysisService {
    if (!KnowledgeAnalysisService.instance) {
      KnowledgeAnalysisService.instance = new KnowledgeAnalysisService();
    }
    return KnowledgeAnalysisService.instance;
  }
  
  /**
   * Análisis completo de un producto
   */
  async analizarProducto(producto: Product): Promise<ProductAnalysisResult> {
    try {
      // 1. Análisis de ingredientes usando Knowledge Base
      const analisisKB = analyzeProductIngredients(producto);
      
      // 2. Generar análisis de sinergias con productos relacionados
      const catalogo = await localDatabaseService.obtenerTodosLosProductos();
      const productosRelacionados = findComplementaryProducts(producto, catalogo, 5);
      
      const sinergias = analyzeProductSynergies(producto, producto); // Auto-análisis
      const analisisCompleto = generateFullProductAnalysis(producto, productosRelacionados);
      
      // 3. Obtener información detallada de ingredientes
      const ingredientesDetallados = analisisKB.ingredientes_encontrados.map(ing => ({
        ...ing,
        grafo: synergyGraphService.obtenerSinergiasDe(ing.id)
      }));
      
      return {
        producto,
        analisisKB,
        analisisCompleto,
        ingredientes_detallados: ingredientesDetallados,
        productos_complementarios: productosRelacionados.map(p => ({
          sku: p.sku,
          nombre: p.nombre_comercial,
          analisis: analyzeProductIngredients(p)
        })),
        porcentaje_cobertura: analisisKB.nivel_analisis_completo,
        requiere_ia_externa: analisisKB.analisis_ia_necesario,
        explicacion_completa: generarExplicacionCompleta(analisisKB, sinergias),
        timestamp: Date.now()
      };
      
    } catch (error) {
      logger.error('Error analizando producto', 'KnowledgeAnalysis', error);
      throw error;
    }
  }
  
  /**
   * Análisis rápido de ingredientes
   */
  async analizarIngredientes(nombres: string[]): Promise<IngredientAnalysisResult> {
    const ingredientes: (IngredientInfo & { grafo?: SynergyEdge[] })[] = [];
    const noEncontrados: string[] = [];
    
    for (const nombre of nombres) {
      const info = findIngredient(nombre);
      if (info) {
        const grafo = synergyGraphService.obtenerSinergiasDe(info.id);
        ingredientes.push({ ...info, grafo });
      } else {
        noEncontrados.push(nombre);
      }
    }
    
    // Encontrar grupos sinergicos
    const ids = ingredientes.map(i => i.id);
    const grupoSinergico = synergyGraphService.encontrarGrupoSynergico(ids);
    
    return {
      ingredientes,
      no_encontrados: noEncontrados,
      grupo_sinergico: grupoSinergico,
      estadisticas: getKnowledgeBaseStats()
    };
  }
  
  /**
   * Encuentra productos complementarios para uno dado
   */
  async encontrarComplementarios(
    producto: Product, 
    limite: number = 5
  ): Promise<ComplementaryProduct[]> {
    try {
      const catalogo = await localDatabaseService.obtenerTodosLosProductos();
      const complementarios = findComplementaryProducts(producto, catalogo, limite);
      
      return complementarios.map(p => {
        const analisis = analyzeProductIngredients(p);
        const sinergias = analyzeProductSynergies(producto, p);
        
        return {
          sku: p.sku,
          nombre: p.nombre_comercial,
          categoria: p.categoria,
          analisis,
          sinergias_detectadas: sinergias,
          puntuacion_sinergia: sinergias.reduce((acc, s) => {
            return acc + (s.nivel_sinergia === 'alto' ? 3 : s.nivel_sinergia === 'medio' ? 2 : 1);
          }, 0)
        };
      }).sort((a, b) => b.puntuacion_sinergia - a.puntuacion_sinergia);
      
    } catch (error) {
      logger.error('Error encontrando productos complementarios', 'KnowledgeAnalysis', error);
      return [];
    }
  }
  
  /**
   * Genera informe de análisis completo
   */
  async generarInforme(producto: Product): Promise<AnalysisReport> {
    const analisis = await this.analizarProducto(producto);
    
    return {
      producto: {
        sku: producto.sku,
        nombre: producto.nombre_comercial,
        categoria: producto.categoria
      },
      resumen: {
        ingredientes_totales: analisis.analisisKB.ingredientes_encontrados.length,
        ingredientes_sin_info: analisis.analisisKB.ingredientes_sin_match.length,
        sinergias_alto_nivel: analisis.analisisCompleto.sinergias_detectadas.length,
        cobertura_kb: `${analisis.porcentaje_cobertura}%`,
        requiere_ia: analisis.requiere_ia_externa
      },
      ingredientes: analisis.ingredientes_detallados.map(i => ({
        nombre: i.nombre,
        categoria: i.categoria,
        beneficios: i.beneficios,
        sinergias: i.grafo?.filter(e => e.peso > 0).length || 0
      })),
      productos_complementarios: analisis.productos_complementarios.map(p => ({
        nombre: p.nombre,
        cobertura: `${p.analisis.nivel_analisis_completo}%`
      })),
      explicacion: analisis.explicacion_completa,
      grafo_stats: synergyGraphService.obtenerEstadisticas(),
      generado: new Date().toISOString()
    };
  }
  
  /**
   * Obtiene información de un ingrediente específico
   */
  getIngredientInfo(ingredienteId: string): IngredientDetail | null {
    const info = findIngredient(ingredienteId);
    if (!info) return null;
    
    const sinergias = synergyGraphService.obtenerSinergiasDe(ingredienteId);
    const antagonismos = synergyGraphService.obtenerAntagonismosDe(ingredienteId);
    const grupoSinergico = synergyGraphService.encontrarGrupoSynergico([ingredienteId]);
    
    return {
      ...info,
      sinergias,
      antagonismos,
      puntuacion_grupo: grupoSinergico.promedio,
      alternativas: encontrarAlternativas(ingredienteId)
    };
  }
  
  /**
   * Recomienda ingredientes para un objetivo
   */
  recomendarPorObjetivo(objetivo: string): IngredientRecommendation[] {
    const recomendaciones = synergyGraphService.recomendarPorObjetivo(objetivo);
    
    return recomendaciones.map(r => {
      const info = findIngredient(r.id);
      return {
        id: r.id,
        nombre: r.nombre,
        categoria: info?.categoria || 'desconocida',
        relevancia: r.relevancia,
        beneficios: r.beneficios,
        dosis: info?.dosis_recomendada,
        sinergias: synergyGraphService.obtenerSinergiasDe(r.id)
      };
    });
  }
  
  /**
   * Verifica compatibilidad entre dos ingredientes
   */
  verificarCompatibilidad(ing1Id: string, ing2Id: string): CompatibilityCheck {
    const info1 = findIngredient(ing1Id);
    const info2 = findIngredient(ing2Id);
    
    if (!info1 || !info2) {
      return {
        compatible: false,
        mensaje: 'Uno o ambos ingredientes no están en la base de conocimiento'
      };
    }
    
    const sinergia = synergyGraphService.obtenerSinergiasDe(ing1Id)
      .find(e => e.hacia === ing2Id);
    
    const antagonismo = synergyGraphService.obtenerAntagonismosDe(ing1Id)
      .find(e => e.hacia === ing2Id);
    
    if (antagonismo) {
      return {
        compatible: false,
        tipo: 'antagonismo',
        nivel: antagonismo.nivel,
        mensaje: antagonismo.descripcion,
        recomendacion: `Evitar tomar ${info1.nombre} con ${info2.nombre}. ${antagonismo.descripcion}`
      };
    }
    
    if (sinergia) {
      return {
        compatible: true,
        tipo: 'sinergia',
        nivel: sinergia.nivel,
        mensaje: sinergia.descripcion,
        recomendacion: `Excelente combinación. ${sinergia.descripcion}`
      };
    }
    
    return {
      compatible: true,
      tipo: 'neutro',
      nivel: 'bajo',
      mensaje: 'No hay información específica sobre esta combinación',
      recomendacion: `Tomar ${info1.nombre} y ${info2.nombre} juntos es generalmente seguro.`
    };
  }
  
  /**
   * Obtiene estadísticas de la base de conocimiento
   */
  getStats() {
    return {
      knowledgeBase: getKnowledgeBaseStats(),
      grafo: synergyGraphService.obtenerEstadisticas()
    };
  }
}

// Funciones auxiliares
function generarExplicacionCompleta(
  analisis: ProductSynergyAnalysis,
  sinergias: SynergyResult[]
): string {
  let explicacion = '';
  
  // Resumen de ingredientes
  if (analisis.ingredientes_encontrados.length > 0) {
    const categorias = [...new Set(analisis.ingredientes_encontrados.map(i => i.categoria))];
    explicacion += `Este producto contiene ingredientes de las categorías: ${categorias.join(', ')}. `;
    
    const beneficiosUnicos = [...new Set(analisis.ingredientes_encontrados.flatMap(i => i.beneficios))];
    explicacion += `Beneficios principales: ${beneficiosUnicos.slice(0, 5).join(', ')}. `;
  }
  
  // Sinergias detectadas
  if (analisis.sinergias_detectadas.length > 0) {
    explicacion += `\n\nSinergias de alto nivel detectadas: ${analisis.sinergias_detectadas.length}. `;
    analisis.sinergias_detectadas.slice(0, 3).forEach(s => {
      explicacion += `${s.descripcion} `;
    });
  }
  
  // Ingredientes sin match
  if (analisis.ingredientes_sin_match.length > 0) {
    explicacion += `\n\nNota: ${analisis.ingredientes_sin_match.length} ingrediente(s) no tienen información detallada en la base de conocimiento.`;
  }
  
  // Recomendación general
  if (analisis.nivel_analisis_completo >= 70) {
    explicacion += `\n\n✅ Alta cobertura de análisis (${analisis.nivel_analisis_completo}%).`;
  } else if (analisis.nivel_analisis_completo >= 40) {
    explicacion += `\n\n⚠️ Cobertura parcial (${analisis.nivel_analisis_completo}%). Se recomienda verificar información adicional.`;
  } else {
    explicacion += `\n\n❌ Baja cobertura (${analisis.nivel_analisis_completo}%). Se recomienda análisis con IA para información más completa.`;
  }
  
  return explicacion.trim();
}

function encontrarAlternativas(ingredienteId: string): string[] {
  const sinergias = synergyGraphService.obtenerSinergiasDe(ingredienteId);
  return sinergias
    .filter(s => s.nivel === 'alto')
    .map(s => s.hacia)
    .slice(0, 3);
}

// Tipos exportados
export interface ProductAnalysisResult {
  producto: Product;
  analisisKB: ProductSynergyAnalysis;
  analisisCompleto: ProductSynergyAnalysis;
  ingredientes_detallados: (IngredientInfo & { grafo?: SynergyEdge[] })[];
  productos_complementarios: { sku: string; nombre: string; analisis: ProductSynergyAnalysis }[];
  porcentaje_cobertura: number;
  requiere_ia_externa: boolean;
  explicacion_completa: string;
  timestamp: number;
}

export interface IngredientAnalysisResult {
  ingredientes: (IngredientInfo & { grafo?: SynergyEdge[] })[];
  no_encontrados: string[];
  grupo_sinergico: { grupo: string[]; sinergiasTotal: number; promedio: number };
  estadisticas: ReturnType<typeof getKnowledgeBaseStats>;
}

export interface ComplementaryProduct {
  sku: string;
  nombre: string;
  categoria?: string;
  analisis: ProductSynergyAnalysis;
  sinergias_detectadas: SynergyResult[];
  puntuacion_sinergia: number;
}

export interface AnalysisReport {
  producto: { sku: string; nombre: string; categoria?: string };
  resumen: {
    ingredientes_totales: number;
    ingredientes_sin_info: number;
    sinergias_alto_nivel: number;
    cobertura_kb: string;
    requiere_ia: boolean;
  };
  ingredientes: { nombre: string; categoria: string; beneficios: string[]; sinergias: number }[];
  productos_complementarios: { nombre: string; cobertura: string }[];
  explicacion: string;
  grafo_stats: ReturnType<typeof synergyGraphService.obtenerEstadisticas>;
  generado: string;
}

export interface IngredientDetail extends IngredientInfo {
  sinergias: SynergyEdge[];
  antagonismos: SynergyEdge[];
  puntuacion_grupo: number;
  alternativas: string[];
}

export interface IngredientRecommendation {
  id: string;
  nombre: string;
  categoria: string;
  relevancia: number;
  beneficios: string[];
  dosis?: string;
  sinergias: SynergyEdge[];
}

export interface CompatibilityCheck {
  compatible: boolean;
  tipo?: 'sinergia' | 'antagonismo' | 'neutro';
  nivel?: 'alto' | 'medio' | 'bajo';
  mensaje: string;
  recomendacion: string;
}

export const knowledgeAnalysisService = KnowledgeAnalysisService.getInstance();
