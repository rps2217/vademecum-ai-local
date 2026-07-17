import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, ShieldCheck, AlertCircle, ArrowRight, Activity, 
  Mail, Lock, UserPlus, LogOut, Loader2, Eye, EyeOff
} from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'forgot';

export const AccessGate: React.FC = () => {
  const { signIn, signUp, resetPassword, isSupabaseConfigured } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    setIsLoading(false);
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-4 bg-primary rounded-3xl mb-6 border border-primary/50">
              <Activity className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
              Vademécum Inteligente
            </h1>
            <p className="text-muted-foreground">
              Acceso restringido a personal autorizado
            </p>
          </div>

          <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-2xl">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
              <h2 className="text-xl font-bold">Configuración Requerida</h2>
              <p className="text-muted-foreground text-sm">
                Para usar esta aplicación, necesitas configurar Supabase.
                <br />
                Crea un archivo <code className="bg-muted px-2 py-1 rounded font-mono text-xs">.env</code> en la raíz con:
              </p>
              <pre className="bg-muted p-4 rounded-xl text-left text-xs font-mono overflow-x-auto">
{`VITE_SUPABASE_URL=tu-url-de-supabase
VITE_SUPABASE_ANON_KEY=tu-anon-key`}
              </pre>
              <p className="text-xs text-muted-foreground">
                Visita <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com</a> para crear un proyecto.
              </p>
            </div>
          </div>

          <p className="text-center mt-8 text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-bold">
            © 2024 Vademécum AI • Sistema de Soporte Clínico
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-primary rounded-3xl mb-6 border border-primary/50">
            <Activity className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
            Vademécum Inteligente
          </h1>
          <p className="text-muted-foreground">
            {mode === 'signin' && 'Accede con tus credenciales profesionales'}
            {mode === 'signup' && 'Crea tu cuenta de profesional'}
            {mode === 'forgot' && 'Recupera el acceso a tu cuenta'}
          </p>
        </div>

        <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent" />
          
          <AnimatePresence mode="wait">
            {successMessage ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 py-4"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-emerald-600 font-medium">{successMessage}</p>
                <button
                  onClick={() => handleModeChange('signin')}
                  className="text-primary hover:underline text-sm"
                >
                  Volver al inicio de sesión
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="profesional@farmacia.cl"
                      required
                      autoComplete="email"
                      className="w-full bg-background border border-border text-foreground rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                    />
                  </div>
                </div>

                {/* Password Field */}
                {mode !== 'forgot' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                      Contraseña
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'signup' ? 'Mínimo 8 caracteres' : '••••••••'}
                        required
                        minLength={mode === 'signup' ? 8 : 6}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        className="w-full bg-background border border-border text-foreground rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirm Password Field (Signup only) */}
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                      Confirmar Contraseña
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite la contraseña"
                        required
                        minLength={8}
                        className="w-full bg-background border border-border text-foreground rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-red-600 text-sm">{error}</p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-foreground font-bold py-4 rounded-2xl transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {mode === 'signin' && (
                        <>
                          Iniciar Sesión
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                      {mode === 'signup' && (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Crear Cuenta
                        </>
                      )}
                      {mode === 'forgot' && (
                        <>
                          <Mail className="w-4 h-4" />
                          Enviar Enlace
                        </>
                      )}
                    </>
                  )}
                </button>

                {/* Mode Switcher */}
                <div className="text-center text-sm space-y-2 pt-2">
                  {mode === 'signin' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleModeChange('forgot')}
                        className="text-primary hover:underline block w-full"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModeChange('signup')}
                        className="text-muted-foreground hover:text-foreground block w-full"
                      >
                        ¿No tienes cuenta? Regístrate
                      </button>
                    </>
                  )}
                  {mode === 'signup' && (
                    <button
                      type="button"
                      onClick={() => handleModeChange('signin')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ¿Ya tienes cuenta? Inicia sesión
                    </button>
                  )}
                  {mode === 'forgot' && (
                    <button
                      type="button"
                      onClick={() => handleModeChange('signin')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Volver al inicio de sesión
                    </button>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-border flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            Autenticación Segura con Supabase
          </div>
        </div>

        <p className="text-center mt-8 text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-bold">
          © 2024 Vademécum AI • Sistema de Soporte Clínico
        </p>
      </motion.div>
    </div>
  );
};
