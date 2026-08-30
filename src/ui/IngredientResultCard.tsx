/**
 * IngredientResultCard — Card de resultado de búsqueda para el mostrador.
 *
 * Muestra icono de categoría, nombre, badge de evidencia, indicación principal,
 * badge de seguridad (según perfil del cliente) y score de relevancia.
 */

import { Star, Plus, Check } from 'lucide-react';
import type { SearchResult } from '@/core/search';
import { cn } from '@/lib/utils';
import { humanize } from '@/lib/text';
import {
  getCategoryConfig,
  getEvidenceConfig,
} from '@/ui/searchConfig';
import {
  safetyVerdictStyle, safetyVerdictBadge, type SafetyVerdict,
} from '@/contexts/ClientProfileContext';
import { useCounterTray } from '@/contexts/CounterTrayContext';

interface Props {
  result: SearchResult;
  verdict: SafetyVerdict | null;
  onClick: (ingredient: SearchResult['ingredient']) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (ingredientId: string) => void;
}

export function IngredientResultCard({ result, verdict, onClick, isFavorite, onToggleFavorite }: Props) {
  const catConfig = getCategoryConfig(result.ingredient.categoria);
  const evConfig = getEvidenceConfig(result.ingredient.evidencia);
  const CatIcon = catConfig.icon;
  const safetyStyle = safetyVerdictStyle(verdict);
  const safetyBadge = safetyVerdictBadge(verdict);
  const topIndication = result.ingredient.indicaciones?.[0];

  const { isInTray, toggleItem } = useCounterTray();
  const inTray = isInTray(result.ingredient.id);

  return (
    <div
      className={cn(
        'text-left p-5 rounded-xl bg-card border-2 border-border hover:border-primary hover:shadow-lg transition-all',
        'group min-h-[145px] relative flex flex-col justify-between',
        safetyStyle
      )}
    >
      <button
        className="absolute inset-0 w-full h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => onClick(result.ingredient)}
        aria-label={`Ver detalle de ${result.ingredient.nombre}`}
      />
      <div>
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleItem(result.ingredient);
            }}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-xs',
              inTray
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20'
            )}
            title={inTray ? 'Quitar de la bandeja del mostrador' : 'Añadir a la bandeja para analizar sinergias'}
            aria-label={inTray ? 'Quitar de la bandeja' : 'Añadir a la bandeja'}
          >
            {inTray ? (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Bandeja</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Bandeja</span>
              </>
            )}
          </button>
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(result.ingredient.id); }}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isFavorite
                  ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  : 'text-muted-foreground/40 hover:text-amber-500 hover:bg-muted',
              )}
              aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              <Star className={cn('w-4 h-4', isFavorite && 'fill-current')} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex items-start justify-between gap-2 mb-2 pr-28">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn('p-2 rounded-lg shrink-0', catConfig.color)}>
              <CatIcon className="w-5 h-5" aria-hidden="true" />
            </div>
            <h4 className="font-heading font-semibold text-lg truncate group-hover:text-primary transition-colors leading-tight">
              {result.ingredient.nombre}
            </h4>
          </div>
        </div>

        {topIndication && (
          <p className="text-[15px] text-muted-foreground truncate mb-2">
            {humanize(topIndication)}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
        <span className="text-xs font-medium text-muted-foreground/80 capitalize">
          {result.ingredient.categoria.replace('_', ' ')}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={cn('flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold shrink-0', evConfig.color)}
            title={evConfig.title}
          >
            Evidencia {evConfig.label}
          </span>
          {safetyBadge && (
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', safetyBadge.className)}>
              {safetyBadge.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
