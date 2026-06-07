'use client';

import { motion } from 'framer-motion';

interface BacktrackingDiagramProps {
  diagramState: Record<string, unknown>;
}

export default function BacktrackingDiagram({}: BacktrackingDiagramProps) {
  // Define standard search tree nodes for backtracking
  // States: 'normal', 'active', 'success', 'fail'
  const nodes = [
    { id: 'root', label: 'Root', x: 250, y: 30, state: 'normal' },
    { id: 'l1_a', label: 'A', x: 130, y: 100, state: 'active' },
    { id: 'l1_b', label: 'B', x: 370, y: 100, state: 'normal' },
    { id: 'l2_a1', label: 'A1', x: 70, y: 180, state: 'fail' },
    { id: 'l2_a2', label: 'A2', x: 190, y: 180, state: 'success' },
    { id: 'l2_b1', label: 'B1', x: 310, y: 180, state: 'normal' },
    { id: 'l2_b2', label: 'B2', x: 430, y: 180, state: 'normal' }
  ];

  const edges = [
    { from: 'root', to: 'l1_a', state: 'active' },
    { from: 'root', to: 'l1_b', state: 'normal' },
    { from: 'l1_a', to: 'l2_a1', state: 'fail' },
    { from: 'l1_a', to: 'l2_a2', state: 'active' },
    { from: 'l1_b', to: 'l2_b1', state: 'normal' },
    { from: 'l1_b', to: 'l2_b2', state: 'normal' }
  ];

  const width = 500;
  const height = 240;

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-[var(--radius)] border border-[var(--border)] bg-white shadow-[var(--shadow-card)] overflow-x-auto">
      <div className="w-full max-w-[500px] min-w-[460px]">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" className="overflow-visible">
          {/* Legend */}
          <g transform="translate(10, 10)" className="font-dmsans text-[11px] font-semibold">
            <circle cx="6" cy="6" r="5" fill="var(--surface-amber)" stroke="var(--accent-amber)" strokeWidth="1.5" />
            <text x="18" y="10" fill="var(--text-secondary)">Active Path</text>

            <circle cx="120" cy="6" r="5" fill="var(--surface-success)" stroke="var(--state-success)" strokeWidth="1.5" />
            <text x="132" y="10" fill="var(--text-secondary)">Solution Node</text>

            <circle cx="240" cy="6" r="5" fill="var(--surface-danger)" stroke="var(--state-danger)" strokeWidth="1.5" />
            <text x="252" y="10" fill="var(--text-secondary)">Dead End (Backtrack)</text>
          </g>

          {/* Connection Lines (Edges) */}
          {edges.map((edge, idx) => {
            const fromNode = nodes.find(n => n.id === edge.from)!;
            const toNode = nodes.find(n => n.id === edge.to)!;
            
            let color = 'var(--border-strong)';
            let strokeWidth = '1.5';
            let strokeDash = '0';

            if (edge.state === 'active') {
              color = 'var(--accent-amber)';
              strokeWidth = '2.5';
            } else if (edge.state === 'fail') {
              color = 'var(--state-danger)';
              strokeWidth = '2';
              strokeDash = '4 4';
            }

            return (
              <line
                key={`edge-${idx}`}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDash}
              />
            );
          })}

          {/* Choice Nodes */}
          {nodes.map((node) => {
            let bg = 'white';
            let stroke = 'var(--border-strong)';
            let strokeWidth = '1.5';
            let textColor = 'var(--text-primary)';

            if (node.state === 'active') {
              bg = 'var(--surface-amber)';
              stroke = 'var(--accent-amber)';
              strokeWidth = '2';
              textColor = 'var(--accent-amber)';
            } else if (node.state === 'success') {
              bg = 'var(--surface-success)';
              stroke = 'var(--state-success)';
              strokeWidth = '2';
              textColor = 'var(--state-success)';
            } else if (node.state === 'fail') {
              bg = 'var(--surface-danger)';
              stroke = 'var(--state-danger)';
              strokeWidth = '2';
              textColor = 'var(--state-danger)';
            }

            return (
              <g key={`node-${node.id}`}>
                {/* Outer Node Circle */}
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r="20"
                  fill={bg}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />

                {/* Node Text Label */}
                <text
                  x={node.x}
                  y={node.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="var(--font-dmsans)"
                  fontSize="12"
                  fontWeight="700"
                  fill={textColor}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
