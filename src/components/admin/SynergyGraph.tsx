/**
 * SynergyGraph - Visualización de Red de Sinergias
 * 
 * Visualización interactiva de la red de relaciones
 * entre ingredientes usando SVG.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { knowledgeLoader } from '../../core/knowledge-base';
import { cn } from '../../lib/utils';
import { ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';

interface Node {
  id: string;
  name: string;
  category: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
  fy?: number;
}

interface Link {
  source: string;
  target: string;
  type: string;
  evidence: string;
}

const categoryColors: Record<string, string> = {
  fitoterapia: '#10b981',
  homeopatia: '#8b5cf6',
  aceite_esencial: '#f59e0b',
  vitaminas: '#3b82f6',
  minerales: '#64748b',
  aminoacidos: '#2563eb',
  probioticos: '#0d9488',
  prebioticos: '#22c55e',
  enzimas: '#ea580c',
};

const typeColors: Record<string, string> = {
  potenciador: '#10b981',
  complementario: '#3b82f6',
  cofactor: '#8b5cf6',
  bioactivador: '#f59e0b',
  secuencial: '#06b6d4',
};

export default function SynergyGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredLink, setHoveredLink] = useState<Link | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  useEffect(() => {
    initGraph();
  }, []);

  const initGraph = () => {
    const ingredients = knowledgeLoader.getAll();
    const synergies = knowledgeLoader.getAllSynergies();

    // Crear nodos
    const nodeMap = new Map<string, Node>();
    const width = 800;
    const height = 600;
    
    ingredients.slice(0, 30).forEach((ing: any, i) => {
      const angle = (2 * Math.PI * i) / Math.min(ingredients.length, 30);
      const radius = 200;
      nodeMap.set(ing.id, {
        id: ing.id,
        name: ing.nombre,
        category: ing.categoria,
        x: width / 2 + radius * Math.cos(angle) + (Math.random() - 0.5) * 50,
        y: height / 2 + radius * Math.sin(angle) + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
      });
    });

    // Crear enlaces
    const nodeLinks: Link[] = synergies
      .filter((s: any) => nodeMap.has(s.ingredienteA) && nodeMap.has(s.ingredienteB))
      .map((s: any) => ({
        source: s.ingredienteA,
        target: s.ingredienteB,
        type: s.tipo,
        evidence: s.nivelEvidencia || 'C',
      }));

    setNodes(Array.from(nodeMap.values()));
    setLinks(nodeLinks);

    // Iniciar simulación
    simulate();
  };

  const simulate = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    let iteration = 0;
    const maxIterations = 300;

    const tick = () => {
      if (iteration >= maxIterations) {
        setNodes([...nodes]);
        return;
      }

      // Física simple
      const alpha = 0.1;
      
      // Fuerzas
      nodes.forEach(node => {
        // Fuerza de centrífuga
        const dx = node.x - 400;
        const dy = node.y - 300;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        node.vx -= (dx / dist) * 0.01 * alpha;
        node.vy -= (dy / dist) * 0.01 * alpha;

        // Repulsión entre nodos
        nodes.forEach(other => {
          if (node.id === other.id) return;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 150) {
            node.vx += (dx / dist) * 0.05 * alpha;
            node.vy += (dy / dist) * 0.05 * alpha;
          }
        });
      });

      // Atracción por enlaces
      links.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);
        if (!source || !target) return;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        source.vx += (dx / dist) * 0.02 * alpha;
        source.vy += (dy / dist) * 0.02 * alpha;
        target.vx -= (dx / dist) * 0.02 * alpha;
        target.vy -= (dy / dist) * 0.02 * alpha;
      });

      // Aplicar velocidad con damping
      nodes.forEach(node => {
        if (node.fx === undefined) {
          node.x += node.vx * 0.5;
          node.y += node.vy * 0.5;
          node.vx *= 0.8;
          node.vy *= 0.8;
          
          // Límites
          node.x = Math.max(50, Math.min(750, node.x));
          node.y = Math.max(50, Math.min(550, node.y));
        }
      });

      setNodes([...nodes]);
      iteration++;
      animationRef.current = requestAnimationFrame(tick);
    };

    tick();
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(2, prev.scale * delta)),
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
  };

  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
    simulate();
  };

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Controls */}
      <div className="p-4 border-b flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {nodes.length} nodos • {links.length} conexiones
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(2, prev.scale * 1.2) }))}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            title="Acercar"
          >
            <ZoomIn className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.5, prev.scale / 1.2) }))}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            title="Alejar"
          >
            <ZoomOut className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={resetView}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            title="Reiniciar vista"
          >
            <RotateCcw className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Graph */}
      <div className="relative">
        <svg
          ref={svgRef}
          width="100%"
          height={500}
          className="cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {/* Links */}
            {links.map((link, i) => {
              const source = nodes.find(n => n.id === link.source);
              const target = nodes.find(n => n.id === link.target);
              if (!source || !target) return null;

              const isHovered = hoveredLink === link;
              const color = typeColors[link.type] || '#94a3b8';

              return (
                <line
                  key={`link-${i}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={color}
                  strokeWidth={isHovered ? 3 : 2}
                  strokeOpacity={isHovered ? 1 : 0.5}
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredLink(link)}
                  onMouseLeave={() => setHoveredLink(null)}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map(node => (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer"
                onClick={() => handleNodeClick(node)}
              >
                <circle
                  r={selectedNode?.id === node.id ? 20 : 16}
                  fill={categoryColors[node.category] || '#94a3b8'}
                  stroke={selectedNode?.id === node.id ? '#fff' : 'transparent'}
                  strokeWidth={3}
                  className="transition-all"
                />
                <text
                  dy={node.y > 400 ? -25 : 35}
                  textAnchor="middle"
                  className="text-xs fill-gray-700 font-medium pointer-events-none select-none"
                  style={{ fontSize: 10 }}
                >
                  {node.name.length > 15 ? node.name.slice(0, 15) + '...' : node.name}
                </text>
              </g>
            ))}
          </g>
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <p className="text-xs font-medium text-gray-600 mb-2">Categorías</p>
          <div className="space-y-1">
            {Object.entries(categoryColors).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-600 capitalize">{cat.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Link Info */}
        {hoveredLink && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: typeColors[hoveredLink.type] }}
              />
              <span className="text-xs font-medium capitalize">{hoveredLink.type}</span>
              <span className="text-xs text-gray-500">• Evidencia {hoveredLink.evidence}</span>
            </div>
            <p className="text-xs text-gray-600">
              {knowledgeLoader.getById(hoveredLink.source)?.nombre} + {knowledgeLoader.getById(hoveredLink.target)?.nombre}
            </p>
          </div>
        )}
      </div>

      {/* Node Detail Panel */}
      {selectedNode && (
        <div className="p-4 border-t bg-slate-50">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">{selectedNode.name}</h4>
              <p className="text-sm text-gray-500 capitalize">{selectedNode.category.replace(/_/g, ' ')}</p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {/* Synergies for this node */}
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Sinergias:</p>
            <div className="flex flex-wrap gap-2">
              {links
                .filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
                .slice(0, 5)
                .map((link, i) => {
                  const partnerId = link.source === selectedNode.id ? link.target : link.source;
                  const partner = nodes.find(n => n.id === partnerId);
                  return partner ? (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-white rounded-full border flex items-center gap-1"
                    >
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: typeColors[link.type] }}
                      />
                      {partner.name}
                    </span>
                  ) : null;
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
