import Link from 'next/link';
import { cn } from '@/components/ui/cn';
import { MARK } from './markGeometry';

/**
 * `mark`: the glyph alone. `full`: glyph + wordmark, in brand colours.
 * `mono`: glyph + wordmark in a single colour (`currentColor`), for dark backgrounds, print and stamps.
 */
export type LogoVariant = 'mark' | 'full' | 'mono';
export type LogoSize = 'sm' | 'md' | 'lg';

const MARK_PX: Record<LogoSize, number> = { sm: 24, md: 28, lg: 40 };
const TEXT_CLASS: Record<LogoSize, string> = {
  sm: 'text-[18px]',
  md: 'text-[21px]',
  lg: 'text-[30px]',
};

/**
 * The DSA Karle mark: sketched "[ ]" brackets framing an array. Two cells rest, and the third is filled
 * and lifted: the window in the middle of its slide (and also just an array with the pen on it).
 * Brackets and the highlight are coral, the resting cells use `currentColor` (ink), all with the same round
 * caps and joins as components/glyph. With `mono`, everything is `currentColor`.
 * On hover of an ancestor with the `group/logo` class, the highlighted cell settles down into the row.
 * Geometry lives in ./markGeometry so the favicon and social images share it.
 */
export function LogoMark({
  size = 28,
  className,
  title,
  mono = false,
}: {
  size?: number;
  className?: string;
  /** Omit when the wordmark sits next to it (the mark is then decorative). */
  title?: string;
  /** Draw everything in `currentColor` instead of ink + coral. */
  mono?: boolean;
}) {
  const a11y = title
    ? ({ role: 'img', 'aria-label': title } as const)
    : ({ 'aria-hidden': true, focusable: false } as const);
  const accent = mono ? 'currentColor' : 'var(--coral)';
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
      <g stroke={accent} strokeWidth={MARK.bracketStroke}>
        {MARK.brackets.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      {/* the resting cells */}
      <g stroke="currentColor" strokeWidth={MARK.cellStroke}>
        {MARK.cells.map((c) => (
          <rect key={c.x} x={c.x} y={c.y} width={c.w} height={c.h} rx={MARK.radius} />
        ))}
      </g>
      {/* the highlighted one */}
      <rect
        x={MARK.hot.x}
        y={MARK.hot.y}
        width={MARK.hot.w}
        height={MARK.hot.h}
        rx={MARK.radius}
        fill={accent}
        stroke={accent}
        strokeWidth={MARK.cellStroke}
        className="transition-transform duration-200 ease-out motion-reduce:transition-none group-hover/logo:translate-y-[1.6px]"
      />
    </svg>
  );
}

export interface LogoProps {
  /** `mark` is the glyph alone, `full` adds the "DSA Karle" wordmark, `mono` is `full` in `currentColor`. */
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
        <LogoMark size={MARK_PX[size]} mono={variant === 'mono'} />
        <span
          className={cn(
            'font-serif font-semibold leading-none tracking-[-0.02em]',
            variant === 'mono' ? 'text-current' : 'text-ink',
            TEXT_CLASS[size],
          )}
          style={{ fontVariationSettings: '"opsz" 36' }}
        >
          DSA <span className={variant === 'mono' ? undefined : 'text-coral-ink'}>Karle</span>
        </span>
      </>
    );

  const classes = cn('group/logo inline-flex items-center gap-2', variant === 'mono' ? undefined : 'text-ink', className);

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
