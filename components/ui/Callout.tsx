import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type CalloutVariant = 'aha' | 'tip' | 'warning' | 'note';

export type CalloutProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  /** `aha` is the accent note; `tip` teal, `warning` amber, `note` neutral. Odin-style: 3px left rule, sunken fill, small-caps label. */
  variant?: CalloutVariant;
  /** Short heading, e.g. "Why it works". */
  title?: ReactNode;
  /** Optional decorative icon shown before the content. */
  icon?: ReactNode;
};

const rules: Record<CalloutVariant, string> = {
  aha: 'border-l-coral-ink bg-paper-sunken',
  tip: 'border-l-teal bg-paper-sunken',
  warning: 'border-l-amber bg-paper-sunken',
  note: 'border-l-rule-strong bg-paper-sunken',
};

const titleTone: Record<CalloutVariant, string> = {
  aha: 'text-coral-ink',
  tip: 'text-teal-ink',
  warning: 'text-amber-ink',
  note: 'text-ink-2',
};

/** Note block: a thick left rule, optional title and icon. */
export function Callout({ variant = 'note', title, icon, className, children, ...rest }: CalloutProps) {
  return (
    <aside
      role="note"
      className={cn(
        'flex gap-3 rounded-r-card border-l-[3px] px-4 py-3 text-ink-2',
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
          <p className={cn('t-eyebrow mb-1 !text-[11px] !tracking-[0.08em]', titleTone[variant])}>{title}</p>
        ) : null}
        <div
          className={cn(
            'text-[15px] leading-6 text-ink-2',
            '[&>*:last-child]:mb-0',
          )}
        >
          {children}
        </div>
      </div>
    </aside>
  );
}
