'use client';

import { Children, cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { cn } from './cn';

export type TooltipProps = {
  /** Tooltip text. Keep it to a phrase. */
  content: ReactNode;
  /** A single focusable element (button, link, ...). */
  children: ReactElement;
  side?: 'top' | 'bottom';
  /** Hover delay in ms before showing. Focus shows immediately. */
  delay?: number;
  className?: string;
};

/**
 * Lightweight tooltip on hover or keyboard focus. Escape dismisses it, the
 * trigger gets aria-describedby, and the bubble stays hoverable.
 */
export function Tooltip({ content, children, side = 'top', delay = 300, className }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const show = useCallback(
    (wait: number) => {
      clear();
      if (wait <= 0) setOpen(true);
      else timer.current = setTimeout(() => setOpen(true), wait);
    },
    [],
  );
  const hide = useCallback(() => {
    clear();
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, hide]);

  useEffect(() => clear, []);

  const child = Children.only(children);
  const trigger = isValidElement<{ 'aria-describedby'?: string }>(child)
    ? cloneElement(child, {
        'aria-describedby': [child.props['aria-describedby'], id].filter(Boolean).join(' '),
      })
    : child;

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => show(delay)}
      onMouseLeave={hide}
      onFocus={() => show(0)}
      onBlur={hide}
    >
      {trigger}
      <span
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2',
          side === 'top' ? 'bottom-full pb-2' : 'top-full pt-2',
          open && 'pointer-events-auto',
        )}
      >
        <span
          id={id}
          role="tooltip"
          className={cn(
            'block w-max max-w-[240px] rounded-control bg-ink px-2.5 py-1.5 font-sans text-[13px] font-medium leading-[18px] text-paper shadow-2',
            'transition-opacity duration-150',
            open ? 'opacity-100' : 'invisible opacity-0',
            className,
          )}
        >
          {content}
        </span>
      </span>
    </span>
  );
}
