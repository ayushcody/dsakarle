import type { ProgressData } from '@/types/learning';

const KEY = 'dsakarle_progress_v1';

/** Fired on `window` whenever progress is written in this tab (the `storage` event covers other tabs). */
export const PROGRESS_EVENT = 'dsakarle:progress';

function createEmptyProgress(): ProgressData {
  return {
    completedSections: [],
    quizScores: {},
    lastVisited: '',
  };
}

export function getProgress(): ProgressData {
  if (typeof window === 'undefined') {
    return createEmptyProgress();
  }

  try {
    const data = window.localStorage.getItem(KEY);
    if (!data) {
      return createEmptyProgress();
    }

    const parsed = JSON.parse(data) as Partial<ProgressData> | null;
    return {
      completedSections: Array.isArray(parsed?.completedSections) ? parsed.completedSections : [],
      quizScores: parsed?.quizScores && typeof parsed.quizScores === 'object' ? parsed.quizScores : {},
      lastVisited: typeof parsed?.lastVisited === 'string' ? parsed.lastVisited : '',
    };
  } catch {
    return createEmptyProgress();
  }
}

function writeProgress(progress: ProgressData): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Storage unavailable (private mode / quota) — progress just won't persist.
  }
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

/** Subscribe to progress changes from this tab and from other tabs. Returns an unsubscribe function. */
export function subscribeProgress(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === KEY) {
      callback();
    }
  };

  window.addEventListener(PROGRESS_EVENT, callback);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(PROGRESS_EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
}

export function markComplete(slug: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const progress = getProgress();
  if (!progress.completedSections.includes(slug)) {
    progress.completedSections.push(slug);
    writeProgress(progress);
  }
}

export function saveQuizScore(slug: string, type: 'recognition' | 'concept', score: boolean | number): void {
  if (typeof window === 'undefined') {
    return;
  }

  const progress = getProgress();
  if (!progress.quizScores[slug]) {
    progress.quizScores[slug] = { recognition: false, concept: 0 };
  }

  if (type === 'recognition') {
    progress.quizScores[slug].recognition = score as boolean;
  }

  if (type === 'concept') {
    progress.quizScores[slug].concept = score as number;
  }

  writeProgress(progress);
}

export function setLastVisited(slug: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const progress = getProgress();
  progress.lastVisited = slug;
  writeProgress(progress);
}

export function getChapterProgress(slugs: string[]): number {
  if (slugs.length === 0) {
    return 0;
  }

  const progress = getProgress();
  const completed = slugs.filter((slug) => progress.completedSections.includes(slug)).length;
  return Math.round((completed / slugs.length) * 100);
}

/** Undo `markComplete` for a lesson. */
export function unmarkComplete(slug: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const progress = getProgress();
  if (progress.completedSections.includes(slug)) {
    progress.completedSections = progress.completedSections.filter((s) => s !== slug);
    writeProgress(progress);
  }
}

const SECTION_KEY = 'dsakarle-last-section';

function readSectionMap(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(SECTION_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** The last section id the learner scrolled into for a lesson, or null. */
export function getLastSection(slug: string): string | null {
  const id = readSectionMap()[slug];
  return typeof id === 'string' && id ? id : null;
}

/** Remember the section the learner is reading, so the lesson can offer to pick up there. */
export function setLastSection(slug: string, id: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  const map = readSectionMap();
  if (map[slug] === id) {
    return;
  }
  map[slug] = id;
  try {
    window.localStorage.setItem(SECTION_KEY, JSON.stringify(map));
  } catch {
    // Storage unavailable: resume just won't persist.
  }
}
