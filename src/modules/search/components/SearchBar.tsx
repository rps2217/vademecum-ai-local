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
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          ) : isInterpreting ? (
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          )}
        </div>
        <input
          ref={ref}
          type="text"
          autoComplete="off"
          className="block w-full pl-12 pr-24 py-3.5 bg-white border border-stone-200 rounded-xl text-base text-foreground shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground hover:border-stone-300"
          placeholder="Buscar suplemento, fitoterapia o síntoma..."
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
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1.5">
          {supported && (
            <button
              onClick={startListening}
              className={`p-2 rounded-lg transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-muted-foreground hover:text-foreground hover:bg-stone-100'}`}
              title="Dictar búsqueda"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          {query && (
            <button
              onClick={() => {
                setQuery('');
                setShowSuggestions(false);
                if (ref && typeof ref !== 'function' && ref.current) {
                    ref.current.focus();
                }
              }}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-stone-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {isQuestion && query.length > 3 && (
            <button
              onClick={onAiQuery}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-emerald-600 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              IA
            </button>
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
