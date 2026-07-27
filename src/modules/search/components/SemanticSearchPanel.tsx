/**
 * SemanticSearchPanel - Panel de búsqueda semántica
 * 
 * Permite buscar ingredientes por similitud semántica
 * usando Transformers.js con chips de categorías rápidas
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Sparkles, Loader2, X } from 'lucide-react';
import { kbEmbeddingService, type SemanticSearchResult } from '../../../core/semantic-search/KBEmbeddingService';
import { logger } from '../../services/LoggerService';
import { Badge } from '@/components/ui/badge';
import { cn } from '../../../lib/utils';

const QUICK_CHIPS = [
  { id: 'fitoterapia', name: '🌿 Fitoterapia', keywords: 'planta medicinal herbal' },
  { id: 'homeopatia', name: '🏠 Homeopatía', keywords: 'remedio homeopático dilución' },
  { id: 'vitaminas', name: '💊 Vitaminas', keywords: 'vitamina suplemento' },
  { id: 'minerales', name: '💎 Minerales', keywords: 'mineral oligoelemento' },
  { id: 'probioticos', name: '🦠 Probióticos', keywords: 'flora intestinal bacteria' },
  { id: 'aceite_esencial', name: '🌸 Aceites', keywords: 'aceite esencial aromaterapia' },
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
        logger.error('Error inicializando servicio:', error, 'SemanticSearch');
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
      const searchResults = await kbEmbeddingService.search(searchQuery, 12);
      setResults(searchResults);
    } catch (error) {
      logger.error('Error en búsqueda:', error, 'SemanticSearch');
      setResults([]);
    }
    setIsLoading(false);
  }, [isReady]);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const handleChipClick = (chip: typeof QUICK_CHIPS[0]) => {
    setQuery(chip.keywords);
  };

  const getCategoryColor = (categoria: string) => {
    const colors: Record<string, string> = {
      fitoterapia: 'bg-emerald-100 text-emerald-700',
      homeopatia: 'bg-violet-100 text-violet-700',
      vitaminas: 'bg-blue-100 text-blue-700',
      minerales: 'bg-slate-100 text-slate-700',
      aminoacidos: 'bg-indigo-100 text-indigo-700',
      probioticos: 'bg-teal-100 text-teal-700',
      prebioticos: 'bg-green-100 text-green-700',
      enzimas: 'bg-orange-100 text-orange-700',
      aceite_esencial: 'bg-amber-100 text-amber-700',
    };
    return colors[categoria] || 'bg-gray-100 text-gray-700';
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
                <h2 className="text-xl font-bold text-foreground">Búsqueda Semántica IA</h2>
                <p className="text-sm text-muted-foreground">Describe lo que buscas en lenguaje natural</p>
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
              placeholder="Ej: 'algo para dormir' o 'antiinflamatorio natural'"
              className="w-full pl-12 pr-12 py-4 bg-muted rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-lg"
              autoFocus
            />
            {isLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-violet-500" />}
          </div>

          {/* Chips de categorías rápidas */}
          {!query && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground py-2">Buscar por:</span>
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => handleChipClick(chip)}
                  className="px-3 py-1.5 bg-muted hover:bg-violet-100 hover:text-violet-700 rounded-full text-sm font-medium transition-colors"
                >
                  {chip.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[450px] overflow-y-auto p-4">
          {!isReady && !isLoading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-violet-500" />
              <p className="text-muted-foreground">Inicializando motor de búsqueda...</p>
            </div>
          )}

          {isReady && !query && (
            <div className="text-center py-8">
              <Sparkles className="w-10 h-10 mx-auto mb-4 text-violet-500/50" />
              <p className="text-muted-foreground mb-2">Escribe o selecciona una categoría</p>
              <p className="text-xs text-muted-foreground">
                Prueba: "ansiedad", "dormir", "inmunidad", "articulaciones"
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                {results.length} ingredientes similares encontrados
              </p>
              {results.map((result) => (
                <button
                  key={result.ingredient.id}
                  onClick={() => onSelectIngredient?.(result.ingredient)}
                  className="w-full p-4 bg-muted/50 hover:bg-muted rounded-xl text-left transition-all group hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground group-hover:text-violet-500 transition-colors">
                          {result.ingredient.nombre}
                        </h4>
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', getCategoryColor(result.ingredient.categoria))}>
                          {result.ingredient.categoria.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {result.ingredient.textoIndexado.split(' ').slice(0, 8).join(' ')}...
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-lg font-bold text-violet-500">
                          {(result.score * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {query && results.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Search className="w-10 h-10 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Sin resultados para "{query}"</p>
              <p className="text-xs text-muted-foreground mt-2">Prueba con otras palabras</p>
            </div>
          )}
        </div>

        {/* Footer con stats */}
        {stats && (
          <div className="px-6 py-3 bg-muted/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>{stats.totalIngredients} ingredientes en base de conocimiento</span>
            <Badge variant={stats.hasTransformers ? 'default' : 'secondary'} className="text-[10px]">
              {stats.hasTransformers ? '✨ IA Local' : 'Fallback'}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
