'use client';

import { motion } from 'framer-motion';

interface DPDiagramProps {
  diagramState: Record<string, unknown>;
}

export default function DPDiagram({ diagramState }: DPDiagramProps) {
  // Extract grid data or use default Fibonacci memoization state
  const memoTable = Array.isArray(diagramState.memo)
    ? diagramState.memo
    : [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]; // Default fibonacci values

  const activeIndex = typeof diagramState.activeIndex === 'number' ? diagramState.activeIndex : 6;
  const lookupIndices = Array.isArray(diagramState.lookups)
    ? (diagramState.lookups as number[])
    : [activeIndex - 1, activeIndex - 2]; // Standard fibonacci dependencies

  const cellWidth = 56;
  const cellHeight = 56;
  const gap = 8;
  const n = memoTable.length;
  const totalWidth = n * (cellWidth + gap) - gap;
  const width = Math.max(totalWidth + 60, 600);
  const offset = (width - totalWidth) / 2;

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-[var(--radius)] border border-[var(--border)] bg-white shadow-[var(--shadow-card)] overflow-x-auto">
      <div className="w-full min-w-[560px]">
        <svg viewBox={`0 0 ${width} 140`} width="100%" className="overflow-visible">
          {/* Legend */}
          <g transform="translate(10, 10)" className="font-dmsans text-[11px] font-semibold">
            <rect width="12" height="12" fill="var(--surface-amber)" stroke="var(--accent-amber)" rx="3" />
            <text x="18" y="10" fill="var(--text-secondary)">Active Subproblem</text>

            <rect x="140" width="12" height="12" fill="var(--surface-teal)" stroke="var(--accent-teal)" rx="3" />
            <text x="158" y="10" fill="var(--text-secondary)">Cached Lookups</text>
          </g>

          {/* Grid Cells */}
          {memoTable.map((val, idx) => {
            const x = offset + idx * (cellWidth + gap);
            const y = 45;
            const isActive = idx === activeIndex;
            const isLookup = lookupIndices.includes(idx);
            
            let bg = 'white';
            let stroke = 'var(--border)';
            let strokeWidth = '1.5';
            let textColor = 'var(--text-primary)';

            if (isActive) {
              bg = 'var(--surface-amber)';
              stroke = 'var(--accent-amber)';
              strokeWidth = '2';
              textColor = 'var(--accent-amber)';
            } else if (isLookup) {
              bg = 'var(--surface-teal)';
              stroke = 'var(--accent-teal)';
              strokeWidth = '1.5';
              textColor = 'var(--accent-teal)';
            }

            return (
              <g key={`dp-cell-${idx}`}>
                {/* Cell Container */}
                <motion.rect
                  x={x}
                  y={y}
                  width={cellWidth}
                  height={cellHeight}
                  rx="10"
                  fill={bg}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.03))' }}
                />

                {/* Value Text */}
                <text
                  x={x + cellWidth / 2}
                  y={y + cellHeight / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="var(--font-dmmono)"
                  fontSize="16"
                  fontWeight={isActive || isLookup ? '700' : '500'}
                  fill={textColor}
                >
                  {val !== null ? val : '-'}
                </text>

                {/* Index label below */}
                <text
                  x={x + cellWidth / 2}
                  y={y + cellHeight + 16}
                  textAnchor="middle"
                  fontFamily="var(--font-dmmono)"
                  fontSize="11"
                  fill="var(--text-muted)"
                >
                  dp[{idx}]
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
