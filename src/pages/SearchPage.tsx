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

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ingredientSearchService, useSearchIndex, useProductIndex } from '@/core/search';
import { ConditionCard } from '@/ui/ConditionCard';
import { IngredientResultCard } from '@/ui/IngredientResultCard';
import { ProductResultCard } from '@/ui/ProductResultCard';
import { ProductDetail } from '@/ui/ProductDetail';
import {
  Search, BookOpen, X, ChevronDown, ChevronRight,
  Loader2, Pill, Clock, Star, Heart, Package,
  Sparkles, Check, Activity, SlidersHorizontal,
} from 'lucide-react';
import { IngredientDetail } from '@/ui/IngredientDetail';
import { PathologyDetail } from '@/ui/PathologyDetail';
import { ClientProfileSelector } from '@/ui/ClientProfileSelector';
import { useClientProfile } from '@/contexts/ClientProfileContext';
import { useSearch } from '@/contexts/SearchContext';
import { useConsultationHistory } from '@/hooks/useConsultationHistory';
import type { DbIngredient, DbPathology, DbProduct, DbProductIngredientAnalysis } from '@/db/schema';
import type { BodySystem } from '@/types/shared-enums';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { cn } from '@/lib/utils';
import { humanize, normalize } from '@/lib/text';
import {
  CATEGORIES,
  getCategoryConfig,
  getEvidenceConfig,
  EVIDENCE_RANK,
  EVIDENCE_LEVELS,
  BODY_SYSTEM_CHIPS,
  indicationIcon,
  type EvidenceLevel,
} from '@/ui/searchConfig';
import { usePathologyMatch } from '@/hooks/usePathologyMatch';
import { useSearchResults } from '@/hooks/useSearchResults';
import { useFavorites } from '@/hooks/useFavorites';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { query, setQuery } = useSearch();
  const { ready } = useSearchIndex();
  const { ready: productsReady } = useProductIndex();
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
  const [system, setSystem] = useState<BodySystem | ''>('');
  const [evidence, setEvidence] = useState<EvidenceLevel | ''>('');
  const [selectedIngredient, setSelectedIngredient] = useState<DbIngredient | null>(null);
  const [selectedPathology, setSelectedPathology] = useState<DbPathology | null>(null);
  const [activeFacet, setActiveFacet] = useState<'indication' | 'category' | 'system' | 'evidence' | null>(null);
  const [chipSearch, setChipSearch] = useState('');
  const [ingredientsExpanded, setIngredientsExpanded] = useState(true);

  // Referencia para click outside en la barra de filtros
  const filterToolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterToolbarRef.current && !filterToolbarRef.current.contains(e.target as Node)) {
        setActiveFacet(null);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setActiveFacet(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Productos comerciales (búsqueda unificada)
  const [productsExpanded, setProductsExpanded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DbProduct | null>(null);

  // Búsqueda unificada: debounce + ingredientes + productos + paginación
  const {
    results, productResults, isSearching,
    visibleCount, visibleProductCount, loadMore, loadMoreProducts,
  } = useSearchResults(query, { category, indication, system, evidence });

  // Favoritos: ingredientes marcados por el farmacéutico
  const { favoriteIngredients, isFavorite, toggleFavorite } = useFavorites();

  // Patologías: índice invertido + matching por query (extraído a hook)
  const { matchedPathology, allPathologies } = usePathologyMatch(query, indication);

  // Chips de indicación dinámicos desde el índice (sin toArray extra)
  const indicationChips = useMemo(() => {
    if (!ready) return [];
    const counts = ingredientSearchService.indicationCounts();
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([value, count]) => ({ value, count }));
  }, [ready]);

  // Registrar consulta en el historial (tras debounce, solo si hay resultados)
  useEffect(() => {
    if (query.trim().length < 3) return;
    const t = setTimeout(() => {
      if (results.length > 0) addEntry(query.trim());
    }, 1200);
    return () => clearTimeout(t);
  }, [query, results.length, addEntry]);

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

  // Productos visibles + análisis de cobertura por SKU (para el badge).
  // Carga el análisis de los productos visibles en una sola consulta al bridge.
  const visibleProductResults = productResults.slice(0, visibleProductCount);
  const hasMoreProducts = productResults.length > visibleProductCount;
  const visibleProductSkus = useMemo(
    () => visibleProductResults.map((r) => r.product.sku),
    [visibleProductResults],
  );
  const productAnalysisMap = useLiveQuery(async () => {
    if (visibleProductSkus.length === 0) return new Map<string, DbProductIngredientAnalysis>();
    const rows = await db.productIngredientAnalysis.bulkGet(visibleProductSkus);
    const m = new Map<string, DbProductIngredientAnalysis>();
    for (const row of rows) if (row) m.set(row.productoSku, row);
    return m;
  }, [visibleProductSkus.join(',')]);

  // Bridge + análisis del producto seleccionado (para el modal ProductDetail).
  const selectedProductBridge = useLiveQuery(async () => {
    if (!selectedProduct) return [];
    return db.productIngredients.where('productoSku').equals(selectedProduct.sku).toArray();
  }, [selectedProduct?.sku]);
  const selectedProductAnalysis = useLiveQuery(async () => {
    if (!selectedProduct) return undefined;
    return db.productIngredientAnalysis.get(selectedProduct.sku);
  }, [selectedProduct?.sku]);

  const activeFiltersCount = [category, indication, system, evidence].filter(Boolean).length;
  const isIdle = query.length < 2 && !indication && !system && !evidence;
  const showCondition = matchedPathology && (query.length >= 2 || indication);

  const clearAll = useCallback(() => {
    setCategory('');
    setIndication('');
    setSystem('');
    setEvidence('');
    setQuery('');
    setActiveFacet(null);
  }, [setQuery]);

  const filteredChips = useMemo(() => {
    if (!chipSearch.trim()) return indicationChips;
    const q = normalize(chipSearch);
    return indicationChips.filter(c => normalize(c.value).includes(q));
  }, [indicationChips, chipSearch]);

  const activeCategoryLabel = category
    ? (CATEGORIES.find(c => c.value === category)?.label || humanize(category))
    : null;

  return (
    <div className="space-y-5 max-w-[110rem] mx-auto">
      {/* Perfil del cliente (filtro de seguridad para asesoría) */}
      <ClientProfileSelector />

      {/* ===== Barra de Filtros Facetada Compacta (UX Profesional) ===== */}
      <div
        ref={filterToolbarRef}
        className="sticky top-16 z-20 -mx-4 lg:-mx-8 px-4 lg:px-8 py-2.5 bg-background/95 backdrop-blur-md border-b border-border shadow-xs space-y-2.5"
      >
        {/* Fila principal de selectores facetados */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span>Filtros</span>
          </div>

          {/* 1. Faceta: Sistema corporal */}
          <div className="relative">
            <button
              onClick={() => setActiveFacet(activeFacet === 'system' ? null : 'system')}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                system
                  ? 'bg-primary/10 text-primary border-primary/40 font-semibold shadow-xs'
                  : activeFacet === 'system'
                  ? 'bg-muted text-foreground border-primary/60'
                  : 'bg-card text-foreground/80 border-border hover:bg-muted/70 hover:text-foreground'
              )}
              aria-expanded={activeFacet === 'system'}
              aria-haspopup="listbox"
            >
              <Activity className="w-4 h-4 text-primary shrink-0" />
              <span>{system ? humanize(system) : 'Sistema corporal'}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform opacity-70', activeFacet === 'system' && 'rotate-180')} />
            </button>

            {/* Dropdown flotante Sistema */}
            <div className={cn(
              'absolute left-0 mt-1.5 w-72 sm:w-80 p-2 rounded-xl bg-card border border-border shadow-lg z-30 space-y-1',
              activeFacet === 'system' ? 'block animate-in fade-in-50 zoom-in-95' : 'hidden'
            )}>
              <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground border-b border-border/60 pb-1.5 mb-1">
                <span>Sistemas corporales</span>
                {system && (
                  <button
                    onClick={() => { setSystem(''); setActiveFacet(null); }}
                    className="text-primary hover:underline"
                  >
                    Restablecer
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-64 overflow-y-auto pr-1">
                {BODY_SYSTEM_CHIPS.map(sys => {
                  const isActive = system === sys.value;
                  const Icon = sys.icon;
                  return (
                    <button
                      key={sys.value}
                      onClick={() => {
                        setSystem(isActive ? '' : sys.value);
                        setActiveFacet(null);
                      }}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left w-full',
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'hover:bg-muted text-foreground'
                      )}
                      aria-pressed={isActive}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{sys.label}</span>
                      {isActive && <Check className="w-3 h-3 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Faceta: Categoría */}
          <div className="relative">
            <button
              onClick={() => setActiveFacet(activeFacet === 'category' ? null : 'category')}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                category
                  ? 'bg-primary/10 text-primary border-primary/40 font-semibold shadow-xs'
                  : activeFacet === 'category'
                  ? 'bg-muted text-foreground border-primary/60'
                  : 'bg-card text-foreground/80 border-border hover:bg-muted/70 hover:text-foreground'
              )}
              aria-expanded={activeFacet === 'category'}
              aria-haspopup="listbox"
            >
              <Pill className="w-4 h-4 text-primary shrink-0" />
              <span>{activeCategoryLabel || 'Categoría'}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform opacity-70', activeFacet === 'category' && 'rotate-180')} />
            </button>

            {/* Dropdown flotante Categoría */}
            <div className={cn(
              'absolute left-0 mt-1.5 w-60 p-2 rounded-xl bg-card border border-border shadow-lg z-30 space-y-1',
              activeFacet === 'category' ? 'block animate-in fade-in-50 zoom-in-95' : 'hidden'
            )}>
              <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground border-b border-border/60 pb-1.5 mb-1">
                <span>Categoría terapéutica</span>
                {category && (
                  <button
                    onClick={() => { setCategory(''); setActiveFacet(null); }}
                    className="text-primary hover:underline"
                  >
                    Restablecer
                  </button>
                )}
              </div>
              <div className="space-y-0.5 max-h-60 overflow-y-auto">
                {CATEGORIES.map(cat => {
                  const isActive = category === cat.value;
                  const cfg = cat.value ? getCategoryConfig(cat.value) : null;
                  const Icon = cfg?.icon ?? Pill;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => {
                        setCategory(cat.value);
                        setActiveFacet(null);
                      }}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left w-full',
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'hover:bg-muted text-foreground'
                      )}
                      aria-pressed={isActive}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 truncate">{cat.label}</span>
                      {isActive && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Faceta: Evidencia */}
          <div className="relative">
            <button
              onClick={() => setActiveFacet(activeFacet === 'evidence' ? null : 'evidence')}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                evidence
                  ? 'bg-primary/10 text-primary border-primary/40 font-semibold shadow-xs'
                  : activeFacet === 'evidence'
                  ? 'bg-muted text-foreground border-primary/60'
                  : 'bg-card text-foreground/80 border-border hover:bg-muted/70 hover:text-foreground'
              )}
              aria-expanded={activeFacet === 'evidence'}
              aria-haspopup="listbox"
            >
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span>{evidence ? `Evidencia ${evidence}` : 'Evidencia'}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform opacity-70', activeFacet === 'evidence' && 'rotate-180')} />
            </button>

            {/* Dropdown flotante Evidencia */}
            <div className={cn(
              'absolute left-0 mt-1.5 w-72 p-2 rounded-xl bg-card border border-border shadow-lg z-30 space-y-1',
              activeFacet === 'evidence' ? 'block animate-in fade-in-50 zoom-in-95' : 'hidden'
            )}>
              <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground border-b border-border/60 pb-1.5 mb-1">
                <span>Nivel de evidencia clínica</span>
                {evidence && (
                  <button
                    onClick={() => { setEvidence(''); setActiveFacet(null); }}
                    className="text-primary hover:underline"
                  >
                    Restablecer
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {EVIDENCE_LEVELS.map(lvl => {
                  const isActive = evidence === lvl;
                  const cfg = getEvidenceConfig(lvl);
                  return (
                    <button
                      key={lvl}
                      onClick={() => {
                        setEvidence(isActive ? '' : lvl);
                        setActiveFacet(null);
                      }}
                      aria-pressed={isActive}
                      aria-label={`Filtrar por evidencia ${cfg.label}: ${cfg.title}`}
                      title={cfg.title}
                      className={cn(
                        'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left w-full',
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'hover:bg-muted text-foreground'
                      )}
                    >
                      <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0', isActive ? 'bg-primary-foreground text-primary' : 'bg-primary/15 text-primary')}>
                        {lvl}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold leading-tight">Nivel {lvl}</div>
                        <div className={cn('text-[11px] truncate', isActive ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                          {cfg.title}
                        </div>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Faceta: Patología / Indicación */}
          {indicationChips.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setActiveFacet(activeFacet === 'indication' ? null : 'indication')}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  indication
                    ? 'bg-primary/10 text-primary border-primary/40 font-semibold shadow-xs'
                    : activeFacet === 'indication'
                    ? 'bg-muted text-foreground border-primary/60'
                    : 'bg-card text-foreground/80 border-border hover:bg-muted/70 hover:text-foreground'
                )}
                aria-expanded={activeFacet === 'indication'}
                aria-haspopup="dialog"
              >
                <BookOpen className="w-4 h-4 text-primary shrink-0" />
                <span>{indication ? humanize(indication) : 'Patología / Indicación'}</span>
                <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-mono">
                  {indicationChips.length}
                </span>
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform opacity-70', activeFacet === 'indication' && 'rotate-180')} />
              </button>

              {/* Popover flotante con buscador interno de Indicaciones */}
              <div className={cn(
                'absolute left-0 sm:left-auto right-0 sm:right-auto mt-1.5 w-80 sm:w-96 p-3 rounded-xl bg-card border border-border shadow-xl z-30 space-y-2.5',
                activeFacet === 'indication' ? 'block animate-in fade-in-50 zoom-in-95' : 'hidden'
              )}>
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    Seleccionar patología o indicación
                  </span>
                  {indication && (
                    <button
                      onClick={() => { setIndication(''); setActiveFacet(null); setChipSearch(''); }}
                      className="text-primary hover:underline"
                    >
                      Restablecer
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input
                    type="text"
                    value={chipSearch}
                    onChange={(e) => setChipSearch(e.target.value)}
                    placeholder="Buscar patología o síntoma..."
                    autoFocus
                    className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                    aria-label="Filtrar indicaciones"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {filteredChips.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center w-full">
                      Sin coincidencias para "{chipSearch}"
                    </p>
                  ) : (
                    filteredChips.map((chip) => {
                      const isActive = indication === chip.value;
                      const Icon = indicationIcon(chip.value);
                      return (
                        <button
                          key={chip.value}
                          onClick={() => {
                            setIndication(isActive ? '' : chip.value);
                            setActiveFacet(null);
                            setChipSearch('');
                          }}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
                            isActive
                              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                              : 'bg-muted/60 text-foreground border-border/80 hover:bg-muted hover:border-primary/40'
                          )}
                          aria-pressed={isActive}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{humanize(chip.value)}</span>
                          <span className={cn('text-[10px] tabular-nums', isActive ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                            {chip.count}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Botón de limpiar todo si hay filtros activos */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAll}
              className="ml-auto text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-2 py-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpiar</span>
              <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded-full font-mono">
                {activeFiltersCount}
              </span>
            </button>
          )}
        </div>

        {/* Fila de Filtros Activos (Píldoras de descarte rápido) */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5 border-t border-border/50 text-xs">
            <span className="text-muted-foreground text-[11px] mr-1">Activos:</span>

            {system && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                <Activity className="w-3 h-3" />
                <span>{humanize(system)}</span>
                <button
                  onClick={() => setSystem('')}
                  className="hover:bg-primary/20 rounded-full p-0.5 ml-0.5"
                  aria-label="Quitar filtro de sistema"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                <Pill className="w-3 h-3" />
                <span>{activeCategoryLabel}</span>
                <button
                  onClick={() => setCategory('')}
                  className="hover:bg-primary/20 rounded-full p-0.5 ml-0.5"
                  aria-label="Quitar filtro de categoría"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {evidence && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                <Sparkles className="w-3 h-3" />
                <span>Evidencia {evidence}</span>
                <button
                  onClick={() => setEvidence('')}
                  className="hover:bg-primary/20 rounded-full p-0.5 ml-0.5"
                  aria-label="Quitar filtro de evidencia"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {indication && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                <BookOpen className="w-3 h-3" />
                <span>{humanize(indication)}</span>
                <button
                  onClick={() => setIndication('')}
                  className="hover:bg-primary/20 rounded-full p-0.5 ml-0.5"
                  aria-label="Quitar filtro de indicación"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>
        )}
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
                <div className="flex justify-center pt-4">
                  <button
                    onClick={loadMore}
                    className="px-8 py-4 rounded-xl border-2 border-border text-base font-semibold text-foreground bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[52px] shadow-sm"
                  >
                    Ver más ({sortedResults.length - visibleCount} restantes)
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Sin resultados */}
          {sortedResults.length === 0 && !isSearching && !showCondition && (query.length >= 2 || indication || system || evidence) && (
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

      {/* ===== CAPA 2b: Productos comerciales (búsqueda unificada) ===== */}
      {!isIdle && productsReady && productResults.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setProductsExpanded(!productsExpanded)}
            className="flex items-center justify-between w-full text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-1 py-1"
          >
            <div className="flex items-center gap-2">
              <ChevronRight className={cn('w-4 h-4 text-muted-foreground transition-transform', productsExpanded && 'rotate-90')} />
              <Package className="w-4 h-4 text-sky-500" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-foreground">
                Productos comerciales
              </h3>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {productResults.length}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">catálogo de farmacia</span>
          </button>

          {productsExpanded && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleProductResults.map((result) => (
                  <ProductResultCard
                    key={result.product.sku}
                    result={result}
                    analysis={productAnalysisMap?.get(result.product.sku)}
                    onClick={() => setSelectedProduct(result.product)}
                  />
                ))}
              </div>

              {hasMoreProducts && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={loadMoreProducts}
                    className="px-8 py-4 rounded-xl border-2 border-border text-base font-semibold text-foreground bg-card hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[52px] shadow-sm"
                  >
                    Ver más ({productResults.length - visibleProductCount} restantes)
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
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
                className="px-4 py-2.5 rounded-full text-sm font-medium bg-muted text-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[40px]"
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
            {favoriteIngredients.map((ing) => (
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
          isFavorite={isFavorite(selectedIngredient.id)}
          onToggleFavorite={toggleFavorite}
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
          onProductClick={(product) => {
            setSelectedPathology(null);
            setSelectedProduct(product);
          }}
        />
      )}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          bridgeRows={selectedProductBridge ?? []}
          analysis={selectedProductAnalysis}
          onClose={() => setSelectedProduct(null)}
          onIngredientClick={(id) => {
            const ing = ingredientSearchService.getIngredient(id);
            if (ing) {
              setSelectedProduct(null);
              setSelectedIngredient(ing);
            }
          }}
        />
      )}
    </div>
  );
}
