import React, { useState, useEffect } from 'react';
import { FileText, ArrowRight, Loader2, CheckCircle, AlertCircle, Save, Sparkles, Copy, Trash2, Globe, Link } from 'lucide-react';
import { AIService } from '../../services/AIService';
import { Product } from '../../core/types/product.types';
import { getDB } from '../../core/database/db';
import { useHardwareDetection } from '../../hooks/useHardwareDetection';
import { formatArrayToString } from '../../utils/formatters';

export const AIImporter: React.FC = () => {
  const { hardware } = useHardwareDetection();
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [result, setResult] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ text: string; progress: number }>({ text: '', progress: 0 });

  useEffect(() => {
    if (hardware) {
      AIService.configure(hardware);
    }
  }, [hardware]);

  const handleScrape = async () => {
    if (!inputUrl.trim()) return;
    
    setIsScraping(true);
    setError(null);
    setInputText(''); // Clear previous text
    
    try {
      const response = await fetch(`/api/scrape?url=${encodeURIComponent(inputUrl)}`);
      const data = await response.json();
      
      if (data.success) {
        setInputText(data.text); // Populate textarea with scraped content
      } else {
        throw new Error(data.error || 'Error al extraer contenido de la URL.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor de scraping.');
    } finally {
      setIsScraping(false);
    }
  };

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    setResult(null);
    setIsSaved(false);

    try {
      // 1. Asegurar que el motor esté encendido
      setAiStatus({ text: 'Iniciando motor de IA...', progress: 0 });
      
      AIService.setProgressCallback((text, progress) => {
        setAiStatus({ text, progress });
      });

      await AIService.startEngine();

      // 2. Procesar el texto
      setAiStatus({ text: 'Analizando y estructurando datos...', progress: 50 });
      
      // Usar la URL original si existe, o una genérica
      const sourceUrl = inputUrl || "importacion_manual_" + Date.now();
      
      const product = await AIService.extractProductData(inputText, sourceUrl);
      
      if (product) {
        setResult(product);
      } else {
        throw new Error('La IA no pudo estructurar la información. Intente con un texto más claro.');
      }

    } catch (err: any) {
      setError(err.message || 'Error desconocido durante el procesamiento.');
    } finally {
      setIsProcessing(false);
      setAiStatus({ text: '', progress: 0 });
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      const db = await getDB();
      await db.put('products', result);
      setIsSaved(true);
      // Reset after delay
      setTimeout(() => {
        setInputText('');
        setResult(null);
        setIsSaved(false);
      }, 2000);
    } catch (e) {
      alert('Error guardando en base de datos');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4">
          <Sparkles className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-3xl font-bold text-white">Importador Inteligente</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Copia el texto de cualquier vademécum online, PDF o prospecto y pégalo aquí. 
          La IA local estructurará la información automáticamente.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna Izquierda: Input */}
        <div className="space-y-4">
          
          {/* URL Input Section */}
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Importar desde URL (Opcional)
            </label>
            <div className="flex gap-2">
              <input 
                type="url" 
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://vademecum.es/medicamento..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button 
                onClick={handleScrape}
                disabled={isScraping || !inputUrl}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                Extraer
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-1 border border-slate-800 focus-within:border-indigo-500/50 transition-colors relative">
            <div className="absolute top-3 right-3 z-10">
                <span className="text-xs text-slate-500 bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                    {inputText.length} caracteres
                </span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="O pega aquí el texto del medicamento...
Ejemplo:
Paracetamol 500mg
Indicaciones: Dolor leve a moderado, fiebre.
Posología: 1 comprimido cada 8 horas.
Contraindicaciones: Hipersensibilidad..."
              className="w-full h-[400px] bg-slate-950/50 text-slate-300 p-4 rounded-xl resize-none focus:outline-none placeholder:text-slate-600 font-mono text-sm"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleProcess}
              disabled={isProcessing || !inputText.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {aiStatus.text || 'Procesando...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analizar con IA
                </>
              )}
            </button>
          </div>
        </div>

        {/* Columna Derecha: Resultado */}
        <div className="space-y-4">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!result && !error && (
            <div className="h-[400px] border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-600 p-8 text-center">
              <FileText className="w-12 h-12 mb-4 opacity-50" />
              <p>El resultado estructurado aparecerá aquí</p>
            </div>
          )}

          {result && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col h-[400px]">
              <div className="p-4 border-b border-slate-800 bg-slate-950/30 flex justify-between items-center">
                <h3 className="font-bold text-white truncate">{result.nombre_comercial}</h3>
                <span className="text-xs px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-md font-mono">
                  {result.sku}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm text-slate-300">
                <div>
                  <span className="text-slate-500 text-xs uppercase tracking-wider font-bold">Principios Activos</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(Array.isArray(result.principios_activos) ? result.principios_activos : []).map((pa, i) => {
                      if (!pa) return null;
                      const text = typeof pa === 'object' ? ((pa as any).nombre || (pa as any).tipo || JSON.stringify(pa)) : String(pa);
                      return <span key={i} className="px-2 py-1 bg-slate-800 rounded text-xs">{text}</span>;
                    })}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 text-xs uppercase tracking-wider font-bold">Indicaciones</span>
                  <ul className="list-disc list-inside mt-1 text-slate-300 space-y-1">
                    {(Array.isArray(result.indicaciones) ? result.indicaciones : []).map((ind, i) => {
                      if (!ind) return null;
                      const text = typeof ind === 'object' ? ((ind as any).nombre || (ind as any).tipo || (ind as any).indicacion || JSON.stringify(ind)) : String(ind);
                      return <li key={i}>{text}</li>;
                    })}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-slate-500 text-xs uppercase tracking-wider font-bold">Embarazo</span>
                        <p className={`mt-1 font-medium ${
                            result.apto_embarazo === 'SI' ? 'text-emerald-400' : 
                            result.apto_embarazo === 'NO' ? 'text-red-400' : 'text-amber-400'
                        }`}>{result.apto_embarazo}</p>
                    </div>
                    <div>
                        <span className="text-slate-500 text-xs uppercase tracking-wider font-bold">Lactancia</span>
                        <p className={`mt-1 font-medium ${
                            result.apto_lactancia === 'SI' ? 'text-emerald-400' : 
                            result.apto_lactancia === 'NO' ? 'text-red-400' : 'text-amber-400'
                        }`}>{result.apto_lactancia}</p>
                    </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex justify-end gap-3">
                <button
                  onClick={() => setResult(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaved}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-all ${
                    isSaved 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Guardado
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Guardar en Base de Datos
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
