import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Key, ShieldCheck, AlertCircle, ArrowRight, Activity } from 'lucide-react';

export const AccessGate: React.FC = () => {
  const { grantAccess } = useAuth();
  const [key, setKey] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = grantAccess(key);
    if (!success) {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-brand-primary/10 rounded-3xl mb-6 border border-brand-primary/20">
            <Activity className="w-10 h-10 text-brand-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Vademécum Inteligente
          </h1>
          <p className="text-slate-400">
            Acceso restringido a personal autorizado
          </p>
        </div>

        <div className="bg-brand-surface border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent" />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                Llave de Acceso al Sistema
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Key className={`w-5 h-5 transition-colors ${error ? 'text-red-500' : 'text-slate-500'}`} />
                </div>
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full bg-brand-bg border ${error ? 'border-red-500/50' : 'border-slate-800'} text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-slate-700 font-mono tracking-widest`}
                  autoFocus
                />
              </div>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ml-1"
                >
                  <AlertCircle className="w-3 h-3" /> Llave incorrecta. Intente de nuevo.
                </motion.p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 group"
            >
              Validar Credenciales
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            Encriptación de Grado Clínico
          </div>
        </div>

        <p className="text-center mt-8 text-slate-600 text-[10px] uppercase tracking-[0.2em] font-bold">
          © 2024 Vademécum AI • Sistema de Soporte Clínico
        </p>
      </motion.div>
    </div>
  );
};
