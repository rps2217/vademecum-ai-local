/**
 * SearchPage - Página de búsqueda optimizada para el mostrador de farmacia
 *
 * Paradigma condición-céntrico: al buscar un síntoma, la ficha de condición
 * aparece como resultado primario (reconocer → recomendar → proteger → derivar).
 * Los ingredientes se ordenan por evidencia (A primero) en cards compactas.
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ingredientSearchService, type SearchResult } from '@/core/search';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Select } from '@/ui/Select';
import { FilterChips, type ChipOption } from '@/ui/FilterChips';
import { ConditionCard } from '@/ui/ConditionCard';
import { Search, Filter, Star, BookOpen, Leaf, FlaskConical, X, Brain, Heart, Wind, Shield, Bone, Sparkles, Droplet, Eye, Zap, Activity, Pill } from 'lucide-react';
import { IngredientDetail } from '@/ui/IngredientDetail';
import { PathologyDetail } from '@/ui/PathologyDetail';
import { useSearch } from '@/contexts/SearchContext';
import type { DbIngredient, DbPathology, IngredientCategory, BodySystem, EvidenceLevel } from '@/db/schema';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: '', label: 'Todas las categorias' },
  { value: 'fitoterapia', label: 'Fitoterapia' },
  { value: 'homeopatia', label: 'Homeopatia' },
  { value: 'aceite_esencial', label: 'Aceites esenciales' },
  { value: 'vitamina', label: 'Vitaminas' },
  { value: 'mineral', label: 'Minerales' },
  { value: 'aminoacido', label: 'Aminoacidos' },
  { value: 'probiotico', label: 'Probioticos' },
];

const SYSTEM_CHIPS: ChipOption[] = [
  { value: 'nervioso', label: 'Nervioso', icon: Brain },
  { value: 'digestivo', label: 'Digestivo', icon: Pill },
  { value: 'inmune', label: 'Inmune', icon: Shield },
  { value: 'cardiovascular', label: 'Cardiovascular', icon: Heart },
  { value: 'respiratorio', label: 'Respiratorio', icon: Wind },
  { value: 'musculoesqueletico', label: 'Musculoesq.', icon: Bone },
  { value: 'endocrino', label: 'Endocrino', icon: Activity },
  { value: 'dermatologico', label: 'Piel', icon: Sparkles },
  { value: 'urinario', label: 'Urinario', icon: Droplet },
  { value: 'reproductivo', label: 'Reproductivo', icon: Activity },
  { value: 'ocular', label: 'Ocular', icon: Eye },
  { value: 'hepatico', label: 'Hepatico', icon: Activity },
  { value: 'metabolico', label: 'Metabolico', icon: Zap },
];

const EVIDENCE_CHIPS: ChipOption[] = [
  { value: 'A', label: 'Alta (A)', icon: Star },
  { value: 'B', label: 'Media (B)', icon: Star },
  { value: 'C', label: 'Baja (C)', icon: Star },
];

const CATEGORY_CONFIG: Record<string, { icon: typeof Leaf; color: string }> = {
  fitoterapia: { icon: Leaf, color: 'bg-emerald-500/10 text-emerald-600' },
  homeopatia: { icon: FlaskConical, color: 'bg-blue-500/10 text-blue-600' },
  aceite_esencial: { icon: FlaskConical, color: 'bg-amber-500/10 text-amber-600' },
  vitamina: { icon: BookOpen, color: 'bg-violet-500/10 text-violet-600' },
  mineral: { icon: BookOpen, color: 'bg-slate-500/10 text-slate-600' },
  probiotico: { icon: Leaf, color: 'bg-pink-500/10 text-pink-600' },
};

// Semántica de decisión: verde=recomendar, azul=informar, gris=precaución/baja
const EVIDENCE_CONFIG: Record<string, { label: string; color: string }> = {
  A: { label: 'A', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 font-medium' },
  B: { label: 'B', color: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/30 font-medium' },
  C: { label: 'C', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-1 ring-gray-500/20' },
  D: { label: 'D', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-1 ring-gray-500/20' },
};

// Orden de evidencia para sorting (A primero)
const EVIDENCE_RANK: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { query, setQuery } = useSearch();

  // Sincronizar query inicial desde URL (?q=) al contexto
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [category, setCategory] = useState('');
  const [system, setSystem] = useState('');
  const [evidence, setEvidence] = useState('');
  const [indication, setIndication] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedIngredient, setSelectedIngredient] = useState<DbIngredient | null>(null);
  const [selectedPathology, setSelectedPathology] = useState<DbPathology | null>(null);

  // Load all pathologies for quick lookup by indication
  const allPathologies = useLiveQuery(() => db.pathologies.toArray(), []);
  const pathologyByIndication = useMemo(() => {
    const m = new Map<string, DbPathology>();
    if (allPathologies) {
      for (const p of allPathologies) {
        m.set(p.id, p);
      }
    }
    return m;
  }, [allPathologies]);

  // Dynamically build indication chips from the DB
  const allIngredients = useLiveQuery(() => db.ingredients.toArray(), []);
  const indicationChips = useMemo<ChipOption[]>(() => {
    if (!allIngredients) return [];
    const counts = new Map<string, number>();
    for (const ing of allIngredients) {
      for (const ind of ing.indicaciones || []) {
        counts.set(ind, (counts.get(ind) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([value, count]) => ({ value, label: `${value} (${count})` }));
  }, [allIngredients]);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchResults = await ingredientSearchService.search({
          query: query.length >= 2 ? query : undefined,
          category: category as IngredientCategory | undefined,
          system: system as BodySystem | undefined,
          evidenceLevel: evidence as EvidenceLevel | undefined,
          indication: indication || undefined,
        });
        setResults(searchResults);
      } catch (error) {
        logger.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, category, system, evidence, indication]);

  // Detectar patología coincidente: por indicación seleccionada, por query,
  // o por coincidencia de nombre/síntomas
  const matchedPathology = useMemo(() => {
    if (!allPathologies) return null;

    // 1) Si hay indicación seleccionada y coincide con un ID de patología
    if (indication && pathologyByIndication.has(indication)) {
      return pathologyByIndication.get(indication)!;
    }

    // 2) Si la query coincide exactamente con un ID de patología
    if (query.length >= 2) {
      const q = query.toLowerCase().trim();
      // Coincidencia exacta de ID
      const exact = allPathologies.find(p => p.id === q);
      if (exact) return exact;

      // Coincidencia de nombre (contains, flexible con acentos)
      const normalize = (s: string) => s.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const nq = normalize(q);
      const nameMatch = allPathologies.find(p => {
        const np = normalize(p.nombre);
        return np === nq || np.includes(nq) || nq.includes(np);
      });
      if (nameMatch) return nameMatch;

      // Coincidencia con síntomas
      const symptomMatch = allPathologies.find(p =>
        p.sintomas.some(s => {
          const ns = normalize(s);
          return ns === nq || ns.includes(nq);
        })
      );
      if (symptomMatch) return symptomMatch;
    }

    return null;
  }, [allPathologies, pathologyByIndication, indication, query]);

  // Resultados ordenados por evidencia (A primero), luego por score
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      const rankA = EVIDENCE_RANK[a.ingredient.evidencia] ?? 3;
      const rankB = EVIDENCE_RANK[b.ingredient.evidencia] ?? 3;
      if (rankA !== rankB) return rankA - rankB;
      return b.score - a.score;
    });
  }, [results]);

  const activeFiltersCount = [category, system, evidence, indication].filter(Boolean).length;
  const hasActiveChips = system || evidence || indication;

  const clearAll = () => {
    setCategory('');
    setSystem('');
    setEvidence('');
    setIndication('');
  };

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

      {/* Chips bar + count */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-muted"
          aria-expanded={showFilters}
        >
          <Filter className="w-4 h-4" aria-hidden="true" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>
          )}
        </button>
        
        <div className="flex items-center gap-3">
          {(results.length > 0 || hasActiveChips) && (
            <p className="text-sm text-muted-foreground">
              {results.length} resultado{results.length !== 1 ? 's' : ''}
              {query && ` para "${query}"`}
            </p>
          )}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Panel */}
      {showFilters && (
        <Card className="p-4 space-y-5">
          {/* Category dropdown (kept as select for space) */}
          <div className="max-w-xs">
            <Select
              label="Categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={CATEGORIES}
              placeholder="Todas las categorias"
            />
          </div>

          {/* System chips */}
          <FilterChips
            label="Sistema corporal"
            options={SYSTEM_CHIPS}
            selected={system}
            onSelect={setSystem}
          />

          {/* Evidence chips */}
          <FilterChips
            label="Nivel de evidencia"
            options={EVIDENCE_CHIPS}
            selected={evidence}
            onSelect={setEvidence}
          />

          {/* Indication chips (dynamic from DB) */}
          {indicationChips.length > 0 && (
            <FilterChips
              label="Patologia / Indicacion"
              options={indicationChips}
              selected={indication}
              onSelect={setIndication}
            />
          )}
        </Card>
      )}

      {/* Active filter summary */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {system && (
            <Badge variant="primary" className="flex items-center gap-1">
              Sistema: {SYSTEM_CHIPS.find(s => s.value === system)?.label || system}
              <button onClick={() => setSystem('')} className="ml-1 hover:opacity-70" aria-label="Quitar filtro">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {evidence && (
            <Badge variant="primary" className="flex items-center gap-1">
              Evidencia: {evidence}
              <button onClick={() => setEvidence('')} className="ml-1 hover:opacity-70" aria-label="Quitar filtro">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {indication && (
            <Badge variant="primary" className="flex items-center gap-1">
              {indication}
              <button onClick={() => setIndication('')} className="ml-1 hover:opacity-70" aria-label="Quitar filtro">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {category && (
            <Badge variant="primary" className="flex items-center gap-1">
              {CATEGORIES.find(c => c.value === category)?.label || category}
              <button onClick={() => setCategory('')} className="ml-1 hover:opacity-70" aria-label="Quitar filtro">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {/* Contexto clínico de la patología — ahora como ficha primaria, no botón */}
        </div>
      )}

      {/* Ficha de condición como resultado primario (mostrador) */}
      {matchedPathology && (query.length >= 2 || indication) && (
        <ConditionCard
          pathology={matchedPathology}
          onIngredientClick={(id) => {
            const ing = allIngredients?.find(i => i.id === id);
            if (ing) setSelectedIngredient(ing);
          }}
          onExpand={(p) => setSelectedPathology(p)}
        />
      )}

      {/* Ingredientes — ordenados por evidencia (A primero) */}
      {sortedResults.length > 0 ? (
        <div className="space-y-3">
          {/* Contador compacto */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Ingredientes
            </h3>
            <span className="text-xs text-muted-foreground">
              {sortedResults.length} · ordenado por evidencia
            </span>
          </div>

          {/* Grid de cards compactas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {sortedResults.map((result) => {
              const catConfig = getCategoryConfig(result.ingredient.categoria);
              const evConfig = getEvidenceConfig(result.ingredient.evidencia);
              const CatIcon = catConfig.icon;

              return (
                <button
                  key={result.ingredient.id}
                  className="text-left p-3 rounded-lg bg-card border border-border hover:border-primary hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
                  onClick={() => setSelectedIngredient(result.ingredient)}
                >
                  {/* Línea 1: icono + nombre + evidencia (escaneo rápido) */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className={cn('p-1 rounded shrink-0', catConfig.color)}>
                        <CatIcon className="w-3 h-3" aria-hidden="true" />
                      </div>
                      <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {result.ingredient.nombre}
                      </h4>
                    </div>
                    <span className={cn('px-1.5 py-0.5 rounded text-xs shrink-0', evConfig.color)}>
                      {evConfig.label}
                    </span>
                  </div>

                  {/* Línea 2: 1 indicación principal (la relevante) */}
                  {result.ingredient.indicaciones && result.ingredient.indicaciones.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      {result.ingredient.indicaciones[0].replace(/_/g, ' ')}
                    </p>
                  )}

                  {/* Línea 3: score + categoría (sutil) */}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground/70 capitalize">
                      {result.ingredient.categoria.replace('_', ' ')}
                    </span>
                    {result.score > 50 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/70">
                        <Star className="w-2.5 h-2.5" aria-hidden="true" />
                        {result.score}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (query.length >= 2 || hasActiveChips) && !isSearching && !matchedPathology ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
          <p className="text-muted-foreground font-medium">
            No se encontraron resultados{query && ` para "${query}"`}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Prueba con otros terminos o ajusta los filtros
          </p>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAll}
              className="mt-4 text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : !hasActiveChips && query.length < 2 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
          <p className="text-muted-foreground">
            Escribe al menos 2 caracteres o usa los filtros para explorar
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {allIngredients?.length || 0} ingredientes · {allPathologies?.length || 0} patologías en la base de conocimiento
          </p>
        </div>
      ) : null}

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

      {/* Pathology Detail Modal */}
      {selectedPathology && (
        <PathologyDetail
          pathology={selectedPathology}
          onClose={() => setSelectedPathology(null)}
          onIngredientClick={(id) => {
            const ing = allIngredients?.find(i => i.id === id);
            if (ing) {
              setSelectedPathology(null);
              setSelectedIngredient(ing);
            }
          }}
        />
      )}
    </div>
  );
}
