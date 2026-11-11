/**
 * Two pointers, converging — find a pair in a sorted array that adds up to a
 * target (LeetCode 167, Two Sum II).
 *
 * Same layout as the sliding-window pilot:
 *   1. input type, parsing and presets
 *   2. frame helpers (narration / predicts)
 *   3. `run` — the real algorithm, recording one frame per idea
 *   4. `reference` — a boring brute force the tests compare against
 *
 * Result convention (used by the code files, the reference and the lesson):
 * positions are 1-indexed like LeetCode, so the answer for [1, 2, 4, 6, 8, 10, 15]
 * and target 18 is [5, 6]. No pair is [-1, -1].
 *
 * When several pairs work, the pointers find the outermost one (smallest left
 * index, then largest right index). The reference picks the same pair on purpose.
 *
 * Code lives in content/code/two-pointers/pair-sum.{py,java,cpp}.
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

export interface PairSumInput {
  /** Sorted ascending (equal neighbours are fine). */
  nums: number[]
  target: number
}

const LIMITS: InputLimits = { maxN: 12, min: -99, max: 99 }
/** Two numbers from -99..99 can sum to anything in this range. */
const TARGET_MAX = LIMITS.max * 2

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<PairSumInput> {
  const numsText = (raw.nums ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = numsText.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length < 2) {
    return { ok: false, field: 'nums', error: 'Type at least two numbers, like 1, 2, 4, 6.' }
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
      return { ok: false, field: 'nums', error: 'Two pointers needs the numbers sorted — try 1, 2, 4, 6' }
    }
  }

  const targetText = (raw.target ?? '').replace(/[−–]/g, '-').trim()
  if (targetText === '') return { ok: false, field: 'target', error: 'Type a target sum, like 18.' }
  if (!INTEGER.test(targetText)) {
    return { ok: false, field: 'target', error: `The target must be a whole number, not "${targetText}".` }
  }
  const target = Number(targetText)
  if (target < -TARGET_MAX || target > TARGET_MAX) {
    return { ok: false, field: 'target', error: `Keep the target between ${-TARGET_MAX} and ${TARGET_MAX}.` }
  }
  return { ok: true, value: { nums, target } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const MOVE_LEFT = 'Move left →'
const MOVE_RIGHT = 'Move right ←'

/** "-3 + 10 = 7" — negatives in brackets so "+ -3" never appears. */
function sumText(a: number, b: number, total: number): string {
  const term = (v: number): string => (v < 0 ? `(${v})` : `${v}`)
  return `${term(a)} + ${term(b)} = ${total}`
}

function whichPointerPredict(total: number, target: number, smallest: number, largest: number): PredictCandidate {
  const tooSmall = total < target
  return {
    tag: 'which-pointer-moves',
    kind: 'choice',
    prompt: `Sum is ${total}, target is ${target}. Which pointer moves?`,
    options: [MOVE_LEFT, MOVE_RIGHT],
    answer: tooSmall ? MOVE_LEFT : MOVE_RIGHT,
    why: tooSmall
      ? `${total} is too small. Right already sits on the biggest number (${largest}), so only a bigger left number can help.`
      : `${total} is too big. Left already sits on the smallest number (${smallest}), so only a smaller right number can help.`,
    hint: 'Too small needs a bigger number. Too big needs a smaller one.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums, target }: PairSumInput) {
  const rec = createRecorder<[number, number]>()
  const n = nums.length

  // Working state — mirrors the variables in the code files.
  let left = 0
  let right = n - 1
  let total: number | null = null

  /** Record a frame from the current state. */
  const emit = (
    at: string,
    say: string,
    extra: {
      marks?: ArrayScene['marks']
      pointers?: boolean
      annotations?: ArrayScene['annotations']
      predict?: PredictCandidate
      /** Cells that are out of play: everything outside left..right unless overridden. */
      discardAll?: boolean
    } = {},
  ): void => {
    const marks: NonNullable<ArrayScene['marks']> = []
    for (let i = 0; i < n; i++) {
      if (extra.discardAll || i < left || i > right) marks.push({ index: i, role: 'discarded' })
    }
    for (const m of extra.marks ?? []) {
      const at2 = marks.findIndex((x) => x.index === m.index)
      if (at2 >= 0) marks.splice(at2, 1) // a stronger role replaces "discarded"
      marks.push(m)
    }
    const scene: ArrayScene = { kind: 'array', label: 'nums', cells: nums.slice() }
    if (extra.pointers !== false) {
      scene.pointers = [
        { name: 'left', index: left, role: 'ptrA' },
        { name: 'right', index: right, role: 'ptrB' },
      ]
    }
    if (marks.length) scene.marks = marks
    if (extra.annotations?.length) scene.annotations = extra.annotations

    const vars: Record<string, Val> = { left, right, total }
    const frame: Frame = { scene, vars, say, at }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit(
    'init',
    `Put one pointer at each end of the sorted list: left on ${nums[left]}, right on ${nums[right]}. We want two numbers adding up to ${target}.`,
    {
      annotations: [
        { target: 'ptr:left', text: 'smallest' },
        { target: 'ptr:right', text: 'largest' },
      ],
    },
  )

  let found = false
  while (left < right && !rec.capped) {
    const a = nums[left]
    const b = nums[right]
    total = a + b
    const equal = total === target

    emit('compare', `${sumText(a, b, total)}. Compare it with the target ${target}.`, {
      marks: [
        { index: left, role: 'compare' },
        { index: right, role: 'compare' },
      ],
      predict: equal ? undefined : whichPointerPredict(total, target, a, b),
    })
    if (rec.capped) break

    if (equal) {
      emit('found', `That equals the target ${target} — ${a} and ${b} are the pair.`, {
        marks: [
          { index: left, role: 'found' },
          { index: right, role: 'found' },
        ],
      })
      found = true
      break
    }

    if (total < target) {
      const dropped = left
      left++
      emit(
        'move-left',
        `${total} is below ${target}, and ${b} is the biggest partner ${a} could get. Drop ${a}, move left on to ${nums[left]}.`,
        { marks: [{ index: dropped, role: 'discarded' }] },
      )
    } else {
      const dropped = right
      right--
      emit(
        'move-right',
        `${total} is above ${target}, and ${a} is the smallest partner ${b} could get. Drop ${b}, move right back to ${nums[right]}.`,
        { marks: [{ index: dropped, role: 'discarded' }] },
      )
    }
  }

  let result: [number, number]
  if (found) {
    result = [left + 1, right + 1]
    emit('done', `Return [${result[0]}, ${result[1]}] — the positions of ${nums[left]} and ${nums[right]}, counting from 1.`, {
      pointers: false,
      marks: [
        { index: left, role: 'found' },
        { index: right, role: 'found' },
      ],
    })
  } else {
    result = [-1, -1]
    emit('done', `The pointers met, so no pair adds up to ${target}. Return [-1, -1].`, { pointers: false, discardAll: true })
  }

  return rec.done(result)
}

/** Independent brute force: try every pair, outermost first (smallest i, then largest j). */
function reference({ nums, target }: PairSumInput): [number, number] {
  for (let i = 0; i < nums.length; i++) {
    for (let j = nums.length - 1; j > i; j--) {
      if (nums[i] + nums[j] === target) return [i + 1, j + 1]
    }
  }
  return [-1, -1]
}

const tracer: Tracer<PairSumInput, [number, number]> = {
  id: 'two-pointers/pair-sum',
  title: 'Converging pointers',
  anchors: {
    init: 'Put left at the start and right at the end',
    compare: 'Add nums[left] and nums[right]',
    found: 'Equal to the target? Found the pair',
    'move-left': 'Too small: move left forward',
    'move-right': 'Too big: move right back',
    done: 'Return the positions (or [-1, -1])',
  },
  vars: [
    { name: 'left', role: 'ptrA' },
    { name: 'right', role: 'ptrB' },
    { name: 'total', label: 'sum', role: 'value' },
  ],
  input: {
    fields: [
      {
        name: 'nums',
        label: 'Sorted numbers',
        kind: 'int-array',
        placeholder: 'e.g. 1, 2, 4, 6, 8, 10, 15',
        help: `2 to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}, smallest first.`,
      },
      {
        name: 'target',
        label: 'Target sum',
        kind: 'int',
        placeholder: 'e.g. 18',
        help: `The sum the pair must reach. Between ${-TARGET_MAX} and ${TARGET_MAX}.`,
      },
    ],
    parse: parseInput,
    format: ({ nums, target }) => ({ nums: nums.join(', '), target: String(target) }),
    presets: [
      { label: 'Classic: pair adds to 18', value: { nums: [1, 2, 4, 6, 8, 10, 15], target: 18 } },
      { label: 'Found on the third try', value: { nums: [2, 7, 11, 15], target: 9 } },
      { label: 'No pair works', value: { nums: [1, 3, 5, 8], target: 10 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 4, 10)
      const nums = Array.from({ length: len }, () => randInt(rand, -9, 30)).sort((a, b) => a - b)
      let target: number
      if (rand() < 0.7) {
        // Usually a real pair, so most runs end in a match.
        const i = randInt(rand, 0, len - 2)
        const j = randInt(rand, i + 1, len - 1)
        target = nums[i] + nums[j]
      } else {
        target = randInt(rand, -15, 60)
      }
      return { nums, target }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
