import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { UserBet, Scenario } from '../../types';
import { GlassCard } from '../ui/GlassComponents';

interface OrbVizProps {
  bets: UserBet[];
  scenarios: Scenario[];
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  r: number;
  color: string;
  title: string;
  value: number;
}

export const OrbViz: React.FC<OrbVizProps> = ({ bets, scenarios }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || bets.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = 400;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    // Prepare data
    const nodes: Node[] = bets.map(bet => {
      const scenario = scenarios.find(s => s.id === bet.scenarioId);
      return {
        id: bet.id,
        r: Math.sqrt(bet.amount) * 3 + 20, // Size based on bet amount
        color: bet.position === 'YES' ? '#4CC9F0' : '#F72585',
        title: scenario?.title || 'Unknown',
        value: bet.currentValue,
        x: width / 2,
        y: height / 2,
      };
    });

    // Simulation
    const simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(5))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d: any) => d.r + 5));

    // Drag behavior
    const drag = (simulation: d3.Simulation<Node, undefined>) => {
      function dragstarted(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      
      function dragged(event: any, d: any) {
        d.fx = event.x;
        d.fy = event.y;
      }
      
      function dragended(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
      
      return d3.drag<SVGGElement, Node>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
    }

    // Render nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(drag(simulation));

    // Outer Glow
    const defs = svg.append("defs");
    const filter = defs.append("filter")
      .attr("id", "glow");
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "2.5")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Circle
    node.append("circle")
      .attr("r", d => d.r)
      .attr("fill", d => d.color)
      .attr("fill-opacity", 0.6)
      .attr("stroke", d => d.color)
      .attr("stroke-width", 2)
      .style("filter", "url(#glow)")
      .style("cursor", "pointer");

    // Text (Amount)
    node.append("text")
      .text(d => `$${Math.round(d.value)}`)
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("fill", "white")
      .attr("font-family", "JetBrains Mono")
      .attr("font-size", d => Math.min(d.r / 2, 14))
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [bets, scenarios]);

  if (bets.length === 0) {
    return (
      <GlassCard className="h-[400px] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 mb-4 animate-spin-slow"></div>
        <p className="text-white/50">Your Prediction Universe is empty.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4" ref={containerRef}>
      <h3 className="text-lg font-display font-bold mb-4 text-white/80">Prediction Universe</h3>
      <svg ref={svgRef} width="100%" height="400" className="overflow-visible" />
      <div className="flex justify-center gap-6 mt-2 text-xs text-white/50">
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-secondary mr-2"></span> YES Position</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-accent mr-2"></span> NO Position</div>
      </div>
    </GlassCard>
  );
};
