import React from 'react';
import { Search, Loader2, X, Sparkles } from 'lucide-react';

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  isSearching: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ query, setQuery, isSearching }) => {
  return (
    <div className="relative mb-4">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        {isSearching ? (
          <Loader2 className="h-5 w-5 text-brand-primary animate-spin" />
        ) : (
          <Search className="h-5 w-5 text-slate-500" />
        )}
      </div>
      <input
        type="text"
        className="block w-full pl-12 pr-32 py-4 bg-brand-surface border border-slate-800 rounded-2xl text-lg text-white shadow-sm focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all placeholder:text-slate-600"
        placeholder="Buscar por SKU, nombre, principio activo, indicación o síntoma..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-2">
        {query && (
          <button
            onClick={() => setQuery('')}
            className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-700 shadow-sm"
            title="Limpiar búsqueda"
          >
            Limpiar <X className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-xl text-xs font-medium border border-brand-primary/20">
          <Sparkles className="w-3 h-3" />
          Semántica
        </div>
      </div>
    </div>
  );
};
