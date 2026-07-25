/**
 * Visualizacion del Grafo de Sinergias
 */

import React, { useState, useEffect } from 'react';
import { synergyGraphService, type SynergyNode } from '../../core/knowledge-base/SynergyGraph';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export function SynergyGraphView() {
  const [selectedNode, setSelectedNode] = useState<SynergyNode | null>(null);
  const [hubs, setHubs] = useState<SynergyNode[]>([]);

  useEffect(() => {
    setHubs(synergyGraphService.obtenerHubSinergicos(12));
  }, []);

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'alto': return 'success';
      case 'medio': return 'warning';
      default: return 'muted';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Grafo de Sinergias</h2>
        <p className="text-muted-foreground">
          Relaciones entre ingredientes en la base de conocimiento
        </p>
      </div>

      {/* Estadisticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-primary">{hubs.length}</div>
            <p className="text-sm text-muted-foreground">Ingredientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-success">
              {synergyGraphService.obtenerEstadisticas().sinergiasTotales}
            </div>
            <p className="text-sm text-muted-foreground">Sinergias</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-warning">
              {synergyGraphService.obtenerEstadisticas().antagonismosTotales}
            </div>
            <p className="text-sm text-muted-foreground">Antagonismos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold">
              {synergyGraphService.obtenerEstadisticas().promedioConexiones}
            </div>
            <p className="text-sm text-muted-foreground">Promedio Conexiones</p>
          </CardContent>
        </Card>
      </div>

      {/* Nodos Principales */}
      <Card>
        <CardHeader>
          <CardTitle>Ingredientes Mas Conectados</CardTitle>
          <CardDescription>
            Los ingredientes con mas relaciones sinérgicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {hubs.map((node, index) => (
              <div 
                key={node.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  selectedNode?.id === node.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedNode(node)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                  <Badge variant="outline" className="text-xs">
                    {node.conexiones.length}
                  </Badge>
                </div>
                <h4 className="font-medium text-sm line-clamp-1">{node.nombre}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {node.peso_total > 0 ? '+' : ''}{node.peso_total} peso
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detalle del Nodo */}
      {selectedNode && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedNode.nombre}</CardTitle>
              <Badge>{selectedNode.conexiones.length} conexiones</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span className="text-success">+</span> Sinergias
              </h4>
              <div className="space-y-2">
                {synergyGraphService.obtenerSinergiasDe(selectedNode.id).slice(0, 5).map((edge) => {
                  const nodoDestino = synergyGraphService.obtenerNodo(edge.hacia);
                  return (
                    <div key={edge.id} className="flex items-center justify-between p-2 bg-success/5 rounded-lg">
                      <span className="text-sm">{nodoDestino?.nombre || edge.hacia}</span>
                      <Badge variant="success" className="text-xs">{edge.nivel}</Badge>
                    </div>
                  );
                })}
                {synergyGraphService.obtenerSinergiasDe(selectedNode.id).length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin sinergias registradas</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span className="text-danger">-</span> Antagonismos
              </h4>
              <div className="space-y-2">
                {synergyGraphService.obtenerAntagonismosDe(selectedNode.id).slice(0, 5).map((edge) => {
                  const nodoDestino = synergyGraphService.obtenerNodo(edge.hacia);
                  return (
                    <div key={edge.id} className="flex items-center justify-between p-2 bg-danger/5 rounded-lg">
                      <span className="text-sm">{nodoDestino?.nombre || edge.hacia}</span>
                      <Badge variant="danger" className="text-xs">{edge.nivel}</Badge>
                    </div>
                  );
                })}
                {synergyGraphService.obtenerAntagonismosDe(selectedNode.id).length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin antagonismos registrados</p>
                )}
              </div>
            </div>

            {selectedNode.datos && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Descripcion</h4>
                <p className="text-sm text-muted-foreground">{selectedNode.datos.descripcion}</p>
                
                {selectedNode.datos.dosis_recomendada && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Dosis: </span>
                    <span className="text-sm">{selectedNode.datos.dosis_recomendada}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Leyenda */}
      <Card>
        <CardHeader>
          <CardTitle>Leyenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success"></div>
              <span>Sinergia Alta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-warning"></div>
              <span>Sinergia Media</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-danger"></div>
              <span>Antagonismo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted"></div>
              <span>Sinergia Baja</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SynergyGraphView;
