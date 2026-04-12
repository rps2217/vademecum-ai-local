import React from 'react';
import { Pill, ArrowRight, Link as LinkIcon } from 'lucide-react';
import { Product } from '../../../../core/types/product.types';
import { formatArrayToString } from '../../../../utils/formatters';

interface RelatedProductsListProps {
  products: Product[];
  onProductClick?: (product: Product) => void;
}

export const RelatedProductsList: React.FC<RelatedProductsListProps> = ({ products, onProductClick }) => {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
        <LinkIcon className="w-4 h-4" /> Productos Complementarios o Similares
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {products.map(relProduct => (
          <button
            key={relProduct.sku}
            onClick={() => onProductClick?.(relProduct)}
            className="flex items-center gap-4 p-4 bg-slate-800/30 hover:bg-slate-800/50 rounded-2xl border border-slate-800/50 transition-all group text-left"
          >
            <div className="p-3 bg-brand-bg rounded-xl text-brand-primary group-hover:scale-110 transition-transform">
              <Pill className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                {relProduct.nombre_comercial}
              </h4>
              <p className="text-xs text-slate-500 truncate">
                {formatArrayToString(relProduct.principios_activos, ', ')}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>
    </section>
  );
};
