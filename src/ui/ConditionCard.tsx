/**
 * ConditionCard - Ficha de condición clínica compacta para el mostrador
 *
 * Resultado primario de búsqueda: reconocimiento + recomendación + alertas
 * en una sola pantalla, sin abrir modales.
 * Diseñado para consulta de farmacia de ~30 segundos.
 */

import { useMemo } from 'react';
import type { DbPathology, DbIngredient } from '@/db/schema';
import { ingredientSearchService } from '@/core/search';
import { Stethoscope, Leaf, AlertTriangle, ChevronRight, BookOpen } from 'lucide-react';

interface ConditionCardProps {
  pathology: DbPathology;
  onIngredientClick?: (id: string) => void;
  onExpand?: (pathology: DbPathology) => void;
}

const EVIDENCE_COLORS = {
  A: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30',
  B: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/30',
  C: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30',
  D: 'bg-gray-500/15 text-gray-600 dark:text-gray-300 ring-1 ring-gray-500/30',
} as const;

const ING_EVIDENCE_COLORS = {
  A: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20',
  B: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/20',
  C: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-1 ring-gray-500/20',
  D: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-1 ring-gray-500/20',
} as const;

const EVIDENCE_RANK = { A: 0, B: 1, C: 2, D: 3 } as const;

const SYSTEM_LABELS: Record<string, string> = {
  nervioso: 'Nervioso',
  digestivo: 'Digestivo',
  inmune: 'Inmune',
  cardiovascular: 'Cardiovascular',
  respiratorio: 'Respiratorio',
  musculoesqueletico: 'Musculoesq.',
  endocrino: 'Endocrino',
  dermatologico: 'Piel',
  reproductivo: 'Reproductivo',
  urinario: 'Urinario',
  ocular: 'Ocular',
  hepatico: 'Hepático',
  metabolico: 'Metabólico',
};

export function ConditionCard({ pathology, onIngredientClick, onExpand }: ConditionCardProps) {
  // Cargar ingredientes referenciados desde el índice cacheado (sin query Dexie)
  const allReferencedIds = useMemo(() => {
    const ids = new Set<string>();
    const tn = pathology.tratamientoNatural;
    for (const id of [...tn.fitoterapia, ...tn.suplementos, ...tn.homeopatia, ...tn.aceites]) {
      ids.add(id);
    }
    return Array.from(ids);
  }, [pathology]);

  const ingredients = useMemo<(DbIngredient | undefined)[]>(() => {
    return allReferencedIds
      .map(id => ingredientSearchService.getIngredient(id));
  }, [allReferencedIds]);

  // Top 5 ingredientes por evidencia (A primero)
  const topRecommendations = useMemo(() => {
    if (!ingredients) return [];
    return ingredients
      .filter((ing): ing is DbIngredient => ing !== undefined)
      .sort((a, b) => (EVIDENCE_RANK[a.evidencia] ?? 3) - (EVIDENCE_RANK[b.evidencia] ?? 3))
      .slice(0, 5);
  }, [ingredients]);

  // Primera alerta farmacéutica (la más relevante)
  const topAlert = pathology.alertasFarmaceuticas?.[0];

  const evidenceColor = EVIDENCE_COLORS[pathology.evidencia] || EVIDENCE_COLORS.C;

  return (
    <div className="rounded-xl border border-primary/20 bg-card shadow-sm overflow-hidden">
      {/* Header compacto */}
      <div className="px-4 py-3 bg-primary/5 border-b border-primary/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Stethoscope className="w-5 h-5 text-primary shrink-0" />
          <h2 className="text-lg font-bold truncate font-heading">{pathology.nombre}</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${evidenceColor}`}>
            Ev. {pathology.evidencia}
          </span>
          {onExpand && (
            <button
              onClick={() => onExpand(pathology)}
              className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-primary"
              aria-label="Ver ficha completa"
              title="Ver ficha completa"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Resumen: definición (1 línea) + síntomas chips */}
        <div className="space-y-1.5">
          <p className="text-sm text-foreground leading-snug line-clamp-2">{pathology.definicion}</p>
          {pathology.sistemas.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {pathology.sistemas.slice(0, 3).map((sys, i) => (
                <span key={sys} className="flex items-center gap-1">
                  {i > 0 && <span className="text-muted-foreground/40">·</span>}
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                    {SYSTEM_LABELS[sys] || sys}
                  </span>
                </span>
              ))}
            </div>
          )}
          {pathology.sintomas.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {pathology.sintomas.slice(0, 6).map(s => (
                <span key={s} className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/20">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Recomendar: top 5 por evidencia */}
        {topRecommendations.length > 0 && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
            <div className="flex items-center gap-1.5 mb-2">
              <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                Recomendar
              </span>
            </div>
            <div className="space-y-1">
              {topRecommendations.map(ing => (
                <button
                  key={ing.id}
                  onClick={() => onIngredientClick?.(ing.id)}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-colors text-left group ring-1 ring-emerald-200/60 dark:ring-white/10"
                >
                  <span className="text-sm font-medium text-foreground truncate">{ing.nombre}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${ING_EVIDENCE_COLORS[ing.evidencia] || ING_EVIDENCE_COLORS.C}`}>
                      {ing.evidencia}
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize hidden sm:inline">{ing.categoria.replace('_', ' ')}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Alerta clave (1 línea) */}
        {topAlert && (
          <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-foreground leading-snug">{topAlert}</p>
          </div>
        )}

        {/* Derivar: red flags (1 línea) */}
        {pathology.cuandoConsultar && (
          <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-red-500/10 ring-1 ring-red-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-foreground leading-snug">
              <span className="font-medium">Derivar: </span>
              {pathology.cuandoConsultar.length > 100
                ? pathology.cuandoConsultar.slice(0, 100) + '…'
                : pathology.cuandoConsultar}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
