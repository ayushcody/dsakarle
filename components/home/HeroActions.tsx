'use client';

import { Button } from '@/components/ui';
import { useProgress } from '@/hooks/useProgress';
import { LESSONS, getLessonMeta, isCurriculumSlug } from '@/lib/curriculum';

/**
 * Hero buttons. The server (and the first client render) always show "Start with {first lesson}";
 * once mounted, a returning learner gets "Continue: {lesson}" instead.
 */
export function HeroActions() {
  const { progress, mounted } = useProgress();
  const first = LESSONS[0];
  const last = mounted && isCurriculumSlug(progress.lastVisited) ? getLessonMeta(progress.lastVisited) : undefined;

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
      <Button href={`/learn/${(last ?? first).slug}`} size="lg" trailingIcon="→" className="w-full sm:w-auto">
        {last ? `Continue: ${last.title}` : `Start with ${first.title}`}
      </Button>
      <Button href="/learn" variant="secondary" size="lg" className="w-full sm:w-auto">
        Browse all {LESSONS.length} lessons
      </Button>
    </div>
  );
}
