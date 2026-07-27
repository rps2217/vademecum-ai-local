/**
 * HeroSearch - Buscador Protagonista
 * 
 * El buscador es el elemento central y más prominente de la aplicación.
 * Minimalista pero extremadamente poderoso.
 * 
 * Características:
 * - Input gigante que ocupa toda la atención
 * - Chips inteligentes que se auto-organizan
 * - Búsqueda en tiempo real
 * - Animaciones fluidas
 * - Integración con Supabase para productos cloud
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Sparkles, X, ArrowRight, Loader2, TrendingUp, Cloud } from 'lucide-react';
import { smartChipEngine, type SmartChip } from '../../../core/smart-search/SmartChipEngine';
import { kbEmbeddingService } from '../../../core/semantic-search/KBEmbeddingService';
import { supabaseSyncService, type CloudProduct } from '../../../services/SupabaseSyncService';
import { cn } from '../../../lib/utils';

interface HeroSearchProps {
  onSearch: (query: string) => void;
  onSelectIngredient?: (ingredient: any) => void;
  onSelectProduct?: (product: CloudProduct) => void;
  placeholder?: string;
}

export function HeroSearch({ onSearch, onSelectIngredient, onSelectProduct, placeholder = '¿Qué necesitas hoy? Describe en pocas palabras...' }: HeroSearchProps) {
  const [query, setQuery] = useState('');
  const [chips, setChips] = useState<SmartChip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [cloudProducts, setCloudProducts] = useState<CloudProduct[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Inicializar motor de chips y Supabase
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          smartChipEngine.init(),
          kbEmbeddingService.init(),
          supabaseSyncService.fetchAllProducts()
        ]);
        setChips(smartChipEngine.getChips({ limit: 10 }));
      } catch (error) {
        logger.error('Error inicializando:', error, 'HeroSearch');
      }
      setIsLoading(false);
    };
    init();
  }, []);

  // Actualizar chips cuando cambia la query
  useEffect(() => {
    if (!query.trim()) {
      setChips(smartChipEngine.getChips({ limit: 10 }));
      setSuggestions([]);
      setCloudProducts([]);
      return;
    }

    // Actualizar chips basados en query
    const relevantChips = smartChipEngine.getChipsForQuery(query).slice(0, 8);
    setChips(relevantChips);

    // Buscar sugerencias
    const searchSuggestions = async () => {
      setIsSearching(true);
      try {
        // Buscar ingredientes locales
        const results = await kbEmbeddingService.search(query, 5);
        setSuggestions(results.map(r => r.ingredient));
        
        // Buscar productos en Supabase
        const products = await supabaseSyncService.searchProducts(query);
        setCloudProducts(products.slice(0, 8));
        
        smartChipEngine.registerSearch(query);
      } catch (error) {
        logger.error('Error buscando:', error, 'HeroSearch');
      }
      setIsSearching(false);
    };

    const timeout = setTimeout(searchSuggestions, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manejar submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  // Manejar click en chip
  const handleChipClick = (chip: SmartChip) => {
    setQuery(chip.keywords[0]);
    onSearch(chip.keywords[0]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Manejar selección de sugerencia
  const handleSuggestionClick = (ingredient: any) => {
    setQuery(ingredient.nombre);
    onSelectIngredient?.(ingredient);
    setShowSuggestions(false);
  };

  // Manejar selección de producto cloud
  const handleProductClick = (product: CloudProduct) => {
    setQuery(product.data?.nombre_comercial || product.nombre_comercial || product.sku);
    onSelectProduct?.(product);
    setShowSuggestions(false);
  };

  // Detectar intención y mostrar chips relevantes
  const suggestedChips = useMemo(() => {
    if (!query.trim()) return chips;
    return smartChipEngine.detectIntentAndSuggest(query).slice(0, 6);
  }, [query, chips]);

  return (
    <div ref={containerRef} className="w-full max-w-3xl mx-auto relative">
      {/* Form de búsqueda principal */}
      <form onSubmit={handleSubmit} className="relative">
        {/* Input gigante - EL PROTAGONISTA */}
        <div className="relative group">
          {/* Glow effect cuando está enfocado */}
          <div className={cn(
            "absolute -inset-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-0 transition-opacity duration-500",
            showSuggestions && "opacity-30"
          )} />
          
          {/* Input */}
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
            
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder={placeholder}
              className={cn(
                "w-full pl-16 pr-32 py-6 bg-white/95 backdrop-blur-xl rounded-3xl",
                "text-2xl font-medium text-slate-900 placeholder:text-slate-400",
                "border-2 border-transparent shadow-2xl",
                "focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20",
                "transition-all duration-300"
              )}
              autoComplete="off"
              spellCheck="false"
            />

            {/* Loading spinner */}
            {isSearching && (
              <Loader2 className="absolute right-24 top-1/2 -translate-y-1/2 w-6 h-6 text-violet-500 animate-spin" />
            )}

            {/* Botón de búsqueda */}
            <button
              type="submit"
              disabled={!query.trim()}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 px-6 py-3 rounded-2xl",
                "bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold",
                "flex items-center gap-2 transition-all duration-300",
                "hover:from-violet-700 hover:to-purple-700 hover:scale-105",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                "shadow-lg shadow-violet-500/25"
              )}
            >
              <span>Buscar</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </form>

      {/* Panel de sugerencias desplegable */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-4 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Sugerencias de ingredientes */}
          {suggestions.length > 0 && (
            <div className="p-4 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Ingredientes relacionados
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((ing) => (
                  <button
                    key={ing.id}
                    onClick={() => handleSuggestionClick(ing)}
                    className="px-4 py-2 bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 rounded-xl text-sm font-medium text-slate-700 transition-all hover:scale-105"
                  >
                    {ing.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Productos de la nube (Supabase) */}
          {cloudProducts.length > 0 && (
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/30 to-teal-50/30">
              <div className="flex items-center gap-2 mb-3">
                <Cloud className="w-4 h-4 text-emerald-600" />
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Productos ({cloudProducts.length})
                </p>
              </div>
              <div className="space-y-2">
                {cloudProducts.map((product) => (
                  <button
                    key={product.sku}
                    onClick={() => handleProductClick(product)}
                    className="w-full p-3 bg-white/80 hover:bg-white rounded-xl text-left transition-all hover:shadow-md group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 text-sm group-hover:text-emerald-600 transition-colors truncate">
                          {product.data?.nombre_comercial || product.nombre_comercial || product.sku}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">
                          {product.data?.principios_activos?.slice(0, 2).join(', ') || 'Sin principios activos'}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{product.sku.slice(0, 8)}...</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chips inteligentes */}
          {suggestedChips.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                {query ? (
                  <>
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    <p className="text-xs font-bold text-violet-600 uppercase tracking-wider">
                      Sugerencias para "{query}"
                    </p>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Búsquedas populares
                    </p>
                  </>
                )}
              </div>
              
              {/* Chips en grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {suggestedChips.map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => handleChipClick(chip)}
                    className={cn(
                      "px-4 py-3 rounded-2xl text-left transition-all duration-200",
                      "bg-slate-50 hover:bg-gradient-to-br hover:from-violet-50 hover:to-purple-50",
                      "border border-slate-200 hover:border-violet-300",
                      "hover:shadow-md hover:scale-[1.02]",
                      "group"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{chip.icon}</span>
                      <span className="font-bold text-slate-800 text-sm group-hover:text-violet-700 transition-colors">
                        {chip.label.replace(/^[^\s]+\s/, '')}
                      </span>
                    </div>
                    {chip.count > 0 && (
                      <p className="text-[10px] text-slate-400 ml-7">
                        {chip.count} opciones
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-violet-500 mb-2" />
              <p className="text-sm text-slate-500">Inicializando...</p>
            </div>
          )}
        </div>
      )}

      {/* Chips de acceso rápido (siempre visibles debajo) */}
      {!showSuggestions && !isLoading && chips.length > 0 && (
        <div className="mt-6 animate-in fade-in duration-500">
          <div className="flex flex-wrap justify-center gap-2">
            {chips.slice(0, 6).map((chip) => (
              <button
                key={chip.id}
                onClick={() => handleChipClick(chip)}
                className={cn(
                  "px-4 py-2 rounded-full transition-all duration-200",
                  "bg-white/80 backdrop-blur-sm border border-slate-200",
                  "hover:bg-gradient-to-r hover:from-violet-500 hover:to-purple-500",
                  "hover:text-white hover:border-transparent hover:shadow-lg hover:scale-105",
                  "text-sm font-medium text-slate-600",
                  "group"
                )}
              >
                <span className="mr-1 group-hover:hidden">{chip.icon}</span>
                <span className="hidden group-hover:inline mr-1">✨</span>
                <span>{chip.label.replace(/^[^\s]+\s/, '')}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
