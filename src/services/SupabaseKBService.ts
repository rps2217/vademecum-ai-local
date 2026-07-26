/**
 * SupabaseKBService - Servicio de Sincronización con Supabase
 * 
 * Sincroniza la base de conocimiento local (JSON) con Supabase PostgreSQL.
 * Permite:
 * - Subir datos locales a Supabase
 * - Descargar datos de Supabase
 * - Sincronización bidireccional
 * - Resolver conflictos
 */

import { supabase } from './supabase';
import { knowledgeLoader } from '../core/knowledge-base';
import fitoterapiaData from '../core/knowledge-base/data/fitoterapia.json';
import homeopatiaData from '../core/knowledge-base/data/homeopatia.json';
import aceitesData from '../core/knowledge-base/data/aceites.json';
import vitaminasData from '../core/knowledge-base/data/vitaminas_minerales.json';
import synergiesData from '../core/knowledge-base/synergies/synergies.json';

export interface SyncResult {
  success: boolean;
  uploaded: number;
  downloaded: number;
  conflicts: ConflictInfo[];
  errors: string[];
  timestamp: string;
}

export interface ConflictInfo {
  type: 'ingredient' | 'synergy';
  localId: string;
  remoteId: string;
  conflict: 'both_modified' | 'local_newer' | 'remote_newer';
  localData: any;
  remoteData: any;
}

export interface KBStats {
  localIngredients: number;
  remoteIngredients: number;
  localSynergies: number;
  remoteSynergies: number;
  lastSync: string | null;
  status: 'synced' | 'outdated' | 'error';
}

class SupabaseKBService {
  private static instance: SupabaseKBService;
  private lastSync: string | null = null;
  private syncInProgress: boolean = false;

  private constructor() {
    // Cargar última sincronización del localStorage
    this.lastSync = localStorage.getItem('kb_last_sync');
  }

  static getInstance(): SupabaseKBService {
    if (!SupabaseKBService.instance) {
      SupabaseKBService.instance = new SupabaseKBService();
    }
    return SupabaseKBService.instance;
  }

  /**
   * Verificar si Supabase está configurado
   */
  isConfigured(): boolean {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return !!(url && key);
  }

