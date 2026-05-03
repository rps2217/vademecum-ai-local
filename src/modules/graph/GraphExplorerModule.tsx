import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { dataService } from '../../services/DataService';
import { Product } from '../../core/types/product.types';
import { EventBus, EventType } from '../../services/EventBus';
import { 
  Share2, ZoomIn, ZoomOut, RefreshCw, 
  Sparkles, Info, Maximize2, X, Zap,
  Cloud, CloudOff, Database, CheckCircle2 
} from 'lucide-react';
import { cloudSyncService } from '../../services/CloudSyncService';
import { synergyBackgroundService } from '../../services/SynergyBackgroundService';
import { motion, AnimatePresence } from 'motion/react';
import { productsCollection } from '../../database';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'product' | 'principle';
  category?: string;
  analyzed?: boolean;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string;
  target: string;
  type: 'synergy' | 'component';
}

export const GraphExplorerModule: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedElement, setSelectedElement] = useState<{ type: 'product' | 'principle', id: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudReady, setIsCloudReady] = useState(true);
  const [processingStatus, setProcessingStatus] = useState<{isRunning: boolean, sku: string | null, name: string | null, engine?: string | null}>({
    isRunning: false,
    sku: null,
    name: null,
    engine: null
  });

  const stats = useMemo(() => {
    const total = products.length;
    const analyzed = products.filter(p => p.synergy_analyzed).length;
    return { total, analyzed, pending: total - analyzed };
  }, [products]);

  const selectedData = useMemo(() => {
    if (!selectedElement) return null;
    if (selectedElement.type === 'product') {
      return products.find(p => p.sku === selectedElement.id);
    } else {
      // Es un principio activo, buscar productos que lo contienen
      const name = selectedElement.id.replace('principle-', '');
      const relatedProducts = products.filter(p => p.principios_activos?.includes(name));
      return { name, relatedProducts };
    }
  }, [selectedElement, products]);

  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  useEffect(() => {
    const checkCloud = async () => {
      const cloudOk = await cloudSyncService.checkCloudData();
      setIsCloudReady(cloudOk);
    };
    checkCloud();

    const subStatus = EventBus.on<any>(EventType.SYNERGY_STATUS_CHANGED).subscribe((status) => {
      setProcessingStatus({ 
        isRunning: status.isRunning, 
        sku: status.currentProcessingSku, 
        name: status.currentProcessingName,
        engine: status.currentEngine
      });
    });

    // Escuchar actualizaciones globales de la base de datos de manera reactiva nativa
    const subscription = productsCollection.query().observe().subscribe((records) => {
      const all = records.map(r => r.asJSON());
      setProducts(all);
    });

    return () => {
      subStatus.unsubscribe();
      subscription.unsubscribe();
    };
  }, []);

  const graphData = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    const principlesMap = new Map<string, string>();

    // Añadir Nodos de Productos
    products.forEach(p => {
      nodes.push({
        id: p.sku,
        name: p.nombre_comercial,
        type: 'product',
        category: p.categoria_principal,
        analyzed: !!p.synergy_analyzed
      });

      // Extraer Principios Activos como nodos independientes
      if (Array.isArray(p.principios_activos)) {
        p.principios_activos.forEach(pa => {
          if (!principlesMap.has(pa)) {
            principlesMap.set(pa, pa);
            nodes.push({
              id: `principle-${pa}`,
              name: pa,
              type: 'principle'
            });
          }
          // Enlace Producto -> Principio Activo
          links.push({
            source: p.sku,
            target: `principle-${pa}`,
            type: 'component'
          });
        });
      }

      // Enlaces de Sinergia (relacionados)
      if (p.skus_relacionados) {
        p.skus_relacionados.forEach(targetSku => {
          if (products.find(prod => prod.sku === targetSku)) {
            links.push({ 
              source: p.sku, 
              target: targetSku,
              type: 'synergy'
            });
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

        // Filtro de Glow para estética Bioluminiscente
        const defs = svg.append('defs');
        const filter = defs.append('filter')
          .attr('id', 'glow')
          .attr('x', '-50%')
          .attr('y', '-50%')
          .attr('width', '200%')
          .attr('height', '200%');
        
        filter.append('feGaussianBlur')
          .attr('stdDeviation', '2.5')
          .attr('result', 'blur');
        
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'blur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        const zoom = d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.1, 4])
          .on('zoom', (event) => {
            g.attr('transform', event.transform);
          });

        svg.call(zoom);

        simulationRef.current = d3.forceSimulation<Node, Link>()
          .force('link', d3.forceLink<Node, Link>().id(d => d.id).distance(d => d.type === 'synergy' ? 180 : 80))
          .force('charge', d3.forceManyBody().strength(-300))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('collision', d3.forceCollide().radius(70));
    }

    const simulation = simulationRef.current;
    const g = gRef.current!;

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

    // Enlaces con estilo de hardware
    const link = g.selectAll<SVGLineElement, Link>('line')
      .data(graphData.links, (d: any) => `${d.source.id || d.source}-${d.target.id || d.target}-${d.type}`)
      .join('line')
      .attr('stroke', d => d.type === 'synergy' ? '#ff9c4b44' : '#6366f122')
      .attr('stroke-width', d => d.type === 'synergy' ? 2 : 1)
      .attr('stroke-dasharray', d => d.type === 'synergy' ? '4,4' : 'none');

    // Nodos con estética bioluminiscente / hardware
    const node = g.selectAll<SVGGElement, Node>('g.node')
      .data(newNodes, d => d.id)
      .join(
        enter => {
            const nodeEnter = enter.append('g').attr('class', 'node');
            
            // Halo de brillo
            nodeEnter.append('circle')
                .attr('class', 'glow-halo')
                .attr('r', d => d.type === 'product' ? 14 : 7)
                .attr('fill', d => d.type === 'product' ? (d.category === 'Medicamento' ? '#ff9c4b22' : '#10b98122') : '#6366f111')
                .attr('filter', 'url(#glow)');

            // Círculo principal
            nodeEnter.append('circle')
                .attr('class', 'main-circle')
                .attr('r', d => d.type === 'product' ? 10 : 5)
                .attr('fill', d => {
                  if (d.type === 'principle') return '#6366f1';
                  return d.category === 'Medicamento' ? '#ff9c4b' : '#10b981';
                })
                .attr('stroke', '#151c28')
                .attr('stroke-width', 2);

            // Icono de Sparkle si está analizado
            nodeEnter.filter(d => !!d.analyzed)
              .append('circle')
              .attr('class', 'analyzed-icon')
              .attr('r', 3)
              .attr('cx', 8)
              .attr('cy', -8)
              .attr('fill', '#fbbf24')
              .attr('stroke', '#151c28')
              .attr('stroke-width', 1);

            nodeEnter.append('text')
                .text(d => d.name)
                .attr('x', d => d.type === 'product' ? 16 : 10)
                .attr('y', 4)
                .attr('fill', d => d.type === 'product' ? '#f8fafc' : '#94a3b8')
                .style('font-family', 'var(--font-mono)')
                .style('font-size', d => d.type === 'product' ? '11px' : '9px')
                .style('font-weight', d => d.type === 'product' ? '800' : '400')
                .style('pointer-events', 'none')
                .style('text-shadow', '0 2px 4px rgba(0,0,0,0.5)');

            return nodeEnter;
        },
        update => {
          update.select('.main-circle')
            .attr('fill', (d: any) => {
              if (d.type === 'principle') return '#6366f1';
              return d.category === 'Medicamento' ? '#ff9c4b' : '#10b981';
            });
          
          update.selectAll('.analyzed-icon').remove();
          update.filter(d => !!d.analyzed)
            .append('circle')
            .attr('class', 'analyzed-icon')
            .attr('r', 3)
            .attr('cx', 8)
            .attr('cy', -8)
            .attr('fill', '#fbbf24')
            .attr('stroke', '#151c28')
            .attr('stroke-width', 1);

          return update;
        }
      )
      .on('click', (event, d) => {
        setSelectedElement({ type: d.type, id: d.id });
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
    // Encontrar productos sin análisis
    const pending = products.filter(p => !p.synergy_analyzed);
    if (pending.length > 0) {
      for (const product of pending) {
        await synergyBackgroundService.forceAnalyze(product);
      }
    }
    setIsSyncing(false);
  };

  return (
    <div className="w-full h-[calc(100vh-150px)] min-h-[600px] flex flex-col animate-in fade-in duration-500 p-2">
      {/* Header del Grafo */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-brand-surface p-6 rounded-[2.5rem] border border-slate-700/30 shadow-xl">
        <div className="flex items-center gap-5">
           <div className="p-4 bg-brand-primary/10 rounded-3xl border border-brand-primary/20">
              <Share2 className="w-8 h-8 text-brand-primary" />
           </div>
           <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Mapa de Sinergias <span className="text-brand-primary italic">IA</span>
              </h2>
              <div className="flex items-center gap-4 mt-1">
                 <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 rounded-full border border-slate-800">
                    <Database className="w-3 h-3 text-brand-primary" />
                    <span className="text-[10px] font-bold text-slate-400">{stats.total} Productos</span>
                 </div>
                 <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-900/20 rounded-full border border-amber-900/30">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-500">{stats.analyzed} Analizados</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-1">
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Estado Sync:</span>
                {isCloudReady ? (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 text-[9px] font-black uppercase">
                     <Cloud className="w-2.5 h-2.5" /> Nube Lista
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20 text-[9px] font-black uppercase">
                     <CloudOff className="w-2.5 h-2.5" /> Solo Local
                  </div>
                )}
             </div>
             {processingStatus.sku && (
               <div className="flex items-center gap-2 text-[10px] font-bold text-brand-primary animate-pulse italic">
                 <RefreshCw className="w-3 h-3 animate-spin" />
                 Analizando {processingStatus.name}... 
                 <span className="text-slate-500 font-normal">({processingStatus.engine || 'Iniciando...'})</span>
               </div>
             )}
          </div>
          
          <button 
            onClick={handleSmartSync}
            disabled={isSyncing || processingStatus.isRunning}
            className="group relative flex items-center gap-3 px-6 py-3 bg-brand-primary text-slate-900 rounded-2xl hover:scale-105 active:scale-95 transition-all font-black text-xs uppercase shadow-[0_0_20px_rgba(255,156,75,0.3)] disabled:opacity-50 disabled:scale-100"
          >
            <Sparkles className={`w-4 h-4 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-12'}`} />
            Gestionar Relaciones
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
              <span className="text-slate-400">Medicamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Natural / Suplemento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-slate-400">Principio Activo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-px bg-brand-primary/40 border-t border-dashed border-brand-primary/60" />
              <span className="text-slate-400">Posible Sinergia</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800">
               <span className="text-slate-600 italic">Haz clic en un nodo para ver detalles</span>
            </div>
          </div>
        </div>

        {/* Panel de Detalles con AnimatePresence */}
        <AnimatePresence>
          {selectedData && (
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-80 bg-brand-surface border border-slate-700 rounded-[2rem] flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-white truncate pr-4">
                  {selectedElement?.type === 'product' 
                    ? (selectedData as Product).nombre_comercial 
                    : (selectedData as any).name}
                </h3>
                <button 
                  onClick={() => setSelectedElement(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {selectedElement?.type === 'product' ? (
                  <>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Zap className="w-3 h-3 text-brand-primary" /> Sugerencia de Sinergia
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed bg-brand-primary/5 p-4 rounded-2xl border border-brand-primary/10 italic">
                        {(selectedData as Product).sugerencia_complementaria || 'Análisis pendiente...'}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Conexiones Activas</h4>
                      <div className="space-y-2">
                        {(selectedData as Product).skus_relacionados?.length > 0 ? (selectedData as Product).skus_relacionados.map(sku => {
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
                  </>
                ) : (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Database className="w-3 h-3 text-indigo-400" /> Productos que lo contienen
                    </h4>
                    <div className="space-y-2">
                      {(selectedData as any).relatedProducts?.map((p: Product) => (
                        <div key={p.sku} className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span className="text-xs font-bold text-slate-200">{p.nombre_comercial}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-brand-bg p-4 rounded-2xl border border-slate-800 border-dashed">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">Sistema Clínico</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Exploración de afinidades moleculares. Los nodos de color índigo representan principios activos compartidos.
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
