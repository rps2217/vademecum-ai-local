/**
 * Fase 1+2: Crawler + Extractor de Farmacias Knop.
 *
 * FASE 1: Navega las colecciones, maneja paginación, recolecta URLs de productos.
 * FASE 2: Visita cada URL, extrae datos quirúrgicos (nombre, SKU, marca,
 *         ingredientes, modo de uso, advertencias, etc.) vía LD-JSON + patrones.
 *
 * Salida: knop_raw_data.json (array de RawProduct).
 * Resume: si el archivo ya existe, continúa desde donde se quedó.
 *
 * Uso:  npx ts-node --transpile-only scripts/scraper/scraper_local.ts
 */
import fs from 'fs';
import { chromium, type Browser, type Page } from 'playwright';
import {
  COLLECTIONS,
  BASE_DOMAIN,
  MAX_PAGES_PER_COLLECTION,
  EXTRACT_DELAY_MS,
  FILES,
} from './config';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface RawProduct {
  url: string;
  exactName: string;
  exactSku: string;
  exactBrand: string;
  presentation: string;
  benefits: string;
  usage: string;
  storage: string;
  warnings: string;
  precautions: string;
  ingredients: string;
  cleanText: string;
  scrapedAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const log = (msg: string) => console.log(msg);

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Carga datos previos para no repetir trabajo (resume). */
function loadExisting(): RawProduct[] {
  try {
    if (fs.existsSync(FILES.RAW_DATA)) {
      const data = JSON.parse(fs.readFileSync(FILES.RAW_DATA, 'utf-8'));
      if (Array.isArray(data)) {
        log(`🔄 Retomando: ${data.length} productos ya en disco.`);
        return data;
      }
    }
  } catch {
    log('⚠️ No se pudo cargar archivo previo, empezando de cero.');
  }
  return [];
}

// ─── FASE 1: Crawler — recolectar URLs de productos ────────────────────────

async function crawlCollection(page: Page, collectionUrl: string, scrapedUrls: Set<string>): Promise<string[]> {
  const found: string[] = [];
  let currentUrl = collectionUrl;
  let pageNum = 1;

  log(`\n📂 Explorando colección: ${collectionUrl}`);

  while (pageNum <= MAX_PAGES_PER_COLLECTION) {
    log(`   📄 Página ${pageNum}: ${currentUrl}`);
    try {
      await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

      const links = await page.evaluate((domain: string) => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors
          .map((a) => a.getAttribute('href'))
          .filter((href): href is string => !!href && href.includes('/products/'))
          .map((href) => href.split('?')[0])
          .map((href) => (href.startsWith('http') ? href : `${domain}${href}`));
      }, BASE_DOMAIN);

      const initialSize = scrapedUrls.size;
      for (const link of links) {
        if (!scrapedUrls.has(link)) {
          scrapedUrls.add(link);
          found.push(link);
        }
      }
      const newLinks = scrapedUrls.size - initialSize;
      log(`      ✅ ${links.length} enlaces (${newLinks} nuevos)`);

      // Buscar botón "Siguiente página"
      const nextHref = await page.evaluate(() => {
        const nextBtn = document.querySelector(
          '.pagination__next, a[rel="next"], .next a, .pagination a:last-child',
        );
        if (
          nextBtn &&
          (nextBtn.textContent?.includes('Sig') ||
            nextBtn.getAttribute('rel') === 'next')
        ) {
          return nextBtn.getAttribute('href');
        }
        return null;
      });

      if (nextHref && nextHref !== currentUrl) {
        currentUrl = nextHref.startsWith('http')
          ? nextHref
          : `${BASE_DOMAIN}${nextHref}`;
        pageNum++;
        await sleep(1500);
      } else {
        log('      🛑 Fin de la colección.');
        break;
      }
    } catch (err: any) {
      log(`      ❌ Error en página ${pageNum}: ${err.message}`);
      break;
    }
  }
  return found;
}

// ─── FASE 2: Extractor — extraer datos de cada producto ─────────────────────

