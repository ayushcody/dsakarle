import { DiagramRouter } from '@/components/diagrams/DiagramRouter';

export function MentalModelSection({
  metaphor,
  clickSentence,
  diagramType,
  cells = [],
  diagramState = {},
}: {
  metaphor: string[]
  clickSentence: string
  diagramType: string
  cells?: Array<number | string>
  diagramState?: Record<string, unknown>
}) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
      <h2 className="section-heading">Section 04 — Mental Model</h2>
      <div className="space-y-4">
        {metaphor.map((line) => (
          <p key={line} className="font-dmsans text-[16px] leading-relaxed text-[var(--text-secondary)]">
            {line}
          </p>
        ))}
      </div>
      <div className="mt-6">
        <DiagramRouter diagramType={diagramType} cells={cells} diagramState={diagramState} />
      </div>
      <div className="mt-6 rounded-[var(--radius-sm)] bg-[var(--surface-teal)] px-5 py-4">
        <span className="font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--accent-teal)]">What Makes It Click</span>
        <p className="mt-2 font-dmsans text-[15px] leading-relaxed text-[var(--text-primary)]">{clickSentence}</p>
      </div>
    </section>
  );
}
