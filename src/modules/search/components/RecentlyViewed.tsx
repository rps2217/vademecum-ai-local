import React, { useState, useEffect } from 'react';
import { Product } from '../../../core/types';
import { historyService } from '../../../services/HistoryService';
import { Clock, Trash2, ChevronRight, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RecentlyViewedProps {
  onProductClick: (product: Product) => void;
}

export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ onProductClick }) => {
  const [history, setHistory] = useState<Product[]>([]);

  useEffect(() => {
    const loadHistory = () => {
      setHistory(historyService.getRecent());
    };

    loadHistory();
    window.addEventListener('history_updated', loadHistory);
    return () => window.removeEventListener('history_updated', loadHistory);
  }, []);

  if (history.length === 0) return null;

  return (
    <div className="mt-8 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" /> Vistos Recientemente
        </h3>
        <button 
          onClick={() => historyService.clear()}
          className="text-[10px] font-bold text-muted-foreground hover:text-red-400 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3 h-3" /> Limpiar
        </button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <AnimatePresence mode="popLayout">
          {history.map((product, idx) => (
            <motion.button
              key={product.sku}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onProductClick(product)}
              className="flex flex-col text-left group transition-all"
            >
              <div className="bg-card border border-border rounded-xl p-3 hover:border-emerald-500/50 transition-colors h-full flex flex-col justify-between">
                <div>
                   <div className="flex items-center justify-between mb-2">
                      <span className="text-[8px] font-mono text-muted-foreground truncate mr-2">{product.sku}</span>
                      {product.is_verified && <Bookmark className="w-2.5 h-2.5 text-emerald-500" />}
                   </div>
                   <h4 className="text-[11px] font-bold text-foreground line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors">
                     {product.nombre_comercial}
                   </h4>
                </div>
                <div className="mt-2 flex items-center justify-between text-[8px] text-muted-foreground font-bold uppercase tracking-tighter">
                   <span>{product.categoria_principal || 'Producto'}</span>
                   <ChevronRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
