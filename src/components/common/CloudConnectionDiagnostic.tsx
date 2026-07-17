import React, { useState, useEffect } from 'react';
import { Cloud, CheckCircle, XCircle, Loader2, Database, RefreshCw } from 'lucide-react';
import { supabaseService } from '../../services/SupabaseService';

export const CloudConnectionDiagnostic: React.FC = () => {
  const [status, setStatus] = useState<{
    isConfigured: boolean;
    url: string | null;
    keyPrefix: string | null;
    testResult: 'pending' | 'success' | 'error' | null;
    productCount: number;
    error: string | null;
  }>({
    isConfigured: false,
    url: null,
    keyPrefix: null,
    testResult: null,
    productCount: 0,
    error: null
  });

  const checkConnection = async () => {
    setStatus(prev => ({ ...prev, testResult: 'pending', error: null }));

    // Check if configured
    const isConfigured = supabaseService.isConfigured();
    
    // Get URL and key info from env
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || (window as any)._env_?.VITE_SUPABASE_URL;
    const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (window as any)._env_?.VITE_SUPABASE_ANON_KEY;
    
    setStatus(prev => ({
      ...prev,
      isConfigured,
      url: supabaseUrl || null,
      keyPrefix: supabaseKey ? supabaseKey.substring(0, 10) + '...' : null
    }));

    if (!isConfigured) {
      setStatus(prev => ({
        ...prev,
        testResult: 'error',
        error: 'Supabase no esta configurado. Verifica las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY'
      }));
      return;
    }

    // Test connection
    const supabase = supabaseService.getClient();
    if (!supabase) {
      setStatus(prev => ({
        ...prev,
        testResult: 'error',
        error: 'Cliente Supabase no pudo ser creado'
      }));
      return;
    }

    try {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      setStatus(prev => ({
        ...prev,
        productCount: count || 0,
        testResult: 'success'
      }));
    } catch (err: any) {
      setStatus(prev => ({
        ...prev,
        testResult: 'error',
        error: err.message || 'Error desconocido'
      }));
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Cloud className="w-4 h-4" />
          Diagnostico de Conexion Cloud
        </h3>
        <button
          onClick={checkConnection}
          className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          title="Reintentar"
        >
          <RefreshCw className={`w-4 h-4 ${status.testResult === 'pending' ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <span className="text-muted-foreground">Configurado:</span>
          <div className="flex items-center gap-1">
            {status.isConfigured ? (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span className={status.isConfigured ? 'text-emerald-500' : 'text-red-500'}>
              {status.isConfigured ? 'Si' : 'No'}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-muted-foreground">URL:</span>
          <div className="truncate text-xs font-mono">
            {status.url ? status.url.replace('https://', '') : 'No definida'}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-muted-foreground">API Key:</span>
          <div className="truncate text-xs font-mono">
            {status.keyPrefix || 'No definida'}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-muted-foreground">Productos:</span>
          <div className="flex items-center gap-1">
            <Database className="w-4 h-4 text-muted-foreground" />
            <span className={status.productCount > 0 ? 'text-emerald-500' : 'text-muted-foreground'}>
              {status.productCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {status.testResult === 'pending' && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Probando conexion...</span>
        </div>
      )}

      {status.testResult === 'success' && (
        <div className="flex items-center gap-2 text-emerald-500">
          <CheckCircle className="w-4 h-4" />
          <span>Conexion exitosa</span>
        </div>
      )}

      {status.testResult === 'error' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-red-500">
            <XCircle className="w-4 h-4" />
            <span>Error de conexion</span>
          </div>
          <p className="text-xs text-red-400 bg-red-500/10 rounded-lg p-2">
            {status.error}
          </p>
        </div>
      )}

      {!status.isConfigured && (
        <div className="text-xs text-muted-foreground bg-amber-500/10 rounded-lg p-3">
          <strong>Nota:</strong> Las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY 
          deben estar configuradas en el archivo .env para habilitar la sincronizacion con la nube.
        </div>
      )}
    </div>
  );
};
