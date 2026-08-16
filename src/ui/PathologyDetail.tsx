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
import {
  X, AlertTriangle, Pill, Leaf, FlaskConical, Home, Droplet,
  Shield, Stethoscope, BookOpen, Lightbulb, ChevronRight,
  Users, AlertOctagon, ChevronDown, Package,
} from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface PathologyDetailProps {
  pathology: DbPathology;
  onClose: () => void;
  onIngredientClick?: (id: string) => void;
  onProductClick?: (product: DbProduct) => void;
}

const EVIDENCE_COLORS = {
  A: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30',
  B: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/30',
  C: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30',
  D: 'bg-gray-500/15 text-gray-600 dark:text-gray-300 ring-1 ring-gray-500/30',
} as const;

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

  const evidenceColor = EVIDENCE_COLORS[pathology.evidencia] || EVIDENCE_COLORS.C;

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
        className="relative bg-card w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl animate-scale-in"
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

          {/* Tratamiento Natural — sección hero (protagonista) */}
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
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
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
              <div className="space-y-2">
                {currentTabIds.map(id => {
                  const ing = ingredientMap.get(id);
                  return (
                    <button
                      key={id}
                      onClick={() => onIngredientClick?.(id)}
                      className="w-full text-left flex items-center justify-between gap-2 p-3 rounded-lg bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-colors group ring-1 ring-emerald-200/60 dark:ring-white/10"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-foreground">{ing?.nombre || id}</p>
                        {ing && (
                          <p className="text-xs text-muted-foreground truncate">
                            {ing.sinonimos?.slice(0, 2).join(', ')}
                          </p>
                        )}
                      </div>
                      {ing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${EVIDENCE_COLORS[ing.evidencia] || EVIDENCE_COLORS.C}`}>
                            {ing.evidencia}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                        </div>
                      )}
                    </button>
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
                  <p className="text-sm text-foreground">
                    <span className="font-medium">¿Cuándo preferir lo natural? </span>
                    {pathology.tratamientoNatural.cuandoPreferir}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Productos comerciales indicados — Fase 2 (lookup transitivo) */}
          {pathologyProducts && pathologyProducts.length > 0 && (
            <section className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="font-bold text-sm uppercase tracking-wide text-sky-800 dark:text-sky-300">
                  Productos comerciales indicados
                </h3>
                <span className="text-xs text-sky-700 dark:text-sky-400 opacity-70">
                  {pathologyProducts.length}
                </span>
              </div>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {pathologyProducts.slice(0, 12).map((pp) => (
                  <button
                    key={pp.product.sku}
                    onClick={() => onProductClick?.(pp.product)}
                    className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {pp.product.nombreComercial}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {(pp.product.principiosActivos ?? []).slice(0, 3).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {pp.analysis && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${
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
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-sky-500/15 text-sky-700 dark:text-sky-300">
                          {pp.matchedCount} en KB
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
                    </div>
                  </button>
                ))}
                {pathologyProducts.length > 12 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{pathologyProducts.length - 12} productos más
                  </p>
                )}
              </div>
            </section>
          )}

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
      </div>
    </div>
  );
}
