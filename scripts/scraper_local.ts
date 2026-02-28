import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

// ============================================================================
// CONFIGURACIÓN DEL SCRAPER
// ============================================================================
const TARGET_URL = 'https://www.farmaciasknop.com/collections/suplementos';
const OUTPUT_FILE = path.join(process.cwd(), 'knop_raw_data.json');
const MAX_PAGES = 3; // Cuántas páginas de paginación quieres recorrer (pon 999 para todas)

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
  console.log(`🚀 Iniciando Scraper Masivo Profesional...`);
  console.log(`🎯 Objetivo: ${TARGET_URL}`);
  console.log(`--------------------------------------------------`);

  // 1. Iniciar navegador invisible (Headless)
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  const allProductLinks: Set<string> = new Set();
  let currentPage = 1;
  let currentUrl = TARGET_URL;

  try {
    // ========================================================================
    // FASE 1: RECOLECCIÓN DE ENLACES (PAGINACIÓN)
    // ========================================================================
    console.log(`\n[FASE 1] Recolectando enlaces de productos...`);
    
    while (currentPage <= MAX_PAGES) {
      console.log(`📄 Escaneando página ${currentPage}: ${currentUrl}`);
      await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Extraer todos los enlaces de productos en la página actual
      const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors
          .map(a => a.getAttribute('href'))
          .filter(href => href && href.includes('/products/'))
          .map(href => href!.startsWith('http') ? href : `https://www.farmaciasknop.com${href}`);
      });

      links.forEach(link => allProductLinks.add(link!));
      console.log(`   ✅ Encontrados ${links.length} productos (Total acumulado: ${allProductLinks.size})`);

      // Buscar el botón de "Siguiente página"
      // Nota: Los selectores de paginación varían por tienda. Este es genérico para Shopify/Knop.
      const nextButtonHref = await page.evaluate(() => {
        const nextBtn = document.querySelector('.pagination__next, a[rel="next"], .next a');
        return nextBtn ? nextBtn.getAttribute('href') : null;
      });

      if (nextButtonHref) {
        currentUrl = nextButtonHref.startsWith('http') ? nextButtonHref : `https://www.farmaciasknop.com${nextButtonHref}`;
        currentPage++;
        // Pequeña pausa para no saturar el servidor de Knop
        await new Promise(r => setTimeout(r, 2000));
      } else {
        console.log(`   🛑 No hay más páginas. Fin de la paginación.`);
        break;
      }
    }

    const linksArray = Array.from(allProductLinks);
    console.log(`\n📊 Total de productos a extraer: ${linksArray.length}`);

    // ========================================================================
    // FASE 2: EXTRACCIÓN QUIRÚRGICA (PRODUCTO POR PRODUCTO)
    // ========================================================================
    console.log(`\n[FASE 2] Extrayendo datos crudos de cada producto...`);
    const scrapedData: RawProduct[] = [];

    for (let i = 0; i < linksArray.length; i++) {
      const link = linksArray[i];
      console.log(`[${i + 1}/${linksArray.length}] ⏳ Extrayendo: ${link}`);
      
      try {
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Ejecutar script dentro del contexto de la página web
        const productData = await page.evaluate(() => {
          let exactSku = '';
          let exactName = '';
          let exactBrand = '';
          
          // 1. Buscar LD-JSON (Schema.org)
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
            } catch (e) { /* Ignorar */ }
          });

          // 2. Selectores de respaldo
          if (!exactName) {
            const h1 = document.querySelector('h1');
            if (h1) exactName = h1.textContent?.trim() || '';
          }
          if (!exactSku) {
            const skuEl = document.querySelector('.sku, [data-sku], [itemprop="sku"], .product-single__sku');
            if (skuEl) exactSku = skuEl.textContent?.trim() || '';
          }

          // 3. Limpieza de basura visual
          const elementsToRemove = [
            'script', 'style', 'nav', 'footer', 'header', 'noscript', 'iframe', 'svg', 
            '.menu', '.sidebar', '#shopify-section-header', '#shopify-section-footer',
            '[role="navigation"]', '.cart', '.checkout', '.related-products', '.product-recommendations'
          ];
          elementsToRemove.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => el.remove());
          });

          // 4. Extraer texto limpio del contenedor principal
          const mainContent = document.querySelector('.product-single__description') || document.querySelector('.rte') || document.querySelector('main') || document.body;
          let cleanText = mainContent.textContent || mainContent.innerText || '';
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

        console.log(`   ✅ Extraído: ${productData.exactName || 'Sin Nombre'} (SKU: ${productData.exactSku || 'N/A'})`);
        
        // Guardar progreso cada 10 productos por si se corta la conexión
        if ((i + 1) % 10 === 0) {
          fs.writeFileSync(OUTPUT_FILE, JSON.stringify(scrapedData, null, 2));
          console.log(`   💾 Progreso guardado en disco (${i + 1} productos).`);
        }

        // Pausa de 1 segundo para no ser bloqueados por el servidor de Knop
        await new Promise(r => setTimeout(r, 1000));

      } catch (err: any) {
        console.error(`   ❌ Error extrayendo ${link}: ${err.message}`);
      }
    }

    // Guardado final
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(scrapedData, null, 2));
    console.log(`\n🎉 SCRAPING FINALIZADO CON ÉXITO.`);
    console.log(`📁 Archivo guardado en: ${OUTPUT_FILE}`);
    console.log(`📊 Total extraído: ${scrapedData.length} productos.`);

  } catch (error) {
    console.error(`\n❌ Error crítico en el scraper:`, error);
  } finally {
    await browser.close();
  }
}

runScraper();
