/**
 * SupabaseSyncService - Sincroniza productos desde Supabase
 * 
 * Descarga productos de la base de datos cloud y los integra
 * con la base de conocimiento local.
 * 
 * Soporta:
 * - products (legacy con data JSONB)
 * - products_v2 (schema normalizado)
 * - protocols (protocolos de suplementación)
 */

import { Product } from '../core/types/product.types';
import { logger } from './LoggerService';
import type { 
  ProductV2, 
  ProductV2Summary, 
  Protocol, 
  ProtocolSummary,
  Synergy,
  Antagonism 
} from '../core/types/schema.types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface SyncResult {
  success: boolean;
  productsLoaded: number;
  error?: string;
}

// ============================================
// PRODUCTOS LEGACY (con data JSONB)
// ============================================

export interface CloudProduct {
  sku: string;
  nombre_comercial: string | null;
  data: {
    nombre_comercial: string;
    descripcion: string;
    principios_activos: string[];
    indicaciones: string[];
    tags_ia: string[];
    advertencias: string;
    posologia: string;
    vectores?: number[];
    sugerencia_complementaria?: string;
    [key: string]: any;
  };
  last_updated: string;
}

// ============================================
// SERVICE
// ============================================

class SupabaseSyncService {
  private static instance: SupabaseSyncService;
  private cachedProducts: CloudProduct[] = [];
  private cachedProductsV2: ProductV2[] = [];
  private cachedProtocols: Protocol[] = [];
  private lastSync: number = 0;
  private syncInterval: number = 5 * 60 * 1000; // 5 minutos

  static getInstance(): SupabaseSyncService {
    if (!SupabaseSyncService.instance) {
      SupabaseSyncService.instance = new SupabaseSyncService();
    }
    return SupabaseSyncService.instance;
  }

  /**
   * Verificar si Supabase está configurado
   */
  isConfigured(): boolean {
    return Boolean(SUPABASE_URL && SUPABASE_KEY);
  }

  /**
   * Headers por defecto para requests
   */
  private getHeaders(): Record<string, string> {
    return {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  // ============================================
  // PRODUCTOS LEGACY (products)
  // ============================================

  /**
   * Obtener todos los productos desde Supabase (legacy)
   */
  async fetchAllProducts(): Promise<CloudProduct[]> {
    if (!this.isConfigured()) {
      logger.warn('Supabase no configurado', 'SupabaseSync');
      return [];
    }

    try {
      logger.info('Descargando productos desde Supabase...', 'SupabaseSync');
      
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/products?select=sku,nombre_comercial,data,last_updated`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const products: CloudProduct[] = await response.json();
      logger.success(`Descargados ${products.length} productos`, 'SupabaseSync');
      
      this.cachedProducts = products;
      this.lastSync = Date.now();
      
      return products;
    } catch (error) {
      logger.error('Error descargando productos', 'SupabaseSync', error);
      throw error;
    }
  }

  /**
   * Buscar productos por query (legacy)
   */
  async searchProducts(query: string): Promise<CloudProduct[]> {
    if (!this.isConfigured() || !query.trim()) {
      return [];
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/products?select=sku,nombre_comercial,data,last_updated&or=(data.ilike.*${encodeURIComponent(query)}*,nombre_comercial.ilike.*${encodeURIComponent(query)}*)&limit=50`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error buscando productos', 'SupabaseSync', error);
      return [];
    }
  }

  // ============================================
  // PRODUCTOS V2 (normalizado)
  // ============================================

  /**
   * Obtener productos desde products_v2
   */
  async fetchProductsV2(): Promise<ProductV2[]> {
    if (!this.isConfigured()) return [];

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/products_v2?select=*&order=nombre_comercial.asc`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        // Tabla no existe aún
        if (response.status === 404) {
          logger.warn('products_v2 no existe. Ejecuta la migración primero.', 'SupabaseSync');
          return [];
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const products: ProductV2[] = await response.json();
      this.cachedProductsV2 = products;
      return products;
    } catch (error) {
      logger.error('Error obteniendo products_v2', 'SupabaseSync', error);
      return [];
    }
  }

  /**
   * Buscar en products_v2
   */
  async searchProductsV2(query: string): Promise<ProductV2[]> {
    if (!this.isConfigured() || !query.trim()) return [];

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/products_v2?select=*&or=(nombre_comercial.ilike.*${encodeURIComponent(query)}*,descripcion.ilike.*${encodeURIComponent(query)}*)&limit=50`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      logger.error('Error buscando products_v2', 'SupabaseSync', error);
      return [];
    }
  }

  /**
   * Buscar por principios activos
   */
  async searchByIngredients(ingredients: string[]): Promise<ProductV2[]> {
    if (!this.isConfigured() || ingredients.length === 0) return [];

    const filters = ingredients
      .map(ing => `principios_activos.ilike.*${encodeURIComponent(ing)}*`)
      .join(',');

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/products_v2?select=*&or=(${filters})&limit=50`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      logger.error('Error buscando por ingredientes', 'SupabaseSync', error);
      return [];
    }
  }

  /**
   * Obtener producto por SKU
   */
  async getProductBySku(sku: string): Promise<ProductV2 | null> {
    if (!this.isConfigured()) return null;

    try {
      // Primero intentar en products_v2
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/products_v2?sku=eq.${encodeURIComponent(sku)}&select=*`,
        { headers: this.getHeaders() }
      );

      if (response.ok) {
        const products = await response.json();
        if (products.length > 0) return products[0];
      }

      // Fallback a products legacy
      const legacyResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/products?sku=eq.${encodeURIComponent(sku)}&select=*`,
        { headers: this.getHeaders() }
      );

      if (legacyResponse.ok) {
        const legacyProducts = await legacyResponse.json();
        if (legacyProducts.length > 0) {
          // Convertir a ProductV2
          return this.legacyToV2(legacyProducts[0]);
        }
      }

      return null;
    } catch (error) {
      logger.error('Error obteniendo producto', 'SupabaseSync', error);
      return null;
    }
  }

  // ============================================
  // PROTOCOLS
  // ============================================

  /**
   * Obtener todos los protocolos
   */
  async fetchProtocols(): Promise<Protocol[]> {
    if (!this.isConfigured()) return [];

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/protocols?select=*&is_active=eq.true&order=is_featured.desc,created_at.desc`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        if (response.status === 404) {
          logger.warn('Tabla protocols no existe. Ejecuta la migración.', 'SupabaseSync');
          return [];
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const protocols: Protocol[] = await response.json();
      this.cachedProtocols = protocols;
      return protocols;
    } catch (error) {
      logger.error('Error obteniendo protocolos', 'SupabaseSync', error);
      return [];
    }
  }

