'use client';

import Link from 'next/link';

import { cn, focusRing } from '@/components/ui/cn';

import { usePathProgress } from './usePathProgress';

export interface LessonRowData {
  slug: string
  title: string
  oneLiner: string
  minutes: number
  difficulty: string
}

/** The lessons of one section. `allSlugs` is the whole path (so "next up" is path-wide). */
export function LessonRows({ lessons, allSlugs }: { lessons: LessonRowData[]; allSlugs: string[] }) {
  const p = usePathProgress(allSlugs);

  return (
    <ul className="divide-y divide-rule overflow-hidden rounded-card border border-rule bg-paper-raised">
      {lessons.map((lesson) => {
        const done = p.mounted && p.completed.has(lesson.slug);
        const next = p.mounted && p.nextSlug === lesson.slug;
        return (
          <li key={lesson.slug}>
            <Link
              href={`/learn/${lesson.slug}`}
              className={cn(
                'flex min-h-[64px] items-center gap-4 px-4 py-3 hover:bg-paper-sunken sm:px-5',
                focusRing,
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                  done ? 'border-coral-ink bg-coral-ink text-paper' : 'border-rule-strong',
                  next && 'border-coral-ink ring-4 ring-coral-wash',
                )}
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="t-eyebrow block">Lesson</span>
                <span className="block text-[16px] font-semibold leading-6 text-ink">
                  {lesson.title}
                  {done ? <span className="sr-only"> (completed)</span> : null}
                  {next ? <span className="sr-only"> (up next)</span> : null}
                </span>
                <span className="block text-[14px] leading-5 text-ink-3">{lesson.oneLiner}</span>
              </span>
              <span className="shrink-0 text-right text-[13px] leading-5 text-ink-3">
                <span className="block tabular-nums">{lesson.minutes} min</span>
                <span className="block capitalize">{lesson.difficulty}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
