/**
 * IngredientDetail - Ficha de ingrediente con jerarquía clínica.
 *
 * Estructura optimizada para decisión en mostrador:
 *   1. Encabezado: nombre + sinónimos + badges (evidencia/categoría/familia)
 *   2. Seguridad (semáforo): embarazo / lactancia / pediatría — lo primero que
 *      un farmacéutico comprueba antes de recomendar.
 *   3. Indicaciones + propiedades (qué trata y cómo)
 *   4. Sistemas corporales
 *   5. Interacciones medicamentosas (alertas)
 *   6. Fuentes
 *
 * Memoizado para evitar re-renders innecesarios.
 */

import { memo, useMemo, useRef, useEffect } from 'react';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { HighlightText } from '@/ui/HighlightText';
import {
  X, AlertTriangle, Info, Link as LinkIcon, Leaf, Shield,
  CheckCircle2, XCircle, AlertCircle, BookOpen, FlaskConical,
} from 'lucide-react';
import type { DbIngredient, IngredientSafety, SafetyStatus } from '@/db/schema';
import { humanize } from '@/lib/text';
import { buildHighlightTerms } from '@/lib/highlightTerms';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface IngredientDetailProps {
  ingredient: DbIngredient;
  onClose: () => void;
  onViewSynergies?: (id: string) => void;
  /** Indicación o query activa al abrir la ficha — resalta términos relacionados. */
  activeIndication?: string;
}

const EVIDENCE_CONFIG: Record<string, { label: string; color: string; title: string }> = {
  A: { label: 'Evidencia A', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30', title: 'Alta: meta-análisis / ECA' },
  B: { label: 'Evidencia B', color: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/30', title: 'Media: estudios controlados' },
  C: { label: 'Evidencia C', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30', title: 'Baja: observacional / tradicional' },
  D: { label: 'Evidencia D', color: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 ring-1 ring-gray-500/20', title: 'Muy baja: uso tradicional' },
};

const SAFETY_CONFIG: Record<SafetyStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  apto: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', label: 'Apto' },
  evitar: { icon: AlertCircle, color: 'text-amber-600 dark:text-amber-400', label: 'Evitar / precaución' },
  contraindicado: { icon: XCircle, color: 'text-red-600 dark:text-red-400', label: 'Contraindicado' },
  desconocido: { icon: AlertCircle, color: 'text-gray-400 dark:text-gray-500', label: 'Datos limitados' },
};

function SafetyRow({ label, status }: { label: string; status: SafetyStatus | undefined }) {
  const config = SAFETY_CONFIG[status ?? 'desconocido'];
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
      <Icon className={cn('w-4 h-4 shrink-0', config.color)} aria-hidden="true" />
      <span className="text-sm font-medium text-foreground flex-1">{label}</span>
      <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
    </div>
  );
}

const IngredientDetailComponent = ({ ingredient, onClose, onViewSynergies, activeIndication }: IngredientDetailProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
  const evidenceConfig = useMemo(
    () => EVIDENCE_CONFIG[ingredient.evidencia] || EVIDENCE_CONFIG.D,
    [ingredient.evidencia]
  );
  const sinonimosDisplay = useMemo(
    () => ingredient.sinonimos?.slice(0, 4).join(', '),
    [ingredient.sinonimos]
  );
  const seguridad = ingredient.seguridad as IngredientSafety | undefined;
  const highlightTerms = useMemo(
    () => buildHighlightTerms(activeIndication),
    [activeIndication]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha de ${ingredient.nombre}`}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card shadow-2xl animate-scale-in"
      >
        {/* Encabezado pegajoso */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn('px-2 py-0.5 rounded-full text-xs font-semibold cursor-help', evidenceConfig.color)}
                title={evidenceConfig.title}
              >
                {evidenceConfig.label}
              </span>
              <Badge variant="outline" className="text-xs capitalize">
                {humanize(ingredient.categoria)}
              </Badge>
            </div>
            <h2 className="text-2xl font-bold font-heading truncate">{ingredient.nombre}</h2>
            {sinonimosDisplay && (
              <p className="text-sm text-muted-foreground truncate">{sinonimosDisplay}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* SEGURIDAD — semáforo (lo primero que revisa el farmacéutico) */}
          {seguridad && (
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground">
                <Shield className="w-4 h-4 text-primary" aria-hidden="true" />
                Seguridad
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <SafetyRow label="Embarazo" status={seguridad.embarazo} />
                <SafetyRow label="Lactancia" status={seguridad.lactancia} />
                <SafetyRow label="Pediatría" status={seguridad.pediatria} />
              </div>
            </section>
          )}

          {/* Indicaciones */}
          {ingredient.indicaciones && ingredient.indicaciones.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                Indicaciones
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {ingredient.indicaciones.map((ind) => (
                  <span
                    key={ind}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium ring-1',
                      highlightTerms.length > 0 && ind.toLowerCase() === (activeIndication ?? '').toLowerCase()
                        ? 'bg-yellow-200/80 dark:bg-yellow-500/30 text-foreground ring-yellow-500/40'
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20'
                    )}
                  >
                    {humanize(ind)}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Posología — dosis práctica para el mostrador */}
          {ingredient.posologia && (
            <section className="rounded-lg bg-primary/5 border border-primary/20 p-4">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-primary">
                <FlaskConical className="w-4 h-4" aria-hidden="true" />
                Posología
              </h3>
              <p className="text-sm text-foreground leading-relaxed">
                {ingredient.posologia}
              </p>
            </section>
          )}

          {/* Propiedades / mecanismo */}
          {ingredient.propiedades && ingredient.propiedades.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                Propiedades y mecanismo
                {highlightTerms.length > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">
                    (resaltado según indicación seleccionada)
                  </span>
                )}
              </h3>
              <div className="space-y-2">
                {ingredient.propiedades.map((prop, idx) => (
                  <p key={idx} className="text-sm text-muted-foreground leading-relaxed">
                    <HighlightText text={prop} terms={highlightTerms} />
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Sistemas corporales */}
          {ingredient.sistemas && ingredient.sistemas.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                Sistemas corporales
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {ingredient.sistemas.map((sys) => (
                  <Badge key={sys} variant="secondary" className="capitalize">{humanize(sys)}</Badge>
                ))}
              </div>
            </section>
          )}

          {/* Interacciones medicamentosas */}
          {ingredient.interacciones && ingredient.interacciones.length > 0 && (
            <section className="rounded-lg bg-red-500/5 border border-red-500/20 p-4">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                Interacciones medicamentosas
              </h3>
              <div className="flex flex-wrap gap-2">
                {ingredient.interacciones.map((int, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-700 dark:text-red-300 ring-1 ring-red-500/20">
                    {int}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Fuentes */}
          {ingredient.fuentes && ingredient.fuentes.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground">
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                Fuentes
              </h3>
              <ul className="space-y-1">
                {ingredient.fuentes.map((fuente, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <Leaf className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
                    {fuente}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-2 border-t border-border">
            <Button variant="outline" className="flex-1" onClick={() => onViewSynergies?.(ingredient.id)}>
              <LinkIcon className="w-4 h-4 mr-2" aria-hidden="true" />
              Ver sinergias
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const IngredientDetail = memo(IngredientDetailComponent, (prevProps, nextProps) => {
  return prevProps.ingredient.id === nextProps.ingredient.id &&
         prevProps.ingredient.updatedAt === nextProps.ingredient.updatedAt &&
         prevProps.activeIndication === nextProps.activeIndication;
});
