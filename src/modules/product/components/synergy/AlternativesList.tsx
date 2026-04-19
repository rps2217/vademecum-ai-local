import React from 'react';
import { Pill, ArrowRight, Copy } from 'lucide-react';
import { Product } from '../../../../core/types/product.types';
import { formatArrayToString } from '../../../../utils/formatters';

interface AlternativesListProps {
  products: { product: Product; score: number }[];
  onProductClick?: (product: Product) => void;
}

export const AlternativesList: React.FC<AlternativesListProps> = ({ products, onProductClick }) => {
  if (products.length === 0) return null;

  return (
    <section className="space-y-4">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
        <Copy className="w-4 h-4" /> Top 3 Alternativas por Equivalencia
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {products.map(({ product: altProduct, score }) => (
          <button
            key={altProduct.sku}
            onClick={() => onProductClick?.(altProduct)}
            className="flex items-center gap-4 p-4 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-2xl border border-emerald-500/10 transition-all group text-left relative overflow-hidden"
          >
            {/* Badge de Score */}
            <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-tighter rounded-bl-xl shadow-lg">
                Equivalencia: {Math.round(score * 100)}%
            </div>

            <div className="p-3 bg-brand-bg rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
              <Pill className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-200 group-hover:text-white transition-colors truncate pr-20">
                {altProduct.nombre_comercial}
              </h4>
              <p className="text-xs text-slate-500 truncate">
                {formatArrayToString(altProduct.principios_activos, ', ')}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>
    </section>
  );
};
