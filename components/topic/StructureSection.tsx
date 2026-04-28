import type { CodeLanguage, MemoryLayoutRow } from '@/types/learning';

const LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  java: 'Java',
  cpp: 'C++',
};

export function StructureSection({
  memoryDescription,
  definitionCode,
  memoryLayout,
}: {
  memoryDescription: string[]
  definitionCode: Record<CodeLanguage, string>
  memoryLayout: MemoryLayoutRow[]
}) {
  return (
    <section className="topic-section">
      <h2 className="topic-h2">Structure / Memory Layout</h2>
      <div className="space-y-4">
        {memoryDescription.map((paragraph) => (
          <p key={paragraph} className="font-dmsans text-[16px] leading-relaxed text-[var(--text-secondary)]">
            {paragraph}
          </p>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {Object.entries(definitionCode).map(([language, code]) => (
          <div key={language} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <span className="font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
              {LANGUAGE_LABELS[language as CodeLanguage]}
            </span>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-dmmono text-[13px] leading-relaxed text-[var(--text-primary)]">
              {code}
            </pre>
          </div>
        ))}
      </div>
      <div className="mt-6 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)]">
        <table className="w-full border-collapse text-left">
          <thead className="bg-[var(--bg-secondary)]">
            <tr>
              <th className="px-4 py-3 font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Memory Field</th>
              <th className="px-4 py-3 font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Meaning</th>
            </tr>
          </thead>
          <tbody>
            {memoryLayout.map((row) => (
              <tr key={row.label} className="border-t border-[var(--border)]">
                <td className="px-4 py-3 font-dmmono text-sm text-[var(--text-primary)]">{row.label}</td>
                <td className="px-4 py-3 font-dmsans text-sm text-[var(--text-secondary)]">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
