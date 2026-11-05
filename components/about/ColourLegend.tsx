import type { ReactNode } from 'react'

interface LegendRow {
  swatch: ReactNode
  name: string
  meaning: string
}

const box = 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-cell font-mono text-[14px] font-semibold'

const ROWS: LegendRow[] = [
  {
    swatch: (
      <span className={box} style={{ color: 'var(--role-ptr-a)', border: '1.5px solid var(--role-ptr-a)', background: 'var(--role-ptr-a-wash)' }}>
        ▲
      </span>
    ),
    name: 'Teal, with a ▲ tag below',
    meaning: 'The first pointer: the left, slow, low or previous one.',
  },
  {
    swatch: (
      <span className={box} style={{ color: 'var(--role-ptr-b)', border: '1.5px solid var(--role-ptr-b)', background: 'var(--role-ptr-b-wash)' }}>
        ▼
      </span>
    ),
    name: 'Indigo, with a ▼ tag above',
    meaning: 'The second pointer: the right, fast, high or current one.',
  },
  {
    swatch: (
      <span className={box} style={{ color: 'var(--ink)', border: '2px solid var(--role-focus)' }}>
        7
      </span>
    ),
    name: 'Coral, a solid ring',
    meaning: 'The element being processed right now.',
  },
  {
    swatch: (
      <span className={box} style={{ color: 'var(--ink)', border: '2px dashed var(--role-compare)' }}>
        3
      </span>
    ),
    name: 'Amber, a dashed outline',
    meaning: 'Two things being compared.',
  },
  {
    swatch: (
      <span className={box} style={{ color: 'var(--role-found)', border: '1.5px solid var(--role-found)', background: 'var(--role-found-wash)' }}>
        ✓
      </span>
    ),
    name: 'Green, with a ✓',
    meaning: 'The answer, or a step that worked.',
  },
  {
    swatch: (
      <span className={box} style={{ color: 'var(--role-error)', border: '1.5px solid var(--role-error)', background: 'var(--role-error-wash)' }}>
        ✕
      </span>
    ),
    name: 'Red, with a ✕',
    meaning: 'A rule was broken, or an answer was wrong.',
  },
]

/** The colour language of the Stage. Every colour is paired with a mark so none of it relies on colour alone. */
export function ColourLegend() {
  return (
    <ul className="divide-y divide-rule rounded-card border border-rule bg-paper-raised">
      {ROWS.map((row) => (
        <li key={row.name} className="flex items-start gap-3 p-3 sm:p-4">
          {row.swatch}
          <div className="min-w-0">
            <p className="text-[15px] font-semibold leading-6 text-ink">{row.name}</p>
            <p className="text-[14px] leading-5 text-ink-2">{row.meaning}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
