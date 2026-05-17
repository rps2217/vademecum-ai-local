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
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
        <LinkIcon className="w-4 h-4" /> Productos Complementarios
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {products.map(relProduct => (
          <button
            key={relProduct.sku}
            onClick={() => onProductClick?.(relProduct)}
            className="flex items-center gap-4 p-4 bg-card hover:bg-card rounded-2xl border border-border transition-all group text-left"
          >
            <div className="p-3 bg-background rounded-xl text-primary group-hover:scale-110 transition-transform">
              <Pill className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-foreground group-hover:text-foreground transition-colors truncate">
                {relProduct.nombre_comercial}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {formatArrayToString(relProduct.principios_activos, ', ')}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>
    </section>
  );
};
