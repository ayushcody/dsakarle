import { PROGRESS_EVENT } from '@/lib/progress';

export const PROGRESS_KEY = 'dsakarle_progress_v1';
export const SOLVED_KEY = 'dsakarle-solved';
export const GYM_KEY = 'dsakarle-gym';
const RESUME_PREFIX = 'dsakarle-lesson-steps:';

export interface GymStats {
  bestScore: number
  attempts: number
  perPattern: Record<string, { right: number; total: number }>
}

function isNum(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Number of solved practice problems. Defensive: any bad shape counts as 0. */
export function readSolvedCount(): number {
  try {
    const raw = window.localStorage.getItem(SOLVED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? new Set(parsed.filter((x) => typeof x === 'string')).size : 0;
  } catch {
    return 0;
  }
}

/** Gym stats as written by the Pattern gym, or null when absent or unreadable. */
export function readGymStats(): GymStats | null {
  try {
    const raw = window.localStorage.getItem(GYM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    const perPattern: GymStats['perPattern'] = {};
    const pp = parsed.perPattern;
    if (pp && typeof pp === 'object') {
      for (const [slug, value] of Object.entries(pp as Record<string, unknown>)) {
        const v = value as { right?: unknown; total?: unknown } | null;
        if (v && isNum(v.right) && isNum(v.total)) perPattern[slug] = { right: v.right, total: v.total };
      }
    }
    const stats: GymStats = {
      bestScore: isNum(parsed.bestScore) ? parsed.bestScore : 0,
      attempts: isNum(parsed.attempts) ? parsed.attempts : 0,
      perPattern,
    };
    return stats.attempts > 0 || stats.bestScore > 0 ? stats : null;
  } catch {
    return null;
  }
}

/** Clear every key this site writes, then tell listeners progress changed. */
export function resetAllProgress(): void {
  try {
    const ls = window.localStorage;
    const resume: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      const key = ls.key(i);
      if (key && key.startsWith(RESUME_PREFIX)) resume.push(key);
    }
    [PROGRESS_KEY, SOLVED_KEY, GYM_KEY, ...resume].forEach((key) => ls.removeItem(key));
  } catch {
    /* storage unavailable: nothing to clear */
  }
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}
