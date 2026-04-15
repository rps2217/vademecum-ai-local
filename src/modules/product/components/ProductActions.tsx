import React from 'react';
import { X, Cpu, RefreshCw, Loader2, CheckCircle2, Edit3 } from 'lucide-react';
import { Product } from '../../../core/types/product.types';

interface ProductActionsProps {
  product: Product;
  isForcingSynergy: boolean;
  isReanalyzing: boolean;
  isSuccess: boolean;
  isEditing?: boolean;
  onForceSynergy: () => void;
  onReanalyze: () => void;
  onEdit: () => void;
  onClose: () => void;
  hideCloseMobile?: boolean;
}

export const ProductActions: React.FC<ProductActionsProps> = ({
  product,
  isForcingSynergy,
  isReanalyzing,
  isSuccess,
  isEditing = false,
  onForceSynergy,
  onReanalyze,
  onEdit,
  onClose,
  hideCloseMobile = false
}) => {
  return (
    <div className="flex flex-col gap-3 shrink-0">
      <button 
        onClick={onEdit}
        title="Editar registro manualmente"
        className={`p-3 rounded-2xl transition-all border shadow-sm ${
          isEditing 
            ? 'text-brand-primary border-brand-primary/50 bg-brand-primary/10' 
            : 'text-slate-400 border-slate-700 bg-brand-bg hover:bg-slate-700 hover:text-white'
        }`}
      >
        <Edit3 className="w-5 h-5" />
      </button>
      <button 
        onClick={onForceSynergy}
        disabled={isForcingSynergy}
        title={isForcingSynergy ? "Analizando..." : "Forzar análisis de sinergia local"}
        className={`p-3 rounded-2xl transition-all disabled:opacity-50 border shadow-sm ${
          isForcingSynergy 
            ? 'text-brand-accent border-brand-accent/30 bg-brand-accent/10' 
            : product.synergy_analyzed
              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20'
              : 'text-indigo-400 border-slate-700 bg-brand-bg hover:bg-slate-700 hover:text-indigo-300'
        }`}
      >
        {isForcingSynergy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cpu className="w-5 h-5" />}
      </button>
      <button 
        onClick={onReanalyze}
        disabled={isReanalyzing}
        title="Re-analizar y completar con IA (Nube)"
        className={`p-3 rounded-2xl transition-all disabled:opacity-50 border shadow-sm ${
          isSuccess 
            ? 'text-brand-accent border-brand-accent/30 bg-brand-accent/10' 
            : 'text-brand-primary border-slate-700 bg-brand-bg hover:bg-slate-700 hover:text-brand-primary/80'
        }`}
      >
        {isReanalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
      </button>
      {!hideCloseMobile && (
        <button 
          onClick={onClose}
          className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all border border-slate-700 md:hidden shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
