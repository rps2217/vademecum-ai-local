import React, { useEffect, useState } from 'react';
import { Brain, Loader2, CheckCircle2, AlertCircle, Cpu, Activity, Thermometer } from 'lucide-react';
import { aiService } from '../services/AIService';
import { aiOrchestratorService, OrchestratorStatus } from '../services/AIOrchestratorService';
import { EventBus, EventType } from '../services/EventBus';
import { motion, AnimatePresence } from 'motion/react';

export const AIStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState(aiService.getStatus());
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
      const currentStatus = aiService.getStatus();
      setStatus(currentStatus);
    }, 1000);

    const sub = EventBus.on<any>(EventType.SYNERGY_STATUS_CHANGED).subscribe((evt) => {
      setCurrentProduct(evt.message || evt.currentProcessingName);
    });

    const unsubscribeOrchestrator = aiOrchestratorService.subscribe(status => {
      setOrchestratorStatus(status);
    });

    return () => {
      clearInterval(interval);
      sub.unsubscribe();
      unsubscribeOrchestrator();
    };
  }, []);

  const getStatusColor = () => {
    if (status.isReady) return 'text-emerald-700 bg-emerald-100 border-emerald-300';
    if (status.isInitializing) return 'text-primary bg-sky-100 border-primary/30';
    return 'text-muted-foreground bg-muted border-border';
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
        <div className="fixed top-0 left-0 w-full z-50 h-1 bg-card">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${orchestratorStatus.progress}%` }}
          />
          <div className="absolute top-2 left-4 text-[10px] font-bold text-primary bg-card border border-border px-2 py-1 rounded shadow-lg">
            Pipeline IA: {orchestratorStatus.progress}% - {orchestratorStatus.currentTask}
          </div>
        </div>
      )}
      <div className="fixed bottom-24 md:bottom-6 right-4 sm:right-6 z-40">
        <motion.div 
          layout
          className={`flex flex-col items-end gap-2`}
        >
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
                className="bg-card border border-border rounded-xl p-4 shadow-2xl w-64 mb-2"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${status.isReady ? 'bg-brand-accent/10 text-primary' : 'bg-primary text-primary'}`}>
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Motor de IA Local</h4>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      {status.isReady ? 'Activo y Listo' : status.isInitializing ? 'Inicializando...' : 'En Espera (Diferido)'}
                    </p>
                  </div>
                </div>

                {status.isInitializing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span className="truncate max-w-[180px]">{status.lastProgress.text}</span>
                      <span>{Math.round(status.lastProgress.progress)}%</span>
                    </div>
                    <div className="h-1 w-full bg-background rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${status.lastProgress.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {orchestratorStatus.isRunning && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-border">
                    <div className="flex justify-between text-[10px] uppercase tracking-wider text-primary font-bold">
                      <span>Pipeline IA</span>
                      <span>{orchestratorStatus.progress}%</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">{orchestratorStatus.currentTask}</div>
                    <div className="h-1 w-full bg-background rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${orchestratorStatus.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {status.isReady && !orchestratorStatus.isRunning && (
                  <div className="space-y-3">
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                      Motor: <span className="text-foreground font-medium">{status.engine}</span>
                    </div>
                    
                    {currentProduct && (
                      <div className="p-2.5 bg-card rounded-lg border border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="w-3 h-3 text-primary animate-pulse" />
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Analizando Sinergia</span>
                        </div>
                        <p className="text-xs text-primary font-medium truncate" title={currentProduct}>
                          {currentProduct}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-1.5">
                                <Thermometer className={`w-3 h-3 ${getThermalColor()}`} />
                                <span className="text-[11px] font-bold text-muted-foreground">Salud Térmica</span>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">{orchestratorStatus.deviceTier}</span>
                        </div>
                        <div className="h-1.5 w-full bg-card rounded-full overflow-hidden">
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
                        <p className="text-[9px] text-muted-foreground mt-1.5 italic">
                            {orchestratorStatus.thermalStress > 100 ? 'Ralentizando para proteger CPU...' : 'Temperatura estable.'}
                        </p>
                    </div>
                  </div>
                )}

                {!status.isReady && !status.isInitializing && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    El motor se activará automáticamente en segundo plano para procesar datos.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-colors shadow-md ${getStatusColor()}`}
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
