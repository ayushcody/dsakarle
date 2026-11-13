/**
 * Dynamic programming — 0/1 knapsack, a two-dimensional take-or-skip table.
 *
 * dp[i][w] is the best total value using only the first i items with a bag that
 * holds w. For item i (weight wt, value val) there are two choices:
 *   skip it  -> dp[i - 1][w]
 *   take it  -> dp[i - 1][w - wt] + val   (only if wt <= w)
 * and dp[i][w] keeps the larger. Row 0 (no items) and column 0 (no room) are 0.
 *
 * Code lives in content/code/dynamic-programming/knapsack.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  Frame,
  GridScene,
  InputLimits,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface KnapsackInput {
  /** 1..4 item weights, each 1..9. */
  weights: number[]
  /** One value per item, each 1..9. */
  values: number[]
  /** Bag capacity, 1..7. */
  capacity: number
}

export const MAX_ITEMS = 4
export const MAX_CAPACITY = 7
const LIMITS: InputLimits = { maxN: MAX_ITEMS, min: 1, max: 9 }
const INTEGER = /^[+-]?\d+$/

function parseList(raw: string | undefined, field: 'weights' | 'values', name: string): ParseResult<number[]> {
  const text = (raw ?? '')
    .replace(/[−–]/g, '-')
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = text.split(/[\s,;]+/).filter((t) => t !== '')
  if (tokens.length === 0) return { ok: false, field, error: `Type the ${name}, like 2, 3, 4.` }
  if (tokens.length > MAX_ITEMS) return { ok: false, field, error: `Use at most ${MAX_ITEMS} items so the table stays readable.` }
  const out: number[] = []
  for (const token of tokens) {
    if (!INTEGER.test(token)) return { ok: false, field, error: `"${token}" isn't a whole number. Use digits separated by commas.` }
    const value = Number(token)
    if (value < LIMITS.min || value > LIMITS.max) {
      return { ok: false, field, error: `Keep every ${field === 'weights' ? 'weight' : 'value'} between ${LIMITS.min} and ${LIMITS.max}.` }
    }
    out.push(value)
  }
  return { ok: true, value: out }
}

