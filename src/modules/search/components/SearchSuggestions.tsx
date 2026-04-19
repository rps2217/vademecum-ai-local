import React from 'react';
import { Product } from '../../../core/types/product.types';
import { Search, Hash, Star, ChevronRight } from 'lucide-react';

interface SearchSuggestionsProps {
  suggestions: Product[];
  onSelect: (product: Product) => void;
  isVisible: boolean;
  highlightedIndex: number;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({ 
  suggestions, 
  onSelect, 
  isVisible,
  highlightedIndex
}) => {
  if (!isVisible || suggestions.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-brand-surface/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="p-2 border-b border-slate-800/50 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Sugerencias Rápidas</span>
        <span className="text-[10px] text-slate-600 pr-2 italic">Usa ↑↓ para navegar</span>
      </div>
      <div className="max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        {suggestions.map((product, index) => (
          <button
            key={product.sku}
            className={`w-full flex items-center gap-3 p-3 text-left transition-colors border-b border-slate-800/30 last:border-0 ${
              index === highlightedIndex ? 'bg-brand-primary/20 text-white' : 'hover:bg-slate-800/50 text-slate-300'
            }`}
            onClick={() => onSelect(product)}
            onMouseEnter={() => {/* Podríamos actualizar el index aquí si quisiéramos */}}
          >
            <div className={`p-2 rounded-xl flex-shrink-0 ${
               index === highlightedIndex ? 'bg-brand-primary/30 text-brand-primary' : 'bg-slate-800 text-slate-500'
            }`}>
              <Hash className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm truncate">{product.nombre_comercial}</span>
                {product.is_verified && (
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-500 font-mono uppercase">{product.sku}</span>
                <span className="text-[10px] text-slate-600">•</span>
                <span className="text-[10px] text-slate-500 truncate">{product.principios_activos?.join(', ') || 'Sin principios activos'}</span>
              </div>
            </div>

            <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${
              index === highlightedIndex ? 'translate-x-1 text-brand-primary' : 'text-slate-700'
            }`} />
          </button>
        ))}
      </div>
    </div>
  );
};
