import React from 'react';
import { Info, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Product } from '../../../core/types/product.types';
import { ProductSafetyProfile } from './ProductSafetyProfile';
import { HighlightText } from '../../../components/ui/HighlightText';

interface ProductBentoGridProps {
  product: Product;
  searchTerm?: string;
}

export const ProductBentoGrid: React.FC<ProductBentoGridProps> = ({ product, searchTerm = '' }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      
      {/* Descripción */}
      <div className="col-span-1 md:col-span-2 bg-brand-surface border border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
          <Info className="w-4 h-4" /> Descripción
        </h3>
        <p className="text-slate-300 leading-relaxed text-base md:text-lg">
          <HighlightText text={product.descripcion} searchTerm={searchTerm} />
        </p>
      </div>

      {/* Análisis de Componentes */}
      {product.analisis_componentes && (
        <div className="col-span-1 md:col-span-2 bg-brand-surface border border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-indigo-400" /> Análisis de Componentes
          </h3>
          <div className="text-slate-300 leading-relaxed text-sm md:text-base whitespace-pre-wrap">
            <HighlightText text={product.analisis_componentes} searchTerm={searchTerm} />
          </div>
        </div>
      )}

      {/* Indicaciones */}
      <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-5">
          <CheckCircle2 className="w-4 h-4 text-brand-accent" /> Indicaciones
        </h3>
        <ul className="space-y-3">
          {(Array.isArray(product.indicaciones) ? product.indicaciones : []).map((ind, i) => {
            if (!ind) return null;
            const text = typeof ind === 'object' ? ((ind as any).nombre || (ind as any).tipo || (ind as any).indicacion || JSON.stringify(ind)) : String(ind);
            return (
              <li key={i} className="flex items-start gap-3 text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-2 shrink-0" />
                <span className="text-sm font-medium leading-relaxed">
                  <HighlightText text={text} searchTerm={searchTerm} />
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Posología */}
      <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-5">
          Posología
        </h3>
        <p className="text-slate-300 text-sm leading-relaxed font-medium">
          <HighlightText text={product.posologia} searchTerm={searchTerm} />
        </p>
      </div>

      {/* Advertencias */}
      <div className="col-span-1 md:col-span-2 bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 md:p-8 shadow-sm">
        <h3 className="text-xs font-bold text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4" /> Advertencias Críticas
        </h3>
        <p className="text-amber-200/90 leading-relaxed text-sm md:text-base font-medium">
          <HighlightText text={product.advertencias} searchTerm={searchTerm} />
        </p>
      </div>

      {/* Perfil de Seguridad */}
      <ProductSafetyProfile product={product} />
    </div>
  );
};