function parseInput(raw: Record<string, string>): ParseResult<KnapsackInput> {
  const weights = parseList(raw.weights, 'weights', 'weights')
  if (!weights.ok) return weights
  const values = parseList(raw.values, 'values', 'values')
  if (!values.ok) return values
  if (weights.value.length !== values.value.length) {
    return {
      ok: false,
      field: 'values',
      error: `Each item needs a weight and a value: ${weights.value.length} weights but ${values.value.length} values.`,
    }
  }
  const text = (raw.capacity ?? '').replace(/[−–]/g, '-').trim()
  if (text === '') return { ok: false, field: 'capacity', error: 'Type the bag capacity, like 5.' }
  if (!INTEGER.test(text)) return { ok: false, field: 'capacity', error: `The capacity must be a whole number, not "${text}".` }
  const capacity = Number(text)
  if (capacity < 1) return { ok: false, field: 'capacity', error: 'The bag must hold at least 1.' }
  if (capacity > MAX_CAPACITY) return { ok: false, field: 'capacity', error: `Use a capacity of at most ${MAX_CAPACITY} so the table stays readable.` }
  return { ok: true, value: { weights: weights.value, values: values.value, capacity } }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function takeOrSkipPredict(i: number, w: number, wt: number, val: number, skip: number, take: number): PredictCandidate | undefined {
  if (skip === take) return undefined
  const takeWins = take > skip
  return {
    tag: 'take-or-skip',
    kind: 'choice',
    prompt: `Item ${i} (weight ${wt}, value ${val}) fits in capacity ${w}. Skipping keeps ${skip}; taking gives ${take}. Which does dp[${i}][${w}] use?`,
    options: ['Take it', 'Skip it'],
    answer: takeWins ? 'Take it' : 'Skip it',
    why: takeWins
      ? `Taking gives dp[${i - 1}][${w - wt}] + ${val} = ${take}, which beats ${skip} from skipping.`
      : `Skipping keeps ${skip}, which is better than the ${take} you would get by taking item ${i}.`,
    hint: 'Compare the two numbers. The bigger one wins.',
  }
}

function run({ weights, values, capacity }: KnapsackInput) {
  const rec = createRecorder<number>()
  const n = weights.length
  const dp: Array<Array<number | null>> = Array.from({ length: n + 1 }, () => Array.from({ length: capacity + 1 }, () => null))
  const rowLabels = ['—', ...weights.map((wt, k) => `w${wt} v${values[k]}`)]
  const colLabels = dp[0].map((_, w) => String(w))
  const total = (n + 1) * (capacity + 1)

  let i: number | null = null
  let w: number | null = null
  let wt: number | null = null
  let val: number | null = null
  let skip: number | null = null
  let take: number | null = null
  let best: number | null = null

  const emit = (
    at: string,
    say: string,
    extra: {
      marks?: NonNullable<GridScene['marks']>
      arrows?: GridScene['arrows']
      annotations?: GridScene['annotations']
      predict?: PredictCandidate
    } = {},
  ): void => {
    const scene: GridScene = { kind: 'grid', label: 'dp', rows: dp.map((row) => row.slice()), rowLabels, colLabels }
    if (extra.marks?.length) scene.marks = extra.marks
    if (extra.arrows?.length) scene.arrows = extra.arrows
    if (extra.annotations?.length) scene.annotations = extra.annotations
    const vars: Record<string, Val> = { i, w, wt, val, skip, take, best }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: dp.reduce((sum, row) => sum + row.filter((v) => v !== null).length, 0), max: total, label: 'Cells filled' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit('init', `${n} ${n === 1 ? 'item' : 'items'}, capacity ${capacity}. dp[i][w] = best value from the first i items in a bag that holds w.`)

  const baseMarks: NonNullable<GridScene['marks']> = []
  for (let c = 0; c <= capacity; c++) {
    dp[0][c] = 0
    baseMarks.push({ r: 0, c, role: 'changed' })
  }
  for (let r = 1; r <= n; r++) {
    dp[r][0] = 0
    baseMarks.push({ r, c: 0, role: 'changed' })
  }

  emit('base', 'Row 0 (no items) and column 0 (no room) are 0: nothing fits, so nothing is worth anything.', { marks: baseMarks })

  for (let r = 1; r <= n && !rec.capped; r++) {
    for (let c = 1; c <= capacity && !rec.capped; c++) {
      i = r
      w = c
      wt = weights[r - 1]
      val = values[r - 1]
      skip = dp[r - 1][c] as number
      if (wt > c) {
        take = null
        best = skip
        dp[r][c] = skip
        emit('skip', `Item ${r} weighs ${wt}, more than ${c}. It can't fit, so dp[${r}][${c}] = dp[${r - 1}][${c}] = ${skip}.`, {
          marks: [
            { r: r - 1, c, role: 'compare' },
            { r, c, role: 'changed' },
          ],
          arrows: [{ from: [r - 1, c], to: [r, c] }],
        })
        continue
      }
      take = (dp[r - 1][c - wt] as number) + val
      best = null
      const arrows: GridScene['arrows'] = [
        { from: [r - 1, c], to: [r, c] },
        { from: [r - 1, c - wt], to: [r, c] },
      ]
      emit('look', `Item ${r} fits. Skip it: ${skip}. Take it: dp[${r - 1}][${c - wt}] + ${val} = ${take}.`, {
        marks: [
          { r: r - 1, c, role: 'compare' },
          { r: r - 1, c: c - wt, role: 'compare' },
          { r, c, role: 'focus' },
        ],
        arrows,
        annotations: [
          { target: `cell:${r - 1},${c}`, text: 'skip' },
          { target: `cell:${r - 1},${c - wt}`, text: 'take' },
        ],
        predict: takeOrSkipPredict(r, c, wt, val, skip, take),
      })
      if (rec.capped) break

      best = Math.max(skip, take)
      dp[r][c] = best
      const tookIt = take > skip
      emit(
        'pick',
        take === skip
          ? `Both give ${best}, so dp[${r}][${c}] = ${best}.`
          : tookIt
            ? `Taking wins: dp[${r}][${c}] = max(${skip}, ${take}) = ${best}.`
            : `Skipping wins: dp[${r}][${c}] = max(${skip}, ${take}) = ${best}.`,
        {
          marks: [{ r, c, role: 'changed' }],
          arrows: [tookIt ? arrows[1] : arrows[0]],
        },
      )
    }
  }

  best = dp[n][capacity]
  i = null
  w = null
  wt = null
  val = null
  skip = null
  take = null
  emit('done', `The bottom-right cell holds ${best}: the most value that fits in capacity ${capacity}.`, {
    marks: [{ r: n, c: capacity, role: 'found' }],
  })

  return rec.done(best as number)
}

/** Independent check: try every subset of items (at most 2^4). */
function reference({ weights, values, capacity }: KnapsackInput): number {
  const n = weights.length
  const go = (k: number, room: number): number => {
    if (k === n) return 0
    const skipIt = go(k + 1, room)
    return weights[k] <= room ? Math.max(skipIt, values[k] + go(k + 1, room - weights[k])) : skipIt
  }
  return go(0, capacity)
}

const tracer: Tracer<KnapsackInput, number> = {
  id: 'dynamic-programming/knapsack',
  title: '0/1 knapsack (take or skip)',
  anchors: {
    init: 'Make a table: dp[i][w] = best value, first i items, capacity w',
    base: 'Row 0 and column 0 are 0: no items or no room',
    skip: 'Item is too heavy: copy dp[i − 1][w]',
    look: 'Compare skipping it with taking it',
    pick: 'dp[i][w] = the larger of skip and take',
    done: 'The bottom-right cell is the answer',
  },
  vars: [
    { name: 'i', role: 'ptrA' },
    { name: 'w', role: 'ptrB' },
    { name: 'wt', role: 'value' },
    { name: 'val', role: 'value' },
    { name: 'skip', role: 'value' },
    { name: 'take', role: 'value' },
    { name: 'best', role: 'best' },
  ],
  input: {
    fields: [
      { name: 'weights', label: 'Weights', kind: 'int-array', placeholder: '2, 3, 4', help: `Up to ${MAX_ITEMS} items, each 1 to 9` },
      { name: 'values', label: 'Values', kind: 'int-array', placeholder: '3, 4, 5', help: 'One value per item, each 1 to 9' },
      { name: 'capacity', label: 'Capacity', kind: 'int', placeholder: '5', help: `1 to ${MAX_CAPACITY}` },
    ],
    parse: parseInput,
    format: ({ weights, values, capacity }) => ({
      weights: weights.join(', '),
      values: values.join(', '),
      capacity: String(capacity),
    }),
    presets: [
      { label: '3 items, capacity 5', value: { weights: [2, 3, 4], values: [3, 4, 5], capacity: 5 } },
      { label: 'Heavy but valuable', value: { weights: [1, 3, 4, 2], values: [2, 9, 9, 4], capacity: 6 } },
      { label: 'Nothing fits', value: { weights: [5, 6], values: [8, 9], capacity: 4 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const n = randInt(rand, 1, MAX_ITEMS)
      return {
        weights: Array.from({ length: n }, () => randInt(rand, 1, 6)),
        values: Array.from({ length: n }, () => randInt(rand, 1, 9)),
        capacity: randInt(rand, 1, MAX_CAPACITY),
      }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
