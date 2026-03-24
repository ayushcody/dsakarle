import type { ProgressData } from '@/types/learning';

const KEY = 'dsakarle_progress_v1';

const EMPTY_PROGRESS: ProgressData = {
  completedSections: [],
  quizScores: {},
  lastVisited: '',
};

export function getProgress(): ProgressData {
  if (typeof window === 'undefined') {
    return EMPTY_PROGRESS;
  }

  const data = window.localStorage.getItem(KEY);
  return data ? JSON.parse(data) : EMPTY_PROGRESS;
}

export function markComplete(slug: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const progress = getProgress();
  if (!progress.completedSections.includes(slug)) {
    progress.completedSections.push(slug);
    window.localStorage.setItem(KEY, JSON.stringify(progress));
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

  window.localStorage.setItem(KEY, JSON.stringify(progress));
}

export function setLastVisited(slug: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const progress = getProgress();
  progress.lastVisited = slug;
  window.localStorage.setItem(KEY, JSON.stringify(progress));
}

export function getChapterProgress(slugs: string[]): number {
  if (slugs.length === 0) {
    return 0;
  }

  const progress = getProgress();
  const completed = slugs.filter((slug) => progress.completedSections.includes(slug)).length;
  return Math.round((completed / slugs.length) * 100);
}
