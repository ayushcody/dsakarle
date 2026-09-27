'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface StackDiagramProps {
  diagramState: Record<string, unknown>;
}

export default function StackDiagram({ diagramState }: StackDiagramProps) {
  // Extract stack elements from state or use default
  const stack = Array.isArray(diagramState.stack)
    ? diagramState.stack
    : Array.isArray(diagramState.values)
    ? diagramState.values
    : [10, 20, 30]; // default stack state

  const maxCapacity = 5;
  const itemHeight = 44;
  const itemWidth = 140;
  const gap = 6;
  const totalHeight = maxCapacity * (itemHeight + gap) + 40;
  const width = 300;

  // X coordinate to center the stack
  const stackX = (width - itemWidth) / 2;

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--white)] shadow-[var(--shadow-card)]">
      <div className="w-full max-w-[320px]">
        <svg viewBox={`0 0 ${width} ${totalHeight}`} width="100%" className="overflow-visible">
          {/* SVG definitions for dropshadow filters or gradients */}
          <defs>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.06" />
            </filter>
          </defs>

          {/* Stack Container/Tube Container */}
          <path
            d={`M ${stackX - 6} 20 
               L ${stackX - 6} ${totalHeight - 20} 
               L ${stackX + itemWidth + 6} ${totalHeight - 20} 
               L ${stackX + itemWidth + 6} 20`}
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Stack Items */}
          <g>
            <AnimatePresence initial={false}>
              {stack.map((val, idx) => {
                // Bottom is at totalHeight - 20 - itemHeight
                const yPos = totalHeight - 24 - (idx + 1) * (itemHeight + gap);
                const isTop = idx === stack.length - 1;

                return (
                  <motion.g
                    key={`stack-item-${idx}-${val}`}
                    initial={{ opacity: 0, y: yPos - 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: yPos, scale: 1 }}
                    exit={{ opacity: 0, y: yPos - 40, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  >
                    {/* Item Rectangle */}
                    <rect
                      x={stackX}
                      width={itemWidth}
                      height={itemHeight}
                      rx="8"
                      fill={isTop ? 'var(--surface-amber)' : 'white'}
                      stroke={isTop ? 'var(--accent-amber)' : 'var(--border)'}
                      strokeWidth={isTop ? '2' : '1.5'}
                      filter="url(#shadow)"
                    />

                    {/* Value text */}
                    <text
                      x={stackX + itemWidth / 2}
                      y={itemHeight / 2 + 1}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontFamily="var(--font-dmmono)"
                      fontSize="15"
                      fontWeight={isTop ? '700' : '500'}
                      fill={isTop ? 'var(--accent-amber)' : 'var(--text-primary)'}
                    >
                      {val}
                    </text>

                    {/* Index Label (to the right of the stack) */}
                    <text
                      x={stackX + itemWidth + 16}
                      y={itemHeight / 2 + 1}
                      dominantBaseline="central"
                      fontFamily="var(--font-dmmono)"
                      fontSize="12"
                      fill="var(--text-muted)"
                    >
                      [{idx}]
                    </text>

                    {/* Pointer / TOP tag */}
                    {isTop && (
                      <motion.g
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        {/* Triangle pointer */}
                        <polygon
                          points={`${stackX - 8},${itemHeight / 2} ${stackX - 16},${itemHeight / 2 - 6} ${stackX - 16},${itemHeight / 2 + 6}`}
                          fill="var(--accent-coral)"
                        />
                        {/* TOP Text */}
                        <text
                          x={stackX - 22}
                          y={itemHeight / 2 + 1}
                          textAnchor="end"
                          dominantBaseline="central"
                          fontFamily="var(--font-dmmono)"
                          fontSize="12"
                          fontWeight="700"
                          fill="var(--accent-coral)"
                        >
                          TOP
                        </text>
                      </motion.g>
                    )}
                  </motion.g>
                );
              })}
            </AnimatePresence>
          </g>

          {/* Empty Stack State */}
          {stack.length === 0 && (
            <text
              x={width / 2}
              y={totalHeight / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="var(--font-dmsans)"
              fontSize="14"
              fill="var(--text-muted)"
            >
              Stack is empty
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
