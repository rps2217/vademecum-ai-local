/**
 * useOffline - Hook para detectar y manejar estado offline
 */

import { useState, useEffect, useCallback } from 'react';

interface UseOfflineReturn {
  isOnline: boolean;
  wasOffline: boolean; // Si estuvo offline alguna vez en esta sesión
  goOnline: () => void; // Callback para forzar sync cuando vuelve online
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [onlineCallback, setOnlineCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Llamar al callback de sync si existe
      if (onlineCallback) {
        onlineCallback();
        setOnlineCallback(null);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onlineCallback]);

  const goOnline = useCallback(() => {
    setOnlineCallback(() => async () => {
      // Disparar evento para que otros componentes sincronicen
      window.dispatchEvent(new CustomEvent('vademecum:online'));
    });
  }, []);

  return { isOnline, wasOffline, goOnline };
}

export default useOffline;
