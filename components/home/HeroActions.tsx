'use client';

import { Button } from '@/components/ui';
import { useProgress } from '@/hooks/useProgress';
import { pathLessons } from '@/lib/curriculum';

/**
 * Hero buttons. The server (and first client render) always point at the first Foundations lesson;
 * once mounted, a returning learner is sent to the first Foundations lesson they have not finished.
 */
export function HeroActions() {
  const { progress, mounted } = useProgress();
  const lessons = pathLessons('foundations');
  const done = mounted ? lessons.filter((l) => progress.completedSections.includes(l.slug)) : [];
  const next = lessons.find((l) => !done.includes(l)) ?? lessons[0];
  const slug = next?.slug ?? 'arrays';

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
      <Button href={`/learn/${slug}`} size="lg" trailingIcon="→" className="w-full sm:w-auto">
        {done.length > 0 && done.length < lessons.length ? 'Continue Foundations' : 'Start with Foundations'}
      </Button>
      <Button href="/paths" variant="secondary" size="lg" className="w-full sm:w-auto">
        Explore paths
      </Button>
    </div>
  );
}
