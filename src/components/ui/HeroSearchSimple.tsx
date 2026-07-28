/**
 * HeroSearchSimple - Búsqueda simple con nuevo DS
 * 
 * Componente de búsqueda que usa los nuevos componentes de UI.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { SearchInput, Card, CardContent, Badge, Button } from '@/ui';
import { useIngredients, useSearchHistory } from '@/db';
import { Sparkles, ArrowRight, Database, Link2, FlaskConical, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'ingredient' | 'product';
  nombre: string;
  categoria?: string;
  evidencia?: string;
  sistemas?: string[];
}

interface HeroSearchSimpleProps {
  onSelectResult?: (result: SearchResult) => void;
  className?: string;
}

export function HeroSearchSimple({ onSelectResult, className }: HeroSearchSimpleProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const ingredients = useIngredients();
  const recentSearches = useSearchHistory(5);

  // Búsqueda
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      const lowerQuery = searchQuery.toLowerCase();
      
      const ingredientResults = (ingredients || [])
        .filter(ing => 
          ing.nombre.toLowerCase().includes(lowerQuery) ||
          ing.sinonimos.some(s => s.toLowerCase().includes(lowerQuery))
        )
        .slice(0, 12)
        .map(ing => ({
          id: ing.id,
          type: 'ingredient' as const,
          nombre: ing.nombre,
          categoria: ing.categoria,
          evidencia: ing.evidencia,
          sistemas: ing.sistemas,
        }));

      setResults(ingredientResults);
    } finally {
      setIsSearching(false);
    }
  }, [ingredients]);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => performSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const getCategoryIcon = (categoria?: string) => {
    switch (categoria) {
      case 'fitoterapia': return <FlaskConical className="w-4 h-4" />;
      case 'vitamina': return <Database className="w-4 h-4" />;
      default: return <Link2 className="w-4 h-4" />;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          100% offline, sin suscripciones
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          ¿Qué buscas?
        </h1>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <SearchInput
          value={query}
          onChange={setQuery}
          onSearch={performSearch}
          placeholder="Buscar ingredientes..."
          recentSearches={recentSearches.map(s => s.query)}
          onSelectSuggestion={setQuery}
          autoFocus
        />
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {results.map(result => (
            <Card
              key={result.id}
              hoverable
              onClick={() => onSelectResult?.(result)}
              className="cursor-pointer"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {result.nombre}
                    </h3>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" size="sm">
                        {getCategoryIcon(result.categoria)}
                        <span className="ml-1 capitalize">
                          {result.categoria?.replace('_', ' ')}
                        </span>
                      </Badge>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Loading */}
      {isSearching && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty */}
      {query && results.length === 0 && !isSearching && (
        <div className="text-center py-8">
          <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Sin resultados para "{query}"</p>
        </div>
      )}
    </div>
  );
}
