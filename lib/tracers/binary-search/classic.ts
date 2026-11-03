/**
 * Binary search — find a target in a sorted array (LeetCode 704).
 *
 * Same layout as the sliding-window tracers:
 *   1. input type, parsing and presets
 *   2. frame helpers (narration / predicts)
 *   3. `run` — the real algorithm, recording one frame per idea
 *   4. `reference` — a boring linear scan the tests compare against
 *
 * The range [lo, hi] is inclusive on both ends. Every look at nums[mid] throws
 * away half of what is left, so the scene shows the eliminated cells piling up
 * as `discarded` marks. Code lives in content/code/binary-search/classic.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  ArrayScene,
  Frame,
  InputField,
  InputLimits,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface ClassicInput {
  /** Strictly increasing, so the answer index is unambiguous. */
  nums: number[]
  target: number
}

export const LIMITS: InputLimits = { maxN: 12, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/

export const SORTED_FIELDS: InputField[] = [
  { name: 'nums', label: 'Sorted numbers', kind: 'int-array', placeholder: 'e.g. 2, 5, 8, 12, 16, 23, 38', help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}, smallest first.` },
  { name: 'target', label: 'Target', kind: 'int', placeholder: 'e.g. 23', help: `The number to look for. Between ${LIMITS.min} and ${LIMITS.max}.` },
]

/**
 * Shared by both binary-search tracers. `allowRepeats` is true for the
 * boundary-finding tracer, where equal neighbours are the interesting case.
 */
export function parseSortedInput(
  raw: Record<string, string>,
  allowRepeats: boolean,
): ParseResult<{ nums: number[]; target: number }> {
  const numsText = (raw.nums ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = numsText.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'nums', error: 'Type at least one number, like 2, 5, 8, 12, 16.' }
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
      return {
        ok: false,
        field: 'nums',
        error: `Binary search needs the numbers in order, smallest first. ${nums[i]} comes after ${nums[i - 1]}.`,
      }
    }
    if (!allowRepeats && nums[i] === nums[i - 1]) {
      return {
        ok: false,
        field: 'nums',
        error: `Use each number once here (${nums[i]} appears twice) so the answer index is clear.`,
      }
    }
  }

  const targetText = (raw.target ?? '').replace(/[−–]/g, '-').trim()
  if (targetText === '') return { ok: false, field: 'target', error: 'Type a target to look for, like 23.' }
  if (!INTEGER.test(targetText)) {
    return { ok: false, field: 'target', error: `The target must be a whole number, not "${targetText}".` }
  }
  const target = Number(targetText)
  if (target < LIMITS.min || target > LIMITS.max) {
    return { ok: false, field: 'target', error: `Keep the target between ${LIMITS.min} and ${LIMITS.max}.` }
  }
  return { ok: true, value: { nums, target } }
}

/** Sorted array of `len` numbers; `repeats` lets some neighbours be equal. Deterministic in `rand`. */
export function randomSorted(rand: () => number, len: number, repeats: boolean): number[] {
  const nums: number[] = []
  let value = randInt(rand, -40, 10)
  for (let i = 0; i < len; i++) {
    nums.push(value)
    value += randInt(rand, repeats ? 0 : 1, 8)
  }
  return nums
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const LEFT_HALF = 'Left half'
const RIGHT_HALF = 'Right half'

/** "Index 4 is" / "Indexes 0 to 4 are" — for the sentence about what just left play. */
function outOfPlay(from: number, to: number): string {
  return from === to ? `Index ${from} is` : `Indexes ${from} to ${to} are`
}

function whichHalfPredict(value: number, target: number, mid: number): PredictCandidate {
  const bigger = value > target
  return {
    tag: 'which-half',
    kind: 'choice',
    prompt: `nums[mid] = ${value} is ${bigger ? 'bigger' : 'smaller'} than ${target}. Where can ${target} still be?`,
    options: [LEFT_HALF, RIGHT_HALF],
    answer: bigger ? LEFT_HALF : RIGHT_HALF,
    why: bigger
      ? `The list is sorted, so everything right of index ${mid} is at least ${value}. Too big. Only the left half is left.`
      : `The list is sorted, so everything left of index ${mid} is at most ${value}. Too small. Only the right half is left.`,
    hint: 'The list is sorted: which side holds the bigger numbers?',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums, target }: ClassicInput) {
  const rec = createRecorder<number>()
  const n = nums.length

  // Working state — mirrors the variables in the code files.
  let lo = 0
  let hi = n - 1
  let mid: number | null = null
  let looks = 0

  /** Record a frame from the current state. */
  const emit = (
    at: string,
    say: string,
    extra: {
      pointers?: 'range' | 'range+mid' | 'none'
      marks?: ArrayScene['marks']
      /** Mark everything outside [lo, hi] as discarded (default true). */
      discard?: boolean
      annotations?: ArrayScene['annotations']
      predict?: PredictCandidate
    } = {},
  ): void => {
    const pointers = extra.pointers ?? 'range'
    const marks: NonNullable<ArrayScene['marks']> = []
    if (extra.discard !== false) {
      for (let i = 0; i < n; i++) if (i < lo || i > hi) marks.push({ index: i, role: 'discarded' })
    }
    for (const m of extra.marks ?? []) marks.push(m)

    const scene: ArrayScene = {
      kind: 'array',
      label: 'nums',
      cells: nums.slice(),
      window: lo <= hi ? { start: lo, end: hi } : null,
    }
    if (pointers !== 'none') {
      scene.pointers = [
        { name: 'lo', index: lo, role: 'ptrA' },
        { name: 'hi', index: hi, role: 'ptrB' },
      ]
      if (pointers === 'range+mid' && mid !== null) scene.pointers.push({ name: 'mid', index: mid, role: 'focus' })
    }
    if (marks.length) scene.marks = marks
    if (extra.annotations?.length) scene.annotations = extra.annotations

    const vars: Record<string, Val> = { lo, hi, mid, target }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: Math.max(0, hi - lo + 1), max: n, label: 'Candidates left' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit('init', `Look for ${target} in a sorted list of ${n}. Nothing is ruled out yet: lo = 0, hi = ${hi}.`)

  let result = -1
  while (lo <= hi && !rec.capped) {
    mid = lo + Math.floor((hi - lo) / 2)
    const value = nums[mid]
    looks++

    const midSay =
      looks === 1
        ? `Middle of ${lo}..${hi}: mid = lo + (hi − lo) / 2 = ${mid}. That form can't overflow, unlike (lo + hi) / 2.`
        : lo === hi
          ? `Only index ${mid} is left: mid = ${mid}, which holds ${value}.`
          : `Middle of indexes ${lo} to ${hi}: mid = ${mid}, which holds ${value}.`
    emit('mid', midSay, { pointers: 'range+mid' })
    if (rec.capped) break

    const compareMarks: ArrayScene['marks'] = [{ index: mid, role: 'compare' }]
    if (value === target) {
      emit('check', `nums[${mid}] = ${value} is exactly ${target} — found it!`, {
        pointers: 'range+mid',
        marks: compareMarks,
        annotations: [{ target: `cell:${mid}`, text: `${value} = ${target}` }],
      })
      result = mid
      break
    }

    const smaller = value < target
    emit(
      'check',
      smaller
        ? `nums[${mid}] = ${value} is smaller than ${target}, so ${target} can't be at ${mid} or anywhere to its left.`
        : `nums[${mid}] = ${value} is bigger than ${target}, so ${target} can't be at ${mid} or anywhere to its right.`,
      {
        pointers: 'range+mid',
        marks: compareMarks,
        annotations: [{ target: `cell:${mid}`, text: `${value} ${smaller ? '<' : '>'} ${target}` }],
        predict: whichHalfPredict(value, target, mid),
      },
    )
    if (rec.capped) break

    if (smaller) {
      const oldLo = lo
      lo = mid + 1
      emit('go-right', `Drop the left half: lo = mid + 1 = ${lo}. ${outOfPlay(oldLo, mid)} out of play.`)
    } else {
      const oldHi = hi
      hi = mid - 1
      emit('go-left', `Drop the right half: hi = mid − 1 = ${hi}. ${outOfPlay(mid, oldHi)} out of play.`)
    }
  }

  if (result >= 0) {
    const marks: NonNullable<ArrayScene['marks']> = []
    for (let i = 0; i < n; i++) marks.push({ index: i, role: i === result ? 'found' : 'discarded' })
    emit('done', `Found ${target} at index ${result} after ${looks} look${looks === 1 ? '' : 's'}. Return ${result}.`, {
      pointers: 'none',
      discard: false,
      marks,
    })
  } else {
    emit('done', `lo (${lo}) has passed hi (${hi}): nothing is left to search, so ${target} isn't here. Return −1.`)
  }

  return rec.done(result)
}

