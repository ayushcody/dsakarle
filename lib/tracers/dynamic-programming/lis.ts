/**
 * Dynamic programming — longest increasing subsequence (LeetCode 300), O(n²).
 *
 * dp[i] is the length of the longest strictly increasing subsequence that ENDS
 * at index i. Every element alone is a run of 1. For each earlier index j < i
 * with a[j] < a[i], the run ending at j can be extended by a[i], so
 * dp[i] = max(dp[i], dp[j] + 1). The answer is the largest dp value. A traceback
 * then reads out one longest subsequence: start at the first index holding the
 * maximum, and repeatedly step to the nearest earlier index j with a[j] < a[k]
 * and dp[j] = dp[k] - 1.
 *
 * Code lives in content/code/dynamic-programming/lis.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  ArrayScene,
  CompositeScene,
  Frame,
  InputLimits,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface LisInput {
  a: number[]
}

export const MAX_N = 8
const LIMITS: InputLimits = { maxN: MAX_N, min: -99, max: 99 }
const INTEGER = /^-?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<LisInput> {
  const text = (raw.a ?? '')
    .replace(/[−–]/g, '-')
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = text.split(/[\s,;]+/).filter((t) => t !== '')
  if (tokens.length === 0) return { ok: false, field: 'a', error: 'Type some numbers, like 10, 9, 2, 5, 3, 7.' }
  if (tokens.length > MAX_N) return { ok: false, field: 'a', error: `Use at most ${MAX_N} numbers so the rows stay readable.` }
  const a: number[] = []
  for (const token of tokens) {
    if (!INTEGER.test(token)) return { ok: false, field: 'a', error: `"${token}" isn't a whole number. Use digits separated by commas.` }
    const value = Number(token)
    if (value < LIMITS.min || value > LIMITS.max) return { ok: false, field: 'a', error: `Keep every number between ${LIMITS.min} and ${LIMITS.max}.` }
    a.push(value)
  }
  return { ok: true, value: { a } }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function extendPredict(i: number, j: number, ai: number, aj: number, dpj: number): PredictCandidate {
  const options = ['Yes', 'No']
  const yes = aj < ai
  return {
    tag: 'can-extend',
    kind: 'choice',
    prompt: `Can a[${i}] = ${ai} extend the run ending at j = ${j} (a[${j}] = ${aj})?`,
    options,
    answer: yes ? options[0] : options[1],
    why: yes
      ? `${aj} < ${ai}, so ${ai} can follow ${aj}: that run of ${dpj} grows to ${dpj + 1}.`
      : `${aj} is not smaller than ${ai}, so ${ai} cannot follow it in a strictly increasing run.`,
    hint: 'Strictly increasing: the earlier number must be smaller.',
  }
}

function run({ a }: LisInput) {
  const rec = createRecorder<number>()
  const n = a.length
  const dp: number[] = a.map(() => 1)

  let i: number | null = null
  let j: number | null = null
  let best: number | null = null
  let seq: number[] = []

  const emit = (
    at: string,
    say: string,
    extra: {
      aMarks?: NonNullable<ArrayScene['marks']>
      dpMarks?: NonNullable<ArrayScene['marks']>
      predict?: PredictCandidate
    } = {},
  ): void => {
    const pointers: ArrayScene['pointers'] = []
    if (j !== null) pointers.push({ name: 'j', index: j, role: 'ptrA' })
    if (i !== null) pointers.push({ name: 'i', index: i, role: 'ptrB' })
    const top: ArrayScene = { kind: 'array', label: 'a', cells: a.slice(), pointers, marks: extra.aMarks ?? [] }
    const bottom: ArrayScene = { kind: 'array', label: 'dp', cells: dp.slice(), marks: extra.dpMarks ?? [] }
    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { title: 'numbers', scene: top },
        { title: 'dp[i] = longest run ending at i', scene: bottom },
      ],
    }
    const vars: Record<string, Val> = { i, j, best, seq: seq.slice() }
    const frame: Frame = { scene, vars, say, at }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit('init', `Every number alone is a run of length 1, so dp starts as all 1s. dp[i] = longest run ending at index i.`)

  for (let r = 1; r < n && !rec.capped; r++) {
    for (let c = 0; c < r && !rec.capped; c++) {
      i = r
      j = c
      emit('check', `Compare a[${c}] = ${a[c]} with a[${r}] = ${a[r]}.`, {
        aMarks: [
          { index: c, role: 'compare' },
          { index: r, role: 'focus' },
        ],
        dpMarks: [
          { index: c, role: 'compare' },
          { index: r, role: 'focus' },
        ],
        predict: extendPredict(r, c, a[r], a[c], dp[c]),
      })
      if (rec.capped) break

      if (a[c] < a[r]) {
        const candidate = dp[c] + 1
        const improved = candidate > dp[r]
        const before = dp[r]
        dp[r] = Math.max(dp[r], candidate)
        emit(
          'extend',
          improved
            ? `${a[c]} < ${a[r]}: dp[${r}] = max(${before}, ${dp[c]} + 1) = ${dp[r]}.`
            : `${a[c]} < ${a[r]}, but dp[${c}] + 1 = ${candidate} doesn't beat ${before}, so dp[${r}] stays ${dp[r]}.`,
          {
            aMarks: [
              { index: c, role: 'compare' },
              { index: r, role: 'focus' },
            ],
            dpMarks: [
              { index: c, role: 'compare' },
              { index: r, role: improved ? 'changed' : 'focus' },
            ],
          },
        )
      } else {
        emit('skip', `${a[c]} is not smaller than ${a[r]}, so ${a[r]} can't extend that run. Skip it.`, {
          aMarks: [
            { index: c, role: 'discarded' },
            { index: r, role: 'focus' },
          ],
          dpMarks: [{ index: r, role: 'focus' }],
        })
      }
    }
  }

  // Traceback: one longest subsequence, read from the end back to the start.
  let k = 0
  for (let x = 1; x < n; x++) if (dp[x] > dp[k]) k = x
  best = dp[k]
  i = k
  j = null
  const picked: number[] = [k]
  const asMarks = (): NonNullable<ArrayScene['marks']> => picked.map((index) => ({ index, role: 'found' as const }))
  seq = [a[k]]
  emit('trace', `The largest dp value is ${best}, at index ${k}. Walk back from there to read out one longest run.`, {
    aMarks: asMarks(),
    dpMarks: asMarks(),
  })
  while (dp[k] > 1 && !rec.capped) {
    let p = k - 1
    while (!(a[p] < a[k] && dp[p] === dp[k] - 1)) p--
    k = p
    i = k
    picked.push(k)
    seq = [a[k], ...seq]
    emit('trace', `a[${k}] = ${a[k]} is smaller and ends a run of ${dp[k]}, so it comes before. Run so far: ${seq.join(', ')}.`, {
      aMarks: asMarks(),
      dpMarks: asMarks(),
    })
  }

  i = null
  emit('done', `The longest strictly increasing run has length ${best}: ${seq.join(', ')}.`, {
    aMarks: asMarks(),
    dpMarks: asMarks(),
  })
  return rec.done(best)
}

/** Independent check: the longest strictly increasing subset, found by trying every subset. */
function reference({ a }: LisInput): number {
  let best = 0
  for (let mask = 0; mask < 1 << a.length; mask++) {
    let prev = -Infinity
    let count = 0
    let ok = true
    for (let k = 0; k < a.length && ok; k++) {
      if (!(mask & (1 << k))) continue
      if (a[k] <= prev) ok = false
      prev = a[k]
      count++
    }
    if (ok && count > best) best = count
  }
  return best
}

