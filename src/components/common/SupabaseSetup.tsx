/**
 * Componente de Configuración de Supabase
 * Permite al usuario conectar con su base de datos real
 */

import React, { useState } from 'react';
import { 
  Database, Key, Link as LinkIcon, CheckCircle2, 
  AlertCircle, Loader2, ExternalLink, X
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SupabaseSetupProps {
  onConnected?: () => void;
}

interface ConfigState {
  url: string;
  anonKey: string;
  serviceKey: string;
  status: 'idle' | 'testing' | 'success' | 'error';
  message: string;
  productCount?: number;
}

export function SupabaseSetup({ onConnected }: SupabaseSetupProps) {
  const [config, setConfig] = useState<ConfigState>({
    url: '',
    anonKey: '',
    serviceKey: '',
    status: 'idle',
    message: ''
  });
  const [showServiceKey, setShowServiceKey] = useState(false);
  
  // Detectar si ya hay configuración guardada
  const savedUrl = localStorage.getItem('supabase_url');
  const savedAnonKey = localStorage.getItem('supabase_anon_key');
  const isConfigured = savedUrl && savedAnonKey && !savedUrl.includes('yourproject');

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
      const response = await fetch(`/api/cloud-status`);
      const data = await response.json();
      
      if (data.success) {
        setConfig(prev => ({
          ...prev,
          status: 'success',
          message: `Conexión exitosa. ${data.cloud_product_count || 0} productos en la nube.`,
          productCount: data.cloud_product_count
        }));
        
        // Guardar configuración
        localStorage.setItem('supabase_url', config.url);
        localStorage.setItem('supabase_anon_key', config.anonKey);
        if (config.serviceKey) {
          localStorage.setItem('supabase_service_key', config.serviceKey);
        }
        
        onConnected?.();
      } else {
        setConfig(prev => ({
          ...prev,
          status: 'error',
          message: data.error || 'Error al conectar con Supabase'
        }));
      }
    } catch (error) {
      setConfig(prev => ({
        ...prev,
        status: 'error',
        message: 'Error de conexión. Verifica tu internet.'
      }));
    }
  };

  const handleClearConfig = () => {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_anon_key');
    localStorage.removeItem('supabase_service_key');
    setConfig({
      url: '',
      anonKey: '',
      serviceKey: '',
      status: 'idle',
      message: ''
    });
    onConnected?.();
  };

  if (isConfigured) {
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
        
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            Base de datos sincronizada
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <Database className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Conectar a Supabase</h3>
          <p className="text-sm text-gray-500">Configura tu base de datos en la nube</p>
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
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
          config.status === 'testing' && "bg-gray-50 text-gray-600"
        )}>
          {config.status === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
          {config.status === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          {config.status === 'testing' && <Loader2 className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />}
          <span>{config.message}</span>
        </div>
      )}

      {/* Botón de conectar */}
      <button
        onClick={handleTestConnection}
        disabled={config.status === 'testing'}
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
        ) : (
          'Conectar a Supabase'
        )}
      </button>
    </div>
  );
}

export default SupabaseSetup;
