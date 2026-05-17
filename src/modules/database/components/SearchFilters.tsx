import React from 'react';
import { Filter, X, ChevronRight, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchFiltersProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  totalResults: number;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  totalResults
}) => {
  return (
    <div className="w-full lg:w-64 shrink-0 flex flex-col gap-6 animate-in slide-in-from-left duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wider">
          <Filter className="w-4 h-4" /> Filtros Avanzados
        </div>
        {selectedCategory && (
          <button 
            onClick={() => onSelectCategory(null)}
            className="text-[10px] text-primary hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Limpiar
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Categorías */}
        <section>
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            Categoría Principal
          </h3>
          <div className="flex flex-wrap lg:flex-col gap-1">
            {(categories || []).map(cat => (
              <button
                key={cat}
                onClick={() => onSelectCategory(selectedCategory === cat ? null : cat)}
                className={`
                  text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between group
                  ${selectedCategory === cat 
                    ? 'bg-primary text-primary ring-1 ring-brand-primary/40 font-bold' 
                    : 'text-muted-foreground hover:bg-card hover:text-foreground'}
                `}
              >
                <div className="flex items-center gap-2 truncate">
                  <ChevronRight className={`w-3 h-3 transition-transform ${selectedCategory === cat ? 'rotate-90 text-primary' : 'text-muted-foreground group-hover:text-muted-foreground'}`} />
                  <span className="truncate">{cat}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <div className="p-3 bg-primary rounded-xl border border-primary/50">
            <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Resultados de búsqueda</div>
            <div className="text-xl font-mono text-primary">{totalResults}</div>
        </div>
      </div>
    </div>
  );
};
