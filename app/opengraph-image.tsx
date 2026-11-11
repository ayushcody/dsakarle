import { ImageResponse } from 'next/og'

import { MARK } from '@/components/brand/markGeometry'

export const alt = 'DSA Karle: watch algorithms think.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Social images are rendered outside the page, so the CSS variables are not available here.
// These literals mirror the light-theme tokens in docs/DESIGN_SYSTEM.md (paper, ink, coral).
const PAPER = '#FBF5EF'
const INK = '#1D1B19'
const INK_2 = '#4A4540'
const CORAL = '#CC5A37'

export default function OpengraphImage() {
  const cells = [3, 8, 1, 6, 4]
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: PAPER,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 44 }}>
          <svg width={84} height={84} viewBox="0 0 32 32" fill="none" strokeLinecap="round" strokeLinejoin="round">
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
          <div style={{ display: 'flex', fontSize: 44, fontWeight: 700, color: INK }}>
            DSA&nbsp;<span style={{ color: CORAL }}>Karle</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, marginBottom: 44 }}>
          {cells.map((value, i) => (
            <div
              key={i}
              style={{
                width: 76,
                height: 76,
                borderRadius: 10,
                border: `${i === 2 ? 4 : 2}px solid ${i === 2 ? CORAL : INK}`,
                color: INK,
                fontSize: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {value}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 80, fontWeight: 700, color: INK, lineHeight: 1.05, display: 'flex' }}>Watch algorithms think.</div>
        <div style={{ fontSize: 36, color: INK_2, marginTop: 20, display: 'flex' }}>
          Watch the algorithm run, then write it.
        </div>
      </div>
    ),
    size,
  )
}
