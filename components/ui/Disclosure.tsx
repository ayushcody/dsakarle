'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { cn, focusRing } from './cn';
import { fade, spring } from '@/lib/motion';

export type DisclosureProps = {
  /** Button label (always visible). */
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Fires after the user toggles. */
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

/**
 * Expand/collapse section. A button with aria-expanded controls a labelled
 * region whose height animates (instantly under reduced motion).
 */
export function Disclosure({ title, children, defaultOpen = false, onOpenChange, className }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();
  const uid = useId();
  const buttonId = `${uid}-btn`;
  const panelId = `${uid}-panel`;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className={cn('rounded-card border border-rule bg-paper-raised', className)}>
      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className={cn(
          'flex min-h-[44px] w-full items-center justify-between gap-3 rounded-card px-4 py-2 text-left font-sans text-[15px] font-medium text-ink',
          'transition-colors duration-150 hover:bg-paper-sunken',
          focusRing,
        )}
      >
        <span>{title}</span>
        <motion.svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="h-4 w-4 shrink-0 text-ink-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ rotate: open ? 180 : 0 }}
          transition={reduce ? { duration: 0 } : spring}
        >
          <path d="M3 6l5 5 5-5" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="panel"
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={reduce ? { duration: 0 } : { height: spring, opacity: fade }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-rule px-4 py-3 text-[15px] leading-6 text-ink-2">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
