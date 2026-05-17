import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// Mapeo básico representativo de metabolización P450
const CYP_DATA = {
  nodes: [
    { id: 'CYP3A4', name: 'CYP3A4', type: 'enzyme', group: 1 },
    { id: 'CYP2D6', name: 'CYP2D6', type: 'enzyme', group: 1 },
    { id: 'Warfarina', name: 'Warfarina', type: 'drug', group: 2 },
    { id: 'Fluoxetina', name: 'Fluoxetina', type: 'drug', group: 2 },
    { id: 'Ibuprofeno', name: 'Ibuprofeno', type: 'drug', group: 2 },
  ],
  links: [
    { source: 'Warfarina', target: 'CYP3A4', type: 'substrate' },
    { source: 'Fluoxetina', target: 'CYP2D6', type: 'inhibitor' },
    { source: 'Ibuprofeno', target: 'CYP2D6', type: 'substrate' },
  ]
};

export const CYPInteractionGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 600;
    const height = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const simulation = d3.forceSimulation(CYP_DATA.nodes as any)
      .force('link', d3.forceLink(CYP_DATA.links as any).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(CYP_DATA.links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-width', 2);

    const node = svg.append('g')
      .selectAll('circle')
      .data(CYP_DATA.nodes)
      .join('circle')
      .attr('r', 10)
      .attr('fill', (d: any) => d.type === 'enzyme' ? '#6366f1' : '#ff9c4b');

    node.append('title').text((d: any) => d.name);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);
    });

  }, []);

  return (
    <div className="bg-card rounded-3xl p-4 border border-border">
      <h3 className="text-foreground font-bold mb-2">Interacciones CYP450</h3>
      <svg ref={svgRef} width={600} height={400} />
    </div>
  );
};
