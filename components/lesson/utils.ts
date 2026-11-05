import type { ChipVariant } from '@/components/ui/Chip'
import type { ProblemDifficulty } from '@/types/learning'

/** FNV-1a: a small, stable string hash for seeding. */
export function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** mulberry32: deterministic 0..1 generator, identical on server and client. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher–Yates with a seeded generator. Returns a new array; never mutates. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const out = items.slice()
  const rand = mulberry32(hashString(seed))
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Chip colour plus a written label, so difficulty is never colour-only. */
export const PROBLEM_DIFFICULTY: Record<ProblemDifficulty, { label: string; variant: ChipVariant }> = {
  easy: { label: 'Easy', variant: 'found' },
  medium: { label: 'Medium', variant: 'amber' },
  hard: { label: 'Hard', variant: 'error' },
}

export type ComplexityKey = 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(2ⁿ)'

const COMPLEXITY_KEYS: readonly ComplexityKey[] = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)']

/** Map an authored complexity string ("O(n^2)", "O(N)") to a key the gauge knows, or null. */
export function toComplexityKey(text: string): ComplexityKey | null {
  const normal = text
    .replace(/\s+/g, ' ')
    .replace(/\^2|\*\*2/g, '²')
    .replace(/2\^n|2\*\*n/gi, '2ⁿ')
    .replace(/\bN\b/g, 'n')
    .replace(/ ?\* ?/g, ' ')
    .replace(/log ?\(n\)/gi, 'log n')
    .replace(/\(\s*/g, '(')
    .replace(/\s*\)/g, ')')
    .trim()
  return COMPLEXITY_KEYS.find((key) => key === normal) ?? null
}
