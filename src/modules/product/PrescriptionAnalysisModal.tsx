import React, { useState, useEffect } from 'react';
import { Product } from '../../core/types/product.types';
import { ClinicalAssistant } from '../assistant/ClinicalAssistant';
import { X, AlertTriangle, Pill, ShieldAlert, Loader2, CheckCircle2, Info, AlertCircle, Sparkles } from 'lucide-react';
import { formatArrayToString } from '../../utils/formatters';
import { geminiService } from '../../services/GeminiService';
import { ollamaService } from '../../services/OllamaService';

interface PrescriptionAnalysisModalProps {
  products: Product[];
  onClose: () => void;
}

export const PrescriptionAnalysisModal: React.FC<PrescriptionAnalysisModalProps> = ({ products, onClose }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState<{
    riesgo_total: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
    interacciones: {
      productos: string[];
      gravedad: 'LEVE' | 'MODERADA' | 'GRAVE';
      descripcion: string;
      recomendacion: string;
    }[];
    resumen_clinico: string;
  } | null>(null);

  useEffect(() => {
    const runAnalysis = async () => {
      setIsAnalyzing(true);
      try {
        let result;
        const isOllamaAvailable = await ollamaService.isAvailable();
        
        if (isOllamaAvailable) {
          console.log('[PrescriptionAnalysis] Usando Ollama para análisis...');
          try {
            result = await ollamaService.analyzeInteractions(products);
          } catch (e) {
            console.warn('[PrescriptionAnalysis] Fallo Ollama, intentando Gemini...');
          }
        }

        if (!result) {
          result = await geminiService.analyzeInteractions(products);
        }
        
        setAnalysis(result);
      } catch (error) {
        console.error("Error en auto-análisis:", error);
      } finally {
        setIsAnalyzing(false);
      }
    };
    runAnalysis();
  }, [products]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'BAJO': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'MEDIO': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'ALTO': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'CRITICO': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LEVE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'MODERADA': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'GRAVE': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end p-2 md:p-4 bg-brand-bg/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-brand-surface w-full h-full rounded-[2rem] shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col md:flex-row overflow-hidden border border-slate-800">
        
        {/* Columna Izquierda: Lista de Medicamentos */}
        <div className="w-full md:w-1/3 p-6 md:p-10 overflow-y-auto border-r border-slate-800 bg-brand-bg/50 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-brand-primary" />
                Análisis Cruzado
              </h2>
              <p className="clinical-label mt-2">
                {products.length} productos en comparativa
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-3 rounded-xl bg-brand-surface hover:bg-slate-700 text-slate-400 transition-all border border-slate-700 md:hidden"
            >
              <X className="w-8 h-8" />
            </button>
          </div>

          <div className="space-y-4">
            {products.map(product => (
              <div key={product.sku} className="bg-brand-surface p-5 rounded-3xl border border-slate-800 shadow-sm hover:shadow-lg transition-all border-l-4 border-l-brand-primary/40 group">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary mt-1 group-hover:scale-110 transition-transform">
                    <Pill className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-extrabold text-white truncate leading-tight">{product.nombre_comercial}</h4>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-0.5">{formatArrayToString(product.principios_activos, ', ')}</p>
                    
                    {product.advertencias && (
                      <div className="mt-4 flex items-start gap-2.5 text-amber-400 bg-amber-400/5 p-3 rounded-2xl text-[11px] border border-amber-400/10 font-medium">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="leading-relaxed italic">{product.advertencias}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Reporte de IA e Interacciones */}
        <div className="w-full md:w-2/3 bg-brand-bg p-6 md:p-12 flex flex-col relative overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <button 
            onClick={onClose}
            className="absolute top-10 right-10 p-3 rounded-xl bg-brand-surface hover:bg-slate-700 text-slate-400 transition-all border border-slate-700 hidden md:flex items-center justify-center z-10"
            title="Cerrar análisis"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="mb-10 pr-16 relative">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-primary/5 blur-[100px] rounded-full pointer-events-none" />
            <h3 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3 relative z-10">
              <Sparkles className="w-8 h-8 text-brand-primary" />
              Reporte de Seguridad IA
            </h3>
            <p className="text-lg text-slate-500 font-medium relative z-10">Análisis exhaustivo de riesgos e interacciones bioquímicas.</p>
          </div>
          
          <div className="flex-1 space-y-10 relative z-10">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-[15vh] text-slate-500">
                <Loader2 className="w-16 h-16 animate-spin mb-8 text-brand-primary opacity-50" />
                <p className="text-2xl font-extrabold text-white animate-pulse tracking-tight">Cruciando datos bioquímicos...</p>
                <p className="text-base mt-2 font-medium">El motor local está evaluando incompatibilidades.</p>
              </div>
            ) : analysis ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {/* Resumen y Riesgo */}
                <div className={`p-10 rounded-[2.5rem] border-2 flex flex-col md:flex-row gap-10 items-center overflow-hidden relative ${getRiskColor(analysis.riesgo_total)}`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-5 blur-3xl -mr-16 -mt-16" />
                  <div className="text-center md:text-left flex-shrink-0">
                    <h4 className="clinical-label mb-2">Riesgo Combinado</h4>
                    <div className="text-6xl font-black tracking-tighter uppercase">{analysis.riesgo_total}</div>
                  </div>
                  <div className="flex-1 text-white font-serif italic text-2xl leading-tight border-l border-white/10 md:pl-10">
                    "{analysis.resumen_clinico}"
                  </div>
                </div>

                {/* Interacciones Detalladas */}
                {analysis.interacciones.length > 0 ? (
                  <section className="space-y-8">
                    <h3 className="clinical-label flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Conflictos Específicos Identificados
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      {analysis.interacciones.map((inter, idx) => (
                        <div key={idx} className="glass-panel rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex flex-wrap gap-2">
                              {inter.productos.map(p => (
                                <span key={p} className="px-3 py-1 bg-brand-bg border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary/80">
                                  {p}
                                </span>
                              ))}
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${getSeverityColor(inter.gravedad)}`}>
                              {inter.gravedad}
                            </span>
                          </div>
                          <p className="text-xl font-bold text-white leading-snug relative z-10">{inter.descripcion}</p>
                          <div className="bg-brand-bg/50 p-6 rounded-2xl border border-slate-800/50 flex items-start gap-4 relative z-10">
                            <CheckCircle2 className="w-6 h-6 text-brand-accent shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-300 leading-relaxed font-bold">
                              <span className="clinical-label block mb-1">Acción Clínica Recomendada</span> {inter.recomendacion}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : (
                  <div className="glass-panel p-16 rounded-[3rem] text-center space-y-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-brand-accent/5 blur-3xl rounded-full" />
                    <div className="w-20 h-20 bg-brand-accent text-brand-bg rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-accent/20 relative z-10 rotate-3 animate-pulse">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-white relative z-10">Ecosistema Seguro</h3>
                    <p className="text-slate-400 text-lg max-w-md mx-auto relative z-10 font-medium italic">No se han detectado incompatibilidades bioquímicas significativas en esta combinación.</p>
                  </div>
                )}

                {/* Chat de seguimiento (Opcional) */}
                <section className="pt-16 border-t border-slate-800">
                  <div className="mb-10">
                    <h3 className="text-2xl font-extrabold text-white mb-2">Consulta Especializada</h3>
                    <p className="text-slate-500 font-medium italic">Inicia un diálogo con el Asistente Clínico para desglosar este reporte.</p>
                  </div>
                  <div className="h-[500px] glass-panel rounded-[2.5rem] overflow-hidden">
                    <ClinicalAssistant contextProducts={products} />
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  );
};
