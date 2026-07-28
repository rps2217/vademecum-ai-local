/**
 * KnowledgePage - Base de conocimiento
 */

import { useState, useEffect } from 'react';
import { db } from '@/db';
import { SearchInput } from '@/ui/SearchInput';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Input } from '@/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/Select';
import type { Ingredient } from '@/db/schema';

const CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'fitoterapia', label: 'Fitoterapia' },
  { value: 'homeopatia', label: 'Homeopatía' },
  { value: 'aceite_esencial', label: 'Aceites esenciales' },
  { value: 'vitaminas', label: 'Vitaminas' },
  { value: 'minerales', label: 'Minerales' },
];

export function KnowledgePage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadIngredients() {
      setIsLoading(true);
      try {
        let results = await db.ingredients.toArray();
        
        if (category !== 'all') {
          results = results.filter((ing) => ing.categoria === category);
        }
        
        if (query) {
          results = results.filter((ing) =>
            ing.nombre.toLowerCase().includes(query.toLowerCase())
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
          {ingredients.length} ingredientes disponibles
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Buscar por nombre..."
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-background"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      ) : ingredients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ingredients.map((ingredient) => (
            <Card key={ingredient.id} className="p-4 hover:border-primary transition-colors cursor-pointer">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{ingredient.nombre}</h3>
                <Badge variant="secondary">
                  {CATEGORIES.find((c) => c.value === ingredient.categoria)?.label || ingredient.categoria}
                </Badge>
              </div>
              
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
          <p className="text-muted-foreground">No hay ingredientes disponibles</p>
        </div>
      )}
    </div>
  );
}
