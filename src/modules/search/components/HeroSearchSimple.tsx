/**
 * HeroSearch - Buscador Minimalista
 * El protagonista absoluto de la aplicación
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, ArrowRight, X } from 'lucide-react';
import { searchService } from '../../../services/SearchService';
import { cn } from '../../../lib/utils';
import type { Product } from '../../../core/types';

interface HeroSearchSimpleProps {
  onSearch: (query: string) => void;
  onSelectProduct?: (product: Product) => void;
}

export function HeroSearchSimple({ onSearch, onSelectProduct }: HeroSearchSimpleProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Enfocar input al cargar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar productos con debounce usando SearchService local
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchResults = await searchService.search(query);
        setResults(searchResults.slice(0, 8));
      } catch (error) {
        console.error('Error buscando:', error);
        setResults([]);
      }
      setIsSearching(false);
    }, 150);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowDropdown(false);
    }
  };

  // Seleccionar producto del dropdown
  const handleProductClick = (product: Product) => {
    onSelectProduct?.(product);
    setShowDropdown(false);
    setQuery('');
  };

  // Limpiar
  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (query) {
          handleClear();
        } else {
          setShowDropdown(false);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [query, handleClear]);

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto relative">
      {/* Form de búsqueda */}
      <form onSubmit={handleSubmit} className="relative">
        {/* Input */}
        <div className="relative group">
          {/* Icono */}
          <div className="absolute left-5 top-1/2 -translate-y-1/2">
            {isSearching ? (
              <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            ) : (
              <Search className="w-6 h-6 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
            )}
          </div>

          {/* Campo */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Busca un producto o ingrediente..."
            className={cn(
              "w-full pl-14 pr-12 py-5",
              "text-xl font-medium",
              "bg-white/90 backdrop-blur-xl",
              "rounded-2xl shadow-xl",
              "border-2 border-transparent",
              "placeholder:text-slate-400",
              "focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20",
              "transition-all duration-200"
            )}
            autoComplete="off"
            spellCheck="false"
          />

          {/* Botón derecho */}
          {query ? (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!query.trim()}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2",
                "px-5 py-2.5 rounded-xl",
                "bg-violet-600 text-white font-semibold",
                "flex items-center gap-2",
                "transition-all duration-200",
                "hover:bg-violet-700 hover:scale-105",
                "disabled:opacity-50 disabled:hover:scale-100"
              )}
            >
              <span>Buscar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown de resultados */}
      {showDropdown && (query.trim() || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden z-50">
          {/* Productos encontrados */}
          {results.length > 0 && (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400 uppercase">
                📦 {results.length} productos encontrados
              </div>
              <div className="space-y-1">
                {results.map((product) => {
                  const principles = Array.isArray(product.principios_activos) 
                    ? product.principios_activos 
                    : [];
                  return (
                    <button
                      key={product.sku}
                      onClick={() => handleProductClick(product)}
                      className="w-full p-3 text-left bg-slate-50 hover:bg-violet-50 rounded-xl transition-all group"
                    >
                      <p className="font-medium text-slate-800 group-hover:text-violet-700 line-clamp-1">
                        {product.nombre_comercial || product.sku}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {principles.slice(0, 2).join(', ')}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sin resultados */}
          {query.trim() && results.length === 0 && !isSearching && (
            <div className="p-8 text-center">
              <p className="text-slate-500 mb-2">No encontramos "{query}"</p>
              <p className="text-sm text-slate-400">Presiona Enter para buscar en todos los productos</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
