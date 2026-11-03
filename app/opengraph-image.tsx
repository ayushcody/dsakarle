import { ImageResponse } from 'next/og'

export const alt = 'DSA Karle: watch the algorithm run, then write it.'
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
        <div style={{ display: 'flex', gap: 16, marginBottom: 48 }}>
          {cells.map((value, i) => (
            <div
              key={i}
              style={{
                width: 88,
                height: 88,
                borderRadius: 10,
                border: `${i === 2 ? 4 : 2}px solid ${i === 2 ? CORAL : INK}`,
                color: INK,
                fontSize: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {value}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 88, fontWeight: 700, color: INK, lineHeight: 1.05, display: 'flex' }}>DSA Karle</div>
        <div style={{ fontSize: 38, color: INK_2, marginTop: 20, display: 'flex' }}>
          Watch the algorithm run, then write it.
        </div>
      </div>
    ),
    size,
  )
}
