import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Providers } from './app/providers';
import { installGlobalErrorHandlers } from './lib/errorLog';
import './styles/globals.css';

// Capturador global de errores → IndexedDB (exportable para soporte)
installGlobalErrorHandlers();

// Register Service Worker
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  }).catch(() => {
    // PWA plugin not available in dev
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>
);

