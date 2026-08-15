/**
 * SynergiesPage - Red de sinergias rediseñada
 * 
 * Grid de sinergias con visualizacion de combinaciones y grafo interactivo.
 * Búsqueda con motor fuzzy + TF-IDF (SynergySearchService) y filtros por
 * tipo y nivel de evidencia. Paginación para no renderizar 1171 cards a la vez.
 */

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { useSearch } from '@/contexts/SearchContext';
import { synergySearchService, useSynergyIndex } from '@/core/search';
import { SynergyGraph } from '@/components/admin/SynergyGraph';
import { Network, ArrowRight, Link2, Sparkles, AlertTriangle, Info, LayoutGrid, GitBranch, ChevronDown } from 'lucide-react';
import type { DbSynergy } from '@/db/schema';
import type { SynergyType } from '@/types/shared-enums';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof Link2 }> = {
  sinergia: { 
    label: 'Sinergia', 
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', 
    icon: Sparkles 
  },
  complemento: { 
    label: 'Complemento', 
    color: 'bg-blue-500/10 text-blue-600 border-blue-200', 
    icon: Link2 
  },
  interaccion: { 
    label: 'Interaccion', 
    color: 'bg-violet-500/10 text-violet-600 border-violet-200', 
    icon: Network 
  },
  antagonismo: { 
    label: 'Antagonismo', 
    color: 'bg-red-500/10 text-red-600 border-red-200', 
    icon: AlertTriangle 
  },
};

const LEVEL_CONFIG: Record<string, { label: string; color: string }> = {
  alto: { label: 'Evidencia alta', color: 'bg-green-100 text-green-800' },
  medio: { label: 'Evidencia media', color: 'bg-yellow-100 text-yellow-800' },
  bajo: { label: 'Evidencia baja', color: 'bg-gray-100 text-gray-800' },
};

/** Tipos de sinergia disponibles como filtros (orden de relevancia clínica). */
const TYPE_FILTERS: { value: SynergyType; label: string }[] = [
  { value: 'sinergia', label: 'Sinergia' },
  { value: 'complemento', label: 'Complemento' },
  { value: 'interaccion', label: 'Interacción' },
  { value: 'antagonismo', label: 'Antagonismo' },
];

const EVIDENCE_FILTERS: { value: 'A' | 'B' | 'C' | 'D'; label: string }[] = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
];

const PAGE_SIZE = 24;

type ViewMode = 'graph' | 'grid';

