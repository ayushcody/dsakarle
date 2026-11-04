'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import { useProgress } from '@/hooks/useProgress';
import { COURSE_TOPICS, countCompletedLessons, getCourseProgressPercent } from '@/lib/course';

export interface OutlineItem {
  id: string
  label: string
}

export interface StepProgressItem {
  key: string
  label: string
  done: boolean
}

export function RightSidebar({ outline, steps }: { outline: OutlineItem[]; steps?: StepProgressItem[] }) {
  const { progress, mounted } = useProgress();
  const [activeId, setActiveId] = useState(outline[0]?.id ?? '');
  const hasSteps = steps !== undefined; // v2 lessons: a sticky strip sits under the header

  const completedLessons = mounted ? countCompletedLessons(progress.completedSections) : 0;
  const totalLessons = COURSE_TOPICS.length;
  const percent = mounted ? getCourseProgressPercent(progress.completedSections) : 0;

  // Scroll-spy: highlight the last section whose heading has passed the top bar.
  useEffect(() => {
    setActiveId(outline[0]?.id ?? '');

    const elements = outline
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0 || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        }
        const firstVisible = outline.find((item) => visible.has(item.id));
        if (firstVisible) {
          setActiveId(firstVisible.id);
        }
      },
      { rootMargin: hasSteps ? '-120px 0px -60% 0px' : '-88px 0px -60% 0px' },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [outline, hasSteps]);

  return (
    <aside aria-label="Lesson outline and progress" className="w-[280px] hidden xl:block flex-shrink-0 relative">
      {/* Sticks below the site header (64px), and below the lesson strip (~49px) on v2 lessons; scrolls itself if taller than the viewport. */}
      <div
        className={`sticky flex flex-col gap-8 overflow-y-auto pb-4 ${steps ? 'top-[7.5rem] max-h-[calc(100vh-8.5rem)]' : 'top-[88px] max-h-[calc(100vh-6.5rem)]'}`}
      >
        
        {/* This lesson's steps (v2 lessons) */}
        {steps && steps.length > 0 && (
          <div aria-label="This lesson">
            <h3 className="font-dmsans font-bold text-sm text-[var(--text-primary)] mb-3">
              This lesson · {steps.filter((step) => step.done).length} of {steps.length}
            </h3>
            <ol className="flex gap-1.5" aria-label="Lesson steps">
              {steps.map((step) => (
                <li
                  key={step.key}
                  title={`${step.label}${step.done ? ' (done)' : ''}`}
                  className={`h-1.5 flex-1 rounded-full ${step.done ? 'bg-[var(--accent-coral)]' : 'bg-[var(--border-strong)]'}`}
                >
                  <span className="sr-only">{step.label}{step.done ? ', done' : ''}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Lesson Outline */}
        {outline.length > 0 && (
          <div>
            <h3 className="font-dmsans font-bold text-sm text-[var(--text-primary)] mb-4">Lesson Outline</h3>
            <ul className="space-y-3">
              {outline.map((item, i) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={`font-dmsans text-sm block px-3 py-2 rounded-md transition-colors ${item.id === activeId ? 'bg-[var(--surface-coral)] text-coral-ink font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    {i + 1}. {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Your Progress */}
        <div>
          <h3 className="font-dmsans font-bold text-sm text-[var(--text-primary)] mb-4">Your Progress</h3>
          <div className="bg-[var(--white)] border border-[var(--border)] rounded-xl p-6 flex flex-col items-center justify-center shadow-sm">
            {/* Circle progress (path length normalised to 100) */}
            <div className="relative w-24 h-24 mb-4">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-[var(--bg-secondary)]"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[var(--accent-coral)]"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${percent}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-dmsans font-bold text-xl text-[var(--text-primary)]">{percent}%</span>
                <span className="font-dmsans text-[8px] uppercase tracking-widest text-[var(--text-muted)] font-bold">Completed</span>
              </div>
            </div>
            <p className="font-dmsans text-xs text-[var(--text-secondary)] font-medium">{completedLessons} / {totalLessons} lessons done</p>
          </div>
        </div>

        {/* Study Tip */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[var(--accent-amber)]">💡</span>
            <h3 className="font-dmsans font-bold text-sm text-[var(--text-primary)]">Study Tip</h3>
          </div>
          <p className="font-dmsans text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
            Try solving one easy problem now to lock in the concept!
          </p>
          <Link href="/practice" className="inline-flex items-center gap-2 px-4 py-2 min-h-10 border border-coral-ink text-coral-ink font-dmsans font-bold text-xs rounded-md hover:bg-coral-ink hover:text-paper transition-colors">
            Solve Problem &rarr;
          </Link>
        </div>

      </div>
    </aside>
  );
}
