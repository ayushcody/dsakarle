'use client';

import { useReducedMotion } from 'framer-motion';
import type { Transition } from 'framer-motion';

/** Positions: pointers, cells, nodes. */
export const spring = { type: 'spring', stiffness: 300, damping: 30 } as const satisfies Transition;

/** Small tags. */
export const springSnappy = { type: 'spring', stiffness: 420, damping: 34 } as const satisfies Transition;

/** Colour and opacity changes. */
export const fade = { duration: 0.16, ease: 'easeOut' } as const satisfies Transition;

/** The "changed" highlighter. */
export const flash = { duration: 0.3 } as const satisfies Transition;

/** Autoplay base interval in ms. Divide by speed. */
export const STEP_MS = 900;

/** Entering content: 8px rise + fade, once. Spread onto a motion element. */
export const revealOnScroll = {
  initial: { opacity: 0, y: 8 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '0px 0px -10% 0px' },
  transition: fade,
} as const;

/** Autoplay interval for a speed multiplier (0.5x, 1x, 2x ...). */
export function useStepInterval(speed: number): number {
  const safe = Number.isFinite(speed) && speed > 0 ? speed : 1;
  return STEP_MS / safe;
}

/** True when the user asked the OS for reduced motion. Autoplay must not start itself then. */
export function usePrefersReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}