const tracer: Tracer<LisInput, number> = {
  id: 'dynamic-programming/lis',
  title: 'Longest increasing subsequence',
  anchors: {
    init: 'Start with dp[i] = 1: each number alone is a run',
    check: 'Compare a[j] with a[i] for each earlier j',
    extend: 'Smaller: dp[i] = max(dp[i], dp[j] + 1)',
    skip: 'Not smaller: a[i] cannot extend that run',
    trace: 'Walk back from the best dp to read out one run',
    done: 'The largest dp value is the length',
  },
  vars: [
    { name: 'i', role: 'ptrB' },
    { name: 'j', role: 'ptrA' },
    { name: 'best', role: 'best' },
    { name: 'seq', role: 'value' },
  ],
  input: {
    fields: [{ name: 'a', label: 'Numbers', kind: 'int-array', placeholder: '10, 9, 2, 5, 3, 7', help: `Up to ${MAX_N} whole numbers, ${LIMITS.min} to ${LIMITS.max}` }],
    parse: parseInput,
    format: ({ a }) => ({ a: a.join(', ') }),
    presets: [
      { label: '10, 9, 2, 5, 3, 7', value: { a: [10, 9, 2, 5, 3, 7] } },
      { label: 'Already sorted', value: { a: [1, 2, 3, 4, 5] } },
      { label: 'Strictly falling', value: { a: [9, 7, 5, 3] } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      return { a: Array.from({ length: randInt(rand, 1, MAX_N) }, () => randInt(rand, -20, 20)) }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
