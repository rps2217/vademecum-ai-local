/**
 * ProductScrapingService - Servicio para scraping de información de productos
 * Implementa múltiples estrategias de obtención de datos
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
  /**
   * Realizar scraping de un producto por SKU
   */
  async scrape(sku: string): Promise<ScrapingResult> {
    const cleanSku = this.cleanSku(sku);
    
    if (!cleanSku || cleanSku.length < 5) {
      return { success: false, error: 'SKU inválido' };
    }

    logger.info(`Iniciando scraping para SKU: ${cleanSku}`, 'Scraping');

    // Estrategia 1: API local
    let result = await this.tryApi(cleanSku);
    
    // Estrategia 2: Scraping directo
    if (!result?.success) {
      result = await this.tryDirectScrape(cleanSku);
    }

    if (result?.success && result.datos) {
      logger.info(`Scraping completado para SKU: ${cleanSku}`, 'Scraping');
    } else {
      logger.warn(`Scraping falló para SKU: ${cleanSku}`, 'Scraping');
    }

    return result;
  }

  /**
   * Limpiar SKU de caracteres extraños
   */
  private cleanSku(sku: string): string {
    return sku.trim().split(' ')[0].split('\n')[0];
  }

  /**
   * Intentar obtener datos via API local
   */
  private async tryApi(sku: string): Promise<ScrapingResult | null> {
    try {
      const response = await fetch(`/api/scrape-product?sku=${encodeURIComponent(sku)}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (apiError) {
      console.log('[Scraping] API no disponible');
    }
    return null;
  }

  /**
   * Scraping directo desde farmacias
   */
  private async tryDirectScrape(sku: string): Promise<ScrapingResult> {
    const searchUrl = `https://www.farmaciasknop.com/catalogsearch/result?q=${encodeURIComponent(sku)}`;
    
    try {
      const response = await fetch(searchUrl);
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const productLink = doc.querySelector(
        '.product-item a, .vtex-product-summary-2-x-productLink, .items-list .item a'
      );
      
      if (productLink) {
        const productUrl = productLink.getAttribute('href');
        if (productUrl) {
          return await this.extractProductData(productUrl, sku);
        }
      }
      
      return { success: false, error: 'Producto no encontrado' };
    } catch (error) {
      logger.error('[Scraping] Error en fetch directo:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  /**
   * Extraer datos del producto desde su URL
   */
  private async extractProductData(productUrl: string, sku: string): Promise<ScrapingResult> {
    try {
      const response = await fetch(productUrl);
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const nombre = doc.querySelector(
        'h1.page-title span, .vtex-store-components-3-x-productNameContainer span, h1'
      )?.textContent?.trim();
      
      const skuText = doc.querySelector(
        '[itemprop="sku"], .sku .value, .product-code'
      )?.textContent?.trim();
      
      const marca = doc.querySelector(
        '.product-brand, [itemprop="brand"], .vtex-store-components-3-x-productBrand'
      )?.textContent?.trim();
      
      const descripcion = doc.querySelector(
        '.product.attribute.description, #description'
      )?.textContent?.trim()?.substring(0, 500);
      
      const imagen = doc.querySelector(
        '.product-image-photo, .vtex-store-components-3-x-productImage'
      )?.getAttribute('src');
      
      const precio = doc.querySelector(
        '[itemprop="price"], .price-wrapper .price'
      )?.textContent?.trim();
      
      const categoria = doc.querySelector(
        '.breadcrumbs .current:last-child, .vtex-breadcrumb-1-x-current'
      )?.textContent?.trim();

      if (nombre) {
        return {
          success: true,
          datos: {
            nombre_comercial: nombre,
            sku: skuText || sku,
            marca: marca,
            descripcion: descripcion,
            precio: precio,
            categoria: categoria,
            imagen_url: imagen,
            principios_activos: [],
            indicaciones: []
          }
        };
      }

      return { success: false, error: 'Datos no encontrados' };
    } catch (error) {
      return { success: false, error: 'Error extrayendo datos' };
    }
  }
}

export const productScrapingService = new ProductScrapingService();
export default productScrapingService;
