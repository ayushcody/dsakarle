'use client';

import { motion } from 'framer-motion';
import { useId, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { cn, focusRing } from './cn';
import { spring } from '@/lib/motion';

export type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
  /** Optional decorative icon before the label. */
  icon?: ReactNode;
  disabled?: boolean;
};

export type SegmentedControlProps<T extends string> = {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the group (required unless `aria-labelledby` is set). */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
};

/**
 * Single-choice switch (radiogroup). Arrow keys / Home / End move and select,
 * Tab enters on the selected option, and the selected pill glides between options.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  ...aria
}: SegmentedControlProps<T>) {
  const id = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const tabbable = selectedIndex >= 0 ? selectedIndex : options.findIndex((o) => !o.disabled);

  const move = (from: number, dir: 1 | -1 | 'first' | 'last') => {
    const n = options.length;
    let i = dir === 'first' ? -1 : dir === 'last' ? n : from;
    const step = dir === 'first' ? 1 : dir === 'last' ? -1 : dir;
    for (let k = 0; k < n; k++) {
      i = (i + step + n) % n;
      if (!options[i].disabled) {
        onChange(options[i].value);
        refs.current[i]?.focus();
        return;
      }
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        move(index, 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        move(index, -1);
        break;
      case 'Home':
        e.preventDefault();
        move(index, 'first');
        break;
      case 'End':
        e.preventDefault();
        move(index, 'last');
        break;
    }
  };

  return (
    <div
      role="radiogroup"
      className={cn('inline-flex items-center gap-1 rounded-card border border-rule bg-paper-sunken p-1', className)}
      {...aria}
    >
      {options.map((opt, i) => {
        const selected = i === selectedIndex;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={opt.disabled}
            tabIndex={i === tabbable ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'relative inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-cell px-3.5 font-sans text-[14px] font-medium',
              'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
              focusRing,
              selected ? 'text-ink' : 'text-ink-2 hover:text-ink',
            )}
          >
            {selected ? (
              <motion.span
                layoutId={`${id}-pill`}
                transition={spring}
                aria-hidden="true"
                className="absolute inset-0 rounded-cell border border-rule bg-paper-raised shadow-1"
              />
            ) : null}
            {opt.icon ? (
              <span aria-hidden="true" className="relative inline-flex">
                {opt.icon}
              </span>
            ) : null}
            <span className="relative">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
