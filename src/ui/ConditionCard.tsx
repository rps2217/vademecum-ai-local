/**
 * ConditionCard - Ficha de condición clínica compacta para el mostrador
 *
 * Resultado primario de búsqueda: reconocimiento + recomendación + alertas
 * en una sola pantalla, sin abrir modales.
 * Diseñado para consulta de farmacia de ~30 segundos.
 */

import { useState, useMemo } from 'react';
import type { DbPathology, DbIngredient } from '@/db/schema';
import { ingredientSearchService } from '@/core/search';
import { useClientProfile, safetyVerdictBadge, safetyVerdictStyle, CLIENT_PROFILES } from '@/contexts/ClientProfileContext';
import { getEvidenceConfig, EVIDENCE_RANK } from '@/ui/searchConfig';
import { Stethoscope, Leaf, AlertTriangle, ChevronRight, BookOpen, Sparkles, X } from 'lucide-react';
import { Button } from '@/ui/Button';
import { generateClinicalExplanation } from '@/core/analysis/clinicalExplanation';
import { cn } from '@/lib/utils';

interface ConditionCardProps {
  pathology: DbPathology;
  onIngredientClick?: (id: string) => void;
  onExpand?: (pathology: DbPathology) => void;
}

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
  const [explainingItem, setExplainingItem] = useState<{
    title: string;
    mecanismo?: string;
    descripcion?: string;
  } | null>(null);
  const [isExplainingLoading, setIsExplainingLoading] = useState(false);
  const { evaluateSafety, profile } = useClientProfile();
  const activeProfile = profile !== 'ninguno' ? CLIENT_PROFILES.find(p => p.value === profile) : null;
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

  const evidenceColor = getEvidenceConfig(pathology.evidencia).color;

  return (
    <div className="rounded-xl border border-primary/20 bg-card shadow-sm overflow-hidden">
      {/* Header compacto */}
      <div className="px-5 py-4 bg-primary/5 border-b border-primary/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Stethoscope className="w-6 h-6 text-primary shrink-0" />
          <h2 className="text-xl font-bold truncate font-heading">{pathology.nombre}</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${evidenceColor}`}>
            Ev. {pathology.evidencia}
          </span>
          {onExpand && (
            <button
              onClick={() => onExpand(pathology)}
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors text-primary"
              aria-label="Ver ficha completa"
              title="Ver ficha completa"
            >
              <BookOpen className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Resumen: definición (1 línea) + síntomas chips */}
        <div className="space-y-2">
          <p className="text-[15px] text-foreground leading-snug line-clamp-2">{pathology.definicion}</p>
          {pathology.sistemas.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {pathology.sistemas.slice(0, 3).map((sys, i) => (
                <span key={sys} className="flex items-center gap-1">
                  {i > 0 && <span className="text-muted-foreground/40">·</span>}
                  <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    {SYSTEM_LABELS[sys] || sys}
                  </span>
                </span>
              ))}
            </div>
          )}
          {pathology.sintomas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pathology.sintomas.slice(0, 6).map(s => (
                <span key={s} className="px-2 py-1 rounded-full text-sm font-medium bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/20">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Recomendar: top 5 por evidencia — con marcado de seguridad por perfil */}
        {topRecommendations.length > 0 && (
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                  Recomendar
                </span>
              </div>
              {activeProfile && (
                <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                  Filtrado: {activeProfile.label}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {topRecommendations.map(ing => {
                const verdict = evaluateSafety(ing);
                const safetyBadge = safetyVerdictBadge(verdict);
                const safetyStyle = safetyVerdictStyle(verdict);
                return (
                  <button
                    key={ing.id}
                    onClick={() => onIngredientClick?.(ing.id)}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-4 py-3.5 rounded-lg transition-colors text-left group',
                      'ring-1 ring-emerald-200/60 dark:ring-white/10',
                      'min-h-[52px] hover:ring-emerald-400/60',
                      safetyStyle,
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] font-medium text-foreground truncate">{ing.nombre}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsExplainingLoading(true);
                            setExplainingItem({
                              title: ing.nombre,
                              mecanismo: ing.mecanismoAccion,
                              descripcion: ing.descripcion,
                            });
                            setTimeout(() => setIsExplainingLoading(false), 250);
                          }}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-[10px] font-medium transition-colors"
                          title="Cómo actúa"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Cómo</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {safetyBadge && (
                        <span className={cn('px-2.5 py-1 rounded-full text-sm font-semibold', safetyBadge.className)}>
                          {safetyBadge.label}
                        </span>
                      )}
                      <span className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-md text-base font-bold',
                        getEvidenceConfig(ing.evidencia).color
                      )}>
                        {ing.evidencia}
                      </span>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Alerta clave (1 línea) */}
        {topAlert && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-foreground leading-snug">{topAlert}</p>
          </div>
        )}

        {/* Derivar: red flags (1 línea) */}
        {pathology.cuandoConsultar && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 ring-1 ring-red-500/20">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-foreground leading-snug">
              <span className="font-medium">Derivar: </span>
              {pathology.cuandoConsultar.length > 100
                ? pathology.cuandoConsultar.slice(0, 100) + '…'
                : pathology.cuandoConsultar}
            </p>
          </div>
        )}
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
                    <p className="text-xs text-muted-foreground">Contexto clínico: {pathology.nombre}</p>
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
                  <span>Asistente clínico local (LLM)</span>
                </p>
                {isExplainingLoading ? (
                  <div className="py-6 flex flex-col items-center justify-center space-y-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-muted-foreground animate-pulse">Analizando evidencia clínica...</p>
                  </div>
                ) : (
                  <p className="text-sm text-foreground leading-relaxed">
                    {generateClinicalExplanation(
                      explainingItem.title,
                      'ingredient',
                      pathology.nombre,
                      explainingItem.mecanismo,
                      explainingItem.descripcion
                    )}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = generateClinicalExplanation(
                      explainingItem.title,
                      'ingredient',
                      pathology.nombre,
                      explainingItem.mecanismo,
                      explainingItem.descripcion
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
