/**
 * SearchPage - Vista principal optimizada para el mostrador de farmacia.
 *
 * Paradigma condición-céntrico de 3 capas:
 *   1. Ficha de condición (ConditionCard) — dominante, full-width arriba.
 *      Reconocer → Recomendar → Proteger → Derivar en una pantalla.
 *   2. Ingredientes relacionados — colapsables, paginados, ordenados por evidencia.
 *   3. Exploración — chips de patología colapsables (top 10 + ver todas).
 *
 * Performance: usa el índice invertido (ingredientSearchService.searchSync)
 * en vez de toArray+filter. Sólo se renderizan los ingredientes visibles.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ingredientSearchService, useSearchIndex } from '@/core/search';
import type { SearchResult } from '@/core/search';
import { ConditionCard } from '@/ui/ConditionCard';
import {
  Search, Star, BookOpen, Leaf, FlaskConical, X, ChevronDown,
  ChevronRight, Loader2, Pill, Clock,
} from 'lucide-react';
import { IngredientDetail } from '@/ui/IngredientDetail';
import { PathologyDetail } from '@/ui/PathologyDetail';
import { ClientProfileSelector } from '@/ui/ClientProfileSelector';
import { useClientProfile, safetyVerdictStyle, safetyVerdictBadge } from '@/contexts/ClientProfileContext';
import { useSearch } from '@/contexts/SearchContext';
import { useConsultationHistory } from '@/hooks/useConsultationHistory';
import type { DbIngredient, DbPathology, IngredientCategory } from '@/db/schema';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { humanize, normalize } from '@/lib/text';

const CATEGORIES: { value: string; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'fitoterapia', label: 'Fitoterapia' },
  { value: 'homeopatia', label: 'Homeopatía' },
  { value: 'aceite_esencial', label: 'Aceites' },
  { value: 'vitamina', label: 'Vitaminas' },
  { value: 'mineral', label: 'Minerales' },
  { value: 'aminoacido', label: 'Aminoácidos' },
  { value: 'probiotico', label: 'Probióticos' },
];

const CATEGORY_CONFIG: Record<string, { icon: typeof Leaf; color: string }> = {
  fitoterapia: { icon: Leaf, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  homeopatia: { icon: FlaskConical, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  aceite_esencial: { icon: FlaskConical, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  vitamina: { icon: Pill, color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  mineral: { icon: Pill, color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
  aminoacido: { icon: Pill, color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
  probiotico: { icon: Leaf, color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
};

const EVIDENCE_CONFIG: Record<string, { label: string; color: string; title: string }> = {
  A: { label: 'A', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 font-semibold', title: 'Evidencia alta: meta-análisis / ensayos clínicos' },
  B: { label: 'B', color: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/30 font-semibold', title: 'Evidencia media: estudios controlados' },
  C: { label: 'C', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-1 ring-gray-500/20', title: 'Evidencia baja: estudios observacionales' },
  D: { label: 'D', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-1 ring-gray-500/20', title: 'Evidencia muy baja: uso tradicional' },
};

const EVIDENCE_RANK: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
const RESULTS_PAGE_SIZE = 24;
const CHIPS_COLLAPSED_COUNT = 10;

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { query, setQuery } = useSearch();
  const { ready } = useSearchIndex();
  const { evaluateSafety } = useClientProfile();
  const { history, addEntry } = useConsultationHistory();

  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [category, setCategory] = useState('');
  const [indication, setIndication] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<DbIngredient | null>(null);
  const [selectedPathology, setSelectedPathology] = useState<DbPathology | null>(null);
  const [showAllChips, setShowAllChips] = useState(false);
  const [ingredientsExpanded, setIngredientsExpanded] = useState(true);
  const [visibleCount, setVisibleCount] = useState(RESULTS_PAGE_SIZE);

  // Patologías: cargar una sola vez (live query, pero ligero — ~146 registros)
  const allPathologies = useLiveQuery(() => db.pathologies.toArray(), []);
  const pathologyByIndication = useMemo(() => {
    const m = new Map<string, DbPathology>();
    if (allPathologies) {
      for (const p of allPathologies) m.set(p.id, p);
    }
    return m;
  }, [allPathologies]);

  // Chips de indicación dinámicos desde el índice (sin toArray extra)
  const indicationChips = useMemo(() => {
    if (!ready) return [];
    const counts = ingredientSearchService.indicationCounts();
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([value, count]) => ({ value, label: `${humanize(value)} (${count})` }));
  }, [ready]);

  // Búsqueda con debounce corto (el índice hace que sea casi instantánea)
  useEffect(() => {
    if (!ready) return;
    setIsSearching(true);
    const t = setTimeout(() => {
      try {
        const searchResults = ingredientSearchService.searchSync({
          query: query.length >= 2 ? query : undefined,
          category: (category || undefined) as IngredientCategory | undefined,
          indication: indication || undefined,
        });
        setResults(searchResults);
        setVisibleCount(RESULTS_PAGE_SIZE);
      } catch (error) {
        logger.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [query, category, indication, ready]);

  // Registrar consulta en el historial (tras debounce, solo si hay resultados)
  useEffect(() => {
    if (query.trim().length < 3) return;
    const t = setTimeout(() => {
      if (results.length > 0) addEntry(query.trim());
    }, 1200);
    return () => clearTimeout(t);
  }, [query, results.length, addEntry]);

  const matchedPathology = useMemo(() => {
    if (!allPathologies) return null;
    if (indication && pathologyByIndication.has(indication)) {
      return pathologyByIndication.get(indication)!;
    }
    if (query.length >= 2) {
      const q = query.toLowerCase().trim();
      const exact = allPathologies.find(p => p.id === q);
      if (exact) return exact;
      const nq = normalize(q);
      const nameMatch = allPathologies.find(p => {
        const np = normalize(p.nombre);
        return np === nq || np.includes(nq) || nq.includes(np);
      });
      if (nameMatch) return nameMatch;
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

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      const rankA = EVIDENCE_RANK[a.ingredient.evidencia] ?? 3;
      const rankB = EVIDENCE_RANK[b.ingredient.evidencia] ?? 3;
      if (rankA !== rankB) return rankA - rankB;
      return b.score - a.score;
    });
  }, [results]);

  const visibleResults = sortedResults.slice(0, visibleCount);
  const hasMore = sortedResults.length > visibleCount;

  const activeFiltersCount = [category, indication].filter(Boolean).length;
  const isIdle = query.length < 2 && !indication;
  const showCondition = matchedPathology && (query.length >= 2 || indication);

  const clearAll = useCallback(() => {
    setCategory('');
    setIndication('');
    setQuery('');
  }, [setQuery]);

  const getCategoryConfig = (cat: string) =>
    CATEGORY_CONFIG[cat] || { icon: Leaf, color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' };
  const getEvidenceConfig = (ev: string) => EVIDENCE_CONFIG[ev] || EVIDENCE_CONFIG.C;

  const visibleChips = showAllChips ? indicationChips : indicationChips.slice(0, CHIPS_COLLAPSED_COUNT);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Perfil del cliente (filtro de seguridad para asesoría) */}
      <ClientProfileSelector />

      {/* Filtro primario: Patología/Indicación — colapsable */}
      {indicationChips.length > 0 && (
        <div className="relative">
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAll}
              className="absolute right-0 top-0 z-10 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3 h-3" />
            Patología / Indicación
          </p>
          <div className="flex flex-wrap gap-1.5">
            {visibleChips.map((chip) => {
              const isActive = indication === chip.value;
              return (
                <button
                  key={chip.value}
                  onClick={() => { setIndication(isActive ? '' : chip.value); setShowAllChips(false); }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-transparent text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                  )}
                  aria-pressed={isActive}
                >
                  {chip.label}
                </button>
              );
            })}
            {indicationChips.length > CHIPS_COLLAPSED_COUNT && (
              <button
                onClick={() => setShowAllChips(!showAllChips)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-all flex items-center gap-1"
              >
                {showAllChips ? 'Ver menos' : `+${indicationChips.length - CHIPS_COLLAPSED_COUNT} más`}
                <ChevronDown className={cn('w-3 h-3 transition-transform', showAllChips && 'rotate-180')} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filtro secundario: Categoría */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground shrink-0">Categoría:</span>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(cat => {
            const isActive = category === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== CAPA 1: Ficha de condición (dominante) ===== */}
      {showCondition && (
        <ConditionCard
          pathology={matchedPathology!}
          onIngredientClick={(id) => {
            const ing = ingredientSearchService.getIngredient(id);
            if (ing) setSelectedIngredient(ing);
          }}
          onExpand={(p) => setSelectedPathology(p)}
        />
      )}

      {/* ===== CAPA 2: Ingredientes relacionados ===== */}
      {!isIdle && (
        <div className="space-y-3">
          {/* Cabecera de ingredientes — colapsable */}
          {sortedResults.length > 0 && (
            <button
              onClick={() => setIngredientsExpanded(!ingredientsExpanded)}
              className="flex items-center justify-between w-full text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-1 py-1"
            >
              <div className="flex items-center gap-2">
                <ChevronRight className={cn('w-4 h-4 text-muted-foreground transition-transform', ingredientsExpanded && 'rotate-90')} />
                <h3 className="text-sm font-semibold text-foreground">
                  Ingredientes relacionados
                </h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {sortedResults.length}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                ordenado por evidencia
              </span>
            </button>
          )}

          {/* Estado de carga */}
          {isSearching && sortedResults.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg border border-border bg-card animate-pulse">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded bg-muted" />
                      <div className="h-3 w-20 rounded bg-muted" />
                    </div>
                    <div className="w-6 h-4 rounded bg-muted" />
                  </div>
                  <div className="h-2.5 w-full rounded bg-muted/70 mt-2" />
                  <div className="h-2.5 w-1/2 rounded bg-muted/70 mt-1" />
                </div>
              ))}
            </div>
          )}

          {/* Grid de ingredientes */}
          {ingredientsExpanded && sortedResults.length > 0 && !isSearching && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {visibleResults.map((result) => {
                  const catConfig = getCategoryConfig(result.ingredient.categoria);
                  const evConfig = getEvidenceConfig(result.ingredient.evidencia);
                  const CatIcon = catConfig.icon;
                  const verdict = evaluateSafety(result.ingredient);
                  const safetyStyle = safetyVerdictStyle(verdict);
                  const safetyBadge = safetyVerdictBadge(verdict);
                  return (
                    <button
                      key={result.ingredient.id}
                      className={cn(
                        'text-left p-3 rounded-lg bg-card border border-border hover:border-primary hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group',
                        safetyStyle
                      )}
                      onClick={() => setSelectedIngredient(result.ingredient)}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className={cn('p-1 rounded shrink-0', catConfig.color)}>
                            <CatIcon className="w-3 h-3" aria-hidden="true" />
                          </div>
                          <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                            {result.ingredient.nombre}
                          </h4>
                        </div>
                        <span
                          className={cn('px-1.5 py-0.5 rounded text-xs shrink-0 cursor-help', evConfig.color)}
                          title={evConfig.title}
                        >
                          {evConfig.label}
                        </span>
                      </div>
                      {result.ingredient.indicaciones && result.ingredient.indicaciones.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate">
                          {humanize(result.ingredient.indicaciones[0])}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground/70 capitalize">
                          {result.ingredient.categoria.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {safetyBadge && (
                            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', safetyBadge.className)}>
                              {safetyBadge.label}
                            </span>
                          )}
                          {result.score > 50 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/70">
                              <Star className="w-2.5 h-2.5" aria-hidden="true" />
                              {result.score}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Paginación: ver más */}
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setVisibleCount(visibleCount + RESULTS_PAGE_SIZE)}
                    className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Ver más ({sortedResults.length - visibleCount} restantes)
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Sin resultados */}
          {sortedResults.length === 0 && !isSearching && !showCondition && (query.length >= 2 || indication) && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-40" aria-hidden="true" />
              <p className="text-muted-foreground font-medium">
                No se encontraron resultados{query && ` para "${query}"`}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Prueba con otros términos o ajusta los filtros
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
          )}
        </div>
      )}

      {/* ===== Estado idle: guía de inicio ===== */}
      {isIdle && (
        <div className="text-center py-10">
          {ready ? (
            <>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                <Search className="w-7 h-7 text-primary" aria-hidden="true" />
              </div>
              <p className="text-base font-medium text-foreground">
                Busca un síntoma, ingrediente o seleccióna una indicación
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {ingredientSearchService.size} ingredientes · {allPathologies?.length || 0} patologías en la base de conocimiento
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-primary animate-spin" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Preparando base de conocimiento…</p>
            </div>
          )}
        </div>
      )}

      {/* Historial de consultas recientes */}
      {isIdle && history.length > 0 && (
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Consultas recientes</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setQuery(entry.query)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {entry.query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modales */}
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
      {selectedPathology && (
        <PathologyDetail
          pathology={selectedPathology}
          onClose={() => setSelectedPathology(null)}
          onIngredientClick={(id) => {
            const ing = ingredientSearchService.getIngredient(id);
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
