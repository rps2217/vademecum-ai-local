/**
 * KnowledgePage - Base de conocimiento rediseñada
 * 
 * Lista de ingredientes con filtros y detalle modal.
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
import { Database, Filter, Plus, BookOpen, Leaf, FlaskConical } from 'lucide-react';
import type { DbIngredient, IngredientCategory } from '@/db/schema';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: '', label: 'Todas las categorias' },
  { value: 'fitoterapia', label: 'Fitoterapia' },
  { value: 'homeopatia', label: 'Homeopatia' },
  { value: 'aceite_esencial', label: 'Aceites esenciales' },
  { value: 'vitamina', label: 'Vitaminas' },
  { value: 'mineral', label: 'Minerales' },
  { value: 'probiotico', label: 'Probioticos' },
];

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Leaf; color: string }> = {
  fitoterapia: { label: 'Fitoterapia', icon: Leaf, color: 'bg-emerald-500/10 text-emerald-600' },
  homeopatia: { label: 'Homeopatia', icon: FlaskConical, color: 'bg-blue-500/10 text-blue-600' },
  aceite_esencial: { label: 'Aceite esencial', icon: FlaskConical, color: 'bg-amber-500/10 text-amber-600' },
  vitamina: { label: 'Vitamina', icon: BookOpen, color: 'bg-violet-500/10 text-violet-600' },
  mineral: { label: 'Mineral', icon: BookOpen, color: 'bg-slate-500/10 text-slate-600' },
  probiotico: { label: 'Probiotico', icon: Leaf, color: 'bg-pink-500/10 text-pink-600' },
};

const EVIDENCE_CONFIG: Record<string, { label: string; color: string }> = {
  A: { label: 'Ev. Alta', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  B: { label: 'Ev. Media', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  C: { label: 'Ev. Baja', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  D: { label: 'Ev. Muy baja', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
};

export function KnowledgePage() {
  const navigate = useNavigate();
  const { query } = useSearch();
  const [category, setCategory] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<DbIngredient | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Usar el hook de ingredientes (soporta sync automático)
  const { ingredients, isLoading, total } = useIngredients({
    query,
    category: category as IngredientCategory | undefined,
    limit: 100,
  });

  const getCategoryConfig = (cat: string) => {
    return CATEGORY_CONFIG[cat] || { label: cat, icon: Leaf, color: 'bg-gray-500/10 text-gray-600' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Base de Conocimiento</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading 
              ? 'Cargando...' 
              : `${ingredients.length} de ${total} ingredientes`}
          </p>
        </div>
        <Button onClick={() => navigate('/admin')}>
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          Anadir ingrediente
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1" />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-muted"
          aria-expanded={showFilters}
        >
          <Filter className="w-4 h-4" aria-hidden="true" />
          Filtros
          {category && <Badge variant="secondary" className="ml-1">1</Badge>}
        </button>
      </div>

      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Select
              label="Categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={CATEGORIES}
              placeholder="Todas las categorias"
            />
          </div>
        </Card>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      ) : ingredients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ingredients.map((ingredient) => {
            const catConfig = getCategoryConfig(ingredient.categoria);
            const CatIcon = catConfig.icon;
            const evidenceConfig = EVIDENCE_CONFIG[ingredient.evidencia] || EVIDENCE_CONFIG.C;
            
            return (
              <Card
                key={ingredient.id}
                className="p-4 hover:border-primary transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setSelectedIngredient(ingredient)}
              >
                {/* Category Icon and Badge */}
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('p-2 rounded-lg', catConfig.color)}>
                    <CatIcon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {catConfig.label}
                    </Badge>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${evidenceConfig.color}`}>
                      {evidenceConfig.label}
                    </span>
                  </div>
                </div>

                {/* Name */}
                <h3 className="font-semibold text-lg mb-1">{ingredient.nombre}</h3>

                {/* Synonyms */}
                {ingredient.sinonimos && ingredient.sinonimos.length > 0 && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                    {ingredient.sinonimos.slice(0, 3).join(', ')}
                  </p>
                )}

                {/* Body Systems */}
                {ingredient.sistemas && ingredient.sistemas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {ingredient.sistemas.slice(0, 2).map((sistema) => (
                      <Badge key={sistema} variant="outline" className="text-xs">
                        {sistema}
                      </Badge>
                    ))}
                    {ingredient.sistemas.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{ingredient.sistemas.length - 2}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Indications Preview */}
                {ingredient.indicaciones && ingredient.indicaciones.length > 0 && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ingredient.indicaciones.slice(0, 2).join(', ')}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
          <p className="text-muted-foreground font-medium">No hay ingredientes disponibles</p>
          <p className="text-sm text-muted-foreground mt-1">
            Prueba con otros filtros o inicializa la base de conocimiento
          </p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => navigate('/admin')}
          >
            <Database className="w-4 h-4 mr-2" aria-hidden="true" />
            Ir a Admin
          </Button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedIngredient && (
        <IngredientDetail
          ingredient={selectedIngredient}
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
