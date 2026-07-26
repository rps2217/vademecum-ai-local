/**
 * useScraping - Hook para scraping de productos
 * Maneja el estado y operaciones de scraping web
 */

import { useState, useCallback } from 'react';
import { dataService } from '../services/DataService';
import { logger } from '../services/LoggerService';

export interface ScrapingResult {
  sku: string;
  success: boolean;
  data?: {
    nombre_comercial?: string;
    descripcion?: string;
    marca?: string;
    precio?: string;
    imagen_url?: string;
  };
  error?: string;
}

export interface ScrapingState {
  [sku: string]: 'idle' | 'scraping' | 'success' | 'error';
}

export interface UseScrapingReturn {
  scrapingStates: ScrapingState;
  isScraping: (sku: string) => boolean;
  scrapeProduct: (sku: string, url: string) => Promise<ScrapingResult>;
  scrapeBatch: (products: Array<{ sku: string; url: string }>) => Promise<ScrapingResult[]>;
  resetScrapingState: (sku: string) => void;
  resetAllStates: () => void;
}

export function useScraping(): UseScrapingReturn {
  const [scrapingStates, setScrapingStates] = useState<ScrapingState>({});

  const isScraping = useCallback((sku: string): boolean => {
    return scrapingStates[sku] === 'scraping';
  }, [scrapingStates]);

  const setState = useCallback((sku: string, state: ScrapingState[string]) => {
    setScrapingStates(prev => ({ ...prev, [sku]: state }));
  }, []);

  const scrapeProduct = useCallback(async (sku: string, url: string): Promise<ScrapingResult> => {
    setState(sku, 'scraping');
    
    try {
      logger.info(`Iniciando scraping para ${sku}`, 'Scraping');
      
      // Simular scraping - en producción esto usaría un servicio real
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Placeholder: guardar datos obtenidos del scraping
      const scrapedData = {
        sku,
        success: true,
        data: {
          // Aquí irían los datos reales del scraping
        }
      };

      // Guardar en base de datos local
      try {
        const existingProduct = await dataService.getProductBySku(sku);
        if (existingProduct) {
          await dataService.saveProduct({
            ...existingProduct,
            marca: scrapedData.data?.marca,
            precio: scrapedData.data?.precio,
            imagen_url: scrapedData.data?.imagen_url,
          });
        }
      } catch (e) {
        logger.warn(`No se pudo guardar datos de scraping para ${sku}`, 'Scraping');
      }

      setState(sku, 'success');
      return scrapedData;

    } catch (error: any) {
      logger.error(`Error en scraping ${sku}:`, 'Scraping', error);
      setState(sku, 'error');
      return {
        sku,
        success: false,
        error: error.message
      };
    }
  }, [setState]);

  const scrapeBatch = useCallback(async (
    products: Array<{ sku: string; url: string }>
  ): Promise<ScrapingResult[]> => {
    const results: ScrapingResult[] = [];
    
    for (const { sku, url } of products) {
      const result = await scrapeProduct(sku, url);
      results.push(result);
      
      // Pequeña pausa entre requests para no saturar
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
  }, [scrapeProduct]);

  const resetScrapingState = useCallback((sku: string) => {
    setState(sku, 'idle');
  }, [setState]);

  const resetAllStates = useCallback(() => {
    setScrapingStates({});
  }, []);

  return {
    scrapingStates,
    isScraping,
    scrapeProduct,
    scrapeBatch,
    resetScrapingState,
    resetAllStates
  };
}

export default useScraping;