  /**
   * Buscar protocolos
   */
  async searchProtocols(query: string): Promise<Protocol[]> {
    if (!this.isConfigured() || !query.trim()) return [];

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/protocols?select=*&or=(name.ilike.*${encodeURIComponent(query)}*,description.ilike.*${encodeURIComponent(query)}*,objetivo_principal.ilike.*${encodeURIComponent(query)}*)&is_active=eq.true&limit=20`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      logger.error('Error buscando protocolos', 'SupabaseSync', error);
      return [];
    }
  }

  /**
   * Obtener protocolo por ID
   */
  async getProtocolById(id: string): Promise<Protocol | null> {
    if (!this.isConfigured()) return null;

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/protocols?id=eq.${id}&select=*`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) return null;
      const protocols = await response.json();
      return protocols.length > 0 ? protocols[0] : null;
    } catch (error) {
      logger.error('Error obteniendo protocolo', 'SupabaseSync', error);
      return null;
    }
  }

  // ============================================
  // SINERGIAS Y ANTAGONISMOS
  // ============================================

  /**
   * Obtener sinergias para un ingrediente
   */
  async getSynergiesForIngredient(ingredientId: string): Promise<Synergy[]> {
    if (!this.isConfigured()) return [];

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/synergies?or=(ingredient_a_id.eq.${ingredientId},ingredient_b_id.eq.${ingredientId})&is_active=eq.true&select=*`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      logger.error('Error obteniendo sinergias', 'SupabaseSync', error);
      return [];
    }
  }

  /**
   * Obtener antagonismos para un ingrediente
   */
  async getAntagonismsForIngredient(ingredientId: string): Promise<Antagonism[]> {
    if (!this.isConfigured()) return [];

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/antagonisms?or=(ingredient_a_id.eq.${ingredientId},ingredient_b_id.eq.${ingredientId})&select=*`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      logger.error('Error obteniendo antagonismos', 'SupabaseSync', error);
      return [];
    }
  }

  // ============================================
  // CACHÉ Y HELPERS
  // ============================================

  /**
   * Obtener productos cacheados
   */
  getCachedProducts(): CloudProduct[] {
    return this.cachedProducts;
  }

  /**
   * Obtener productos_v2 cacheados
   */
  getCachedProductsV2(): ProductV2[] {
    return this.cachedProductsV2;
  }

  /**
   * Obtener protocolos cacheados
   */
  getCachedProtocols(): Protocol[] {
    return this.cachedProtocols;
  }

  /**
   * Obtener estadísticas de sincronización
   */
  getSyncStats() {
    return {
      legacyProducts: this.cachedProducts.length,
      productsV2: this.cachedProductsV2.length,
      protocols: this.cachedProtocols.length,
      lastSync: this.lastSync,
      isConfigured: this.isConfigured(),
      timeSinceSync: this.lastSync ? Date.now() - this.lastSync : null,
    };
  }

  /**
   * Convertir producto legacy a ProductV2
   */
  private legacyToV2(legacy: CloudProduct): ProductV2 {
    const data = legacy.data || {};
    return {
      id: '', // No tiene en legacy
      sku: legacy.sku,
      nombre_comercial: legacy.nombre_comercial || data.nombre_comercial || null,
      descripcion: data.descripcion || null,
      principios_activos: data.principios_activos || null,
      indicaciones: data.indicaciones || null,
      advertencias: data.advertencias || null,
      posologia: data.posologia || null,
      marca: null,
      categoria: data.categoria_principal || null,
      // Seguridad
      apto_celiacos: data.apto_celiacos === 'SI',
      apto_embarazo: data.apto_embarazo === 'SI',
      apto_lactancia: data.apto_lactancia === 'SI',
      apto_pediatria: data.apto_pediatria === 'SI',
      apto_diabeticos: data.apto_diabeticos === 'SI',
      alto_consumo_sodio: false,
      // IA
      tags_ia: data.tags_ia || null,
      vectors: null,
      vectors_dims: 384,
      synergy_analyzed: data.synergy_analyzed || false,
      sugerencia_complementaria: data.sugerencia_complementaria || null,
      analysis_notes: data.analisis_componentes || null,
      // Metadatos
      is_verified: data.is_verified || false,
      verified_at: data.verified_at || null,
      verified_by: data.verified_by || null,
      locked_by_ai: data.locked_by_ai || false,
      lock_timestamp: data.lock_timestamp || null,
      lock_uid: data.lock_uid || null,
      skus_relacionados: data.skus_relacionados || null,
      source_url: data.source_url || null,
      is_synced_cloud: data.is_synced_cloud || false,
      last_synced_cloud: data.last_synced_cloud || null,
      is_active: true,
      is_featured: false,
      created_at: legacy.last_updated,
      updated_at: legacy.last_updated,
      last_updated: legacy.last_updated,
    };
  }

  /**
   * Convertir producto cloud a formato local (legacy)
   */
  cloudToLocalProduct(cloudProduct: CloudProduct): Product {
    const data = cloudProduct.data || {};
    return {
      sku: cloudProduct.sku,
      nombre_comercial: cloudProduct.nombre_comercial || data.nombre_comercial || 'Sin nombre',
      descripcion: data.descripcion || '',
      principios_activos: data.principios_activos || [],
      indicaciones: data.indicaciones || [],
      tags: data.tags_ia || [],
      advertencias: data.advertencias || '',
      posologia: data.posologia || '',
      principio_activo_principal: data.principios_activos?.[0] || '',
      synonyms: [],
      safety_status: 'unknown' as const,
      related_products: [],
      last_updated: cloudProduct.last_updated,
    };
  }

  /**
   * Convertir ProductV2 a Product
   */
  productV2ToLocal(v2: ProductV2): Product {
    return {
      sku: v2.sku,
      nombre_comercial: v2.nombre_comercial || 'Sin nombre',
      descripcion: v2.descripcion || '',
      principios_activos: v2.principios_activos || [],
      indicaciones: v2.indicaciones || [],
      tags: v2.tags_ia || [],
      advertencias: v2.advertencias || '',
      posologia: v2.posologia || '',
      principio_activo_principal: v2.principios_activos?.[0] || '',
      synonyms: [],
      safety_status: 'unknown' as const,
      related_products: v2.skus_relacionados || [],
      last_updated: v2.last_updated || v2.updated_at,
    };
  }
}

export const supabaseSyncService = SupabaseSyncService.getInstance();
