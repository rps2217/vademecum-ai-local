import express from 'express';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import * as cheerio from 'cheerio';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware para parsear JSON
  app.use(express.json());

  // API Route: Scraper Proxy
  app.get('/api/scrape', async (req, res) => {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL requerida' });
    }

    try {
      // 1. Fetch HTML con headers de navegador para evitar bloqueos simples
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        },
        timeout: 10000 // 10s timeout
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // 2. Limpieza de "basura" (scripts, estilos, comentarios)
      $('script').remove();
      $('style').remove();
      $('noscript').remove();
      $('iframe').remove();
      $('header').remove();
      $('footer').remove();
      $('nav').remove();
      $('[class*="menu"]').remove();
      $('[class*="sidebar"]').remove();
      $('[class*="ad"]').remove(); // Anuncios
      $('[id*="cookie"]').remove(); // Cookies

      // 3. Extracción de contenido relevante
      const title = $('title').text().trim();
      const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
      
      // Extraer enlaces antes de limpiar (para el modo Crawler)
      const links: { text: string; href: string }[] = [];
      $('a').each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (href && text && !href.startsWith('#') && !href.startsWith('javascript:')) {
            // Resolver rutas relativas
            try {
                const absoluteUrl = new URL(href, url as string).href;
                links.push({ text, href: absoluteUrl });
            } catch (e) {}
        }
      });

      // Intentar encontrar el contenido principal
      let mainContent = $('main').text() || $('article').text() || $('[role="main"]').text() || $('body').text();
      
      // Limpiar espacios en blanco excesivos
      mainContent = mainContent.replace(/\s+/g, ' ').trim();

      // Construir texto final para la IA
      const finalText = `
TÍTULO: ${title}
DESCRIPCIÓN: ${metaDescription}
CONTENIDO:
${mainContent.substring(0, 15000)} 
`; // Limitamos a 15k caracteres para no saturar

      res.json({ 
        success: true, 
        text: finalText,
        links: links, // Devolvemos los enlaces encontrados
        source: url 
      });

    } catch (error: any) {
      console.error('Scraping error:', error.message);
      res.status(500).json({ 
        success: false, 
        error: `Error accediendo a la URL: ${error.message}` 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving (if needed later)
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
