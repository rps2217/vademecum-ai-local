/**
 * SearchPage - Página de búsqueda
 */

import { useState, useEffect } from 'react';
import { db } from '@/db';
import { SearchInput } from '@/ui/SearchInput';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import type { Ingredient } from '@/db/schema';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Ingredient[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchResults = await db.ingredients
          .filter((ing) => 
            ing.nombre.toLowerCase().includes(query.toLowerCase()) ||
            (ing.indicaciones && ing.indicaciones.some(i => i.toLowerCase().includes(query.toLowerCase())))
          )
          .limit(20)
          .toArray();
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Búsqueda</h1>
        <p className="text-muted-foreground mt-1">
          Encuentra ingredientes, síntomas y categorías
        </p>
      </div>

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar ingredientes..."
        isLoading={isSearching}
      />

      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((ingredient) => (
            <Card key={ingredient.id} className="p-4">
              <h3 className="font-semibold">{ingredient.nombre}</h3>
              <Badge variant="default" className="mt-2">
                {ingredient.categoria}
              </Badge>
              {ingredient.indicaciones && ingredient.indicaciones.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {ingredient.indicaciones.slice(0, 3).join(', ')}
                </p>
              )}
            </Card>
          ))}
        </div>
      ) : query.length >= 2 && !isSearching ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron resultados</p>
        </div>
      ) : null}
    </div>
  );
}
