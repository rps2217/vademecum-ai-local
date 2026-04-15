import React from 'react';
import { Search, Loader2, X, Sparkles } from 'lucide-react';

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  isSearching: boolean;
  onAiQuery?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ query, setQuery, isSearching, onAiQuery }) => {
  const isQuestion = query.trim().endsWith('?') || 
                    ['¿', 'como', 'qué', 'que', 'para', 'cuál', 'cual', 'donde', 'dónde'].some(word => 
                      query.toLowerCase().startsWith(word)
                    );

  return (
    <div className="relative mb-4 group">
      {/* Borde con gradiente animado */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary via-indigo-500 to-brand-accent rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="h-5 w-5 text-brand-primary animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-brand-primary/70 group-focus-within:text-brand-primary transition-colors" />
          )}
        </div>
        <input
          type="text"
          className="block w-full pl-12 pr-12 sm:pr-48 py-3 sm:py-4 bg-brand-surface/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl text-base sm:text-lg text-white shadow-xl focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all placeholder:text-slate-500"
          placeholder="Buscar o preguntar a la IA..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isQuestion && onAiQuery) {
              onAiQuery();
            }
          }}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-2">
          {query && !isQuestion && (
            <button
              onClick={() => setQuery('')}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-700 shadow-sm"
            >
              <span className="hidden sm:inline">Limpiar</span> <X className="w-3.5 h-3.5" />
            </button>
          )}

          {isQuestion && query.length > 5 && (
            <button
              onClick={onAiQuery}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all flex items-center gap-1.5 border border-indigo-500 shadow-lg shadow-indigo-500/20 animate-in zoom-in duration-300"
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
      </div>
    </div>
  );
};
