import type { WorkedExample } from '@/types/learning';

import { ExampleCard } from './ExampleCard';

export function WorkedExamplesSection({ examples }: { examples: WorkedExample[] }) {
  return (
    <section id="worked-examples" className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
      <h2 className="section-heading">Section 10 — Worked Examples</h2>
      <div className="space-y-4">
        {examples.map((example) => (
          <ExampleCard key={example.title} example={example} />
        ))}
      </div>
    </section>
  );
}
