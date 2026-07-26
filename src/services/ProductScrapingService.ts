/**
 * ProductScrapingService - Servicio para scraping de información de productos
 * 
 * NOTA: El scraping directo desde el frontend está deshabilitado debido a 
 * restricciones CORS. Para habilitarlo, se necesita un backend/API proxy.
 */

import { logger } from './LoggerService';

export interface ScrapedProductData {
  nombre_comercial?: string;
  sku?: string;
  marca?: string;
  descripcion?: string;
  precio?: string;
  categoria?: string;
  imagen_url?: string;
  principios_activos?: string[];
  indicaciones?: string[];
}

export interface ScrapingResult {
  success: boolean;
  datos?: ScrapedProductData;
  error?: string;
}

class ProductScrapingService {
  async scrape(sku: string): Promise<ScrapingResult> {
    const cleanSku = this.cleanSku(sku);
    
    if (!cleanSku || cleanSku.length < 5) {
      return { success: false, error: 'SKU inválido' };
    }

    logger.info(`Scraping solicitado para SKU: ${cleanSku}`, 'Scraping');
    
    // El scraping desde el frontend está deshabilitado por CORS
    return { 
      success: false, 
      error: 'Scraping requiere API backend (CORS)' 
    };
  }

  private cleanSku(sku: string): string {
    return sku.trim().split(' ')[0].split('\n')[0];
  }

  isAvailable(): boolean {
    return false;
  }
}

export const productScrapingService = new ProductScrapingService();
export default productScrapingService;
