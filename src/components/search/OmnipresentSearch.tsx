/**
 * OmnipresentSearch - Componente de búsqueda omnipresente y unificada
 *
 * Diseño minimalista y de alto rendimiento inspirado en interfaces de búsqueda local
 * (Spotlight / Raycast / Linear). Indexa en tiempo real tanto productos comerciales
 * como la base de conocimiento de "¿Cómo funciona?" (explicaciones clínicas de mostrador),
 * ingredientes botánicos/ortomoleculares y patologías.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Package,
  Lightbulb,
  Leaf,
  Stethoscope,
  Command,
  X,
  Sparkles,
  Copy,
  Check,
  Plus,
  ArrowRight,
  SlidersHorizontal,
  CheckCircle2,
  Star,
  CornerDownLeft,
} from 'lucide-react';
import {
  omniSearchService,
  useOmniSearchIndex,
  type OmniSearchResult,
  type OmniCategory,
  type OmniProductResult,
  type OmniExplanationResult,
  type OmniIngredientResult,
  type OmniPathologyResult,
} from '@/core/search';
import { useCounterTray } from '@/contexts/CounterTrayContext';
import { ProductDetail } from '@/ui/ProductDetail';
import { IngredientDetail } from '@/ui/IngredientDetail';
import { PathologyDetail } from '@/ui/PathologyDetail';
import { ClinicalExplanationModal } from '@/ui/ClinicalExplanationModal';
import { Badge } from '@/ui/Badge';
import { cn } from '@/lib/utils';
import { humanize } from '@/lib/text';
import { toast } from 'sonner';
import type { DbProduct, DbIngredient, DbPathology } from '@/db/schema';

interface OmnipresentSearchProps {
  className?: string;
  initialQuery?: string;
  onQueryChange?: (q: string) => void;
  autoFocus?: boolean;
}

const CATEGORIES: { id: OmniCategory; label: string; icon: typeof Search }[] = [
  { id: 'all', label: 'Todos', icon: SlidersHorizontal },
  { id: 'products', label: 'Productos', icon: Package },
  { id: 'explanations', label: '¿Cómo funciona?', icon: Lightbulb },
  { id: 'ingredients', label: 'Ingredientes', icon: Leaf },
  { id: 'pathologies', label: 'Patologías', icon: Stethoscope },
];

const SUGGESTIONS = [
  { label: 'Insomnio y despertares', query: 'insomnio', category: 'explanations' as OmniCategory },
  { label: 'Ansiedad y estrés', query: 'ansiedad', category: 'explanations' as OmniCategory },
  { label: 'Dolor articular / Artrosis', query: 'artrosis', category: 'all' as OmniCategory },
  { label: 'Digestión y reflujo', query: 'digestivo', category: 'all' as OmniCategory },
  { label: 'Colágeno y cartílago', query: 'colageno', category: 'products' as OmniCategory },
  { label: 'Magnesio y relajación muscular', query: 'magnesio', category: 'all' as OmniCategory },
];

export function OmnipresentSearch({
  className,
  initialQuery = '',
  onQueryChange,
  autoFocus = false,
}: OmnipresentSearchProps) {
  const { ready } = useOmniSearchIndex();
  const { addItem: addToTray, isInTray } = useCounterTray();

  const [query, setQuery] = useState(initialQuery);
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const [category, setCategory] = useState<OmniCategory>('all');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sincronizar query cuando cambia desde props durante el renderizado (patrón oficial de React)
  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    setQuery(initialQuery);
    if (initialQuery.trim()) {
      setIsOpen(true);
    }
  }

  // Modales de detalle
  const [selectedProduct, setSelectedProduct] = useState<DbProduct | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<DbIngredient | null>(null);
  const [selectedPathology, setSelectedPathology] = useState<DbPathology | null>(null);
  const [explanationModal, setExplanationModal] = useState<{
    isOpen: boolean;
    ingredient: DbIngredient | null;
    pathology: DbPathology | null;
  }>({ isOpen: false, ingredient: null, pathology: null });

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Escuchar atajo global ⌘K o Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Manejar clics fuera del componente
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setIsOpen(true);
    setSelectedIndex(0);
    onQueryChange?.(val);
  };

  // Búsqueda en tiempo real
  const results = useMemo(() => {
    if (!ready || !query.trim()) return [];
    return omniSearchService.searchSync(query, { category, limit: 20 });
  }, [ready, query, category]);

  // Manejo de teclado en la lista
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectResult(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Scroll automático del item seleccionado
  useEffect(() => {
    if (listRef.current && results.length > 0) {
      const activeElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, results.length]);

  const handleSelectResult = useCallback((item: OmniSearchResult) => {
    if (item.type === 'product') {
      setSelectedProduct(item.product);
    } else if (item.type === 'explanation') {
      if (item.ingredient) {
        setExplanationModal({
          isOpen: true,
          ingredient: item.ingredient,
          pathology: item.pathology || null,
        });
      }
    } else if (item.type === 'ingredient') {
      setSelectedIngredient(item.ingredient);
    } else if (item.type === 'pathology') {
      setSelectedPathology(item.pathology);
    }
  }, []);

  const handleCopyExplanation = (exp: OmniExplanationResult, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(exp.explanation.explicacion);
    setCopiedId(exp.id);
    toast.success('Explicación copiada al portapapeles para mostrador');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddToCounter = (
    name: string,
    type: 'ingredient' | 'product',
    id: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    addToTray({
      id: `${type}-${id}`,
      type,
      name,
      notes: type === 'product' ? 'Producto recomendado' : 'Ingrediente activo',
    });
    toast.success(`Añadido a la bandeja del mostrador: ${name}`);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full text-left', className)} id="omnipresent-search-container">
      {/* Search Input Bar */}
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
          <Search className="h-5 w-5" aria-hidden="true" />
        </div>

        <input
          ref={inputRef}
          id="omnipresent-search-input"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder="Busca productos, cómo funciona, ingredientes, patologías o síntomas..."
          aria-label="Búsqueda omnipresente local"
          aria-expanded={isOpen}
          aria-controls="omnipresent-search-results"
          className="h-14 w-full rounded-2xl border-2 border-border/80 bg-background/95 pl-12 pr-32 text-base text-foreground placeholder:text-muted-foreground shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
        />

        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {query ? (
            <button
              type="button"
              onClick={() => handleQueryChange('')}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 rounded-lg border border-border/80 bg-muted/60 px-2 py-1 font-mono text-xs text-muted-foreground">
              <Command className="h-3 w-3" aria-hidden="true" />
              <span>K</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 px-1 scrollbar-none" role="tablist">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setCategory(cat.id);
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer whitespace-nowrap',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'bg-card border border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-accent/40'
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Floating Results Surface */}
      {isOpen && (
        <div
          id="omnipresent-search-results"
          className="absolute left-0 right-0 top-[108px] z-50 rounded-2xl border border-border/80 bg-card/98 backdrop-blur-md shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {/* Active Query Status */}
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-2 bg-muted/30 text-[11px] text-muted-foreground">
            <span className="font-medium">
              {query.trim()
                ? `${results.length} resultado${results.length === 1 ? '' : 's'} para "${query}"`
                : 'Consultas sugeridas en mostrador'}
            </span>
            <span className="hidden sm:inline-flex items-center gap-2">
              <span>Usa <kbd className="font-mono bg-muted px-1 rounded">↑</kbd> <kbd className="font-mono bg-muted px-1 rounded">↓</kbd> para navegar</span>
              <span><kbd className="font-mono bg-muted px-1 rounded">↵</kbd> abrir</span>
              <span><kbd className="font-mono bg-muted px-1 rounded">Esc</kbd> cerrar</span>
            </span>
          </div>

          {/* Results List */}
          <div ref={listRef} className="max-h-[440px] overflow-y-auto p-2 space-y-1.5 divide-y divide-border/20">
            {query.trim() === '' ? (
              /* Estado Inicial / Sugerencias rápidas */
              <div className="p-3 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                  Atajos de mostrador frecuentes
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTIONS.map((sug) => (
                    <button
                      key={sug.label}
                      type="button"
                      onClick={() => {
                        handleQueryChange(sug.query);
                        setCategory(sug.category);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-background hover:bg-accent/50 hover:border-primary/40 transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                          {sug.label}
                        </span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            ) : results.length === 0 ? (
              /* Sin resultados */
              <div className="py-12 px-4 text-center space-y-2">
                <div className="mx-auto w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                  <Search className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">No se encontraron coincidencias directas</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Prueba buscando por síntoma (ej. "insomnio", "digestión"), principio activo ("valeriana", "cúrcuma") o marca comercial.
                </p>
              </div>
            ) : (
              /* Lista de resultados coincidentes */
              results.map((item, idx) => {
                const isSelected = idx === selectedIndex;

                if (item.type === 'product') {
                  return (
                    <ProductResultItem
                      key={item.id}
                      item={item}
                      isSelected={isSelected}
                      onSelect={() => handleSelectResult(item)}
                      onAddToCounter={(e) =>
                        handleAddToCounter(item.product.nombreComercial, 'product', item.product.sku, e)
                      }
                      isInTray={isInTray(`product-${item.product.sku}`)}
                    />
                  );
                }

                if (item.type === 'explanation') {
                  return (
                    <ExplanationResultItem
                      key={item.id}
                      item={item}
                      isSelected={isSelected}
                      isCopied={copiedId === item.id}
                      onSelect={() => handleSelectResult(item)}
                      onCopy={(e) => handleCopyExplanation(item, e)}
                      onAddToCounter={(e) =>
                        item.ingredient &&
                        handleAddToCounter(item.ingredient.nombre, 'ingredient', item.ingredient.id, e)
                      }
                      isInTray={item.ingredient ? isInTray(`ingredient-${item.ingredient.id}`) : false}
                    />
                  );
                }

                if (item.type === 'ingredient') {
                  return (
                    <IngredientResultItem
                      key={item.id}
                      item={item}
                      isSelected={isSelected}
                      onSelect={() => handleSelectResult(item)}
                      onAddToCounter={(e) =>
                        handleAddToCounter(item.ingredient.nombre, 'ingredient', item.ingredient.id, e)
                      }
                      isInTray={isInTray(`ingredient-${item.ingredient.id}`)}
                    />
                  );
                }

                if (item.type === 'pathology') {
                  return (
                    <PathologyResultItem
                      key={item.id}
                      item={item}
                      isSelected={isSelected}
                      onSelect={() => handleSelectResult(item)}
                    />
                  );
                }

                return null;
              })
            )}
          </div>
        </div>
      )}

      {/* Modales de detalle integrados */}
      {selectedProduct && (
        <ProductDetail product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
      {selectedIngredient && (
        <IngredientDetail ingredient={selectedIngredient} onClose={() => setSelectedIngredient(null)} />
      )}
      {selectedPathology && (
        <PathologyDetail pathology={selectedPathology} onClose={() => setSelectedPathology(null)} />
      )}
      {explanationModal.isOpen && explanationModal.ingredient && (
        <ClinicalExplanationModal
          isOpen={explanationModal.isOpen}
          ingredient={explanationModal.ingredient}
          pathology={explanationModal.pathology}
          onClose={() => setExplanationModal({ isOpen: false, ingredient: null, pathology: null })}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Componentes de Renderizado de Cada Tipo de Resultado
// -------------------------------------------------------------

function ProductResultItem({
  item,
  isSelected,
  onSelect,
  onAddToCounter,
  isInTray,
}: {
  item: OmniProductResult;
  isSelected: boolean;
  onSelect: () => void;
  onAddToCounter: (e: React.MouseEvent) => void;
  isInTray: boolean;
}) {
  const { product } = item;
  const comoFunciona = product.comoFunciona || product.como_funciona;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer',
        isSelected
          ? 'bg-sky-500/10 border-sky-500/40 shadow-xs'
          : 'bg-card/80 border-border/40 hover:bg-muted/40 hover:border-border'
      )}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
          <Package className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {product.nombreComercial}
            </span>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-sky-700 dark:text-sky-300 border-sky-200">
              Producto comercial
            </Badge>
            {product.fabricante && (
              <span className="text-[11px] text-muted-foreground">{product.fabricante}</span>
            )}
          </div>

          {comoFunciona ? (
            <p className="text-xs text-foreground/80 line-clamp-1 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
              <span className="truncate">{comoFunciona}</span>
            </p>
          ) : product.principiosActivos?.length ? (
            <p className="text-xs text-muted-foreground truncate">
              Activos: {product.principiosActivos.slice(0, 4).join(', ')}
              {product.principiosActivos.length > 4 && ` (+${product.principiosActivos.length - 4})`}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
        <button
          type="button"
          onClick={onAddToCounter}
          title={isInTray ? 'Ya en bandeja' : 'Añadir a bandeja de mostrador'}
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer',
            isInTray
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60'
              : 'bg-muted/80 hover:bg-primary/10 text-muted-foreground hover:text-primary'
          )}
        >
          {isInTray ? <CheckCircle2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          <span>{isInTray ? 'En bandeja' : 'Bandeja'}</span>
        </button>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          <CornerDownLeft className="h-3 w-3 inline" />
        </span>
      </div>
    </div>
  );
}

function ExplanationResultItem({
  item,
  isSelected,
  isCopied,
  onSelect,
  onCopy,
  onAddToCounter,
  isInTray,
}: {
  item: OmniExplanationResult;
  isSelected: boolean;
  isCopied: boolean;
  onSelect: () => void;
  onCopy: (e: React.MouseEvent) => void;
  onAddToCounter: (e: React.MouseEvent) => void;
  isInTray: boolean;
}) {
  const { explanation, ingredient, pathology } = item;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'group flex flex-col gap-2 p-3.5 rounded-xl border transition-all cursor-pointer',
        isSelected
          ? 'bg-amber-500/10 border-amber-500/40 shadow-xs'
          : 'bg-card/80 border-border/40 hover:bg-muted/40 hover:border-border'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 shrink-0">
            <Lightbulb className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-foreground">
            {ingredient?.nombre || 'Ingrediente'}
          </span>
          <span className="text-xs text-muted-foreground">en</span>
          <Badge variant="secondary" className="text-[11px] py-0 px-1.5 font-medium">
            {pathology?.nombre || humanize(explanation.patologiaId)}
          </Badge>
          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
            ¿Cómo funciona?
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCopy}
            title="Copiar explicación para el cliente"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-muted/80 hover:bg-amber-500/20 text-muted-foreground hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
          >
            {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            <span className="hidden sm:inline">{isCopied ? 'Copiado' : 'Copiar'}</span>
          </button>
          {ingredient && (
            <button
              type="button"
              onClick={onAddToCounter}
              title="Añadir a bandeja"
              className={cn(
                'p-1 rounded-lg text-xs transition-colors',
                isInTray
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-muted/80 hover:bg-primary/10 text-muted-foreground hover:text-primary'
              )}
            >
              {isInTray ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/20 p-2.5 border border-amber-200/40 dark:border-amber-900/30 text-xs text-foreground/90 leading-relaxed">
        <span className="font-semibold text-amber-800 dark:text-amber-300 mr-1.5">Para el cliente:</span>
        {explanation.explicacion}
      </div>
    </div>
  );
}

function IngredientResultItem({
  item,
  isSelected,
  onSelect,
  onAddToCounter,
  isInTray,
}: {
  item: OmniIngredientResult;
  isSelected: boolean;
  onSelect: () => void;
  onAddToCounter: (e: React.MouseEvent) => void;
  isInTray: boolean;
}) {
  const { ingredient } = item;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'group flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer',
        isSelected
          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-xs'
          : 'bg-card/80 border-border/40 hover:bg-muted/40 hover:border-border'
      )}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
          <Leaf className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {ingredient.nombre}
            </span>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-emerald-700 dark:text-emerald-300 border-emerald-200">
              {humanize(ingredient.categoria)}
            </Badge>
            {ingredient.evidencia && (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-600">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                {ingredient.evidencia}
              </span>
            )}
          </div>
          {ingredient.beneficioCliente ? (
            <p className="text-xs text-muted-foreground truncate">{ingredient.beneficioCliente}</p>
          ) : ingredient.indicaciones?.length ? (
            <p className="text-xs text-muted-foreground truncate">
              {ingredient.indicaciones.slice(0, 3).map((i) => humanize(i)).join(' · ')}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onAddToCounter}
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
            isInTray
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60'
              : 'bg-muted/80 hover:bg-primary/10 text-muted-foreground hover:text-primary'
          )}
        >
          {isInTray ? <CheckCircle2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          <span className="hidden sm:inline">{isInTray ? 'En bandeja' : 'Bandeja'}</span>
        </button>
      </div>
    </div>
  );
}

function PathologyResultItem({
  item,
  isSelected,
  onSelect,
}: {
  item: OmniPathologyResult;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { pathology } = item;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'group flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer',
        isSelected
          ? 'bg-purple-500/10 border-purple-500/40 shadow-xs'
          : 'bg-card/80 border-border/40 hover:bg-muted/40 hover:border-border'
      )}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
          <Stethoscope className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {pathology.nombre}
            </span>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-purple-700 dark:text-purple-300 border-purple-200">
              Patología
            </Badge>
          </div>
          {pathology.definicion && (
            <p className="text-xs text-muted-foreground line-clamp-1">{pathology.definicion}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium shrink-0">
        <span>Ver protocolo</span>
        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
}
