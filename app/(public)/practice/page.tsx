'use client';

import { useEffect, useMemo, useState } from 'react';

import { PRACTICE_PROBLEMS, type PracticeHubProblem } from '@/content/practice-problems';
import { getPracticeState, markAttempted, toggleSolved } from '@/lib/practiceProgress';

const DIFF_STYLE: Record<PracticeHubProblem['difficulty'], string> = {
  easy: 'bg-[var(--surface-success)] text-[var(--state-success)]',
  medium: 'bg-[var(--surface-amber)] text-[var(--accent-amber)]',
  hard: 'bg-[var(--surface-coral)] text-[var(--accent-coral)]',
};

const TOPICS = Array.from(new Map(PRACTICE_PROBLEMS.map((p) => [p.topicSlug, p.topicTitle])));

function ProblemRow({
  prob,
  solved,
  onToggle,
  onAttempt,
}: {
  prob: PracticeHubProblem
  solved: boolean
  onToggle: () => void
  onAttempt: () => void
}) {
  const [hints, setHints] = useState(0);

  useEffect(() => {
    setHints(Number(sessionStorage.getItem(`hint:${prob.url}`) ?? 0));
  }, [prob.url]);

  const nextHint = () => {
    const n = Math.min(hints + 1, 2);
    sessionStorage.setItem(`hint:${prob.url}`, String(n));
    setHints(n);
  };

  return (
    <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-secondary)] transition-colors">
      <div className="flex items-start gap-4">
        <button
          onClick={onToggle}
          aria-label={solved ? `Mark ${prob.title} unsolved` : `Mark ${prob.title} solved`}
          className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${solved ? 'bg-[var(--surface-success)] text-[var(--state-success)]' : 'bg-[var(--bg-primary)] border border-[var(--border-strong)] hover:border-[var(--state-success)]'}`}
        >
          {solved && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
          )}
        </button>
        <div>
          <h3 className="font-dmsans font-bold text-lg text-[var(--text-primary)] mb-2">{prob.title}</h3>
          <div className="flex flex-wrap gap-2">
            <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm ${DIFF_STYLE[prob.difficulty]}`}>{prob.difficulty}</span>
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-muted)]">{prob.topicTitle}</span>
          </div>
          {hints > 0 && (
            <div className="mt-3 space-y-1 font-dmsans text-sm text-[var(--text-secondary)]">
              <p>💡 Pattern: <strong className="text-[var(--text-primary)]">{prob.topicTitle}</strong></p>
              {hints > 1 && <p>🧭 Approach: {prob.keyInsight}</p>}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-3 flex-shrink-0">
        {hints < 2 && (
          <button onClick={nextHint} className="px-4 py-2.5 rounded-full font-dmsans font-bold text-sm border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-amber)] hover:text-[var(--accent-amber)] transition-colors">
            Hint {hints + 1}/2
          </button>
        )}
        <a
          href={prob.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onAttempt}
          className={`px-6 py-2.5 rounded-full font-dmsans font-bold text-sm transition-all shadow-sm ${solved ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-secondary)]' : 'bg-[var(--accent-coral)] text-white hover:bg-[var(--accent-coral-dark)]'}`}
        >
          {solved ? 'Solve Again' : 'Solve'}
        </a>
      </div>
    </div>
  );
}

