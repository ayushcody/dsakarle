/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  PATTERN_MAP_DATA,
  NODE_COLORS,
  NODE_RADII,
  type MapNode,
  type MapEdge,
} from '@/lib/patternMapData';

const EDGE_DASH: Record<MapEdge['type'], string> = {
  extends: '0',
  uses: '6,3',
  prerequisite: '2,2',
  related: '10,5',
};

const CATEGORIES = ['linear', 'tree', 'graph', 'dp', 'pattern', 'search'] as const;

export default function PatternMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current)
      .selectAll<SVGGElement, MapNode>('g.pm-node')
      .style('opacity', (d) => (!selectedCategory || d.category === selectedCategory ? 1 : 0.15));
  }, [selectedCategory]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight - 120;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Zoom
    const container = svg.append('g');
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => container.attr('transform', event.transform));
    svg.call(zoom);

    // Deep-copy nodes/edges to avoid D3 mutation across rerenders
    const nodes = PATTERN_MAP_DATA.nodes.map((n) => ({ ...n }));
    const edges = PATTERN_MAP_DATA.edges.map((e) => ({ ...e }));

    const nodeRadius = (d: MapNode) => NODE_RADII[d.difficulty] ?? 28;
    const nodeColor = (d: MapNode) => NODE_COLORS[d.category] ?? '#999';

    // Simulation
    const simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force(
        'link',
        d3
          .forceLink(edges as d3.SimulationLinkDatum<d3.SimulationNodeDatum>[])
          .id((d: any) => d.id)
          .distance(130)
          .strength(0.4)
      )
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => nodeRadius(d) + 20));

    // Edges
    const edgeG = container.append('g');
    const edgeGroups = edgeG.selectAll('g').data(edges).join('g');

    const links = edgeGroups
      .append('line')
      .attr('stroke', '#B4B2A9')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', (d: any) => EDGE_DASH[d.type as MapEdge['type']] || '0')
      .attr('opacity', 0.4);

    const edgeLabels = edgeGroups
      .append('text')
      .attr('fill', '#8A8880')
      .attr('font-size', '9px')
      .attr('text-anchor', 'middle')
      .attr('opacity', 0)
      .text((d: any) => d.label || '');

    // Nodes
    const nodeG = container.append('g');
    const nodeGroups = nodeG
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'pm-node')
      .style('transition', 'opacity 250ms cubic-bezier(0.4,0,0.2,1)')
      .style('cursor', (d) => (d.topicSlug ? 'pointer' : 'default'))
      .call(
        d3
          .drag<SVGGElement, any>()
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
          }) as any
      );

    nodeGroups
      .append('circle')
      .attr('r', (d) => nodeRadius(d))
      .attr('fill', (d) => nodeColor(d))
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2)
      .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))');

    // Label inside for foundational, below for others
    nodeGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => (d.difficulty === 'foundational' ? '0.35em' : `${nodeRadius(d) + 14}px`))
      .attr('font-size', (d) => (d.difficulty === 'foundational' ? '11px' : '10px'))
      .attr('font-weight', '600')
      .attr('fill', (d) => (d.difficulty === 'foundational' ? '#FFFFFF' : '#2C2C2A'))
      .attr('font-family', 'DM Sans, system-ui, sans-serif')
      .text((d) => d.label);

    nodeGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => (d.difficulty === 'foundational' ? '1.6em' : `${nodeRadius(d) + 26}px`))
      .attr('font-size', '8px')
      .attr('fill', (d) => (d.difficulty === 'foundational' ? 'rgba(255,255,255,0.7)' : '#8A8880'))
      .attr('font-family', 'DM Sans, system-ui, sans-serif')
      .text((d) => d.hindiLabel);

    // Hover
    nodeGroups
      .on('mouseenter', (_event, d) => {
        setHoveredNode(d);
        links.attr('opacity', (l: any) =>
          l.source.id === d.id || l.target.id === d.id ? 1 : 0.08
        );
        edgeLabels.attr('opacity', (l: any) =>
          l.source.id === d.id || l.target.id === d.id ? 1 : 0
        );
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
        links.attr('opacity', 0.4);
        edgeLabels.attr('opacity', 0);
      })
      .on('click', (_event, d) => {
        if (d.topicSlug) router.push(`/learn/${d.topicSlug}`);
      });

    // Tick
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      edgeLabels
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);
      nodeGroups.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [router]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: 'var(--bg-primary)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ position: 'absolute', top: 20, left: 24, zIndex: 10 }}>
        <h1
          style={{
            fontFamily: 'var(--font-dmsans tracking-tight)',
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          DSA Pattern Map
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-dmsans)',
            fontSize: 14,
            color: 'var(--text-muted)',
            marginTop: 4,
          }}
        >
          Algorithms ka parivar ped. Drag, zoom, explore.
        </p>
      </div>

      {/* Category filter */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 24,
          zIndex: 10,
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              border: `1px solid ${selectedCategory === cat ? NODE_COLORS[cat] : 'var(--border)'}`,
              background: selectedCategory === cat ? NODE_COLORS[cat] : 'white',
              color: selectedCategory === cat ? 'white' : 'var(--text-secondary)',
              fontFamily: 'var(--font-dmsans)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'capitalize',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* D3 SVG */}
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />

      {/* Hover tooltip */}
      {hoveredNode && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            bottom: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: 'white',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border)',
            padding: '14px 20px',
            maxWidth: 300,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-dmsans)',
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {hoveredNode.label}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-dmsans)',
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 2,
            }}
          >
            {hoveredNode.hindiLabel}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-dmsans)',
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginTop: 8,
              lineHeight: 1.5,
            }}
          >
            {hoveredNode.description}
          </div>
          {hoveredNode.topicSlug && (
            <div
              style={{
                fontFamily: 'var(--font-dmmono)',
                fontSize: 11,
                color: 'var(--accent-coral)',
                fontWeight: 600,
                marginTop: 8,
              }}
            >
              Click to open topic →
            </div>
          )}
        </motion.div>
      )}

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 24,
          zIndex: 10,
          background: 'white',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          padding: 12,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-dmmono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            marginBottom: 6,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Edge types
        </div>
        {(['extends', 'uses', 'prerequisite', 'related'] as const).map((type) => (
          <div
            key={type}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}
          >
            <svg width={24} height={4}>
              <line
                x1={0}
                y1={2}
                x2={24}
                y2={2}
                stroke="#B4B2A9"
                strokeWidth={1.5}
                strokeDasharray={EDGE_DASH[type]}
              />
            </svg>
            <span
              style={{
                fontFamily: 'var(--font-dmsans)',
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              {type}
            </span>
          </div>
        ))}
      </div>

      {/* Zoom hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 24,
          zIndex: 10,
          fontFamily: 'var(--font-dmsans)',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}
      >
        Scroll to zoom · Drag to pan · Click a node to open topic
      </div>
    </div>
  );
}
