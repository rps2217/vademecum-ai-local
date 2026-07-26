/**
 * SyncPanel - Panel de sincronización y backup
 * Permite gestionar la sincronización en la nube y backups
 */

import React, { useState, useEffect } from 'react';
import { 
  Cloud, CloudOff, RefreshCw, Download, Upload, 
  CheckCircle, AlertCircle, Wifi, WifiOff, HardDrive, Database
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { syncService, type SyncStatus } from '../../services/SyncService';

export function SyncPanel() {
  const [status, setStatus] = useState<SyncStatus>(syncService.getStatus());
  const [storageSize, setStorageSize] = useState<{ local: number; cloud: number }>({ local: 0, cloud: 0 });
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    // Suscribirse a cambios de estado
    const unsubscribe = syncService.subscribe(setStatus);
    
    // Cargar tamaño de almacenamiento
    syncService.getStorageSize().then(setStorageSize);

    return () => unsubscribe();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    
    try {
      await syncService.syncToCloud();
      const size = await syncService.getStorageSize();
      setStorageSize(size);
      setMessage({ type: 'success', text: 'Sincronización completada correctamente' });
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${(error as Error).message}` });
    } finally {
      setSyncing(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      await syncService.downloadBackup();
      setMessage({ type: 'success', text: 'Backup descargado correctamente' });
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${(error as Error).message}` });
    }
  };

  const handleUploadBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        await syncService.importFromJSON(text);
        const size = await syncService.getStorageSize();
        setStorageSize(size);
        setMessage({ type: 'success', text: 'Backup restaurado correctamente' });
      } catch (error) {
        setMessage({ type: 'error', text: `Error: ${(error as Error).message}` });
      }
    };
    input.click();
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Nunca';
    return new Date(timestamp).toLocaleString('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              status.isOnline ? "bg-emerald-100" : "bg-gray-100"
            )}>
              {status.isOnline ? (
                <Cloud className="w-5 h-5 text-emerald-600" />
              ) : (
                <CloudOff className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Sincronización</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                {status.isOnline ? (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-500" />
                    Conectado
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-gray-400" />
                    Sin conexión
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Botón de sincronizar */}
          <button
            onClick={handleSync}
            disabled={syncing || !status.isOnline}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              syncing || !status.isOnline
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-4">
        {/* Mensaje de estado */}
        {message && (
          <div className={cn(
            "p-3 rounded-lg flex items-center gap-2 text-sm",
            message.type === 'success' && "bg-emerald-50 text-emerald-700",
            message.type === 'error' && "bg-red-50 text-red-700",
            message.type === 'info' && "bg-blue-50 text-blue-700"
          )}>
            {message.type === 'success' && <CheckCircle className="w-4 h-4" />}
            {message.type === 'error' && <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        {/* Última sincronización */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Última sincronización</span>
          <span className="text-sm text-gray-900 font-medium">
            {formatDate(status.lastSync)}
          </span>
        </div>

        {/* Almacenamiento */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <HardDrive className="w-4 h-4" />
              <span className="text-xs">Local</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">
              {storageSize.local > 0 ? `${storageSize.local} KB` : '-'}
            </span>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Database className="w-4 h-4" />
              <span className="text-xs">Nube</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">
              {storageSize.cloud > 0 ? `${storageSize.cloud} KB` : '-'}
            </span>
          </div>
        </div>

        {/* Estado de sincronización */}
        {status.syncInProgress && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Sincronizando datos...
          </div>
        )}

        {status.error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            {status.error}
          </div>
        )}

        {/* Acciones de backup */}
        <div className="pt-2 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Respaldos</h4>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadBackup}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar Backup
            </button>
            <button
              onClick={handleUploadBackup}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Restaurar Backup
            </button>
          </div>
        </div>

        {/* Info de la base de datos */}
        <div className="bg-violet-50 rounded-lg p-3">
          <div className="text-xs font-medium text-violet-700 mb-2">
            📦 Base de Conocimiento
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-violet-600">
            <span>• 400+ Ingredientes</span>
            <span>• 30+ Órganos</span>
            <span>• 150+ Patologías</span>
            <span>• 100+ Categorías</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SyncPanel;
