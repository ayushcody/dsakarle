/**
 * Pattern Gym: pure helpers (safe on server and client). The server-only loader lives in
 * lib/gym-server.ts so this file never pulls in `fs`.
 */

export interface GymItem {
  /** `${lessonSlug}#${index}` */
  id: string
  problem: string
  /** Lesson slug of the right pattern. */
  answer: string
  /** Lesson slugs (the answer is always among them). */
  options: string[]
  explanation: string
  sourceLesson: string
}

export type GymMode = 'quick' | 'all' | string // string = path id

export interface GymStore {
  /** Best session score as a whole percentage, 0-100. */
  bestScore: number
  attempts: number
  perPattern: Record<string, { right: number; total: number }>
  /** Item ids missed most recently and not yet answered right since. */
  missed: string[]
}

export const GYM_KEY = 'dsakarle-gym'

export function emptyStore(): GymStore {
  return { bestScore: 0, attempts: 0, perPattern: {}, missed: [] }
}

/** Defensive parse of whatever is in localStorage. */
export function parseStore(raw: string | null): GymStore {
  const base = emptyStore()
  if (!raw) return base
  try {
    const p = JSON.parse(raw) as Partial<GymStore> | null
    if (!p || typeof p !== 'object') return base
    const perPattern: GymStore['perPattern'] = {}
    if (p.perPattern && typeof p.perPattern === 'object') {
      for (const [k, v] of Object.entries(p.perPattern)) {
        if (v && typeof v.right === 'number' && typeof v.total === 'number') {
          perPattern[k] = { right: v.right, total: v.total }
        }
      }
    }
    return {
      bestScore: typeof p.bestScore === 'number' ? p.bestScore : 0,
      attempts: typeof p.attempts === 'number' ? p.attempts : 0,
      perPattern,
      missed: Array.isArray(p.missed) ? p.missed.filter((x): x is string => typeof x === 'string') : [],
    }
  } catch {
    return base
  }
}

/** Defensive read of `recognise.quiz` from any lesson-shaped JSON (fields may be missing). */
export function itemsFromLesson(slug: string, lesson: unknown): GymItem[] {
  const quiz = (lesson as { recognise?: { quiz?: unknown } } | null)?.recognise?.quiz
  if (!Array.isArray(quiz)) return []
  const out: GymItem[] = []
  quiz.forEach((raw, i) => {
    const q = raw as Partial<GymItem> | null
    if (
      q &&
      typeof q.problem === 'string' &&
      typeof q.answer === 'string' &&
      typeof q.explanation === 'string' &&
      Array.isArray(q.options) &&
      q.options.length >= 2 &&
      q.options.includes(q.answer)
    ) {
      out.push({
        id: `${slug}#${i}`,
        problem: q.problem,
        answer: q.answer,
        options: q.options.filter((o): o is string => typeof o === 'string'),
        explanation: q.explanation,
        sourceLesson: slug,
      })
    }
  })
  return out
}

// ---------------------------------------------------------------------------
// Seeded randomness
// ---------------------------------------------------------------------------

function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

/** Deterministic PRNG (mulberry32) returning floats in [0, 1). */
export function rng(seed: string): () => number {
  let a = hashSeed(seed)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher-Yates; never mutates the input. Same seed, same order. */
export function seededShuffle<T>(list: readonly T[], seed: string): T[] {
  const out = list.slice()
  const rand = rng(seed)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export const MISS_WEIGHT = 4

/**
 * Weighted sampling without replacement. Items you missed before weigh `MISS_WEIGHT`, others 1.
 * Deterministic for a given seed.
 */
export function weightedPick(
  items: readonly GymItem[],
  count: number,
  seed: string,
  missed: readonly string[] = [],
): GymItem[] {
  const rand = rng(`${seed}:pick`)
  const missedSet = new Set(missed)
  const pool = items.map((item) => ({ item, w: missedSet.has(item.id) ? MISS_WEIGHT : 1 }))
  const n = Math.min(count, pool.length)
  const picked: GymItem[] = []
  for (let k = 0; k < n; k++) {
    const total = pool.reduce((s, p) => s + p.w, 0)
    let r = rand() * total
    let idx = pool.length - 1
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].w
      if (r < 0) {
        idx = i
        break
      }
    }
    picked.push(pool[idx].item)
    pool.splice(idx, 1)
  }
  return picked
}

export interface GymQuestion extends GymItem {
  /** Options in this session's order. */
  shuffled: string[]
}

/** Build a session: filter, weighted-pick, then shuffle question and option order. */
export function buildSession(
  items: readonly GymItem[],
  opts: { count: number; seed: string; missed?: readonly string[]; allowedAnswers?: ReadonlySet<string> | null },
): GymQuestion[] {
  const pool = opts.allowedAnswers ? items.filter((i) => opts.allowedAnswers!.has(i.answer)) : items
  const picked = weightedPick(pool, opts.count, opts.seed, opts.missed ?? [])
  return seededShuffle(picked, `${opts.seed}:order`).map((item) => ({
    ...item,
    shuffled: seededShuffle(item.options, `${opts.seed}:${item.id}`),
  }))
}

export function sessionSize(mode: GymMode): number {
  return mode === 'all' ? 20 : 10
}

export function newSeed(): string {
  return Math.random().toString(36).slice(2, 8)
}

export function isValidSeed(seed: string | null | undefined): seed is string {
  return !!seed && /^[a-z0-9]{3,16}$/i.test(seed)
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export interface Answer {
  id: string
  /** Pattern slug that was the right answer. */
  answer: string
  chosen: string
}

export function scoreOf(answers: readonly Answer[]): { right: number; total: number; percent: number } {
  const right = answers.filter((a) => a.chosen === a.answer).length
  const total = answers.length
  return { right, total, percent: total === 0 ? 0 : Math.round((right / total) * 100) }
}

/** Longest run of consecutive right answers. */
export function bestStreak(answers: readonly Answer[]): number {
  let best = 0
  let run = 0
  for (const a of answers) {
    run = a.chosen === a.answer ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

/** Per-pattern tally for one session, keyed by the right-answer slug. */
export function breakdown(answers: readonly Answer[]): Record<string, { right: number; total: number }> {
  const out: Record<string, { right: number; total: number }> = {}
  for (const a of answers) {
    const e = (out[a.answer] ??= { right: 0, total: 0 })
    e.total += 1
    if (a.chosen === a.answer) e.right += 1
  }
  return out
}

/** Fold a finished session into the stored stats. Pure: returns a new store. */
export function applySession(store: GymStore, answers: readonly Answer[]): GymStore {
  const { percent } = scoreOf(answers)
  const perPattern = { ...store.perPattern }
  for (const [slug, t] of Object.entries(breakdown(answers))) {
    const prev = perPattern[slug] ?? { right: 0, total: 0 }
    perPattern[slug] = { right: prev.right + t.right, total: prev.total + t.total }
  }
  const missed = new Set(store.missed)
  for (const a of answers) {
    if (a.chosen === a.answer) missed.delete(a.id)
    else missed.add(a.id)
  }
  return {
    bestScore: Math.max(store.bestScore, percent),
    attempts: store.attempts + 1,
    perPattern,
    missed: [...missed],
  }
}
