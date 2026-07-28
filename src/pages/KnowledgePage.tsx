/**
 * KnowledgePage - Base de conocimiento
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/db';
import { SearchInput } from '@/ui/SearchInput';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Select } from '@/ui/Select';
import { IngredientDetail } from '@/components/ui/IngredientDetail';
import { Database, Filter } from 'lucide-react';
import type { DbIngredient } from '@/db/schema';

const CATEGORIES = [
  { value: '', label: 'Todas las categorias' },
  { value: 'fitoterapia', label: 'Fitoterapia' },
  { value: 'homeopatia', label: 'Homeopatia' },
  { value: 'aceite_esencial', label: 'Aceites esenciales' },
  { value: 'vitamina', label: 'Vitaminas' },
  { value: 'mineral', label: 'Minerales' },
  { value: 'probiotico', label: 'Probioticos' },
];

const CATEGORY_LABELS: Record<string, string> = {
  fitoterapia: 'Fitoterapia',
  homeopatia: 'Homeopatia',
  aceite_esencial: 'Aceite esencial',
  vitamina: 'Vitamina',
  mineral: 'Mineral',
  probiotico: 'Probiotico',
};

export function KnowledgePage() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<DbIngredient[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIngredient, setSelectedIngredient] = useState<DbIngredient | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function loadIngredients() {
      setIsLoading(true);
      try {
        let results = await db.ingredients.toArray();
        
        if (category) {
          results = results.filter((ing) => ing.categoria === category);
        }
        
        if (query) {
          const q = query.toLowerCase();
          results = results.filter((ing) =>
            ing.nombre.toLowerCase().includes(q) ||
            ing.sinonimos.some(s => s.toLowerCase().includes(q)) ||
            ing.indicaciones.some(i => i.toLowerCase().includes(q))
          );
        }
        
        setIngredients(results);
      } catch (error) {
        console.error('Error loading ingredients:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadIngredients();
  }, [query, category]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Base de conocimiento</h1>
        <p className="text-muted-foreground mt-1">
          {isLoading ? 'Cargando...' : `${ingredients.length} ingredientes disponibles`}
        </p>
      </div>

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar por nombre, sinonimo o indicacion..."
      />

      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <Filter className="w-4 h-4" />
        Filtros {category && <Badge variant="secondary">1</Badge>}
      </button>

      {showFilters && (
        <Card className="p-4">
          <Select
            label="Categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={CATEGORIES}
            placeholder="Todas las categorias"
          />
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      ) : ingredients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ingredients.map((ingredient) => (
            <Card 
              key={ingredient.id} 
              className="p-4 hover:border-primary transition-colors cursor-pointer"
              onClick={() => setSelectedIngredient(ingredient)}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{ingredient.nombre}</h3>
                <Badge variant="secondary">
                  {CATEGORY_LABELS[ingredient.categoria] || ingredient.categoria}
                </Badge>
              </div>
              
              {ingredient.sinonimos && ingredient.sinonimos.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {ingredient.sinonimos.slice(0, 2).join(', ')}
                </p>
              )}
              
              {ingredient.sistemas && ingredient.sistemas.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {ingredient.sistemas.slice(0, 3).map((sistema) => (
                    <Badge key={sistema} variant="outline" className="text-xs">
                      {sistema}
                    </Badge>
                  ))}
                </div>
              )}
              
              {ingredient.indicaciones && ingredient.indicaciones.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {ingredient.indicaciones.slice(0, 3).join(', ')}
                </p>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay ingredientes disponibles</p>
          <p className="text-sm text-muted-foreground mt-1">
            Prueba con otros filtros o busca en la base de conocimiento
          </p>
        </div>
      )}

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
