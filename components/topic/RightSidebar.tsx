'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { getProgress } from '@/lib/progress';

export type OutlineItem = { id: string; label: string };

export function RightSidebar({ topicId, outline, quizTotal }: { topicId: string; outline: OutlineItem[]; quizTotal: number }) {
  const [active, setActive] = useState(outline[0]?.id);
  const [stats, setStats] = useState({ done: false, concept: 0, recognition: false });

  useEffect(() => {
    const sync = () => {
      const p = getProgress();
      const q = p.quizScores[topicId];
      setStats({ done: p.completedSections.includes(topicId), concept: q?.concept ?? 0, recognition: !!q?.recognition });
    };
    sync();
    window.addEventListener('dsakarle:progress', sync);
    return () => window.removeEventListener('dsakarle:progress', sync);
  }, [topicId]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-30% 0px -60% 0px' },
    );
    outline.forEach((o) => { const el = document.getElementById(o.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [outline]);

  const checks = [
    { label: 'Pattern recognised', ok: stats.recognition },
    { label: `Concept quiz ${stats.concept}/${quizTotal}`, ok: quizTotal > 0 && stats.concept === quizTotal },
    { label: 'Topic marked complete', ok: stats.done },
  ];

  return (
    <aside className="relative hidden w-[240px] flex-shrink-0 lg:block">
      <div className="sticky top-[88px] flex flex-col gap-8">
        <nav aria-label="Lesson outline">
          <h3 className="mb-3 font-dmsans text-sm font-bold text-[var(--text-primary)]">On this page</h3>
          <ul className="space-y-1 border-l border-[var(--border)]">
            {outline.map((item) => (
              <li key={item.id}>
                <Link
                  href={`#${item.id}`}
                  className={`-ml-px block border-l-2 py-1.5 pl-4 font-dmsans text-sm transition-colors ${active === item.id ? 'border-[var(--accent-coral)] font-medium text-[var(--accent-coral)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="mb-3 font-dmsans text-sm font-bold text-[var(--text-primary)]">Your progress</h3>
          <ul className="space-y-2">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-3 font-dmsans text-sm text-[var(--text-secondary)]">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${c.ok ? 'bg-[var(--accent-teal)] text-white' : 'border border-[var(--border-strong)]'}`}>
                  {c.ok && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 13l4 4L19 7" /></svg>}
                </span>
                <span className="tabular-nums">{c.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link href="/practice" className="inline-flex items-center gap-2 self-start rounded-md border border-[var(--accent-coral)] px-4 py-2 font-dmsans text-xs font-bold text-[var(--accent-coral)] transition-colors hover:bg-[var(--accent-coral)] hover:text-white">
          Practice this topic →
        </Link>
      </div>
    </aside>
  );
}
