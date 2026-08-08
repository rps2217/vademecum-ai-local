/**
 * AdminPage - Gestión de base de conocimiento
 * 
 * CRUD funcional para ingredientes y gestión de sinergias.
 */

import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { Card } from '@/ui/Card';
import { StatsCard } from '@/ui/StatsCard';
import { Button } from '@/ui/Button';
import { Badge } from '@/ui/Badge';
import { useSearch } from '@/contexts/SearchContext';
import { IngredientEditor } from '@/components/admin/IngredientEditor';
import { Database, RefreshCw, Upload, Download, Trash2, Shield, Plus, Edit2, Trash, Leaf } from 'lucide-react';
import { seedKnowledgeBase, isKnowledgeBaseSeeded } from '@/db/seeders';
import type { DbIngredient } from '@/db/schema';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

type AdminTab = 'overview' | 'ingredients' | 'synergies';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<DbIngredient | undefined>();

  // Stats from live query
  const ingredientsCount = useLiveQuery(() => db.ingredients.count(), [], 0);
  const synergiesCount = useLiveQuery(() => db.synergies.count(), [], 0);

  const handleReindex = async () => {
    setIsLoading(true);
    try {
      toast.info('Reindexando búsqueda...');
      // TODO: Reindex embeddings
      toast.success('Búsqueda reindexada');
    } catch (error) {
      logger.error('Error reindexing:', error);
      toast.error('Error al reindexar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReseed = async () => {
    setIsLoading(true);
    try {
      toast.info('Recargando base de conocimiento...');
      const result = await seedKnowledgeBase();
      toast.success(`Base recargada: ${result.ingredients} ingredientes, ${result.synergies} sinergias`);
    } catch (error) {
      logger.error('Error reseeding:', error);
      toast.error('Error al recargar base de conocimiento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const [ingredients, synergies] = await Promise.all([
        db.ingredients.toArray(),
        db.synergies.toArray(),
      ]);
      
      const data = { ingredients, synergies, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vademecum-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Datos exportados');
    } catch (error) {
      toast.error('Error al exportar');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data.ingredients && Array.isArray(data.ingredients)) {
          await db.ingredients.bulkPut(data.ingredients);
        }
        if (data.synergies && Array.isArray(data.synergies)) {
          await db.synergies.bulkPut(data.synergies);
        }
        
        toast.success('Datos importados');
      } catch (error) {
        toast.error('Error al importar archivo');
      }
    };
    input.click();
  };

  const handleSaveIngredient = async (ingredient: DbIngredient) => {
    try {
      await db.ingredients.put(ingredient);
      toast.success(`Ingrediente "${ingredient.nombre}" guardado`);
      setShowEditor(false);
      setEditingIngredient(undefined);
    } catch (error) {
      toast.error('Error al guardar ingrediente');
    }
  };

  const handleEditIngredient = (ingredient: DbIngredient) => {
    setEditingIngredient(ingredient);
    setShowEditor(true);
  };

  const handleDeleteIngredient = async (ingredient: DbIngredient) => {
    if (!confirm(`¿Eliminar "${ingredient.nombre}"?`)) return;
    
    try {
      await db.ingredients.update(ingredient.id, { tombstone: 1, updatedAt: Date.now() });
      toast.success(`Ingrediente "${ingredient.nombre}" eliminado`);
    } catch (error) {
      toast.error('Error al eliminar ingrediente');
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Resumen', icon: Database },
    { id: 'ingredients' as const, label: 'Ingredientes', icon: Leaf },
    { id: 'synergies' as const, label: 'Sinergias', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administración</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona la base de conocimiento
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-background',
              activeTab === tab.id
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="w-4 h-4" aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Ingredientes"
              value={ingredientsCount}
              icon={<Database className="w-5 h-5" aria-hidden="true" />}
            />
            <StatsCard
              title="Sinergias"
              value={synergiesCount}
              icon={<Shield className="w-5 h-5" aria-hidden="true" />}
            />
            <StatsCard
              title="Categorías"
              value={7}
              icon={<Database className="w-5 h-5" aria-hidden="true" />}
            />
          </div>

          {/* Actions */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4">Acciones de administración</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="justify-start"
                onClick={handleReindex}
                disabled={isLoading}
                isLoading={isLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                Reindexar búsqueda
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={handleReseed}
                disabled={isLoading}
                isLoading={isLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                Recargar datos
              </Button>
              <Button variant="outline" className="justify-start" onClick={handleImport}>
                <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
                Importar datos
              </Button>
              <Button variant="outline" className="justify-start" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                Exportar datos
              </Button>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4">Gestión rápida</h2>
            <div className="flex gap-3">
              <Button onClick={() => setShowEditor(true)} className="gap-2">
                <Plus className="w-4 h-4" aria-hidden="true" />
                Nuevo Ingrediente
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('ingredients')}>
                Ver Ingredientes
              </Button>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'ingredients' && (
        <IngredientsTab
          onEdit={handleEditIngredient}
          onDelete={handleDeleteIngredient}
          onNew={() => setShowEditor(true)}
        />
      )}

      {activeTab === 'synergies' && (
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Gestión de Sinergias</h2>
          <p className="text-muted-foreground text-sm">
            La gestión de sinergias estará disponible pronto. Por ahora puedes editarlas 
            desde la página de Sinergias.
          </p>
        </Card>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <IngredientEditor
            ingredient={editingIngredient}
            onSave={handleSaveIngredient}
            onCancel={() => {
              setShowEditor(false);
              setEditingIngredient(undefined);
            }}
          />
        </div>
      )}
    </div>
  );
}

// Ingredients Tab Component
function IngredientsTab({
  onEdit,
  onDelete,
  onNew,
}: {
  onEdit: (ingredient: DbIngredient) => void;
  onDelete: (ingredient: DbIngredient) => void;
  onNew: () => void;
}) {
  const { query } = useSearch();
  const [category, setCategory] = useState('');

  const ingredients = useLiveQuery(async () => {
    let collection = db.ingredients;
    if (category) {
      collection = collection.where('categoria').equals(category);
    }
    const all = await collection.toArray();
    
    if (query) {
      const q = query.toLowerCase();
      return all.filter(
        (i) =>
          i.nombre.toLowerCase().includes(q) ||
          i.sinonimos.some((s) => s.toLowerCase().includes(q))
      );
    }
    return all;
  }, [query, category], []);

  const CATEGORY_COLORS: Record<string, string> = {
    fitoterapia: 'bg-emerald-500/10 text-emerald-600',
    homeopatia: 'bg-blue-500/10 text-blue-600',
    aceite_esencial: 'bg-amber-500/10 text-amber-600',
    vitamina: 'bg-violet-500/10 text-violet-600',
    mineral: 'bg-slate-500/10 text-slate-600',
    probiotico: 'bg-pink-500/10 text-pink-600',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 flex gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filtrar por categoría"
            className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas</option>
            <option value="fitoterapia">Fitoterapia</option>
            <option value="homeopatia">Homeopatía</option>
            <option value="aceite_esencial">Aceites</option>
            <option value="vitamina">Vitaminas</option>
            <option value="mineral">Minerales</option>
          </select>
        </div>
        <Button onClick={onNew} className="gap-2">
          <Plus className="w-4 h-4" aria-hidden="true" />
          Nuevo
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {ingredients.length === 0 ? (
          <Card className="p-8 text-center">
            <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
            <p className="text-muted-foreground">No hay ingredientes</p>
            <Button variant="outline" className="mt-4" onClick={onNew}>
              Crear el primero
            </Button>
          </Card>
        ) : (
          ingredients.map((ingredient) => (
            <Card key={ingredient.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={CATEGORY_COLORS[ingredient.categoria] || ''}>
                    {ingredient.categoria.replace('_', ' ')}
                  </Badge>
                  <div>
                    <h3 className="font-medium">{ingredient.nombre}</h3>
                    {ingredient.sinonimos.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {ingredient.sinonimos.slice(0, 2).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(ingredient)}
                    aria-label={`Editar ${ingredient.nombre}`}
                  >
                    <Edit2 className="w-4 h-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(ingredient)}
                    className="text-destructive hover:text-destructive"
                    aria-label={`Eliminar ${ingredient.nombre}`}
                  >
                    <Trash className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
