import type { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Page not found — DSA Karle',
  robots: { index: false },
}

const CELLS = [0, 1, 2, 3]

/** An array of four pages, and an index that points past the end of it. */
function OutOfBounds() {
  const w = 56
  const gap = 8
  const x0 = 16
  const y0 = 52
  const ghostX = x0 + CELLS.length * (w + gap) + 8
  return (
    <svg
      viewBox="0 0 400 150"
      role="img"
      aria-label="An array of four boxes, indexed 0 to 3, and a dashed fifth box labelled 404 that is out of range."
      className="mx-auto h-auto w-full max-w-[420px]"
    >
      <g fontFamily="var(--font-mono)" fontSize="15" textAnchor="middle">
        {CELLS.map((i) => {
          const x = x0 + i * (w + gap)
          return (
            <g key={i}>
              <rect x={x} y={y0} width={w} height={44} rx="6" fill="var(--paper-raised)" stroke="var(--ink)" strokeWidth="1.5" />
              <text x={x + w / 2} y={y0 + 28} fill="var(--ink)">
                p{i}
              </text>
              <text x={x + w / 2} y={y0 + 62} fontSize="12" fill="var(--ink-3)">
                {i}
              </text>
            </g>
          )
        })}
        <rect x={ghostX} y={y0} width={w + 8} height={44} rx="6" fill="var(--role-error-wash)" stroke="var(--role-error)" strokeWidth="2" strokeDasharray="5 4" />
        <text x={ghostX + (w + 8) / 2} y={y0 + 28} fill="var(--role-error)" fontWeight="600">
          p404
        </text>
        <text x={ghostX + (w + 8) / 2} y={y0 + 62} fontSize="12" fill="var(--role-error)">
          ✕ 404
        </text>
        {/* pointer, drawn above the missing box, with a tag as well as a colour */}
        <path d={`M${ghostX + (w + 8) / 2} ${y0 - 8} V${y0 - 2}`} stroke="var(--role-error)" strokeWidth="2" strokeLinecap="round" />
        <path d={`M${ghostX + (w + 8) / 2 - 5} ${y0 - 8} l5 6 l5 -6`} fill="none" stroke="var(--role-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x={ghostX + (w + 8) / 2} y={y0 - 14} fontSize="12" fill="var(--role-error)">
          you are here
        </text>
      </g>
      <text x={x0} y="26" fontFamily="var(--font-mono)" fontSize="13" fill="var(--ink-3)">
        pages = [p0, p1, p2, p3]
      </text>
    </svg>
  )
}

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[720px] flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <p className="t-eyebrow mb-4 text-center">404</p>
      <OutOfBounds />
      <h1 className="t-h1 mt-8 text-center text-ink">That page is not in the notebook.</h1>
      <p
        className="mt-4 rounded-card border border-rule bg-paper-sunken px-4 py-3 text-center font-mono text-[14px] text-error-ink"
        role="note"
      >
        IndexError: page 404 is out of range
      </p>
      <p className="t-body mt-5 text-center text-ink-2">
        The link may be old, or mistyped. Looking for a topic? Browse the lessons, or use the search on
        the Learn page.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button href="/learn" size="lg">
          Browse lessons
        </Button>
        <Button href="/map" variant="secondary" size="lg">
          Open the pattern map
        </Button>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center rounded-cell px-3 font-semibold text-coral-ink underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
        >
          Back to home
        </Link>
      </div>
    </main>
  )
}
