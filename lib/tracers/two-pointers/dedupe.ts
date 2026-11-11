/**
 * Two pointers, same direction — remove duplicates from a sorted array in place
 * (LeetCode 26).
 *
 * `slow` is the writer: it sits on the last unique number kept so far.
 * `fast` is the reader: it scouts ahead, one number at a time. Whenever fast
 * finds a number different from the one under slow, slow steps forward and the
 * new number is copied into that slot. The result is k, the count of unique
 * numbers; the first k slots hold them.
 *
 * Same layout as the sliding-window pilot:
 *   1. input type, parsing and presets
 *   2. frame helpers (narration / predicts)
 *   3. `run` — the real algorithm, recording one frame per idea
 *   4. `reference` — a boring implementation the tests compare against
 *
 * Code lives in content/code/two-pointers/dedupe.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  ArrayScene,
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

export interface DedupeInput {
  /** Sorted ascending, so equal numbers sit together. */
  nums: number[]
}

const LIMITS: InputLimits = { maxN: 12, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<DedupeInput> {
  const numsText = (raw.nums ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = numsText.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'nums', error: 'Type at least one number, like 0, 0, 1, 1, 2.' }
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
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] < nums[i - 1]) {
      return { ok: false, field: 'nums', error: 'Two pointers needs the numbers sorted — try 0, 0, 1, 1, 2' }
    }
  }
  return { ok: true, value: { nums } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const WRITE_IT = 'Write it'
const SKIP_IT = 'Skip it'

function writeOrSkipPredict(slowValue: number, fastValue: number): PredictCandidate {
  const duplicate = slowValue === fastValue
  return {
    tag: 'write-or-skip',
    kind: 'choice',
    prompt: `slow is on ${slowValue}, fast just read ${fastValue}. Write it or skip it?`,
    options: [WRITE_IT, SKIP_IT],
    answer: duplicate ? SKIP_IT : WRITE_IT,
    why: duplicate
      ? `${fastValue} is the same as the last unique number, ${slowValue}, so it's a duplicate. Skip it.`
      : `${fastValue} is different from ${slowValue}, so it's a new unique number. Copy it into the next slot.`,
    hint: 'Compare the number under fast with the number under slow.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums: input }: DedupeInput) {
  const rec = createRecorder<number>()
  // The algorithm works in place, so work on a copy and show it changing.
  const nums = input.slice()
  const n = nums.length

  // Working state — mirrors the variables in the code files.
  let slow = 0

  /** Record a frame from the current state. `fast` is -1 before the loop starts. */
  const emit = (
    fast: number,
    at: string,
    say: string,
    extra: {
      marks?: ArrayScene['marks']
      pointers?: boolean
      predict?: PredictCandidate
    } = {},
  ): void => {
    const kept = slow + 1
    const marks: NonNullable<ArrayScene['marks']> = []
    // Cells between slow and fast were read and skipped: out of play.
    for (let i = slow + 1; i < fast; i++) marks.push({ index: i, role: 'discarded' })
    for (const m of extra.marks ?? []) {
      const existing = marks.findIndex((x) => x.index === m.index)
      if (existing >= 0) marks.splice(existing, 1)
      marks.push(m)
    }
    const scene: ArrayScene = {
      kind: 'array',
      label: 'nums',
      cells: nums.slice(),
      // The kept (unique) prefix.
      window: { start: 0, end: slow },
      annotations: [{ target: 'window', text: `${kept} unique` }],
    }
    if (extra.pointers !== false) {
      const pointers: NonNullable<ArrayScene['pointers']> = [{ name: 'slow', index: slow, role: 'ptrA' }]
      if (fast >= 0) pointers.push({ name: 'fast', index: fast, role: 'ptrB' })
      scene.pointers = pointers
    }
    if (marks.length) scene.marks = marks

    const vars: Record<string, Val> = { slow, fast: fast >= 0 ? fast : null }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: kept, max: n, label: 'Unique numbers kept' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit(-1, 'init', `slow stays on the first number, ${nums[0]}. Everything up to slow is the unique prefix we keep.`)

  for (let fast = 1; fast < n && !rec.capped; fast++) {
    const slowValue = nums[slow]
    const fastValue = nums[fast]
    const duplicate = slowValue === fastValue

    emit(fast, 'read', `fast moves to index ${fast} and reads ${fastValue}. slow is on ${slowValue}.`, {
      predict: writeOrSkipPredict(slowValue, fastValue),
    })
    if (rec.capped) break

    emit(
      fast,
      'compare',
      duplicate
        ? `${fastValue} equals slow's ${slowValue} — a duplicate, so skip it.`
        : `${fastValue} is different from slow's ${slowValue} — a new number, so keep it.`,
      {
        marks: [
          { index: slow, role: 'compare' },
          { index: fast, role: 'compare' },
        ],
      },
    )
    if (rec.capped) break

    if (!duplicate) {
      slow++
      nums[slow] = fastValue
      emit(
        fast,
        'write',
        slow === fast
          ? `slow steps to index ${slow}. ${fastValue} is already there, so nothing moves.`
          : `slow steps to index ${slow} and ${fastValue} is copied there. The unique prefix grows.`,
        { marks: [{ index: slow, role: 'changed' }] },
      )
    }
  }

  const k = slow + 1
  const prefix = nums.slice(0, k)
  const marks: NonNullable<ArrayScene['marks']> = []
  for (let i = 0; i < n; i++) marks.push({ index: i, role: i < k ? 'found' : 'discarded' })
  emit(n - 1, 'done', `Return ${k} — ${k === 1 ? 'the first slot holds' : `the first ${k} slots hold`} the unique ${k === 1 ? 'number' : 'numbers'} [${prefix.join(', ')}].`, {
    pointers: false,
    marks,
  })

  return rec.done(k)
}

/** Independent check: count the distinct values with a set. */
function reference({ nums }: DedupeInput): number {
  return new Set(nums).size
}

const tracer: Tracer<DedupeInput, number> = {
  id: 'two-pointers/dedupe',
  title: 'Same-direction pointers',
  anchors: {
    init: 'slow marks the last unique number kept',
    read: 'fast reads the next number',
    compare: 'Is nums[fast] different from nums[slow]?',
    write: 'New number: move slow on and copy it there',
    done: 'Return how many unique numbers there are',
  },
  vars: [
    { name: 'slow', role: 'ptrA' },
    { name: 'fast', role: 'ptrB' },
  ],
  input: {
    fields: [
      {
        name: 'nums',
        label: 'Sorted numbers',
        kind: 'int-array',
        placeholder: 'e.g. 0, 0, 1, 1, 1, 2, 2, 3, 3, 4',
        help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}, smallest first. Repeats are welcome.`,
      },
    ],
    parse: parseInput,
    format: ({ nums }) => ({ nums: nums.join(', ') }),
    presets: [
      { label: 'Classic: 0, 0, 1, 1, 1, 2, 2, 3, 3, 4', value: { nums: [0, 0, 1, 1, 1, 2, 2, 3, 3, 4] } },
      { label: 'Already unique', value: { nums: [1, 2, 3, 4] } },
      { label: 'All the same', value: { nums: [7, 7, 7, 7, 7] } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 3, 11)
      // A small range, so repeats are common.
      const nums = Array.from({ length: len }, () => randInt(rand, -4, 8)).sort((a, b) => a - b)
      return { nums }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
