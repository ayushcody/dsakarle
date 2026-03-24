'use client';

import { motion } from 'framer-motion';

interface ArrayDiagramProps {
  cells: (number | string)[]
  diagramState: {
    left?: number
    right?: number
    windowStart?: number
    windowEnd?: number
    highlighted?: number[]
    comparing?: [number, number]
  }
  cellWidth?: number
  showIndices?: boolean
}

export function ArrayDiagram({
  cells,
  diagramState,
  cellWidth = 64,
  showIndices = true,
}: ArrayDiagramProps) {
  const { left, right, windowStart, windowEnd, highlighted = [], comparing = [] } = diagramState;
  const cellGap = 6;
  const totalWidth = cells.length * (cellWidth + cellGap) - cellGap;
  const svgHeight = 140;
  const cellY = 40;
  const cellH = 56;
  const safeWidth = Math.max(totalWidth + 40, 680);
  const centerX = (index: number) => index * (cellWidth + cellGap) + cellWidth / 2;

  return (
    <svg
      viewBox={`0 0 ${safeWidth} ${svgHeight}`}
      width="100%"
      style={{ overflow: 'visible' }}
    >
      <g transform={`translate(${(safeWidth - totalWidth) / 2}, 0)`}>
        {windowStart !== undefined && windowEnd !== undefined && (
          <motion.rect
            x={windowStart * (cellWidth + cellGap) - 3}
            y={cellY - 3}
            width={(windowEnd - windowStart + 1) * (cellWidth + cellGap) - cellGap + 6}
            height={cellH + 6}
            rx={10}
            fill="rgba(212,96,58,0.08)"
            stroke="#D4603A"
            strokeWidth={2}
            animate={{
              x: windowStart * (cellWidth + cellGap) - 3,
              width: (windowEnd - windowStart + 1) * (cellWidth + cellGap) - cellGap + 6,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          />
        )}

        {cells.map((value, index) => {
          const inWindow =
            windowStart !== undefined &&
            windowEnd !== undefined &&
            index >= windowStart &&
            index <= windowEnd;
          const isHighlighted = highlighted.includes(index);
          const isComparing = comparing.includes(index);

          return (
            <g key={`${value}-${index}`}>
              <motion.rect
                x={index * (cellWidth + cellGap)}
                y={cellY}
                width={cellWidth}
                height={cellH}
                rx={8}
                fill={
                  isHighlighted
                    ? 'rgba(202,138,4,0.2)'
                    : isComparing
                      ? 'rgba(212,96,58,0.15)'
                      : 'white'
                }
                stroke={inWindow || isComparing ? '#D4603A' : '#E5E0D8'}
                strokeWidth={inWindow ? 1.5 : 1}
                transition={{ duration: 0.3 }}
              />
              <text
                x={index * (cellWidth + cellGap) + cellWidth / 2}
                y={cellY + cellH / 2 + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="var(--font-dmmono)"
                fontSize={18}
                fontWeight={500}
                fill="#1A1A18"
              >
                {value}
              </text>
              {showIndices && (
                <text
                  x={index * (cellWidth + cellGap) + cellWidth / 2}
                  y={cellY + cellH + 18}
                  textAnchor="middle"
                  fontFamily="var(--font-dmmono)"
                  fontSize={11}
                  fill="#9C9890"
                >
                  {index}
                </text>
              )}
            </g>
          );
        })}

        {left !== undefined && left >= 0 && (
          <motion.g
            layoutId="left-pointer"
            animate={{ x: centerX(left) }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          >
            <polygon points="0,-12 8,0 -8,0" fill="#16A34A" transform={`translate(0, ${cellY - 16})`} />
            <text
              y={cellY - 22}
              textAnchor="middle"
              fontFamily="var(--font-dmmono)"
              fontSize={12}
              fontWeight={500}
              fill="#16A34A"
            >
              L
            </text>
          </motion.g>
        )}

        {right !== undefined && right >= 0 && (
          <motion.g
            layoutId="right-pointer"
            animate={{ x: centerX(right) }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          >
            <polygon points="0,-12 8,0 -8,0" fill="#EA580C" transform={`translate(0, ${cellY - 16})`} />
            <text
              y={cellY - 22}
              textAnchor="middle"
              fontFamily="var(--font-dmmono)"
              fontSize={12}
              fontWeight={500}
              fill="#EA580C"
            >
              R
            </text>
          </motion.g>
        )}
      </g>
    </svg>
  );
}

export default ArrayDiagram;
