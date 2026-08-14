/**
 * ProductResultCard — Card de producto comercial para el mostrador.
 *
 * Muestra el nombre comercial, principios activos, fabricante, indicaciones
 * libres y un badge de cobertura KB (nº de principios activos en la KB)
 * cuando hay datos del bridge. Visualmente distinguible de IngredientResultCard
 * con un borde/tono distinto y un icono de producto (Package).
 */

import { Package, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ProductSearchResult } from '@/core/search';
import type { DbProductIngredientAnalysis } from '@/db/schema';
import { cn } from '@/lib/utils';
import { humanize } from '@/lib/text';

interface Props {
  result: ProductSearchResult;
  analysis?: DbProductIngredientAnalysis;
  onClick: (sku: string) => void;
}

export function ProductResultCard({ result, analysis, onClick }: Props) {
  const { product } = result;
  const topIndication = product.indicaciones?.[0];
  const principiosPreview = (product.principiosActivos ?? []).slice(0, 3);
  const extraPrincipios = (product.principiosActivos?.length ?? 0) - principiosPreview.length;

  return (
    <div
      className={cn(
        'text-left p-5 rounded-xl bg-card border-2 border-sky-200 dark:border-sky-900/60',
        'hover:border-sky-400 hover:shadow-lg transition-all group min-h-[140px] relative',
      )}
    >
      <button
        className="absolute inset-0 w-full h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => onClick(product.sku)}
        aria-label={`Ver detalle de ${product.nombreComercial}`}
      />
      <div className="flex items-start gap-2.5 mb-2.5">
        <div className="p-2 rounded-lg shrink-0 bg-sky-500/10 text-sky-600 dark:text-sky-400">
          <Package className="w-5 h-5" aria-hidden="true" />
        </div>
        <h4 className="font-heading font-semibold text-lg truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors leading-tight pt-0.5">
          {product.nombreComercial}
        </h4>
      </div>

      {principiosPreview.length > 0 && (
        <p className="text-[15px] text-muted-foreground truncate mb-2.5">
          {principiosPreview.join(', ')}
          {extraPrincipios > 0 && <span className="text-muted-foreground/70"> +{extraPrincipios}</span>}
        </p>
      )}
      {!principiosPreview.length && topIndication && (
        <p className="text-[15px] text-muted-foreground truncate mb-2.5">{humanize(topIndication)}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground/80 truncate">
          {product.fabricante ? product.fabricante : 'Comercial'}
        </span>
        {analysis && (
          <CoberturaBadge cobertura={analysis.coberturaKb} matched={analysis.ingredientesCount} total={analysis.ingredientesCount + analysis.sinMatchCount} />
        )}
      </div>
    </div>
  );
}

/** Badge de cobertura KB: "3/4 en KB" verde, o "Gap: 1" ámbar. */
function CoberturaBadge({ cobertura, matched, total }: { cobertura: number; matched: number; total: number }) {
  if (total === 0) return null;
  const fullCoverage = cobertura >= 100;
  const partial = cobertura >= 50;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0',
        fullCoverage
          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
          : partial
            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
            : 'bg-red-500/15 text-red-700 dark:text-red-300',
      )}
      title={`${matched}/${total} principios activos en la base de conocimiento`}
    >
      {fullCoverage ? <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> : <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />}
      {matched}/{total} KB
    </span>
  );
}
