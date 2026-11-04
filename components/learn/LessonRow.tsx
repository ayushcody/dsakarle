import Link from 'next/link';

import { Glyph } from '@/components/glyph';
import { Chip, cn } from '@/components/ui';
import { getLessonMeta, lessonNumber } from '@/lib/curriculum';
import type { CurriculumLesson } from '@/types/learning';

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

function CheckMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-role-found" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5l3.2 3.2L13 4.8" />
    </svg>
  );
}

/**
 * One line of the table of contents. The title link is stretched over the whole
 * row; prerequisite links sit above it, so there are no nested anchors.
 */
export function LessonRow({ lesson, done }: { lesson: CurriculumLesson; done: boolean }) {
  const number = String(lessonNumber(lesson.slug)).padStart(2, '0');
  const isLive = lesson.status === 'live';
  const prereqs = lesson.prereqs
    .map((slug) => getLessonMeta(slug))
    .filter((p): p is CurriculumLesson => p !== undefined);

  return (
    <li className="relative border-b border-rule last:border-b-0 transition-colors duration-150 hover:bg-paper-raised">
      <div className="flex gap-3 px-2 py-3 sm:px-3 md:py-3.5">
        <span aria-hidden="true" className="w-7 shrink-0 pt-[3px] font-mono text-[13px] leading-6 text-ink-3">
          {number}
        </span>

        <div className="grid min-w-0 flex-1 grid-cols-1 gap-x-4 md:grid-cols-[1fr_auto]">
          {/* Title, with the dotted leader running to the chips on desktop. */}
          <div className="flex min-w-0 items-center gap-3 md:col-start-1 md:row-start-1">
            <Glyph id={lesson.glyph} size={24} decorative className="text-ink-2" />
            <Link
              href={`/learn/${lesson.slug}`}
              data-row-link=""
              className={cn(
                'min-h-[40px] py-1.5 font-serif text-[19px] font-semibold leading-7 text-ink outline-none',
                'after:absolute after:inset-0 after:rounded-cell',
                'hover:text-coral-ink',
                'focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-[var(--focus-ring)]',
              )}
            >
              {lesson.title}
            </Link>
            {done ? (
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-found-ink">
                <CheckMark />
                <span className="sr-only">Completed</span>
              </span>
            ) : null}
            <span aria-hidden="true" className="hidden h-px min-w-6 flex-1 translate-y-1 border-b border-dotted border-rule-strong md:block" />
          </div>

          <p className="t-small mt-1 pl-9 text-ink-2 md:col-span-2 md:row-start-2">{lesson.oneLiner}</p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-9 md:col-start-2 md:row-start-1 md:mt-0 md:pl-0">
            <Chip>{lesson.minutes} min</Chip>
            <Chip>{DIFFICULTY_LABEL[lesson.difficulty] ?? lesson.difficulty}</Chip>
            {isLive ? (
              <Chip variant="coral">Live</Chip>
            ) : (
              <Chip className="border-dashed">Draft</Chip>
            )}
          </div>

          {prereqs.length > 0 ? (
            <p className="t-small mt-1.5 pl-9 text-ink-3 md:col-span-2 md:row-start-3">
              <span>after: </span>
              {prereqs.map((p, i) => (
                <span key={p.slug}>
                  {i > 0 ? <span aria-hidden="true">, </span> : null}
                  <Link
                    href={`/learn/${p.slug}`}
                    className="relative z-10 -my-2 inline-flex min-h-[44px] items-center rounded-cell px-1 text-ink-2 underline decoration-rule-strong underline-offset-2 hover:text-coral-ink hover:decoration-coral focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--focus-ring)]"
                  >
                    {p.title}
                  </Link>
                </span>
              ))}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}
