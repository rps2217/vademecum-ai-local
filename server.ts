import express from 'express';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

async function startServer() {
  const app = express();
  const PORT = 3000;

  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });

  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[Server] ${req.method} ${req.url}`);
    next();
  });

  const apiRouter = express.Router();

  apiRouter.get('/test', (req, res) => {
    console.log('[API] Hit /test');
    res.json({ success: true, message: 'Backend is active' });
  });

  apiRouter.get('/scrape', async (req, res) => {
    const { url } = req.query;
    console.log(`[API] Hit /scrape with url: ${url}`);
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'URL required' });

    try {
      const response = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
        },
        timeout: 15000
      });
      
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
      console.error(`[API] Error scraping ${url}:`, error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.use('/api', apiRouter);

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch(console.error);
