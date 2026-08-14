/**
 * ProductDetail - Ficha de producto comercial.
 *
 * Estructura paralela a IngredientDetail pero para productos del catálogo:
 *   1. Encabezado: nombre comercial + fabricante + SKU
 *   2. Seguridad (semáforo): embarazo / lactancia / pediatría / HTA / diabetes / celíacos
 *   3. Principios activos + link al ingrediente de la KB (bridge)
 *   4. Indicaciones (texto libre del producto)
 *   5. Posología
 *   6. Cobertura KB (gap detection)
 *
 * Usa el Modal de Radix (igual que el resto de la app).
 */

import { memo } from 'react';
import { Modal } from '@/ui/Modal';
import { Badge } from '@/ui/Badge';
import {
  Package, CheckCircle2, XCircle, AlertCircle, Pill, ExternalLink,
} from 'lucide-react';
import type { DbProduct, DbProductIngredient, DbProductIngredientAnalysis, SafetyStatus } from '@/db/schema';
import { cn } from '@/lib/utils';

interface ProductDetailProps {
  product: DbProduct;
  bridgeRows?: DbProductIngredient[];
  analysis?: DbProductIngredientAnalysis;
  onClose: () => void;
  onIngredientClick?: (ingredientId: string) => void;
}

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

export const ProductDetail = memo(function ProductDetail({
  product, bridgeRows, analysis, onClose, onIngredientClick,
}: ProductDetailProps) {
  // Bridge agrupado por principio activo: principioText → ingredientId (o null)
  const bridgeByPrincipio = new Map<string, string | null>();
  for (const row of bridgeRows ?? []) {
    if (!bridgeByPrincipio.has(row.principioText)) {
      bridgeByPrincipio.set(row.principioText, row.ingredientId);
    }
  }

  return (
    <Modal open onClose={onClose} size="full" title={product.nombreComercial} description="Producto comercial">
      <div className="space-y-5">
        {/* Encabezado */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg shrink-0 bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Package className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-heading font-semibold leading-tight">{product.nombreComercial}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {product.fabricante && (
                <span className="text-sm text-muted-foreground">{product.fabricante}</span>
              )}
              <span className="text-xs text-muted-foreground/70 font-mono">SKU {product.sku}</span>
            </div>
          </div>
        </div>

        {/* Seguridad (semáforo) */}
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Pill className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            Seguridad
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <SafetyRow label="Embarazo" status={product.embarazo} />
            <SafetyRow label="Lactancia" status={product.lactancia} />
            <SafetyRow label="Pediatría" status={product.pediatria} />
            <SafetyRow label="Hipertensión" status={product.hipertension} />
            <SafetyRow label="Diabetes" status={product.diabetes} />
            <SafetyRow label="Celíacos" status={product.celiacos} />
          </div>
        </section>

        {/* Principios activos + link a KB */}
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-2">Principios activos</h3>
          <div className="space-y-1.5">
            {(product.principiosActivos ?? []).map((pa, i) => {
              const linkedId = bridgeByPrincipio.get(pa);
              return (
                <div key={`${pa}-${i}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
                  <span className="text-sm text-foreground flex-1">{pa}</span>
                  {linkedId ? (
                    <button
                      onClick={() => onIngredientClick?.(linkedId)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      Ver en KB
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </button>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                      Sin match KB
                    </Badge>
                  )}
                </div>
              );
            })}
            {(!product.principiosActivos || product.principiosActivos.length === 0) && (
              <p className="text-sm text-muted-foreground">Sin principios activos registrados.</p>
            )}
          </div>
        </section>

        {/* Indicaciones */}
        {product.indicaciones && product.indicaciones.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">Indicaciones</h3>
            <div className="flex flex-wrap gap-2">
              {product.indicaciones.map((ind, i) => (
                <Badge key={`${ind}-${i}`} variant="secondary" className="text-sm">{ind}</Badge>
              ))}
            </div>
          </section>
        )}

        {/* Posología */}
        {product.posologia && (
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">Posología</h3>
            <p className="text-sm text-muted-foreground">{product.posologia}</p>
          </section>
        )}

        {/* Contraindicaciones */}
        {product.contraindicaciones && product.contraindicaciones.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">Contraindicaciones</h3>
            <div className="flex flex-wrap gap-2">
              {product.contraindicaciones.map((c, i) => (
                <Badge key={`${c}-${i}`} variant="danger" className="text-sm">{c}</Badge>
              ))}
            </div>
          </section>
        )}

        {/* Cobertura KB */}
        {analysis && (
          <section className="rounded-lg border border-border bg-muted/40 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-1">Cobertura en la base de conocimiento</h3>
            <p className="text-sm text-muted-foreground">{analysis.analisisExplicacion}</p>
            {analysis.categoriaPredominante && (
              <p className="text-xs text-muted-foreground mt-1">
                Categoría predominante: <span className="capitalize">{analysis.categoriaPredominante.replace('_', ' ')}</span>
              </p>
            )}
          </section>
        )}
      </div>
    </Modal>
  );
});