export function SynergiesPage() {
  const [searchParams] = useSearchParams();
  const { query } = useSearch();
  const { ready } = useSynergyIndex();
  const [selectedSynergy, setSelectedSynergy] = useState<DbSynergy | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(
    searchParams.get('ingredient')
  );
  const [filterTipo, setFilterTipo] = useState<SynergyType | null>(null);
  const [filterEvidencia, setFilterEvidencia] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Guarda la "firma" de los filtros activos para resetear la paginación
  // cuando cambian, sin usar useEffect (que dispararía renders en cascada).
  const filterSignature = `${query ?? ''}|${filterTipo ?? ''}|${filterEvidencia ?? ''}|${selectedIngredientId ?? ''}|${viewMode}`;
  const [lastFilterSignature, setLastFilterSignature] = useState(filterSignature);
  if (filterSignature !== lastFilterSignature) {
    setLastFilterSignature(filterSignature);
    setVisibleCount(PAGE_SIZE);
  }

  // Mapa de nombres de ingredientes (del servicio de búsqueda).
  const ingredientNames = useMemo(
    () => (ready ? synergySearchService.getIngredientNames() : {}),
    [ready],
  );

  // Conteos de facets para mostrar en los chips de filtro.
  const tipoCounts = useMemo(
    () => (ready ? synergySearchService.tipoCounts() : new Map<string, number>()),
    [ready],
  );

  const filteredResults = useMemo(() => {
    if (!ready) return [];
    return synergySearchService.searchSync({
      query,
      tipo: filterTipo ?? undefined,
      evidencia: filterEvidencia ?? undefined,
      ingredientId: selectedIngredientId ?? undefined,
    });
  }, [ready, query, filterTipo, filterEvidencia, selectedIngredientId]);

  const visibleResults = useMemo(
    () => filteredResults.slice(0, visibleCount),
    [filteredResults, visibleCount],
  );

  const hasMore = filteredResults.length > visibleCount;
  const loadMore = useCallback(() => setVisibleCount((c) => c + PAGE_SIZE), []);

  const getTypeConfig = (tipo: string) => {
    return TYPE_CONFIG[tipo] || TYPE_CONFIG.interaccion;
  };

  const getLevelConfig = (nivel: string) => {
    return LEVEL_CONFIG[nivel] || LEVEL_CONFIG.bajo;
  };

  const nameFor = useCallback(
    (id: string) => ingredientNames[id] || id,
    [ingredientNames],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Sinergias</h1>
          <p className="text-muted-foreground mt-1">
            {!ready
              ? 'Cargando...'
              : `${filteredResults.length} ${filteredResults.length === 1 ? 'combinación' : 'combinaciones'}`}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setViewMode('graph')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-md text-[15px] transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-background',
              viewMode === 'graph'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <GitBranch className="w-5 h-5" aria-hidden="true" />
            <span className="hidden sm:inline">Grafo</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-md text-[15px] transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-background',
              viewMode === 'grid'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LayoutGrid className="w-5 h-5" aria-hidden="true" />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>

      {/* Filtros por tipo y evidencia */}
      {ready && (
        <div className="flex flex-col gap-3">
          {/* Filtro por tipo */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground shrink-0 uppercase tracking-wide">Tipo</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterTipo(null)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  !filterTipo
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:bg-muted'
                )}
              >
                Todos
              </button>
              {TYPE_FILTERS.map((tf) => {
                const isActive = filterTipo === tf.value;
                const count = tipoCounts.get(tf.value) ?? 0;
                if (count === 0 && !isActive) return null;
                const Icon = TYPE_CONFIG[tf.value]?.icon ?? Link2;
                return (
                  <button
                    key={tf.value}
                    onClick={() => setFilterTipo(isActive ? null : tf.value)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-foreground border-border hover:bg-muted hover:border-primary/40'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    {tf.label}
                    <span className={cn('text-xs tabular-nums', isActive ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtro por evidencia */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground shrink-0 uppercase tracking-wide">Evidencia</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterEvidencia(null)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  !filterEvidencia
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:bg-muted'
                )}
              >
                Todas
              </button>
              {EVIDENCE_FILTERS.map((ef) => {
                const isActive = filterEvidencia === ef.value;
                return (
                  <button
                    key={ef.value}
                    onClick={() => setFilterEvidencia(isActive ? null : ef.value)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-foreground border-border hover:bg-muted hover:border-primary/40'
                    )}
                  >
                    {ef.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Active ingredient filter banner */}
      {selectedIngredientId && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/5 border border-primary/20">
          <Link2 className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">Sinergias de</span>
          <span className="text-sm font-semibold text-foreground">
            {nameFor(selectedIngredientId)}
          </span>
          <Badge variant="secondary" className="text-xs">
            {filteredResults.length}
          </Badge>
          <button
            onClick={() => setSelectedIngredientId(null)}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-2 py-1"
          >
            ✕ Quitar filtro
          </button>
        </div>
      )}

      {/* Content based on view mode */}
      {!ready ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="text-center py-12">
          <Network className="w-12 h-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
          <p className="text-muted-foreground font-medium">No se encontraron sinergias</p>
          <p className="text-sm text-muted-foreground mt-1">
            {query || filterTipo || filterEvidencia ? 'Prueba con otros términos o filtros' : 'No hay sinergias cargadas aún'}
          </p>
        </div>
      ) : viewMode === 'graph' ? (
        <>
          {/* Graph Visualization */}
          <Card className="p-1">
            <SynergyGraph
              synergies={visibleResults.map((r) => r.synergy)}
              ingredients={ingredientNames}
              onNodeClick={(id) => setSelectedIngredientId(id)}
              onEdgeClick={(synergy) => setSelectedSynergy(synergy)}
              className="h-96"
            />
            {selectedIngredientId && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {nameFor(selectedIngredientId)}
                </span>
                <span className="text-xs">seleccionado</span>
                <button
                  onClick={() => setSelectedIngredientId(null)}
                  className="ml-auto text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Limpiar
                </button>
              </div>
            )}
          </Card>

          {/* Selected Synergy Detail */}
          {selectedSynergy && (
            <Card className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const typeConfig = getTypeConfig(selectedSynergy.tipo);
                    const TypeIcon = typeConfig.icon;
                    return (
                      <>
                        <div className={cn('p-2 rounded-lg border', typeConfig.color)}>
                          <TypeIcon className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {nameFor(selectedSynergy.ingredienteA)}
                            {' → '}
                            {nameFor(selectedSynergy.ingredienteB)}
                          </h3>
                          <div className="flex gap-2 mt-1">
                            <Badge className={cn(typeConfig.color, 'border text-xs')}>
                              {typeConfig.label}
                            </Badge>
                            <Badge className={cn(getLevelConfig(selectedSynergy.nivel).color, 'text-xs')}>
                              {getLevelConfig(selectedSynergy.nivel).label}
                            </Badge>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedSynergy(null)}
                >
                  Cerrar
                </Button>
              </div>
              {selectedSynergy.mecanismo && (
                <p className="text-sm text-muted-foreground">{selectedSynergy.mecanismo}</p>
              )}
            </Card>
          )}

          {/* Quick List below graph */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleResults.slice(0, 6).map(({ synergy }) => {
              const typeConfig = getTypeConfig(synergy.tipo);
              const TypeIcon = typeConfig.icon;
              const nameA = nameFor(synergy.ingredienteA);
              const nameB = nameFor(synergy.ingredienteB);

              return (
                <Card 
                  key={synergy.id} 
                  className="p-3 hover:border-primary transition-colors cursor-pointer"
                  onClick={() => setSelectedSynergy(synergy)}
                >
                  <div className="flex items-center gap-2">
                    <TypeIcon className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm font-medium truncate">{nameA}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm font-medium truncate">{nameB}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        /* Grid View */
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleResults.map(({ synergy }) => {
              const typeConfig = getTypeConfig(synergy.tipo);
              const levelConfig = getLevelConfig(synergy.nivel);
              const TypeIcon = typeConfig.icon;
              const nameA = nameFor(synergy.ingredienteA);
              const nameB = nameFor(synergy.ingredienteB);

              return (
                <Card 
                  key={synergy.id} 
                  className="p-5 hover:border-primary transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className={cn('p-3 rounded-xl border', typeConfig.color)}>
                      <TypeIcon className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Ingredients connection */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{nameA}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                        <span className="font-semibold">{nameB}</span>
                      </div>
                      
                      {/* Type and Level badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge className={cn(typeConfig.color, 'border text-xs')}>
                          {typeConfig.label}
                        </Badge>
                        <Badge className={cn(levelConfig.color, 'text-xs')}>
                          {levelConfig.label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Mechanism */}
                  {synergy.mecanismo && (
                    <p className="text-sm text-muted-foreground mt-3 pl-16">
                      {synergy.mecanismo}
                    </p>
                  )}

                  {/* Evidence indicator */}
                  {synergy.evidencia && (
                    <div className="flex items-center gap-1 mt-3 pl-16">
                      <Info className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                      <span className="text-xs text-muted-foreground">
                        Evidencia: {synergy.evidencia}
                      </span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={loadMore}
                className="gap-1"
              >
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
                Ver más ({filteredResults.length - visibleCount} restantes)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
