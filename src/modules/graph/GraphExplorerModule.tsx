import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Product } from '../../core/types/product.types';
import { DataService } from '../../services/DataService';
import { Loader2, Maximize2, Filter, Info } from 'lucide-react';
import { cosineSimilarity } from '../../utils/math';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'product' | 'ingredient' | 'tag';
  productData?: Product;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'contains' | 'treats' | 'similarity';
  value: number;
}

export const GraphExplorerModule: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showIngredients, setShowIngredients] = useState(true);
  const [showTags, setShowTags] = useState(false);
  const [showSimilarity, setShowSimilarity] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  useEffect(() => {
    DataService.getAllProducts().then(data => {
      setProducts(data);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (isLoading || products.length === 0 || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height]);
    
    svg.selectAll('*').remove();

    // Fondo para hacer zoom/pan
    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Prepare Data
    const nodesMap = new Map<string, GraphNode>();
    const links: GraphLink[] = [];

    // Add Product Nodes
    products.forEach(p => {
      nodesMap.set(p.sku, {
        id: p.sku,
        name: p.nombre_comercial,
        type: 'product',
        productData: p
      });

      // Add Ingredients
      if (showIngredients && Array.isArray(p.principios_activos)) {
        p.principios_activos.forEach(pa => {
          const paName = typeof pa === 'string' ? pa : (pa as any).nombre;
          if (!paName) return;
          const paId = `pa_${paName.toLowerCase().replace(/\s+/g, '_')}`;
          
          if (!nodesMap.has(paId)) {
            nodesMap.set(paId, { id: paId, name: paName, type: 'ingredient' });
          }
          links.push({ source: p.sku, target: paId, type: 'contains', value: 2 });
        });
      }

      // Add Tags/Indications
      if (showTags && Array.isArray(p.tags_ia)) {
        p.tags_ia.slice(0, 3).forEach(tag => { // Limit per product to avoid clutter
          const tagId = `tag_${tag.toLowerCase().replace(/\s+/g, '_')}`;
          if (!nodesMap.has(tagId)) {
            nodesMap.set(tagId, { id: tagId, name: tag, type: 'tag' });
          }
          links.push({ source: p.sku, target: tagId, type: 'treats', value: 1 });
        });
      }
    });

    // Add Product similarities if toggled
    if (showSimilarity) {
      for (let i = 0; i < products.length; i++) {
        for (let j = i + 1; j < products.length; j++) {
          const p1 = products[i];
          const p2 = products[j];
          if (p1.vectores && p2.vectores && p1.vectores.length > 0 && p2.vectores.length > 0) {
            const sim = cosineSimilarity(p1.vectores, p2.vectores);
            if (sim > 0.85) { // High similarity threshold
               links.push({ source: p1.sku, target: p2.sku, type: 'similarity', value: sim * 3 });
            }
          }
        }
      }
    }

    const nodes = Array.from(nodesMap.values());

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(d => {
        if (d.type === 'contains') return 80;
        if (d.type === 'treats') return 120;
        return 150;
      }))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(25));

    simulationRef.current = simulation;

    // Draw Links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => d.type === 'contains' ? 'rgba(74, 222, 128, 0.4)' : d.type === 'treats' ? 'rgba(167, 139, 250, 0.3)' : 'rgba(59, 130, 246, 0.3)')
      .attr('stroke-width', d => d.type === 'similarity' ? d.value : 1.5)
      .attr('stroke-dasharray', d => d.type === 'similarity' ? '4,4' : 'none');

    // Draw Nodes
    const drag = d3.drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(drag as any)
      .on('click', (event, d) => {
        setSelectedNode(d);
        // Highlight logic
        node.style('opacity', n => {
          if (n.id === d.id) return 1;
          const isConnected = links.some(l => {
            const srcId = typeof l.source === 'string' ? l.source : l.source.id;
            const tgtId = typeof l.target === 'string' ? l.target : l.target.id;
            return (srcId === d.id && tgtId === n.id) || (tgtId === d.id && srcId === n.id);
          });
          return isConnected ? 1 : 0.1;
        });
        link.style('opacity', l => {
          const srcId = typeof l.source === 'string' ? l.source : l.source.id;
          const tgtId = typeof l.target === 'string' ? l.target : l.target.id;
          return (srcId === d.id || tgtId === d.id) ? 1 : 0.1;
        });
      });

    // Reset view on double click background
    svg.on('dblclick.zoom', () => {
      node.style('opacity', 1);
      link.style('opacity', 1);
      setSelectedNode(null);
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    });

    // Node Circles
    node.append('circle')
      .attr('r', d => d.type === 'product' ? 14 : d.type === 'ingredient' ? 10 : 8)
      .attr('fill', d => d.type === 'product' ? '#3b82f6' : d.type === 'ingredient' ? '#10b981' : '#8b5cf6')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 2);

    // Node Labels
    node.append('text')
      .attr('dy', d => d.type === 'product' ? 24 : 18)
      .attr('text-anchor', 'middle')
      .attr('fill', '#cbd5e1')
      .attr('font-size', d => d.type === 'product' ? '10px' : '9px')
      .text(d => d.name.length > 20 ? d.name.substring(0, 18) + '...' : d.name)
      .style('pointer-events', 'none');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [products, showIngredients, showTags, showSimilarity, isLoading]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col pt-6 px-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Ecosistema Global</h1>
          <p className="text-slate-400 mt-1">Explora visualmente las relaciones entre medicamentos, principios activos y afecciones.</p>
        </div>
      </div>

      <div className="flex-1 relative bg-slate-950/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex">
        
        {/* Controls Overlay */}
        <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
          <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-lg w-64">
             <div className="flex items-center gap-2 mb-4 text-slate-300 font-medium">
               <Filter className="w-4 h-4 text-indigo-400" />
               Capas del Grafo
             </div>
             
             <label className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
               <input type="checkbox" className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                  checked={showIngredients} onChange={e => setShowIngredients(e.target.checked)} />
               <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                 <span className="text-sm text-slate-300">Principios Activos</span>
               </div>
             </label>

             <label className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
               <input type="checkbox" className="rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
                  checked={showTags} onChange={e => setShowTags(e.target.checked)} />
               <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                 <span className="text-sm text-slate-300">Etiquetas Clínicas</span>
               </div>
             </label>

             <label className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
               <input type="checkbox" className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                  checked={showSimilarity} onChange={e => setShowSimilarity(e.target.checked)} />
               <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 border-t-2 border-dashed border-blue-500" />
                 <span className="text-sm text-slate-300">Sinergia por IA</span>
               </div>
             </label>
             <p className="text-xs text-slate-500 mt-2 italic px-2">Doble clic en el fondo para resetear la vista.</p>
          </div>

          {/* Context Panel for Selection */}
          {selectedNode && (
            <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)] w-64 animate-in slide-in-from-left-4">
              <div className="flex items-start gap-3">
                <div className={`mt-1 flex-shrink-0 w-3 h-3 rounded-full ${
                  selectedNode.type === 'product' ? 'bg-blue-500' : 
                  selectedNode.type === 'ingredient' ? 'bg-emerald-500' : 'bg-purple-500'
                }`} />
                <div>
                  <h3 className="text-white font-medium leading-tight">{selectedNode.name}</h3>
                  <p className="text-xs text-slate-400 capitalize mt-1 mb-3">{
                    selectedNode.type === 'product' ? 'Medicamento' : 
                    selectedNode.type === 'ingredient' ? 'Principio Activo' : 'Clasificación'
                  }</p>
                </div>
              </div>

              {selectedNode.type === 'product' && selectedNode.productData && (
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  {selectedNode.productData.descripcion && (
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase">Descripción</span>
                      <p className="text-sm text-slate-300">{selectedNode.productData.descripcion.substring(0, 100)}...</p>
                    </div>
                  )}
                  {selectedNode.productData.advertencias && (
                    <div className="bg-red-500/10 p-2 rounded text-xs text-red-200 border border-red-500/20">
                      <span className="font-bold text-red-400 block mb-1">Advertencia:</span>
                      {selectedNode.productData.advertencias.substring(0, 80)}...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* The Graph Canvas */}
        <div ref={containerRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing">
          <svg ref={svgRef} className="w-full h-full block" />
        </div>
      </div>
    </div>
  );
};
