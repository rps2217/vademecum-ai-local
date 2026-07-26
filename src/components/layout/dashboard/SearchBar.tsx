/**
 * SearchBar - Componente de búsqueda mejorado
 * Autocompletado, sugerencias, búsqueda fonética
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, X, Clock, TrendingUp, Sparkles, 
  ArrowRight, Mic, Filter 
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { categorizationService } from '../../../core/categorization';
import { PRODUCT_TYPE_LABELS, THERAPEUTIC_FUNCTION_LABELS, BODY_SYSTEM_LABELS, type ProductType, type TherapeuticFunction, type BodySystem } from '../../../core/categorization';
import type { AnalyzedProduct } from '../../../types';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  products: AnalyzedProduct[];
  kb: Record<string, any>;
  // Filtros rápidos seleccionados
  selectedTypes: ProductType[];
  selectedFunctions: TherapeuticFunction[];
  selectedSystems: BodySystem[];
  onTypeToggle: (type: ProductType) => void;
  onFunctionToggle: (fn: TherapeuticFunction) => void;
  onSystemToggle: (system: BodySystem) => void;
  onClearFilters: () => void;
}

export function SearchBar({
  query,
  onQueryChange,
  products,
  kb,
  selectedTypes,
  selectedFunctions,
  selectedSystems,
  onTypeToggle,
  onFunctionToggle,
  onSystemToggle,
  onClearFilters,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cargar búsquedas recientes
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Guardar búsqueda reciente
  const saveSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Sugerencias basadas en productos
  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return [];

    const q = query.toLowerCase();
    const matches: Array<{ type: 'product' | 'principio' | 'categoria'; text: string; count: number }> = [];

    // Productos
    products.slice(0, 100).forEach(p => {
      if (p.nombre_comercial?.toLowerCase().includes(q)) {
        matches.push({ type: 'product', text: p.nombre_comercial, count: 1 });
      }
    });

    // Principios activos únicos
    const principiosSet = new Set<string>();
    products.forEach(p => {
      (p.principios_activos || []).forEach(pr => {
        if (pr.toLowerCase().includes(q)) {
          principiosSet.add(pr);
        }
      });
    });
    principiosSet.forEach(pr => {
      matches.push({ type: 'principio', text: pr, count: 0 });
    });

    // Categorías
    const categoriasSet = new Set<string>();
    products.forEach(p => {
      if (p.categoria_principal?.toLowerCase().includes(q)) {
        categoriasSet.add(p.categoria_principal);
      }
    });
    categoriasSet.forEach(cat => {
      matches.push({ type: 'categoria', text: cat, count: 0 });
    });

    return matches.slice(0, 8);
  }, [query, products]);

  // Categorías populares para chips
  const popularTypes = useMemo(() => {
    return (Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).slice(0, 4);
  }, []);

  const popularFunctions = useMemo(() => {
    return [
      THERAPEUTIC_FUNCTIONS.ANTIINFLAMATORIO,
      THERAPEUTIC_FUNCTIONS.DIGESTIVO,
      THERAPEUTIC_FUNCTIONS.INMUNOMODULADOR,
      THERAPEUTIC_FUNCTIONS.ANTIOXIDANTE,
    ];
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (text: string) => {
    onQueryChange(text);
    saveSearch(text);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveSearch(query);
      setShowSuggestions(false);
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const hasActiveFilters = selectedTypes.length > 0 || selectedFunctions.length > 0 || selectedSystems.length > 0;

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Barra de búsqueda principal */}
      <div className={cn(
        "relative transition-all duration-200",
        isFocused ? "transform scale-[1.02]" : ""
      )}>
        <div className={cn(
          "relative flex items-center bg-white rounded-2xl border-2 transition-all duration-200",
          isFocused 
            ? "border-emerald-500 shadow-lg shadow-emerald-100" 
            : "border-gray-200 hover:border-gray-300"
        )}>
          <Search className={cn(
            "w-5 h-5 ml-4 transition-colors",
            isFocused ? "text-emerald-500" : "text-gray-400"
          )} />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => { setIsFocused(true); setShowSuggestions(true); }}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por nombre, principio activo o categoría..."
            className="flex-1 px-4 py-4 text-base bg-transparent outline-none placeholder:text-gray-400"
          />
          
          {query && (
            <button
              onClick={() => onQueryChange('')}
              className="p-2 mr-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          
          <div className="h-8 w-px bg-gray-200 mx-2" />
          
          <button 
            onClick={() => inputRef.current?.focus()}
            className="p-3 mr-2 hover:bg-gray-100 rounded-xl transition-colors"
            title="Búsqueda por voz"
          >
            <Mic className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Panel de sugerencias */}
        {showSuggestions && (query || recentSearches.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
            {/* Búsquedas recientes */}
            {!query && recentSearches.length > 0 && (
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <Clock className="w-3 h-3" />
                  Recientes
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectSuggestion(search)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sugerencias */}
            {suggestions.length > 0 && (
              <div className="p-3">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <TrendingUp className="w-3 h-3" />
                  Sugerencias
                </div>
                <div className="space-y-1">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectSuggestion(s.text)}
                      className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-50 rounded-lg text-left transition-colors"
                    >
                      <Search className="w-4 h-4 text-gray-300" />
                      <span className={cn(
                        "text-sm",
                        s.type === 'product' ? "text-gray-900 font-medium" : "text-gray-600"
                      )}>
                        {s.text}
                      </span>
                      <span className="ml-auto text-xs text-gray-400 capitalize">{s.type}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tip para búsqueda */}
            {query && suggestions.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-400">
                <Sparkles className="w-5 h-5 mx-auto mb-2 text-amber-400" />
                Presiona Enter para buscar
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chips de categorías rápidas */}
      <div className="space-y-2">
        {/* Tipos de producto */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <span className="text-xs text-gray-400 shrink-0">Tipo:</span>
          {popularTypes.map(type => {
            const info = PRODUCT_TYPE_LABELS[type];
            const isSelected = selectedTypes.includes(type);
            return (
              <button
                key={type}
                onClick={() => onTypeToggle(type)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  isSelected
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600"
                )}
              >
                <span>{info.icon}</span>
                {info.name}
              </button>
            );
          })}
        </div>

        {/* Funciones terapéuticas */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <span className="text-xs text-gray-400 shrink-0">Función:</span>
          {popularFunctions.map(fn => {
            const info = THERAPEUTIC_FUNCTION_LABELS[fn];
            const isSelected = selectedFunctions.includes(fn);
            return (
              <button
                key={fn}
                onClick={() => onFunctionToggle(fn)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  isSelected
                    ? "bg-violet-500 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600"
                )}
              >
                {info.name}
              </button>
            );
          })}
        </div>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-3 h-3" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          {hasActiveFilters && `${selectedTypes.length + selectedFunctions.length + selectedSystems.length} filtros activos`}
        </span>
        <span>Ctrl+K para enfocar</span>
      </div>
    </div>
  );
}

export default SearchBar;
