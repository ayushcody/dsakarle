'use client';

import { motion } from 'framer-motion';

type LinkedListNode = {
  id: string
  value: string | number
}

interface LinkedListDiagramProps {
  diagramState: Record<string, unknown>
}

function asNodeArray(value: unknown): LinkedListNode[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => {
    if (typeof item === 'object' && item && 'value' in item) {
      const node = item as { id?: unknown; value: unknown };
      return {
        id: typeof node.id === 'string' ? node.id : `node-${index}`,
        value:
          typeof node.value === 'string' || typeof node.value === 'number'
            ? node.value
            : String(node.value),
      };
    }

    return {
      id: `node-${index}`,
      value: typeof item === 'string' || typeof item === 'number' ? item : String(item),
    };
  });
}

function asNumber(value: unknown) {
  return typeof value === 'number' ? value : undefined;
}

export default function LinkedListDiagram({ diagramState }: LinkedListDiagramProps) {
  const nodes = asNodeArray(diagramState.nodes ?? diagramState.values ?? [10, 20, 30, 40]);
  const slow = asNumber(diagramState.slow);
  const fast = asNumber(diagramState.fast);
  const current = asNumber(diagramState.current ?? diagramState.highlighted);
  const cycleTo = asNumber(diagramState.cycleTo);
  const reversing = Boolean(diagramState.reversing);

  const nodeWidth = 84;
  const nodeHeight = 52;
  const gap = 38;
  const width = Math.max(nodes.length * (nodeWidth + gap) + 60, 640);
  const centerOffset = (width - (nodes.length * nodeWidth + (nodes.length - 1) * gap)) / 2;

  return (
    <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)]">
      <svg viewBox={`0 0 ${width} 190`} width="100%" className="min-w-[620px]">
        <rect x="0" y="0" width={width} height="190" rx="16" fill="var(--bg-secondary)" />

        {nodes.map((node, index) => {
          const x = centerOffset + index * (nodeWidth + gap);
          const y = 70;
          const nextX = x + nodeWidth + gap;
          const isCurrent = current === index;
          const isSlow = slow === index;
          const isFast = fast === index;

          return (
            <g key={node.id}>
              <motion.rect
                x={x}
                y={y}
                width={nodeWidth}
                height={nodeHeight}
                rx={nodeHeight / 2}
                fill={isCurrent ? 'rgba(202,138,4,0.18)' : 'white'}
                stroke={isCurrent ? '#CA8A04' : '#E5E0D8'}
                strokeWidth={isCurrent ? 2 : 1.5}
                animate={{ y }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              />
              <text
                x={x + nodeWidth / 2}
                y={y + nodeHeight / 2 + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="var(--font-dmmono)"
                fontSize={18}
                fontWeight={500}
                fill="var(--text-primary)"
              >
                {node.value}
              </text>

              {index < nodes.length - 1 && (
                <g>
                  <motion.line
                    x1={x + nodeWidth}
                    y1={y + nodeHeight / 2}
                    x2={nextX - 12}
                    y2={y + nodeHeight / 2}
                    stroke={reversing ? '#D4603A' : '#B58A52'}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                  <polygon
                    points={`${nextX - 12},${y + nodeHeight / 2 - 6} ${nextX},${y + nodeHeight / 2} ${nextX - 12},${y + nodeHeight / 2 + 6}`}
                    fill={reversing ? '#D4603A' : '#B58A52'}
                  />
                </g>
              )}

              {isSlow && (
                <g>
                  <text
                    x={x + nodeWidth / 2}
                    y={40}
                    textAnchor="middle"
                    fontFamily="var(--font-dmmono)"
                    fontSize={12}
                    fontWeight={600}
                    fill="#1D7A6B"
                  >
                    slow
                  </text>
                  <polygon
                    points={`${x + nodeWidth / 2},48 ${x + nodeWidth / 2 - 8},60 ${x + nodeWidth / 2 + 8},60`}
                    fill="#1D7A6B"
                  />
                </g>
              )}

              {isFast && (
                <g>
                  <text
                    x={x + nodeWidth / 2}
                    y={24}
                    textAnchor="middle"
                    fontFamily="var(--font-dmmono)"
                    fontSize={12}
                    fontWeight={600}
                    fill="#D4603A"
                  >
                    fast
                  </text>
                  <polygon
                    points={`${x + nodeWidth / 2},32 ${x + nodeWidth / 2 - 8},44 ${x + nodeWidth / 2 + 8},44`}
                    fill="#D4603A"
                  />
                </g>
              )}
            </g>
          );
        })}

        {cycleTo !== undefined && cycleTo >= 0 && cycleTo < nodes.length && nodes.length > 1 && (
          <path
            d={`M ${centerOffset + (nodes.length - 1) * (nodeWidth + gap) + nodeWidth / 2} 134
                C ${width - 30} 180, 40 180, ${centerOffset + cycleTo * (nodeWidth + gap) + nodeWidth / 2} 134`}
            fill="none"
            stroke="#D4603A"
            strokeWidth={3}
            strokeDasharray="8 8"
          />
        )}
      </svg>
    </div>
  );
}
