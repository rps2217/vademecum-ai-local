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
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onViewDetail, onAddToTray, isInTray, onTagClick, searchTerm = '' }) => {
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
      case SafetyStatus.SI: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case SafetyStatus.NO: return 'text-red-400 bg-red-500/10 border-red-500/20';
      case SafetyStatus.PRECAUCION: return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }
  };

  const isGroundingSource = product.source_url === 'google_search' || product.source_url?.includes('google_search');

  return (
    <div className="group relative flex flex-col h-full bg-brand-surface rounded-[2rem] p-5 shadow-sm border border-slate-800/60 hover:border-brand-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-brand-primary/10 hover:-translate-y-1">
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] pointer-events-none" />

      <div 
        className="flex justify-between items-start mb-4 cursor-pointer relative z-10"
        onClick={() => onViewDetail?.(product)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {product.is_verified && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold text-emerald-400 uppercase tracking-widest">
                <ShieldCheck className="w-2.5 h-2.5" /> Verificado
              </span>
            )}
            {product.categoria_principal && product.categoria_principal !== 'Otro' && (
              <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">
                {product.categoria_principal}
              </span>
            )}
          </div>
          <h3 className="text-lg font-extrabold text-white leading-tight group-hover:text-brand-primary transition-colors">
            <HighlightText text={product.nombre_comercial} searchTerm={searchTerm} />
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1 truncate">
            <HighlightText text={formatArrayToString(product.principios_activos, ', ')} searchTerm={searchTerm} />
          </p>
        </div>
        <div className="text-[9px] font-mono text-slate-600 bg-brand-bg px-2 py-1 rounded-lg border border-slate-800">
          {product.sku.substring(0, 8)}
        </div>
      </div>

      <div className="mb-6 flex-1 cursor-pointer flex flex-col gap-4 relative z-10" onClick={() => onViewDetail?.(product)}>
        {/* Indicaciones */}
        <div>
          <p className="clinical-label mb-1.5">Indicaciones Clínicas</p>
          <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-medium">
            <HighlightText text={formatArrayToString(product.indicaciones, ' • ')} searchTerm={searchTerm} />
          </div>
        </div>

        {/* Semáforo Integrado */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Emb.', status: product.apto_embarazo },
            { label: 'Lact.', status: product.apto_lactancia },
            { label: 'Ped.', status: product.apto_pediatria }
          ].map((item, i) => (
            <div key={i} className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-[9px] font-bold tracking-tight transition-colors ${getSafetyColor(item.status)}`}>
              <span>{item.label}</span>
              {getSafetyIcon(item.status)}
            </div>
          ))}
        </div>
      </div>

      {/* Tags de IA con estilo mejorado */}
      {Array.isArray(product.tags_ia) && product.tags_ia.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5 relative z-10">
          {product.tags_ia.slice(0, 3).map(tag => (
            <button 
              key={tag} 
              onClick={(e) => {
                e.stopPropagation();
                onTagClick?.(tag);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/50 border border-slate-700 text-[9px] font-bold text-slate-400 hover:text-brand-primary hover:border-brand-primary/30 transition-all uppercase tracking-wider"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Botones de Acción - Refinados */}
      <div className="mt-auto pt-5 border-t border-slate-800/60 flex items-center gap-2 relative z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToTray?.(product);
          }}
          className={`flex items-center justify-center gap-2 h-10 px-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex-1 ${
            isInTray 
              ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/30' 
              : 'bg-brand-bg text-slate-500 border border-slate-800 hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/40'
          }`}
        >
          {isInTray ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
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
          className={`h-10 w-10 flex items-center justify-center rounded-2xl transition-all ${
            isSelectedForBrain 
              ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' 
              : 'bg-brand-bg text-slate-500 border border-slate-800 hover:text-brand-primary hover:border-brand-primary/40'
          }`}
          title={isSelectedForBrain ? 'Quitar del análisis' : 'Analizar con Cerebro IA'}
        >
          <Brain className={`w-4 h-4 ${isSelectedForBrain ? 'animate-pulse' : ''}`} />
        </button>

        {product.source_url && !isGroundingSource && (
          <a
            href={product.source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="h-10 w-10 flex items-center justify-center rounded-2xl bg-brand-bg text-slate-500 border border-slate-800 hover:text-violet-400 hover:border-violet-500/40 transition-all"
            title="Ver fuente oficial"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
