import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type CalloutVariant = 'aha' | 'tip' | 'warning' | 'note';

export type CalloutProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  /** `aha` is the coral margin note in serif italic; the others are quieter. */
  variant?: CalloutVariant;
  /** Short heading, e.g. "Why it works". */
  title?: ReactNode;
  /** Optional decorative icon shown before the content. */
  icon?: ReactNode;
};

const rules: Record<CalloutVariant, string> = {
  aha: 'border-l-coral bg-coral-wash',
  tip: 'border-l-teal bg-[var(--role-ptr-a-wash)]',
  warning: 'border-l-amber bg-[color-mix(in_srgb,var(--amber)_14%,transparent)]',
  note: 'border-l-rule-strong bg-paper-sunken',
};

const titleTone: Record<CalloutVariant, string> = {
  aha: 'text-coral-ink',
  tip: 'text-teal',
  warning: 'text-[var(--role-compare)]',
  note: 'text-ink-2',
};

/** Notebook margin-note: a thick left rule, optional title and icon. */
export function Callout({ variant = 'note', title, icon, className, children, ...rest }: CalloutProps) {
  return (
    <aside
      role="note"
      className={cn(
        'flex gap-3 rounded-r-card border-l-[3px] px-4 py-3 text-ink',
        rules[variant],
        className,
      )}
      {...rest}
    >
      {icon ? (
        <span aria-hidden="true" className={cn('mt-0.5 inline-flex shrink-0', titleTone[variant])}>
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        {title ? (
          <p className={cn('t-eyebrow mb-1', titleTone[variant])}>{title}</p>
        ) : null}
        <div
          className={cn(
            variant === 'aha' ? 'font-serif text-[18px] italic leading-7' : 'text-[15px] leading-6 text-ink-2',
            '[&>*:last-child]:mb-0',
          )}
        >
          {children}
        </div>
      </div>
    </aside>
  );
}
