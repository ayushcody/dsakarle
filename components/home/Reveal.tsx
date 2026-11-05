'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

import { revealOnScroll } from '@/lib/motion';

/** Rises 8px and fades in once when it scrolls into view. Reduced motion is handled by MotionConfig. */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} {...revealOnScroll}>
      {children}
    </motion.div>
  );
}
