import express from 'express';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import * as cheerio from 'cheerio';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'Backend is active' });
  });

  app.get('/api/scrape', async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'URL required' });

    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 10000
      });
      const $ = cheerio.load(response.data);
      
      const links: any[] = [];
      $('a').each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (href && text && !href.startsWith('#')) {
          try {
            links.push({ text, href: new URL(href, url).href });
          } catch(e) {}
        }
      });

      res.json({ success: true, text: $('body').text().substring(0, 5000), links });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

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
