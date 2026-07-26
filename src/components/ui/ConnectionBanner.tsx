/**
 * ConnectionBanner - Banner que muestra estado de conexión
 * Inspirado en appsimple: minimalista, no intrusivo
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { syncService } from '../../core/sync/sync-service';

export function ConnectionBanner() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showBanner, setShowBanner] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setJustReconnected(true);
      
      // Sincronizar cuando vuelve la conexión
      setIsSyncing(true);
      try {
        await syncService.syncAll();
      } finally {
        setIsSyncing(false);
        setTimeout(() => {
          setJustReconnected(false);
          setShowBanner(false);
        }, 2000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Estado inicial
    if (!navigator.onLine) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner && isOnline && !justReconnected) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300",
        justReconnected
          ? "animate-in slide-in-from-bottom-4 fade-in"
          : "animate-in slide-in-from-bottom-4 fade-in"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-lg border backdrop-blur-xl",
          !isOnline
            ? "bg-gray-900/95 border-gray-700 text-white"
            : justReconnected
            ? "bg-emerald-500/95 border-emerald-400 text-white"
            : "bg-gray-900/95 border-gray-700 text-white"
        )}
      >
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">Sin conexión</span>
            <span className="text-xs text-gray-400 ml-1">Modo offline</span>
          </>
        ) : justReconnected ? (
          <>
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Sincronizando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Conectado</span>
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

// Componente inline para usar en otros lugares
export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs",
        isOnline ? "text-emerald-500" : "text-gray-400"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="w-3 h-3" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}

export default ConnectionBanner;
