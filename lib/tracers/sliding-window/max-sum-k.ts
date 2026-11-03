/**
 * Sliding window — maximum sum of a fixed-size window.
 *
 * PILOT tracer: later lessons copy this file's shape. Layout:
 *   1. input type, parsing and presets
 *   2. frame helpers (scene / vars / gauge / predicts)
 *   3. `run` — the real algorithm, recording one frame per idea
 *   4. `reference` — a boring brute force the tests compare against
 *
 * Code lives in content/code/sliding-window/max-sum-k.{py,java,cpp}; each rule
 * below is an anchor in all three files.
 */
import { mulberry32 } from '../rng'
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

export interface MaxSumKInput {
  nums: number[]
  k: number
}

const LIMITS: InputLimits = { maxN: 12, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<MaxSumKInput> {
  const numsText = (raw.nums ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = numsText.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'nums', error: 'Type at least one number, like 2, 1, 5, 1, 3, 2.' }
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

  const kText = (raw.k ?? '').replace(/[−–]/g, '-').trim()
  if (kText === '') return { ok: false, field: 'k', error: 'Type a window size k, like 3.' }
  if (!INTEGER.test(kText)) return { ok: false, field: 'k', error: `k must be a whole number, not "${kText}".` }
  const k = Number(kText)
  if (k < 1) return { ok: false, field: 'k', error: 'k must be at least 1.' }
  if (k > nums.length) {
    return {
      ok: false,
      field: 'k',
      error: `k can't be bigger than the number of values (you gave ${nums.length}).`,
    }
  }
  return { ok: true, value: { nums, k } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const EXPAND_ONLY = 'Expand only'
const EXPAND_THEN_SHRINK = 'Expand, then shrink from the left'

/** "2 + 1 + 5 = 8", negatives in brackets so "+ -1" never appears. */
function equation(values: number[], sum: number): string {
  const terms = values.map((v) => (v < 0 ? `(${v})` : `${v}`))
  return `${terms.join(' + ')} = ${sum}`
}

/** Short description of a window's sum for the narration. */
function describeWindow(values: number[], sum: number): string {
  if (values.length === 1) return `just ${values[0]}`
  if (values.length <= 4) return equation(values, sum)
  return `${values.length} numbers summing to ${sum}`
}

function expandOrShrinkPredict(size: number, k: number): PredictCandidate {
  const full = size === k
  return {
    tag: 'expand-or-shrink',
    kind: 'choice',
    prompt: `The window holds ${size} of ${k} numbers. What happens next?`,
    options: [EXPAND_ONLY, EXPAND_THEN_SHRINK],
    answer: full ? EXPAND_THEN_SHRINK : EXPAND_ONLY,
    why: full
      ? `Adding one more makes ${k + 1} numbers, one too many, so the oldest number on the left has to go.`
      : `The window has room for ${k - size} more, so it just grows.`,
    hint: 'Compare the window size with k.',
  }
}

function newBestPredict(window: number, best: number): PredictCandidate {
  const none = best === -Infinity
  let why: string
  if (none) why = 'There is nothing to beat yet, so the first full window becomes the best.'
  else if (window > best) why = `${window} is bigger than ${best}, so it replaces the best.`
  else if (window === best) why = `${window} only ties ${best}. It has to be bigger to replace the best.`
  else why = `${window} is smaller than ${best}, so the best stays.`
  return {
    tag: 'new-best',
    kind: 'choice',
    prompt: none
      ? `The window sums to ${window} and there is no best yet. Is this a new best?`
      : `The window sums to ${window} and the best so far is ${best}. Is this a new best?`,
    options: ['Yes', 'No'],
    answer: window > best ? 'Yes' : 'No',
    why,
    hint: 'Compare the window sum with the best so far.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums, k }: MaxSumKInput) {
  const rec = createRecorder<number>()
  const n = nums.length

  // Working state — mirrors the variables in the code files.
  let window = 0
  let best = -Infinity
  let left = 0
  let bestStart = -1

  /** Record a frame from the current state. `right` is -1 before the loop starts. */
  const emit = (
    right: number,
    at: string,
    say: string,
    extra: {
      marks?: ArrayScene['marks']
      window?: ArrayScene['window']
      pointers?: boolean
      annotations?: ArrayScene['annotations']
      predict?: PredictCandidate
    } = {},
  ): void => {
    const size = right - left + 1
    const scene: ArrayScene = {
      kind: 'array',
      label: 'nums',
      cells: nums.slice(),
      window: extra.window !== undefined ? extra.window : size > 0 ? { start: left, end: right } : null,
    }
    if (extra.pointers !== false) {
      scene.pointers = [
        { name: 'left', index: left, role: 'ptrA' },
        { name: 'right', index: right, role: 'ptrB' },
      ]
    }
    if (extra.marks?.length) scene.marks = extra.marks
    if (extra.annotations?.length) scene.annotations = extra.annotations

    const vars: Record<string, Val> = { right, left, window, best: best === -Infinity ? null : best }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: size, max: k, label: 'Window size' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit(-1, 'init', `Start with an empty window and no best sum yet. The window will hold ${k} number${k === 1 ? '' : 's'}.`, {
    predict: expandOrShrinkPredict(0, k),
  })

  for (let right = 0; right < n && !rec.capped; right++) {
    window += nums[right]
    const size = right - left + 1
    const overflow = size > k
    const justFilled = size === k // window is exactly full after this expand
    const expandSay = size === 1
      ? `Add ${nums[right]} — window is now just ${nums[right]}.`
      : `Add ${nums[right]} — window is now ${describeWindow(nums.slice(left, right + 1), window)}${overflow ? `, one too many` : ''}.`
    emit(right, 'expand', expandSay, {
      marks: [{ index: right, role: 'changed' }],
      annotations: overflow ? [{ target: 'window', text: `${size} numbers, one too many` }] : undefined,
      // After an expand the next frame is a shrink (no predict), a record, or another expand.
      predict: overflow ? undefined : justFilled ? newBestPredict(window, best) : expandOrShrinkPredict(size, k),
    })

    if (overflow) {
      const dropped = nums[left]
      window -= dropped
      const droppedIndex = left
      left++
      emit(right, 'shrink', `Drop ${dropped} from the left — window is back to ${describeWindow(nums.slice(left, right + 1), window)}.`, {
        marks: [{ index: droppedIndex, role: 'discarded' }],
        predict: newBestPredict(window, best),
      })
    }

    if (right - left + 1 === k) {
      const improved = window > best
      let say: string
      if (improved && best === -Infinity) say = `Window is full with sum ${window} — that's the first best.`
      else if (improved) say = `Window sum is ${window} — beats ${best}, so it's the new best.`
      else if (window === best) say = `Window sum is ${window} — ties the best of ${best}, so the best stays.`
      else say = `Window sum is ${window} — smaller than the best of ${best}, so the best stays.`
      if (improved) {
        best = window
        bestStart = left
      }
      const marks: ArrayScene['marks'] = improved
        ? nums.slice(left, right + 1).map((_, i) => ({ index: left + i, role: 'found' as const }))
        : []
      emit(right, 'record', say, {
        marks,
        annotations: [{ target: 'window', text: `sum ${window}` }],
        predict: right + 1 < n ? expandOrShrinkPredict(k, k) : undefined,
      })
    }
  }

  const bestWindow = bestStart >= 0 ? nums.slice(bestStart, bestStart + k) : []
  emit(n - 1, 'done', `Done — the best window of ${k} number${k === 1 ? '' : 's'} is [${bestWindow.join(', ')}], summing to ${best}.`, {
    pointers: false,
    window: bestStart >= 0 ? { start: bestStart, end: bestStart + k - 1 } : null,
    marks: bestWindow.map((_, i) => ({ index: bestStart + i, role: 'found' as const })),
  })

  return rec.done(best)
}

/** Independent brute force: sum every window from scratch. */
function reference({ nums, k }: MaxSumKInput): number {
  let best = -Infinity
  for (let start = 0; start + k <= nums.length; start++) {
    let sum = 0
    for (let i = start; i < start + k; i++) sum += nums[i]
    if (sum > best) best = sum
  }
  return best
}

const tracer: Tracer<MaxSumKInput, number> = {
  id: 'sliding-window/max-sum-k',
  title: 'Fixed-size window',
  anchors: {
    init: 'Start with an empty window',
    expand: 'Add nums[right] to the window',
    shrink: 'Too big? Drop nums[left] and move left on',
    record: 'Window is full — compare with the best',
    done: 'Return the best sum',
  },
  vars: [
    { name: 'right', role: 'ptrB' },
    { name: 'left', role: 'ptrA' },
    { name: 'window', label: 'window sum', role: 'value' },
    { name: 'best', label: 'best sum', role: 'best' },
  ],
  input: {
    fields: [
      { name: 'nums', label: 'Numbers', kind: 'int-array', placeholder: 'e.g. 2, 1, 5, 1, 3, 2', help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}.` },
      { name: 'k', label: 'Window size (k)', kind: 'int', placeholder: 'e.g. 3', help: 'How many numbers the window holds. Between 1 and the number of values.' },
    ],
    parse: parseInput,
    format: ({ nums, k }) => ({ nums: nums.join(', '), k: String(k) }),
    presets: [
      { label: 'Classic: best 3 in a row', value: { nums: [2, 1, 5, 1, 3, 2], k: 3 } },
      { label: 'Negatives and a tie', value: { nums: [4, -1, 2, 1, -5, 4], k: 2 } },
      { label: 'Window as big as the array', value: { nums: [1, 1, 1, 1, 1], k: 5 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = 4 + Math.floor(rand() * 7) // 4..10
      const nums = Array.from({ length: len }, () => -9 + Math.floor(rand() * 30)) // -9..20
      const k = 1 + Math.floor(rand() * len) // 1..len
      return { nums, k }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