export default function PracticePage() {
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [topic, setTopic] = useState('all');
  const [view, setView] = useState<'list' | 'topic'>('list');
  const [state, setState] = useState(() => ({ solved: [] as string[], attempted: [] as string[], streak: 0 }));

  const refresh = () => setState(getPracticeState());
  useEffect(refresh, []);

  const solved = useMemo(() => new Set(state.solved), [state.solved]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return PRACTICE_PROBLEMS.filter(
      (p) =>
        (p.title.toLowerCase().includes(q) || p.keyInsight.toLowerCase().includes(q)) &&
        (difficulty === 'all' || p.difficulty === difficulty) &&
        (topic === 'all' || p.topicSlug === topic),
    );
  }, [query, difficulty, topic]);

  const accuracy = state.attempted.length ? Math.round((state.solved.length / state.attempted.length) * 100) : 0;
  const recommended = TOPICS.find(([slug]) => PRACTICE_PROBLEMS.some((p) => p.topicSlug === slug && !solved.has(p.url)));

  const row = (p: PracticeHubProblem) => (
    <ProblemRow
      key={p.url}
      prob={p}
      solved={solved.has(p.url)}
      onToggle={() => { toggleSolved(p.url); refresh(); }}
      onAttempt={() => { markAttempted(p.url); refresh(); }}
    />
  );

  const selectCls = 'px-4 py-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--white)] text-[var(--text-primary)] font-dmsans focus:outline-none focus:border-[var(--accent-coral)]';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <h1 className="font-dmsans text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">Practice Hub</h1>
        <p className="font-dmsans text-[var(--text-secondary)] text-lg max-w-2xl">
          {PRACTICE_PROBLEMS.length} curated LeetCode problems, mapped to the pattern that cracks them.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 mb-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-[var(--white)] p-6 rounded-[var(--radius)] border border-[var(--border)] shadow-[var(--shadow-card)]">
          <p className="font-dmsans text-sm font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">Solved</p>
          <p className="font-dmsans text-3xl font-bold text-[var(--text-primary)] tabular-nums">{solved.size}/{PRACTICE_PROBLEMS.length}</p>
        </div>
        <div className="bg-[var(--white)] p-6 rounded-[var(--radius)] border border-[var(--border)] shadow-[var(--shadow-card)]">
          <p className="font-dmsans text-sm font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">Day Streak</p>
          <p className="font-dmsans text-3xl font-bold text-[var(--accent-coral)] tabular-nums">{state.streak} <span className="text-xl">{state.streak === 1 ? 'day' : 'days'}</span></p>
        </div>
        <div className="bg-[var(--white)] p-6 rounded-[var(--radius)] border border-[var(--border)] shadow-[var(--shadow-card)]">
          <p className="font-dmsans text-sm font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">Accuracy</p>
          <p className="font-dmsans text-3xl font-bold text-[var(--state-success)] tabular-nums">{accuracy}%</p>
        </div>
        <button
          onClick={() => recommended && (setTopic(recommended[0]), setView('list'))}
          className="text-left bg-[var(--bg-secondary)] p-6 rounded-[var(--radius)] border border-[rgba(217,155,38,0.5)] shadow-[var(--shadow-card)] hover:-translate-y-0.5 transition-transform"
        >
          <p className="font-dmsans text-sm font-semibold text-[var(--accent-amber)] uppercase tracking-widest mb-1">Up Next</p>
          <p className="font-dmsans text-xl font-bold text-[var(--text-primary)] mt-1">{recommended ? `${recommended[1]} set` : 'All done 🎉'}</p>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <input
          type="search"
          placeholder="Search problems..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`w-full md:max-w-md ${selectCls}`}
        />
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={selectCls}>
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className={selectCls}>
            <option value="all">All Topics</option>
            {TOPICS.map(([slug, title]) => <option key={slug} value={slug}>{title}</option>)}
          </select>
          <div className="flex rounded-full border border-[var(--border)] p-1 bg-[var(--white)]">
            {(['list', 'topic'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-full font-dmsans text-sm font-bold capitalize transition-colors ${view === v ? 'bg-[var(--accent-coral)] text-white' : 'text-[var(--text-secondary)]'}`}
              >
                {v} view
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-4">
        {view === 'list' ? (
          <div className="bg-[var(--white)] rounded-[var(--radius)] border border-[var(--border)] overflow-hidden shadow-[var(--shadow-card)]">
            {filtered.map(row)}
            {filtered.length === 0 && <p className="p-12 text-center text-[var(--text-muted)] font-dmsans">No problems match these filters.</p>}
          </div>
        ) : (
          TOPICS.map(([slug, title]) => {
            const items = filtered.filter((p) => p.topicSlug === slug);
            if (!items.length) return null;
            const done = items.filter((p) => solved.has(p.url)).length;
            const pct = done / items.length;
            return (
              <details key={slug} open className="group bg-[var(--white)] rounded-[var(--radius)] border border-[var(--border)] overflow-hidden shadow-[var(--shadow-card)]">
                <summary className="flex items-center gap-4 px-6 py-4 cursor-pointer list-none">
                  <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90 flex-shrink-0">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border)" strokeWidth="4" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="var(--accent-teal)" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${pct * 94.2} 94.2`} />
                  </svg>
                  <span className="font-dmsans font-bold text-lg text-[var(--text-primary)] flex-1">{title}</span>
                  <span className="font-dmmono text-sm text-[var(--text-muted)] tabular-nums">{done}/{items.length}</span>
                  <span className="text-[var(--text-muted)] transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <div className="border-t border-[var(--border)]">{items.map(row)}</div>
              </details>
            );
          })
        )}
      </div>
    </div>
  );
}
