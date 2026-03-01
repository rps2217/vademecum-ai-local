import React, { useState, useEffect } from 'react';
import { Product } from '../../core/types/product.types';
import { ClinicalAssistant } from '../assistant/ClinicalAssistant';
import { X, AlertTriangle, Pill, ShieldAlert, Loader2, CheckCircle2, Info, AlertCircle, Sparkles } from 'lucide-react';
import { formatArrayToString } from '../../utils/formatters';
import { GeminiService } from '../../services/GeminiService';
import { OllamaService } from '../../services/OllamaService';

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
        const isOllamaAvailable = await OllamaService.isAvailable();
        
        if (isOllamaAvailable) {
          console.log('[PrescriptionAnalysis] Usando Ollama para análisis...');
          try {
            result = await OllamaService.analyzeInteractions(products);
          } catch (e) {
            console.warn('[PrescriptionAnalysis] Fallo Ollama, intentando Gemini...');
          }
        }

        if (!result) {
          result = await GeminiService.analyzeInteractions(products);
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
      case 'BAJO': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'MEDIO': return 'text-amber-500 bg-amber-50 border-amber-100';
      case 'ALTO': return 'text-orange-500 bg-orange-50 border-orange-100';
      case 'CRITICO': return 'text-red-500 bg-red-50 border-red-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LEVE': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'MODERADA': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'GRAVE': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end p-2 md:p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full h-full rounded-[2rem] shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col md:flex-row overflow-hidden border border-slate-200">
        
        {/* Columna Izquierda: Lista de Medicamentos */}
        <div className="w-full md:w-1/3 p-6 md:p-10 overflow-y-auto border-r border-slate-100 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-indigo-600" />
                Análisis Cruzado
              </h2>
              <p className="text-base text-slate-500 mt-2">
                {products.length} medicamentos seleccionados
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-3 rounded-xl bg-white hover:bg-slate-100 text-slate-500 transition-all border border-slate-200 md:hidden"
            >
              <X className="w-8 h-8" />
            </button>
          </div>

          <div className="space-y-6">
            {products.map(product => (
              <div key={product.sku} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-5">
                  <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 mt-1">
                    <Pill className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-slate-900 truncate">{product.nombre_comercial}</h4>
                    <p className="text-sm text-slate-500 mb-4">{formatArrayToString(product.principios_activos, ', ')}</p>
                    
                    {product.advertencias && (
                      <div className="flex items-start gap-3 text-amber-700 bg-amber-50 p-4 rounded-xl text-sm border border-amber-100">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{product.advertencias}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Reporte de IA e Interacciones */}
        <div className="w-full md:w-2/3 bg-white p-6 md:p-12 flex flex-col relative overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <button 
            onClick={onClose}
            className="absolute top-10 right-10 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-all border border-slate-200 hidden md:flex items-center justify-center z-10"
            title="Cerrar análisis"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="mb-10 pr-16">
            <h3 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-indigo-600" />
              Reporte de Seguridad IA
            </h3>
            <p className="text-lg text-slate-500">Análisis automático de riesgos e interacciones clínicas.</p>
          </div>
          
          <div className="flex-1 space-y-10">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-12 h-12 animate-spin mb-6 text-indigo-600" />
                <p className="text-xl font-medium animate-pulse">Analizando interacciones cruzadas...</p>
                <p className="text-sm mt-2">Esto puede tomar unos segundos</p>
              </div>
            ) : analysis ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Resumen y Riesgo */}
                <div className={`p-8 rounded-3xl border-2 flex flex-col md:flex-row gap-8 items-center ${getRiskColor(analysis.riesgo_total)}`}>
                  <div className="text-center md:text-left flex-1">
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-2 opacity-70">Riesgo Total de la Combinación</h4>
                    <div className="text-5xl font-black tracking-tighter">{analysis.riesgo_total}</div>
                  </div>
                  <div className="flex-1 text-slate-700 font-medium leading-relaxed italic text-lg">
                    "{analysis.resumen_clinico}"
                  </div>
                </div>

                {/* Interacciones Detalladas */}
                {analysis.interacciones.length > 0 ? (
                  <section className="space-y-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Interacciones Detectadas
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {analysis.interacciones.map((inter, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              {inter.productos.map(p => (
                                <span key={p} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
                                  {p}
                                </span>
                              ))}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getSeverityColor(inter.gravedad)}`}>
                              {inter.gravedad}
                            </span>
                          </div>
                          <p className="text-slate-700 font-medium">{inter.descripcion}</p>
                          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-600 leading-relaxed">
                              <span className="font-bold text-slate-900">Recomendación:</span> {inter.recomendacion}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : (
                  <div className="bg-emerald-50 p-10 rounded-3xl border border-emerald-100 text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-900">Sin Interacciones de Riesgo</h3>
                    <p className="text-emerald-700 max-w-md mx-auto">No se han detectado interacciones clínicas significativas entre los medicamentos seleccionados.</p>
                  </div>
                )}

                {/* Chat de seguimiento (Opcional) */}
                <section className="pt-10 border-t border-slate-100">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-1">¿Tienes más dudas?</h3>
                    <p className="text-sm text-slate-500">Puedes profundizar en el análisis con el Asistente Clínico.</p>
                  </div>
                  <div className="h-[400px]">
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