  /**
   * Obtener estadísticas de sincronización
   */
  async getSyncStats(): Promise<KBStats> {
    if (!this.isConfigured()) {
      return {
        localIngredients: 0,
        remoteIngredients: 0,
        localSynergies: 0,
        remoteSynergies: 0,
        lastSync: this.lastSync,
        status: 'error',
      };
    }

    try {
      // Contar ingredientes locales
      const localIngredients = (fitoterapiaData as any).ingredientes.length +
                              (homeopatiaData as any).ingredientes.length +
                              (aceitesData as any).ingredientes.length +
                              (vitaminasData as any).ingredientes.length;

      const localSynergies = (synergiesData as any).sinergias.length;

      // Contar ingredientes remotos
      const { count: remoteIngredients } = await supabase
        .from('ingredients')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: remoteSynergies } = await supabase
        .from('sinergias')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const status = this.lastSync ? 'synced' : 'outdated';

      return {
        localIngredients,
        remoteIngredients: remoteIngredients || 0,
        localSynergies,
        remoteSynergies: remoteSynergies || 0,
        lastSync: this.lastSync,
        status,
      };
    } catch (error) {
      console.error('[SupabaseKBService] Error getting stats:', error);
      return {
        localIngredients: 0,
        remoteIngredients: 0,
        localSynergies: 0,
        remoteSynergies: 0,
        lastSync: this.lastSync,
        status: 'error',
      };
    }
  }

  /**
   * Subir datos locales a Supabase
   */
  async uploadLocalData(): Promise<SyncResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        uploaded: 0,
        downloaded: 0,
        conflicts: [],
        errors: ['Supabase no está configurado'],
        timestamp: new Date().toISOString(),
      };
    }

    const result: SyncResult = {
      success: true,
      uploaded: 0,
      downloaded: 0,
      conflicts: [],
      errors: [],
      timestamp: new Date().toISOString(),
    };

    try {
      // 1. Subir ingredientes de fitoterapia
      const fitoterapia = (fitoterapiaData as any).ingredientes;
      for (const ing of fitoterapia) {
        await this.uploadIngredient(ing, 'fitoterapia');
        result.uploaded++;
      }

      // 2. Subir ingredientes de homeopatia
      const homeopatia = (homeopatiaData as any).ingredientes;
      for (const ing of homeopatia) {
        await this.uploadIngredient(ing, 'homeopatia');
        result.uploaded++;
      }

      // 3. Subir aceites esenciales
      const aceites = (aceitesData as any).ingredientes;
      for (const ing of aceites) {
        await this.uploadIngredient(ing, 'aceite_esencial');
        result.uploaded++;
      }

      // 4. Subir vitaminas/minerales
      const vitaminas = (vitaminasData as any).ingredientes;
      for (const ing of vitaminas) {
        const category = ing.categoria === 'minerales' ? 'minerales' : 'vitaminas';
        await this.uploadIngredient(ing, category as any);
        result.uploaded++;
      }

      // 5. Subir sinergias
      const sinergias = (synergiesData as any).sinergias;
      for (const syn of sinergias) {
        await this.uploadSynergy(syn);
        result.uploaded++;
      }

      // Actualizar timestamp de sincronización
      this.lastSync = new Date().toISOString();
      localStorage.setItem('kb_last_sync', this.lastSync);

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Error desconocido');
    }

    return result;
  }

  /**
   * Subir un ingrediente a Supabase
   */
  private async uploadIngredient(data: any, category: string): Promise<void> {
    const ingredientData = {
      ingredient_key: data.id,
      name: data.nombre,
      scientific_name: data.nombreCientifico,
      family: data.familia,
      category: category,
      description: data.descripcion,
      mechanism: data.mecanismoAccion,
      evidence_level: data.nivelEvidencia || 'C',
      origin_type: 'planta',
      origin_description: data.origen?.description,
      search_terms: [
        data.nombre,
        data.nombreCientifico,
        ...(data.nombresAlternativos || []),
      ].filter(Boolean),
      synonyms: data.nombresAlternativos || [],
      fitoterapia_data: category === 'fitoterapia' ? {
        parte_usada: data.parteUsada,
        formas_presentacion: data.formasPresentacion,
        tiempo_efecto: data.tiempoEfecto,
        duracion_tratamiento: data.duracionTratamiento,
        advertencias: data.advertencias,
        interacciones: data.interaccionesMedicamentosas,
      } : null,
      homeopatia_data: category === 'homeopatia' ? {
        diluciones_ch: data.dilucionesCH,
        sintomas_clave: data.sintomasClave,
        modalidades: data.modalidades,
        afinidad: data.afinidad,
        constelaciones: data.constelaciones,
      } : null,
      aceite_data: category === 'aceite_esencial' ? {
        parte_destilada: data.parteDestilada,
        metodo_extraccion: data.metodoExtraccion,
        quimiotipo: data.quimiotipo,
        dilucion_recomendada: data.dilucionRecomendada,
        precauciones_topico: data.precaucionesTopico,
        metodos_uso: data.metodosUso,
        compatibilidad: data.compatibilidad,
      } : null,
      supplements_data: ['vitaminas', 'minerales'].includes(category) ? {
        dosis_diaria: data.dosisDiaria,
        dosis_maxima: data.dosisMaxima,
        forma_quimica: data.formaQuimica,
        biodisponibilidad: data.biodisponibilidad,
        momento_toma: data.momentoToma,
        tomar_con: data.tomarCon,
        evitar_con: data.evitarCon,
      } : null,
      is_active: true,
    };

    // Upsert: actualizar si existe, insertar si no
    const { error } = await supabase
      .from('ingredients')
      .upsert(ingredientData, { 
        onConflict: 'ingredient_key',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error(`[SupabaseKBService] Error uploading ingredient ${data.id}:`, error);
      throw error;
    }

    // Subir relaciones con sistemas corporales
    if (data.sistemas) {
      await this.uploadBodySystems(data.id, data.sistemas);
    }

    // Subir relaciones con indicaciones
    if (data.indicaciones) {
      await this.uploadIndications(data.id, data.indicaciones);
    }
  }

  /**
   * Subir relaciones ingrediente-sistema corporal
   */
  private async uploadBodySystems(ingredientKey: string, systems: string[]): Promise<void> {
    // Primero obtener el ID del ingrediente
    const { data: ingredient } = await supabase
      .from('ingredients')
      .select('id')
      .eq('ingredient_key', ingredientKey)
      .single();

    if (!ingredient) return;

    for (const systemName of systems) {
      // Obtener ID del sistema
      const { data: system } = await supabase
        .from('body_systems')
        .select('id')
        .eq('name', systemName)
        .single();

      if (system) {
        await supabase
          .from('ingredient_body_systems')
          .upsert({
            ingredient_id: ingredient.id,
            system_id: system.id,
            importance: 'primary',
          }, { onConflict: 'ingredient_id,system_id' });
      }
    }
  }

  /**
   * Subir relaciones ingrediente-indicación
   */
  private async uploadIndications(ingredientKey: string, indications: string[]): Promise<void> {
    const { data: ingredient } = await supabase
      .from('ingredients')
      .select('id')
      .eq('ingredient_key', ingredientKey)
      .single();

    if (!ingredient) return;

    for (const indicationName of indications) {
      const { data: indication } = await supabase
        .from('indications')
        .select('id')
        .eq('name', indicationName)
        .single();

      if (indication) {
        await supabase
          .from('ingredient_indications')
          .upsert({
            ingredient_id: ingredient.id,
            indication_id: indication.id,
            evidence_level: 'C',
          }, { onConflict: 'ingredient_id,indication_id' });
      }
    }
  }

  /**
   * Subir una sinergia a Supabase
   */
  private async uploadSynergy(data: any): Promise<void> {
    // Obtener IDs de los ingredientes
    const { data: ingA } = await supabase
      .from('ingredients')
      .select('id')
      .eq('ingredient_key', data.ingredienteA)
      .single();

    const { data: ingB } = await supabase
      .from('ingredients')
      .select('id')
      .eq('ingredient_key', data.ingredienteB)
      .single();

    if (!ingA || !ingB) {
      console.warn(`[SupabaseKBService] Ingredients not found for synergy: ${data.ingredienteA} + ${data.ingredienteB}`);
      return;
    }

    // Asegurar orden consistente (menor primero)
    const [aId, bId] = [ingA.id, ingB.id].sort();

    const synergyData = {
      ingredient_a_id: aId,
      ingredient_b_id: bId,
      synergy_type: data.tipo,
      evidence_level: data.nivelEvidencia || 'C',
      description: data.descripcion,
      mechanism: data.mecanismo,
      benefits: data.beneficios,
      precautions: data.precauciones,
      is_active: true,
      is_validated: true,
    };

    await supabase
      .from('sinergias')
      .upsert(synergyData, { 
        onConflict: 'ingredient_a_id,ingredient_b_id',
        ignoreDuplicates: false 
      });
  }

  /**
   * Descargar datos de Supabase
   */
  async downloadRemoteData(): Promise<SyncResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        uploaded: 0,
        downloaded: 0,
        conflicts: [],
        errors: ['Supabase no está configurado'],
        timestamp: new Date().toISOString(),
      };
    }

    const result: SyncResult = {
      success: true,
      uploaded: 0,
      downloaded: 0,
      conflicts: [],
      errors: [],
      timestamp: new Date().toISOString(),
    };

    try {
      // Descargar ingredientes
      const { data: ingredients, error: ingError } = await supabase
        .from('ingredients')
        .select('*')
        .eq('is_active', true);

      if (ingError) throw ingError;

      // Guardar en localStorage para caché
      localStorage.setItem('kb_remote_ingredients', JSON.stringify(ingredients || []));
      result.downloaded += (ingredients?.length || 0);

      // Descargar sinergias
      const { data: synergies, error: synError } = await supabase
        .from('sinergias')
        .select('*')
        .eq('is_active', true);

      if (synError) throw synError;

      localStorage.setItem('kb_remote_synergies', JSON.stringify(synergies || []));
      result.downloaded += (synergies?.length || 0);

      // Actualizar timestamp
      this.lastSync = new Date().toISOString();
      localStorage.setItem('kb_last_sync', this.lastSync);

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Error desconocido');
    }

    return result;
  }

  /**
   * Sincronización bidireccional completa
   */
  async syncAll(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return {
        success: false,
        uploaded: 0,
        downloaded: 0,
        conflicts: [],
        errors: ['Sincronización ya en progreso'],
        timestamp: new Date().toISOString(),
      };
    }

    this.syncInProgress = true;

    try {
      // 1. Subir datos locales
      const uploadResult = await this.uploadLocalData();
      
      // 2. Descargar datos remotos
      const downloadResult = await this.downloadRemoteData();

      // 3. Combinar resultados
      return {
        success: uploadResult.success && downloadResult.success,
        uploaded: uploadResult.uploaded,
        downloaded: downloadResult.downloaded,
        conflicts: [...uploadResult.conflicts, ...downloadResult.conflicts],
        errors: [...uploadResult.errors, ...downloadResult.errors],
        timestamp: new Date().toISOString(),
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Obtener ingredientes desde caché local (incluye datos remotos si están disponibles)
   */
  getCachedIngredients(): any[] {
    // Intentar primero datos remotos descargados
    const remoteData = localStorage.getItem('kb_remote_ingredients');
    if (remoteData) {
      return JSON.parse(remoteData);
    }

    // Fallback a datos locales
    const ingredients: any[] = [];
    
    (fitoterapiaData as any).ingredientes?.forEach((ing: any) => {
      ingredients.push({ ...ing, _source: 'local' });
    });
    
    (homeopatiaData as any).ingredientes?.forEach((ing: any) => {
      ingredients.push({ ...ing, _source: 'local' });
    });
    
    (aceitesData as any).ingredientes?.forEach((ing: any) => {
      ingredients.push({ ...ing, _source: 'local' });
    });
    
    (vitaminasData as any).ingredientes?.forEach((ing: any) => {
      ingredients.push({ ...ing, _source: 'local' });
    });

    return ingredients;
  }

  /**
   * Limpiar caché local
   */
  async clearCache(): Promise<void> {
    localStorage.removeItem('kb_remote_ingredients');
    localStorage.removeItem('kb_remote_synergies');
    localStorage.removeItem('kb_last_sync');
    this.lastSync = null;
  }
}

// Exportar singleton
export const supabaseKBService = SupabaseKBService.getInstance();
