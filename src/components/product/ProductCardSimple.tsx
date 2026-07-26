/**
 * ProductCardSimple - Tarjeta simple para el dashboard
 * Props compatibles con SearchView
 */

import React from 'react';
import { Pill, Loader2, Check, X, ChevronRight, Clock, BookOpen } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { TermExpander } from '../ui/TermExpander';
import type { AnalyzedProduct } from '../../types';

interface ScrapingState {
  [sku: string]: 'idle' | 'scraping' | 'success' | 'error';
}

interface ProductCardSimpleProps {
  product: AnalyzedProduct;
  onSelect: () => void;
  onScrape?: (sku: string) => void;
  scrapeState?: 'idle' | 'scraping' | 'success' | 'error';
}

export const ProductCardSimple: React.FC<ProductCardSimpleProps> = React.memo(({
  product,
  onSelect,
  onScrape,
  scrapeState = 'idle'
}) => {
  const capitalizeFirst = (text: string) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const principios = (product.principios_activos || []).slice(0, 3).join(', ');
  const posologia = product.posologia;

  const getScrapeIcon = () => {
    switch (scrapeState) {
      case 'scraping':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <Check className="w-4 h-4 text-emerald-500" />;
      case 'error':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      className="group bg-white border border-slate-200 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-emerald-300 hover:shadow-md"
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Icono */}
        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
          <Pill className="w-5 h-5 text-emerald-600" />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                {capitalizeFirst(product.nombre_comercial || 'Sin nombre')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {principios || 'Sin principios activos'}
              </p>
            </div>
            
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
          </div>

          {/* Posología con términos expandidos */}
          {posologia && (
            <div className="flex items-start gap-1.5 mt-2">
              <Clock className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
              <TermExpander 
                text={posologia} 
                className="text-xs text-gray-600 line-clamp-1"
                variant="inline"
              />
            </div>
          )}

          {/* Metadatos */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {product.categoria_principal && (
              <Badge variant="muted" className="text-[10px]">
                {product.categoria_principal}
              </Badge>
            )}
            
            {/* Cobertura KB */}
            {product.cobertura_kb > 0 && (
              <Badge variant={product.cobertura_kb >= 80 ? 'success' : 'warning'} className="text-[10px]">
                KB: {product.cobertura_kb}%
              </Badge>
            )}

            {/* Sinergias */}
            {product.sinergias_detectadas && product.sinergias_detectadas.length > 0 && (
              <Badge variant="info" className="text-[10px]">
                +{product.sinergias_detectadas.length} sinergias
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Botón de scrape */}
      {onScrape && (
        <div className="flex justify-end mt-2 pt-2 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onScrape(product.sku);
            }}
            disabled={scrapeState === 'scraping'}
            className="h-7 text-xs"
          >
            {getScrapeIcon()}
            <span className="ml-1">
              {scrapeState === 'idle' && 'Scrapear'}
              {scrapeState === 'scraping' && 'Scrapeando...'}
              {scrapeState === 'success' && 'Completado'}
              {scrapeState === 'error' && 'Reintentar'}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
});

ProductCardSimple.displayName = 'ProductCardSimple';

export default ProductCardSimple;
