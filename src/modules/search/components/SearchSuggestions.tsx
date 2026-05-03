import React from 'react';
import { Search, Brain, Zap, FlaskConical, Thermometer, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
    case 'pathology': return <Thermometer className="h-3.5 w-3.5" />;
    case 'molecule': return <FlaskConical className="h-3.5 w-3.5" />;
    case 'category': return <Zap className="h-3.5 w-3.5" />;
    case 'symptom': return <Brain className="h-3.5 w-3.5" />;
    default: return <Search className="h-3.5 w-3.5" />;
  }
};

const ConceptBadge = ({ type }: { type: SearchConcept['type'] }) => {
  const styles = {
    pathology: 'bg-red-50 text-red-700 border-red-100',
    molecule: 'bg-blue-50 text-blue-700 border-blue-100',
    category: 'bg-amber-50 text-amber-700 border-amber-100',
    symptom: 'bg-purple-50 text-purple-700 border-purple-100'
  };
  
  const labels = {
    pathology: 'Patología',
    molecule: 'Molécula',
    category: 'Categoría',
    symptom: 'Síntoma'
  };

  return (
    <Badge variant="outline" className={cn("text-[9px] uppercase tracking-tighter px-1.5 py-0", styles[type])}>
      {labels[type]}
    </Badge>
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
    <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="p-3 border-b bg-muted/20 flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-2">Conceptos Clínicos Relacionados</span>
        <span className="text-[10px] text-muted-foreground/60 pr-2 italic">Usa ↑↓ para navegar</span>
      </div>
      <div className="max-h-[350px] overflow-y-auto">
        {suggestions.map((concept, index) => (
          <button
            key={concept.id}
            className={cn(
              "w-full flex items-center gap-4 p-4 text-left transition-all border-b last:border-0",
              index === highlightedIndex 
                ? 'bg-accent/10 border-l-4 border-l-primary' 
                : 'hover:bg-accent/5'
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(concept);
            }}
          >
            <div className={cn(
              "p-2.5 rounded-xl transition-colors",
              index === highlightedIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              <ConceptIcon type={concept.type} />
            </div>
            
            <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
              <span className={cn(
                "font-bold text-[15px] truncate",
                index === highlightedIndex ? 'text-foreground' : 'text-foreground/80'
              )}>
                {concept.label}
              </span>
              <ConceptBadge type={concept.type} />
            </div>

            <ChevronRight className={cn(
              "w-4 h-4 flex-shrink-0 transition-transform",
              index === highlightedIndex ? 'translate-x-1 text-primary' : 'text-muted-foreground/30'
            )} />
          </button>
        ))}
      </div>
    </div>
  );
};
