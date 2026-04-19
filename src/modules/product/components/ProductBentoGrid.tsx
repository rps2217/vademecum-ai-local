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
      <div className="col-span-1 md:col-span-2 glass-panel rounded-4xl p-6 md:p-8 shrink-0">
        <h3 className="clinical-label mb-4 flex items-center gap-2">
          <Info className="w-3.5 h-3.5" /> Ficha Técnica
        </h3>
        <p className="text-slate-200 leading-relaxed text-xs md:text-sm font-medium">
          <HighlightText text={product.descripcion} searchTerm={searchTerm} />
        </p>
      </div>

      {/* Análisis de Componentes */}
      {product.analisis_componentes && (
        <div className="col-span-1 md:col-span-2 glass-panel rounded-4xl p-6 md:p-8">
          <h3 className="clinical-label mb-4 flex items-center gap-2 text-indigo-400">
            <Cpu className="w-3.5 h-3.5" /> Análisis Bioquímico IA
          </h3>
          <div className="text-slate-300 leading-relaxed text-[10px] md:text-xs whitespace-pre-wrap font-mono bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50">
            <HighlightText text={product.analisis_componentes} searchTerm={searchTerm} />
          </div>
        </div>
      )}

      {/* Indicaciones */}
      <div className="glass-panel rounded-4xl p-6">
        <h3 className="clinical-label mb-5 flex items-center gap-2 text-brand-accent">
          <CheckCircle2 className="w-3.5 h-3.5" /> Indicaciones Terapéuticas
        </h3>
        <ul className="space-y-3">
          {(Array.isArray(product.indicaciones) ? product.indicaciones : []).map((ind, i) => {
            if (!ind) return null;
            const text = typeof ind === 'object' ? ((ind as any).nombre || (ind as any).tipo || (ind as any).indicacion || JSON.stringify(ind)) : String(ind);
            return (
              <li key={i} className="flex items-start gap-3 text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-2 shrink-0 shadow-[0_0_8px_rgba(155,236,200,0.4)]" />
                <span className="text-sm font-bold leading-relaxed">
                  <HighlightText text={text} searchTerm={searchTerm} />
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Posología */}
      <div className="glass-panel rounded-4xl p-6">
        <h3 className="clinical-label mb-5">
          Posología y Recomendación
        </h3>
        <div className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
          <p className="text-brand-primary/90 text-sm leading-relaxed font-bold">
            <HighlightText text={product.posologia} searchTerm={searchTerm} />
          </p>
        </div>
      </div>

      {/* Advertencias */}
      <div className="col-span-1 md:col-span-2 bg-rose-500/5 border border-rose-500/20 rounded-4xl p-6 md:p-8">
        <h3 className="clinical-label mb-4 flex items-center gap-2 text-rose-400">
          <AlertTriangle className="w-3.5 h-3.5" /> Contraindicaciones y Riesgos
        </h3>
        <p className="text-rose-200/90 leading-relaxed text-xs md:text-sm font-bold italic">
          <HighlightText text={product.advertencias} searchTerm={searchTerm} />
        </p>
      </div>

      {/* Perfil de Seguridad */}
      <ProductSafetyProfile product={product} />
    </div>
  );
};
