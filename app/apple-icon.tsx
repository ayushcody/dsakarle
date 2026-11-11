import { ImageResponse } from 'next/og'

import { MARK } from '@/components/brand/markGeometry'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// The touch icon is rendered outside the page, so CSS variables are not available: hex is unavoidable.
// These literals mirror the light-theme tokens in docs/DESIGN_SYSTEM.md (paper, ink, coral).
const PAPER = '#FBF5EF'
const INK = '#1D1B19'
const CORAL = '#CC5A37'

export default function AppleIcon() {
  // iOS rounds the corners itself, so the paper fills the whole square.
  const px = 124
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', background: PAPER, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={px} height={px} viewBox="0 0 32 32" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {MARK.brackets.map((d) => (
            <path key={d} d={d} stroke={CORAL} strokeWidth={MARK.bracketStroke} />
          ))}
          {MARK.cells.map((c) => (
            <rect key={c.x} x={c.x} y={c.y} width={c.w} height={c.h} rx={MARK.radius} stroke={INK} strokeWidth={MARK.cellStroke} />
          ))}
          <rect
            x={MARK.hot.x}
            y={MARK.hot.y}
            width={MARK.hot.w}
            height={MARK.hot.h}
            rx={MARK.radius}
            fill={CORAL}
            stroke={CORAL}
            strokeWidth={MARK.cellStroke}
          />
        </svg>
      </div>
    ),
    size,
  )
}
