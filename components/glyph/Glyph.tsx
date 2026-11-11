import type { CSSProperties } from 'react'
import { GLYPHS, type GlyphKey } from './paths'

export type GlyphSize = 16 | 24 | 48 | 96

export interface GlyphProps {
  id: GlyphKey
  /** The four design sizes (16 sidebar, 24 options/filters, 48 lesson header, 96 home/map); any px value works. */
  size?: GlyphSize | number
  className?: string
  style?: CSSProperties
  /** Overrides the default accessible name. */
  title?: string
  /** Purely ornamental (sits next to a text label): hidden from assistive tech. */
  decorative?: boolean
}

/** Stroke width in viewBox units: heavier at small sizes, lighter when large. */
export function strokeForSize(size: number): number {
  const stops: Array<[number, number]> = [[16, 2], [24, 1.75], [48, 1.5], [96, 1.25]]
  if (size <= stops[0][0]) return stops[0][1]
  for (let i = 1; i < stops.length; i++) {
    const [s0, w0] = stops[i - 1]
    const [s1, w1] = stops[i]
    if (size <= s1) return w0 + ((w1 - w0) * (size - s0)) / (s1 - s0)
  }
  return stops[stops.length - 1][1]
}

/**
 * One memorable single-stroke glyph per lesson, drawn in `currentColor`.
 * Inline SVG so it inherits colour from text, and themes for free.
 */
export function Glyph({ id, size = 24, className, style, title, decorative = false }: GlyphProps) {
  const def = GLYPHS[id] ?? GLYPHS.generic
  const label = title ?? def.title
  const sw = strokeForSize(typeof size === 'number' ? size : 24)
  const dotR = Math.max(1.1, sw * 0.68)
  const sketched = size >= 72
  const dashArray = `${sw * 0.9} ${sw * 1.7}`

  const a11y = decorative
    ? ({ 'aria-hidden': true, focusable: false } as const)
    : ({ role: 'img', 'aria-label': label } as const)

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, ...style }}
      {...a11y}
    >
      {!decorative && <title>{label}</title>}
      {sketched && (
        // Second, fainter pass nudged off-register: the pen went over it twice.
        <g opacity={0.25} strokeWidth={sw * 0.55} transform="translate(-0.25 0.3) rotate(1.6 12 12)" aria-hidden="true">
          {def.paths.map((d, i) => <path key={`s${i}`} d={d} />)}
          {def.dashed?.map((d, i) => <path key={`sd${i}`} d={d} strokeDasharray={dashArray} />)}
        </g>
      )}
      {def.dashed?.map((d, i) => <path key={`d${i}`} d={d} strokeDasharray={dashArray} opacity={0.7} />)}
      {def.paths.map((d, i) => <path key={i} d={d} />)}
      {def.dots?.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={dotR} fill="currentColor" stroke="none" />
      ))}
    </svg>
  )
}

export interface GlyphTileProps {
  id: GlyphKey
  /** Tile edge in px. Omit to let `className` (e.g. `h-[120px] w-[120px]`) size it; falls back to 90. */
  tileSize?: number
  /** Glyph size used to pick the stroke weight; the glyph itself fills ~62% of the tile. */
  glyphSize?: number
  shape?: 'square' | 'circle'
  className?: string
  style?: CSSProperties
  title?: string
  decorative?: boolean
}

/** A glyph on a raised paper tile with a hairline rule, in the coral pen. */
export function GlyphTile({
  id,
  tileSize,
  glyphSize = 64,
  shape = 'square',
  className,
  style,
  title,
  decorative,
}: GlyphTileProps) {
  const dimension = tileSize ?? (className ? undefined : 90)
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: dimension,
        height: dimension,
        borderRadius: shape === 'circle' ? '999px' : 'var(--r-card, 10px)',
        background: 'var(--paper-raised, #FFFDF9)',
        border: '1px solid var(--rule, rgba(29,27,25,0.12))',
        color: 'var(--coral, #CC5A37)',
        ...style,
      }}
    >
      <Glyph id={id} size={glyphSize} style={{ width: '62%', height: '62%' }} title={title} decorative={decorative} />
    </span>
  )
}
