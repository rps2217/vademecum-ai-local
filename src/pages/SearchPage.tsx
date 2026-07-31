/**
 * SearchPage - Pagina de busqueda rediseñada
 * 
 * Busqueda con filtros avanzados y resultados visualizados.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ingredientSearchService, type SearchResult } from '@/core/search';
import { SearchInput } from '@/ui/SearchInput';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Select } from '@/ui/Select';
import { Search, Filter, Star, BookOpen, Leaf, FlaskConical } from 'lucide-react';
import { IngredientDetail } from '@/ui/IngredientDetail';
import type { DbIngredient, IngredientCategory, BodySystem, EvidenceLevel } from '@/db/schema';
import { logger } from '@/lib/logger';

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
  { value: 'A', label: 'Evidencia alta' },
  { value: 'B', label: 'Evidencia media' },
  { value: 'C', label: 'Evidencia baja' },
];

const CATEGORY_CONFIG: Record<string, { icon: typeof Leaf; color: string }> = {
  fitoterapia: { icon: Leaf, color: 'bg-emerald-500/10 text-emerald-600' },
  homeopatia: { icon: FlaskConical, color: 'bg-blue-500/10 text-blue-600' },
  aceite_esencial: { icon: FlaskConical, color: 'bg-amber-500/10 text-amber-600' },
  vitamina: { icon: BookOpen, color: 'bg-violet-500/10 text-violet-600' },
  mineral: { icon: BookOpen, color: 'bg-slate-500/10 text-slate-600' },
  probiotico: { icon: Leaf, color: 'bg-pink-500/10 text-pink-600' },
};

const EVIDENCE_CONFIG: Record<string, { label: string; color: string }> = {
  A: { label: 'Alta', color: 'bg-green-100 text-green-800' },
  B: { label: 'Media', color: 'bg-blue-100 text-blue-800' },
  C: { label: 'Baja', color: 'bg-yellow-100 text-yellow-800' },
  D: { label: 'Muy baja', color: 'bg-gray-100 text-gray-800' },
};

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState('');
  const [system, setSystem] = useState('');
  const [evidence, setEvidence] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<DbIngredient | null>(null);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchResults = await ingredientSearchService.search({
          query: query.length >= 2 ? query : undefined,
          category: category as IngredientCategory | undefined,
          system: system as BodySystem | undefined,
          evidenceLevel: evidence as EvidenceLevel | undefined,
        });
        setResults(searchResults);
      } catch (error) {
        logger.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, category, system, evidence]);

  const hasFilters = category || system || evidence;
  const activeFiltersCount = [category, system, evidence].filter(Boolean).length;

  const getCategoryConfig = (cat: string) => {
    return CATEGORY_CONFIG[cat] || { icon: Leaf, color: 'bg-gray-500/10 text-gray-600' };
  };

  const getEvidenceConfig = (ev: string) => {
    return EVIDENCE_CONFIG[ev] || EVIDENCE_CONFIG.C;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Busqueda</h1>
        <p className="text-muted-foreground mt-1">
          Encuentra ingredientes, sintomas y categorias
        </p>
      </div>

      {/* Search Input */}
      <div className="max-w-2xl">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por nombre, sinonimo o indicacion..."
         
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-muted transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>
          )}
        </button>
        
        {results.length > 0 && query.length >= 2 && (
          <p className="text-sm text-muted-foreground">
            {results.length} resultado{results.length !== 1 ? 's' : ''}
            {query && ` para "${query}"`}
          </p>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-4">
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
          
          {hasFilters && (
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => {
                  setCategory('');
                  setSystem('');
                  setEvidence('');
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Limpiar todos los filtros
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Results */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((result) => {
            const catConfig = getCategoryConfig(result.ingredient.categoria);
            const evConfig = getEvidenceConfig(result.ingredient.evidencia);
            const CatIcon = catConfig.icon;

            return (
              <Card 
                key={result.ingredient.id} 
                className="p-4 hover:border-primary transition-all cursor-pointer"
                onClick={() => setSelectedIngredient(result.ingredient)}
              >
                {/* Header with Icon */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${catConfig.color}`}>
                    <CatIcon className="w-4 h-4" />
                  </div>
                  {result.score > 50 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {result.score}
                    </Badge>
                  )}
                </div>

                {/* Name */}
                <h3 className="font-semibold text-lg mb-1">
                  {result.ingredient.nombre}
                </h3>

                {/* Synonyms */}
                {result.ingredient.sinonimos && result.ingredient.sinonimos.length > 0 && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                    {result.ingredient.sinonimos.slice(0, 3).join(', ')}
                  </p>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {result.ingredient.categoria}
                  </Badge>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${evConfig.color}`}>
                    Ev. {evConfig.label}
                  </span>
                </div>

                {/* Systems */}
                {result.ingredient.sistemas && result.ingredient.sistemas.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {result.ingredient.sistemas.slice(0, 2).map((sys) => (
                      <Badge key={sys} variant="outline" className="text-xs">
                        {sys}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Indications Preview */}
                {result.ingredient.indicaciones && result.ingredient.indicaciones.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {result.ingredient.indicaciones.slice(0, 2).join(', ')}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      ) : query.length >= 2 && !isSearching ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">
            No se encontraron resultados para "{query}"
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Prueba con otros terminos o elimina los filtros
          </p>
          {hasFilters && (
            <button
              onClick={() => {
                setCategory('');
                setSystem('');
                setEvidence('');
              }}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Escribe al menos 2 caracteres para buscar
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedIngredient && (
        <IngredientDetail
          ingredient={selectedIngredient}
          onClose={() => setSelectedIngredient(null)}
          onViewSynergies={(id) => {
            setSelectedIngredient(null);
            navigate(`/synergies?ingredient=${id}`);
          }}
        />
      )}
    </div>
  );
}
