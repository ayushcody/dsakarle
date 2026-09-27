'use client';

import { motion, useReducedMotion } from 'framer-motion';

const SYMBOLS = ['[ ]', '{ }', '->', '0', '1', 'O(n)', 'i++', '< >', 'null', '&&', 'log n', '#'];

// Fixed placements so the field looks composed, not scattered.
const SPOTS = [
  [6, 18], [16, 62], [24, 34], [11, 84], [86, 22], [92, 58], [78, 76], [70, 12], [34, 88], [60, 90], [48, 8], [96, 88],
];

export function FloatingSymbols() {
  const reduce = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {SPOTS.map(([x, y], i) => (
        <motion.span
          key={i}
          className="absolute font-dmmono font-bold text-[var(--accent-coral)]"
          style={{ left: `${x}%`, top: `${y}%`, fontSize: 14 + (i % 4) * 6, opacity: 0.1 + (i % 3) * 0.04 }}
          animate={reduce ? undefined : { y: [0, -18, 0], x: [0, i % 2 ? 10 : -10, 0], rotate: [0, i % 2 ? 6 : -6, 0] }}
          transition={{ duration: 9 + (i % 5) * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        >
          {SYMBOLS[i]}
        </motion.span>
      ))}
    </div>
  );
}
