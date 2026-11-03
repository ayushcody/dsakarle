'use client';

import { CURRICULUM, lessonsInGroup } from '@/lib/curriculum';
import { useProgress } from '@/hooks/useProgress';
import { LessonRow } from './LessonRow';

/**
 * The table of contents: both groups, every lesson, numbered in learning order.
 * Done marks come from saved progress and appear only after mount.
 */
export function CourseToc() {
  const { progress, mounted } = useProgress();
  const completed = new Set(mounted ? progress.completedSections : []);

  return (
    <div className="space-y-12 md:space-y-16">
      {CURRICULUM.groups.map((group) => {
        const lessons = lessonsInGroup(group.id);
        const liveCount = lessons.filter((l) => l.status === 'live').length;
        return (
          <section key={group.id} id={group.id} aria-labelledby={`group-${group.id}`} className="scroll-mt-24">
            <header className="mb-2 flex flex-col gap-1 border-b border-rule-strong pb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
              <div>
                <h2 id={`group-${group.id}`} className="t-h2 text-ink">
                  {group.title}
                </h2>
                <p className="t-small mt-1 text-ink-2">{group.blurb}</p>
              </div>
              <p className="t-caption shrink-0 text-ink-3">
                {lessons.length} lessons · {liveCount} live
              </p>
            </header>
            <ol>
              {lessons.map((lesson) => (
                <LessonRow key={lesson.slug} lesson={lesson} done={completed.has(lesson.slug)} />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
