/**
 * Sliding window — shortest subarray whose sum reaches a target (LeetCode 209).
 *
 * The variable-size twin of max-sum-k. Same layout as the pilot:
 *   1. input type, parsing and presets
 *   2. frame helpers (narration / predicts)
 *   3. `run` — the real algorithm, recording one frame per idea
 *   4. `reference` — a boring brute force the tests compare against
 *
 * Numbers are positive, so growing the window always raises the sum and
 * shrinking always lowers it; that is what makes the window rule work.
 * Code lives in content/code/sliding-window/min-len-target.{py,java,cpp}.
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

export interface MinLenTargetInput {
  nums: number[]
  target: number
}

const LIMITS: InputLimits = { maxN: 12, min: 1, max: 99 }
const TARGET_MAX = 999

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<MinLenTargetInput> {
  const numsText = (raw.nums ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = numsText.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'nums', error: 'Type at least one number, like 2, 3, 1, 2, 4, 3.' }
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
      return {
        ok: false,
        field: 'nums',
        error: `Keep every number between ${LIMITS.min} and ${LIMITS.max}. This version needs positive numbers.`,
      }
    }
    nums.push(value)
  }

  const targetText = (raw.target ?? '').replace(/[−–]/g, '-').trim()
  if (targetText === '') return { ok: false, field: 'target', error: 'Type a target sum, like 7.' }
  if (!INTEGER.test(targetText)) {
    return { ok: false, field: 'target', error: `The target must be a whole number, not "${targetText}".` }
  }
  const target = Number(targetText)
  if (target < 1 || target > TARGET_MAX) {
    return { ok: false, field: 'target', error: `Keep the target between 1 and ${TARGET_MAX}.` }
  }
  return { ok: true, value: { nums, target } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const KEEP_EXPANDING = 'Keep expanding'
const SHRINK_LEFT = 'Shrink from the left'
const YES = 'Yes'
const NO = 'No'

/** "2 + 3 + 1 = 6" */
function equation(values: number[], sum: number): string {
  return `${values.join(' + ')} = ${sum}`
}

/** Short description of a window's sum for the narration. */
function describeWindow(values: number[], sum: number): string {
  if (values.length === 0) return 'empty'
  if (values.length === 1) return `just ${values[0]}`
  if (values.length <= 4) return equation(values, sum)
  return `${values.length} numbers summing to ${sum}`
}

/** Expand-or-shrink question; null when there is nothing left to expand into and the sum is too small. */
function expandOrShrinkPredict(sum: number, target: number, canExpand: boolean): PredictCandidate | undefined {
  const enough = sum >= target
  if (!enough && !canExpand) return undefined
  return {
    tag: 'expand-or-shrink',
    kind: 'choice',
    prompt: `Sum is ${sum}, target is ${target}. Expand or shrink?`,
    options: [KEEP_EXPANDING, SHRINK_LEFT],
    answer: enough ? SHRINK_LEFT : KEEP_EXPANDING,
    why: enough
      ? `${sum} already reaches ${target}, so the window is big enough. Now see whether a shorter one still works.`
      : `${sum} is still below ${target}, and shrinking would only lower it, so add the next number.`,
    hint: 'Compare the sum with the target.',
  }
}

