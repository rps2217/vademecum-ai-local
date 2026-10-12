/**
 * KnowledgePage - Base de conocimiento rediseñada con experiencia de mostrador
 * 
 * Lista de ingredientes con filtros de categoría, sistema corporal, evidencia,
 * búsqueda rápida, chips de acceso instantáneo y bandeja de mostrador integrada.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Select } from '@/ui/Select';
import { IngredientDetail } from '@/ui/IngredientDetail';
import { useSearch } from '@/contexts/SearchContext';
import { useIngredients } from '@/hooks/useIngredients';
import { useCounterTray } from '@/contexts/CounterTrayContext';
import {
  Database, Filter, Plus, BookOpen, Leaf, FlaskConical,
  Search, X, ShoppingBag
} from 'lucide-react';
import type { DbIngredient, IngredientCategory, BodySystem } from '@/db/schema';
import { cn } from '@/lib/utils';
import { getEvidenceConfig } from '@/ui/searchConfig';
import { BODY_SYSTEMS } from '@/types/shared-enums';

const CATEGORIES = [
  { value: '', label: 'Todas las categorías' },
  { value: 'fitoterapia', label: 'Fitoterapia' },
  { value: 'homeopatia', label: 'Homeopatía' },
  { value: 'aceite_esencial', label: 'Aceites esenciales' },
  { value: 'vitamina', label: 'Vitaminas' },
  { value: 'mineral', label: 'Minerales' },
  { value: 'probiotico', label: 'Probióticos' },
];

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Leaf; color: string; ringColor: string }> = {
  fitoterapia: { label: 'Fitoterapia', icon: Leaf, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', ringColor: 'ring-emerald-500/20' },
  homeopatia: { label: 'Homeopatía', icon: FlaskConical, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', ringColor: 'ring-blue-500/20' },
  aceite_esencial: { label: 'Aceite esencial', icon: FlaskConical, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', ringColor: 'ring-amber-500/20' },
  vitamina: { label: 'Vitamina', icon: BookOpen, color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', ringColor: 'ring-violet-500/20' },
  mineral: { label: 'Mineral', icon: BookOpen, color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400', ringColor: 'ring-slate-500/20' },
  probiotico: { label: 'Probiótico', icon: Leaf, color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400', ringColor: 'ring-pink-500/20' },
};

const SYSTEM_OPTIONS = [
  { value: '', label: 'Todos los sistemas' },
  ...BODY_SYSTEMS.map((sys) => ({
    value: sys,
    label: sys.charAt(0).toUpperCase() + sys.slice(1),
  })),
];

export function KnowledgePage() {
  const navigate = useNavigate();
  const { query, setQuery } = useSearch();
  const [localQuery, setLocalQuery] = useState(query);
  const [category, setCategory] = useState<string>('');
  const [system, setSystem] = useState<string>('');
  const [selectedIngredient, setSelectedIngredient] = useState<DbIngredient | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { isInTray, toggleItem, items: trayItems } = useCounterTray();

  // Usar el hook de ingredientes (soporta indexación rápida)
  const { ingredients, isLoading, total } = useIngredients({
    query: query || localQuery,
    category: category ? (category as IngredientCategory) : undefined,
    system: system ? (system as BodySystem) : undefined,
    limit: 120,
  });

  const getCategoryConfig = (cat: string) => {
    return CATEGORY_CONFIG[cat] || {
      label: cat,
      icon: Leaf,
      color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
      ringColor: 'ring-gray-500/20',
    };
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(localQuery);
  };

  const clearFilters = () => {
    setCategory('');
    setSystem('');
    setLocalQuery('');
    setQuery('');
  };

  const activeFiltersCount = (category ? 1 : 0) + (system ? 1 : 0) + ((localQuery || query) ? 1 : 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Database className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground">Base de Conocimiento</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {isLoading 
                  ? 'Cargando activos...' 
                  : `${ingredients.length} de ${total} principios activos catalogados`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {trayItems.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{trayItems.length} en bandeja</span>
            </div>
          )}
          <Button onClick={() => navigate('/admin')}>
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            Añadir activo
          </Button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar por activo, sinónimo, indicación o mecanismo..."
              value={localQuery}
              onChange={(e) => {
                setLocalQuery(e.target.value);
                setQuery(e.target.value);
              }}
              className="w-full h-11 pl-10 pr-9 bg-card border border-border/80 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
            {localQuery && (
              <button
                type="button"
                onClick={() => {
                  setLocalQuery('');
                  setQuery('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center justify-center gap-2 px-4 h-11 border rounded-xl text-sm font-medium transition-colors shrink-0",
              showFilters || activeFiltersCount > 0
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border/80 bg-card hover:bg-muted text-foreground"
            )}
            aria-expanded={showFilters}
          >
            <Filter className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-0.5 text-xs px-1.5 py-0.5">
                {activeFiltersCount}
              </Badge>
            )}
          </button>
        </form>

        {/* Quick Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setCategory('')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
              category === ''
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60"
            )}
          >
            Todos ({total})
          </button>

          {CATEGORIES.filter(c => c.value).map((cat) => {
            const isSelected = category === cat.value;
            const cfg = getCategoryConfig(cat.value);
            const Icon = cfg.icon;
            return (
              <button
                key={cat.value}
                onClick={() => setCategory(isSelected ? '' : cat.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border",
                  isSelected
                    ? "bg-foreground text-background border-foreground shadow-xs"
                    : "bg-card border-border/70 text-foreground hover:bg-muted/80"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", !isSelected && cfg.color.split(' ')[1])} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Panel Desplegable de Filtros Adicionales */}
        {showFilters && (
          <Card className="p-4 border-border/80 bg-card/70 backdrop-blur-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Categoría terapéutica"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={CATEGORIES}
                placeholder="Todas las categorías"
              />

              <Select
                label="Sistema corporal o eje clínico"
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                options={SYSTEM_OPTIONS}
                placeholder="Todos los sistemas corporales"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
              <span>{ingredients.length} resultados encontrados</span>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-primary hover:underline font-semibold"
                >
                  Restablecer filtros
                </button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Resultados */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Cargando base de conocimiento...</p>
        </div>
      ) : ingredients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ingredients.map((ingredient) => {
            const catConfig = getCategoryConfig(ingredient.categoria);
            const CatIcon = catConfig.icon;
            const evidenceConfig = getEvidenceConfig(ingredient.evidencia);
            const inTray = isInTray(ingredient.id);
            
            return (
              <Card
                key={ingredient.id}
                className={cn(
                  "p-5 hover:border-primary/80 transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex flex-col justify-between relative",
                  inTray && "ring-2 ring-primary/40 border-primary/60 bg-primary/2"
                )}
                onClick={() => setSelectedIngredient(ingredient)}
              >
                <div>
                  {/* Category Icon, Badges and Tray Toggle */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn('p-2.5 rounded-xl border border-border/40', catConfig.color)}>
                      <CatIcon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-md border', evidenceConfig.color)}>
                        {evidenceConfig.label}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItem(ingredient);
                        }}
                        title={inTray ? "Quitar de bandeja" : "Añadir a bandeja de mostrador"}
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                          inTray
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        )}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Name and Category subtitle */}
                  <div className="mb-2">
                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-snug">
                      {ingredient.nombre}
                    </h3>
                    <span className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">
                      {catConfig.label}
                    </span>
                  </div>

                  {/* Synonyms */}
                  {ingredient.sinonimos && ingredient.sinonimos.length > 0 && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-1 italic">
                      {ingredient.sinonimos.slice(0, 3).join(', ')}
                    </p>
                  )}

                  {/* Body Systems */}
                  {ingredient.sistemas && ingredient.sistemas.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {ingredient.sistemas.slice(0, 2).map((sistema) => (
                        <Badge key={sistema} variant="outline" className="text-[10px] px-1.5 py-0.5 capitalize">
                          {sistema}
                        </Badge>
                      ))}
                      {ingredient.sistemas.length > 2 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                          +{ingredient.sistemas.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Indications Preview */}
                  {ingredient.indicaciones && ingredient.indicaciones.length > 0 && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      <span className="font-semibold text-foreground/80">Indicado en: </span>
                      {ingredient.indicaciones.slice(0, 3).join(', ')}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="hover:text-primary transition-colors font-medium">Ver ficha clínica →</span>
                  {inTray && (
                    <span className="text-primary font-bold text-[10px] bg-primary/10 px-1.5 py-0.5 rounded">En bandeja</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/80 p-8">
          <Database className="w-12 h-12 mx-auto text-muted-foreground/60 mb-3" aria-hidden="true" />
          <h3 className="text-base font-semibold text-foreground">No hay activos con los filtros seleccionados</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Prueba a buscar con otro término, limpiar la categoría o borrar el filtro de sistema.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
            <Button onClick={() => navigate('/admin')}>
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              Añadir nuevo activo
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedIngredient && (
        <IngredientDetail
          ingredient={selectedIngredient}
          activeIndication={query || localQuery}
          onClose={() => setSelectedIngredient(null)}
          onViewSynergies={(id) => {
            setSelectedIngredient(null);
            navigate(`/synergies?ingredient=${id}`);
          }}
        />
      )}
    </div>
  );
}