/** Independent linear scan: check every cell from the left. */
function reference({ nums, target }: ClassicInput): number {
  for (let i = 0; i < nums.length; i++) if (nums[i] === target) return i
  return -1
}

const tracer: Tracer<ClassicInput, number> = {
  id: 'binary-search/classic',
  title: 'Find a value',
  anchors: {
    init: 'Start with the whole array: lo = 0, hi = n − 1',
    mid: 'Look at the middle: mid = lo + (hi − lo) / 2',
    check: 'Compare nums[mid] with the target',
    'go-right': 'Too small: drop the left half (lo = mid + 1)',
    'go-left': 'Too big: drop the right half (hi = mid − 1)',
    done: 'Return mid when found, or −1 once lo passes hi',
  },
  vars: [
    { name: 'lo', role: 'ptrA' },
    { name: 'hi', role: 'ptrB' },
    { name: 'mid', role: 'focus' },
    { name: 'target', role: 'value' },
  ],
  input: {
    fields: SORTED_FIELDS,
    parse: (raw) => parseSortedInput(raw, false),
    format: ({ nums, target }) => ({ nums: nums.join(', '), target: String(target) }),
    presets: [
      { label: 'Found: look for 23', value: { nums: [2, 5, 8, 12, 16, 23, 38, 56, 72], target: 23 } },
      { label: 'Not found: look for 7', value: { nums: [2, 5, 8, 12, 16, 23, 38, 56, 72], target: 7 } },
      { label: 'Single element', value: { nums: [42], target: 42 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const nums = randomSorted(rand, randInt(rand, 1, 12), false)
      // Roughly half the runs search for something that is there, the rest for a miss.
      const target =
        rand() < 0.55 ? nums[randInt(rand, 0, nums.length - 1)] : randInt(rand, Math.max(LIMITS.min, nums[0] - 10), Math.min(LIMITS.max, nums[nums.length - 1] + 10))
      return { nums, target }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