function newBestPredict(length: number, best: number): PredictCandidate {
  const none = best === Infinity
  let why: string
  if (none) why = 'There is no best yet, so the first window that works becomes the best.'
  else if (length < best) why = `${length} is shorter than ${best}, so it replaces the best.`
  else if (length === best) why = `${length} only ties ${best}. It has to be shorter to replace the best.`
  else why = `${length} is longer than ${best}, so the best stays.`
  return {
    tag: 'new-best',
    kind: 'choice',
    prompt: none
      ? `The window is ${length} long and there is no best yet. Is this the shortest so far?`
      : `The window is ${length} long and the shortest so far is ${best}. Is this a new shortest?`,
    options: [YES, NO],
    answer: length < best ? YES : NO,
    why,
    hint: 'Shorter is better here. Compare the window length with the best.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums, target }: MinLenTargetInput) {
  const rec = createRecorder<number>()
  const n = nums.length

  // Working state — mirrors the variables in the code files.
  let window = 0
  let best = Infinity
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

    const vars: Record<string, Val> = { right, left, window, best: best === Infinity ? null : best }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: window, max: target, label: 'Window sum vs target' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit(-1, 'init', `Start with an empty window and no best length yet. We want the shortest stretch that adds up to ${target} or more.`)

  for (let right = 0; right < n && !rec.capped; right++) {
    window += nums[right]
    const canExpand = right + 1 < n
    const sumNote: ArrayScene['annotations'] = [{ target: 'window', text: `sum ${window}` }]
    const addSay =
      right === left
        ? `Add ${nums[right]} — the window is just ${nums[right]}.`
        : `Add ${nums[right]} — window is now ${describeWindow(nums.slice(left, right + 1), window)}.`
    emit(right, 'expand', addSay, {
      marks: [{ index: right, role: 'changed' }],
      annotations: sumNote,
      predict: expandOrShrinkPredict(window, target, canExpand),
    })

    // `while window >= target` — every pass through the loop test is one check frame.
    for (;;) {
      const enough = window >= target
      const length = right - left + 1
      const notes: ArrayScene['annotations'] = length > 0 ? [{ target: 'window', text: `sum ${window}` }] : undefined
      if (!enough) {
        const say = canExpand
          ? `Sum ${window} is below ${target} — not big enough yet, so add the next number.`
          : `Sum ${window} is below ${target} and there is nothing left to add.`
        emit(right, 'check', say, { annotations: notes })
        break
      }
      emit(right, 'check', `Sum ${window} is at least ${target} — big enough. Record its length, then try a shorter window.`, {
        annotations: notes,
        predict: newBestPredict(length, best),
      })
      if (rec.capped) break

      const improved = length < best
      let recordSay: string
      if (improved && best === Infinity) recordSay = `The window is ${length} long — the first one that works, so the best length is ${length}.`
      else if (improved) recordSay = `Length ${length} beats ${best} — the new shortest window.`
      else if (length === best) recordSay = `Length ${length} only ties the best of ${best}, so the earlier window stays.`
      else recordSay = `Length ${length} is longer than the best of ${best}, so the best stays.`
      if (improved) {
        best = length
        bestStart = left
      }
      emit(right, 'record', recordSay, {
        marks: improved ? nums.slice(left, right + 1).map((_, i) => ({ index: left + i, role: 'found' as const })) : [],
        annotations: notes,
      })

      const dropped = nums[left]
      const droppedIndex = left
      window -= dropped
      left++
      const nowEmpty = right - left + 1 === 0
      emit(
        right,
        'shrink',
        nowEmpty
          ? `Drop ${dropped} from the left — the window is empty again.`
          : `Drop ${dropped} from the left — window is now ${describeWindow(nums.slice(left, right + 1), window)}.`,
        {
          marks: [{ index: droppedIndex, role: 'discarded' }],
          annotations: nowEmpty ? undefined : [{ target: 'window', text: `sum ${window}` }],
          // The next frame is always the check, which reveals the decision.
          predict: expandOrShrinkPredict(window, target, canExpand),
        },
      )
      if (rec.capped) break
    }
  }

  const total = nums.reduce((a, b) => a + b, 0)
  if (bestStart >= 0) {
    const bestWindow = nums.slice(bestStart, bestStart + best)
    emit(
      n - 1,
      'done',
      `Done — the shortest window is [${bestWindow.join(', ')}], ${best} number${best === 1 ? '' : 's'} adding up to ${bestWindow.reduce((a, b) => a + b, 0)}.`,
      {
        pointers: false,
        window: { start: bestStart, end: bestStart + best - 1 },
        marks: bestWindow.map((_, i) => ({ index: bestStart + i, role: 'found' as const })),
      },
    )
  } else {
    emit(n - 1, 'done', `Done — even all ${n} numbers only add up to ${total}, short of ${target}, so the answer is 0.`, {
      pointers: false,
      window: null,
    })
  }

  return rec.done(bestStart >= 0 ? best : 0)
}

/** Independent brute force: try every start and end, sum from scratch. */
function reference({ nums, target }: MinLenTargetInput): number {
  let best = 0
  for (let start = 0; start < nums.length; start++) {
    for (let end = start; end < nums.length; end++) {
      let sum = 0
      for (let i = start; i <= end; i++) sum += nums[i]
      const length = end - start + 1
      if (sum >= target && (best === 0 || length < best)) best = length
    }
  }
  return best
}

const tracer: Tracer<MinLenTargetInput, number> = {
  id: 'sliding-window/min-len-target',
  title: 'Variable-size window',
  anchors: {
    init: 'Start with an empty window',
    expand: 'Add nums[right] to the window',
    check: 'Is the sum at least target?',
    record: "Record the window length if it's the shortest",
    shrink: 'Shrink from the left to find a shorter one',
    done: 'Return the shortest length (or 0)',
  },
  vars: [
    { name: 'right', role: 'ptrB' },
    { name: 'left', role: 'ptrA' },
    { name: 'window', label: 'window sum', role: 'value' },
    { name: 'best', label: 'shortest length', role: 'best' },
  ],
  input: {
    fields: [
      { name: 'nums', label: 'Numbers', kind: 'int-array', placeholder: 'e.g. 2, 3, 1, 2, 4, 3', help: `Up to ${LIMITS.maxN} positive whole numbers from ${LIMITS.min} to ${LIMITS.max}.` },
      { name: 'target', label: 'Target sum', kind: 'int', placeholder: 'e.g. 7', help: `The sum a window must reach. Between 1 and ${TARGET_MAX}.` },
    ],
    parse: parseInput,
    format: ({ nums, target }) => ({ nums: nums.join(', '), target: String(target) }),
    presets: [
      { label: 'Classic: sum at least 7', value: { nums: [2, 3, 1, 2, 4, 3], target: 7 } },
      { label: 'One number is enough', value: { nums: [1, 4, 4], target: 4 } },
      { label: 'Impossible target', value: { nums: [1, 1, 1, 1], target: 9 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 4, 10)
      const nums = Array.from({ length: len }, () => randInt(rand, 1, 9))
      const total = nums.reduce((a, b) => a + b, 0)
      // Up to 15% above the total, so a few runs are impossible and return 0.
      const target = randInt(rand, 1, Math.max(1, Math.floor(total * 1.15)))
      return { nums, target }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
