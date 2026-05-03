import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { AuthProvider } from './context/AuthContext';
import { ComparisonProvider } from './context/ComparisonContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Register Service Worker for PWA offline support.
// API routes are excluded via navigateFallbackDenylist in vite.config.ts (Workbox).
const updateSW = registerSW({
  onNeedRefresh() {
    // A newer version of the app is available — auto-update silently.
    updateSW(true);
  },
  onOfflineReady() {
  },
  onRegisterError(error) {
    console.error('[PWA] Error al registrar Service Worker:', error);
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
