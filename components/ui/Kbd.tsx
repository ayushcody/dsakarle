import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export type KbdProps = HTMLAttributes<HTMLElement>;

/** Key cap for shortcuts: `<Kbd>←</Kbd>`, `<Kbd>Space</Kbd>`. */
export function Kbd({ className, children, ...rest }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex min-h-[24px] min-w-[24px] items-center justify-center rounded-cell border border-rule border-b-2 bg-paper-sunken px-1.5',
        'font-mono text-[12px] font-medium leading-none text-ink-2',
        className,
      )}
      {...rest}
    >
      {children}
    </kbd>
  );
}
