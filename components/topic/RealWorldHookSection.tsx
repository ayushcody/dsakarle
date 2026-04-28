export function RealWorldHookSection({ paragraphs, ahaMoment }: { paragraphs: string[]; ahaMoment: string }) {
  return (
    <section className="topic-section">
      <h2 className="topic-h2">Real World Hook</h2>
      <div className="space-y-4">
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className="font-dmsans text-[16px] leading-relaxed text-[var(--text-secondary)]">
            {paragraph}
          </p>
        ))}
      </div>
      <div className="mt-6 rounded-[var(--radius-sm)] bg-[var(--surface-amber)] px-5 py-4">
        <span className="font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--accent-amber)]">Aha Moment</span>
        <p className="mt-2 font-dmsans text-[15px] leading-relaxed text-[var(--text-primary)]">{ahaMoment}</p>
      </div>
    </section>
  );
}
