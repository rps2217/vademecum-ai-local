import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

// ============================================================================
// CONFIGURACIÓN DEL SCRAPER
// ============================================================================
const COLLECTIONS = [
  'https://www.farmaciasknop.com/collections/suplementos',
  'https://www.farmaciasknop.com/collections/medicamentos-naturales',
  'https://www.farmaciasknop.com/collections/homeopatia',
  'https://www.farmaciasknop.com/collections/fitoterapia',
  'https://www.farmaciasknop.com/collections/alimentos-saludables'
];
const OUTPUT_FILE = path.join(process.cwd(), 'knop_raw_data.json');
const MAX_PAGES_PER_COLLECTION = 20; // Aumentado para cubrir más catálogo

// ============================================================================
// INTERFACES
// ============================================================================
interface RawProduct {
  url: string;
  exactName: string;
  exactSku: string;
  exactBrand: string;
  cleanText: string;
  scrapedAt: string;
}

// ============================================================================
// MOTOR DE SCRAPING (PLAYWRIGHT)
// ============================================================================
async function runScraper() {
  console.log(`🚀 Iniciando Scraper Masivo Multicanal...`);
  console.log(`📂 Archivo de salida: ${OUTPUT_FILE}`);
  console.log(`--------------------------------------------------`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  const allProductLinks: Set<string> = new Set();
  const scrapedData: RawProduct[] = [];

  // 0. Cargar datos previos para no repetir trabajo (RESUME)
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
      if (Array.isArray(existingData)) {
        existingData.forEach(item => scrapedData.push(item));
        console.log(`🔄 Retomando proceso: ${scrapedData.length} productos ya en disco.`);
      }
    } catch (e) {
      console.warn('⚠️ No se pudo cargar el archivo previo, empezando de cero.');
    }
  }

  try {
    // ========================================================================
    // FASE 1: RECOLECCIÓN DE ENLACES (MULTIPLE COLLECTIONS + PAGINACIÓN)
    // ========================================================================
    console.log(`\n[FASE 1] Recolectando enlaces de todas las colecciones...`);
    
    for (const collectionUrl of COLLECTIONS) {
      let currentPage = 1;
      let currentUrl = collectionUrl;
      console.log(`\n📂 Explorando Colección: ${collectionUrl}`);

      while (currentPage <= MAX_PAGES_PER_COLLECTION) {
        console.log(`   📄 Página ${currentPage}: ${currentUrl}`);
        try {
          await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
          
          // Extraer enlaces de productos
          const links = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a'));
            return anchors
              .map(a => a.getAttribute('href'))
              .filter(href => href && href.includes('/products/'))
              .map(href => href!.split('?')[0]) // Limpiar parámetros de tracking
              .map(href => href!.startsWith('http') ? href : `https://www.farmaciasknop.com${href}`);
          });

          const initialSize = allProductLinks.size;
          links.forEach(link => {
            // Solo añadir si no lo hemos scrapeado ya en sesiones previas
            if (!scrapedData.some(d => d.url === link)) {
              allProductLinks.add(link!);
            }
          });
          
          const newLinks = allProductLinks.size - initialSize;
          console.log(`      ✅ Encontrados ${links.length} enlaces (${newLinks} nuevos para procesar)`);

          // Buscar el botón de "Siguiente página"
          const nextButtonHref = await page.evaluate(() => {
            // Selectores comunes en Shopify
            const nextBtn = document.querySelector('.pagination__next, a[rel="next"], .next a, .pagination a:last-child');
            if (nextBtn && (nextBtn.textContent?.includes('Sig') || nextBtn.getAttribute('rel') === 'next')) {
              return nextBtn.getAttribute('href');
            }
            return null;
          });

          if (nextButtonHref && nextButtonHref !== currentUrl) {
            currentUrl = nextButtonHref.startsWith('http') ? nextButtonHref : `https://www.farmaciasknop.com${nextButtonHref}`;
            currentPage++;
            await new Promise(r => setTimeout(r, 1500));
          } else {
            console.log(`      🛑 Fin de la colección.`);
            break;
          }
        } catch (err: any) {
          console.error(`      ❌ Error en página ${currentPage}: ${err.message}`);
          break;
        }
      }
    }

    const linksArray = Array.from(allProductLinks);
    console.log(`\n📊 Total de nuevos productos a extraer: ${linksArray.length}`);

    // ========================================================================
    // FASE 2: EXTRACCIÓN QUIRÚRGICA
    // ========================================================================
    console.log(`\n[FASE 2] Extrayendo datos de cada producto...`);

    for (let i = 0; i < linksArray.length; i++) {
      const link = linksArray[i];
      console.log(`[${i + 1}/${linksArray.length}] ⏳ Extrayendo: ${link}`);
      
      try {
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        const productData = await page.evaluate(() => {
          let exactSku = '';
          let exactName = '';
          let exactBrand = '';
          
          // 1. LD-JSON
          document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
            try {
              const data = JSON.parse(script.textContent || '{}');
              const schemas = Array.isArray(data) ? data : [data];
              schemas.forEach(schema => {
                if (schema['@type'] === 'Product') {
                  if (schema.sku) exactSku = schema.sku;
                  if (schema.name) exactName = schema.name;
                  if (schema.brand && schema.brand.name) exactBrand = schema.brand.name;
                }
              });
            } catch (e) {}
          });

          if (!exactName) exactName = document.querySelector('h1')?.textContent?.trim() || '';
          if (!exactSku) exactSku = document.querySelector('.sku, [data-sku], .product-single__sku')?.textContent?.trim() || '';

          // Limpieza
          const elementsToRemove = ['script', 'style', 'nav', 'footer', 'header', 'noscript', 'iframe', 'svg'];
          elementsToRemove.forEach(s => document.querySelectorAll(s).forEach(el => el.remove()));

          const mainContent = document.querySelector('.product-single__description') || document.querySelector('.rte') || document.querySelector('main') || document.body;
          let cleanText = mainContent.textContent || '';
          cleanText = cleanText.replace(/\s+/g, ' ').trim();

          return { exactSku, exactName, exactBrand, cleanText };
        });

        scrapedData.push({
          url: link,
          exactName: productData.exactName,
          exactSku: productData.exactSku,
          exactBrand: productData.exactBrand,
          cleanText: productData.cleanText,
          scrapedAt: new Date().toISOString()
        });

        console.log(`   ✅ OK: ${productData.exactName}`);
        
        if ((i + 1) % 5 === 0) {
          fs.writeFileSync(OUTPUT_FILE, JSON.stringify(scrapedData, null, 2));
        }

        await new Promise(r => setTimeout(r, 800));

      } catch (err: any) {
        console.error(`   ❌ Error en ${link}: ${err.message}`);
      }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(scrapedData, null, 2));
    console.log(`\n🎉 PROCESO COMPLETADO.`);
    console.log(`📊 Total final: ${scrapedData.length} productos.`);

  } catch (error) {
    console.error(`\n❌ Error crítico:`, error);
  } finally {
    await browser.close();
  }
}

runScraper();
