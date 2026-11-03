import type { ElementType, HTMLAttributes } from 'react';
import { cn } from './cn';

export type ProseProps = HTMLAttributes<HTMLElement> & {
  /** Wrapper element. Defaults to `div`. */
  as?: ElementType;
};

/**
 * Lesson text wrapper. `.prose-notebook` supplies measure and body size; the
 * descendant rules here style links, inline code, strong and lists with tokens.
 */
export function Prose({ as: Comp = 'div', className, children, ...rest }: ProseProps) {
  return (
    <Comp
      className={cn(
        'prose-notebook text-ink',
        '[&_p]:mb-4 [&_p:last-child]:mb-0',
        '[&_strong]:font-semibold [&_strong]:text-ink',
        '[&_a]:text-coral-ink [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-4 hover:[&_a]:decoration-2',
        '[&_a:focus-visible]:rounded-cell [&_a:focus-visible]:outline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-[var(--focus-ring)]',
        '[&_:not(pre)>code]:rounded-cell [&_:not(pre)>code]:bg-paper-sunken [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.9em] [&_:not(pre)>code]:text-ink',
        '[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1.5',
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}
