/**
 * Componente de Configuración de Supabase
 * Permite al usuario conectar con su base de datos real y sincronizar
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, Key, Link as LinkIcon, CheckCircle2, 
  AlertCircle, Loader2, ExternalLink, X, RefreshCw, Download
} from 'lucide-react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cn } from '../../lib/utils';

interface SupabaseSetupProps {
  onConnected?: () => void;
  onSyncStart?: () => void;
  onSyncComplete?: (count: number) => void;
}

interface ConfigState {
  url: string;
  anonKey: string;
  serviceKey: string;
  status: 'idle' | 'testing' | 'success' | 'error' | 'syncing';
  message: string;
  productCount?: number;
  cloudProductCount?: number;
}

export function SupabaseSetup({ onConnected, onSyncStart, onSyncComplete }: SupabaseSetupProps) {
  const [config, setConfig] = useState<ConfigState>({
    url: '',
    anonKey: '',
    serviceKey: '',
    status: 'idle',
    message: ''
  });
  const [showServiceKey, setShowServiceKey] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Detectar si ya hay configuración guardada
  const savedUrl = localStorage.getItem('supabase_url');
  const savedAnonKey = localStorage.getItem('supabase_anon_key');
  const isConfigured = savedUrl && savedAnonKey && !savedUrl.includes('yourproject');

  // Consultar productos de la nube cuando ya está configurado
  useEffect(() => {
    if (isConfigured && savedUrl && savedAnonKey) {
      checkCloudProducts(savedUrl, savedAnonKey);
    }
  }, [isConfigured]);

  const checkCloudProducts = async (url: string, key: string) => {
    try {
      const supabase = createClient(url, key);
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      
      setConfig(prev => ({
        ...prev,
        cloudProductCount: count || 0
      }));
    } catch (error) {
      console.error('Error checking cloud products:', error);
    }
  };

  const handleSyncFromCloud = async () => {
    if (!savedUrl || !savedAnonKey) return;
    
    setIsSyncing(true);
    setConfig(prev => ({ ...prev, status: 'syncing', message: 'Sincronizando productos...' }));
    onSyncStart?.();
    
    try {
      const supabase = createClient(savedUrl, savedAnonKey);
      
      // Descargar productos desde Supabase
      const { data: products, error } = await supabase
        .from('products')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      if (!products || products.length === 0) {
        setConfig(prev => ({ 
          ...prev, 
          status: 'error', 
          message: 'No hay productos en la nube' 
        }));
        setIsSyncing(false);
        return;
      }
      
      // Guardar en localStorage como backup
      localStorage.setItem('synced_products', JSON.stringify(products));
      localStorage.setItem('last_sync', new Date().toISOString());
      
      // Disparar evento para que el dashboard actualice
      window.dispatchEvent(new CustomEvent('cloud-data-ready', { 
        detail: { products, count: products.length } 
      }));
      
      setConfig(prev => ({ 
        ...prev, 
        status: 'success', 
        message: `¡Sincronizados ${products.length} productos!`,
        productCount: products.length,
        cloudProductCount: products.length
      }));
      
      onSyncComplete?.(products.length);
      
      // Recargar después de 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      setConfig(prev => ({ 
        ...prev, 
        status: 'error', 
        message: error.message || 'Error al sincronizar' 
      }));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.url || !config.anonKey) {
      setConfig(prev => ({
        ...prev,
        status: 'error',
        message: 'Por favor completa la URL y la Anon Key'
      }));
      return;
    }

    setConfig(prev => ({ ...prev, status: 'testing', message: 'Probando conexión...' }));

    try {
      // Crear cliente de Supabase directamente en el frontend
      const supabase: SupabaseClient = createClient(config.url, config.anonKey);
      
      // Verificar conexión consultando los productos
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        if (error.message.includes('products') || error.code === '42P01') {
          setConfig(prev => ({
            ...prev,
            status: 'error',
            message: 'La tabla "products" no existe. Ejecuta el script SQL de migración en Supabase.'
          }));
        } else {
          setConfig(prev => ({
            ...prev,
            status: 'error',
            message: error.message || 'Error al conectar con Supabase'
          }));
        }
        return;
      }

      // Conexión exitosa
      setConfig(prev => ({
        ...prev,
        status: 'success',
        message: `Conexión exitosa. ${count || 0} productos encontrados en la nube.`,
        productCount: count || 0,
        cloudProductCount: count || 0
      }));
      
      // Guardar configuración
      localStorage.setItem('supabase_url', config.url);
      localStorage.setItem('supabase_anon_key', config.anonKey);
      if (config.serviceKey) {
        localStorage.setItem('supabase_service_key', config.serviceKey);
      }
      
      // Guardar productos en localStorage
      if (count && count > 0) {
        setConfig(prev => ({ ...prev, status: 'syncing', message: 'Descargando productos...' }));
        const { data: products } = await supabase.from('products').select('*');
        if (products) {
          localStorage.setItem('synced_products', JSON.stringify(products));
          localStorage.setItem('last_sync', new Date().toISOString());
        }
      }
      
      // Actualizar variables de entorno para el frontend
      window.localStorage.setItem('supabase_connected', 'true');
      window.dispatchEvent(new Event('storage'));
      
      onConnected?.();
      
      // Recargar para aplicar cambios
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error: any) {
      setConfig(prev => ({
        ...prev,
        status: 'error',
        message: error.message || 'Error de conexión. Verifica tu internet.'
      }));
    }
  };

  const handleClearConfig = () => {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_anon_key');
    localStorage.removeItem('supabase_service_key');
    localStorage.removeItem('supabase_connected');
    localStorage.removeItem('synced_products');
    localStorage.removeItem('last_sync');
    window.dispatchEvent(new Event('storage'));
    setConfig({
      url: '',
      anonKey: '',
      serviceKey: '',
      status: 'idle',
      message: ''
    });
    onConnected?.();
  };

  // Estado: Ya conectado
  if (isConfigured) {
    const lastSync = localStorage.getItem('last_sync');
    const lastSyncDate = lastSync ? new Date(lastSync).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Nunca';
    
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Supabase Conectado</h3>
              <p className="text-sm text-gray-500">{savedUrl}</p>
            </div>
          </div>
          <button
            onClick={handleClearConfig}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Desconectar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Stats de sincronización */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {config.cloudProductCount !== undefined 
                ? `${config.cloudProductCount} productos en la nube`
                : 'Verificando...'}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            Último sync: {lastSyncDate}
          </span>
        </div>
        
        {/* Botón de sincronizar */}
        <button
          onClick={handleSyncFromCloud}
          disabled={isSyncing || !config.cloudProductCount}
          className={cn(
            "w-full py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2",
            "bg-emerald-600 text-white hover:bg-emerald-700",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Sincronizar ahora
            </>
          )}
        </button>
      </div>
    );
  }

  // Estado: No conectado - Formulario
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <Database className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Conectar a Supabase</h3>
          <p className="text-sm text-gray-500">Sincroniza productos desde la nube</p>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          Cómo obtener las credenciales
        </h4>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Ve a <a href="https://supabase.com" target="_blank" className="text-violet-600 hover:underline inline-flex items-center gap-1">supabase.com <ExternalLink className="w-3 h-3" /></a></li>
          <li>Selecciona tu proyecto</li>
          <li>Ve a Settings → API</li>
          <li>Copia el "Project URL" y "anon public" key</li>
        </ol>
      </div>

      {/* Campos de configuración */}
      <div className="space-y-3">
        {/* URL */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            <LinkIcon className="w-3 h-3 inline mr-1" />
            Project URL
          </label>
          <input
            type="url"
            value={config.url}
            onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
            placeholder="https://xxxxxxxxxxxx.supabase.co"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          />
        </div>

        {/* Anon Key */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            <Key className="w-3 h-3 inline mr-1" />
            Anon Public Key
          </label>
          <input
            type="password"
            value={config.anonKey}
            onChange={(e) => setConfig(prev => ({ ...prev, anonKey: e.target.value }))}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          />
        </div>

        {/* Service Key (opcional) */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Service Role Key (opcional - para escritura)
          </label>
          <div className="relative">
            <input
              type={showServiceKey ? 'text' : 'password'}
              value={config.serviceKey}
              onChange={(e) => setConfig(prev => ({ ...prev, serviceKey: e.target.value }))}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowServiceKey(!showServiceKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              {showServiceKey ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>
      </div>

      {/* Mensaje de estado */}
      {config.message && (
        <div className={cn(
          "mt-4 p-3 rounded-lg text-sm flex items-start gap-2",
          config.status === 'success' && "bg-emerald-50 text-emerald-700",
          config.status === 'error' && "bg-red-50 text-red-700",
          config.status === 'testing' && "bg-gray-50 text-gray-600",
          config.status === 'syncing' && "bg-violet-50 text-violet-700"
        )}>
          {config.status === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
          {config.status === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          {(config.status === 'testing' || config.status === 'syncing') && <Loader2 className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />}
          <span>{config.message}</span>
        </div>
      )}

      {/* Botón de conectar */}
      <button
        onClick={handleTestConnection}
        disabled={config.status === 'testing' || config.status === 'syncing'}
        className={cn(
          "w-full mt-4 py-2.5 rounded-lg font-medium text-sm transition-all",
          "bg-violet-600 text-white hover:bg-violet-700",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {config.status === 'testing' ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Conectando...
          </span>
        ) : config.status === 'syncing' ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Sincronizando productos...
          </span>
        ) : (
          'Conectar y sincronizar'
        )}
      </button>
    </div>
  );
}

export default SupabaseSetup;
