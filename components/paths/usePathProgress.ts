'use client';

import { useProgress } from '@/hooks/useProgress';

export interface PathProgressState {
  done: number
  total: number
  percent: number
  /** First lesson slug not yet completed (undefined when the path is complete). */
  nextSlug?: string
  complete: boolean
  started: boolean
  mounted: boolean
  completed: ReadonlySet<string>
}

/** Progress for one path, from its ordered lesson slugs. Empty until mounted. */
export function usePathProgress(slugs: readonly string[]): PathProgressState {
  const { progress, mounted } = useProgress();
  const completed = new Set(progress.completedSections);
  const done = slugs.filter((slug) => completed.has(slug)).length;
  const total = slugs.length;
  const nextSlug = slugs.find((slug) => !completed.has(slug));
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    nextSlug,
    complete: mounted && total > 0 && done === total,
    started: done > 0,
    mounted,
    completed,
  };
}
