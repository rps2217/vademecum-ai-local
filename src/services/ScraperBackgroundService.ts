/**
 * ScraperBackgroundService
 * Gestiona el scraper en segundo plano con control de activación/desactivación
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseService } from './SupabaseService';
import { logger } from './LoggerService';

export interface ScraperConfig {
  enabled: boolean;
  intervalMinutes: number;
  targetUrl: string;
  categories: string[];
  lastRun: string;
  autoSync: boolean;
}

export interface ScraperHistoryEntry {
  id: string;
  startTime: string;
  endTime: string | null;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  productsScraped: number;
  errorMessage: string | null;
}

export interface ScraperStatus {
  isRunning: boolean;
  isEnabled: boolean;
  lastRun: string | null;
  productsScraped: number;
  nextRun: string | null;
  history: ScraperHistoryEntry[];
}

class ScraperBackgroundService {
  private static instance: ScraperBackgroundService;
  private config: ScraperConfig = {
    enabled: false,
    intervalMinutes: 60,
    targetUrl: 'https://www.farmaciasknop.com',
    categories: ['homeopatia', 'fitoterapia', 'vitaminas-y-suplementos', 'salud-natural'],
    lastRun: '',
    autoSync: true
  };
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;
  private currentHistoryId: string | null = null;

  private constructor() {
    this.loadConfig();
  }

  static getInstance(): ScraperBackgroundService {
    if (!ScraperBackgroundService.instance) {
      ScraperBackgroundService.instance = new ScraperBackgroundService();
    }
    return ScraperBackgroundService.instance;
  }

  /**
   * Obtiene el cliente de Supabase
   */
  private getClient(): SupabaseClient | null {
    const service = supabaseService.getInstance();
    return service.getClient();
  }

  /**
   * Carga la configuración desde Supabase
   */
  async loadConfig(): Promise<ScraperConfig | null> {
    const client = this.getClient();
    if (!client) {
      logger.warn('ScraperBackgroundService: No hay cliente de Supabase', 'Scraper');
      return null;
    }

    try {
      const { data, error } = await client
        .from('scraper_config')
        .select('config_key, config_value')
        .in('config_key', ['enabled', 'interval_minutes', 'target_url', 'categories', 'last_run', 'auto_sync']);

      if (error) {
        logger.error('Error cargando config del scraper', 'Scraper', error);
        return null;
      }

      if (data) {
        const configMap = new Map(data.map(c => [c.config_key, c.config_value]));
        
        this.config = {
          enabled: configMap.get('enabled') === 'true',
          intervalMinutes: parseInt(configMap.get('interval_minutes') || '60', 10),
          targetUrl: configMap.get('target_url') || 'https://www.farmaciasknop.com',
          categories: (configMap.get('categories') || '').split(',').filter(Boolean),
          lastRun: configMap.get('last_run') || '',
          autoSync: configMap.get('auto_sync') !== 'false'
        };
      }

      logger.info(`Scraper config cargada: enabled=${this.config.enabled}`, 'Scraper');
      return this.config;
    } catch (error) {
      logger.error('Error al cargar configuración del scraper', 'Scraper', error);
      return null;
    }
  }

  /**
   * Guarda la configuración en Supabase
   */
  async saveConfig(updates: Partial<ScraperConfig>): Promise<boolean> {
    const client = this.getClient();
    if (!client) {
      logger.error('No hay cliente de Supabase para guardar config', 'Scraper');
      return false;
    }

    try {
      const configToSave = [
        updates.enabled !== undefined ? { key: 'enabled', value: String(updates.enabled) } : null,
        updates.intervalMinutes !== undefined ? { key: 'interval_minutes', value: String(updates.intervalMinutes) } : null,
        updates.targetUrl !== undefined ? { key: 'target_url', value: updates.targetUrl } : null,
        updates.categories !== undefined ? { key: 'categories', value: updates.categories.join(',') } : null,
        updates.autoSync !== undefined ? { key: 'auto_sync', value: String(updates.autoSync) } : null,
      ].filter(Boolean) as { key: string; value: string }[];

      for (const item of configToSave) {
        const { error } = await client
          .from('scraper_config')
          .upsert({ 
            config_key: item.key, 
            config_value: item.value,
            updated_at: new Date().toISOString()
          }, { onConflict: 'config_key' });

        if (error) {
          logger.error(`Error guardando ${item.key}`, 'Scraper', error);
          return false;
        }
      }

      // Recargar configuración local
      await this.loadConfig();
      
      // Si cambió el enabled o el intervalo, reiniciar el ciclo
      if (updates.enabled !== undefined || updates.intervalMinutes !== undefined) {
        this.restartCycle();
      }

      logger.success('Configuración del scraper guardada', 'Scraper');
      return true;
    } catch (error) {
      logger.error('Error al guardar configuración del scraper', 'Scraper', error);
      return false;
    }
  }

  /**
   * Activa el scraper en segundo plano
   */
  async enable(): Promise<boolean> {
    return this.saveConfig({ enabled: true });
  }

  /**
   * Desactiva el scraper en segundo plano
   */
  async disable(): Promise<boolean> {
    // Detener cualquier ejecución en curso
    if (this.isProcessing) {
      await this.stopCurrentRun();
    }
    return this.saveConfig({ enabled: false });
  }

  /**
   * Inicia el ciclo de ejecución periódica
   */
  startCycle(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    if (!this.config.enabled) {
      logger.info('Scraper deshabilitado, no se inicia ciclo', 'Scraper');
      return;
    }

    const intervalMs = this.config.intervalMinutes * 60 * 1000;
    
    logger.info(`Iniciando ciclo de scraper cada ${this.config.intervalMinutes} minutos`, 'Scraper');
    
    // Ejecutar inmediatamente una vez
    this.runScraper();

    // Programar ejecuciones futuras
    this.intervalId = setInterval(() => {
      this.runScraper();
    }, intervalMs);
  }

  /**
   * Reinicia el ciclo (para aplicar cambios de configuración)
   */
  restartCycle(): void {
    this.stopCycle();
    this.startCycle();
  }

  /**
   * Detiene el ciclo de ejecución
   */
  stopCycle(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Ciclo de scraper detenido', 'Scraper');
    }
  }

  /**
   * Ejecuta el scraper una vez
   */
  async runScraper(): Promise<{ success: boolean; productsScraped: number; error?: string }> {
    if (this.isProcessing) {
      logger.warn('Scraper ya está en ejecución, saltando...', 'Scraper');
      return { success: false, productsScraped: 0, error: 'Ya hay una ejecución en curso' };
    }

    if (!this.config.enabled) {
      logger.info('Scraper deshabilitado, no se ejecuta', 'Scraper');
      return { success: false, productsScraped: 0, error: 'Scraper deshabilitado' };
    }

    this.isProcessing = true;
    const startTime = new Date().toISOString();
    let productsScraped = 0;

    logger.info('=== INICIANDO SCRAPER ===', 'Scraper');

    try {
      // Crear registro de historial
      const historyEntry = await this.createHistoryEntry(startTime);
      this.currentHistoryId = historyEntry?.id || null;

      // Ejecutar scraping a través de la API del backend
      const result = await this.executeScraping();
      productsScraped = result.productsScraped;

      // Actualizar last_run
      await this.saveConfig({ lastRun: startTime });

      // Actualizar historial como completado
      if (this.currentHistoryId) {
        await this.updateHistoryEntry(this.currentHistoryId, {
          endTime: new Date().toISOString(),
          status: 'completed',
          productsScraped
        });
      }

      logger.success(`Scraper completado: ${productsScraped} productos`, 'Scraper');
      
      return { success: true, productsScraped };
    } catch (error: any) {
      logger.error('Error en scraper', 'Scraper', error);

      // Actualizar historial como fallido
      if (this.currentHistoryId) {
        await this.updateHistoryEntry(this.currentHistoryId, {
          endTime: new Date().toISOString(),
          status: 'failed',
          errorMessage: error.message
        });
      }

      return { success: false, productsScraped, error: error.message };
    } finally {
      this.isProcessing = false;
      this.currentHistoryId = null;
    }
  }

  /**
   * Detiene la ejecución actual
   */
  async stopCurrentRun(): Promise<boolean> {
    if (this.currentHistoryId) {
      await this.updateHistoryEntry(this.currentHistoryId, {
        endTime: new Date().toISOString(),
        status: 'stopped'
      });
    }
    this.isProcessing = false;
    this.currentHistoryId = null;
    logger.info('Scraper detenido por el usuario', 'Scraper');
    return true;
  }

  /**
   * Ejecuta el scraping a través de la API del backend
   */
  private async executeScraping(): Promise<{ productsScraped: number }> {
    const baseUrl = this.config.targetUrl;
    let totalProducts = 0;

    for (const category of this.config.categories) {
      const categoryUrl = `${baseUrl}/${category}`;
      logger.info(`Scraping categoría: ${category}`, 'Scraper');

      try {
        const response = await fetch(`/api/scrape-category?url=${encodeURIComponent(categoryUrl)}`);
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.products) {
          const products = Array.isArray(data.products) ? data.products : [];
          
          // Guardar productos en Supabase si autoSync está habilitado
          if (this.config.autoSync) {
            for (const product of products) {
              await this.saveProduct(product);
            }
          }
          
          totalProducts += products.length;
          logger.info(`Categoría ${category}: ${products.length} productos`, 'Scraper');
        }
      } catch (error: any) {
        logger.error(`Error scraping categoría ${category}`, 'Scraper', error.message);
      }
    }

    return { productsScraped: totalProducts };
  }

  /**
   * Guarda un producto en Supabase
   */
  private async saveProduct(product: any): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      const { error } = await client
        .from('products')
        .upsert({
          sku: product.sku || product.id || `scrape_${Date.now()}`,
          nombre_comercial: product.nombre_comercial || product.name || 'Sin nombre',
          data: product,
          last_updated: new Date().toISOString()
        }, { onConflict: 'sku' });

      if (error) {
        logger.error('Error guardando producto', 'Scraper', error);
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Crea un registro de historial
   */
  private async createHistoryEntry(startTime: string): Promise<{ id: string } | null> {
    const client = this.getClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('scraper_history')
        .insert({ start_time: startTime, status: 'running' })
        .select('id')
        .single();

      if (error) {
        logger.error('Error creando historial', 'Scraper', error);
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Actualiza un registro de historial
   */
  private async updateHistoryEntry(
    id: string, 
    updates: { endTime?: string; status?: string; productsScraped?: number; errorMessage?: string }
  ): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      const { error } = await client
        .from('scraper_history')
        .update({
          end_time: updates.endTime,
          status: updates.status,
          products_scraped: updates.productsScraped,
          error_message: updates.errorMessage
        })
        .eq('id', id);

      if (error) {
        logger.error('Error actualizando historial', 'Scraper', error);
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene el estado actual del scraper
   */
  async getStatus(): Promise<ScraperStatus> {
    await this.loadConfig();

    const history = await this.getHistory(5);
    const lastEntry = history[0];

    let nextRun: string | null = null;
    if (this.config.enabled && this.config.lastRun) {
      const lastRunDate = new Date(this.config.lastRun);
      const nextRunDate = new Date(lastRunDate.getTime() + this.config.intervalMinutes * 60 * 1000);
      nextRun = nextRunDate.toISOString();
    }

    return {
      isRunning: this.isProcessing,
      isEnabled: this.config.enabled,
      lastRun: this.config.lastRun || null,
      productsScraped: lastEntry?.productsScraped || 0,
      nextRun,
      history
    };
  }

  /**
   * Obtiene el historial de ejecuciones
   */
  async getHistory(limit: number = 10): Promise<ScraperHistoryEntry[]> {
    const client = this.getClient();
    if (!client) return [];

    try {
      const { data, error } = await client
        .from('scraper_history')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error obteniendo historial', 'Scraper', error);
        return [];
      }

      return (data || []).map((entry: any) => ({
        id: entry.id,
        startTime: entry.start_time,
        endTime: entry.end_time,
        status: entry.status,
        productsScraped: entry.products_scraped || 0,
        errorMessage: entry.error_message
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): ScraperConfig {
    return { ...this.config };
  }

  /**
   * Inicializa el servicio (llamar al cargar la app)
   */
  async initialize(): Promise<void> {
    await this.loadConfig();
    if (this.config.enabled) {
      this.startCycle();
    }
  }
}

export const scraperBackgroundService = ScraperBackgroundService.getInstance();
