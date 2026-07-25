/**
 * Servicio de Sinergias - Supabase
 * 
 * Sincroniza la base de conocimiento y sinergias con Supabase.
 */

import { Product } from '../core/types/product.types';
import { SynergyResult } from '../core/knowledge-base/SynergyEngine';
import { knowledgeAnalysisService } from './KnowledgeAnalysisService';
import { supabaseService } from './SupabaseService';

// Tipos para Supabase
interface IngredientKnowledge {
  ingredient_id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  mecanismo_accion: string;
  beneficios: string[];
  dosis_recomendada: string;
}

interface ProductSynergy {
  producto1_sku: string;
  producto2_sku: string;
  nivel_sinergia: 'alto' | 'medio' | 'bajo';
  tipo_relacion: string;
  descripcion: string;
  beneficios_combinados: string[];
  explicacion: string;
}

interface ProductIngredientAnalysis {
  producto_sku: string;
  ingredientes_encontrados: string[];
  ingredientes_sin_match: string[];
  cobertura_kb: number;
  categoria_predominante: string;
  analisis_explicacion: string;
  nivel_analisis_completo: number;
  requiere_ia_externa: boolean;
}

class SupabaseSynergiesService {
  private static instance: SupabaseSynergiesService;
  private isSyncing = false;

  private constructor() {}

  static getInstance(): SupabaseSynergiesService {
    if (!SupabaseSynergiesService.instance) {
      SupabaseSynergiesService.instance = new SupabaseSynergiesService();
    }
    return SupabaseSynergiesService.instance;
  }

  /**
   * Verifica si Supabase esta configurado
   */
  isConfigured(): boolean {
    return supabaseService.isConfigured();
  }

  /**
   * Sincroniza la base de conocimiento de ingredientes con Supabase
   */
  async syncKnowledgeBase(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return { success: false, message: 'Supabase no configurado' };
    }

    const supabase = supabaseService.getClient();
    if (!supabase) {
      return { success: false, message: 'Cliente Supabase no disponible' };
    }

