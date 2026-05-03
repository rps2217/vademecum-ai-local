import React, { forwardRef, useState } from 'react';
import { Search, Loader2, X, Sparkles, Mic, MicOff } from 'lucide-react';
import { SearchSuggestions, SearchConcept } from './SearchSuggestions';
import { useVoiceRecognition } from '../../../hooks/useVoiceRecognition';

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  isSearching: boolean;
  isInterpreting?: boolean;
  onAiQuery?: () => void;
  onEnter?: (currentValue: string) => void;
  suggestions?: SearchConcept[];
  onSelectConcept?: (concept: SearchConcept) => void;
  className?: string;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({ 
  query, 
  setQuery, 
  isSearching, 
  isInterpreting, 
  onAiQuery,
  onEnter,
  suggestions = [],
  onSelectConcept,
  className = ""
}, ref) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const { isListening, supported, startListening } = useVoiceRecognition((text) => {
    setQuery(text);
  });

  const isQuestion = query.trim().endsWith('?') || 
                    ['¿', 'como', 'qué', 'que', 'para', 'cuál', 'cual', 'donde', 'dónde'].some(word => 
                      query.toLowerCase().startsWith(word)
                    );

  // Removido el useEffect que forzaba showSuggestions basado en query.length
  // para evitar que los clicks programáticos (ej: QuickDiscoveryTags) abran el dropdown.

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length && onSelectConcept) {
        onSelectConcept(suggestions[highlightedIndex]);
        setShowSuggestions(false);
      } else if (isQuestion && onAiQuery) {
        onAiQuery();
      } else if (onEnter) {
        onEnter(e.currentTarget.value);
        e.currentTarget.blur();
        setShowSuggestions(false);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
      setShowSuggestions(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Borde con gradiente animado */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r from-brand-primary via-emerald-400 to-brand-accent rounded-2xl blur transition duration-500 ${isInterpreting ? 'opacity-60 animate-pulse' : 'opacity-20 group-hover:opacity-40'}`}></div>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="h-5 w-5 text-brand-primary animate-spin" />
          ) : isInterpreting ? (
            <Sparkles className="h-5 w-5 text-brand-primary animate-pulse" />
          ) : (
            <Search className="h-5 w-5 text-brand-primary/70 group-focus-within:text-brand-primary transition-colors" />
          )}
        </div>
        <input
          ref={ref}
          type="text"
          autoComplete="off"
          className="block w-full pl-12 pr-12 sm:pr-48 py-3 sm:py-4 bg-slate-900 border border-white/10 rounded-2xl text-base sm:text-lg text-white shadow-2xl focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 transition-all placeholder:text-slate-500"
          placeholder="Buscar o preguntar a la IA..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length >= 2) {
              setShowSuggestions(true);
              setHighlightedIndex(-1);
            } else {
              setShowSuggestions(false);
            }
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-2">
          {supported && (
            <button
              onClick={startListening}
              className={`p-2 rounded-xl transition-all ${isListening ? 'bg-rose-500/20 text-rose-500 animate-pulse' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              title="Dictar búsqueda"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          {query && !isQuestion && (
            <button
              onClick={() => {
                setQuery('');
                setShowSuggestions(false);
                if (ref && typeof ref !== 'function' && ref.current) {
                    ref.current.focus();
                }
              }}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-700 shadow-sm"
            >
              <span className="hidden sm:inline">Limpiar</span> <X className="w-3.5 h-3.5" />
            </button>
          )}

          {isQuestion && query.length > 5 && (
            <button
              onClick={onAiQuery}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white bg-brand-primary hover:bg-orange-500 rounded-xl transition-all flex items-center gap-1.5 border border-brand-primary shadow-lg shadow-brand-primary/20 animate-in zoom-in duration-300"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Consultar IA</span>
              <span className="sm:hidden">Consultar</span>
            </button>
          )}

          {!isQuestion && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-xl text-xs font-medium border border-brand-primary/20">
              <Sparkles className="w-3 h-3" />
              Semántica
            </div>
          )}
        </div>

        {/* Predictive Suggestions Dropdown */}
        <SearchSuggestions 
          suggestions={suggestions}
          isVisible={showSuggestions}
          highlightedIndex={highlightedIndex}
          onSelect={(concept) => {
            if (onSelectConcept) onSelectConcept(concept);
            setShowSuggestions(false);
          }}
        />
      </div>
    </div>
  );
});
