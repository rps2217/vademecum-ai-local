import express from 'express';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import fs from 'fs';
import Database from 'better-sqlite3';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Initialize SQLite
const db = new Database('vademecum.sqlite');
db.prepare(`
  CREATE TABLE IF NOT EXISTS products (
    sku TEXT PRIMARY KEY,
    nombre_comercial TEXT,
    data TEXT
  )
`).run();

// Initialize Supabase Admin de forma segura (Server-side bypass RLS)
let supabase: any = null;
try {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('Supabase Admin initialized successfully.');
  } else {
    console.warn('Supabase credentials missing, cloud sync disabled in backend.');
  }
} catch (e) {
  console.error('Failed to initialize Supabase Admin:', e);
}

const LOG_FILE = 'server_debug.log';
function log(msg: string) {
  const entry = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, entry);
  console.log(msg);
}

async function startServer() {
  fs.writeFileSync(LOG_FILE, '--- Server Starting ---\n');
  const app = express();
  const PORT = 3000;

  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });

  app.use(express.json());

  // Logging middleware (mejorado)
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const url = req.originalUrl || req.url;
      const statusCode = res.statusCode;

      // Log all errors >= 400
      if (statusCode >= 400) {
        log(`[ERROR] ${req.method} ${url} - ${statusCode} (${duration}ms)`);
      } 
      // Log successful API/Health requests but not assets (too noisy)
      else if (!url.startsWith('/@vite') && !url.startsWith('/src') && !url.startsWith('/node_modules')) {
        log(`${req.method} ${url} - ${statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  // 0. Health checks
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 1. API Router (Definido ANTES de Vite)
  const apiRouter = express.Router();

  // Debug middleware para el router
  apiRouter.use((req, res, next) => {
    log(`[API-DEBUG] Incoming to Router: ${req.method} ${req.url}`);
    next();
  });

  apiRouter.get('/health', (req, res) => {
    res.json({ status: 'ok', source: 'apiRouter', db_ready: !!db });
  });

  apiRouter.get('/products', (req, res) => {
    // Force fresh data to debug
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      if (!db) throw new Error('Database not initialized');
      const products = db.prepare('SELECT data FROM products').all();
      const validProducts = products
        .map(p => {
          try {
            return p.data ? JSON.parse(p.data as string) : null;
          } catch (e) { return null; }
        })
        .filter(p => p !== null && p.sku);
        
      log(`[API] Fetching products results: ${validProducts.length} items`);
      res.json(validProducts);
    } catch (e: any) {
      log(`[API Error] /products GET: ${e.message}`);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  apiRouter.post('/products', async (req, res) => {
    const product = req.body;
    log(`[API] Attempting to save product: ${product.sku} (${product.nombre_comercial})`);
    
    // Save to SQLite
    db.prepare('INSERT OR REPLACE INTO products (sku, nombre_comercial, data) VALUES (?, ?, ?)')
      .run(product.sku, product.nombre_comercial, JSON.stringify(product));
    
    // Sync to Supabase
    if (supabase) {
        log(`[SupabaseSync] Initializing cloud sync for ${product.sku}...`);
        try {
            const { error } = await supabase
                .from('products')
                .upsert({ 
                    sku: product.sku, 
                    nombre_comercial: product.nombre_comercial,
                    data: product,
                    last_updated: new Date().toISOString()
                }, { onConflict: 'sku' });
            
            if (error) {
                log(`[SupabaseSync-ERROR] ${product.sku}: ${error.message}`);
            } else {
                log(`[SupabaseSync-SUCCESS] ${product.sku} backed up to cloud.`);
            }
        } catch (err) {
            log(`[SupabaseSync-FATAL] ${product.sku}: ${err}`);
        }
    } else {
        log(`[SupabaseSync-SKIP] ${product.sku}: Supabase not configured in backend.`);
    }
    
    res.json({ success: true, supabase_synced: !!supabase });
  });

  apiRouter.delete('/products/:sku', async (req, res) => {
    const sku = req.params.sku;
    db.prepare('DELETE FROM products WHERE sku = ?').run(sku);
    
    // Sync to Supabase
    try {
      if (supabase) {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('sku', sku);
        if (error) log(`[API] Supabase delete sync error: ${error.message}`);
      }
    } catch (err) {
      log(`[API] Supabase delete unexpected error: ${err}`);
    }

    res.json({ success: true });
  });


  apiRouter.get('/test', (req, res) => {
    log('[API] Hit /test');
    res.json({ success: true, message: 'Backend is active' });
  });

  // GAS Proxy Bridge (Server-side to avoid CORS/NetworkError)
  apiRouter.get('/gas-bridge', async (req, res) => {
    const { gasUrl, targetUrl } = req.query;
    log(`[API] Hit /gas-bridge. gasUrl: ${gasUrl}, targetUrl: ${targetUrl}`);
    
    if (!gasUrl || !targetUrl) {
      log('[API] Missing parameters in gas-bridge');
      return res.status(400).json({ error: 'Missing parameters' });
    }
    
    try {
      log(`[GAS Bridge] Fetching via Google: ${targetUrl}`);
      const response = await axios.get(`${gasUrl}?url=${encodeURIComponent(targetUrl as string)}`, {
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      log(`[GAS Bridge] Success! Data length: ${JSON.stringify(response.data).length}`);
      res.send(response.data);
    } catch (error: any) {
      log(`[GAS Bridge] Error: ${error.message}`);
      res.status(500).json({ 
        error: `Error en el puente de Google: ${error.message}`,
        details: error.response?.data || 'No details'
      });
    }
  });

  apiRouter.get('/scrape', async (req, res) => {
    const { url } = req.query;
    log(`[API] Hit /scrape with url: ${url}`);
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'URL required' });

    try {
      // Detección de Shopify
      if (url.includes('/collections/') && !url.endsWith('.json')) {
        const jsonUrl = url.split('?')[0] + '/products.json';
        log(`[API] Detectada posible colección Shopify, probando: ${jsonUrl}`);
        try {
          const shopifyRes = await axios.get(jsonUrl, { 
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 5000 
          });
          if (shopifyRes.data && shopifyRes.data.products) {
            const shopifyLinks = shopifyRes.data.products.map((p: any) => ({
              text: p.title,
              href: new URL(`/products/${p.handle}`, url).href
            }));
            log(`[API] Shopify JSON success: ${shopifyLinks.length} links`);
            return res.json({ 
              success: true, 
              markdown: `## Colección Shopify: ${url}\nSe han detectado ${shopifyLinks.length} productos vía API JSON.`, 
              links: shopifyLinks,
              isShopify: true
            });
          }
        } catch (e: any) {
          log(`[API] Falló intento JSON Shopify (${e.message}), procediendo con HTML normal`);
        }
      }

      log(`[API] Fetching HTML from: ${url}`);
      const response = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 10000 
      });
      
      log(`[API] HTML fetched, size: ${response.data.length}`);
      const $ = cheerio.load(response.data);
      
      // 1. Detectar si es un sitio VTEX
      let vtexData: any = null;
      let structuredProduct: any = null;
      
      $('script').each((_, el) => {
        const content = $(el).html();
        if (content && content.includes('__STATE__')) {
          try {
            const jsonStr = content.split('__STATE__ = ')[1].split(';')[0];
            vtexData = JSON.parse(jsonStr);
            
            const productKey = Object.keys(vtexData).find(k => k.startsWith('Product:'));
            if (productKey) {
              const p = vtexData[productKey];
              structuredProduct = {
                name: p.productName,
                brand: p.brand,
                description: p.description,
                sku: p.productReference,
                linkText: p.linkText,
                categories: p.categories,
                items: p.items?.map((i: any) => vtexData[i.id])
              };
            }
          } catch (e) {}
        }
      });

      // 2. Extraer enlaces de productos
      const links: any[] = [];
      const seenHrefs = new Set<string>();

      if (vtexData) {
        Object.keys(vtexData).forEach(key => {
          if (key.startsWith('Product:')) {
            const p = vtexData[key];
            if (p.linkText && p.productName) {
              const href = `/${p.linkText}/p`;
              const fullUrl = new URL(href, url).href;
              if (!seenHrefs.has(fullUrl)) {
                links.push({ text: p.productName, href: fullUrl });
                seenHrefs.add(fullUrl);
              }
            }
          }
        });
      }

      const productSelectors = [
        'a[href*="/p"]',
        'a.vtex-product-summary-2-x-clearLink',
        'a.product-item-link',
        '.product-item a',
        '.product-card a',
        'a.product-link'
      ];

      $(productSelectors.join(', ')).each((_, el) => {
        const href = $(el).attr('href');
        let text = $(el).text().trim();
        
        if (!text) {
          text = $(el).find('[class*="productBrand"], [class*="name"], h3').text().trim();
        }

        if (href && text && !href.startsWith('#')) {
          try {
            const fullUrl = new URL(href, url).href;
            if (!seenHrefs.has(fullUrl)) {
              links.push({ text, href: fullUrl });
              seenHrefs.add(fullUrl);
            }
          } catch(e) {}
        }
      });

      // 3. Limpiar y convertir a Markdown para la IA
      $('script, style, nav, footer, header, iframe, noscript, .vtex-menu-2-x-menuContainer').remove();
      
      const mainContent = $('main, #main-content, .product-details, .vtex-store-components-3-x-productBrandContainer, .vtex-flex-layout-0-x-flexRowContent--product-main').html();
      const htmlToConvert = mainContent || $('body').html() || '';
      
      let markdown = turndownService.turndown(htmlToConvert);
      
      // Si tenemos datos estructurados, los añadimos al principio
      if (structuredProduct) {
        markdown = `## DATOS ESTRUCTURADOS DEL PRODUCTO\n` +
                   `- **Nombre:** ${structuredProduct.name}\n` +
                   `- **Marca:** ${structuredProduct.brand}\n` +
                   `- **SKU:** ${structuredProduct.sku}\n` +
                   `- **Descripción:** ${structuredProduct.description}\n` +
                   `- **Categorías:** ${structuredProduct.categories?.join(', ')}\n\n` +
                   `## CONTENIDO DE LA PÁGINA\n` + markdown;
      }
      
      res.json({ 
        success: true, 
        markdown: markdown.substring(0, 15000), 
        links,
        isVtex: !!vtexData,
        productData: structuredProduct
      });
    } catch (error: any) {
      log(`[API] Error scraping ${url}: ${error.message}`);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // MOUNT ROUTER HERE - AFTER ALL DEFINITIONS
  app.use('/api', apiRouter);

  // 3. CATCH-ALL API
  app.use('/api/*', (req, res) => {
    log(`[ERROR-404] No match in API: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
      error: 'API Route Not Found', 
      path: req.originalUrl,
      suggestion: 'Verifique los endpoints disponibles en server.ts'
    });
  });

  // 4. Inicializar Vite o Servir Estáticos (Producción)
  if (process.env.NODE_ENV !== 'production') {
    log('Initializing Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    log('Vite middleware loaded successfully');
  } else {
    log('Production mode detected, serving static files from dist/');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        // Asegurarse de que no estamos interceptando una ruta de API mal formada
        if (req.url.startsWith('/api')) {
            return res.status(404).json({ error: 'Endpoint not found' });
        }
        res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 4. Unmatched request logging
  app.use((req, res, next) => {
    if (!req.url.startsWith('/@vite') && !req.url.startsWith('/src')) {
      log(`Unmatched request: ${req.method} ${req.url}`);
    }
    next();
  });

  // 5. Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    log(`[Global Error Handler] ${err.message}`);
    if (res.headersSent) return next(err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  // 6. Start listening
  app.listen(PORT, '0.0.0.0', () => {
    log(`Server listening on port ${PORT}`);
  });
}

process.on('unhandledRejection', (reason, promise) => {
  log(`[Unhandled Rejection] reason: ${reason}`);
});

process.on('uncaughtException', (err) => {
  log(`[Uncaught Exception] thrown: ${err.message}`);
});

startServer().catch(console.error);
