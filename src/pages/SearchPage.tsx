/**
 * SearchPage - Pagina de busqueda
 */

import { useState, useEffect, useMemo } from 'react';
import { ingredientSearchService, type SearchResult } from '@/core/search';
import { SearchInput } from '@/ui/SearchInput';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Select } from '@/ui/Select';
import { Search, Filter, Star } from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'Todas las categorias' },
  { value: 'fitoterapia', label: 'Fitoterapia' },
  { value: 'homeopatia', label: 'Homeopatia' },
  { value: 'aceite_esencial', label: 'Aceites esenciales' },
  { value: 'vitamina', label: 'Vitaminas' },
  { value: 'mineral', label: 'Minerales' },
  { value: 'probiotico', label: 'Probioticos' },
];

const SYSTEMS = [
  { value: '', label: 'Todos los sistemas' },
  { value: 'nervioso', label: 'Sistema nervioso' },
  { value: 'digestivo', label: 'Sistema digestivo' },
  { value: 'inmune', label: 'Sistema inmunitario' },
  { value: 'cardiovascular', label: 'Sistema cardiovascular' },
  { value: 'respiratorio', label: 'Sistema respiratorio' },
  { value: 'musculoesqueletico', label: 'Sistema musculoesqueletico' },
  { value: 'endocrino', label: 'Sistema endocrino' },
];

const EVIDENCE_LEVELS = [
  { value: '', label: 'Cualquier evidencia' },
  { value: 'A', label: 'Evidencia alta (A)' },
  { value: 'B', label: 'Evidencia media (B)' },
  { value: 'C', label: 'Evidencia baja (C)' },
];

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [system, setSystem] = useState('');
  const [evidence, setEvidence] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchResults = await ingredientSearchService.search({
          query: query.length >= 2 ? query : undefined,
          category: category as any || undefined,
          system: system as any || undefined,
          evidenceLevel: evidence as any || undefined,
        });
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, category, system, evidence]);

  const hasFilters = category || system || evidence;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Busqueda</h1>
        <p className="text-muted-foreground mt-1">
          Encuentra ingredientes, sintomas y categorias
        </p>
      </div>

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar por nombre, sinonimo o indicacion..."
        isLoading={isSearching}
      />

      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <Filter className="w-4 h-4" />
        Filtros {hasFilters && <Badge variant="secondary">{3}</Badge>}
      </button>

      {showFilters && (
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={CATEGORIES}
              placeholder="Todas las categorias"
            />
            <Select
              label="Sistema corporal"
              value={system}
              onChange={(e) => setSystem(e.target.value)}
              options={SYSTEMS}
              placeholder="Todos los sistemas"
            />
            <Select
              label="Nivel de evidencia"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              options={EVIDENCE_LEVELS}
              placeholder="Cualquier evidencia"
            />
          </div>
        </Card>
      )}

      {results.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result) => (
              <Card key={result.ingredient.id} className="p-4 hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{result.ingredient.nombre}</h3>
                    {result.ingredient.sinonimos && result.ingredient.sinonimos.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {result.ingredient.sinonimos.slice(0, 2).join(', ')}
                      </p>
                    )}
                  </div>
                  {result.score > 50 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {result.score}
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline">
                    {result.ingredient.categoria}
                  </Badge>
                  <Badge variant="secondary">
                    Ev. {result.ingredient.evidencia}
                  </Badge>
                </div>

                {result.ingredient.indicaciones && result.ingredient.indicaciones.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {result.ingredient.indicaciones.slice(0, 3).join(', ')}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </>
      ) : query.length >= 2 && !isSearching ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No se encontraron resultados</p>
          <p className="text-sm text-muted-foreground mt-1">
            Prueba con otros terminos o elimina los filtros
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Escribe al menos 2 caracteres para buscar
          </p>
        </div>
      )}
    </div>
  );
}
