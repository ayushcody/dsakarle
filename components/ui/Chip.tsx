'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn, focusRing } from './cn';

export type ChipVariant = 'neutral' | 'coral' | 'teal' | 'amber' | 'found' | 'error';

type ChipBase = {
  /** Colour family. Every state should also carry a text or glyph cue. */
  variant?: ChipVariant;
  /** Optional leading icon, e.g. a Glyph. Decorative. */
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export type StaticChipProps = ChipBase & { selectable?: false } & Omit<HTMLAttributes<HTMLSpanElement>, keyof ChipBase>;
export type SelectableChipProps = ChipBase & {
  /** Turns the chip into a toggle button (aria-pressed). */
  selectable: true;
  selected?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ChipBase | 'aria-pressed'>;
export type ChipProps = StaticChipProps | SelectableChipProps;

const tones: Record<ChipVariant, string> = {
  neutral: 'border-rule bg-paper-sunken text-ink-2',
  coral: 'border-transparent bg-coral-wash text-coral-ink',
  teal: 'border-transparent bg-[var(--role-ptr-a-wash)] text-teal-ink',
  amber: 'border-transparent bg-[color-mix(in_srgb,var(--amber)_16%,transparent)] text-amber-ink',
  found: 'border-transparent bg-[var(--role-found-wash)] text-found-ink',
  error: 'border-transparent bg-[var(--role-error-wash)] text-error-ink',
};

const shell =
  'inline-flex items-center gap-1.5 rounded-pill border font-sans font-medium leading-none whitespace-nowrap';

/**
 * Small pill for metadata (static) or for choices and filters (`selectable`,
 * a button with aria-pressed and a check mark when selected).
 */
export const Chip = forwardRef<HTMLElement, ChipProps>(function Chip(props, ref) {
  if (props.selectable) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { selectable, selected = false, variant = 'neutral', icon, className, children, type = 'button', ...rest } = props;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        aria-pressed={selected}
        className={cn(
          shell,
          focusRing,
          'min-h-[40px] px-4 text-[14px] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
          selected
            ? 'border-coral bg-coral-wash font-semibold text-coral-ink'
            : cn(tones[variant], 'border-rule hover:border-rule-strong'),
          className,
        )}
        {...rest}
      >
        {selected ? (
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8.5l3.2 3.2L13 4.8" />
          </svg>
        ) : icon ? (
          <span aria-hidden="true" className="inline-flex">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { selectable, variant = 'neutral', icon, className, children, ...rest } = props;
  return (
    <span
      ref={ref as React.Ref<HTMLSpanElement>}
      className={cn(shell, 'min-h-[24px] px-2.5 py-1 text-[12px]', tones[variant], className)}
      {...rest}
    >
      {icon ? <span aria-hidden="true" className="inline-flex">{icon}</span> : null}
      {children}
    </span>
  );
});
