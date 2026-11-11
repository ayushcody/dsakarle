'use client';

import Link from 'next/link';
import { forwardRef } from 'react';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn, focusRing } from './cn';

export type CardProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  /** Rendered element. Use `a` with `href` for a whole-card link. */
  as?: 'div' | 'section' | 'article' | 'li' | 'a';
  /** Hover: stronger border and a soft shadow, 1px lift (transform only; off under reduced motion). */
  interactive?: boolean;
  /** Required when `as="a"`. Internal paths use next/link. */
  href?: string;
  /** Inner padding preset. Defaults to `md` (24px). */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children?: ReactNode;
};

const pads = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' } as const;

/** Paper-raised surface with a 1px rule border and card radius. Flat at rest; shadow only on hover when `interactive`. */
export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { as = 'div', interactive = false, href, padding = 'md', className, children, ...rest },
  ref,
) {
  const classes = cn(
    'block rounded-card border border-rule bg-paper-raised text-ink',
    pads[padding],
    interactive &&
      cn(
        focusRing,
        'transition-[transform,box-shadow,border-color] duration-200 ease-out hover:border-rule-strong hover:shadow-2 motion-safe:hover:-translate-y-px',
      ),
    as === 'a' && focusRing,
    className,
  );

  let Comp: ElementType = as;
  const extra: Record<string, unknown> = {};
  if (as === 'a' && href !== undefined) {
    extra.href = href;
    if (href.startsWith('/')) Comp = Link;
  }

  return (
    <Comp ref={ref} className={classes} {...extra} {...rest}>
      {children}
    </Comp>
  );
});
