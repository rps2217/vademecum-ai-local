import React from 'react';
import { Product, SafetyStatus } from '../../core/types/product.types';
import { Badge } from '../ui/badge';
import { AlertTriangle, CheckCircle2, Info, Plus, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onViewDetail?: (product: Product) => void;
  onAddToTray?: (product: Product) => void;
  isInTray?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetail, onAddToTray, isInTray }) => {
  const getSafetyIcon = (status: SafetyStatus) => {
    switch (status) {
      case SafetyStatus.SI: return <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
      case SafetyStatus.NO: return <AlertTriangle className="w-3 h-3 text-red-600" />;
      case SafetyStatus.PRECAUCION: return <Info className="w-3 h-3 text-amber-600" />;
    }
  };

  const getSafetyColor = (status: SafetyStatus) => {
    switch (status) {
      case SafetyStatus.SI: return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case SafetyStatus.NO: return 'text-red-700 bg-red-50 border-red-200';
      case SafetyStatus.PRECAUCION: return 'text-amber-700 bg-amber-50 border-amber-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all group relative flex flex-col h-full">
      <div 
        className="flex justify-between items-start mb-3 cursor-pointer"
        onClick={() => onViewDetail?.(product)}
      >
        <div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
            {product.nombre_comercial}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-1">
            {product.principios_activos.join(', ')}
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-slate-50 shrink-0 ml-2">
          {product.sku}
        </Badge>
      </div>

      <div className="mb-4 flex-1 cursor-pointer" onClick={() => onViewDetail?.(product)}>
        <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">
          {product.indicaciones.join(' • ')}
        </p>
      </div>

      {/* Semáforo Compacto */}
      <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-slate-100 cursor-pointer" onClick={() => onViewDetail?.(product)}>
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
        <div className="mt-4 flex flex-wrap gap-1.5 cursor-pointer" onClick={() => onViewDetail?.(product)}>
          {product.tags_ia.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-medium tracking-wide">
              #{tag}
            </span>
          ))}
          {product.tags_ia.length > 3 && (
            <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[10px] font-medium">
              +{product.tags_ia.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Botón de Agregar a Bandeja */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToTray?.(product);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors w-full justify-center ${
            isInTray 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
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
