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
import { ConditionCard } from '@/ui/ConditionCard';
import { IngredientResultCard } from '@/ui/IngredientResultCard';
import { ProductResultCard } from '@/ui/ProductResultCard';
import { ProductDetail } from '@/ui/ProductDetail';
import { SynergyResultCard } from '@/ui/SynergyResultCard';
import { ProtocolResultCard } from '@/ui/ProtocolResultCard';
import { PathologyResultCard } from '@/ui/PathologyResultCard';
import { ClinicalExplanationModal } from '@/ui/ClinicalExplanationModal';
import {
  Search, BookOpen, X, ChevronDown,
  Pill, Clock, Star, Heart, Package,
  Sparkles, Activity, SlidersHorizontal, ArrowRight,
  Stethoscope, Network, ClipboardList,
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

type SearchTab = 'all' | 'pathologies' | 'ingredients' | 'products' | 'synergies' | 'protocols';

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

  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [category, setCategory] = useState('');
  const [indication, setIndication] = useState('');
  const [system, setSystem] = useState<BodySystem | ''>('');
  const [evidence, setEvidence] = useState<EvidenceLevel | ''>('');
  const [selectedIngredient, setSelectedIngredient] = useState<DbIngredient | null>(null);
  const [selectedPathology, setSelectedPathology] = useState<DbPathology | null>(null);
  const [explainingIngredient, setExplainingIngredient] = useState<DbIngredient | null>(null);

  // Productos comerciales
  const [selectedProduct, setSelectedProduct] = useState<DbProduct | null>(null);

  // Búsqueda unificada en todas las bases de datos
  const {
    results, productResults, synergyResults, protocolResults, pathologyResults,
    isSearching, visibleCount, visibleProductCount, visibleSynergyCount, visibleProtocolCount, visiblePathologyCount,
    loadMore, loadMoreProducts, loadMoreSynergies, loadMoreProtocols, loadMorePathologies, totalCounts,
  } = useSearchResults(query, { category, indication, system, evidence });

  // Favoritos: ingredientes marcados por el farmacéutico
  const { favoriteIngredients, isFavorite, toggleFavorite } = useFavorites();

  // Patologías: matching por query
  const { matchedPathology } = usePathologyMatch(query, indication);

  // Chips de indicación dinámicos desde el índice
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
      if (results.length > 0 || productResults.length > 0) addEntry(query.trim());
    }, 1200);
    return () => clearTimeout(t);
  }, [query, results.length, productResults.length, addEntry]);

  const sortedResults = useMemo(() => {
    const normQuery = query ? normalize(query) : '';
    const normIndication = indication ? normalize(indication) : '';
    return [...results].sort((a, b) => {
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
      const rankA = EVIDENCE_RANK[a.ingredient.evidencia] ?? 3;
      const rankB = EVIDENCE_RANK[b.ingredient.evidencia] ?? 3;
      if (rankA !== rankB) return rankA - rankB;
      return b.score - a.score;
    });
  }, [results, query, indication]);

  const visibleResults = sortedResults.slice(0, visibleCount);
  const hasMore = sortedResults.length > visibleCount;

  // Productos visibles
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
  }, [setQuery]);

  const quickSymptoms = [
    { label: 'Dormir y descanso', query: 'insomnio', icon: '💤' },
    { label: 'Estrés y nerviosismo', query: 'ansiedad', icon: '🧠' },
    { label: 'Salud articular', query: 'articulaciones', icon: '🦴' },
    { label: 'Control cardiovascular', query: 'colesterol', icon: '🫀' },
    { label: 'Defensas e inmunidad', query: 'inmune', icon: '🛡️' },
    { label: 'Cansancio y energía', query: 'fatiga', icon: '⚡' },
    { label: 'Digestión y reflujo', query: 'digestivo', icon: '🩺' },
  ];

  return (
    <div className="space-y-6 max-w-[110rem] mx-auto pb-12">
      {/* Perfil del cliente (filtro de seguridad para asesoría) */}
      <ClientProfileSelector />

      {/* ===== 1. BUSCADOR GENERAL OMNIPRESENTE (Estilo Google Local) ===== */}
      <div className="space-y-3">
        <div className="relative mx-auto w-full">
          <div className="relative flex items-center w-full rounded-2xl bg-card border-2 border-border/80 shadow-xs hover:border-primary/50 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
            <Search className="ml-4 h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca un síntoma, patología, ingrediente, producto o interacción..."
              aria-label="Buscar en todas las bases de datos"
              className="w-full bg-transparent px-3.5 py-3.5 text-base sm:text-lg text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mr-2 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Borrar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {!isIdle && totalCounts.total > 0 && (
              <span className="mr-3 hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {totalCounts.total} resultados
              </span>
            )}
          </div>
        </div>

        {/* Pestañas de Bases de Datos (Google Tabs) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border',
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs font-semibold'
                : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            )}
          >
            <span>🌐 Todo</span>
            {!isIdle && totalCounts.total > 0 && (
              <span className={cn('px-1.5 py-0.2 rounded-full text-[11px]', activeTab === 'all' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                {totalCounts.total}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pathologies')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border',
              activeTab === 'pathologies'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs font-semibold'
                : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            )}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Patologías</span>
            {totalCounts.pathologies > 0 && (
              <span className={cn('px-1.5 py-0.2 rounded-full text-[11px]', activeTab === 'pathologies' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground')}>
                {totalCounts.pathologies}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ingredients')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border',
              activeTab === 'ingredients'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-semibold'
                : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            )}
          >
            <Pill className="h-3.5 w-3.5" />
            <span>Ingredientes</span>
            {totalCounts.ingredients > 0 && (
              <span className={cn('px-1.5 py-0.2 rounded-full text-[11px]', activeTab === 'ingredients' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground')}>
                {totalCounts.ingredients}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border',
              activeTab === 'products'
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs font-semibold'
                : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            )}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Productos</span>
            {totalCounts.products > 0 && (
              <span className={cn('px-1.5 py-0.2 rounded-full text-[11px]', activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground')}>
                {totalCounts.products}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('synergies')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border',
              activeTab === 'synergies'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-semibold'
                : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            )}
          >
            <Network className="h-3.5 w-3.5" />
            <span>Sinergias</span>
            {totalCounts.synergies > 0 && (
              <span className={cn('px-1.5 py-0.2 rounded-full text-[11px]', activeTab === 'synergies' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground')}>
                {totalCounts.synergies}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('protocols')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border',
              activeTab === 'protocols'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-semibold'
                : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            )}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Protocolos</span>
            {totalCounts.protocols > 0 && (
              <span className={cn('px-1.5 py-0.2 rounded-full text-[11px]', activeTab === 'protocols' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground')}>
                {totalCounts.protocols}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ===== Barra de Filtros Rápidos (Directos, accesibles, estilo Google Local) ===== */}
      <div className="space-y-2.5 p-3 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span>Filtros rápidos</span>
          </div>

          {(activeFiltersCount > 0 || query) && (
            <button
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-2.5 py-1 transition-colors border border-border/80 bg-background"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpiar</span>
              {activeFiltersCount > 0 && (
                <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded-full font-mono">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Fila: Sistemas Corporales */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span>Sistema corporal:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {BODY_SYSTEM_CHIPS.map((sys) => {
              const isActive = system === sys.value;
              const Icon = sys.icon;
              return (
                <button
                  key={sys.value}
                  onClick={() => setSystem(isActive ? '' : sys.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all border',
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                      : 'bg-muted/50 text-foreground border-border hover:bg-muted'
                  )}
                  aria-pressed={isActive}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{sys.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fila: Categorías */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
            <Pill className="w-3.5 h-3.5 text-primary" />
            <span>Categoría:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = category === cat.value;
              const cfg = getCategoryConfig(cat.value);
              const Icon = cfg.icon;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(isActive ? '' : cat.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all border',
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                      : 'bg-muted/50 text-foreground border-border hover:bg-muted'
                  )}
                  aria-pressed={isActive}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fila: Patología / Indicación */}
        {indicationChips.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
              <BookOpen className="w-3 h-3 text-primary" />
              <span>Patología / Indicación:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {indicationChips.map((chip) => {
                const isActive = indication === chip.value;
                const Icon = indicationIcon(chip.value);
                return (
                  <button
                    key={chip.value}
                    onClick={() => setIndication(isActive ? '' : chip.value)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all border',
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                        : 'bg-muted/50 text-foreground border-border hover:bg-muted'
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
              })}
            </div>
          </div>
        )}

        {/* Fila: Nivel de Evidencia */}
        <div className="flex items-center gap-3 pt-1 border-t border-border/60">
          <span className="text-xs text-muted-foreground font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Evidencia</span>:
          </span>
          <div className="flex items-center gap-1.5">
            {EVIDENCE_LEVELS.map((lvl) => {
              const cfg = getEvidenceConfig(lvl);
              const isActive = evidence === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setEvidence(isActive ? '' : lvl)}
                  aria-pressed={isActive}
                  aria-label={`Filtrar por evidencia ${lvl}: ${cfg.title}`}
                  title={cfg.title}
                  className={cn(
                    'w-7 h-7 rounded-lg text-xs font-bold transition-all border flex items-center justify-center',
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-muted/60 text-foreground border-border hover:bg-muted'
                  )}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
          {evidence && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              — {getEvidenceConfig(evidence).title}
            </span>
          )}
        </div>
      </div>

      {/* ===== 2. FICHA DESTACADA DE CONDICIÓN (Si hay patología identificada) ===== */}
      {showCondition && (activeTab === 'all' || activeTab === 'pathologies') && (
        <ConditionCard
          pathology={matchedPathology!}
          onIngredientClick={(id) => {
            const ing = ingredientSearchService.getIngredient(id);
            if (ing) setSelectedIngredient(ing);
          }}
          onExpand={(p) => setSelectedPathology(p)}
        />
      )}

      {/* ===== 3. VISTA MULTI-BASE DE DATOS SEGÚN PESTAÑA ===== */}

      {/* --- PESTAÑA: TODO (Resultados federados) --- */}
      {activeTab === 'all' && !isIdle && (
        <div className="space-y-8">
          {/* A. Ingredientes Destacados */}
          {sortedResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-base font-semibold text-foreground">
                    Ingredientes naturales
                  </h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                    {sortedResults.length}
                  </span>
                </div>
                {sortedResults.length > 4 && (
                  <button
                    onClick={() => setActiveTab('ingredients')}
                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Ver los {sortedResults.length} ingredientes</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleResults.slice(0, 4).map((result) => (
                  <IngredientResultCard
                    key={result.ingredient.id}
                    result={result}
                    verdict={evaluateSafety(result.ingredient)}
                    onClick={setSelectedIngredient}
                    onExplain={(ing) => setExplainingIngredient(ing as DbIngredient)}
                    isFavorite={isFavorite(result.ingredient.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </div>
          )}

          {/* B. Sinergias e Interacciones */}
          {synergyResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-amber-600" />
                  <h3 className="text-base font-semibold text-foreground">
                    Sinergias e interacciones
                  </h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                    {synergyResults.length}
                  </span>
                </div>
                {synergyResults.length > 4 && (
                  <button
                    onClick={() => setActiveTab('synergies')}
                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Ver las {synergyResults.length} interacciones</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {synergyResults.slice(0, 4).map((syn) => (
                  <SynergyResultCard
                    key={syn.id}
                    synergy={syn}
                    onClick={() => navigate(`/synergies?ingredient=${syn.ingredienteA}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* C. Productos Comerciales */}
          {productResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-sky-600" />
                  <h3 className="text-base font-semibold text-foreground">
                    Productos de farmacia
                  </h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                    {productResults.length}
                  </span>
                </div>
                {productResults.length > 4 && (
                  <button
                    onClick={() => setActiveTab('products')}
                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Ver los {productResults.length} productos</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleProductResults.slice(0, 4).map((result) => (
                  <ProductResultCard
                    key={result.product.sku}
                    result={result}
                    analysis={productAnalysisMap?.get(result.product.sku)}
                    onClick={() => setSelectedProduct(result.product)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* D. Protocolos Clínicos */}
          {protocolResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-base font-semibold text-foreground">
                    Protocolos clínicos recomendados
                  </h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                    {protocolResults.length}
                  </span>
                </div>
                {protocolResults.length > 3 && (
                  <button
                    onClick={() => setActiveTab('protocols')}
                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Ver los {protocolResults.length} protocolos</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {protocolResults.slice(0, 3).map((prot) => (
                  <ProtocolResultCard
                    key={prot.id}
                    protocol={prot}
                    onClick={() => navigate('/protocols')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* E. Sin resultados en ninguna base de datos */}
          {totalCounts.total === 0 && !isSearching && !showCondition && (
            <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-card/40">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-40" aria-hidden="true" />
              <p className="text-foreground font-semibold text-lg">
                No se encontraron resultados{query && ` para "${query}"`}
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Prueba buscando por síntoma (ej. "insomnio", "dolor de cabeza"), nombre común de planta o principio activo.
              </p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAll}
                  className="mt-4 inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Restablecer filtros
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- PESTAÑA: PATOLOGÍAS --- */}
      {activeTab === 'pathologies' && !isIdle && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Patologías clínicas identificadas ({pathologyResults.length})
            </h3>
          </div>

          {pathologyResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pathologyResults.slice(0, visiblePathologyCount).map((p) => (
                <PathologyResultCard
                  key={p.id}
                  pathology={p}
                  onClick={() => setSelectedPathology(p)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No hay patologías coincidentes directamente con este término.
            </p>
          )}

          {pathologyResults.length > visiblePathologyCount && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMorePathologies}
                className="px-6 py-2.5 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted"
              >
                Cargar más patologías
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- PESTAÑA: INGREDIENTES --- */}
      {activeTab === 'ingredients' && !isIdle && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Ingredientes de la base de conocimiento ({sortedResults.length})
            </h3>
            <span className="text-xs text-muted-foreground">ordenado por evidencia</span>
          </div>

          {sortedResults.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleResults.map((result) => (
                  <IngredientResultCard
                    key={result.ingredient.id}
                    result={result}
                    verdict={evaluateSafety(result.ingredient)}
                    onClick={setSelectedIngredient}
                    onExplain={(ing) => setExplainingIngredient(ing as DbIngredient)}
                    isFavorite={isFavorite(result.ingredient.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={loadMore}
                    className="px-8 py-3 rounded-xl border-2 border-border text-sm font-semibold text-foreground bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all flex items-center gap-2"
                  >
                    Ver más ({sortedResults.length - visibleCount} restantes)
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No se encontraron ingredientes con los filtros actuales.
            </p>
          )}
        </div>
      )}

      {/* --- PESTAÑA: PRODUCTOS --- */}
      {activeTab === 'products' && !isIdle && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Productos comerciales de farmacia ({productResults.length})
            </h3>
          </div>

          {productResults.length > 0 ? (
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
                    className="px-8 py-3 rounded-xl border-2 border-border text-sm font-semibold text-foreground bg-card hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-all flex items-center gap-2"
                  >
                    Ver más ({productResults.length - visibleProductCount} restantes)
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No se encontraron productos comerciales.
            </p>
          )}
        </div>
      )}

      {/* --- PESTAÑA: SINERGIAS --- */}
      {activeTab === 'synergies' && !isIdle && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Sinergias e interacciones ({synergyResults.length})
            </h3>
          </div>

          {synergyResults.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {synergyResults.slice(0, visibleSynergyCount).map((syn) => (
                  <SynergyResultCard
                    key={syn.id}
                    synergy={syn}
                    onClick={() => navigate(`/synergies?ingredient=${syn.ingredienteA}`)}
                  />
                ))}
              </div>

              {synergyResults.length > visibleSynergyCount && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={loadMoreSynergies}
                    className="px-8 py-3 rounded-xl border-2 border-border text-sm font-semibold text-foreground bg-card hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all flex items-center gap-2"
                  >
                    Ver más ({synergyResults.length - visibleSynergyCount} restantes)
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No hay interacciones registradas para este término.
            </p>
          )}
        </div>
      )}

      {/* --- PESTAÑA: PROTOCOLOS --- */}
      {activeTab === 'protocols' && !isIdle && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Protocolos de suplementación ({protocolResults.length})
            </h3>
          </div>

          {protocolResults.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {protocolResults.slice(0, visibleProtocolCount).map((prot) => (
                  <ProtocolResultCard
                    key={prot.id}
                    protocol={prot}
                    onClick={() => navigate('/protocols')}
                  />
                ))}
              </div>

              {protocolResults.length > visibleProtocolCount && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={loadMoreProtocols}
                    className="px-8 py-3 rounded-xl border-2 border-border text-sm font-semibold text-foreground bg-card hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all flex items-center gap-2"
                  >
                    Ver más ({protocolResults.length - visibleProtocolCount} restantes)
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No se encontraron protocolos con estos ingredientes o condición.
            </p>
          )}
        </div>
      )}

      {/* ===== 4. ESTADO INICIAL / SUGERENCIAS GOOGLE LOCAL ===== */}
      {isIdle && (
        <div className="space-y-8 pt-2">
          {/* Píldoras de búsqueda rápida clínica (menos texto, más intuición) */}
          <div className="rounded-2xl border border-border/80 bg-card/60 p-6 sm:p-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Consulta rápida en mostrador</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              ¿Qué consulta tu cliente hoy?
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Toca un síntoma frecuente o escribe unas pocas letras para buscar en ingredientes, marcas, patologías y sinergias.
            </p>

            <div className="flex flex-wrap justify-center gap-2 pt-2 max-w-2xl mx-auto">
              {quickSymptoms.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setQuery(s.query)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-background border border-border shadow-xs hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Historial de consultas recientes */}
          {history.length > 0 && (
            <div className="max-w-4xl mx-auto space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Consultas recientes</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setQuery(entry.query)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-border"
                  >
                    {entry.query}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Favoritos del farmacéutico */}
          {favoriteIngredients && favoriteIngredients.length > 0 && (
            <div className="max-w-4xl mx-auto space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Favoritos del mostrador</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {favoriteIngredients.map((ing) => (
                  <button
                    key={ing.id}
                    onClick={() => setSelectedIngredient(ing)}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card hover:border-primary/40 transition-all text-left"
                  >
                    <Heart className="w-4 h-4 text-amber-500 shrink-0 fill-amber-500" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{ing.nombre}</p>
                      <p className="text-[11px] text-muted-foreground truncate capitalize">{ing.categoria.replace('_', ' ')}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== 5. MODALES ===== */}

      {/* Modal: ¿Cómo actúa clínicamente en el organismo? */}
      {explainingIngredient && (
        <ClinicalExplanationModal
          isOpen={Boolean(explainingIngredient)}
          onClose={() => setExplainingIngredient(null)}
          ingredient={explainingIngredient}
          pathology={matchedPathology}
        />
      )}

      {/* Modal: Ficha técnica completa de ingrediente */}
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

      {/* Modal: Ficha clínica de patología */}
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

      {/* Modal: Ficha de producto comercial */}
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

