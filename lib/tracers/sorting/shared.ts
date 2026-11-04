/**
 * Input handling shared by the three sorting tracers (insertion, merge, quick).
 *
 * All of them sort a short list of whole numbers, so they share one input
 * shape, one parser (friendly errors) and one random generator. Repeats are
 * allowed on purpose: equal numbers are what makes "stable" visible.
 */
import { randInt } from '../rng'
import type { InputField, InputLimits, ParseResult } from '@/lib/engine/types'

export interface SortInput {
  nums: number[]
}

export const LIMITS: InputLimits = { maxN: 12, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/

export const SORT_FIELDS: InputField[] = [
  {
    name: 'nums',
    label: 'Numbers to sort',
    kind: 'int-array',
    placeholder: 'e.g. 5, 2, 4, 6, 1, 3',
    help: `2 to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}, in any order. Repeats are fine.`,
  },
]

export function parseSortInput(raw: Record<string, string>): ParseResult<SortInput> {
  const text = (raw.nums ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = text.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length < 2) {
    return { ok: false, field: 'nums', error: 'Type at least two numbers, like 5, 2, 4, 6, 1, 3.' }
  }
  if (tokens.length > LIMITS.maxN) {
    return { ok: false, field: 'nums', error: `Use at most ${LIMITS.maxN} numbers so the picture stays readable.` }
  }
  const nums: number[] = []
  for (const token of tokens) {
    if (!INTEGER.test(token)) {
      return { ok: false, field: 'nums', error: `"${token}" isn't a whole number. Use digits separated by commas.` }
    }
    const value = Number(token)
    if (value < LIMITS.min || value > LIMITS.max) {
      return { ok: false, field: 'nums', error: `Keep every number between ${LIMITS.min} and ${LIMITS.max}.` }
    }
    nums.push(value)
  }
  return { ok: true, value: { nums } }
}

export function formatSortInput({ nums }: SortInput): Record<string, string> {
  return { nums: nums.join(', ') }
}

/** 2..12 numbers from -20..40, so repeats show up often. Deterministic in `rand`. */
export function randomSortInput(rand: () => number): SortInput {
  const len = randInt(rand, 2, LIMITS.maxN)
  return { nums: Array.from({ length: len }, () => randInt(rand, -20, 40)) }
}

/** The boring reference every sorting tracer is checked against. */
export function sortedCopy(nums: readonly number[]): number[] {
  return [...nums].sort((a, b) => a - b)
}
