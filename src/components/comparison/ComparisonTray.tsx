import React, { useState } from 'react';
import { useComparison } from '../../context/ComparisonContext';
import { ArrowLeftRight, X, Trash2 } from 'lucide-react';
import { ComparisonModal } from '../comparison/ComparisonModal';
import { motion, AnimatePresence } from 'motion/react';

export const ComparisonTray: React.FC = () => {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (comparisonList.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-2">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="bg-brand-surface border border-slate-700 rounded-2xl px-5 py-2.5 shadow-xl flex items-center gap-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              {comparisonList.map((p) => (
                <div 
                  key={p.sku} 
                  className="w-10 h-10 rounded-full bg-slate-800 border-2 border-brand-surface flex items-center justify-center text-[10px] font-bold text-slate-300 overflow-hidden"
                  title={p.nombre_comercial}
                >
                  {p.nombre_comercial.substring(0, 2).toUpperCase()}
                </div>
              ))}
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {comparisonList.length} {comparisonList.length === 1 ? 'Producto' : 'Productos'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearComparison}
              className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all"
              title="Limpiar comparación"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 rounded-full bg-brand-primary hover:bg-brand-primary/80 text-white text-xs font-bold transition-all shadow-lg shadow-brand-primary/20 flex items-center gap-2"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Comparar
            </button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <ComparisonModal 
            products={comparisonList}
            onClose={() => setIsModalOpen(false)}
            onRemove={removeFromComparison}
          />
        )}
      </AnimatePresence>
    </>
  );
};
