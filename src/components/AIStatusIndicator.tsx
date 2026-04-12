import React, { useEffect, useState } from 'react';
import { Brain, Loader2, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';
import { AIService } from '../services/AIService';
import { motion, AnimatePresence } from 'motion/react';

export const AIStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState(AIService.getStatus());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = AIService.getStatus();
      setStatus(currentStatus);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (status.isReady) return 'text-brand-accent bg-brand-accent/10 border-brand-accent/20';
    if (status.isInitializing) return 'text-brand-primary bg-brand-primary/10 border-brand-primary/20';
    return 'text-slate-500 bg-brand-surface/50 border-slate-700';
  };

  const getStatusIcon = () => {
    if (status.isReady) return <CheckCircle2 className="w-4 h-4" />;
    if (status.isInitializing) return <Loader2 className="w-4 h-4 animate-spin" />;
    return <Cpu className="w-4 h-4" />;
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <motion.div 
        layout
        className={`flex flex-col items-end gap-2`}
      >
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-brand-surface border border-slate-800 rounded-2xl p-4 shadow-2xl w-64 mb-2 backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${status.isReady ? 'bg-brand-accent/10 text-brand-accent' : 'bg-brand-primary/10 text-brand-primary'}`}>
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Motor de IA Local</h4>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    {status.isReady ? 'Activo y Listo' : status.isInitializing ? 'Inicializando...' : 'En Espera (Diferido)'}
                  </p>
                </div>
              </div>

              {status.isInitializing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span className="truncate max-w-[180px]">{status.lastProgress.text}</span>
                    <span>{Math.round(status.lastProgress.progress)}%</span>
                  </div>
                  <div className="h-1 w-full bg-brand-bg rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-brand-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${status.lastProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {status.isReady && (
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                  Motor: <span className="text-slate-200 font-medium">{status.engine}</span>
                </div>
              )}

              {!status.isReady && !status.isInitializing && (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  El motor se activará automáticamente en segundo plano para procesar datos.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all shadow-lg backdrop-blur-md ${getStatusColor()}`}
        >
          {getStatusIcon()}
          <span>IA: {status.isReady ? 'TRABAJANDO EN CLÚSTER' : status.isInitializing ? 'CARGANDO' : 'OFFLINE'}</span>
        </motion.button>
      </motion.div>
    </div>
  );
};
