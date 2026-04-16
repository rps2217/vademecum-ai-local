import React from 'react';
import { Product, SafetyStatus } from '../../core/types/product.types';
import { Badge } from '../ui/badge';
import { AlertTriangle, CheckCircle2, Info, Plus, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { formatArrayToString } from '../../utils/formatters';
import { HighlightText } from '../ui/HighlightText';

interface ProductCardProps {
  product: Product;
  onViewDetail?: (product: Product) => void;
  onAddToTray?: (product: Product) => void;
  isInTray?: boolean;
  onTagClick?: (tag: string) => void;
  searchTerm?: string;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onViewDetail, onAddToTray, isInTray, onTagClick, searchTerm = '' }) => {
  const getSafetyIcon = (status: SafetyStatus) => {
    switch (status) {
      case SafetyStatus.SI: return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
      case SafetyStatus.NO: return <AlertTriangle className="w-3 h-3 text-red-500" />;
      case SafetyStatus.PRECAUCION: return <Info className="w-3 h-3 text-amber-500" />;
    }
  };

  const getSafetyColor = (status: SafetyStatus) => {
    switch (status) {
      case SafetyStatus.SI: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case SafetyStatus.NO: return 'text-red-400 bg-red-500/10 border-red-500/20';
      case SafetyStatus.PRECAUCION: return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }
  };

  const isGroundingSource = product.source_url === 'google_search' || product.source_url?.includes('google_search');

  return (
    <div className="bg-brand-surface rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800 hover:shadow-lg hover:shadow-brand-primary/10 hover:border-brand-primary/50 transition-all group relative flex flex-col h-full">
      <div 
        className="flex justify-between items-start mb-2 sm:mb-3 cursor-pointer"
        onClick={() => onViewDetail?.(product)}
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-brand-primary transition-colors truncate flex items-center gap-2">
            <HighlightText text={product.nombre_comercial} searchTerm={searchTerm} />
            {product.is_verified && (
              <span title="Verificado por Profesional">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
            {product.categoria_principal && product.categoria_principal !== 'Otro' && (
              <Badge variant="outline" className="text-[8px] sm:text-[9px] uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shrink-0">
                {product.categoria_principal}
              </Badge>
            )}
            <p className="text-xs sm:text-sm text-slate-400 truncate">
              <HighlightText text={formatArrayToString(product.principios_activos, ', ')} searchTerm={searchTerm} />
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[9px] sm:text-[10px] uppercase tracking-wider bg-brand-bg text-slate-400 border-slate-700 shrink-0 ml-2">
          {product.sku.substring(0, 8)}
        </Badge>
      </div>

      <div className="mb-3 sm:mb-4 flex-1 cursor-pointer flex flex-col gap-3" onClick={() => onViewDetail?.(product)}>
        {/* Indicaciones */}
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Indicaciones</p>
          <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed">
            <HighlightText text={formatArrayToString(product.indicaciones, ' • ')} searchTerm={searchTerm} />
          </p>
        </div>

        {/* Descripción */}
        {product.descripcion && (
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Descripción</p>
            <p className="text-xs sm:text-sm text-slate-400 line-clamp-3 leading-relaxed">
              <HighlightText text={product.descripcion} searchTerm={searchTerm} />
            </p>
          </div>
        )}

        {/* Análisis de Componentes */}
        {product.analisis_componentes && (
          <div>
            <p className="text-[10px] font-bold text-indigo-400/70 uppercase tracking-wider mb-1">Análisis de Componentes</p>
            <p className="text-xs sm:text-sm text-slate-400 line-clamp-3 leading-relaxed">
              <HighlightText text={product.analisis_componentes} searchTerm={searchTerm} />
            </p>
          </div>
        )}
      </div>

      {/* Semáforo Compacto */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-auto pt-3 sm:pt-4 border-t border-slate-800 cursor-pointer" onClick={() => onViewDetail?.(product)}>
        <div className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-md border text-[10px] sm:text-xs font-medium ${getSafetyColor(product.apto_embarazo)}`}>
          {getSafetyIcon(product.apto_embarazo)}
          <span className="truncate">Emb.</span>
        </div>
        <div className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-md border text-[10px] sm:text-xs font-medium ${getSafetyColor(product.apto_lactancia)}`}>
          {getSafetyIcon(product.apto_lactancia)}
          <span className="truncate">Lact.</span>
        </div>
        <div className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-md border text-[10px] sm:text-xs font-medium ${getSafetyColor(product.apto_pediatria)}`}>
          {getSafetyIcon(product.apto_pediatria)}
          <span className="truncate">Ped.</span>
        </div>
      </div>

      {/* Tags IA */}
      {Array.isArray(product.tags_ia) && product.tags_ia.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {product.tags_ia.slice(0, 3).map(tag => (
            <button 
              key={tag} 
              onClick={(e) => {
                e.stopPropagation();
                if (onTagClick) {
                  onTagClick(tag);
                } else {
                  onViewDetail?.(product);
                }
              }}
              className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 hover:text-brand-primary/80 rounded text-[10px] font-medium tracking-wide border border-brand-primary/20 transition-colors"
            >
              #{tag}
            </button>
          ))}
          {product.tags_ia.length > 3 && (
            <span 
              className="px-2 py-0.5 bg-brand-bg text-slate-500 rounded text-[10px] font-medium border border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail?.(product);
              }}
            >
              +{product.tags_ia.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Botón de Agregar a Bandeja y Fuente Web */}
      <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToTray?.(product);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-1 justify-center ${
            isInTray 
              ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20' 
              : 'bg-brand-bg text-slate-300 border border-slate-700 hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/30'
          }`}
        >
          {isInTray ? (
            <>
              <Check className="w-4 h-4" /> Seleccionado
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Analizar Interacción
            </>
          )}
        </button>
        {product.source_url && !isGroundingSource && (
          <a
            href={product.source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-[9px] font-bold text-violet-400 hover:text-violet-300 transition-all uppercase tracking-widest whitespace-nowrap bg-violet-500/10 px-3 py-2 rounded-lg border border-violet-500/30 hover:border-violet-500/50"
          >
            <ExternalLink className="w-3 h-3" />
            Fuente web
          </a>
        )}
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
