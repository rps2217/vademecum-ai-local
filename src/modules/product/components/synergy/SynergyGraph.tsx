import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Product } from '../../../../core/types/product.types';

interface SynergyGraphProps {
  centerProduct: Product;
  relatedProducts: Product[];
  onProductClick?: (product: Product) => void;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  isCenter: boolean;
  product: Product;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string;
  target: string;
  value: number;
}

export const SynergyGraph: React.FC<SynergyGraphProps> = ({ centerProduct, relatedProducts, onProductClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || relatedProducts.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = 400;

    // Limpiar SVG previo
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Preparar datos
    const nodes: Node[] = [
      { id: centerProduct.sku, name: centerProduct.nombre_comercial, isCenter: true, product: centerProduct },
      ...relatedProducts.map(p => ({ id: p.sku, name: p.nombre_comercial, isCenter: false, product: p }))
    ];

    const links: Link[] = relatedProducts.map(p => ({
      source: centerProduct.sku,
      target: p.sku,
      value: 1
    }));

    // Simulación de fuerzas
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Dibujar enlaces
    const link = svg.append("g")
      .attr("stroke", "#3b82f6")
      .attr("stroke-opacity", 0.3)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,4");

    // Contenedor de nodos
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (event, d) => onProductClick?.(d.product))
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    // Círculos de los nodos
    node.append("circle")
      .attr("r", d => d.isCenter ? 24 : 18)
      .attr("fill", d => d.isCenter ? "#3b82f6" : "#1e293b")
      .attr("stroke", d => d.isCenter ? "#60a5fa" : "#334155")
      .attr("stroke-width", 2)
      .attr("class", "transition-all duration-300 hover:scale-110");

    // Etiquetas
    node.append("text")
      .attr("dy", d => d.isCenter ? 40 : 32)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .text(d => d.name.length > 15 ? d.name.substring(0, 12) + "..." : d.name);

    // Iconos o iniciales
    node.append("text")
      .attr("dy", 4)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", d => d.isCenter ? "12px" : "10px")
      .attr("font-weight", "bold")
      .text(d => d.name.substring(0, 2).toUpperCase());

    // Actualizar posiciones
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [centerProduct, relatedProducts, onProductClick]);

  return (
    <div className="w-full h-[400px] bg-card rounded-[2rem] border border-border overflow-hidden relative">
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mapa de Relaciones Clínicas</span>
      </div>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
