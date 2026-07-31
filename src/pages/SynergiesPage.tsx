/**
 * SynergiesPage - Red de sinergias rediseñada
 * 
 * Grid de sinergias con visualizacion de combinaciones y grafo interactivo.
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '@/db';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { SearchInput } from '@/ui/SearchInput';
import { SynergyGraph } from '@/components/admin/SynergyGraph';
import { Network, ArrowRight, Link2, Sparkles, AlertTriangle, Info, LayoutGrid, GitBranch } from 'lucide-react';
import type { DbSynergy } from '@/db/schema';

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof Link2 }> = {
  sinergia: { 
    label: 'Sinergia', 
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', 
    icon: Sparkles 
  },
  complemento: { 
    label: 'Complemento', 
    color: 'bg-blue-500/10 text-blue-600 border-blue-200', 
    icon: Link2 
  },
  interaccion: { 
    label: 'Interaccion', 
    color: 'bg-violet-500/10 text-violet-600 border-violet-200', 
    icon: Network 
  },
  antagonismo: { 
    label: 'Antagonismo', 
    color: 'bg-red-500/10 text-red-600 border-red-200', 
    icon: AlertTriangle 
  },
};

const LEVEL_CONFIG: Record<string, { label: string; color: string }> = {
  alto: { label: 'Evidencia alta', color: 'bg-green-100 text-green-800' },
  medio: { label: 'Evidencia media', color: 'bg-yellow-100 text-yellow-800' },
  bajo: { label: 'Evidencia baja', color: 'bg-gray-100 text-gray-800' },
};

type ViewMode = 'graph' | 'grid';

export function SynergiesPage() {
  const [searchParams] = useSearchParams();
  const [synergies, setSynergies] = useState<DbSynergy[]>([]);
  const [ingredients, setIngredients] = useState<Record<string, string>>({});
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [selectedSynergy, setSelectedSynergy] = useState<DbSynergy | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [synergiesData, ingredientsData] = await Promise.all([
          db.synergies.toArray(),
          db.ingredients.toArray(),
        ]);
        
        const ingredientMap: Record<string, string> = {};
        ingredientsData.forEach(ing => {
          ingredientMap[ing.id] = ing.nombre;
        });
        
        setIngredients(ingredientMap);
        setSynergies(synergiesData);
      } catch (error) {
        console.error('Error loading synergies:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredSynergies = useMemo(() => {
    if (!query) return synergies;
    const q = query.toLowerCase();
    return synergies.filter((s) => {
      const nameA = ingredients[s.ingredienteA] || s.ingredienteA;
      const nameB = ingredients[s.ingredienteB] || s.ingredienteB;
      return (
        nameA.toLowerCase().includes(q) ||
        nameB.toLowerCase().includes(q) ||
        s.tipo.toLowerCase().includes(q) ||
        (s.mecanismo && s.mecanismo.toLowerCase().includes(q))
      );
    });
  }, [synergies, query, ingredients]);

  const getTypeConfig = (tipo: string) => {
    return TYPE_CONFIG[tipo] || TYPE_CONFIG.interaccion;
  };

  const getLevelConfig = (nivel: string) => {
    return LEVEL_CONFIG[nivel] || LEVEL_CONFIG.bajo;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sinergias</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading 
              ? 'Cargando...' 
              : `${filteredSynergies.length} combinaciones`}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setViewMode('graph')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              viewMode === 'graph' 
                ? 'bg-background shadow-sm font-medium' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span className="hidden sm:inline">Grafo</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              viewMode === 'grid' 
                ? 'bg-background shadow-sm font-medium' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar por ingrediente o mecanismo..."
      />

      {/* Content based on view mode */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      ) : filteredSynergies.length === 0 ? (
        <div className="text-center py-12">
          <Network className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">No se encontraron sinergias</p>
          <p className="text-sm text-muted-foreground mt-1">
            {query ? 'Prueba con otros terminos de busqueda' : 'No hay sinergias cargadas aun'}
          </p>
        </div>
      ) : viewMode === 'graph' ? (
        <>
          {/* Graph Visualization */}
          <Card className="p-1">
            <SynergyGraph
              synergies={filteredSynergies}
              ingredients={ingredients}
              onNodeClick={(id) => setSelectedIngredient(id)}
              onEdgeClick={(synergy) => setSelectedSynergy(synergy)}
              className="h-[500px]"
            />
          </Card>

          {/* Selected Synergy Detail */}
          {selectedSynergy && (
            <Card className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const typeConfig = getTypeConfig(selectedSynergy.tipo);
                    const TypeIcon = typeConfig.icon;
                    return (
                      <>
                        <div className={`p-2 rounded-lg ${typeConfig.color} border`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {ingredients[selectedSynergy.ingredienteA] || selectedSynergy.ingredienteA}
                            {' → '}
                            {ingredients[selectedSynergy.ingredienteB] || selectedSynergy.ingredienteB}
                          </h3>
                          <div className="flex gap-2 mt-1">
                            <Badge className={`${typeConfig.color} border text-xs`}>
                              {typeConfig.label}
                            </Badge>
                            <Badge className={`${getLevelConfig(selectedSynergy.nivel).color} text-xs`}>
                              {getLevelConfig(selectedSynergy.nivel).label}
                            </Badge>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedSynergy(null)}
                >
                  Cerrar
                </Button>
              </div>
              {selectedSynergy.mecanismo && (
                <p className="text-sm text-muted-foreground">{selectedSynergy.mecanismo}</p>
              )}
            </Card>
          )}

          {/* Quick List below graph */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSynergies.slice(0, 6).map((synergy) => {
              const typeConfig = getTypeConfig(synergy.tipo);
              const TypeIcon = typeConfig.icon;
              const nameA = ingredients[synergy.ingredienteA] || synergy.ingredienteA;
              const nameB = ingredients[synergy.ingredienteB] || synergy.ingredienteB;

              return (
                <Card 
                  key={synergy.id} 
                  className="p-3 hover:border-primary transition-colors cursor-pointer"
                  onClick={() => setSelectedSynergy(synergy)}
                >
                  <div className="flex items-center gap-2">
                    <TypeIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">{nameA}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{nameB}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSynergies.map((synergy) => {
            const typeConfig = getTypeConfig(synergy.tipo);
            const levelConfig = getLevelConfig(synergy.nivel);
            const TypeIcon = typeConfig.icon;
            const nameA = ingredients[synergy.ingredienteA] || synergy.ingredienteA;
            const nameB = ingredients[synergy.ingredienteB] || synergy.ingredienteB;

            return (
              <Card 
                key={synergy.id} 
                className="p-5 hover:border-primary transition-colors cursor-pointer group"
              >
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${typeConfig.color} border`}>
                    <TypeIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Ingredients connection */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{nameA}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-semibold">{nameB}</span>
                    </div>
                    
                    {/* Type and Level badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge className={`${typeConfig.color} border text-xs`}>
                        {typeConfig.label}
                      </Badge>
                      <Badge className={`${levelConfig.color} text-xs`}>
                        {levelConfig.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Mechanism */}
                {synergy.mecanismo && (
                  <p className="text-sm text-muted-foreground mt-3 pl-[4.5rem]">
                    {synergy.mecanismo}
                  </p>
                )}

                {/* Evidence indicator */}
                {synergy.evidencia && (
                  <div className="flex items-center gap-1 mt-3 pl-[4.5rem]">
                    <Info className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Evidencia: {synergy.evidencia}
                    </span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
