import React, { forwardRef, useState, useEffect } from 'react';
import { Search, Loader2, X, Sparkles } from 'lucide-react';
import { SearchSuggestions } from './SearchSuggestions';
import { Product } from '../../../core/types/product.types';

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  isSearching: boolean;
  isInterpreting?: boolean;
  onAiQuery?: () => void;
  suggestions?: Product[];
  onSelectProduct?: (product: Product) => void;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({ 
  query, 
  setQuery, 
  isSearching, 
  isInterpreting, 
  onAiQuery,
  suggestions = [],
  onSelectProduct
}, ref) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const isQuestion = query.trim().endsWith('?') || 
                    ['¿', 'como', 'qué', 'que', 'para', 'cuál', 'cual', 'donde', 'dónde'].some(word => 
                      query.toLowerCase().startsWith(word)
                    );

  useEffect(() => {
    if (query.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
      setHighlightedIndex(-1);
    } else {
      setShowSuggestions(false);
    }
  }, [query, suggestions.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length && onSelectProduct) {
        onSelectProduct(suggestions[highlightedIndex]);
        setShowSuggestions(false);
      } else if (isQuestion && onAiQuery) {
        onAiQuery();
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
    <div className="relative mb-4 group">
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
          className="block w-full pl-12 pr-12 sm:pr-48 py-3 sm:py-4 bg-brand-surface/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl text-base sm:text-lg text-white shadow-xl focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all placeholder:text-slate-500"
          placeholder="Buscar o preguntar a la IA..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-2">
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
          onSelect={(p) => {
            if (onSelectProduct) onSelectProduct(p);
            setShowSuggestions(false);
          }}
        />
      </div>
    </div>
  );
});
