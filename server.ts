import express from 'express';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Backend API Proxy for Google Sheets / Google Apps Script
  // Bypasses browser CSP restrictions by fetching server-side
  app.get('/api/google-sheets/proxy', async (req, res) => {
    const targetUrl = req.query.url as string;
    const action = req.query.action as string || 'getCatalog';

    if (!targetUrl) {
      return res.status(400).json({ success: false, message: 'URL de Google Sheets no proporcionada.' });
    }

    try {
      const parsedUrl = new URL(targetUrl);
      if (action) {
        parsedUrl.searchParams.set('action', action);
      }

      const response = await fetch(parsedUrl.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          message: `Error al conectar con Google Sheets (${response.status}: ${response.statusText})`,
        });
      }

      const data = await response.json();
      return res.json(data);
    } catch (err) {
      console.error('Error in Google Sheets proxy:', err);
      return res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : 'Error desconocido al conectar con Google Sheets.',
      });
    }
  });

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.warn(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
