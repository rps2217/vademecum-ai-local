/**
 * useServiceWorkerUpdate - Detecta actualizaciones del Service Worker.
 *
 * Usa `registerSW` de vite-plugin-pwa con `onNeedRefresh` y
 * `onOfflineReady` callbacks. Expone:
 * - `needRefresh`: true cuando hay una nueva versión del SW esperando
 * - `offlineReady`: true cuando la app está cacheada y lista para uso offline
 * - `updateSW()`: aplica la actualización (recarga la página)
 */

import { useEffect, useState, useCallback } from 'react';

interface UseServiceWorkerUpdateReturn {
  needRefresh: boolean;
  offlineReady: boolean;
  updateSW: () => Promise<void>;
}

export function useServiceWorkerUpdate(): UseServiceWorkerUpdateReturn {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateFn, setUpdateFn] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let mounted = true;

    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        if (!mounted) return;
        const fn = registerSW({
          immediate: true,
          onNeedRefresh() {
            setNeedRefresh(true);
          },
          onOfflineReady() {
            setOfflineReady(true);
            // Auto-hide después de 4s
            setTimeout(() => mounted && setOfflineReady(false), 4000);
          },
          onRegisteredSW(_swUrl, registration) {
            // Check periódico de actualizaciones cada 30 min
            if (registration) {
              setInterval(async () => {
                if (navigator.onLine) {
                  await registration.update().catch(() => {});
                }
              }, 30 * 60 * 1000);
            }
          },
        });
        setUpdateFn(() => fn);
      })
      .catch(() => {
        // PWA plugin not available in dev
      });

    return () => {
      mounted = false;
    };
  }, []);

  const updateSW = useCallback(async () => {
    if (updateFn) {
      await updateFn();
    }
  }, [updateFn]);

  return { needRefresh, offlineReady, updateSW };
}
