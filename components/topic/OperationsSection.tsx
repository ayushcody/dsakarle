import type { OperationBlock } from '@/types/learning';

export function OperationsSection({ operations }: { operations: OperationBlock[] }) {
  return (
    <section className="topic-section">
      <h2 className="topic-h2">Operations Deep Dive</h2>
      <div className="space-y-8">
        {operations.map((operation) => (
          <article key={operation.name} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-primary)] p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-dmsans text-xl font-semibold text-[var(--text-primary)]">{operation.name}</h3>
              <span className="badge-pill badge-pill-teal">Time {operation.timeComplexity}</span>
              <span className="badge-pill badge-pill-amber">Space {operation.spaceComplexity}</span>
            </div>
            <p className="mt-3 font-dmsans text-[15px] leading-relaxed text-[var(--text-secondary)]">{operation.description}</p>
            <pre className="mt-4 overflow-x-auto rounded-[var(--radius-sm)] bg-[var(--bg-dark)] p-4 font-dmmono text-[13px] leading-relaxed text-white">
              {operation.code.python}
            </pre>
            <div className="mt-4 rounded-[var(--radius-sm)] bg-[var(--surface-coral)] px-4 py-3">
              <span className="font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--accent-coral)]">What Changes Visually?</span>
              <p className="mt-2 font-dmsans text-[14px] leading-relaxed text-[var(--text-primary)]">{operation.visualNote}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
