'use client';

import Link from 'next/link';
import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn, focusRing } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

type CommonProps = {
  /** Visual style. Defaults to `primary`. */
  variant?: ButtonVariant;
  /** `sm` and `md` both keep a hit target of at least 40px. */
  size?: ButtonSize;
  /** Shows a spinner, sets aria-busy and blocks interaction. */
  loading?: boolean;
  /** Icon rendered before the label (decorative, aria-hidden). */
  leadingIcon?: ReactNode;
  /** Icon rendered after the label (decorative, aria-hidden). */
  trailingIcon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    /** When set, renders a next/link anchor instead of a <button>. */
    href?: string;
    target?: AnchorHTMLAttributes<HTMLAnchorElement>['target'];
    rel?: string;
  };

const base =
  'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-control font-sans font-medium ' +
  'transition-colors duration-150 ' +
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50 disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-coral-ink text-paper hover:bg-coral-ink-2 active:bg-coral-ink-2',
  secondary:
    'border border-rule-strong bg-paper-raised text-ink-2 hover:bg-paper-sunken hover:text-ink active:bg-paper-sunken',
  ghost: 'bg-transparent text-ink-2 hover:bg-paper-sunken hover:text-ink',
  link: 'rounded-control bg-transparent px-1 text-coral-ink underline underline-offset-4 decoration-1 hover:decoration-2',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-[40px] px-3 text-[14px] leading-5',
  md: 'min-h-[40px] px-4 text-[14px] leading-6',
  lg: 'min-h-[44px] px-5 text-[16px] leading-6',
};

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 animate-spin motion-reduce:animate-none"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="9" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );
}

/**
 * The one button. Verbs on the label ("Watch it run"). Renders a <button>,
 * or a next/link anchor when `href` is given.
 */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leadingIcon,
      trailingIcon,
      href,
      className,
      children,
      disabled,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    const inactive = Boolean(disabled || loading);
    const classes = cn(
      base,
      focusRing,
      variants[variant],
      variant === 'link' ? 'min-h-[40px] text-[inherit]' : sizes[size],
      className,
    );

    const content = (
      <>
        {loading ? <Spinner /> : leadingIcon ? <span aria-hidden="true" className="inline-flex shrink-0">{leadingIcon}</span> : null}
        {children}
        {trailingIcon && !loading ? (
          <span aria-hidden="true" className="inline-flex shrink-0">{trailingIcon}</span>
        ) : null}
      </>
    );

    if (href !== undefined) {
      const { onClick, target, rel, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          target={target}
          rel={rel}
          aria-disabled={inactive || undefined}
          aria-busy={loading || undefined}
          tabIndex={inactive ? -1 : undefined}
          onClick={(e) => {
            if (inactive) {
              e.preventDefault();
              return;
            }
            onClick?.(e);
          }}
          className={cn(classes, inactive && 'pointer-events-none opacity-50')}
          {...anchorRest}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        disabled={inactive}
        aria-busy={loading || undefined}
        className={classes}
        {...rest}
      >
        {content}
      </button>
    );
  },
);
