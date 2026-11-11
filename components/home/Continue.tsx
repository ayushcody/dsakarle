'use client';

import { GlyphTile } from '@/components/glyph';
import { Button } from '@/components/ui';
import { useProgress } from '@/hooks/useProgress';
import { LESSONS, getLessonMeta, isCurriculumSlug } from '@/lib/curriculum';

/** Client-only: renders nothing on the server or for a first-time visitor. */
export function Continue() {
  const { progress, mounted } = useProgress();
  if (!mounted) return null;

  const done = LESSONS.filter((l) => progress.completedSections.includes(l.slug)).length;
  const last = isCurriculumSlug(progress.lastVisited) ? getLessonMeta(progress.lastVisited) : undefined;
  if (!last && done === 0) return null;

  const total = LESSONS.length;
  const pct = Math.round((done / total) * 100);

  return (
    <section aria-labelledby="continue-title" className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <p className="t-eyebrow">Continue where you left off</p>
      <div className="mt-6 flex flex-col gap-6 rounded-card border border-rule bg-paper-raised p-5 sm:flex-row sm:items-center sm:p-6">
        {last ? <GlyphTile id={last.glyph} tileSize={48} glyphSize={48} decorative /> : null}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 id="continue-title" className="t-h3 text-ink">
            {last ? last.title : 'Your progress'}
          </h2>
          {last ? <p className="t-small text-ink-2">{last.oneLiner}</p> : null}
          <div className="mt-3 flex items-center gap-3">
            <div
              role="progressbar"
              aria-label="Lessons completed"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={done}
              className="h-2 w-full max-w-[18rem] overflow-hidden rounded-pill bg-paper-sunken"
            >
              <div className="h-full rounded-pill bg-coral" style={{ width: `${pct}%` }} />
            </div>
            <span className="t-caption whitespace-nowrap text-ink-3">
              {done} of {total} lessons done
            </span>
          </div>
        </div>
        {last ? (
          <Button href={`/learn/${last.slug}`} size="md" trailingIcon="→" className="w-full sm:w-auto">
            Continue
          </Button>
        ) : null}
      </div>
    </section>
  );
}