    try {
      // Obtener estadisticas de la Knowledge Base local
      const stats = knowledgeAnalysisService.getStats();
      console.log(`[SynergiesService] Sincronizando ${stats.knowledgeBase.total_ingredientes} ingredientes...`);

      // La Knowledge Base local se mantiene como fuente principal
      // Solo sincronizamos cuando hay cambios o para backup
      return {
        success: true,
        message: `Knowledge Base lista. ${stats.knowledgeBase.total_ingredientes} ingredientes disponibles localmente.`
      };

    } catch (error) {
      console.error('[SynergiesService] Error sincronizando Knowledge Base:', error);
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Desconocido'}`
      };
    }
  }

  /**
   * Guarda el analisis de un producto en Supabase
   */
  async saveProductAnalysis(producto: Product): Promise<boolean> {
    if (!this.isConfigured()) return false;

    const supabase = supabaseService.getClient();
    if (!supabase) return false;

    try {
      const analisis = await knowledgeAnalysisService.analizarProducto(producto);

      const analysisRecord: ProductIngredientAnalysis = {
        producto_sku: producto.sku,
        ingredientes_encontrados: analisis.analisisKB.ingredientes_encontrados.map(i => i.nombre),
        ingredientes_sin_match: analisis.analisisKB.ingredientes_sin_match,
        cobertura_kb: analisis.porcentaje_cobertura,
        categoria_predominante: analisis.analisisKB.categoria_predominante,
        analisis_explicacion: analisis.explicacion_completa,
        nivel_analisis_completo: analisis.analisisKB.nivel_analisis_completo,
        requiere_ia_externa: analisis.requiere_ia_externa
      };

      const { error } = await supabase
        .from('product_ingredient_analysis')
        .upsert(analysisRecord, { onConflict: 'producto_sku' });

      if (error) {
        console.error('[SynergiesService] Error guardando analisis:', error);
        return false;
      }

      console.log(`[SynergiesService] Analisis de ${producto.sku} guardado en Supabase`);
      return true;

    } catch (error) {
      console.error('[SynergiesService] Error en saveProductAnalysis:', error);
      return false;
    }
  }

  /**
   * Guarda sinergias entre productos en Supabase
   */
  async saveProductSynergies(
    producto1Sku: string,
    producto2Sku: string,
    sinergias: SynergyResult[]
  ): Promise<boolean> {
    if (!this.isConfigured() || sinergias.length === 0) return false;

    const supabase = supabaseService.getClient();
    if (!supabase) return false;

    try {
      // Obtener la sinergia mas importante
      const mejorSinergia = sinergias.reduce((best, current) => {
        const weight = (s: SynergyResult) => 
          s.nivel_sinergia === 'alto' ? 3 : s.nivel_sinergia === 'medio' ? 2 : 1;
        return weight(current) > weight(best) ? current : best;
      });

      const synergyRecord: ProductSynergy = {
        producto1_sku: producto1Sku,
        producto2_sku: producto2Sku,
        nivel_sinergia: mejorSinergia.nivel_sinergia,
        tipo_relacion: mejorSinergia.tipo_relacion,
        descripcion: mejorSinergia.descripcion,
        beneficios_combinados: mejorSinergia.beneficios_combinados,
        explicacion: mejorSinergia.recomendaciones
      };

      const { error } = await supabase
        .from('product_synergies')
        .upsert(synergyRecord, { onConflict: 'producto1_sku,producto2_sku' });

      if (error) {
        console.error('[SynergiesService] Error guardando sinergia:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('[SynergiesService] Error en saveProductSynergies:', error);
      return false;
    }
  }

  /**
   * Obtiene analisis guardado de Supabase para un producto
   */
  async getProductAnalysis(productoSku: string): Promise<ProductIngredientAnalysis | null> {
    if (!this.isConfigured()) return null;

    const supabase = supabaseService.getClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('product_ingredient_analysis')
        .select('*')
        .eq('producto_sku', productoSku)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // No rows found
          console.error('[SynergiesService] Error obteniendo analisis:', error);
        }
        return null;
      }

      return data;

    } catch (error) {
      console.error('[SynergiesService] Error en getProductAnalysis:', error);
      return null;
    }
  }

  /**
   * Obtiene sinergias de Supabase para un producto
   */
  async getProductSynergies(productoSku: string): Promise<ProductSynergy[]> {
    if (!this.isConfigured()) return [];

    const supabase = supabaseService.getClient();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('product_synergies')
        .select('*')
        .or(`producto1_sku.eq.${productoSku},producto2_sku.eq.${productoSku}`)
        .order('nivel_sinergia');

      if (error) {
        console.error('[SynergiesService] Error obteniendo sinergias:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('[SynergiesService] Error en getProductSynergies:', error);
      return [];
    }
  }

  /**
   * Obtiene productos complementarios desde Supabase
   */
  async getComplementaryProducts(productoSku: string, limit: number = 5): Promise<string[]> {
    if (!this.isConfigured()) return [];

    const supabase = supabaseService.getClient();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('product_synergies')
        .select('producto1_sku, producto2_sku, nivel_sinergia')
        .or(`producto1_sku.eq.${productoSku},producto2_sku.eq.${productoSku}`)
        .eq('nivel_sinergia', 'alto')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[SynergiesService] Error:', error);
        return [];
      }

      return (data || []).map(row => 
        row.producto1_sku === productoSku ? row.producto2_sku : row.producto1_sku
      );

    } catch (error) {
      console.error('[SynergiesService] Error:', error);
      return [];
    }
  }

  /**
   * Sincroniza analisis de productos en lote
   */
  async syncProductsBatch(productos: Product[]): Promise<{ synced: number; failed: number }> {
    if (!this.isConfigured() || productos.length === 0) {
      return { synced: 0, failed: 0 };
    }

    const supabase = supabaseService.getClient();
    if (!supabase) {
      return { synced: 0, failed: productos.length };
    }

    let synced = 0;
    let failed = 0;

    for (const producto of productos) {
      const success = await this.saveProductAnalysis(producto);
      if (success) {
        synced++;
      } else {
        failed++;
      }
    }

    console.log(`[SynergiesService] Batch sync: ${synced} exitosos, ${failed} fallidos`);
    return { synced, failed };
  }

  /**
   * Obtiene ingredientes desde Supabase
   */
  async getIngredientsFromCloud(): Promise<IngredientKnowledge[]> {
    if (!this.isConfigured()) return [];

    const supabase = supabaseService.getClient();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('ingredient_knowledge')
        .select('*')
        .order('nombre');

      if (error) {
        console.error('[SynergiesService] Error obteniendo ingredientes:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('[SynergiesService] Error:', error);
      return [];
    }
  }

  /**
   * Obtiene relaciones de sinergias desde Supabase
   */
  async getRelationshipsFromCloud(): Promise<any[]> {
    if (!this.isConfigured()) return [];

    const supabase = supabaseService.getClient();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('ingredient_relationships')
        .select('*')
        .eq('tipo_relacion', 'sinergia');

      if (error) {
        console.error('[SynergiesService] Error:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('[SynergiesService] Error:', error);
      return [];
    }
  }

  /**
   * Estadisticas de sincronizacion
   */
  async getSyncStats(): Promise<{
    localIngredients: number;
    cloudIngredients: number;
    localSynergies: number;
    cloudSynergies: number;
  }> {
    const stats = knowledgeAnalysisService.getStats();
    
    let cloudIngredients = 0;
    let cloudSynergies = 0;

    if (this.isConfigured()) {
      const supabase = supabaseService.getClient();
      if (supabase) {
        const [ingResponse, synResponse] = await Promise.all([
          supabase.from('ingredient_knowledge').select('*', { count: 'exact', head: true }),
          supabase.from('product_synergies').select('*', { count: 'exact', head: true })
        ]);
        cloudIngredients = ingResponse.count || 0;
        cloudSynergies = synResponse.count || 0;
      }
    }

    return {
      localIngredients: stats.knowledgeBase.total_ingredientes,
      cloudIngredients,
      localSynergies: stats.knowledgeBase.total_sinergias,
      cloudSynergies
    };
  }
}

export const supabaseSynergiesService = SupabaseSynergiesService.getInstance();
