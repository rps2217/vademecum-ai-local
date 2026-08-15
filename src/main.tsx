// Polyfill de Buffer para el navegador: bip39 (frase de recuperación BIP-39)
// usa Node's Buffer, que no existe en el navegador. Debe ir antes de cualquier
// import que transite hacia bip39 (E2EEAuthProvider → crypto → e2ee.ts).
import { Buffer } from 'buffer';
(globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;

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

