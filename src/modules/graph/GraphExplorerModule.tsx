import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { DataService } from '../../services/DataService';
import { Product } from '../../core/types/product.types';
import { 
  Share2, ZoomIn, ZoomOut, RefreshCw, 
  Sparkles, Info, Maximize2, X, Zap 
} from 'lucide-react';
import { SynergyBackgroundService } from '../../services/SynergyBackgroundService';
import { motion, AnimatePresence } from 'motion/react';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  category?: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string;
  target: string;
}

export const GraphExplorerModule: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<{sku: string | null, name: string | null}>({sku: null, name: null});

  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  useEffect(() => {
    const load = async () => {
      const all = await DataService.getAllProducts();
      setProducts(all);
    };
    load();

    const sub = SynergyBackgroundService.subscribe((sku, name) => {
      setProcessingStatus({ sku, name });
      if (!sku && !name) load(); 
    });

    // Escuchar actualizaciones globales de la base de datos
    const handleDBUpdate = () => load();
    window.addEventListener('db_updated', handleDBUpdate);

    return () => {
      sub();
      window.removeEventListener('db_updated', handleDBUpdate);
    };
  }, []);

  const graphData = useMemo(() => {
    const nodes: Node[] = products.map(p => ({
      id: p.sku,
      name: p.nombre_comercial,
      category: p.categoria_principal
    }));

    const links: Link[] = [];
    products.forEach(p => {
      if (p.skus_relacionados) {
        p.skus_relacionados.forEach(targetSku => {
          if (products.find(prod => prod.sku === targetSku)) {
            links.push({ source: p.sku, target: targetSku });
          }
        });
      }
    });

    return { nodes, links };
  }, [products]);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const svg = d3.select(svgRef.current);

    if (!simulationRef.current) {
        // Inicialización ÚNICA
        const g = svg.append('g');
        gRef.current = g;

        const zoom = d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
          g.attr('transform', event.transform);
        });

        svg.call(zoom);

        simulationRef.current = d3.forceSimulation<Node, Link>()
          .force('link', d3.forceLink<Node, Link>().id(d => d.id).distance(120))
          .force('charge', d3.forceManyBody().strength(-400))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('collision', d3.forceCollide().radius(60));
    }

    const simulation = simulationRef.current;
    const g = gRef.current!;

    // Mantener posiciones si los nodos ya existían
    const oldNodes = new Map(simulation.nodes().map(d => [d.id, d]));
    const newNodes = graphData.nodes.map(d => {
        const old = oldNodes.get(d.id);
        if (old) {
            d.x = old.x;
            d.y = old.y;
            d.vx = old.vx;
            d.vy = old.vy;
        }
        return d;
    });

    simulation.nodes(newNodes);
    (simulation.force('link') as d3.ForceLink<Node, Link>).links(graphData.links);

    // Renderizado incremental de enlaces
    const link = g.selectAll<SVGLineElement, Link>('line')
      .data(graphData.links, (d: any) => `${d.source}-${d.target}`)
      .join('line')
      .attr('stroke', '#ff9c4b22')
      .attr('stroke-width', 1.5);

    // Renderizado incremental de nodos
    const node = g.selectAll<SVGGElement, Node>('g.node')
      .data(newNodes, d => d.id)
      .join(
        enter => {
            const nodeEnter = enter.append('g').attr('class', 'node');
            
            nodeEnter.append('circle')
                .attr('r', 10)
                .attr('fill', d => d.category === 'Medicamento' ? '#ff9c4b' : '#10b981')
                .attr('stroke', '#151c28')
                .attr('stroke-width', 2);

            nodeEnter.append('text')
                .text(d => d.name)
                .attr('x', 14)
                .attr('y', 4)
                .attr('fill', '#94a3b8')
                .style('font-size', '10px')
                .style('font-weight', 'bold')
                .style('pointer-events', 'none');

            return nodeEnter;
        }
      )
      .on('click', (event, d) => {
        const product = products.find(p => p.sku === d.id);
        if (product) setSelectedProduct(product);
      })
      .call(d3.drag<any, Node>()
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
        }));

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    simulation.alpha(0.3).restart();

    return () => {
       // simulation.stop(); // No detenemos en cada update para mantener fluidez
    };
  }, [graphData]);

  const handleSmartSync = async () => {
    setIsSyncing(true);
    // Simulate finding products without analysis
    const pending = products.filter(p => !p.synergy_analyzed);
    if (pending.length > 0) {
      for (const product of pending) {
        await SynergyBackgroundService.forceAnalyze(product);
      }
    }
    setIsSyncing(false);
  };

  return (
    <div className="w-full h-[calc(100vh-200px)] min-h-[600px] flex flex-col animate-in fade-in duration-500">
      {/* Header del Grafo */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <Share2 className="w-7 h-7 text-brand-primary" />
            Mapa de Sinergias Inteligente
          </h2>
          <p className="text-slate-400 text-sm mt-1">Exploración visual de relaciones biológicas y terapéuticas auto-gestionadas.</p>
        </div>

        <div className="flex items-center gap-3">
          {processingStatus.sku && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-[10px] font-bold text-brand-primary animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              IA Analizando: {processingStatus.name}
            </div>
          )}
          <button 
            onClick={handleSmartSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-brand-surface border border-slate-700 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-sm shadow-lg disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 text-brand-primary ${isSyncing ? 'animate-spin' : ''}`} />
            Autogestionar Relaciones
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Canvas del Grafo */}
        <div className="flex-1 bg-brand-surface rounded-[2rem] border border-slate-700/50 relative overflow-hidden shadow-2xl">
          <svg ref={svgRef} className="w-full h-full cursor-move" />
          
          {/* Controles de Vista */}
          <div className="absolute bottom-6 left-6 flex flex-col gap-2">
            <button className="p-3 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700 text-slate-400 hover:text-white transition-all shadow-xl">
              <ZoomIn className="w-5 h-5" />
            </button>
            <button className="p-3 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700 text-slate-400 hover:text-white transition-all shadow-xl">
              <ZoomOut className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute top-6 right-6 p-4 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 text-[10px] space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-primary" />
              <span className="text-slate-400">Medicamentos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Naturales / Suplementos</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800">
               <span className="text-slate-600 italic">Haz clic en un nodo para ver detalles</span>
            </div>
          </div>
        </div>

        {/* Panel de Detalles con AnimatePresence */}
        <AnimatePresence>
          {selectedProduct && (
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-80 bg-brand-surface border border-slate-700 rounded-[2rem] flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-white truncate pr-4">{selectedProduct.nombre_comercial}</h3>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-brand-primary" /> Sugerencia de Sinergia
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed bg-brand-primary/5 p-4 rounded-2xl border border-brand-primary/10 italic">
                    {selectedProduct.sugerencia_complementaria || 'Análisis pendiente...'}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Conexiones Activas</h4>
                  <div className="space-y-2">
                    {selectedProduct.skus_relacionados.length > 0 ? selectedProduct.skus_relacionados.map(sku => {
                      const rel = products.find(p => p.sku === sku);
                      return rel ? (
                        <div key={sku} className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                          <span className="text-xs font-bold text-slate-300">{rel.nombre_comercial}</span>
                        </div>
                      ) : null;
                    }) : (
                      <p className="text-xs text-slate-600 italic">No hay conexiones detectadas aún.</p>
                    )}
                  </div>
                </div>

                <div className="bg-brand-bg p-4 rounded-2xl border border-slate-800 border-dashed">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">Sistema Autónomo</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    El sistema detecta automáticamente afinidades moleculares y terapéuticas para sugerir combinaciones sinérgicas seguras.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
