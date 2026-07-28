/**
 * usePWA - Hook para gestionar la PWA y actualizaciones
 */

import { useState, useEffect } from 'react';

interface PWAState {
  needsRefresh: boolean;
  offlineReady: boolean;
  updateServiceWorker: (() => void) | null;
}

export function usePWA(): PWAState {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateServiceWorker, setUpdateServiceWorker] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    const waitForSw = async () => {
      try {
        // Try to import the registration from Vite PWA
        const { registerSW } = await import('virtual:pwa-register');
        
        if (typeof registerSW === 'function') {
          const updateSW = registerSW({
            onNeedRefresh() {
              setNeedsRefresh(true);
            },
            onOfflineReady() {
              setOfflineReady(true);
            },
            onRegistered(registration) {
              console.log('SW registered:', registration);
            },
            onRegisterError(error) {
              console.error('SW registration error:', error);
            },
          });
          
          setUpdateServiceWorker(() => updateSW);
        }
      } catch (e) {
        // PWA not available in dev mode without plugin
        console.log('PWA registration not available');
      }
    };

    waitForSw();
  }, []);

  return {
    needsRefresh,
    offlineReady,
    updateServiceWorker,
  };
}

/**
 * useOfflineStatus - Hook para estado de conexion
 */
export function useOfflineStatus(): boolean {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOffline;
}
