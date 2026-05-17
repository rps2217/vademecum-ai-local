import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { dataService } from '../../services/DataService';
import { Product } from '../../core/types/product.types';
import { EventBus, EventType } from '../../services/EventBus';
import { 
  Share2, ZoomIn, ZoomOut, RefreshCw, 
  Sparkles, Info, Maximize2, X, Zap,
  Cloud, CloudOff, Database, Atom 
} from 'lucide-react';
import { cloudSyncService } from '../../services/CloudSyncService';
import { synergyBackgroundService } from '../../services/SynergyBackgroundService';
import { motion, AnimatePresence } from 'motion/react';
import { CYPInteractionGraph } from './CYPInteractionGraph';

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
  const [showCYP, setShowCYP] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
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
    const load = async () => {
      const all = await dataService.getAllProducts();
      setProducts(all);
      const cloudOk = await cloudSyncService.checkCloudData();
      setIsCloudReady(cloudOk);
    };
    load();

    const subStatus = EventBus.on<any>(EventType.SYNERGY_STATUS_CHANGED).subscribe((status) => {
      setProcessingStatus({ 
        isRunning: status.isRunning, 
        sku: status.currentProcessingSku, 
        name: status.currentProcessingName,
        engine: status.currentEngine
      });
      if (!status.currentProcessingSku && !status.currentProcessingName) load();
    });

    // Escuchar actualizaciones globales de la base de datos
    const subDB = EventBus.on<any>(EventType.DB_UPDATED).subscribe(() => load());
    const subProduct = EventBus.on<any>(EventType.PRODUCT_UPDATED).subscribe(() => load());

    return () => {
      subStatus.unsubscribe();
      subDB.unsubscribe();
      subProduct.unsubscribe();
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
    if (showCYP || !svgRef.current) return;

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
        zoomRef.current = zoom;

        simulationRef.current = d3.forceSimulation<Node, Link>()
          .force('link', d3.forceLink<Node, Link>().id(d => d.id).distance(d => d.type === 'synergy' ? 180 : 80))
          .force('charge', d3.forceManyBody().strength(-300))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('collision', d3.forceCollide().radius(70));
    }

    const simulation = simulationRef.current;
    if (!gRef.current) return;
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
      .attr('stroke', d => d.type === 'synergy' ? '#d9770644' : '#8b5cf622') // amber / violet
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
                .attr('fill', d => d.type === 'product' ? (d.category === 'Medicamento' ? '#d9770622' : '#05966922') : '#8b5cf611')
                .attr('filter', 'url(#glow)');

            // Círculo principal
            nodeEnter.append('circle')
                .attr('class', 'main-circle')
                .attr('r', d => d.type === 'product' ? 10 : 5)
                .attr('fill', d => {
                  if (d.type === 'principle') return '#8b5cf6'; // violet
                  return d.category === 'Medicamento' ? '#d97706' : '#059669'; // amber / emerald
                })
                .attr('stroke', '#ffffff')
                .attr('stroke-width', 2);

            // Icono de Sparkle si está analizado
            nodeEnter.filter(d => !!d.analyzed)
              .append('circle')
              .attr('class', 'analyzed-icon')
              .attr('r', 3)
              .attr('cx', 8)
              .attr('cy', -8)
              .attr('fill', '#f59e0b')
              .attr('stroke', '#ffffff')
              .attr('stroke-width', 1);

            nodeEnter.append('text')
                .text(d => d.name)
                .attr('x', d => d.type === 'product' ? 16 : 10)
                .attr('y', 4)
                .attr('fill', d => d.type === 'product' ? 'var(--foreground)' : 'var(--muted-foreground)')
                .style('font-family', 'var(--font-mono)')
                .style('font-size', d => d.type === 'product' ? '11px' : '9px')
                .style('font-weight', d => d.type === 'product' ? '800' : '500')
                .style('pointer-events', 'none')
                .style('text-shadow', '0 1px 2px rgba(255,255,255,0.8)');

            return nodeEnter;
        },
        update => {
          update.select('.main-circle')
            .attr('fill', (d: any) => {
              if (d.type === 'principle') return '#8b5cf6';
              return d.category === 'Medicamento' ? '#d97706' : '#059669';
            });
          
          update.selectAll('.analyzed-icon').remove();
          update.filter(d => !!d.analyzed)
            .append('circle')
            .attr('class', 'analyzed-icon')
            .attr('r', 3)
            .attr('cx', 8)
            .attr('cy', -8)
            .attr('fill', '#f59e0b')
            .attr('stroke', '#ffffff')
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
  }, [graphData, showCYP]);

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
    <div className="w-full h-full flex flex-col p-4 bg-background">
      {/* Header del Grafo */}
      <div className="flex justify-between items-center mb-6 py-4 border-b border-border">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Mapa de Venta Cruzada
          </h2>
          <p className="text-sm text-muted-foreground">
            IA clínica orientada a facilitar recomendaciones farmacéuticas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowCYP(!showCYP)}
            className="px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
          >
            {showCYP ? 'Ocultar CYP450' : 'Ver CYP450'}
          </button>

          <button 
            onClick={handleSmartSync}
            disabled={isSyncing || processingStatus.isRunning}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSyncing ? 'Sincronizando...' : 'Gestionar Relaciones'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Canvas del Grafo */}
        <div className="flex-1 bg-card rounded-lg border border-border relative overflow-hidden">
          {showCYP ? (
            <CYPInteractionGraph />
          ) : (
            <svg ref={svgRef} className="w-full h-full cursor-move" />
          )}

          {/* Controles de Vista */}
          {!showCYP && (
            <div className="absolute bottom-4 left-4 flex flex-col gap-2">
              <button 
                onClick={() => zoomRef.current && d3.select(svgRef.current as any).transition().call(zoomRef.current.scaleBy, 1.2)}
                className="p-2 bg-background rounded border border-border text-foreground hover:bg-accent transition-all shadow-sm"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button 
                onClick={() => zoomRef.current && d3.select(svgRef.current as any).transition().call(zoomRef.current.scaleBy, 0.8)}
                className="p-2 bg-background rounded border border-border text-foreground hover:bg-accent transition-all shadow-sm"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {!showCYP && (
            <div className="absolute top-4 right-4 p-3 bg-background rounded border border-border text-xs space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">Medicamento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Natural / Suplemento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">Principio Activo</span>
              </div>
            </div>
          )}
        </div>

        {/* Panel de Detalles */}
        <AnimatePresence>
          {selectedData && !showCYP && (
            <motion.div 
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 200, opacity: 0 }}
              className="w-80 bg-card border border-border rounded-lg flex flex-col shadow-lg"
            >
              <div className="p-4 border-b border-border flex justify-between items-center">
                <h3 className="font-semibold text-foreground truncate pr-2">
                  {selectedElement?.type === 'product' 
                    ? (selectedData as Product).nombre_comercial 
                    : (selectedData as any).name}
                </h3>
                <button 
                  onClick={() => setSelectedElement(null)}
                  className="p-1 hover:bg-accent rounded text-muted-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedElement?.type === 'product' ? (
                  <>
                    <div className="bg-accent/30 p-3 rounded text-sm text-muted-foreground italic">
                      {(selectedData as Product).sugerencia_complementaria || 'Análisis pendiente...'}
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-foreground mb-2">Conexiones Activas</h4>
                      <div className="space-y-1">
                        {(selectedData as Product).skus_relacionados?.length > 0 ? (selectedData as Product).skus_relacionados.map(sku => {
                          const rel = products.find(p => p.sku === sku);
                          return rel ? (
                            <div key={sku} className="p-2 border rounded text-xs flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {rel.nombre_comercial}
                            </div>
                          ) : null;
                        }) : (
                          <p className="text-xs text-muted-foreground italic">Sin conexiones.</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <h4 className="text-xs font-semibold text-foreground mb-2">Productos relacionados</h4>
                    <div className="space-y-1">
                      {(selectedData as any).relatedProducts?.map((p: Product) => (
                        <div key={p.sku} className="p-2 border rounded text-xs flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {p.nombre_comercial}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
