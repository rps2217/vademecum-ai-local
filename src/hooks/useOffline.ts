/**
 * useOffline - Hook para detectar y manejar estado offline
 * 
 * Mejoras:
 * - Detecta estado de conexión
 * - Registra última sincronización
 * - Notifica cuando vuelve la conexión
 * - Proporciona función de sincronización manual
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '../services/LoggerService';

export interface OfflineState {
  isOnline: boolean;
  wasOffline: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingChanges: number;
  goOnline: () => void;
  syncNow: () => Promise<void>;
}

const LAST_SYNC_KEY = 'vademecum_last_sync';
const PENDING_CHANGES_KEY = 'vademecum_pending_changes';

export function useOffline(): OfflineState {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(() => {
    return localStorage.getItem(LAST_SYNC_KEY);
  });
  const [pendingChanges, setPendingChanges] = useState<number>(() => {
    const stored = localStorage.getItem(PENDING_CHANGES_KEY);
    return stored ? parseInt(stored, 10) : 0;
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      logger.info('Conexión restaurada - modo online', 'Offline');
      
      // Auto-sincronizar si hay cambios pendientes
      if (pendingChanges > 0) {
        window.dispatchEvent(new CustomEvent('vademecum:online'));
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('Sin conexión - modo offline activo', 'Offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingChanges]);

  const goOnline = useCallback(() => {
    // Disparar evento para que otros componentes sincronicen
    window.dispatchEvent(new CustomEvent('vademecum:online'));
  }, []);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine || isSyncing) {
      logger.debug('No se puede sincronizar', 'Offline');
      return;
    }

    setIsSyncing(true);
    logger.info('Iniciando sincronización...', 'Offline');

    try {
      // Disparar evento de sync para que los servicios lo manejen
      window.dispatchEvent(new CustomEvent('vademecum:sync'));
      
      const now = new Date().toISOString();
      setLastSyncAt(now);
      localStorage.setItem(LAST_SYNC_KEY, now);
      
      // Limpiar cambios pendientes
      setPendingChanges(0);
      localStorage.setItem(PENDING_CHANGES_KEY, '0');

      logger.info('Sincronización completada', 'Offline');

    } catch (error) {
      logger.error('Error en sincronización', 'Offline', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // Agregar cambio pendiente
  const addPendingChange = useCallback(() => {
    const newCount = pendingChanges + 1;
    setPendingChanges(newCount);
    localStorage.setItem(PENDING_CHANGES_KEY, newCount.toString());
  }, [pendingChanges]);

  // Exponer función globalmente para que otros servicios la usen
  useEffect(() => {
    (window as any).__addPendingChange = addPendingChange;
    return () => {
      delete (window as any).__addPendingChange;
    };
  }, [addPendingChange]);

  return {
    isOnline,
    wasOffline,
    isSyncing,
    lastSyncAt,
    pendingChanges,
    goOnline,
    syncNow,
  };
}

// Componente para mostrar estado de conexión (para usar en UI)
export function ConnectionIndicator() {
  const { isOnline, isSyncing, lastSyncAt, pendingChanges, syncNow } = useOffline();

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-amber-100 border border-amber-300 rounded-lg px-4 py-2 shadow-lg flex items-center gap-2">
        <span className="text-lg">📴</span>
        <div>
          <p className="text-amber-800 text-sm font-medium">Modo Offline</p>
          <p className="text-amber-600 text-xs">{pendingChanges} cambios pendientes</p>
        </div>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-blue-100 border border-blue-300 rounded-lg px-4 py-2 shadow-lg flex items-center gap-2">
        <span className="text-lg animate-spin">🔄</span>
        <p className="text-blue-800 text-sm font-medium">Sincronizando...</p>
      </div>
    );
  }

  if (pendingChanges > 0) {
    return (
      <button
        onClick={syncNow}
        className="fixed bottom-4 right-4 z-50 bg-orange-100 border border-orange-300 rounded-lg px-4 py-2 shadow-lg flex items-center gap-2 hover:bg-orange-200 transition-colors"
      >
        <span className="text-lg">☁️</span>
        <div className="text-left">
          <p className="text-orange-800 text-sm font-medium">{pendingChanges} cambios pendientes</p>
          <p className="text-orange-600 text-xs">Click para sincronizar</p>
        </div>
      </button>
    );
  }

  return null; // No mostrar nada si está todo bien y sincronizado
}

export default useOffline;
