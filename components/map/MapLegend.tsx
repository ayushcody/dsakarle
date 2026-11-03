/** What the lines and tiles mean. Drawn with the same tokens as the map. */
function Swatch({ children }: { children: React.ReactNode }) {
  return (
    <svg width="40" height="22" viewBox="0 0 40 22" fill="none" aria-hidden="true" className="shrink-0">
      {children}
    </svg>
  );
}

export function MapLegend() {
  const item = 'flex items-center gap-2';
  return (
    <ul aria-label="Legend" className="t-small flex flex-wrap gap-x-6 gap-y-2 text-ink-2">
      <li className={item}>
        <Swatch>
          <path d="M3 11H30" style={{ stroke: 'var(--ink-3)' }} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M27 6.5L33 11L27 15.5" style={{ stroke: 'var(--ink-3)' }} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </Swatch>
        Learn first (arrow points onward)
      </li>
      <li className={item}>
        <Swatch>
          <path d="M3 11H36" style={{ stroke: 'var(--rule-strong)' }} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 5" />
        </Swatch>
        Related
      </li>
      <li className={item}>
        <Swatch>
          <circle cx="20" cy="11" r="8" style={{ fill: 'var(--role-ptr-a-wash)', stroke: 'var(--ink)' }} strokeWidth="2" />
        </Swatch>
        Data structure
      </li>
      <li className={item}>
        <Swatch>
          <rect x="12" y="3" width="16" height="16" rx="5" style={{ fill: 'var(--coral-wash)', stroke: 'var(--ink)' }} strokeWidth="2" />
        </Swatch>
        Algorithm or pattern
      </li>
      <li className={item}>
        <Swatch>
          <rect x="12" y="3" width="16" height="16" rx="5" style={{ fill: 'none', stroke: 'var(--ink)' }} strokeWidth="2.25" />
        </Swatch>
        Live
      </li>
      <li className={item}>
        <Swatch>
          <rect x="12" y="3" width="16" height="16" rx="5" style={{ fill: 'none', stroke: 'var(--ink-2)' }} strokeWidth="1.5" strokeDasharray="4 3" />
        </Swatch>
        Draft
      </li>
    </ul>
  );
}
