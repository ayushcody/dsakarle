/**
 * Dynamic programming — climbing stairs (LeetCode 70), one dimension.
 *
 * dp[i] is the number of ways to reach stair i taking 1 or 2 steps at a time.
 * The last move into stair i was either a 1-step from stair i - 1 or a 2-step
 * from stair i - 2, so dp[i] = dp[i - 1] + dp[i - 2]. The table is drawn as a
 * one-row grid so the two dependency arrows can be shown.
 *
 * Code lives in content/code/dynamic-programming/climb-stairs.{py,java,cpp}.
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

export interface ClimbStairsInput {
  /** Number of stairs, 1..MAX_STAIRS. */
  n: number
}

/** The table has n + 1 cells; 20 stairs is the widest row that still reads. */
export const MAX_STAIRS = 20
const LIMITS: InputLimits = { maxN: MAX_STAIRS, min: 1, max: MAX_STAIRS }
const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<ClimbStairsInput> {
  const text = (raw.n ?? '').replace(/[−–]/g, '-').trim()
  if (text === '') return { ok: false, field: 'n', error: 'Type how many stairs there are, like 10.' }
  if (!INTEGER.test(text)) return { ok: false, field: 'n', error: `n must be a whole number, not "${text}".` }
  const n = Number(text)
  if (n < 1) return { ok: false, field: 'n', error: 'There must be at least 1 stair.' }
  if (n > MAX_STAIRS) return { ok: false, field: 'n', error: `Use at most ${MAX_STAIRS} stairs so the table stays readable.` }
  return { ok: true, value: { n } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? '' : 's'}`

/** Asked on the look frame: what goes in dp[i]? Three numbers, correct one rotated by i. */
function nextValuePredict(i: number, one: number, two: number): PredictCandidate {
  const sum = one + two
  const options = [String(sum), String(one), String(sum + 1)]
  const rotated = options.map((_, k) => options[(k + i) % options.length])
  return {
    tag: 'next-value',
    kind: 'choice',
    prompt: `dp[${i - 1}] = ${one} and dp[${i - 2}] = ${two}. What goes in dp[${i}]?`,
    options: rotated,
    answer: String(sum),
    why: `Every way to reach stair ${i} ends with a 1-step from ${i - 1} or a 2-step from ${i - 2}, so you add the two counts: ${one} + ${two} = ${sum}.`,
    hint: 'Count the ways that end with a 1-step, then the ways that end with a 2-step.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ n }: ClimbStairsInput) {
  const rec = createRecorder<number>()

  // Working state, mirroring the code files. null = not filled yet.
  const dp: Array<number | null> = Array.from({ length: n + 1 }, () => null)
  const colLabels = dp.map((_, i) => String(i))

  let i: number | null = null
  let oneStep: number | null = null
  let twoSteps: number | null = null
  let ways: number | null = null

  const emit = (
    at: string,
    say: string,
    extra: {
      marks?: NonNullable<GridScene['marks']>
      arrows?: GridScene['arrows']
      annotations?: GridScene['annotations']
      pointer?: boolean
      predict?: PredictCandidate
    } = {},
  ): void => {
    const scene: GridScene = { kind: 'grid', label: 'dp', rows: [dp.slice()], colLabels }
    if (extra.marks?.length) scene.marks = extra.marks
    if (extra.arrows?.length) scene.arrows = extra.arrows
    if (extra.annotations?.length) scene.annotations = extra.annotations
    if (extra.pointer && i !== null) scene.pointers = [{ name: 'i', r: 0, c: i, role: 'ptrB' }]
    const vars: Record<string, Val> = { n, i, one_step: oneStep, two_steps: twoSteps, ways }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: dp.filter((v) => v !== null).length, max: n + 1, label: 'Cells filled' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit('init', `Make a table with one cell per stair, 0 to ${n}. dp[i] will hold the number of ways to reach stair i.`)

  dp[0] = 1
  dp[1] = 1
  emit('base', 'dp[0] = 1 (standing still is one way) and dp[1] = 1 (a single step). Everything else builds on these.', {
    marks: [
      { r: 0, c: 0, role: 'changed' },
      { r: 0, c: 1, role: 'changed' },
    ],
  })

  for (let step = 2; step <= n && !rec.capped; step++) {
    i = step
    oneStep = dp[i - 1] as number
    twoSteps = dp[i - 2] as number
    const arrows: GridScene['arrows'] = [
      { from: [0, i - 1], to: [0, i] },
      { from: [0, i - 2], to: [0, i] },
    ]
    emit('look', `To reach stair ${i} you come from stair ${i - 1} (${plural(oneStep, 'way')}) or stair ${i - 2} (${plural(twoSteps, 'way')}).`, {
      marks: [
        { r: 0, c: i - 1, role: 'compare' },
        { r: 0, c: i - 2, role: 'compare' },
        { r: 0, c: i, role: 'focus' },
      ],
      arrows,
      pointer: true,
      predict: nextValuePredict(i, oneStep, twoSteps),
    })
    if (rec.capped) break

    dp[i] = oneStep + twoSteps
    emit('fill', `dp[${i}] = ${oneStep} + ${twoSteps} = ${dp[i]}. That is written once and never recomputed.`, {
      marks: [{ r: 0, c: i, role: 'changed' }],
      arrows,
      pointer: true,
    })
  }

  ways = dp[n]
  i = null
  oneStep = null
  twoSteps = null
  emit('done', `dp[${n}] = ${ways}: there ${ways === 1 ? 'is 1 way' : `are ${ways} ways`} to climb ${n} stair${n === 1 ? '' : 's'}.`, {
    marks: [{ r: 0, c: n, role: 'found' }],
  })

  return rec.done(ways as number)
}

/** Independent check: two rolling variables, no table. */
function reference({ n }: ClimbStairsInput): number {
  let prev = 1
  let cur = 1
  for (let stair = 2; stair <= n; stair++) {
    const next = prev + cur
    prev = cur
    cur = next
  }
  return cur
}

const tracer: Tracer<ClimbStairsInput, number> = {
  id: 'dynamic-programming/climb-stairs',
  title: 'Climbing stairs (1D)',
  anchors: {
    init: 'Make a table: dp[i] = ways to reach stair i',
    base: 'Base cases: dp[0] = 1 and dp[1] = 1',
    look: 'Read the two cells you can come from',
    fill: 'dp[i] = dp[i − 1] + dp[i − 2]',
    done: 'dp[n] is the answer',
  },
  vars: [
    { name: 'n', role: 'value' },
    { name: 'i', role: 'ptrB' },
    { name: 'one_step', role: 'value' },
    { name: 'two_steps', role: 'value' },
    { name: 'ways', role: 'best' },
  ],
  input: {
    fields: [{ name: 'n', label: 'Stairs (n)', kind: 'int', placeholder: '10', help: `1 to ${MAX_STAIRS}` }],
    parse: parseInput,
    format: ({ n }) => ({ n: String(n) }),
    presets: [
      { label: '10 stairs', value: { n: 10 } },
      { label: '5 stairs', value: { n: 5 } },
      { label: '1 stair', value: { n: 1 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      return { n: randInt(rand, 1, MAX_STAIRS) }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
