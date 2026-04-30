import React from 'react';
import { Product, SafetyStatus } from '../../core/types/product.types';
import { Badge } from '../ui/badge';
import { AlertTriangle, CheckCircle2, Info, Plus, Check, ExternalLink, ShieldCheck, Brain } from 'lucide-react';
import { formatArrayToString } from '../../utils/formatters';
import { HighlightText } from '../ui/HighlightText';
import { useConsultation } from '../../context/ConsultationContext';

interface ProductCardProps {
  product: Product;
  onViewDetail?: (product: Product) => void;
  onAddToTray?: (product: Product) => void;
  isInTray?: boolean;
  onTagClick?: (tag: string) => void;
  searchTerm?: string;
  viewMode: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onViewDetail, onAddToTray, isInTray, onTagClick, searchTerm = '', viewMode }) => {
  const { addToConsultation, removeFromConsultation, isInConsultation } = useConsultation();
  const isSelectedForBrain = isInConsultation(product.sku);

  const getSafetyIcon = (status: SafetyStatus) => {
    switch (status) {
      case SafetyStatus.SI: return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
      case SafetyStatus.NO: return <AlertTriangle className="w-3 h-3 text-red-500" />;
      case SafetyStatus.PRECAUCION: return <Info className="w-3 h-3 text-amber-500" />;
    }
  };

  const getSafetyColor = (status: SafetyStatus) => {
    switch (status) {
      case SafetyStatus.SI: return 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10';
      case SafetyStatus.NO: return 'text-red-400 bg-red-500/5 border-red-500/10';
      case SafetyStatus.PRECAUCION: return 'text-amber-400 bg-amber-500/5 border-amber-500/10';
    }
  };

  const isGroundingSource = product.source_url === 'google_search' || product.source_url?.includes('google_search');

  return (
    <div className={`group relative flex ${viewMode === 'list' ? 'flex-row gap-4' : 'flex-col h-full'} bg-brand-surface rounded-xl p-4 shadow-sm border border-slate-700/40 hover:border-emerald-500/40 transition-colors duration-200`}>
      
      <div 
        className="flex justify-between items-start mb-3 cursor-pointer relative z-10"
        onClick={() => onViewDetail?.(product)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {product.is_verified && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[7px] font-black text-emerald-400 uppercase tracking-widest">
                VERIFICADO
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-white leading-tight group-hover:text-emerald-500 transition-colors">
            <HighlightText text={product.nombre_comercial} searchTerm={searchTerm} />
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
            <HighlightText text={formatArrayToString(product.principios_activos, ', ')} searchTerm={searchTerm} />
          </p>
        </div>
        <div className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
          {product.sku.substring(0, 8)}
        </div>
      </div>

      <div className={`mb-4 flex-1 cursor-pointer flex ${viewMode === 'list' ? 'flex-row gap-6' : 'flex-col gap-3'} relative z-10`} onClick={() => onViewDetail?.(product)}>
        {/* Indicaciones */}
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-600 mb-1">Indicaciones</p>
          <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
            <HighlightText text={formatArrayToString(product.indicaciones, ' • ')} searchTerm={searchTerm} />
          </div>
        </div>

        {/* Semáforo Integrado */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: 'EMB', status: product.apto_embarazo },
            { label: 'LAC', status: product.apto_lactancia },
            { label: 'PED', status: product.apto_pediatria }
          ].map((item, i) => (
            <div key={i} className={`flex items-center justify-between px-2 py-1 rounded-lg border text-[8px] font-bold tracking-tighter ${getSafetyColor(item.status)}`}>
              <span>{item.label}</span>
              {getSafetyIcon(item.status)}
            </div>
          ))}
        </div>
      </div>

      {/* Tags de IA - Minimal */}
      {Array.isArray(product.tags_ia) && product.tags_ia.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1 relative z-10">
          {product.tags_ia.slice(0, 3).map(tag => (
            <button 
              key={tag} 
              onClick={(e) => {
                e.stopPropagation();
                onTagClick?.(tag);
              }}
              className="px-2 py-0.5 rounded bg-slate-800 text-[8px] font-bold text-slate-500 hover:text-emerald-500 transition-colors uppercase tracking-tight"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Botones de Acción - Compactos */}
      <div className="mt-auto pt-4 border-t border-slate-800/60 flex items-center gap-2 relative z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToTray?.(product);
          }}
          className={`flex items-center justify-center gap-2 h-9 px-3 rounded-lg text-[9px] font-bold uppercase tracking-tight transition-colors flex-1 ${
            isInTray 
              ? 'bg-emerald-500 text-slate-950' 
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {isInTray ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          <span>{isInTray ? 'En Lista' : 'Comparar'}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isSelectedForBrain) {
              removeFromConsultation(product.sku);
            } else {
              addToConsultation(product);
            }
          }}
          className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors ${
            isSelectedForBrain 
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
              : 'bg-slate-800 text-slate-500 hover:text-emerald-500'
          }`}
          title={isSelectedForBrain ? 'Quitar del análisis' : 'Analizar Sinergias'}
        >
          <Brain className={`w-3.5 h-3.5 ${isSelectedForBrain ? 'animate-pulse' : ''}`} />
        </button>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
