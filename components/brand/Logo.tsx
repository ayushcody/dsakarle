import Link from 'next/link';
import { cn } from '@/components/ui/cn';

export type LogoVariant = 'mark' | 'full';
export type LogoSize = 'sm' | 'md' | 'lg';

const MARK_PX: Record<LogoSize, number> = { sm: 24, md: 28, lg: 40 };
const TEXT_CLASS: Record<LogoSize, string> = {
  sm: 'text-[18px]',
  md: 'text-[21px]',
  lg: 'text-[30px]',
};

/**
 * The DSA Karle mark: a sketched coral "[ ]" framing a row of three cells,
 * the middle one highlighted. That is a sliding window, and also just an array
 * with the pen on it. Brackets are coral, the cells use `currentColor` (ink),
 * stroked with the same round caps and joins as components/glyph.
 * On hover of an ancestor with the `group/logo` class, the highlight steps one cell right.
 */
export function LogoMark({
  size = 28,
  className,
  title,
}: {
  size?: number;
  className?: string;
  /** Omit when the wordmark sits next to it (the mark is then decorative). */
  title?: string;
}) {
  const a11y = title
    ? ({ role: 'img', 'aria-label': title } as const)
    : ({ 'aria-hidden': true, focusable: false } as const);
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      {...a11y}
    >
      {title ? <title>{title}</title> : null}
      {/* the sketched brackets */}
      <g stroke="var(--coral)" strokeWidth={2.2}>
        <path d="M9.2 5.6H5.9Q3.6 5.5 3.6 7.9V24.1Q3.6 26.5 5.9 26.4H9.2" />
        <path d="M22.8 5.6H26.1Q28.4 5.5 28.4 7.9V24.1Q28.4 26.5 26.1 26.4H22.8" />
      </g>
      {/* three cells */}
      <g stroke="currentColor" strokeWidth={1.6}>
        <rect x={7.3} y={12.7} width={4.6} height={6.6} rx={1.2} />
        <rect x={13.7} y={12.7} width={4.6} height={6.6} rx={1.2} />
        <rect x={20.1} y={12.7} width={4.6} height={6.6} rx={1.2} />
      </g>
      {/* the highlighted one */}
      <rect
        x={13.7}
        y={12.7}
        width={4.6}
        height={6.6}
        rx={1.2}
        fill="var(--coral)"
        stroke="var(--coral)"
        strokeWidth={1.6}
        className="transition-transform duration-200 ease-out motion-reduce:transition-none group-hover/logo:translate-x-[6.4px]"
      />
    </svg>
  );
}

export interface LogoProps {
  /** `mark` is the glyph alone, `full` adds the "DSA Karle" wordmark. */
  variant?: LogoVariant;
  size?: LogoSize;
  /** When set, the logo renders as a link (the header and footer link home). */
  href?: string;
  className?: string;
  onClick?: () => void;
}

/** Mark + wordmark, all inline SVG and text: no image request. */
export function Logo({ variant = 'full', size = 'md', href, className, onClick }: LogoProps) {
  const inner =
    variant === 'mark' ? (
      <LogoMark size={MARK_PX[size]} title="DSA Karle" />
    ) : (
      <>
        <LogoMark size={MARK_PX[size]} />
        <span
          className={cn(
            'font-serif font-semibold leading-none tracking-[-0.02em] text-ink',
            TEXT_CLASS[size],
          )}
          style={{ fontVariationSettings: '"opsz" 36' }}
        >
          DSA <span className="text-coral-ink">Karle</span>
        </span>
      </>
    );

  const classes = cn('group/logo inline-flex items-center gap-2 text-ink', className);

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-label={variant === 'mark' ? 'DSA Karle, home' : undefined}
        className={cn(classes, 'rounded-cell')}
      >
        {inner}
      </Link>
    );
  }
  return <span className={classes}>{inner}</span>;
}

export default Logo;
