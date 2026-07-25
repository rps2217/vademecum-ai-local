import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import axios from 'axios';
import * as cheerio from 'cheerio';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'api-server',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/test')) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Vite API is active' }));
              return;
            }
            
            if (req.url?.startsWith('/api/scrape')) {
              const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
              const targetUrl = urlParams.get('url');
              
              if (!targetUrl) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'URL required' }));
                return;
              }

              try {
                const response = await axios.get(targetUrl, {
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
                      links.push({ text, href: new URL(href, targetUrl).href });
                    } catch(e) {}
                  }
                });

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  success: true, 
                  text: $('body').text().substring(0, 5000), 
                  links 
                }));
              } catch (error: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: error.message }));
              }
              return;
            }
            next();
          });
        }
      },
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'icon.svg', 'catalog.json'],
        manifest: {
          name: 'Vademécum Inteligente',
          short_name: 'Vademécum',
          description: 'Consulta de medicamentos con IA Local',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'icon.svg',
              sizes: '192x192',
              type: 'image/svg+xml'
            },
            {
              src: 'icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          maximumFileSizeToCacheInBytes: 10000000,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /.*\.bin$|.*\.onnx$|.*\.wasm$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'ai-models-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/huggingface\.co\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'huggingface-assets',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY),
      'process.env.MY_GEMINI_API_KEY': JSON.stringify(env.MY_GEMINI_API_KEY || process.env.MY_GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // React core
            'vendor-react': ['react', 'react-dom'],
            // UI libraries
            'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
            // AI/ML libraries (lazy loaded)
            'vendor-ai': ['@google/genai', '@mlc-ai/web-llm', '@xenova/transformers'],
            // Database/Storage
            'vendor-db': ['@nozbe/watermelondb', 'rxdb', 'rxjs'],
            // Visualization
            'vendor-viz': ['d3'],
            // PDF processing (lazy loaded)
            'vendor-pdf': ['pdfjs-dist'],
            // Lucide icons
            'vendor-icons': ['lucide-react'],
          },
        },
      },
      chunkSizeWarningLimit: 500,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
