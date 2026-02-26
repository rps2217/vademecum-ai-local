import { AIService } from './AIService';
import { getDB } from '../core/database/db';
import { HardwareProfile } from '../core/types/hardware.types';

export type ScraperStatus = 'idle' | 'fetching_urls' | 'processing_products' | 'done' | 'error';

export class WebScraperManager {
  private static worker: Worker | null = null;
  private static status: ScraperStatus = 'idle';
  private static productQueue: string[] = [];
  private static processedCount = 0;
  private static totalCount = 0;
  private static onProgressCallback: ((status: ScraperStatus, processed: number, total: number, message: string) => void) | null = null;

  // Categorías de prueba (Farmacias Knop)
  private static readonly CATEGORIES = [
    'https://www.farmaciasknop.com/homeopatia',
    'https://www.farmaciasknop.com/fitoterapia'
  ];

  static subscribe(callback: (status: ScraperStatus, processed: number, total: number, message: string) => void) {
    this.onProgressCallback = callback;
  }

  static notify(message: string) {
    if (this.onProgressCallback) {
      this.onProgressCallback(this.status, this.processedCount, this.totalCount, message);
    }
  }

  static async startBackgroundSync(hardware?: HardwareProfile) {
    if (this.status !== 'idle' && this.status !== 'done' && this.status !== 'error') {
      console.warn('El scraper ya está en ejecución.');
      return;
    }

    this.status = 'fetching_urls';
    this.productQueue = [];
    this.processedCount = 0;
    this.totalCount = 0;
    this.notify('Iniciando sincronización en segundo plano...');

    // La IA ya debería estar inicializada por el SplashScreen
    if (!AIService.getStatus().isReady) {
      this.notify('Advertencia: El motor de IA no está listo. Los productos podrían no estructurarse correctamente.');
    }

    if (!this.worker) {
      this.worker = new Worker(new URL('../workers/scraper.worker.ts', import.meta.url), { type: 'module' });
      this.setupWorkerListeners();
    }

    // Iniciar con la primera categoría
    this.worker.postMessage({ type: 'FETCH_CATEGORY', payload: { url: this.CATEGORIES[0] } });
  }

  private static setupWorkerListeners() {
    if (!this.worker) return;

    this.worker.onmessage = async (e) => {
      const { type, payload, message } = e.data;

      if (type === 'LOG') {
        this.notify(message);
      } 
      else if (type === 'ERROR') {
        console.error('[WebScraper] Error:', message);
        // Continuar con el siguiente en la cola si es posible
        if (this.status === 'processing_products') {
          this.processNextProduct();
        }
      }
      else if (type === 'CATEGORY_HTML') {
        await this.handleCategoryHtml(payload.html);
      }
      else if (type === 'PRODUCT_HTML') {
        await this.handleProductHtml(payload.html, payload.url);
      }
    };
  }

  private static async handleCategoryHtml(html: string) {
    this.notify('Extrayendo URLs de productos...');
    
    // Usar DOMParser nativo del navegador para extraer URLs
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Selectores comunes en e-commerce (ajustar según el sitio)
    const links = doc.querySelectorAll('a.product-item-link, .vtex-product-summary-2-x-clearLink');
    
    const extractedUrls: string[] = [];
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `https://www.farmaciasknop.com${href}`;
        if (!extractedUrls.includes(fullUrl)) {
          extractedUrls.push(fullUrl);
        }
      }
    });

    // Filtrar URLs que ya existen en la base de datos
    try {
      const db = await getDB();
      const existingProducts = await db.getAll('products');
      
      // Extraemos todas las URLs que ya hemos procesado
      const existingUrls = existingProducts
        .map(p => p.source_url)
        .filter(Boolean) as string[];
      
      this.productQueue = extractedUrls.filter(url => !existingUrls.includes(url));
      
      if (existingUrls.length > 0) {
         this.notify(`Filtrando... ${existingUrls.length} productos ya existen en la base de datos local.`);
      }

    } catch (e) {
      console.error('Error verificando DB:', e);
      this.productQueue = extractedUrls;
    }

    this.totalCount = this.productQueue.length;
    
    if (this.totalCount > 0) {
      this.status = 'processing_products';
      this.notify(`Se encontraron ${this.totalCount} productos NUEVOS. Iniciando IA...`);
      this.processNextProduct();
    } else {
      this.status = 'done';
      this.notify('No se encontraron productos nuevos. Catálogo actualizado.');
    }
  }

  private static processNextProduct() {
    if (this.productQueue.length === 0) {
      this.status = 'done';
      this.notify('Sincronización completada al 100%.');
      return;
    }

    const nextUrl = this.productQueue.shift()!;
    this.notify(`Descargando producto ${this.processedCount + 1} de ${this.totalCount}...`);
    this.worker?.postMessage({ type: 'FETCH_PRODUCT', payload: { url: nextUrl } });
  }

  private static async handleProductHtml(html: string, url: string) {
    this.notify(`Estructurando con IA Local (${this.processedCount + 1}/${this.totalCount})...`);
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extraer texto relevante (Título, Descripción, Especificaciones)
    const title = doc.querySelector('h1.page-title, .vtex-store-components-3-x-productNameContainer span')?.textContent || '';
    const description = doc.querySelector('.product.attribute.description, .vtex-store-components-3-x-productDescriptionText')?.textContent || '';
    const specs = doc.querySelector('.product.attribute.additional, .vtex-store-components-3-x-specificationsTableContainer')?.textContent || '';
    
    const rawText = `Producto: ${title}\n\nDescripción:\n${description}\n\nEspecificaciones:\n${specs}`;

    // Pasar el texto crudo al WebLLM para que lo convierta en JSON
    const structuredProduct = await AIService.extractProductData(rawText, url);

    if (structuredProduct) {
      try {
        // Guardar la URL de origen para evitar re-scraping futuro
        structuredProduct.source_url = url;
        
        // Guardar en IndexedDB
        const db = await getDB();
        await db.put('products', structuredProduct);
        console.log(`[WebScraper] Producto guardado: ${structuredProduct.nombre_comercial}`);
      } catch (e) {
        console.error('[WebScraper] Error guardando en DB:', e);
      }
    }

    this.processedCount++;
    
    // Pausa para no sobrecalentar el dispositivo ni saturar el proxy
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.processNextProduct();
  }
}
