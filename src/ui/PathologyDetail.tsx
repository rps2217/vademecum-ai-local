/**
 * PathologyDetail - Modal de detalle de patología con contexto clínico
 *
 * Foco en consulta rápida de farmacia: resumen + tratamiento natural +
 * alertas de seguridad. Información clínica detallada bajo demanda.
 */

import { useMemo, useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import type { DbPathology, DbIngredient, DbProduct } from '@/db/schema';
import { useProductsForPathology } from '@/hooks/useProductsForPathology';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import {
  X, AlertTriangle, Pill, Leaf, FlaskConical, Home, Droplet,
  Shield, Stethoscope, BookOpen, Lightbulb, ChevronRight,
  Users, AlertOctagon, ChevronDown, Package, Sparkles,
  Award, Search,
} from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { getEvidenceConfig } from '@/ui/searchConfig';
import {
  classifyProductRoute,
  selectCounterRecommendations,
  USAGE_ROUTES,
  type ProductUsageRoute,
} from '@/core/catalog/productUsageClassifier';
import { useClientProfile } from '@/contexts/ClientProfileContext';

function generateClinicalExplanation(
  name: string,
  type: 'ingredient' | 'product',
  pathologyName: string,
  mechanism?: string,
  description?: string,
  principiosActivos?: string[]
): string {
  if (type === 'ingredient') {
    const mechText = mechanism || description || 'aporta compuestos activos específicos';
    return `En el tratamiento de ${pathologyName}, ${name} actúa mediante ${mechText.toLowerCase()}, lo que ayuda a contrarrestar los síntomas principales y favorece la resolución clínica de forma natural.`;
  } else {
    const actives = principiosActivos?.length ? ` sus principios activos principales (${principiosActivos.join(', ')})` : '';
    return `Para ${pathologyName}, este producto comercial aporta${actives} con acción sinérgica orientada a aliviar los síntomas y proteger los sistemas afectados, facilitando una recomendación directa y segura en el mostrador.`;
  }
}

interface PathologyDetailProps {
  pathology: DbPathology;
  onClose: () => void;
  onIngredientClick?: (id: string) => void;
  onProductClick?: (product: DbProduct) => void;
}

const SYSTEM_LABELS: Record<string, string> = {
  nervioso: 'Sistema nervioso',
  digestivo: 'Sistema digestivo',
  inmune: 'Sistema inmunitario',
  cardiovascular: 'Sistema cardiovascular',
  respiratorio: 'Sistema respiratorio',
  musculoesqueletico: 'Sistema musculoesquelético',
  endocrino: 'Sistema endocrino',
  dermatologico: 'Sistema dermatológico',
  reproductivo: 'Sistema reproductor',
  urinario: 'Sistema urinario',
  ocular: 'Sistema ocular',
  hepatico: 'Sistema hepático',
  metabolico: 'Sistema metabólico',
};

type NaturalCat = 'fitoterapia' | 'suplementos' | 'homeopatia' | 'aceites';

const NATURAL_TABS: { key: NaturalCat; label: string; icon: typeof Leaf }[] = [
  { key: 'fitoterapia', label: 'Fitoterapia', icon: Leaf },
  { key: 'suplementos', label: 'Suplementos', icon: FlaskConical },
  { key: 'homeopatia', label: 'Homeopatía', icon: Home },
  { key: 'aceites', label: 'Aceites', icon: Droplet },
];

export function PathologyDetail({ pathology, onClose, onIngredientClick, onProductClick }: PathologyDetailProps) {
  const [activeTab, setActiveTab] = useState<NaturalCat>('fitoterapia');
  const [explainingItem, setExplainingItem] = useState<{
    id?: string;
    type: 'ingredient' | 'product';
    title: string;
    subtitle: string;
    mecanismo?: string;
    descripcion?: string;
    principiosActivos?: string[];
  } | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplainingLoading, setIsExplainingLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Cargar todos los ingredientes referenciados en tratamientoNatural
  const allReferencedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cat of NATURAL_TABS) {
      for (const id of pathology.tratamientoNatural[cat.key]) {
        ids.add(id);
      }
    }
    return Array.from(ids);
  }, [pathology]);

  const ingredients = useLiveQuery(
    async () => {
      if (allReferencedIds.length === 0) return [] as DbIngredient[];
      return db.ingredients.bulkGet(allReferencedIds);
    },
    [allReferencedIds],
  );

  const ingredientMap = useMemo(() => {
    const m = new Map<string, DbIngredient>();
    if (ingredients) {
      for (const ing of ingredients) {
        if (ing) m.set(ing.id, ing);
      }
    }
    return m;
  }, [ingredients]);

  // Fase 2: lookup inverso patología → productos (vía bridge de ingredientes).
  const pathologyProducts = useProductsForPathology(allReferencedIds);

  const { profile: activeClientProfile } = useClientProfile();
  const [selectedRoute, setSelectedRoute] = useState<ProductUsageRoute | 'todas'>('todas');
  const [productSearch, setProductSearch] = useState('');

  // Perfil del cliente adaptado a restricciones
  const clientProfileFilter = useMemo(() => {
    if (!activeClientProfile || activeClientProfile === 'ninguno') return null;
    return {
      embarazo: activeClientProfile === 'embarazada',
      lactancia: activeClientProfile === 'lactante',
      pediatria: activeClientProfile === 'pediatrico',
      hipertension: activeClientProfile === 'hipertenso',
      diabetes: activeClientProfile === 'diabetico',
    };
  }, [activeClientProfile]);

  // Selección de la estrategia prioritaria de mostrador (Top 3 jerárquico)
  const counterStrategy = useMemo(() => {
    return selectCounterRecommendations(pathologyProducts || [], pathology, clientProfileFilter);
  }, [pathologyProducts, pathology, clientProfileFilter]);

  // Vías de administración disponibles para esta patología
  const availableRoutes = useMemo(() => {
    if (!pathologyProducts || pathologyProducts.length === 0) return [];
    const counts: Record<string, number> = {};
    for (const pp of pathologyProducts) {
      const r = classifyProductRoute(pp.product);
      counts[r] = (counts[r] || 0) + 1;
    }
    const routesList: { route: ProductUsageRoute; count: number }[] = [];
    const order: ProductUsageRoute[] = ['oral', 'topico', 'respiratorio', 'bucal', 'ocular', 'otico', 'otro'];
    for (const r of order) {
      if (counts[r]) {
        routesList.push({ route: r, count: counts[r] });
      }
    }
    return routesList;
  }, [pathologyProducts]);

  // Productos filtrados según la vía seleccionada y búsqueda
  const filteredCommercialProducts = useMemo(() => {
    if (!pathologyProducts) return [];
    let list = pathologyProducts;

    if (selectedRoute !== 'todas') {
      list = list.filter((pp) => classifyProductRoute(pp.product) === selectedRoute);
    }

    if (productSearch.trim()) {
      const q = productSearch.trim().toLowerCase();
      list = list.filter(
        (pp) =>
          pp.product.nombreComercial.toLowerCase().includes(q) ||
          (pp.product.principiosActivos ?? []).some((act) => act.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [pathologyProducts, selectedRoute, productSearch]);

  const evidenceColor = getEvidenceConfig(pathology.evidencia).color;

  const currentTabIds = pathology.tratamientoNatural[activeTab] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha de ${pathology.nombre}`}
        className="relative bg-card w-full max-w-[96vw] lg:max-w-[1550px] max-h-[92vh] overflow-y-auto rounded-xl shadow-xl animate-scale-in"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">{pathology.nombre}</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${evidenceColor}`}>
                Ev. {pathology.evidencia}
              </span>
            </div>
            {pathology.sistemas.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {pathology.sistemas.map(sys => (
                  <Badge key={sys} variant="secondary">
                    {SYSTEM_LABELS[sys] || sys}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Resumen clínico — definición + síntomas (reconocimiento rápido) */}
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Resumen clínico</h3>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{pathology.definicion}</p>
            {pathology.sintomas.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {pathology.sintomas.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/20">{s}</span>
                ))}
              </div>
            )}
          </section>

          {/* Grid de Productos Comerciales (1º) y Tratamiento Natural (2º) lado a lado en lg */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* 1. Productos comerciales indicados y Estrategia de Mostrador */}
            <section className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  <h3 className="font-bold text-sm uppercase tracking-wide text-sky-800 dark:text-sky-300">
                    Productos comerciales indicados
                  </h3>
                  {pathologyProducts && pathologyProducts.length > 0 && (
                    <span className="text-xs bg-sky-200/70 dark:bg-sky-800/60 text-sky-800 dark:text-sky-200 px-2 py-0.5 rounded-full font-semibold">
                      {pathologyProducts.length}
                    </span>
                  )}
                </div>
                {activeClientProfile && activeClientProfile !== 'ninguno' && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 font-semibold">
                    Perfil: {activeClientProfile}
                  </span>
                )}
              </div>

              {/* BLOQUE DE PODIO: ESTRATEGIA DE DISPENSACIÓN RECOMENDADA (TOP DE MOSTRADOR) */}
              {counterStrategy.length > 0 && (
                <div className="rounded-xl border border-sky-300 dark:border-sky-700 bg-card p-3 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 dark:text-sky-200 uppercase tracking-wider">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>Estrategia de Mostrador Recomendada</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      Top {counterStrategy.length} sinérgico
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {counterStrategy.map((rec) => {
                      const routeInfo = USAGE_ROUTES[rec.route];
                      return (
                        <div
                          key={`strat-${rec.item.product.sku}`}
                          className="p-2.5 rounded-lg border border-border/80 bg-muted/20 hover:border-sky-400 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200">
                                {rec.roleTitle}
                              </span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${routeInfo.badgeClass}`}>
                                {routeInfo.shortLabel}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => onProductClick?.(rec.item.product)}
                              className="text-sm font-bold text-foreground truncate cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-left block w-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                            >
                              {rec.item.product.nombreComercial}
                            </button>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {rec.roleDescription}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsExplainingLoading(true);
                                setExplainingItem({
                                  type: 'product',
                                  title: rec.item.product.nombreComercial,
                                  subtitle: `Rol en ${pathology.nombre}: ${rec.roleTitle}`,
                                  descripcion: rec.item.product.comoFunciona || rec.item.product.como_funciona,
                                  principiosActivos: rec.item.product.principiosActivos,
                                });
                                setTimeout(() => setIsExplainingLoading(false), 250);
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 hover:bg-sky-200 text-xs font-semibold cursor-pointer"
                              title="Cómo actúa este producto"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                              <span>Cómo actúa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onProductClick?.(rec.item.product)}
                              className="px-2 py-1 rounded-md border border-border text-xs font-medium hover:bg-muted cursor-pointer flex items-center gap-0.5"
                            >
                              <span>Ver</span>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BARRA DE FILTRADO POR VÍA DE ADMINISTRACIÓN Y BÚSQUEDA */}
              {pathologyProducts && pathologyProducts.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-sky-200/80 dark:border-sky-800/60">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none flex-1">
                      <button
                        type="button"
                        onClick={() => setSelectedRoute('todas')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors border cursor-pointer ${
                          selectedRoute === 'todas'
                            ? 'bg-foreground text-background border-foreground font-semibold shadow-2xs'
                            : 'bg-card text-muted-foreground border-border hover:text-foreground'
                        }`}
                      >
                        Todas las vías ({pathologyProducts.length})
                      </button>
                      {availableRoutes.map((ar) => {
                        const isSelected = selectedRoute === ar.route;
                        const info = USAGE_ROUTES[ar.route];
                        return (
                          <button
                            key={ar.route}
                            type="button"
                            onClick={() => setSelectedRoute(isSelected ? 'todas' : ar.route)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors border cursor-pointer ${
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-2xs'
                                : 'bg-card text-muted-foreground border-border hover:text-foreground'
                            }`}
                          >
                            {info.shortLabel} ({ar.count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Búsqueda rápida opcional dentro de los productos de la patología */}
                  {pathologyProducts.length > 4 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Filtrar catálogo de esta patología por marca o activo..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full text-xs bg-card border border-border rounded-lg pl-8 pr-2.5 py-1.5 placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* LISTADO DE ALTERNATIVAS CATALOGADAS */}
              {filteredCommercialProducts.length > 0 ? (
                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                  {filteredCommercialProducts.map((pp) => {
                    const route = classifyProductRoute(pp.product);
                    const routeInfo = USAGE_ROUTES[route];
                    return (
                      <div
                        key={pp.product.sku}
                        className="w-full flex items-center gap-2 p-2 rounded-lg bg-card border border-border hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-all text-left group"
                      >
                        <button
                          type="button"
                          onClick={() => onProductClick?.(pp.product)}
                          className="flex-1 min-w-0 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${routeInfo.badgeClass}`}>
                              {routeInfo.shortLabel}
                            </span>
                            <p className="text-xs sm:text-sm font-semibold truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                              {pp.product.nombreComercial}
                            </p>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {(pp.product.principiosActivos ?? []).slice(0, 3).join(', ')}
                          </p>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsExplainingLoading(true);
                              setExplainingItem({
                                type: 'product',
                                title: pp.product.nombreComercial,
                                subtitle: `Contexto clínico: ${pathology.nombre}`,
                                descripcion: pp.product.comoFunciona || pp.product.como_funciona,
                                principiosActivos: pp.product.principiosActivos,
                              });
                              setTimeout(() => setIsExplainingLoading(false), 250);
                            }}
                            className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900 text-[11px] font-medium transition-colors cursor-pointer"
                            title="Cómo actúa (Asistente IA)"
                          >
                            <Sparkles className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                            <span>Cómo</span>
                          </button>
                          {pp.analysis && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                pp.analysis.coberturaKb >= 100
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : pp.analysis.coberturaKb >= 50
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                    : 'bg-red-500/15 text-red-700 dark:text-red-300'
                              }`}
                              title={`${pp.matchedCount} ingrediente(s) de esta patología`}
                            >
                              {pp.matchedCount} en KB
                            </span>
                          )}
                          {!pp.analysis && pp.matchedCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-500/15 text-sky-700 dark:text-sky-300">
                              {pp.matchedCount} en KB
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => onProductClick?.(pp.product)}
                            className="p-1 hover:text-sky-600 transition-colors cursor-pointer"
                            aria-label="Ver producto"
                          >
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-5 text-center text-muted-foreground text-xs italic bg-card/60 rounded-lg border border-dashed border-border">
                  {productSearch.trim() || selectedRoute !== 'todas'
                    ? 'No hay productos comerciales que coincidan con la vía o término de búsqueda seleccionado.'
                    : 'No hay productos comerciales asociados en el catálogo actual para esta patología.'}
                </div>
              )}
            </section>

            {/* 2. Tratamiento Natural */}
            <section className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
              <div className="flex items-center gap-2 mb-3">
                <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-sm uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                  Tratamiento Natural
                </h3>
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap gap-1 mb-3 border-b border-emerald-200 dark:border-emerald-800/60">
                {NATURAL_TABS.map(tab => {
                  const count = pathology.tratamientoNatural[tab.key]?.length || 0;
                  if (count === 0) return null;
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                        isActive
                          ? 'border-emerald-600 text-emerald-700 dark:text-emerald-300'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      <span className="text-xs opacity-60">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Ingredient list for active tab */}
              {currentTabIds.length > 0 ? (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {currentTabIds.map(id => {
                    const ing = ingredientMap.get(id);
                    return (
                      <div
                        key={id}
                        className="w-full text-left flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-colors group ring-1 ring-emerald-200/60 dark:ring-white/10"
                      >
                        <button
                          type="button"
                          onClick={() => onIngredientClick?.(id)}
                          className="flex-1 min-w-0 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                        >
                          <p className="font-medium text-sm truncate text-foreground">{ing?.nombre || id}</p>
                          {ing && (
                            <p className="text-xs text-muted-foreground truncate">
                              {ing.sinonimos?.slice(0, 2).join(', ')}
                            </p>
                          )}
                        </button>
                        {ing && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                setIsExplainingLoading(true);
                                setExplainingItem({
                                  id: ing.id,
                                  type: 'ingredient',
                                  title: ing.nombre,
                                  subtitle: `Contexto clínico: ${pathology.nombre}`,
                                  mecanismo: ing.propiedades?.[1] || ing.propiedades?.[0],
                                  descripcion: ing.propiedades?.[0],
                                });
                                try {
                                  const record = await db.clinicalExplanations
                                    .where({ ingredienteId: ing.id, patologiaId: pathology.id })
                                    .first();
                                  setExplanation(record?.explicacion || null);
                                } catch (err) {
                                  console.error('Error fetching clinical explanation:', err);
                                  setExplanation(null);
                                } finally {
                                  setIsExplainingLoading(false);
                                }
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-xs font-medium transition-colors"
                              title="Cómo actúa (Explicación clínica)"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Cómo</span>
                            </button>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getEvidenceConfig(ing.evidencia).color}`}>
                              {ing.evidencia}
                            </span>
                            <button
                              type="button"
                              onClick={() => onIngredientClick?.(id)}
                              className="p-1 hover:text-emerald-600 transition-colors cursor-pointer"
                              aria-label="Ver ingrediente"
                            >
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No hay ingredientes en esta categoría.</p>
              )}

              {/* Cuándo preferir natural */}
              {pathology.tratamientoNatural.cuandoPreferir && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/60">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-xs sm:text-sm text-foreground">
                      <span className="font-medium">¿Cuándo preferir lo natural? </span>
                      {pathology.tratamientoNatural.cuandoPreferir}
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Alertas farmacéuticas — visible (safety) */}
          {pathology.alertasFarmaceuticas && pathology.alertasFarmaceuticas.length > 0 && (
            <div className="p-4 rounded-lg bg-amber-500/10 ring-1 ring-amber-500/30">
              <div className="flex items-start gap-2">
                <AlertOctagon className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-amber-800 dark:text-amber-200 mb-1">
                    Alertas farmacéuticas
                  </p>
                  <ul className="space-y-1">
                    {pathology.alertasFarmaceuticas.map((alerta, i) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {alerta}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Cuándo consultar - Red Flags — visible (safety) */}
          {pathology.cuandoConsultar && (
            <div className="p-4 rounded-lg bg-red-500/10 ring-1 ring-red-500/30">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-red-800 dark:text-red-200 mb-1">
                    ¿Cuándo consultar al médico?
                  </p>
                  <p className="text-sm text-foreground">{pathology.cuandoConsultar}</p>
                </div>
              </div>
            </div>
          )}

          {/* === Secciones contraídas (disponibles bajo demanda) === */}

          {/* Tratamiento Alopático — contraído */}
          <details className="group rounded-lg border border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20">
            <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
              <Pill className="w-4 h-4 text-red-500" />
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex-1">Tratamiento Convencional (Alopático)</h3>
              <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-3 pb-3 pt-1 space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Primera línea</p>
                <div className="flex flex-wrap gap-2">
                  {pathology.tratamientoAlopatico.primeraLinea.map((med, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{med}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Mecanismo de acción</p>
                <p className="text-sm text-muted-foreground">{pathology.tratamientoAlopatico.mecanismo}</p>
              </div>
              {pathology.tratamientoAlopatico.efectosSecundarios.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Efectos secundarios</p>
                  <div className="flex flex-wrap gap-1">
                    {pathology.tratamientoAlopatico.efectosSecundarios.map((ef, i) => (
                      <Badge key={i} variant="danger" className="text-xs">{ef}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>

          {/* Prevención — contraído */}
          {pathology.prevencion.length > 0 && (
            <details className="group rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20">
              <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                <Shield className="w-4 h-4 text-indigo-500" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex-1">Prevención</h3>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-3 pb-3 pt-1">
                <div className="flex flex-wrap gap-2">
                  {pathology.prevencion.map((prev, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{prev}</Badge>
                  ))}
                </div>
              </div>
            </details>
          )}

          {/* Poblaciones especiales — contraído por defecto */}
          {pathology.poblacionesEspeciales && pathology.poblacionesEspeciales.length > 0 && (
            <details className="group rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20">
              <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                <Users className="w-4 h-4 text-indigo-500" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex-1">Poblaciones especiales</h3>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-3 pb-3 pt-1 space-y-2">
                {pathology.poblacionesEspeciales.map((pob, i) => (
                  <div key={i} className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900">
                    <p className="text-sm font-medium">{pob.poblacion}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{pob.consideraciones}</p>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Fuentes — pie discreto */}
          {pathology.fuentes.length > 0 && (
            <p className="text-[10px] text-muted-foreground/60 pt-1">
              {pathology.fuentes.join(' · ')}
            </p>
          )}
        </div>

        {/* Modal de explicación clínica (LLM local / inteligente) */}
        {explainingItem && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 animate-fade-in p-4">
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-border animate-scale-in space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">{explainingItem.title}</h3>
                    <p className="text-xs text-muted-foreground">{explainingItem.subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setExplainingItem(null)}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-primary" />
                  <span>Explicación clínica de mostrador</span>
                </p>
                {isExplainingLoading ? (
                  <div className="py-6 flex flex-col items-center justify-center space-y-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-muted-foreground animate-pulse">Consultando base de evidencia clínica...</p>
                  </div>
                ) : (
                  <p className="text-sm text-foreground leading-relaxed">
                    {explanation || (explainingItem.type === 'ingredient' && explainingItem.id && ingredientMap.get(explainingItem.id)?.beneficioCliente) || generateClinicalExplanation(
                      explainingItem.title,
                      explainingItem.type,
                      pathology.nombre,
                      explainingItem.mecanismo,
                      explainingItem.descripcion,
                      explainingItem.principiosActivos
                    )}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = explanation || (explainingItem.type === 'ingredient' && explainingItem.id && ingredientMap.get(explainingItem.id)?.beneficioCliente) || generateClinicalExplanation(
                      explainingItem.title,
                      explainingItem.type,
                      pathology.nombre,
                      explainingItem.mecanismo,
                      explainingItem.descripcion,
                      explainingItem.principiosActivos
                    );
                    navigator.clipboard.writeText(text);
                  }}
                >
                  Copiar respuesta
                </Button>
                <Button
                  size="sm"
                  onClick={() => setExplainingItem(null)}
                >
                  Entendido
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
