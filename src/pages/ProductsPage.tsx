/**
 * ProductsPage — Catálogo de productos comerciales categorizado.
 *
 * Página espejo de KnowledgePage pero para productos del catálogo de farmacia.
 * Como los productos tienen `categoria: null` en Supabase, la categoría se
 * deriva en memoria con `categorizeProduct()` (ver productCategorizer.ts).
 *
 * Funcionalidades:
 *   - Búsqueda por nombre/SKU/principio activo (fuzzy + sinónimos, mismo
 *     motor que SearchPage).
 *   - Filtro por categoría derivada (chips: Homeopatía, Fitoterapia, etc.).
 *   - Filtro por indicación (chips dinámicos de las top indicaciones).
 *   - Grid de cards reutilizando ProductResultCard + modal ProductDetail.
 *   - Paginación progresiva ("Ver más").
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { ProductResultCard } from '@/ui/ProductResultCard';
import { ProductDetail } from '@/ui/ProductDetail';
import { useSearch } from '@/contexts/SearchContext';
import { productSearchService, useProductIndex } from '@/core/search';
import type { ProductSearchResult, ProductFacet } from '@/core/search';
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS, type ProductCategory } from '@/core/catalog';
import { ingredientSearchService } from '@/core/search';
import { db } from '@/db';
import type { DbProduct, DbProductIngredientAnalysis } from '@/db/schema';
import { useLiveQuery } from 'dexie-react-hooks';
import { Filter, ChevronDown, X, PackageSearch, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 24;

const CATEGORY_STYLES: Record<ProductCategory, string> = {
  homeopatia: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800',
  fitoterapia: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  suplementos: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-800',
  aceites: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  cosmetica: 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-800',
  otros: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800',
};

export function ProductsPage() {
  const navigate = useNavigate();
  const { query, setQuery } = useSearch();
  const { ready } = useProductIndex();

  const [category, setCategory] = useState<ProductCategory | ''>('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedProduct, setSelectedProduct] = useState<DbProduct | null>(null);

  const hasQuery = query.trim().length >= 2;

  const results = useMemo<ProductSearchResult[]>(() => {
    if (!ready) return [];
    const facets: Partial<Record<ProductFacet, string>> = {};
    if (category) facets.categoria = category;
    return productSearchService.searchSync(hasQuery ? query : undefined, facets);
  }, [query, category, ready, hasQuery]);

  const visibleResults = results.slice(0, visibleCount);
  const hasMore = results.length > visibleCount;

  // Reset de paginación cuando cambian los filtros/búsqueda.
  const filterKey = `${query}|${category}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  const visibleSkus = useMemo(() => visibleResults.map((r) => r.product.sku), [visibleResults]);
  const analysisMap = useLiveQuery(async () => {
    if (visibleSkus.length === 0) return new Map<string, DbProductIngredientAnalysis>();
    const rows = await db.productIngredientAnalysis.bulkGet(visibleSkus);
    const m = new Map<string, DbProductIngredientAnalysis>();
    for (const row of rows) if (row) m.set(row.productoSku, row);
    return m;
  }, [visibleSkus.join(',')]);

  const selectedBridge = useLiveQuery(async () => {
    if (!selectedProduct) return [];
    return db.productIngredients.where('productoSku').equals(selectedProduct.sku).toArray();
  }, [selectedProduct?.sku]);
  const selectedAnalysis = useLiveQuery(async () => {
    if (!selectedProduct) return undefined;
    return db.productIngredientAnalysis.get(selectedProduct.sku);
  }, [selectedProduct?.sku]);

  const categoryCounts = useMemo(() => ready ? productSearchService.categoriaCounts() : new Map<ProductCategory, number>(), [ready]);

  const activeFiltersCount = [category].filter(Boolean).length;

  const clearAll = () => {
    setCategory('');
    setQuery('');
  };

  const totalProducts = ready ? productSearchService.size : 0;

  return (
    <div className="space-y-6 max-w-[110rem] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Productos Comerciales</h1>
          <p className="text-muted-foreground mt-1">
            {ready
              ? `${results.length} de ${totalProducts} productos`
              : 'Cargando catálogo...'}
          </p>
        </div>
      </div>

      {/* Filtros por categoría */}
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Filter className="w-4 h-4" />
          Categoría
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium border transition-colors min-h-[40px]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              !category
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-foreground border-border hover:bg-muted',
            )}
          >
            Todas
            {ready && (
              <span className="ml-1.5 text-xs opacity-70">{totalProducts}</span>
            )}
          </button>
          {PRODUCT_CATEGORIES.map(({ value, label }) => {
            const count = categoryCounts.get(value) ?? 0;
            if (count === 0) return null;
            const isActive = category === value;
            return (
              <button
                key={value}
                onClick={() => setCategory(isActive ? '' : value)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium border transition-colors min-h-[40px]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive ? 'bg-primary text-primary-foreground border-primary' : CATEGORY_STYLES[value],
                )}
              >
                {label}
                <span className="ml-1.5 text-xs opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Acciones de filtro */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X className="w-4 h-4 mr-1" />
            Limpiar filtros
          </Button>
          {category && (
            <Badge variant="secondary">
              {PRODUCT_CATEGORY_LABELS[category]}
            </Badge>
          )}
        </div>
      )}

      {/* Resultados */}
      {!ready ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground">Indexando catálogo de productos…</p>
        </div>
      ) : results.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleResults.map((result) => (
              <ProductResultCard
                key={result.product.sku}
                result={result}
                analysis={analysisMap?.get(result.product.sku)}
                onClick={() => setSelectedProduct(result.product)}
              />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="px-8 py-4 rounded-xl border-2 border-border text-base font-semibold text-foreground bg-card hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[52px] shadow-sm"
              >
                Ver más ({results.length - visibleCount} restantes)
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted mb-4">
            <PackageSearch className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-base font-medium text-foreground">
            {hasQuery || category
              ? 'No se encontraron productos con esos criterios'
              : 'Escribe para buscar productos'}
          </p>
          {(hasQuery || category) && (
            <Button variant="ghost" className="mt-3" onClick={clearAll}>
              Limpiar filtros
            </Button>
          )}
        </div>
      )}

      {/* Modal de detalle */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          bridgeRows={selectedBridge ?? []}
          analysis={selectedAnalysis}
          onClose={() => setSelectedProduct(null)}
          onIngredientClick={(id) => {
            const ing = ingredientSearchService.getIngredient(id);
            if (ing) {
              setSelectedProduct(null);
              navigate('/knowledge');
            }
          }}
        />
      )}
    </div>
  );
}
