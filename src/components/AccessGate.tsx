import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Loader2, Mail, Lock, Activity, ShieldCheck } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'forgot';

/**
 * AccessGate - Simple and Clean Login
 * Professional authentication interface
 */
export const AccessGate: React.FC = () => {
  const { signIn, signUp, resetPassword, isSupabaseConfigured } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMessage('');
  };

  const handleModeChange = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const result = await signIn(email, password);
        if (!result.success) {
          setError(result.error || 'Error de autenticación');
        }
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden');
          setIsLoading(false);
          return;
        }
        const result = await signUp(email, password);
        if (!result.success) {
          setError(result.error || 'Error al crear la cuenta');
        } else {
          setSuccessMessage('Cuenta creada. Revisa tu email para confirmar tu cuenta.');
          setMode('signin');
        }
      } else if (mode === 'forgot') {
        const result = await resetPassword(email);
        if (!result.success) {
          setError(result.error || 'Error al enviar email');
        } else {
          setSuccessMessage('Se ha enviado un enlace de recuperación a tu email.');
          setMode('signin');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Configuration Required State
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Vademécum</h1>
              <p className="text-slate-500 text-sm mt-1">Configuración requerida</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-2">Para usar esta aplicación necesitas configurar Supabase.</p>
                  <p className="text-amber-700">Crea un archivo <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">.env</code> en la raíz del proyecto:</p>
                </div>
              </div>
            </div>

            <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto">
{`VITE_SUPABASE_URL=tu-url
VITE_SUPABASE_ANON_KEY=tu-key`}
            </pre>

            <p className="text-center text-xs text-slate-500 mt-6">
              Obtén tus credenciales en <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">supabase.com</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Login Form
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Vademécum</h1>
          <p className="text-slate-500 text-sm mt-1">
            {mode === 'signin' && 'Inicia sesión para continuar'}
            {mode === 'signup' && 'Crea tu cuenta profesional'}
            {mode === 'forgot' && 'Recupera tu contraseña'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8">
          {successMessage ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-emerald-700 font-medium mb-4">{successMessage}</p>
              <button
                onClick={() => handleModeChange('signin')}
                className="text-emerald-600 hover:underline text-sm"
              >
                Volver al inicio de sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              {mode !== 'forgot' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'Mínimo 8 caracteres' : '••••••••'}
                      required
                      minLength={mode === 'signup' ? 8 : 6}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      required
                      minLength={8}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {mode === 'signin' && 'Iniciar sesión'}
                    {mode === 'signup' && 'Crear cuenta'}
                    {mode === 'forgot' && 'Enviar enlace'}
                  </>
                )}
              </button>

              {/* Links */}
              <div className="text-center text-sm space-y-2">
                {mode === 'signin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleModeChange('forgot')}
                      className="block w-full text-emerald-600 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                    <p className="text-slate-500">
                      ¿No tienes cuenta?{' '}
                      <button
                        type="button"
                        onClick={() => handleModeChange('signup')}
                        className="text-emerald-600 hover:underline font-medium"
                      >
                        Regístrate
                      </button>
                    </p>
                  </>
                )}
                {mode === 'signup' && (
                  <p className="text-slate-500">
                    ¿Ya tienes cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => handleModeChange('signin')}
                      className="text-emerald-600 hover:underline font-medium"
                    >
                      Inicia sesión
                    </button>
                  </p>
                )}
                {mode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => handleModeChange('signin')}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Volver al inicio de sesión
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Security Note */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4" />
            <span>Autenticación segura con Supabase</span>
          </div>
        </div>
      </div>
    </div>
  );
};
