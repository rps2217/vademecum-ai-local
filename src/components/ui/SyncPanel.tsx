/**
 * SyncPanel - Panel de sincronización y backup con Supabase
 * Permite gestionar la sincronización en la nube y backups
 */

import React, { useState, useEffect } from 'react';
import { 
  Cloud, CloudOff, RefreshCw, Download, Upload, 
  CheckCircle, AlertCircle, Wifi, WifiOff, HardDrive, Database,
  Server, ArrowUpToLine, ArrowDownToLine, Trash2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { syncService, type SyncStatus } from '../../services/SyncService';

export function SyncPanel() {
  const [status, setStatus] = useState<SyncStatus>(syncService.getStatus());
  const [storageSize, setStorageSize] = useState<{ local: number; cloud: number }>({ local: 0, cloud: 0 });
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [syncingToCloud, setSyncingToCloud] = useState(false);
  const [syncingFromCloud, setSyncingFromCloud] = useState(false);

  useEffect(() => {
    const unsubscribe = syncService.subscribe(setStatus);
    syncService.getStorageSize().then(setStorageSize);

    return () => unsubscribe();
  }, []);

  const handleSyncToCloud = async () => {
    setSyncingToCloud(true);
    setMessage(null);
    
    try {
      const result = await syncService.syncToCloud();
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        const size = await syncService.getStorageSize();
        setStorageSize(size);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${(error as Error).message}` });
    } finally {
      setSyncingToCloud(false);
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!confirm('¿Restaurar desde la nube? Esto sobrescribirá los datos locales.')) {
      return;
    }
    
    setSyncingFromCloud(true);
    setMessage(null);
    
    try {
      const result = await syncService.restoreFromCloud();
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        const size = await syncService.getStorageSize();
        setStorageSize(size);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${(error as Error).message}` });
    } finally {
      setSyncingFromCloud(false);
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
              status.isSupabaseConnected ? "bg-violet-100" : status.isOnline ? "bg-emerald-100" : "bg-gray-100"
            )}>
              {status.isSupabaseConnected ? (
                <Server className="w-5 h-5 text-violet-600" />
              ) : status.isOnline ? (
                <Cloud className="w-5 h-5 text-emerald-600" />
              ) : (
                <CloudOff className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Sincronización</h3>
              <p className="text-sm flex items-center gap-1.5">
                {status.isSupabaseConnected ? (
                  <>
                    <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
                    <span className="text-violet-600">Supabase conectado</span>
                  </>
                ) : status.isOnline ? (
                  <>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span className="text-emerald-600">Solo local</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    <span className="text-gray-500">Sin conexión</span>
                  </>
                )}
              </p>
            </div>
          </div>
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

        {/* Estado de Supabase */}
        {status.isSupabaseConnected ? (
          <>
            {/* Estadísticas de sincronización */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-violet-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-violet-600 mb-1">
                  <ArrowUpToLine className="w-4 h-4" />
                  <span className="text-xs font-medium">En la nube</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-violet-500">Ingredientes:</span>
                    <span className="font-semibold text-violet-700">{status.cloudIngredients}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-violet-500">Órganos:</span>
                    <span className="font-semibold text-violet-700">{status.cloudOrgans}</span>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <ArrowDownToLine className="w-4 h-4" />
                  <span className="text-xs font-medium">Local</span>
                </div>
                <div className="flex items-center justify-center h-8">
                  <span className="text-lg font-semibold text-emerald-700">
                    {storageSize.local > 0 ? `${storageSize.local} KB` : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Botones de sincronización */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSyncToCloud}
                disabled={syncingToCloud || !status.isOnline}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  syncingToCloud || !status.isOnline
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-violet-600 text-white hover:bg-violet-700"
                )}
              >
                <ArrowUpToLine className={cn("w-4 h-4", syncingToCloud && "animate-spin")} />
                {syncingToCloud ? 'Subiendo...' : 'Subir a la nube'}
              </button>
              <button
                onClick={handleRestoreFromCloud}
                disabled={syncingFromCloud || !status.isOnline}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  syncingFromCloud || !status.isOnline
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                )}
              >
                <ArrowDownToLine className={cn("w-4 h-4", syncingFromCloud && "animate-spin")} />
                {syncingFromCloud ? 'Descargando...' : 'Descargar desde nube'}
              </button>
            </div>
          </>
        ) : (
          /* Info cuando no hay Supabase */
          <div className="bg-amber-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-700 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Supabase no configurado</span>
            </div>
            <p className="text-sm text-amber-600 mb-3">
              Conecta Supabase en Configuración para sincronizar tu base de conocimiento en la nube.
            </p>
            <p className="text-xs text-amber-500">
              Los datos locales están disponibles para uso offline.
            </p>
          </div>
        )}

        {/* Última sincronización */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Última sincronización</span>
          <span className="text-sm text-gray-900 font-medium">
            {formatDate(status.lastSync)}
          </span>
        </div>

        {/* Estado de sincronización */}
        {(syncingToCloud || syncingFromCloud) && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Sincronizando datos...
          </div>
        )}

        {/* Acciones de backup */}
        <div className="pt-2 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Respaldos locales</h4>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadBackup}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar JSON
            </button>
            <button
              onClick={handleUploadBackup}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Importar JSON
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
