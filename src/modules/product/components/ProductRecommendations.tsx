import React, { useMemo } from 'react';
import { Product } from '../../../core/types';
import { searchService } from '../../../services/SearchService';
import { Sparkles, ArrowRightLeft, Plus, ChevronRight, Info } from 'lucide-react';

interface ProductRecommendationsProps {
  product: Product;
  onProductClick: (product: Product) => void;
}

export const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({ product, onProductClick }) => {
  const allProducts = searchService.getAllIndexedProducts();

  // 1. Encontrar Sustitutos (Misma Molécula)
  const substitutes = useMemo(() => {
    if (!product.principios_activos || product.principios_activos.length === 0) return [];
    
    return allProducts.filter(p => 
      p.sku !== product.sku && 
      p.principios_activos?.some(m => product.principios_activos.includes(m))
    ).slice(0, 3);
  }, [product, allProducts]);

  // 2. Encontrar Complementos (Cruzar SKUs relacionados)
  const complements = useMemo(() => {
    if (!product.skus_relacionados || product.skus_relacionados.length === 0) return [];
    
    return allProducts.filter(p => 
      product.skus_relacionados.includes(p.sku)
    ).slice(0, 3);
  }, [product, allProducts]);

  if (substitutes.length === 0 && complements.length === 0 && !product.sugerencia_complementaria) {
    return null;
  }

  return (
    <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Sección de Sustitución Inteligente */}
      {substitutes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-200">Alternativas Disponibles</h4>
            <span className="text-[10px] text-slate-500 font-medium">(Mismo Principio Activo)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {substitutes.map(sub => (
              <button
                key={sub.sku}
                onClick={() => onProductClick(sub)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-white/10 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <ArrowRightLeft className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{sub.nombre_comercial}</p>
                  <p className="text-[10px] text-slate-500 truncate">{sub.principios_activos[0]}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sección de Venta Cruzada (Upselling) */}
      {(complements.length > 0 || product.sugerencia_complementaria) && (
        <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-brand-primary/20 via-indigo-500/5 to-transparent border border-brand-primary/20 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
            <Sparkles className="w-32 h-32 text-brand-primary" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-brand-primary" />
              <h4 className="text-sm font-black uppercase tracking-widest text-white">Plan de Venta Sugerida</h4>
            </div>

            {product.sugerencia_complementaria && (
              <div className="mb-6 p-4 rounded-2xl bg-slate-900/50 border border-white/5 flex items-start gap-3">
                <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed font-medium italic">
                   "{product.sugerencia_complementaria}"
                </p>
              </div>
            )}

            {complements.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Acompañantes Ideales</p>
                {complements.map(comp => (
                  <button
                    key={comp.sku}
                    onClick={() => onProductClick(comp)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-primary/30 hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <Plus className="w-4 h-4 text-indigo-400" />
                      </div>
                      <span className="text-xs font-bold text-white">{comp.nombre_comercial}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-primary transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
