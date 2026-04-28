'use client'
import { motion, AnimatePresence } from 'framer-motion'

const CELL_W = 72
const CELL_H = 72
const CELL_GAP = 8
const CELL_RX = 10

interface ArrayDiagramProps {
  cells: (number | string)[]
  left?: number    // index of L pointer (-1 = hidden)
  right?: number   // index of R pointer (-1 = hidden)
  windowStart?: number
  windowEnd?: number
  highlighted?: number[]   // cells to flash amber
  comparing?: number[]     // cells being compared
}

export function ArrayDiagram({
  cells, left = -1, right = -1,
  windowStart, windowEnd, highlighted = [], comparing = []
}: ArrayDiagramProps) {

  const n = cells.length
  const totalW = n * CELL_W + (n - 1) * CELL_GAP
  const svgW = Math.max(totalW + 40, 400)
  const offsetX = (svgW - totalW) / 2  // center the array
  const svgH = 140  // room for pointer labels above + index labels below

  const cellX = (i: number) => offsetX + i * (CELL_W + CELL_GAP)
  const cellCX = (i: number) => cellX(i) + CELL_W / 2
  const CELL_TOP = 40  // y of top of cell rect

  // Window rect spans from windowStart to windowEnd (inclusive)
  const showWindow = windowStart !== undefined && windowEnd !== undefined && windowStart >= 0
  const windowX = showWindow ? cellX(windowStart!) - 4 : 0
  const windowW = showWindow ? (windowEnd! - windowStart! + 1) * (CELL_W + CELL_GAP) - CELL_GAP + 8 : 0

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width="100%"
      style={{ overflow: 'visible', maxWidth: 700 }}
    >
      {/* ── Window highlight ── */}
      {showWindow && (
        <motion.rect
          x={windowX}
          y={CELL_TOP - 4}
          height={CELL_H + 8}
          rx={CELL_RX + 4}
          fill="rgba(212,96,58,0.09)"
          stroke="#D4603A"
          strokeWidth={2.5}
          animate={{ x: windowX, width: windowW }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}

      {/* ── Cells ── */}
      {cells.map((val, i) => {
        const isHL = highlighted.includes(i)
        const isCmp = comparing.includes(i)
        const inWin = showWindow && i >= windowStart! && i <= windowEnd!
        const cx = cellX(i)

        return (
          <g key={i}>
            <motion.rect
              x={cx} y={CELL_TOP}
              width={CELL_W} height={CELL_H}
              rx={CELL_RX}
              animate={{
                fill: isHL ? 'rgba(202,138,4,0.18)' : isCmp ? 'rgba(212,96,58,0.12)' : '#FFFFFF',
                stroke: inWin ? '#D4603A' : '#E5E0D8',
                strokeWidth: inWin ? 0.5 : 1,  // window rect covers the border
              }}
              transition={{ duration: 0.25 }}
              style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.06))' }}
            />
            {/* Cell value */}
            <text
              x={cellCX(i)} y={CELL_TOP + CELL_H / 2}
              textAnchor="middle" dominantBaseline="central"
              fontFamily="DM Mono, monospace" fontSize={22} fontWeight={600}
              fill="#1A1A18"
            >
              {val}
            </text>
            {/* Index label */}
            <text
              x={cellCX(i)} y={CELL_TOP + CELL_H + 18}
              textAnchor="middle"
              fontFamily="DM Mono, monospace" fontSize={11} fill="#9C9890"
            >
              {i}
            </text>
          </g>
        )
      })}

      {/* ── Left pointer (L) ── */}
      <AnimatePresence>
        {left >= 0 && left < n && (
          <motion.g
            key="left-ptr"
            animate={{ x: cellCX(left) }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            initial={false}
          >
            {/* Triangle pointing down */}
            <motion.polygon
              points="-10,0 10,0 0,14"
              transform={`translate(0, ${CELL_TOP - 20})`}
              fill="#16A34A"
            />
            {/* Label */}
            <text
              y={CELL_TOP - 26}
              textAnchor="middle"
              fontFamily="DM Mono, monospace" fontSize={13} fontWeight={700}
              fill="#16A34A"
            >
              L
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {/* ── Right pointer (R) ── */}
      <AnimatePresence>
        {right >= 0 && right < n && (
          <motion.g
            key="right-ptr"
            animate={{ x: cellCX(right) }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            initial={false}
          >
            <motion.polygon
              points="-10,0 10,0 0,14"
              transform={`translate(0, ${CELL_TOP - 20})`}
              fill="#EA580C"
            />
            <text
              y={CELL_TOP - 26}
              textAnchor="middle"
              fontFamily="DM Mono, monospace" fontSize={13} fontWeight={700}
              fill="#EA580C"
            >
              R
            </text>
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  )
}
