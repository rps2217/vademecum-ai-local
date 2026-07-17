import React from 'react';
import { Product } from '../../core/types/product.types';
import { Badge } from '../ui/badge';
import { Plus, Check, ArrowRight, Pill } from 'lucide-react';
import { formatArrayToString } from '../../utils/formatters';
import { HighlightText } from '../ui/HighlightText';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface ProductCardProps {
  product: Product;
  onViewDetail?: (product: Product) => void;
  onAddToTray?: (product: Product) => void;
  isInTray?: boolean;
  onTagClick?: (tag: string) => void;
  searchTerm?: string;
  viewMode: 'grid' | 'list';
}

/**
 * ProductCard - Clean and Simple
 * Shows essential medication info at a glance
 */
export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  onViewDetail,
  onAddToTray,
  isInTray,
  searchTerm = '',
  viewMode
}) => {
  const capitalizeFirst = (text: string) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const indications = product.indicaciones?.slice(0, 3) || [];

  return (
    <div
      className={cn(
        "group bg-white border border-slate-200 rounded-2xl transition-all duration-200 cursor-pointer",
        "hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100",
        viewMode === 'list' 
          ? 'flex items-center p-4 gap-4' 
          : 'p-5 flex flex-col'
      )}
      onClick={() => onViewDetail?.(product)}
    >
      {/* Grid Layout */}
      {viewMode === 'grid' ? (
        <>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                <HighlightText text={capitalizeFirst(product.nombre_comercial)} searchTerm={searchTerm} />
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                <HighlightText text={capitalizeFirst(formatArrayToString(product.principios_activos, ', '))} searchTerm={searchTerm} />
              </p>
            </div>
            
            {product.categoria_principal && (
              <Badge variant="muted" className="shrink-0 text-[10px]">
                {product.categoria_principal}
              </Badge>
            )}
          </div>

          {/* Indications */}
          <div className="flex-1 bg-slate-50 rounded-xl p-3 mb-3">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">
              Indicaciones
            </p>
            <div className="space-y-1">
              {indications.map((ind, idx) => (
                <p key={idx} className="text-sm text-slate-700 line-clamp-1">
                  <HighlightText text={capitalizeFirst(ind)} searchTerm={searchTerm} />
                </p>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {product.tags_ia?.slice(0, 2).map(tag => (
                <span key={tag} className="text-[10px] text-slate-400">
                  #{tag}
                </span>
              ))}
            </div>
            
            <Button
              variant={isInTray ? "success" : "outline"}
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddToTray?.(product);
              }}
            >
              {isInTray ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </>
      ) : (
        /* List Layout */
        <>
          {/* Icon */}
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <Pill className="w-5 h-5 text-emerald-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
              <HighlightText text={capitalizeFirst(product.nombre_comercial)} searchTerm={searchTerm} />
            </h3>
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              <HighlightText text={capitalizeFirst(formatArrayToString(product.principios_activos, ', '))} searchTerm={searchTerm} />
            </p>
          </div>

          {/* Indications Preview */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            {indications.slice(0, 2).map((ind, idx) => (
              <React.Fragment key={idx}>
                <span className="line-clamp-1 max-w-[100px]">
                  {capitalizeFirst(ind)}
                </span>
                {idx < Math.min(indications.length, 2) - 1 && <span className="text-slate-300">•</span>}
              </React.Fragment>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant={isInTray ? "success" : "outline"}
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddToTray?.(product);
              }}
            >
              {isInTray ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </Button>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
        </>
      )}
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
