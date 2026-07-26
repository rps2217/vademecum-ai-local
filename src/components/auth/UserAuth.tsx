/**
 * UserAuth Component - Autenticación de Usuario
 */

import React, { useState, useEffect } from 'react';
import { userProfileService, type UserSettings } from '../../services/UserProfileService';
import { supabaseService } from '../../services/SupabaseService';

interface Props {
  onClose?: () => void;
  onAuthenticated?: (user: UserSettings) => void;
}

export const UserAuth: React.FC<Props> = ({ onClose, onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'profile'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserSettings | null>(null);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);

  useEffect(() => {
    const client = supabaseService.getClient();
    setIsSupabaseConfigured(!!client);

    const unsubscribe = userProfileService.onAuthChange((newUser) => {
      setUser(newUser);
      if (newUser && onAuthenticated) onAuthenticated(newUser);
    });

    const currentUser = userProfileService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setMode('profile');
    }

    return () => unsubscribe();
  }, [onAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      if (mode === 'login') {
        result = await userProfileService.signIn(email, password);
      } else {
        result = await userProfileService.signUp(email, password, displayName);
      }

      if (result.success && result.user) {
        setUser(result.user);
        setMode('profile');
      } else {
        setError(result.error || 'Error desconocido');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await userProfileService.signOut();
      setUser(null);
      setMode('login');
      setEmail('');
      setPassword('');
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const result = await userProfileService.syncFromCloud();
      if (result.success && result.user) {
        setUser(result.user);
        alert('Configuraciones sincronizadas');
      } else {
        setError(result.error || 'Error sincronizando');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Sincronización entre dispositivos</h2>
        <p className="text-gray-600 mb-4">
          Para sincronizar configuraciones entre dispositivos:
        </p>
        <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-2 mb-4">
          <li>Crea proyecto en <span className="text-blue-600">supabase.com</span></li>
          <li>Copia URL y Key en Ajustes de la app</li>
          <li>En Supabase SQL Editor, ejecuta este SQL:</li>
        </ol>
        <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto mb-4">
{`CREATE TABLE public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manage_own" ON public.user_profiles FOR ALL USING (auth.uid() = user_id);`}
        </pre>
        <button onClick={() => navigator.clipboard.writeText(
          `CREATE TABLE public.user_profiles (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, email TEXT, display_name TEXT, settings JSONB DEFAULT '{}', updated_at TIMESTAMPTZ DEFAULT NOW()); ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY; CREATE POLICY "manage_own" ON public.user_profiles FOR ALL USING (auth.uid() = user_id);`
        )} className="text-sm text-blue-600 hover:underline mb-4">
          📋 Copiar SQL
        </button>
        {onClose && (
          <button onClick={onClose} className="mt-2 w-full bg-gray-100 py-2 rounded-lg">
            Cerrar
          </button>
        )}
      </div>
    );
  }

  if (mode === 'profile' && user) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.displayName}</h2>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-2">Última sincronización</h3>
          <p className="text-sm text-gray-600">
            {user.lastSyncAt ? new Date(user.lastSyncAt).toLocaleString('es-ES') : 'Nunca'}
          </p>
          <button onClick={handleSync} disabled={loading} 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
            {loading ? 'Sincronizando...' : 'Sincronizar ahora'}
          </button>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setMode('login')} className="flex-1 bg-gray-100 py-2 rounded-lg">
            Volver
          </button>
          <button onClick={handleSignOut} disabled={loading}
            className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600">
            Cerrar sesión
          </button>
        </div>

        {onClose && (
          <button onClick={onClose} className="mt-2 w-full bg-gray-800 text-white py-2 rounded-lg">
            Continuar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-6 text-center">
        {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="tu@email.com" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Min 6 caracteres" />
        </div>

        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Tu nombre" />
          </div>
        )}

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

        <button type="submit" disabled={loading}
          className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50">
          {loading ? 'Cargando...' : mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
          className="text-blue-600 hover:underline text-sm">
          {mode === 'login' ? 'No tienes cuenta? Regístrate' : 'Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>

      {onClose && (
        <button onClick={onClose} className="mt-4 w-full bg-gray-100 py-2 rounded-lg">
          Continuar sin cuenta
        </button>
      )}
    </div>
  );
};

export default UserAuth;
