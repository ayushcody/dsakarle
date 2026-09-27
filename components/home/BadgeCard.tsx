'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { getProgress } from '@/lib/progress';

interface BadgeCardProps {
  title: string;
  slug: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  minutes?: number;
  examples: number;
  badge: React.ReactNode;
}

const PILL = {
  beginner: 'badge-pill badge-pill-teal',
  intermediate: 'badge-pill badge-pill-amber',
  advanced: 'badge-pill badge-pill-coral',
};

export default function BadgeCard({ title, slug, difficulty, minutes, examples, badge }: BadgeCardProps) {
  const [state, setState] = useState<'new' | 'started' | 'done'>('new');

  useEffect(() => {
    const p = getProgress();
    setState(p.completedSections.includes(slug) ? 'done' : p.lastVisited === slug || p.quizScores[slug] ? 'started' : 'new');
  }, [slug]);

  return (
    <Link
      href={`/learn/${slug}`}
      className="group relative flex flex-col items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--white)] px-5 py-7 transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 hover:border-[var(--accent-coral)] hover:shadow-[var(--shadow-card-hover)]"
    >
      {state !== 'new' && (
        <span
          className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full ${state === 'done' ? 'bg-[var(--accent-amber)] shadow-[0_0_0_4px_var(--surface-amber)]' : 'bg-[var(--accent-teal)]'}`}
          aria-label={state === 'done' ? 'Completed' : 'In progress'}
        />
      )}
      <div className="transition-transform duration-200 group-hover:rotate-3">
        {badge}
      </div>
      <h3 className="mt-2 text-center font-dmsans text-[15px] font-medium leading-tight text-[var(--text-primary)]">{title}</h3>
      <span className={PILL[difficulty] ?? 'badge-pill'}>{difficulty}</span>
      <span className="font-dmsans text-xs text-[var(--text-muted)] tabular-nums">
        {minutes ? `${minutes} min` : ''}{minutes && examples ? ' · ' : ''}{examples ? `${examples} examples` : ''}
      </span>
    </Link>
  );
}
