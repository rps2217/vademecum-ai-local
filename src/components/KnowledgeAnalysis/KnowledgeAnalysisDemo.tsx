/**
 * Demo del Sistema de Análisis Basado en Conocimiento
 */

import React, { useState, useEffect } from 'react';
import { knowledgeAnalysisService } from '../../services/KnowledgeAnalysisService';
import { synergyGraphService } from '../../core/knowledge-base/SynergyGraph';
import { logger } from '../../services/LoggerService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export function KnowledgeAnalysisDemo() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [ingredientDetail, setIngredientDetail] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStats(knowledgeAnalysisService.getStats());
  }, []);

  const handleSearchIngredient = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const result = await knowledgeAnalysisService.analizarIngredientes([searchTerm]);
      
      if (result.ingredientes.length > 0) {
        setIngredientDetail(result.ingredientes[0]);
        setSelectedIngredient(result.ingredientes[0].id);
      }
    } catch (error) {
      logger.error('Error buscando ingrediente', 'KnowledgeAnalysisDemo', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIngredient = (id: string) => {
    const detail = knowledgeAnalysisService.getIngredientInfo(id);
    setIngredientDetail(detail);
    setSelectedIngredient(id);
  };

  const handleGetRecommendations = (objetivo: string) => {
    const recs = knowledgeAnalysisService.recomendarPorObjetivo(objetivo);
    setRecommendations(recs);
  };

  const getNivelBadgeColor = (nivel: string) => {
    switch (nivel) {
      case 'alto': return 'success';
      case 'medio': return 'warning';
      default: return 'muted';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">
          Sistema de Análisis Basado en Conocimiento
        </h1>
        <p className="text-muted-foreground">
          Análisis de ingredientes y sinergias sin necesidad de IA externa
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ingredientes en Base</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.knowledgeBase?.total_ingredientes || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sinergias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.knowledgeBase?.total_sinergias || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nodos en Grafo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.grafo?.totalNodos || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Aristas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.grafo?.totalAristas || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Búsqueda de Ingredientes */}
        <Card>
          <CardHeader>
            <CardTitle>Buscar Ingrediente</CardTitle>
            <CardDescription>
              Busca información detallada de un ingrediente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ej: vitamina_c, zinc, magnesio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchIngredient()}
              />
              <Button onClick={handleSearchIngredient} disabled={loading}>
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
            
            {ingredientDetail && (
              <div className="mt-4 p-4 bg-accent rounded-xl space-y-3">
                <h3 className="font-semibold text-lg">{ingredientDetail.nombre}</h3>
                <Badge variant={getNivelBadgeColor('medio')}>{ingredientDetail.categoria}</Badge>
                
                <div>
                  <h4 className="font-medium text-sm mb-1">Descripción</h4>
                  <p className="text-sm text-muted-foreground">{ingredientDetail.descripcion}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-1">Mecanismo de Acción</h4>
                  <p className="text-sm text-muted-foreground">{ingredientDetail.mecanismo_accion}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2">Beneficios</h4>
                  <ul className="text-sm space-y-1">
                    {ingredientDetail.beneficios?.slice(0, 5).map((b: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-success">+</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>

                {ingredientDetail.dosis_recomendada && (
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <span className="text-sm font-medium">Dosis: </span>
                    <span className="text-sm">{ingredientDetail.dosis_recomendada}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sinergias del Ingrediente */}
        <Card>
          <CardHeader>
            <CardTitle>Sinergias Detectadas</CardTitle>
            <CardDescription>
              Relaciones beneficiosas con otros ingredientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ingredientDetail?.sinergias && ingredientDetail.sinergias.length > 0 ? (
              <div className="space-y-3">
                {ingredientDetail.sinergias.map((s: any) => (
                  <div key={s.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{s.hacia}</span>
                      <Badge variant={getNivelBadgeColor(s.nivel)}>{s.nivel}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{s.descripcion}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {s.tipo}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Busca un ingrediente para ver sus sinergias
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recomendaciones por Objetivo */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendaciones por Objetivo</CardTitle>
          <CardDescription>
            Encuentra ingredientes recomendados según tu objetivo de salud
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {['inmunidad', 'energia', 'sueno', 'articula', 'cerebro', 'deporte', 'digestion'].map(obj => (
              <Button
                key={obj}
                variant="outline"
                size="sm"
                onClick={() => handleGetRecommendations(obj)}
              >
                {obj}
              </Button>
            ))}
          </div>

          {recommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-3 border rounded-lg hover:border-primary transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{rec.nombre}</span>
                    <Badge variant="outline" className="text-xs">{rec.categoria}</Badge>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-xs text-muted-foreground">Relevancia:</span>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(rec.relevancia * 10, 100)}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {rec.beneficios?.slice(0, 2).join(' - ')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hub Sinérgicos */}
      <Card>
        <CardHeader>
          <CardTitle>Ingredientes Más Conectados</CardTitle>
          <CardDescription>
            Los ingredientes con más relaciones sinérgicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {synergyGraphService.obtenerHubSinergicos(8).map((node, index) => (
              <div 
                key={node.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleSelectIngredient(node.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-muted-foreground w-8">
                    #{index + 1}
                  </span>
                  <span className="font-medium">{node.nombre}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{node.conexiones.length} conexiones</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default KnowledgeAnalysisDemo;
