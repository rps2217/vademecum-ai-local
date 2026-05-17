import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { aiService } from '../../../services/AIService';
import { Product } from '../../../core/types/product.types';
import ReactMarkdown from 'react-markdown';

interface AIAnalysisModalProps {
  query: string;
  results: Product[];
  onClose: () => void;
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({ query, results, onClose }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Si hay resultados, usarlos como contexto. Si no, intentar análisis general.
        const contextProducts = results.length > 0 ? results.slice(0, 5) : [];
        const result = await aiService.analyze(query, contextProducts);
        setAnalysis(result);
      } catch (err: any) {
        setError(err.message || 'Error al procesar la consulta.');
      } finally {
        setIsLoading(false);
      }
    };

    runAnalysis();
  }, [query, results]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-card rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-6 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Análisis Clínico IA</h3>
              <p className="text-xs text-muted-foreground">Procesando consulta semántica...</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-card rounded-xl transition-colors text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="mb-6 p-4 bg-muted rounded-2xl border border-border">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Tu Consulta</span>
            </div>
            <p className="text-foreground font-medium">{query}</p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-sm animate-pulse">Consultando base de conocimientos local...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex gap-3 text-rose-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <div className="prose prose-slate prose-sm max-w-none">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="p-4 bg-card border-t border-border flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            {results.length > 0 
              ? `Análisis basado en ${Math.min(results.length, 5)} resultados encontrados.` 
              : 'Análisis general basado en base de datos local.'}
          </p>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-card hover:bg-slate-700 text-foreground rounded-xl text-sm font-bold transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
