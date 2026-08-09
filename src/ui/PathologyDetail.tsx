/**
 * PathologyDetail - Modal de detalle de patología con contexto clínico
 *
 * Muestra: definición, causas, síntomas, tratamiento alopático vs natural,
 * prevención y cuándo consultar al médico.
 */

import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import type { DbPathology, DbIngredient } from '@/db/schema';
import { Badge } from '@/ui/Badge';
import {
  X, AlertTriangle, Pill, Leaf, FlaskConical, Home, Droplet,
  Shield, Activity, Stethoscope, BookOpen, Lightbulb, ChevronRight,
  Microscope, Users, AlertOctagon, ClipboardList, ChevronDown,
} from 'lucide-react';

interface PathologyDetailProps {
  pathology: DbPathology;
  onClose: () => void;
  onIngredientClick?: (id: string) => void;
}

const EVIDENCE_COLORS = {
  A: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  B: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  C: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  D: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
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

export function PathologyDetail({ pathology, onClose, onIngredientClick }: PathologyDetailProps) {
  const [activeTab, setActiveTab] = useState<NaturalCat>('fitoterapia');

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

  const evidenceColor = EVIDENCE_COLORS[pathology.evidencia] || EVIDENCE_COLORS.C;

  const currentTabIds = pathology.tratamientoNatural[activeTab] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in p-4" onClick={onClose}>
      <div
        className="bg-card w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl animate-scale-in"
        onClick={e => e.stopPropagation()}
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
          {/* Resumen clínico — definición + síntomas + causas fusionados */}
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Resumen clínico</h3>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{pathology.definicion}</p>
            {pathology.sintomas.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {pathology.sintomas.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">{s}</span>
                ))}
              </div>
            )}
            {pathology.causas.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {pathology.causas.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">{c}</span>
                ))}
              </div>
            )}
          </section>

          {/* Tratamiento Natural — sección hero (protagonista) */}
          <section className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border-2 border-green-300 dark:border-green-800">
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="font-bold text-sm uppercase tracking-wide text-green-800 dark:text-green-300">
                Tratamiento Natural
              </h3>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 mb-3 border-b border-green-200 dark:border-green-800">
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
                        ? 'border-green-600 text-green-700 dark:text-green-300'
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
                      className="w-full text-left flex items-center justify-between gap-2 p-3 rounded-lg bg-white dark:bg-card hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group border border-green-100 dark:border-green-900"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{ing?.nombre || id}</p>
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
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
              <div className="mt-3 p-3 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground">
                    <span className="font-medium">¿Cuándo preferir lo natural? </span>
                    {pathology.tratamientoNatural.cuandoPreferir}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Alertas farmacéuticas — visible (safety) */}
          {pathology.alertasFarmaceuticas && pathology.alertasFarmaceuticas.length > 0 && (
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
              <div className="flex items-start gap-2">
                <AlertOctagon className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-amber-900 dark:text-amber-200 mb-1">
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
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-red-900 dark:text-red-200 mb-1">
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

          {/* Factores de riesgo — contraído */}
          {pathology.factoresRiesgo && pathology.factoresRiesgo.length > 0 && (
            <details className="group rounded-lg border border-orange-200 dark:border-orange-900 bg-orange-50/40 dark:bg-orange-950/20">
              <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                <AlertOctagon className="w-4 h-4 text-orange-500" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex-1">Factores de riesgo</h3>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-3 pb-3 pt-1">
                <div className="flex flex-wrap gap-2">
                  {pathology.factoresRiesgo.map((fr, i) => (
                    <Badge key={i} variant="secondary" className="text-xs bg-orange-50 dark:bg-orange-950/30">{fr}</Badge>
                  ))}
                </div>
              </div>
            </details>
          )}

          {/* Diagnóstico — contraído por defecto */}
          {pathology.diagnostico && (
            <details className="group rounded-lg border border-purple-200 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/20">
              <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                <Microscope className="w-4 h-4 text-purple-500" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex-1">Diagnóstico</h3>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-3 pb-3 pt-1 space-y-2">
                <p className="text-sm text-foreground leading-relaxed">{pathology.diagnostico}</p>
                {pathology.criteriosDiagnostico && pathology.criteriosDiagnostico.length > 0 && (
                  <ul className="space-y-1">
                    {pathology.criteriosDiagnostico.map((crit, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-purple-500 mt-0.5">•</span>
                        {crit}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          )}

          {/* Diagnóstico diferencial — contraído por defecto */}
          {pathology.diagnosticoDiferencial && pathology.diagnosticoDiferencial.length > 0 && (
            <details className="group rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20">
              <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                <ClipboardList className="w-4 h-4 text-rose-500" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex-1">Diagnóstico diferencial</h3>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-3 pb-3 pt-1">
                <div className="flex flex-wrap gap-2">
                  {pathology.diagnosticoDiferencial.map((dd, i) => (
                    <Badge key={i} variant="secondary" className="text-xs bg-rose-50 dark:bg-rose-950/30">{dd}</Badge>
                  ))}
                </div>
              </div>
            </details>
          )}

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

          {/* Pronóstico — contraído por defecto */}
          {pathology.pronostico && (
            <details className="group rounded-lg border border-green-200 dark:border-green-900 bg-green-50/40 dark:bg-green-950/20">
              <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                <Activity className="w-4 h-4 text-green-500" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex-1">Pronóstico</h3>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-3 pb-3 pt-1">
                <p className="text-sm text-foreground leading-relaxed">{pathology.pronostico}</p>
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

          {/* Fuentes */}
          {pathology.fuentes.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Fuentes: </span>
                {pathology.fuentes.join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
