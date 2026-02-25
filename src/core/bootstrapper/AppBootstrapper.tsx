import React, { useEffect, useState } from 'react';
import { useHardwareDetection } from '../../hooks/useHardwareDetection';
import { SyncService } from '../../services/SyncService';
import { getDB } from '../database/db';

interface AppBootstrapperProps {
  children: React.ReactNode;
}

export const AppBootstrapper: React.FC<AppBootstrapperProps> = ({ children }) => {
  const { hardware, isDetecting: isDetectingHardware } = useHardwareDetection();
  const [isDbReady, setIsDbReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Inicializar Base de Datos Local
        await getDB();
        setIsDbReady(true);

        // 2. Verificar estado de sincronización
        const lastSync = await SyncService.getLastSyncTime();
        
        // Si nunca se ha sincronizado o pasaron más de 24h, forzamos sync en background
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const needsSync = !lastSync || (Date.now() - lastSync > ONE_DAY);

        if (needsSync) {
          setSyncStatus('syncing');
          const result = await SyncService.sync();
          setSyncStatus(result.success ? 'success' : 'error');
        } else {
          setSyncStatus('success');
        }

      } catch (error) {
        console.error('Error durante el arranque de la aplicación:', error);
        setBootError(error instanceof Error ? error.message : 'Error desconocido de inicialización');
      }
    };

    initializeApp();
  }, []);

  if (bootError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-900 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 border border-red-200">
          <h2 className="text-xl font-bold mb-2">Error Crítico de Inicialización</h2>
          <p className="text-sm opacity-80 mb-4">{bootError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (isDetectingHardware || !isDbReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <h2 className="text-lg font-medium">Iniciando Vademécum...</h2>
        <p className="text-sm text-slate-500 mt-2">
          {isDetectingHardware ? 'Analizando capacidades del sistema...' : 'Preparando base de datos local...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Indicador de Sincronización (Opcional, para debug visual en esta fase) */}
      {syncStatus === 'syncing' && (
        <div className="bg-indigo-600 text-white text-xs py-1 px-4 text-center">
          Sincronizando base de datos en segundo plano...
        </div>
      )}
      {syncStatus === 'error' && (
        <div className="bg-amber-500 text-white text-xs py-1 px-4 text-center">
          Modo Offline: Usando datos locales. La sincronización falló.
        </div>
      )}
      
      {/* Context Providers para Hardware y DB irían aquí si usamos Context API */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};
