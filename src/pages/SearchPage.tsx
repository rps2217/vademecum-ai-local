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
import { IngredientResultCard } from '@/ui/IngredientResultCard';
import {
  Search, BookOpen, X, ChevronDown, ChevronRight,
  Loader2, Pill, Clock, Star, Heart,
} from 'lucide-react';
import { IngredientDetail } from '@/ui/IngredientDetail';
import { PathologyDetail } from '@/ui/PathologyDetail';
import { ClientProfileSelector } from '@/ui/ClientProfileSelector';
import { useClientProfile } from '@/contexts/ClientProfileContext';
import { useSearch } from '@/contexts/SearchContext';
import { useConsultationHistory } from '@/hooks/useConsultationHistory';
import type { DbIngredient, DbPathology, IngredientCategory } from '@/db/schema';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateId } from '@/db';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { humanize, normalize, tokenize, getQuerySynonyms } from '@/lib/text';
import {
  CATEGORIES,
  getCategoryConfig,
  EVIDENCE_RANK,
  RESULTS_PAGE_SIZE,
  CHIPS_COLLAPSED_COUNT,
  indicationIcon,
} from '@/ui/searchConfig';

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
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [selectedIngredient, setSelectedIngredient] = useState<DbIngredient | null>(null);
  const [selectedPathology, setSelectedPathology] = useState<DbPathology | null>(null);
  const [showAllChips, setShowAllChips] = useState(false);
  const [chipSearch, setChipSearch] = useState('');
  const [ingredientsExpanded, setIngredientsExpanded] = useState(true);
  const [visibleCount, setVisibleCount] = useState(RESULTS_PAGE_SIZE);

  // True while the debounced query lags behind the current query.
  const isSearching = query !== debouncedQuery;

  // Favoritos: ingredientes marcados por el farmacéutico
  const favorites = useLiveQuery(() => db.favorites.orderBy('createdAt').reverse().toArray(), []);
  const favoriteIngredients = useLiveQuery(
    () => favorites && favorites.length > 0
      ? db.ingredients.bulkGet(favorites.map((f) => f.ingredientId)) as Promise<(DbIngredient | undefined)[]>
      : Promise.resolve([]),
    [favorites],
  );

  const toggleFavorite = useCallback(async (ingredientId: string) => {
    const existing = await db.favorites.where('ingredientId').equals(ingredientId).first();
    if (existing) {
      await db.favorites.delete(existing.id);
    } else {
      await db.favorites.add({ id: generateId(), ingredientId, createdAt: Date.now() });
    }
  }, []);

  const isFavorite = useCallback((ingredientId: string) => {
    return favorites?.some((f) => f.ingredientId === ingredientId) ?? false;
  }, [favorites]);

  // Patologías: cargar una sola vez (live query, pero ligero — ~146 registros)
  const allPathologies = useLiveQuery(() => db.pathologies.toArray(), []);
  const pathologyByIndication = useMemo(() => {
    const m = new Map<string, DbPathology>();
    if (allPathologies) {
      for (const p of allPathologies) m.set(p.id, p);
    }
    return m;
  }, [allPathologies]);

  // Índice invertido de patologías: token → Set<patologyId>.
  // Permite matching O(tokens) en vez de recorrer las ~146 patologías con
  // .find() en cada keystroke. Indexa id, nombre, sistemas y síntomas.
  const pathologyIndex = useMemo(() => {
    const idx = new Map<string, Set<string>>();
    if (!allPathologies) return idx;
    const add = (id: string, text: string) => {
      for (const tok of tokenize(text)) {
        let set = idx.get(tok);
        if (!set) { set = new Set(); idx.set(tok, set); }
        set.add(id);
      }
    };
    for (const p of allPathologies) {
      add(p.id, p.id);
      add(p.id, p.nombre);
      for (const s of p.sistemas ?? []) add(p.id, s);
      for (const s of p.sintomas ?? []) add(p.id, s);
    }
    return idx;
  }, [allPathologies]);

  // Chips de indicación dinámicos desde el índice (sin toArray extra)
  const indicationChips = useMemo(() => {
    if (!ready) return [];
    const counts = ingredientSearchService.indicationCounts();
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([value, count]) => ({ value, count }));
  }, [ready]);

  // Búsqueda con debounce corto (el índice hace que sea casi instantánea)
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      try {
        const searchResults = ingredientSearchService.searchSync({
          query: query.length >= 2 ? query : undefined,
          category: (category || undefined) as IngredientCategory | undefined,
          indication: indication || undefined,
        });
        setResults(searchResults);
        setDebouncedQuery(query);
        setVisibleCount(RESULTS_PAGE_SIZE);
      } catch (error) {
        logger.error('Search error:', error);
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
    if (!allPathologies || allPathologies.length === 0) return null;
    // Match directo por chip de indicación o id exacto
    if (indication && pathologyByIndication.has(indication)) {
      return pathologyByIndication.get(indication)!;
    }
    if (query.length < 2) return null;

    const qTokens = tokenize(query);
    if (qTokens.length === 0) return null;

    // Match exacto de id primero (ej. "ansiedad" → id "ansiedad")
    const nq = normalize(query);
    const exact = allPathologies.find(p => p.id === nq);
    if (exact) return exact;

    // Búsqueda por índice invertido: contar tokens coincidentes por patología.
    // La patología con más tokens del query coincidentes gana.
    // (El índice se construye una sola vez con useMemo → O(tokens) por query.)
    const scores = new Map<string, number>();
    for (const tok of qTokens) {
      const ids = pathologyIndex.get(tok);
      if (ids) {
        for (const id of ids) {
          scores.set(id, (scores.get(id) ?? 0) + 1);
        }
      }
      // Sinónimos: muelas→dental podría matchear una patología
      const syns = getQuerySynonyms(tok);
      if (syns) {
        for (const s of syns) {
          for (const st of tokenize(s)) {
            const ids2 = pathologyIndex.get(st);
            if (ids2) {
              for (const id of ids2) {
                // Los sinónimos pesan menos (×0.5)
                scores.set(id, (scores.get(id) ?? 0) + 0.5);
              }
            }
          }
        }
      }
    }

    if (scores.size === 0) return null;
    // Tomar la patología con mayor score; en empate, preferir match de nombre
    let bestId: string | null = null;
    let bestScore = 0;
    for (const [id, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        bestId = id;
      }
    }
    // Umbral: al menos 1 token del query debe coincidir (o 0.5 por sinónimo)
    if (bestId && bestScore >= 0.5) {
      const p = pathologyByIndication.get(bestId);
      // Reforzar: si el nombre de la patología contiene el query, es match fuerte
      if (p) {
        const np = normalize(p.nombre);
        if (np === nq || np.includes(nq) || nq.includes(np)) return p;
        return p;
      }
    }
    return null;
  }, [allPathologies, pathologyByIndication, pathologyIndex, indication, query]);

  const sortedResults = useMemo(() => {
    const normQuery = query ? normalize(query) : '';
    const normIndication = indication ? normalize(indication) : '';
    return [...results].sort((a, b) => {
      // Eje E — Relevancia: ingredientes con la indicación/nombre que coincide
      // exactamente con el query van primero (sólo cuando hay texto de búsqueda)
      if (normQuery) {
        const aName = normalize(a.ingredient.nombre);
        const bName = normalize(b.ingredient.nombre);
        const aNameMatch = aName === normQuery ? 0 : aName.startsWith(normQuery) ? 1 : 2;
        const bNameMatch = bName === normQuery ? 0 : bName.startsWith(normQuery) ? 1 : 2;
        if (aNameMatch !== bNameMatch) return aNameMatch - bNameMatch;

        const aHasInd = a.ingredient.indicaciones?.some(i => normalize(i) === normQuery || normalize(i) === normIndication) ? 0 : 1;
        const bHasInd = b.ingredient.indicaciones?.some(i => normalize(i) === normQuery || normalize(i) === normIndication) ? 0 : 1;
        if (aHasInd !== bHasInd) return aHasInd - bHasInd;
      }
      // Luego por evidencia
      const rankA = EVIDENCE_RANK[a.ingredient.evidencia] ?? 3;
      const rankB = EVIDENCE_RANK[b.ingredient.evidencia] ?? 3;
      if (rankA !== rankB) return rankA - rankB;
      return b.score - a.score;
    });
  }, [results, query, indication]);

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

  const visibleChips = showAllChips ? indicationChips : indicationChips.slice(0, CHIPS_COLLAPSED_COUNT);

  const filteredChips = useMemo(() => {
    if (!chipSearch.trim()) return indicationChips;
    const q = normalize(chipSearch);
    return indicationChips.filter(c => normalize(c.value).includes(q));
  }, [indicationChips, chipSearch]);

  return (
    <div className="space-y-5 max-w-[110rem] mx-auto">
      {/* Perfil del cliente (filtro de seguridad para asesoría) */}
      <ClientProfileSelector />

      {/* ===== Barra de filtros compacta (Eje B) — sticky bajo el header ===== */}
      <div className="sticky top-16 z-20 -mx-4 lg:-mx-8 px-4 lg:px-8 py-3 bg-background/95 backdrop-blur border-b border-border space-y-3">
        {/* Patología/Indicación — colapsable, top 6 con iconos */}
        {indicationChips.length > 0 && (
          <div className="relative">
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAll}
                className="absolute right-0 top-0 z-10 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1.5 py-1"
              >
                <X className="w-4 h-4" />
                Limpiar
              </button>
            )}
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              Patología / Indicación
            </p>

            {/* Chips colapsados (top 6) — siempre visibles */}
            {!showAllChips && (
              <div className="flex flex-wrap gap-2">
                {visibleChips.map((chip) => {
                  const isActive = indication === chip.value;
                  const Icon = indicationIcon(chip.value);
                  return (
                    <button
                      key={chip.value}
                      onClick={() => { setIndication(isActive ? '' : chip.value); }}
                      className={cn(
                        'inline-flex items-center gap-2 px-4 py-3 rounded-full text-[15px] font-medium transition-all border',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-card text-foreground border-border hover:bg-muted hover:border-primary/40'
                      )}
                      aria-pressed={isActive}
                    >
                      <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
                      {humanize(chip.value)}
                      <span className={cn('text-sm tabular-nums', isActive ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                        {chip.count}
                      </span>
                    </button>
                  );
                })}
                {indicationChips.length > CHIPS_COLLAPSED_COUNT && (
                  <button
                    onClick={() => { setShowAllChips(true); setChipSearch(''); }}
                    className="inline-flex items-center gap-1 px-4 py-3 rounded-full text-[15px] font-medium border border-dashed border-border-hover text-muted-foreground hover:bg-muted hover:text-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {`+${indicationChips.length - CHIPS_COLLAPSED_COUNT} más`}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Panel expandido: scrollable con búsqueda interna */}
            {showAllChips && (
              <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <input
                      type="text"
                      value={chipSearch}
                      onChange={(e) => setChipSearch(e.target.value)}
                      placeholder="Filtrar indicaciones..."
                      autoFocus
                      className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                      aria-label="Filtrar indicaciones"
                    />
                  </div>
                  <button
                    onClick={() => { setShowAllChips(false); setChipSearch(''); }}
                    className="inline-flex items-center gap-1 px-3 h-10 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="w-4 h-4" />
                    Cerrar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto">
                  {filteredChips.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">Sin coincidencias para "{chipSearch}"</p>
                  ) : (
                    filteredChips.map((chip) => {
                      const isActive = indication === chip.value;
                      const Icon = indicationIcon(chip.value);
                      return (
                        <button
                          key={chip.value}
                          onClick={() => { setIndication(isActive ? '' : chip.value); setShowAllChips(false); setChipSearch(''); }}
                          className={cn(
                            'inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[15px] font-medium transition-all border',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            isActive
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-card text-foreground border-border hover:bg-muted hover:border-primary/40'
                          )}
                          aria-pressed={isActive}
                        >
                          <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
                          {humanize(chip.value)}
                          <span className={cn('text-sm tabular-nums', isActive ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                            {chip.count}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {filteredChips.length} de {indicationChips.length} indicaciones
                </p>
              </div>
            )}
          </div>
        )}

        {/* Categoría — fila única compacta */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground shrink-0 uppercase tracking-wide">Categoría</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => {
              const isActive = category === cat.value;
              const cfg = cat.value ? getCategoryConfig(cat.value) : null;
              const Icon = cfg?.icon ?? Pill;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[15px] font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  {cat.value && <Icon className="w-[18px] h-[18px]" aria-hidden="true" />}
                  {cat.label}
                </button>
              );
            })}
          </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-5 rounded-xl border-2 border-border bg-card animate-pulse min-h-[140px]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-muted" />
                      <div className="h-5 w-28 rounded bg-muted" />
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-muted" />
                  </div>
                  <div className="h-4 w-full rounded bg-muted/70 mb-2" />
                  <div className="h-3 w-1/3 rounded bg-muted/70" />
                </div>
              ))}
            </div>
          )}

          {/* Grid de ingredientes — Eje A: cards grandes, legibles a distancia */}
          {ingredientsExpanded && sortedResults.length > 0 && !isSearching && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleResults.map((result) => (
                  <IngredientResultCard
                    key={result.ingredient.id}
                    result={result}
                    verdict={evaluateSafety(result.ingredient)}
                    onClick={setSelectedIngredient}
                    isFavorite={isFavorite(result.ingredient.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>

              {/* Paginación: ver más */}
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setVisibleCount(visibleCount + RESULTS_PAGE_SIZE)}
                    className="px-6 py-3 rounded-xl border-2 border-border text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground hover:border-primary/40 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Ver más ({sortedResults.length - visibleCount} restantes)
                    <ChevronDown className="w-5 h-5" />
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

      {/* Favoritos del farmacéutico */}
      {isIdle && favoriteIngredients && favoriteIngredients.length > 0 && (
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" aria-hidden="true" />
            <h3 className="text-base font-semibold text-foreground">Favoritos</h3>
            <span className="text-sm text-muted-foreground">— acceso rápido</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {favoriteIngredients.filter((x): x is DbIngredient => x !== undefined).map((ing) => (
              <button
                key={ing.id}
                onClick={() => setSelectedIngredient(ing)}
                className="flex items-center gap-3 p-4 rounded-xl border-2 border-border bg-card hover:bg-muted hover:border-primary/40 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[64px]"
              >
                <Heart className="w-5 h-5 text-amber-500 shrink-0 fill-amber-500" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[15px] font-medium truncate">{ing.nombre}</p>
                  <p className="text-xs text-muted-foreground truncate capitalize">{ing.categoria.replace('_', ' ')}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modales */}
      {selectedIngredient && (
        <IngredientDetail
          ingredient={selectedIngredient}
          activeIndication={indication || query}
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
