import React, { useEffect, useState } from 'react';
import { Brain, Loader2, CheckCircle2, AlertCircle, Cpu, Activity, Thermometer } from 'lucide-react';
import { AIService } from '../services/AIService';
import { AIOrchestratorService, OrchestratorStatus } from '../services/AIOrchestratorService';
import { EventBus, EventType } from '../services/EventBus';
import { motion, AnimatePresence } from 'motion/react';

export const AIStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState(AIService.getStatus());
  const [orchestratorStatus, setOrchestratorStatus] = useState<OrchestratorStatus>({ 
    isRunning: false, 
    progress: 0, 
    currentTask: '', 
    thermalStress: 0, 
    deviceTier: 'STANDARD' 
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = AIService.getStatus();
      setStatus(currentStatus);
    }, 1000);

    const sub = EventBus.on<any>(EventType.SYNERGY_STATUS_CHANGED).subscribe((evt) => {
      setCurrentProduct(evt.message || evt.currentProcessingName);
    });

    const unsubscribeOrchestrator = AIOrchestratorService.subscribe(status => {
      setOrchestratorStatus(status);
    });

    return () => {
      clearInterval(interval);
      sub.unsubscribe();
      unsubscribeOrchestrator();
    };
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

  const getThermalColor = () => {
    const stress = orchestratorStatus.thermalStress;
    const tier = orchestratorStatus.deviceTier;
    const thresholds = { ULTRA: 300, STANDARD: 150, ECO: 60 };
    const max = thresholds[tier as keyof typeof thresholds] || 150;
    
    if (stress > max * 0.8) return 'text-red-500';
    if (stress > max * 0.5) return 'text-yellow-500';
    return 'text-emerald-500';
  };

  const getThermalWidth = () => {
    const stress = orchestratorStatus.thermalStress;
    const tier = orchestratorStatus.deviceTier;
    const thresholds = { ULTRA: 400, STANDARD: 250, ECO: 100 };
    const max = thresholds[tier as keyof typeof thresholds] || 250;
    return `${Math.min(100, (stress / max) * 100)}%`;
  };

  return (
    <>
      {orchestratorStatus.isRunning && (
        <div className="fixed top-0 left-0 w-full z-50 h-1 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            className="h-full bg-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${orchestratorStatus.progress}%` }}
          />
          <div className="absolute top-2 left-4 text-[10px] font-bold text-indigo-400 bg-slate-900/80 px-2 py-1 rounded shadow-lg">
            Pipeline IA: {orchestratorStatus.progress}% - {orchestratorStatus.currentTask}
          </div>
        </div>
      )}
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

                {orchestratorStatus.isRunning && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-slate-700">
                    <div className="flex justify-between text-[10px] uppercase tracking-wider text-indigo-400 font-bold">
                      <span>Pipeline IA</span>
                      <span>{orchestratorStatus.progress}%</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{orchestratorStatus.currentTask}</div>
                    <div className="h-1 w-full bg-brand-bg rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${orchestratorStatus.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {status.isReady && !orchestratorStatus.isRunning && (
                  <div className="space-y-3">
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                      Motor: <span className="text-slate-200 font-medium">{status.engine}</span>
                    </div>
                    
                    {currentProduct && (
                      <div className="p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="w-3 h-3 text-brand-primary animate-pulse" />
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Analizando Sinergia</span>
                        </div>
                        <p className="text-xs text-brand-primary font-medium truncate" title={currentProduct}>
                          {currentProduct}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-1.5">
                                <Thermometer className={`w-3 h-3 ${getThermalColor()}`} />
                                <span className="text-[11px] font-bold text-slate-300">Salud Térmica</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{orchestratorStatus.deviceTier}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                                className={`h-full transition-colors duration-500 ${
                                    getThermalColor().includes('red') ? 'bg-red-500' : 
                                    getThermalColor().includes('yellow') ? 'bg-yellow-500' : 'bg-emerald-500'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: getThermalWidth() }}
                                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                            />
                        </div>
                        <p className="text-[9px] text-slate-500 mt-1.5 italic">
                            {orchestratorStatus.thermalStress > 100 ? 'Ralentizando para proteger CPU...' : 'Temperatura estable.'}
                        </p>
                    </div>
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
            <div className="flex items-center gap-1.5 pr-2 mr-2 border-r border-current opacity-80">
                <Thermometer className={`w-3.5 h-3.5 ${getThermalColor()}`} />
                <span className="text-[10px] font-mono">{Math.round(orchestratorStatus.thermalStress)}</span>
            </div>
            {getStatusIcon()}
            <span>IA: {status.isReady ? 'TRABAJANDO EN CLÚSTER' : status.isInitializing ? 'CARGANDO' : 'OFFLINE'}</span>
          </motion.button>
        </motion.div>
      </div>
    </>
  );
};
