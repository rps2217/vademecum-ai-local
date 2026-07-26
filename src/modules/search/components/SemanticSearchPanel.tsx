/**
 * SemanticSearchPanel - Panel de búsqueda semántica
 * 
 * Permite buscar ingredientes por similitud semántica
 * usando Transformers.js
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Sparkles, Database, Loader2, X, Filter, ChevronDown } from 'lucide-react';
import { kbEmbeddingService, type SemanticSearchResult } from '../../../core/semantic-search/KBEmbeddingService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { knowledgeLoader } from '../../../core/knowledge-base';
import { cn } from '../../../lib/utils';

const CATEGORIES = [
  { id: 'all', name: 'Todos', color: 'bg-gray-100 text-gray-700' },
  { id: 'fitoterapia', name: 'Fitoterapia', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'homeopatia', name: 'Homeopatía', color: 'bg-violet-100 text-violet-700' },
  { id: 'aceite_esencial', name: 'Aceites', color: 'bg-amber-100 text-amber-700' },
  { id: 'vitaminas', name: 'Vitaminas', color: 'bg-blue-100 text-blue-700' },
  { id: 'minerales', name: 'Minerales', color: 'bg-slate-100 text-slate-700' },
  { id: 'aminoacidos', name: 'Aminoácidos', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'probioticos', name: 'Probióticos', color: 'bg-teal-100 text-teal-700' },
  { id: 'prebioticos', name: 'Prebióticos', color: 'bg-green-100 text-green-700' },
  { id: 'enzimas', name: 'Enzimas', color: 'bg-orange-100 text-orange-700' },
];

interface SemanticSearchPanelProps {
  onClose?: () => void;
  onSelectIngredient?: (ingredient: any) => void;
}

export function SemanticSearchPanel({ onClose, onSelectIngredient }: SemanticSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategories, setShowCategories] = useState(false);
  const [stats, setStats] = useState<{ totalIngredients: number; indexed: number } | null>(null);

  // Inicializar servicio
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await kbEmbeddingService.init();
        setIsReady(true);
        setStats(kbEmbeddingService.getStats());
      } catch (error) {
        console.error('Error inicializando servicio:', error);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  // Búsqueda
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!isReady || !searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await kbEmbeddingService.search(
        searchQuery,
        15,
        selectedCategory !== 'all' ? selectedCategory : undefined
      );
      setResults(searchResults);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setResults([]);
    }
    setIsLoading(false);
  }, [isReady, selectedCategory]);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const getCategoryStyle = (categoryId: string) => {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat?.color || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="w-full max-w-2xl bg-card rounded-3xl shadow-2xl border border-border overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-violet-500/10 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Búsqueda Semántica</h2>
                <p className="text-sm text-muted-foreground">Encuentra ingredientes por similitud de significado</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: 'suplemento para dormir' o 'antiinflamatorio natural'"
              className="w-full pl-12 pr-4 py-3 bg-muted rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              autoFocus
            />
            {isLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-violet-500" />}
          </div>

          {/* Filtro de categoría */}
          <div className="mt-4">
            <button
              onClick={() => setShowCategories(!showCategories)}
              className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {CATEGORIES.find(c => c.id === selectedCategory)?.name || 'Todos'}
              <ChevronDown className={cn('w-4 h-4 transition-transform', showCategories && 'rotate-180')} />
            </button>

            {showCategories && (
              <div className="mt-2 p-2 bg-muted rounded-xl grid grid-cols-3 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setShowCategories(false);
                    }}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      cat.color,
                      selectedCategory === cat.id && 'ring-2 ring-violet-500'
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="px-6 py-3 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Database className="w-3.5 h-3.5" />
                {stats.totalIngredients} ingredientes
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {stats.indexed} indexados
              </span>
              <Badge variant={stats.hasTransformers ? 'default' : 'secondary'} className="text-xs">
                {stats.hasTransformers ? 'IA Local' : 'Fallback'}
              </Badge>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-4">
          {!isReady && !isLoading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-violet-500" />
              <p className="text-muted-foreground">Inicializando motor de búsqueda semántica...</p>
            </div>
          )}

          {isReady && !query && (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-violet-500/50" />
              <p className="text-muted-foreground">Escribe algo para buscar ingredientes similares</p>
              <p className="text-xs text-muted-foreground mt-2">
                Prueba: "ansiedad", "dormir mejor", "inmunidad", "articulaciones"
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground mb-2">
                {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((result, idx) => (
                <button
                  key={result.ingredient.id}
                  onClick={() => onSelectIngredient?.(result.ingredient)}
                  className="w-full p-4 bg-muted/50 hover:bg-muted rounded-xl text-left transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground group-hover:text-violet-500 transition-colors">
                          {result.ingredient.nombre}
                        </h4>
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', getCategoryStyle(result.ingredient.categoria))}>
                          {CATEGORIES.find(c => c.id === result.ingredient.categoria)?.name || result.ingredient.categoria}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {result.ingredient.textoIndexado.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-lg font-bold text-violet-500">
                        {(result.score * 100).toFixed(0)}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">similitud</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {query && results.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No se encontraron resultados para "{query}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
