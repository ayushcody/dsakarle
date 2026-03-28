'use client';

import { motion } from 'framer-motion';

type TreeNode = {
  id: string
  value: string | number
  x: number
  y: number
  visited?: boolean
  active?: boolean
}

interface TreeDiagramProps {
  diagramState: Record<string, unknown>
}

function asPrimitiveArray(value: unknown): Array<string | number | null> {
  if (!Array.isArray(value)) {
    return [8, 4, 12, 2, 6, 10, 14];
  }

  return value.map((item) => {
    if (item === null || typeof item === 'string' || typeof item === 'number') {
      return item;
    }

    return null;
  });
}

function asNumberArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number') : [];
}

function layoutTree(values: Array<string | number | null>) {
  const nodes: TreeNode[] = [];
  const edges: Array<{ from: string; to: string }> = [];
  const levelCount = Math.max(1, Math.ceil(Math.log2(values.length + 1)));
  const width = 680;

  values.forEach((value, index) => {
    if (value === null || value === undefined) {
      return;
    }

    const level = Math.floor(Math.log2(index + 1));
    const positionInLevel = index - (2 ** level - 1);
    const slots = 2 ** level;
    const x = ((positionInLevel + 0.5) / slots) * width;
    const y = 74 + level * 82;

    nodes.push({
      id: `node-${index}`,
      value,
      x,
      y,
    });

    const left = index * 2 + 1;
    const right = index * 2 + 2;

    if (values[left] !== null && values[left] !== undefined) {
      edges.push({ from: `node-${index}`, to: `node-${left}` });
    }

    if (values[right] !== null && values[right] !== undefined) {
      edges.push({ from: `node-${index}`, to: `node-${right}` });
    }
  });

  return { nodes, edges, height: 110 + levelCount * 82 };
}

export default function TreeDiagram({ diagramState }: TreeDiagramProps) {
  const values = asPrimitiveArray(diagramState.values ?? diagramState.levelOrder);
  const visited = new Set(asNumberArray(diagramState.visited));
  const frontier = new Set(asNumberArray(diagramState.frontier));
  const active = typeof diagramState.current === 'number' ? diagramState.current : undefined;
  const stack = Array.isArray(diagramState.stack)
    ? diagramState.stack.filter((item): item is string | number => typeof item === 'string' || typeof item === 'number')
    : [];
  const { nodes, edges, height } = layoutTree(values);

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="grid gap-4 lg:grid-cols-[1fr_200px]">
        <svg viewBox={`0 0 680 ${height}`} width="100%">
          <rect x="0" y="0" width="680" height={height} rx="16" fill="var(--bg-secondary)" />

          {edges.map((edge) => {
            const fromNode = nodes.find((node) => node.id === edge.from);
            const toNode = nodes.find((node) => node.id === edge.to);

            if (!fromNode || !toNode) {
              return null;
            }

            return (
              <motion.line
                key={`${edge.from}-${edge.to}`}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={active !== undefined && (edge.to === `node-${active}` || edge.from === `node-${active}`) ? '#CA8A04' : '#C8B9A5'}
                strokeWidth={3}
                strokeLinecap="round"
                initial={{ pathLength: 0.6, opacity: 0.6 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.35 }}
              />
            );
          })}

          {nodes.map((node, index) => {
            const isVisited = visited.has(index);
            const isFrontier = frontier.has(index);
            const isActive = active === index;

            return (
              <g key={node.id}>
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={24}
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
                  {node.value}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-primary)] p-4">
          <p className="font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
            Recursion Stack
          </p>
          <div className="mt-3 space-y-2">
            {stack.length > 0 ? (
              stack.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 py-2 font-dmmono text-sm text-[var(--text-primary)]"
                >
                  {item}
                </div>
              ))
            ) : (
              <p className="font-dmsans text-sm text-[var(--text-secondary)]">
                Add `stack` data to the diagram state to visualize recursive calls or DFS order.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
