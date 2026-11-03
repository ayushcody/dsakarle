'use client';

import { LESSONS, liveLessons } from '@/lib/curriculum';
import { countCompletedLessons } from '@/lib/course';
import { useProgress } from '@/hooks/useProgress';

/**
 * Overall progress. Server and first client render show a neutral count
 * (no stored progress is read until mounted), so hydration always matches.
 */
export function ProgressLine() {
  const { progress, mounted } = useProgress();
  const total = LESSONS.length;
  const live = liveLessons().length;
  const done = mounted ? countCompletedLessons(progress.completedSections) : 0;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="flex flex-col gap-2 sm:max-w-md">
      <p className="t-small text-ink-2">
        {mounted && done > 0 ? (
          <>
            <span className="font-semibold text-ink">{done}</span> of {total} lessons done
          </>
        ) : (
          <>{total} lessons</>
        )}
        <span aria-hidden="true"> · </span>
        {live} live
      </p>
      <div
        role="progressbar"
        aria-label="Lessons completed"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        className="h-1.5 w-full overflow-hidden rounded-pill bg-paper-sunken"
      >
        <div className="h-full rounded-pill bg-coral transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
