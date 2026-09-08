/**
 * ClinicalExplanationModal - Explicación clínica simplificada ("El Cómo")
 *
 * Muestra el mecanismo de acción de un ingrediente frente a una patología
 * en lenguaje claro, directo y profesional para mostrador de farmacia.
 * Sin jerga excesiva ni tecnicismos confusos.
 */

import { useState, useEffect } from 'react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { Badge } from '@/ui/Badge';
import { db } from '@/db';
import type { DbIngredient, DbPathology } from '@/db/schema';
import { generateClinicalExplanation } from '@/core/analysis/clinicalExplanation';
import { useCounterTray } from '@/contexts/CounterTrayContext';
import { Sparkles, Copy, Check, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ClinicalExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: DbIngredient;
  pathology?: DbPathology | null;
}

export function ClinicalExplanationModal({
  isOpen,
  onClose,
  ingredient,
  pathology,
}: ClinicalExplanationModalProps) {
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { addItem, isInTray } = useCounterTray();

  useEffect(() => {
    if (!isOpen || !ingredient) return;

    let active = true;

    async function loadExplanation() {
      setLoading(true);
      try {
        const patId = pathology?.id || 'bienestar';
        // 1. Buscar en la base de datos de explicaciones clínicas
        const directMatch = await db.clinicalExplanations
          .where('id')
          .equals(`${ingredient.id}|${patId}`)
          .first();

        if (directMatch?.explicacion && active) {
          setExplanation(directMatch.explicacion);
          setLoading(false);
          return;
        }

        // 2. Si no hay match exacto con esta patología, buscar cualquier explicación del ingrediente
        const anyMatch = await db.clinicalExplanations
          .where('ingredienteId')
          .equals(ingredient.id)
          .first();

        if (anyMatch?.explicacion && active) {
          setExplanation(anyMatch.explicacion);
          setLoading(false);
          return;
        }

        // 3. Fallback generado
        if (active) {
          const generated = generateClinicalExplanation(
            ingredient.nombre,
            'ingredient',
            pathology?.nombre || 'su indicación terapéutica',
            ingredient.propiedades?.join(', '),
            ingredient.descripcion
          );
          setExplanation(generated);
          setLoading(false);
        }
      } catch {
        if (active) {
          setExplanation(
            `${ingredient.nombre} actúa de forma sinérgica favoreciendo el equilibrio y recuperación natural.`
          );
          setLoading(false);
        }
      }
    }

    loadExplanation();

    return () => {
      active = false;
    };
  }, [isOpen, ingredient, pathology]);

  const handleCopy = () => {
    if (!explanation) return;
    navigator.clipboard.writeText(explanation);
    setCopied(true);
    toast.success('Frase copiada al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const inTray = isInTray(ingredient.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="¿Cómo actúa en el organismo?"
      description={`Mecanismo simplificado para explicar al cliente en mostrador.`}
      size="md"
    >
      <div className="space-y-5 py-1">
        {/* Cabecera del ingrediente y patología */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/60 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <span className="font-semibold text-foreground">{ingredient.nombre}</span>
          </div>
          {pathology && (
            <>
              <span className="text-muted-foreground">para</span>
              <Badge variant="secondary" className="font-medium">
                🩺 {pathology.nombre}
              </Badge>
            </>
          )}
          <Badge variant="outline" className="ml-auto capitalize">
            {ingredient.categoria}
          </Badge>
        </div>

        {/* Caja de explicación principal */}
        <div className="relative rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>Explicación directa para el cliente</span>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-2 py-2">
              <div className="h-4 w-5/6 rounded bg-primary/20" />
              <div className="h-4 w-4/6 rounded bg-primary/20" />
            </div>
          ) : (
            <p className="text-[17px] font-medium leading-relaxed text-foreground">
              &ldquo;{explanation}&rdquo;
            </p>
          )}
        </div>

        {/* Beneficio clave y propiedades */}
        {ingredient.beneficioCliente && (
          <div className="rounded-xl border border-border bg-card p-3.5">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Argumento de recomendación
                </span>
                <p className="mt-0.5 text-sm text-foreground">{ingredient.beneficioCliente}</p>
              </div>
            </div>
          </div>
        )}

        {ingredient.propiedades && ingredient.propiedades.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs text-muted-foreground mr-1">Efectos:</span>
            {ingredient.propiedades.slice(0, 4).map((prop) => (
              <span
                key={prop}
                className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground font-medium"
              >
                {prop}
              </span>
            ))}
          </div>
        )}

        {/* Botones de acción directa */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copiar para cliente</span>
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            {!inTray && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  addItem(ingredient);
                  toast.success(`${ingredient.nombre} añadido a la bandeja`);
                }}
                className="flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Añadir a bandeja</span>
              </Button>
            )}
            <Button type="button" size="sm" onClick={onClose}>
              Entendido
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
