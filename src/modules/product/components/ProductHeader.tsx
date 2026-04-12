import React from 'react';
import { Badge } from '../../../components/ui/badge';
import { Activity } from 'lucide-react';
import { Product } from '../../../core/types/product.types';
import { formatArrayToString } from '../../../utils/formatters';

interface ProductHeaderProps {
  product: Product;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({ product }) => {
  return (
    <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 md:p-8 mb-6 relative overflow-hidden shadow-lg">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      
      <div className="flex justify-between items-start relative z-10">
        <div className="flex-1 pr-4">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant="outline" className="bg-brand-bg text-slate-400 border-slate-700 px-3 py-1 text-xs tracking-wider font-mono">
              {product.sku}
            </Badge>
            {product.categoria_principal && product.categoria_principal !== 'Otro' && (
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 text-xs tracking-wider font-bold uppercase">
                {product.categoria_principal}
              </Badge>
            )}
            {Array.isArray(product.tags_ia) && product.tags_ia.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags_ia.slice(0, 3).map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-lg text-[10px] font-bold uppercase tracking-wider border border-brand-primary/20">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-5">
            {product.nombre_comercial}
          </h2>
          
          <div className="inline-flex items-center gap-2.5 bg-brand-primary/10 border border-brand-primary/20 px-4 py-2.5 rounded-2xl">
            <Activity className="w-5 h-5 text-brand-primary" />
            <span className="text-lg md:text-xl text-brand-primary font-bold">
              {formatArrayToString(product.principios_activos, ', ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
