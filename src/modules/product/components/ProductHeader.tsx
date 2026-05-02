import React from 'react';
import { Badge } from '../../../components/ui/badge';
import { Activity } from 'lucide-react';
import { Product } from '../../../core/types/product.types';
import { formatArrayToString } from '../../../utils/formatters';
import { HighlightText } from '../../../components/ui/HighlightText';

interface ProductHeaderProps {
  product: Product;
  onTagClick?: (tag: string) => void;
  searchTerm?: string;
  actions?: React.ReactNode;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({ product, onTagClick, searchTerm = '', actions }) => {
  return (
    <div className="bg-brand-surface border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 mb-4 sm:mb-6 relative overflow-hidden shadow-lg">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Badge variant="outline" className="bg-brand-bg text-slate-400 border-slate-700 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs tracking-wider font-mono">
              {product.sku}
            </Badge>
            {product.categoria_principal && product.categoria_principal !== 'Otro' && (
              <Badge 
                variant="outline" 
                className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs tracking-wider font-bold uppercase cursor-pointer hover:bg-indigo-500/20 transition-colors"
                onClick={() => onTagClick?.(product.categoria_principal)}
              >
                {product.categoria_principal}
              </Badge>
            )}
            {Array.isArray(product.tags_ia) && product.tags_ia.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {product.tags_ia.slice(0, 3).map(tag => (
                  <button 
                    key={tag} 
                    onClick={() => onTagClick?.(tag)}
                    className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-brand-primary/10 text-brand-primary rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border border-brand-primary/20 hover:bg-brand-primary/20 transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4 sm:mb-6">
            <HighlightText text={product.nombre_comercial} searchTerm={searchTerm} />
          </h2>
          
          <div className="flex flex-wrap gap-2">
            {(Array.isArray(product.principios_activos) ? product.principios_activos : []).map((principio, idx) => {
              const annotation = product.anotaciones_componentes?.[principio];
              return (
                <div key={idx} className="relative group">
                  <button
                    onClick={() => onTagClick?.(principio)}
                    className="inline-flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/20 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl hover:bg-brand-primary/20 transition-all group-hover:ring-2 ring-brand-primary/30"
                  >
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary group-hover:scale-110 transition-transform" />
                    <span className="text-xs sm:text-base text-brand-primary font-bold whitespace-nowrap">
                      <HighlightText text={principio} searchTerm={searchTerm} />
                    </span>
                  </button>
                  {annotation && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 pointer-events-none transition-all z-50">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Activity className="w-3.5 h-3.5 text-brand-primary" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Anotación Médica</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {annotation}
                      </p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-3 h-3 bg-slate-800 border-r border-b border-slate-700 rotate-45 transform origin-center" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {actions && (
          <div className="shrink-0 pt-2 lg:pt-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
