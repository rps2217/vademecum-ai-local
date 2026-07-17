import { logger } from '../../services/LoggerService';
import React, { useState } from 'react';
import { useConsultation } from '../../context/ConsultationContext';
import { 
  Brain, 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  ChevronUp, 
  ChevronDown,
  Loader2,
  Sparkles,
  CheckCircle2,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '../../services/GeminiService';
import { configService } from '../../services/ConfigService';

export const ClinicalBrainTray: React.FC = () => {
  const { selectedProducts, removeFromConsultation, clearConsultation } = useConsultation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (selectedProducts.length === 0) return null;

  const handleAnalyze = async () => {
    const config = configService.getConfig();
    if (!config.enableAIInteractions) {
      alert('El Cerebro Clínico (IA) está desactivado. Actívalo en Configuración.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await geminiService.analyzeInteractions(selectedProducts);
      setAnalysis(result);
      setIsExpanded(true);
    } catch (err: any) {
      setError('Error al analizar interacciones. Intenta de nuevo.');
      logger.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed bottom-24 md:bottom-24 right-4 sm:right-6 z-40 w-[calc(100%-2rem)] sm:w-96">
      <AnimatePresence>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-200 rounded-lg">
                <Brain className="w-4 h-4 text-rose-600" />
              </div>
              <span className="text-xs font-bold text-rose-900 uppercase tracking-widest">Cerebro Clínico</span>
              <span className="px-2 py-0.5 bg-white border border-rose-200 rounded-full text-[10px] font-bold text-rose-700">
                {selectedProducts.length}/5
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:bg-card rounded-lg text-muted-foreground transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
              <button 
                onClick={clearConsultation}
                className="p-1.5 hover:bg-rose-500/20 rounded-lg text-muted-foreground hover:text-rose-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Selected Products List */}
          <div className="p-4 space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {selectedProducts.map(product => (
              <div key={product.sku} className="flex items-center justify-between p-2 bg-card rounded-xl border border-border group">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-foreground truncate max-w-[180px]">{product.nombre_comercial}</span>
                  <span className="text-[8px] text-muted-foreground uppercase tracking-tighter">{product.sku}</span>
                </div>
                <button 
                  onClick={() => removeFromConsultation(product.sku)}
                  className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-400 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Analysis Section */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="border-t border-border bg-slate-50"
              >
                <div className="p-4 space-y-4">
                  {isAnalyzing ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Consultando base de datos clínica...</p>
                    </div>
                  ) : analysis ? (
                    <div className="space-y-4 animate-in fade-in duration-500">
                      {/* Risk Level */}
                      <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
                        analysis.riesgo_total === 'CRITICO' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                        analysis.riesgo_total === 'ALTO' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                        analysis.riesgo_total === 'MEDIO' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}>
                        <ShieldAlert className="w-5 h-5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest">Riesgo de Interacción</p>
                          <p className="text-sm font-bold">{analysis.riesgo_total}</p>
                        </div>
                      </div>

                      {/* Interactions List */}
                      <div className="space-y-3">
                        {analysis.interacciones.map((int: any, i: number) => (
                          <div key={i} className="p-3 bg-card rounded-2xl border border-border space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex gap-1">
                                {int.productos.map((p: string, j: number) => (
                                  <span key={j} className="text-[8px] font-bold bg-slate-700 px-1.5 py-0.5 rounded text-muted-foreground">{p}</span>
                                ))}
                              </div>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                int.gravedad === 'GRAVE' ? 'bg-rose-500/20 text-rose-400' :
                                int.gravedad === 'MODERADA' ? 'bg-orange-500/20 text-orange-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>{int.gravedad}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">{int.descripcion}</p>
                            <div className="flex gap-2 p-2 bg-card rounded-xl border border-border">
                              <Info className="w-3 h-3 text-primary shrink-0" />
                              <p className="text-[9px] text-muted-foreground italic">{int.recomendacion}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="p-3 bg-primary rounded-2xl border border-primary/50">
                        <p className="text-[10px] font-bold text-primary mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Resumen Clínico
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{analysis.resumen_clinico}</p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="py-4 text-center space-y-2">
                      <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
                      <p className="text-xs text-rose-400 font-medium">{error}</p>
                      <button 
                        onClick={handleAnalyze}
                        className="text-[10px] font-bold text-primary uppercase underline"
                      >
                        Reintentar
                      </button>
                    </div>
                  ) : (
                    <div className="py-4 text-center space-y-4">
                      <div className="p-3 bg-card rounded-2xl border border-border">
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          Selecciona hasta 5 productos para analizar posibles interacciones medicamentosas.
                        </p>
                      </div>
                      <button 
                        onClick={handleAnalyze}
                        disabled={selectedProducts.length < 2}
                        className="w-full py-3 bg-rose-500 text-foreground rounded-2xl font-bold text-xs shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2"
                      >
                        <Brain className="w-4 h-4" />
                        Analizar Interacciones
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Info */}
          {!isExpanded && !analysis && (
            <div className="p-3 bg-slate-50 flex items-center justify-center gap-2 border-t border-border">
              <button 
                onClick={handleAnalyze}
                disabled={selectedProducts.length < 2}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 disabled:opacity-30 transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Analizar ahora
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
