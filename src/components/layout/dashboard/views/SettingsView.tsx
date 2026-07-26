/**
 * SettingsView - Vista de Configuración
 * Gestiona la conexión con Supabase y opciones de la app
 */

import React, { useState, useEffect } from 'react';
import { Settings, Database, RefreshCw, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabaseService } from '../../../../services/SupabaseService';
import { dataService } from '../../../../services/DataService';
import { SyncPanel } from '../../../ui/SyncPanel';

interface SettingsViewProps {
  connected: boolean;
}

export function SettingsView({ connected }: SettingsViewProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [localProductCount, setLocalProductCount] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Obtener cantidad de productos locales
  useEffect(() => {
    const checkLocalProducts = async () => {
      try {
        const products = await dataService.getAllProducts();
        setLocalProductCount(products.length);
      } catch (e) {
        setLocalProductCount(0);
      }
    };
    checkLocalProducts();
  }, [refreshKey]);

  const handleSupabaseConnected = () => {
    setRefreshKey(prev => prev + 1);
    window.location.reload();
  };

  const handleForceSync = async () => {
    if (!confirm('¿Forzar sincronización? Esto borrará los datos locales y descargará todo desde la nube.')) {
      return;
    }
    
    setSyncing(true);
    localStorage.removeItem('synced_products');
    
    setTimeout(() => {
      setSyncing(false);
      window.location.reload();
    }, 1000);
  };

  const handleClearCache = () => {
    if (!confirm('¿Limpiar caché local? Los datos se volverán a descargar.')) {
      return;
    }
    
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Configuración</h2>
        <p className="text-sm text-gray-500">
          Gestiona la conexión a la nube y opciones de la aplicación.
        </p>
      </div>

      {/* Panel de Sincronización */}
      <SyncPanel />

      {/* Estado de Supabase */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <Database className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">Supabase</h3>
            <p className="text-sm text-gray-500">Base de datos en la nube</p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            connected 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {connected ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                Conectado
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                No conectado
              </>
            )}
          </div>
        </div>

        {connected && (
          <div className="text-sm text-gray-600 mb-4">
            <p>URL: <span className="font-mono text-xs">{supabaseService.getConnectedUrl()}</span></p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleForceSync}
            disabled={syncing || !connected}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Forzar Sincronización
              </>
            )}
          </button>
          <button
            onClick={handleClearCache}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Limpiar Caché
          </button>
        </div>
      </div>

      {/* Estadísticas locales */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-medium text-gray-900 mb-3">Datos Locales</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Productos en caché:</span>
            <span className="font-medium">{localProductCount ?? '...'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Versión de KB:</span>
            <span className="font-medium">5.0.0</span>
          </div>
        </div>
      </div>

      {/* Links útiles */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-medium text-gray-900 mb-3">Recursos</h3>
        <div className="space-y-2">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir Supabase Dashboard
          </a>
          <a
            href="https://github.com/rps2217/vademecum-ai-local"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700"
          >
            <ExternalLink className="w-4 h-4" />
            Ver en GitHub
          </a>
        </div>
      </div>

      {/* Info de versión */}
      <div className="text-center text-xs text-gray-400">
        <p>Vademecum AI Local v1.0.0</p>
        <p>Build: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}

export default SettingsView;
