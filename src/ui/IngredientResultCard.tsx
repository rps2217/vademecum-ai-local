/**
 * IngredientResultCard — Card de resultado de búsqueda para el mostrador.
 *
 * Muestra icono de categoría, nombre, badge de evidencia, indicación principal,
 * badge de seguridad (según perfil del cliente) y score de relevancia.
 */

import { Star } from 'lucide-react';
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

interface Props {
  result: SearchResult;
  verdict: SafetyVerdict | null;
  onClick: (ingredient: SearchResult['ingredient']) => void;
}

export function IngredientResultCard({ result, verdict, onClick }: Props) {
  const catConfig = getCategoryConfig(result.ingredient.categoria);
  const evConfig = getEvidenceConfig(result.ingredient.evidencia);
  const CatIcon = catConfig.icon;
  const safetyStyle = safetyVerdictStyle(verdict);
  const safetyBadge = safetyVerdictBadge(verdict);
  const topIndication = result.ingredient.indicaciones?.[0];

  return (
    <button
      className={cn(
        'text-left p-5 rounded-xl bg-card border-2 border-border hover:border-primary hover:shadow-lg transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group min-h-[140px]',
        safetyStyle
      )}
      onClick={() => onClick(result.ingredient)}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn('p-2 rounded-lg shrink-0', catConfig.color)}>
            <CatIcon className="w-5 h-5" aria-hidden="true" />
          </div>
          <h4 className="font-heading font-semibold text-lg truncate group-hover:text-primary transition-colors leading-tight">
            {result.ingredient.nombre}
          </h4>
        </div>
        <span
          className={cn('flex items-center justify-center w-9 h-9 rounded-lg text-base font-bold shrink-0', evConfig.color)}
          title={evConfig.title}
        >
          {evConfig.label}
        </span>
      </div>
      {topIndication && (
        <p className="text-[15px] text-muted-foreground truncate mb-2.5">
          {humanize(topIndication)}
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground/80 capitalize">
          {result.ingredient.categoria.replace('_', ' ')}
        </span>
        <div className="flex items-center gap-2">
          {safetyBadge && (
            <span className={cn('px-2.5 py-1 rounded-full text-sm font-semibold', safetyBadge.className)}>
              {safetyBadge.label}
            </span>
          )}
          {result.score > 50 && (
            <span className="flex items-center gap-0.5 text-sm text-muted-foreground/70">
              <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              {result.score}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
