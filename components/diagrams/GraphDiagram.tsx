'use client';

import { motion } from 'framer-motion';

type GraphNode = {
  id: string
  label: string
  x: number
  y: number
}

interface GraphDiagramProps {
  diagramState: Record<string, unknown>
}

function parseNodes(value: unknown): GraphNode[] {
  if (!Array.isArray(value)) {
    return [
      { id: 'a', label: 'A', x: 120, y: 120 },
      { id: 'b', label: 'B', x: 280, y: 72 },
      { id: 'c', label: 'C', x: 460, y: 128 },
      { id: 'd', label: 'D', x: 210, y: 248 },
      { id: 'e', label: 'E', x: 400, y: 252 },
    ];
  }

  return value.flatMap((item, index) => {
    if (typeof item !== 'object' || !item) {
      return [];
    }

    const node = item as { id?: unknown; label?: unknown; x?: unknown; y?: unknown };
    if (
      typeof node.id !== 'string' ||
      (typeof node.label !== 'string' && typeof node.label !== 'number') ||
      typeof node.x !== 'number' ||
      typeof node.y !== 'number'
    ) {
      return [];
    }

    return [{
      id: node.id || `node-${index}`,
      label: String(node.label),
      x: node.x,
      y: node.y,
    }];
  });
}

function parseEdges(value: unknown, nodes: GraphNode[]) {
  if (!Array.isArray(value)) {
    return [
      ['a', 'b'],
      ['a', 'd'],
      ['b', 'c'],
      ['b', 'd'],
      ['c', 'e'],
      ['d', 'e'],
    ] as Array<[string, string]>;
  }

  return value.flatMap((item) => {
    if (Array.isArray(item) && item.length === 2 && typeof item[0] === 'string' && typeof item[1] === 'string') {
      return [[item[0], item[1]] as [string, string]];
    }

    return [];
  }).filter(([from, to]) => nodes.some((node) => node.id === from) && nodes.some((node) => node.id === to));
}

function parseStringSet(value: unknown) {
  return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []);
}

export default function GraphDiagram({ diagramState }: GraphDiagramProps) {
  const nodes = parseNodes(diagramState.nodes);
  const edges = parseEdges(diagramState.edges, nodes);
  const visited = parseStringSet(diagramState.visited);
  const frontier = parseStringSet(diagramState.frontier);
  const activeNode = typeof diagramState.current === 'string' ? diagramState.current : undefined;
  const activeEdge = Array.isArray(diagramState.activeEdge) &&
    diagramState.activeEdge.length === 2 &&
    typeof diagramState.activeEdge[0] === 'string' &&
    typeof diagramState.activeEdge[1] === 'string'
    ? [diagramState.activeEdge[0], diagramState.activeEdge[1]] as const
    : undefined;

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)]">
      <svg viewBox="0 0 560 320" width="100%">
        <rect x="0" y="0" width="560" height="320" rx="16" fill="var(--bg-secondary)" />

        {edges.map(([from, to]) => {
          const start = nodes.find((node) => node.id === from);
          const end = nodes.find((node) => node.id === to);
          const isActiveEdge =
            activeEdge &&
            ((activeEdge[0] === from && activeEdge[1] === to) || (activeEdge[0] === to && activeEdge[1] === from));

          if (!start || !end) {
            return null;
          }

          return (
            <motion.line
              key={`${from}-${to}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={isActiveEdge ? '#CA8A04' : '#C8B9A5'}
              strokeWidth={isActiveEdge ? 4 : 3}
              strokeLinecap="round"
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            />
          );
        })}

        {nodes.map((node) => {
          const isVisited = visited.has(node.id);
          const isFrontier = frontier.has(node.id);
          const isActive = activeNode === node.id;

          return (
            <g key={node.id}>
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={28}
                fill={
                  isActive
                    ? '#D4603A'
                    : isVisited
                      ? 'rgba(29,122,107,0.15)'
                      : isFrontier
                        ? 'rgba(202,138,4,0.18)'
                        : 'white'
                }
                stroke={isActive ? '#D4603A' : isVisited ? '#1D7A6B' : isFrontier ? '#CA8A04' : '#B58A52'}
                strokeWidth={2.5}
              />
              <text
                x={node.x}
                y={node.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="var(--font-dmmono)"
                fontSize={16}
                fontWeight={600}
                fill={isActive ? 'white' : 'var(--text-primary)'}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
