import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Providers } from './app/providers';
import { installGlobalErrorHandlers } from './lib/errorLog';
import './styles/globals.css';

// Capturador global de errores → IndexedDB (exportable para soporte)
installGlobalErrorHandlers();

// El Service Worker se registra vía useServiceWorkerUpdate hook en AppShell

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>
);

