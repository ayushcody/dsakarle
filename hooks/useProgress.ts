import { useEffect, useState } from 'react';

import { getProgress, subscribeProgress } from '@/lib/progress';
import type { ProgressData } from '@/types/learning';

const EMPTY: ProgressData = { completedSections: [], quizScores: {}, lastVisited: '' };

/**
 * Live view of the learner's saved progress. Returns empty progress until mounted
 * (keeps server and first client render identical), then tracks localStorage changes.
 */
export function useProgress(): { progress: ProgressData; mounted: boolean } {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState<ProgressData>(EMPTY);

  useEffect(() => {
    const sync = () => setProgress(getProgress());
    sync();
    setMounted(true);
    return subscribeProgress(sync);
  }, []);

  return { progress, mounted };
}
