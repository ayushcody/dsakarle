'use client';

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Shared across every modal surface (menu sheet, lesson drawer, palette) so stacked locks release correctly.
let locks = 0;
let previousOverflow = '';

function focusables(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.getClientRects().length > 0,
  );
}

/**
 * While `open`: locks page scroll, moves focus into `containerRef` (an element with
 * `data-autofocus` wins, else the first focusable), traps Tab, closes on Escape, and
 * hands focus back to whatever had it before.
 */
export function useModalBehavior(open: boolean, containerRef: RefObject<HTMLElement>, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    const returnTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (locks === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    locks += 1;

    const initial = container?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables(container)[0] ?? container;
    initial?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !container) return;
      const items = focusables(container);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && container.contains(active);
      if (event.shiftKey && (!inside || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!inside || active === last)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      locks -= 1;
      if (locks === 0) document.body.style.overflow = previousOverflow;
      returnTo?.focus?.({ preventScroll: true });
    };
  }, [open, containerRef]);
}
