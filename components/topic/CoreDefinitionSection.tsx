import type { VocabularyItem } from '@/types/learning';

export function CoreDefinitionSection({
  technicalDefinition,
  vocabulary,
  keyProperties,
}: {
  technicalDefinition: string
  vocabulary: VocabularyItem[]
  keyProperties: string[]
}) {
  return (
    <section className="topic-section">
      <h2 className="topic-h2">Core Definition</h2>
      <p className="font-dmsans text-[16px] leading-relaxed text-[var(--text-secondary)]">{technicalDefinition}</p>
      <div className="mt-6 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)]">
        <table className="w-full border-collapse text-left">
          <thead className="bg-[var(--bg-secondary)]">
            <tr>
              <th className="px-4 py-3 font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Term</th>
              <th className="px-4 py-3 font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Definition</th>
            </tr>
          </thead>
          <tbody>
            {vocabulary.map((item) => (
              <tr key={item.term} className="border-t border-[var(--border)]">
                <td className="px-4 py-3 font-dmmono text-sm text-[var(--text-primary)]">{item.term}</td>
                <td className="px-4 py-3 font-dmsans text-sm text-[var(--text-secondary)]">{item.definition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-6 space-y-3">
        {keyProperties.map((property) => (
          <li key={property} className="font-dmsans text-[15px] text-[var(--text-primary)]">
            • {property}
          </li>
        ))}
      </ul>
    </section>
  );
}
