import React from 'react';
import { Product, SafetyStatus } from '../../core/types/product.types';
import { Badge } from '../ui/badge';
import { AlertTriangle, CheckCircle2, Info, Plus, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onViewDetail?: (product: Product) => void;
  onAddToTray?: (product: Product) => void;
  isInTray?: boolean;
  onTagClick?: (tag: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetail, onAddToTray, isInTray, onTagClick }) => {
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

  return (
    <div className="bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-800 hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-500/50 transition-all group relative flex flex-col h-full">
      <div 
        className="flex justify-between items-start mb-3 cursor-pointer"
        onClick={() => onViewDetail?.(product)}
      >
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
            {product.nombre_comercial}
          </h3>
          <p className="text-sm text-slate-400 line-clamp-1">
            {product.principios_activos.join(', ')}
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-slate-800 text-slate-400 border-slate-700 shrink-0 ml-2">
          {product.sku}
        </Badge>
      </div>

      <div className="mb-4 flex-1 cursor-pointer" onClick={() => onViewDetail?.(product)}>
        <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
          {product.indicaciones.join(' • ')}
        </p>
      </div>

      {/* Semáforo Compacto */}
      <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-slate-800 cursor-pointer" onClick={() => onViewDetail?.(product)}>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${getSafetyColor(product.apto_embarazo)}`}>
          {getSafetyIcon(product.apto_embarazo)}
          <span className="truncate">Embarazo</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${getSafetyColor(product.apto_lactancia)}`}>
          {getSafetyIcon(product.apto_lactancia)}
          <span className="truncate">Lactancia</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${getSafetyColor(product.apto_pediatria)}`}>
          {getSafetyIcon(product.apto_pediatria)}
          <span className="truncate">Pediatría</span>
        </div>
      </div>

      {/* Tags IA */}
      {product.tags_ia && product.tags_ia.length > 0 && (
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
              className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 rounded text-[10px] font-medium tracking-wide border border-indigo-500/20 transition-colors"
            >
              #{tag}
            </button>
          ))}
          {product.tags_ia.length > 3 && (
            <span 
              className="px-2 py-0.5 bg-slate-800 text-slate-500 rounded text-[10px] font-medium border border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors"
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

      {/* Botón de Agregar a Bandeja */}
      <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToTray?.(product);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors w-full justify-center ${
            isInTray 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-500/30'
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
      </div>
    </div>
  );
};
