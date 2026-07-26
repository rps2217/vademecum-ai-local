/**
 * ProductDetailModal - Modal de detalle de producto
 * Muestra información completa del producto seleccionado
 */

import React, { useEffect } from 'react';
import { 
  X, Copy, Loader2, Sparkles, Info, CheckCircle2, 
  ExternalLink, Package, Clock 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { TermExpander } from '../ui/TermExpander';
import { IngredientPopover, IngredientText } from '../ui/IngredientPopover';
import type { AnalyzedProduct } from '../../types';

interface ProductDetailModalProps {
  product: AnalyzedProduct;
  kb: Record<string, any>;
  onClose: () => void;
  onScrape: (sku: string) => void;
  scrapeState: 'idle' | 'scraping' | 'success' | 'error';
}

export function ProductDetailModal({
  product,
  kb,
  onClose,
  onScrape,
  scrapeState
}: ProductDetailModalProps) {
  const principios = (product.principios_activos || []).join(', ');
  const sinergias = product.sinergias_detectadas || [];
  const needsScrape = !product.nombre_comercial || !product.descripcion;

  const handleCopySku = () => {
    navigator.clipboard.writeText(product.sku);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="relative p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-2">
                {needsScrape ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded-lg">
                    <Info className="w-3 h-3" />
                    Información incompleta
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-lg">
                    <CheckCircle2 className="w-3 h-3" />
                    Completo
                  </span>
                )}
                
                {product.cobertura_kb > 0 && (
                  <span className="px-2 py-1 bg-violet-50 text-violet-600 text-xs font-medium rounded-lg">
                    KB: {product.cobertura_kb}%
                  </span>
                )}
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 line-clamp-2">
                {product.nombre_comercial || 'Sin nombre'}
              </h2>
              
              {/* SKU */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={handleCopySku}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  SKU: {product.sku}
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Botón de scrape */}
              <button
                onClick={() => onScrape(product.sku)}
                disabled={scrapeState === 'scraping'}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  scrapeState === 'scraping' 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : needsScrape
                      ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                      : "bg-violet-50 text-violet-600 hover:bg-violet-100"
                )}
              >
                {scrapeState === 'scraping' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {needsScrape ? 'Completar' : 'Actualizar'}
                  </>
                )}
              </button>
              
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(85vh-160px)] space-y-5">
          {/* Principios activos */}
          {principios && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Principios Activos</h3>
              <IngredientText text={principios} className="text-sm text-gray-700 leading-relaxed" />
            </div>
          )}
          
          {/* Descripción */}
          {product.descripcion ? (
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Descripción</h3>
              <TermExpander text={product.descripcion || ""} className="text-sm text-gray-700 leading-relaxed" variant="inline" />
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-700 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Este producto no tiene descripción. Haz clic en "Completar" para buscar información.
              </p>
            </div>
          )}

          {/* Posología */}
          {product.posologia && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Posología
              </h3>
              <TermExpander text={product.posologia || ""} className="text-sm text-amber-800 leading-relaxed" variant="inline" />
            </div>
          )}

          {/* Indicaciones */}
          {product.indicaciones && product.indicaciones.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Indicaciones</h3>
              <ul className="space-y-2">
                {product.indicaciones.slice(0, 8).map((ind: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <TermExpander text={ind} variant="inline" />
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Categoría */}
          {product.categoria_principal && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Categoría:</span>
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {product.categoria_principal}
              </span>
            </div>
          )}

          {/* Sinergias */}
          {sinergias.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Sinergias Detectadas ({sinergias.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {sinergias.map((sin: string, i: number) => (
                  <span 
                    key={i} 
                    className="px-3 py-1.5 bg-violet-50 text-violet-600 text-xs font-medium rounded-full"
                  >
                    {sin}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Metadatos */}
          <div className="text-xs text-gray-400 border-t border-gray-100 pt-4 space-y-1">
            <p>SKU: {product.sku}</p>
            {product.updated_at && (
              <p>Última actualización: {new Date(product.updated_at).toLocaleDateString('es-ES')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailModal;
