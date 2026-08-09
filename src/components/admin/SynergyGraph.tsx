/**
 * SynergyGraph - Visualización SVG de red de sinergias
 * 
 * Grafico interactivo que muestra las relaciones entre ingredientes.
 */

import { useMemo, useState, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import type { DbSynergy } from '@/db/schema';

interface SynergyGraphProps {
  synergies: DbSynergy[];
  ingredients: Record<string, string>;
  onNodeClick?: (ingredientId: string) => void;
  onEdgeClick?: (synergy: DbSynergy) => void;
  className?: string;
}

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  connections: number;
  type: 'sinergia' | 'complemento' | 'interaccion' | 'antagonismo';
}

interface Edge {
  source: string;
  target: string;
  synergy: DbSynergy;
}

const TYPE_COLORS = {
  sinergia: { stroke: '#10b981', fill: '#10b981', glow: '#10b98140' },
  complemento: { stroke: '#3b82f6', fill: '#3b82f6', glow: '#3b82f640' },
  interaccion: { stroke: '#8b5cf6', fill: '#8b5cf6', glow: '#8b5cf640' },
  antagonismo: { stroke: '#ef4444', fill: '#ef4444', glow: '#ef444440' },
};

const SynergyGraphComponent = ({ 
  synergies, 
  ingredients, 
  onNodeClick,
  onEdgeClick,
  className 
}: SynergyGraphProps) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });

  // Calcular nodos y aristas desde las sinergias
  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, Node>();
    const edgeList: Edge[] = [];

    // Crear nodos para cada ingrediente único
    synergies.forEach((synergy) => {
      const ingA = synergy.ingredienteA;
      const ingB = synergy.ingredienteB;

      if (!nodeMap.has(ingA)) {
        nodeMap.set(ingA, {
          id: ingA,
          name: ingredients[ingA] || ingA,
          x: 0,
          y: 0,
          connections: 0,
          type: synergy.tipo as Node['type'],
        });
      }
      if (!nodeMap.has(ingB)) {
        nodeMap.set(ingB, {
          id: ingB,
          name: ingredients[ingB] || ingB,
          x: 0,
          y: 0,
          connections: 0,
          type: synergy.tipo as Node['type'],
        });
      }

      nodeMap.get(ingA)!.connections++;
      nodeMap.get(ingB)!.connections++;

      edgeList.push({
        source: ingA,
        target: ingB,
        synergy,
      });
    });

    // Posicionar nodos en círculo
    const nodesArray = Array.from(nodeMap.values());
    const centerX = 400;
    const centerY = 300;
    const radius = Math.min(250, nodesArray.length * 30);

    nodesArray.forEach((node, index) => {
      const angle = (index / nodesArray.length) * 2 * Math.PI - Math.PI / 2;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
    });

    return { nodes: nodesArray, edges: edgeList };
  }, [synergies, ingredients]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).tagName !== 'circle' && (e.target as Element).tagName !== 'text') {
      const startX = e.clientX - transform.x;
      const startY = e.clientY - transform.y;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        setTransform({
          ...transform,
          x: moveEvent.clientX - startX,
          y: moveEvent.clientY - startY,
        });
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [transform]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.3, Math.min(2, prev.scale * delta)),
    }));
  }, []);

  if (nodes.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        No hay sinergias para visualizar
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden bg-muted/30 rounded-lg', className)}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 600"
        className="cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        <defs>
          {Object.entries(TYPE_COLORS).map(([type]) => (
            <filter key={type} id={`glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* Aristas (edges) */}
          <g className="edges">
            {edges.map((edge) => {
              const sourceNode = nodes.find((n) => n.id === edge.source);
              const targetNode = nodes.find((n) => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              const edgeId = `${edge.source}-${edge.target}`;
              const colors = TYPE_COLORS[edge.synergy.tipo as keyof typeof TYPE_COLORS] || TYPE_COLORS.interaccion;
              const isHovered = hoveredEdge === edgeId;
              const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target;

              return (
                <g key={edgeId}>
                  {/* Línea de conexión */}
                  <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={colors.stroke}
                    strokeWidth={isHovered || isHighlighted ? 3 : 1.5}
                    strokeOpacity={isHighlighted || !hoveredNode ? 0.6 : 0.2}
                    className="transition-all duration-200 cursor-pointer focus-visible:outline-none"
                    filter={isHovered ? `url(#glow-${edge.synergy.tipo})` : 'none'}
                    onMouseEnter={() => setHoveredEdge(edgeId)}
                    onMouseLeave={() => setHoveredEdge(null)}
                    onClick={() => onEdgeClick?.(edge.synergy)}
                  >
                    <title>{`${edge.synergy.tipo}`}</title>
                  </line>
                  {/* Indicador de tipo en el centro */}
                  {(isHovered || isHighlighted) && (
                    <circle
                      cx={(sourceNode.x + targetNode.x) / 2}
                      cy={(sourceNode.y + targetNode.y) / 2}
                      r={6}
                      fill={colors.fill}
                      className="cursor-pointer"
                      onClick={() => onEdgeClick?.(edge.synergy)}
                    />
                  )}
                </g>
              );
            })}
          </g>

          {/* Nodos */}
          <g className="nodes">
            {nodes.map((node) => {
              const isHovered = hoveredNode === node.id;
              const radius = Math.max(20, Math.min(40, 15 + node.connections * 3));
              const colors = TYPE_COLORS[node.type] || TYPE_COLORS.interaccion;

              return (
                <g
                  key={node.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => onNodeClick?.(node.id)}
                >
                  {/* Círculo exterior (glow cuando hover) */}
                  {isHovered && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius + 8}
                      fill={colors.glow}
                      className="transition-all duration-200"
                    />
                  )}
                  {/* Círculo principal */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius}
                    fill="var(--card)"
                    stroke={isHovered ? colors.stroke : 'var(--border)'}
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all duration-200"
                    filter={isHovered ? `url(#glow-${node.type})` : 'none'}
                  />
                  {/* Texto del nodo */}
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={cn(
                      'text-xs font-medium fill-current pointer-events-none',
                      isHovered ? 'text-foreground' : 'text-muted-foreground'
                    )}
                    transform={`rotate(-45 ${node.x} ${node.y})`}
                  >
                    {node.name.length > 12 ? node.name.slice(0, 12) + '...' : node.name}
                  </text>
                  {/* Badge de conexiones */}
                  {node.connections > 1 && (
                    <circle
                      cx={node.x + radius - 5}
                      cy={node.y - radius + 5}
                      r={8}
                      fill={colors.fill}
                      className="fill-current text-xs"
                    />
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 text-xs space-y-1">
        <p className="font-semibold mb-2">Leyenda</p>
        {Object.entries(TYPE_COLORS).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
              <circle cx="6" cy="6" r="6" fill={colors.fill} />
            </svg>
            <span className="capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Controles de zoom */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={() => setTransform((p) => ({ ...p, scale: Math.min(2, p.scale * 1.2) }))}
          className="w-8 h-8 bg-background/80 backdrop-blur-sm rounded flex items-center justify-center text-sm hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-accent"
          aria-label="Acercar"
        >
          +
        </button>
        <button
          onClick={() => setTransform((p) => ({ ...p, scale: Math.max(0.3, p.scale * 0.8) }))}
          className="w-8 h-8 bg-background/80 backdrop-blur-sm rounded flex items-center justify-center text-sm hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-accent"
          aria-label="Alejar"
        >
          −
        </button>
        <button
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          className="w-8 h-8 bg-background/80 backdrop-blur-sm rounded flex items-center justify-center text-xs hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-accent"
          aria-label="Restablecer vista"
        >
          ⟲
        </button>
      </div>
    </div>
  );
};

export const SynergyGraph = memo(SynergyGraphComponent);
