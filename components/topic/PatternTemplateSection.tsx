export function PatternTemplateSection({
  template,
}: {
  template: {
    pseudocode: string
    whenToUse: string
    timeComplexity: string
    spaceComplexity: string
  }
}) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
      <h2 className="section-heading">Section 08 — Pattern Template</h2>
      <pre className="overflow-x-auto rounded-[var(--radius-sm)] bg-[var(--bg-dark)] p-5 font-dmmono text-[13px] leading-relaxed text-white">
        {template.pseudocode}
      </pre>
      <div className="mt-6 rounded-[var(--radius-sm)] bg-[var(--surface-teal)] px-5 py-4">
        <span className="font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--accent-teal)]">When to Use This Pattern</span>
        <p className="mt-2 font-dmsans text-[15px] leading-relaxed text-[var(--text-primary)]">{template.whenToUse}</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] p-4">
          <span className="font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Time Complexity</span>
          <p className="mt-2 font-dmsans text-[15px] text-[var(--text-primary)]">{template.timeComplexity}</p>
        </div>
        <div className="rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] p-4">
          <span className="font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Space Complexity</span>
          <p className="mt-2 font-dmsans text-[15px] text-[var(--text-primary)]">{template.spaceComplexity}</p>
        </div>
      </div>
    </section>
  );
}
