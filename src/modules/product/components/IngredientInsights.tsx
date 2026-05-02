import React, { useState, useEffect } from 'react';
import { Product } from '../../../core/types/product.types';
import { aiService } from '../../../services/AIService';
import { Beaker, Sparkles, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IngredientInsightsProps {
  product: Product;
}

export const IngredientInsights: React.FC<IngredientInsightsProps> = ({ product }) => {
  const [insights, setInsights] = useState<Record<string, string>>(product.anotaciones_componentes || {});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      // Si ya tenemos anotaciones o no hay ingredientes, no hacemos nada
      if (Object.keys(insights).length > 0 || !product.principios_activos || product.principios_activos.length === 0) {
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await aiService.explainIngredients(product.nombre_comercial, product.principios_activos);
        if (result && Object.keys(result).length > 0) {
          setInsights(result);
          // Opcional: Podríamos persistir esto en el estado global o DB local aquí
        } else {
          setError("No se pudo obtener información detallada.");
        }
      } catch (err) {
        console.error("Error fetching ingredient insights:", err);
        setError("Error de conexión con el motor de IA.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [product.sku, product.principios_activos, product.nombre_comercial]);

  if (product.principios_activos.length === 0) return null;

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Beaker className="w-4 h-4 text-brand-primary" />
          Análisis de Componentes
        </h3>
        {isLoading && (
          <div className="flex items-center gap-2 text-[10px] text-brand-primary font-bold animate-pulse">
            <Sparkles className="w-3 h-3" />
            ANALIZANDO...
          </div>
        )}
      </div>

      <div className="space-y-3">
        {isLoading && Object.keys(insights).length === 0 ? (
          <div className="space-y-2">
             {[1, 2].map(i => (
               <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
             ))}
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center justify-center">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        ) : (
          Object.entries(insights).map(([ingredient, explanation], index) => {
            const isMain = explanation.includes('(PA)');
            const cleanExplanation = explanation.replace('(PA)', '').trim();

            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={ingredient} 
                className={`p-3 rounded-xl border transition-all ${
                  isMain 
                    ? 'bg-brand-primary/10 border-brand-primary/20 shadow-lg shadow-brand-primary/5' 
                    : 'bg-white/[0.03] border-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                     <span className={`text-[11px] font-black uppercase tracking-wider ${isMain ? 'text-brand-primary' : 'text-slate-300'}`}>
                       {ingredient}
                     </span>
                     {isMain && (
                       <span className="text-[7px] font-black bg-brand-primary text-slate-950 px-1 py-0.5 rounded uppercase">
                         Principio Activo
                       </span>
                     )}
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${isMain ? 'text-brand-primary' : 'text-slate-700'}`} />
                </div>
                <p className={`text-[11px] leading-relaxed ${isMain ? 'text-white' : 'text-slate-400'} font-medium`}>
                  {cleanExplanation}
                </p>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="mt-4 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-400 leading-normal italic">
          Esta información es generada por IA para el apoyo en la educación al paciente sobre el mecanismo de acción de los componentes. Siempre verifique con la literatura oficial.
        </p>
      </div>
    </div>
  );
};
