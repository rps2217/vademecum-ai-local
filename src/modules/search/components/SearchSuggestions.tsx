import React from 'react';
import { Search, Brain, Zap, FlaskConical, Thermometer, ChevronRight } from 'lucide-react';

export interface SearchConcept {
  id: string;
  label: string;
  type: 'pathology' | 'molecule' | 'category' | 'symptom';
}

interface SearchSuggestionsProps {
  suggestions: SearchConcept[];
  onSelect: (concept: SearchConcept) => void;
  isVisible: boolean;
  highlightedIndex: number;
}

const ConceptIcon = ({ type }: { type: SearchConcept['type'] }) => {
  switch (type) {
    case 'pathology': return <Thermometer className="w-3.5 h-3.5" />;
    case 'molecule': return <FlaskConical className="w-3.5 h-3.5" />;
    case 'category': return <Zap className="w-3.5 h-3.5" />;
    case 'symptom': return <Brain className="w-3.5 h-3.5" />;
    default: return <Search className="w-3.5 h-3.5" />;
  }
};

const ConceptBadge = ({ type }: { type: SearchConcept['type'] }) => {
  const styles = {
    pathology: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    molecule: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    category: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    symptom: 'bg-violet-500/10 text-violet-400 border-violet-500/20'
  };
  
  const labels = {
    pathology: 'Patología',
    molecule: 'Molécula',
    category: 'Categoría',
    symptom: 'Síntoma'
  };

  return (
    <span className={`text-[9px] uppercase tracking-tighter px-1.5 py-0.5 rounded border ${styles[type]}`}>
      {labels[type]}
    </span>
  );
};

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
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Conceptos Conocidos</span>
        <span className="text-[10px] text-slate-600 pr-2 italic">Usa ↑↓ para navegar</span>
      </div>
      <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        {suggestions.map((concept, index) => (
          <button
            key={concept.id}
            className={`w-full flex items-center gap-3 p-3 text-left transition-colors border-b border-slate-800/30 last:border-0 ${
              index === highlightedIndex ? 'bg-brand-primary/20 text-white' : 'hover:bg-slate-800/60 text-slate-300'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(concept);
            }}
          >
            <div className={`p-2 rounded-lg flex-shrink-0 ${
               index === highlightedIndex ? 'bg-brand-primary/30 text-brand-primary' : 'bg-slate-800 text-slate-500'
            }`}>
              <ConceptIcon type={concept.type} />
            </div>
            
            <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
              <span className="font-bold text-sm truncate">{concept.label}</span>
              <ConceptBadge type={concept.type} />
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
