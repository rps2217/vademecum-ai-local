/**
 * SupabaseSyncService - Sincroniza productos desde Supabase
 * 
 * Descarga productos de la base de datos cloud y los integra
 * con la base de conocimiento local.
 */

import { Product } from '../core/types/product.types';
import { logger } from './LoggerService';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface SyncResult {
  success: boolean;
  productsLoaded: number;
  error?: string;
}

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

class SupabaseSyncService {
  private static instance: SupabaseSyncService;
  private cachedProducts: CloudProduct[] = [];
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
   * Obtener todos los productos desde Supabase
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
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
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
   * Obtener productos con paginación
   */
  async fetchProductsPaginated(
    page: number = 1,
    pageSize: number = 100
  ): Promise<CloudProduct[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const offset = (page - 1) * pageSize;
    
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/products?select=sku,nombre_comercial,data,last_updated&limit=${pageSize}&offset=${offset}`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error(`Error en página ${page}`, 'SupabaseSync', error);
      throw error;
    }
  }

  /**
   * Buscar productos por query
   */
  async searchProducts(query: string): Promise<CloudProduct[]> {
    if (!this.isConfigured() || !query.trim()) {
      return [];
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/products?select=sku,nombre_comercial,data,last_updated&or=(data.ilike.*${query}*,nombre_comercial.ilike.*${query}*)&limit=50`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
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

  /**
   * Obtener producto por SKU
   */
  async getProductBySku(sku: string): Promise<CloudProduct | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/products?sku=eq.${encodeURIComponent(sku)}&select=*`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const products = await response.json();
      return products.length > 0 ? products[0] : null;
    } catch (error) {
      logger.error('Error obteniendo producto', 'SupabaseSync', error);
      return null;
    }
  }

  /**
   * Obtener productos por principios activos
   */
  async getProductsByIngredients(ingredients: string[]): Promise<CloudProduct[]> {
    if (!this.isConfigured() || ingredients.length === 0) {
      return [];
    }

    const ingredientFilters = ingredients
      .map(ing => `data.principios_activos.cs.{${ing}}`)
      .join(',');

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/products?select=sku,nombre_comercial,data&or=(${ingredientFilters})&limit=50`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error buscando por ingredientes', 'SupabaseSync', error);
      return [];
    }
  }

  /**
   * Obtener productos cacheados
   */
  getCachedProducts(): CloudProduct[] {
    return this.cachedProducts;
  }

  /**
   * Obtener estadísticas de sincronización
   */
  getSyncStats() {
    return {
      cachedCount: this.cachedProducts.length,
      lastSync: this.lastSync,
      isConfigured: this.isConfigured(),
      timeSinceSync: this.lastSync ? Date.now() - this.lastSync : null,
    };
  }

  /**
   * Convertir producto cloud a formato local
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
   * Convertir array de productos cloud a formato local
   */
  cloudToLocalProducts(cloudProducts: CloudProduct[]): Product[] {
    return cloudProducts.map(p => this.cloudToLocalProduct(p));
  }
}

export const supabaseSyncService = SupabaseSyncService.getInstance();