async function extractProduct(page: Page, url: string): Promise<RawProduct | null> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const productData = await page.evaluate(() => {
      let exactSku = '';
      let exactName = '';
      let exactBrand = '';

      // 1. LD-JSON (schema.org Product) — fiable para datos base
      document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
        try {
          const data = JSON.parse(script.textContent || '{}');
          const schemas = Array.isArray(data) ? data : [data];
          schemas.forEach((schema) => {
            if (schema['@type'] === 'Product') {
              if (schema.sku) exactSku = schema.sku;
              if (schema.name) exactName = schema.name;
              if (schema.brand && schema.brand.name) exactBrand = schema.brand.name;
            }
          });
        } catch {
          /* ignore malformed JSON */
        }
      });

      if (!exactName) exactName = document.querySelector('h1')?.textContent?.trim() || '';
      if (!exactSku)
        exactSku =
          document.querySelector('.sku, [data-sku], .product-single__sku')?.textContent?.trim() || '';

      // 2. Extracción quirúrgica por patrones de texto
      const descriptionArea =
        document.querySelector('.product-single__description, .rte, main') || document.body;
      const areaText = (descriptionArea as HTMLElement).innerText;

      const getField = (label: string) => {
        const regex = new RegExp(`${label}:?\\s*([^\\n]+)`, 'i');
        const match = areaText.match(regex);
        return match ? match[1].trim() : '';
      };

      const surgicalFields = {
        presentation: getField('Presentación'),
        benefits: getField('Beneficios del Producto'),
        usage: getField('Modo de uso'),
        storage: getField('Almacenamiento'),
        warnings: getField('Advertencias'),
        precautions: getField('Precauciones'),
        ingredients: getField('Ingredientes'),
      };

      // 3. Texto limpio de respaldo (sin nav, footer, scripts)
      const elementsToRemove = ['script', 'style', 'nav', 'footer', 'header', 'noscript', 'iframe', 'svg'];
      const clonedBody = document.body.cloneNode(true) as HTMLElement;
      elementsToRemove.forEach((s) => clonedBody.querySelectorAll(s).forEach((el) => el.remove()));
      const cleanText = clonedBody.innerText.replace(/\s+/g, ' ').trim();

      return { exactSku, exactName, exactBrand, ...surgicalFields, cleanText };
    });

    return {
      url,
      exactName: productData.exactName,
      exactSku: productData.exactSku,
      exactBrand: productData.exactBrand,
      presentation: productData.presentation,
      benefits: productData.benefits,
      usage: productData.usage,
      storage: productData.storage,
      warnings: productData.warnings,
      precautions: productData.precautions,
      ingredients: productData.ingredients,
      cleanText: productData.cleanText,
      scrapedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    log(`   ❌ Error extrayendo ${url}: ${err.message}`);
    return null;
  }
}

// ─── Orquestador principal ───────────────────────────────────────────────────

export async function runScraper() {
  log('🚀 Iniciando Scraper Masivo Multicanal (Farmacias Knop)...');
  log(`📂 Archivo de salida: ${FILES.RAW_DATA}`);
  log('─'.repeat(50));

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page: Page = await context.newPage();

  const scrapedData: RawProduct[] = loadExisting();
  const scrapedUrls = new Set(scrapedData.map((d) => d.url));
  const allProductLinks = new Set<string>();

  try {
    // ── FASE 1: Crawler ──
    log('\n[FASE 1] Recolectando enlaces de todas las colecciones...');
    for (const collectionUrl of COLLECTIONS) {
      await crawlCollection(page, collectionUrl, scrapedUrls);
    }

    // Filtrar solo los que no hemos scrapeado aún
    const newLinks = Array.from(scrapedUrls).filter(
      (u) => !scrapedData.some((d) => d.url === u),
    );
    log(`\n📊 Total de productos nuevos a extraer: ${newLinks.length}`);

    if (newLinks.length === 0) {
      log('✅ No hay productos nuevos. Ejecuta el procesador IA.');
      return;
    }

    // ── FASE 2: Extractor ──
    log('\n[FASE 2] Extrayendo datos de cada producto (Modo Quirúrgico)...');
    for (let i = 0; i < newLinks.length; i++) {
      const link = newLinks[i];
      log(`[${i + 1}/${newLinks.length}] ⏳ Extrayendo: ${link}`);

      const data = await extractProduct(page, link);
      if (data) {
        scrapedData.push(data);
        log(`   ✅ OK: ${data.exactName || '(sin nombre)'}`);
        if (data.ingredients)
          log(`      🧪 Ingredientes: ${data.ingredients.substring(0, 50)}...`);
      }

      // Guardar cada 5 productos (persistencia incremental)
      if ((i + 1) % 5 === 0) {
        fs.writeFileSync(FILES.RAW_DATA, JSON.stringify(scrapedData, null, 2));
      }
      await sleep(EXTRACT_DELAY_MS);
    }

    fs.writeFileSync(FILES.RAW_DATA, JSON.stringify(scrapedData, null, 2));
    log(`\n🎉 EXTRACCIÓN COMPLETADA.`);
    log(`📊 Total final: ${scrapedData.length} productos.`);
  } catch (error: any) {
    log(`\n❌ Error crítico: ${error.message}`);
    // Guardar lo que tengamos hasta ahora
    fs.writeFileSync(FILES.RAW_DATA, JSON.stringify(scrapedData, null, 2));
  } finally {
    await browser.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runScraper().catch((err) => {
    console.error('Error fatal:', err);
    process.exit(1);
  });
}
