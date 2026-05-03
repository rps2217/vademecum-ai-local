import React from 'react';
import { Filter, X, ChevronRight, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchFiltersProps {
  categories: string[];
  activePrinciples: string[];
  selectedCategory: string | null;
  selectedPrinciple: string | null;
  onSelectCategory: (cat: string | null) => void;
  onSelectPrinciple: (pa: string | null) => void;
  totalResults: number;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  categories,
  activePrinciples,
  selectedCategory,
  selectedPrinciple,
  onSelectCategory,
  onSelectPrinciple,
  totalResults
}) => {
  return (
    <div className="w-full lg:w-64 shrink-0 flex flex-col gap-6 animate-in slide-in-from-left duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
          <Filter className="w-4 h-4" /> Filtros Avanzados
        </div>
        {(selectedCategory || selectedPrinciple) && (
          <button 
            onClick={() => { onSelectCategory(null); onSelectPrinciple(null); }}
            className="text-[10px] text-brand-primary hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Limpiar
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Categorías */}
        <section>
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            Categoría Principal
          </h3>
          <div className="flex flex-wrap lg:flex-col gap-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => onSelectCategory(selectedCategory === cat ? null : cat)}
                className={`
                  text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between group
                  ${selectedCategory === cat 
                    ? 'bg-brand-primary/20 text-brand-primary ring-1 ring-brand-primary/40 font-bold' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <div className="flex items-center gap-2 truncate">
                  <ChevronRight className={`w-3 h-3 transition-transform ${selectedCategory === cat ? 'rotate-90 text-brand-primary' : 'text-slate-600 group-hover:text-slate-400'}`} />
                  <span className="truncate">{cat}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Principios Activos populares */}
        <section>
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
             Principios Activos
          </h3>
          <div className="flex flex-wrap lg:flex-col gap-1 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
            {activePrinciples.map(pa => (
              <button
                key={pa}
                onClick={() => onSelectPrinciple(selectedPrinciple === pa ? null : pa)}
                className={`
                  text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2 group
                  ${selectedPrinciple === pa 
                    ? 'bg-brand-primary/20 text-brand-primary ring-1 ring-brand-primary/40 font-bold' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <Hash className={`w-3 h-3 ${selectedPrinciple === pa ? 'text-brand-primary' : 'text-slate-600'}`} />
                <span className="truncate">{pa}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="p-3 bg-brand-primary/5 rounded-xl border border-brand-primary/10">
            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Resultados de búsqueda</div>
            <div className="text-xl font-mono text-brand-primary">{totalResults}</div>
        </div>
      </div>
    </div>
  );
};
