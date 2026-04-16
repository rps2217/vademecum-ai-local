import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { AuthProvider } from './context/AuthContext';
import { ComparisonProvider } from './context/ComparisonContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Registrar el Service Worker para la PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Hay una nueva versión del Vademécum disponible. ¿Deseas actualizar?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('La aplicación está lista para usarse sin conexión.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ComparisonProvider>
          <App />
        </ComparisonProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
