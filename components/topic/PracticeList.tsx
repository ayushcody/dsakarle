import type { PracticeProblem } from '@/types/learning';

export function PracticeList({ problems }: { problems: PracticeProblem[] }) {
  const badgeClass = {
    easy: 'badge-pill badge-pill-teal',
    medium: 'badge-pill badge-pill-amber',
    hard: 'badge-pill badge-pill-coral',
  };

  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
      <h2 className="topic-h2" style={{ marginTop: 0 }}>Practice Problems</h2>
      <div className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)]">
        <table className="w-full border-collapse text-left">
          <thead className="bg-[var(--bg-secondary)]">
            <tr>
              <th className="px-4 py-3 font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Problem</th>
              <th className="px-4 py-3 font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Difficulty</th>
              <th className="px-4 py-3 font-dmmono text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Key Insight</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem) => (
              <tr key={problem.title} className="border-t border-[var(--border)]">
                <td className="px-4 py-4">
                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-dmsans text-[15px] font-medium text-[var(--text-primary)] hover:text-[var(--accent-coral)]"
                  >
                    {problem.title}
                  </a>
                </td>
                <td className="px-4 py-4">
                  <span className={badgeClass[problem.difficulty]}>{problem.difficulty}</span>
                </td>
                <td className="px-4 py-4 font-dmsans text-sm text-[var(--text-secondary)]">{problem.keyInsight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default PracticeList;
