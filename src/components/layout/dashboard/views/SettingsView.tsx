/**
 * SettingsView - Vista de Configuración
 * Gestiona la conexión con Supabase y opciones de la app
 */

import React, { useState, useEffect } from 'react';
import { Settings, Database, RefreshCw, ExternalLink, CheckCircle, AlertCircle, Loader2, Lock, Shield } from 'lucide-react';
import { supabaseService } from '../../../../services/SupabaseService';
import { dataService } from '../../../../services/DataService';
import { SyncPanel } from '../../../ui/SyncPanel';
import { appAuthService } from '../../../../services/AppAuthService';

interface SettingsViewProps {
  connected: boolean;
}

// Componente interno para cuenta/seguridad
function SecuritySection() {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    setLoading(true);
    const result = await appAuthService.changePassword(currentPassword, newPassword);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
    } else {
      setError(result.error || 'Error');
    }
  };

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión? Deberás ingresar la contraseña para volver.')) {
      appAuthService.logout();
      window.location.reload();
    }
  };

  const handleReset = () => {
    if (confirm('⚠️ ¿Reset completo? Esto borrará TODOS los datos incluyendo la contraseña. ¿Continuar?')) {
      appAuthService.resetAll();
      window.location.reload();
    }
  };

  const config = appAuthService.getAppConfig();

  return (
    <div className="space-y-4">
      {/* Estado de seguridad */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-green-800">Aplicación Protegida</p>
            <p className="text-sm text-green-600">
              Contraseña configurada el {config?.createdAt ? new Date(config.createdAt).toLocaleDateString('es-ES') : 'desconocido'}
            </p>
          </div>
        </div>
      </div>

      {/* Info del dispositivo */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <p className="text-gray-600">
          <span className="font-medium">ID Dispositivo:</span>{' '}
          <code className="text-xs bg-gray-200 px-1 rounded">{config?.deviceId || 'N/A'}</code>
        </p>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowChangePassword(!showChangePassword)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Lock className="w-4 h-4" />
          Cambiar Contraseña
        </button>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Formulario de cambio de contraseña */}
      {showChangePassword && (
        <form onSubmit={handleChangePassword} className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-900">Nueva Contraseña</h4>
          
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Contraseña actual"
            required
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nueva contraseña"
            required
            minLength={4}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmar nueva contraseña"
            required
            minLength={4}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">¡Contraseña actualizada!</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => setShowChangePassword(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Reset */}
      <div className="border-t pt-4 mt-4">
        <button
          onClick={handleReset}
          className="text-sm text-red-600 hover:text-red-700 hover:underline"
        >
          Resetear aplicación (borrar todo)
        </button>
      </div>
    </div>
  );
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

      {/* Seguridad */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">Seguridad</h3>
            <p className="text-sm text-gray-500">Protección de la aplicación</p>
          </div>
        </div>
        
        <SecuritySection />
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
