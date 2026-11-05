/**
 * Binary search — the first position that is "big enough" (lower bound,
 * LeetCode 35 Search Insert Position).
 *
 * This is the boundary-finding template: the array is a run of "no" answers
 * (nums[i] < target) followed by a run of "yes" answers (nums[i] >= target), and
 * we want the first yes. It uses the half-open range [lo, hi), where hi may be
 * n ("maybe there is no yes at all"). The same template finds the smallest
 * speed, size or capacity that works in "binary search on the answer" problems.
 *
 * Layout follows binary-search/classic. Code lives in
 * content/code/binary-search/first-true.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { LIMITS, SORTED_FIELDS, parseSortedInput, randomSorted } from './classic'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  ArrayScene,
  Frame,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface FirstTrueInput {
  /** Sorted ascending; repeats allowed. */
  nums: number[]
  target: number
}

function parseInput(raw: Record<string, string>): ParseResult<FirstTrueInput> {
  return parseSortedInput(raw, true)
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const LEFT_HALF = 'Left half'
const RIGHT_HALF = 'Right half'
const KEEP_IT = 'Yes — keep it (hi = mid)'
const SKIP_IT = 'No — skip it (lo = mid + 1)'

/** Asked on the mid frame, before the comparison is shown: is the first big-enough number left or right of mid? */
function whichHalfPredict(value: number, target: number): PredictCandidate {
  const big = value >= target
  return {
    tag: 'which-half',
    kind: 'choice',
    prompt: `nums[mid] = ${value} and the target is ${target}. Where is the first number that is ${target} or more?`,
    options: [LEFT_HALF, RIGHT_HALF],
    answer: big ? LEFT_HALF : RIGHT_HALF,
    why: big
      ? `${value} is already ${target} or more, so the first such number is at mid or to its left.`
      : `${value} is too small, and so is everything left of it. The first big-enough number is to the right.`,
    hint: 'Is nums[mid] big enough? Numbers only get bigger to the right.',
  }
}

/** Asked on the check frame: can mid itself be the answer? */
function boundaryPredict(value: number, target: number, mid: number): PredictCandidate {
  const big = value >= target
  return {
    tag: 'boundary',
    kind: 'choice',
    prompt: `nums[mid] = ${value} is ${big ? `at least ${target}` : `below ${target}`}. Could mid itself be the answer?`,
    options: [KEEP_IT, SKIP_IT],
    answer: big ? KEEP_IT : SKIP_IT,
    why: big
      ? `Index ${mid} might be the very first big-enough spot, so keep it: hi = mid, not mid − 1.`
      : `${value} is too small to be the answer, so skip it: lo = mid + 1.`,
    hint: 'Only keep mid if nums[mid] is big enough.',
  }
}

function describeRange(lo: number, hi: number): string {
  return `indexes ${lo} to ${hi - 1}`
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums, target }: FirstTrueInput) {
  const rec = createRecorder<number>()
  const n = nums.length

  // Working state — mirrors the variables in the code files. [lo, hi) is half-open.
  let lo = 0
  let hi = n
  let mid: number | null = null

  const emit = (
    at: string,
    say: string,
    extra: {
      pointers?: 'range' | 'range+mid'
      marks?: ArrayScene['marks']
      annotations?: ArrayScene['annotations']
      predict?: PredictCandidate
      done?: boolean
    } = {},
  ): void => {
    const marks: NonNullable<ArrayScene['marks']> = []
    if (!extra.done) {
      // Left of lo is known too small. Right of hi is known big enough, but hi itself
      // stays unmarked: it is the best answer found so far.
      for (let i = 0; i < n; i++) if (i < lo || i > hi) marks.push({ index: i, role: 'discarded' })
    }
    for (const m of extra.marks ?? []) marks.push(m)

    const scene: ArrayScene = {
      kind: 'array',
      label: 'nums',
      cells: nums.slice(),
      window: lo < hi ? { start: lo, end: hi - 1 } : null,
    }
    if (!extra.done) {
      scene.pointers = [
        { name: 'lo', index: lo, role: 'ptrA' },
        { name: 'hi', index: hi, role: 'ptrB' },
      ]
      if (extra.pointers === 'range+mid' && mid !== null) scene.pointers.push({ name: 'mid', index: mid, role: 'focus' })
    }
    if (marks.length) scene.marks = marks
    if (extra.annotations?.length) scene.annotations = extra.annotations

    const vars: Record<string, Val> = { lo, hi, mid, target }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: hi - lo, max: n, label: 'Cells left to check' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit('init', `Find the first number that is ${target} or more. Search [lo, hi) = [0, ${n}); hi = ${n} means "maybe none is big enough".`)

  while (lo < hi && !rec.capped) {
    mid = lo + Math.floor((hi - lo) / 2)
    const value = nums[mid]
    const big = value >= target

    const where = hi - lo === 1 ? `the only index left` : `the middle of ${describeRange(lo, hi)}`
    emit('mid', `mid = ${lo} + (${hi} − ${lo}) / 2 = ${mid}, ${where}. It holds ${value}.`, {
      pointers: 'range+mid',
      predict: whichHalfPredict(value, target),
    })
    if (rec.capped) break

    emit(
      'check',
      big
        ? `nums[${mid}] = ${value} is at least ${target}: big enough. The first such number is here or to the left.`
        : `nums[${mid}] = ${value} is below ${target}: too small, and so is everything to its left.`,
      {
        pointers: 'range+mid',
        marks: [{ index: mid, role: 'compare' }],
        annotations: [{ target: `cell:${mid}`, text: `${value} ${big ? '≥' : '<'} ${target}` }],
        predict: boundaryPredict(value, target, mid),
      },
    )
    if (rec.capped) break

    if (big) {
      hi = mid
      emit('keep', `Keep mid: it could be the first big-enough one, so hi = mid = ${hi}. The right side can't beat it.`)
    } else {
      const oldLo = lo
      lo = mid + 1
      emit('skip', `Skip mid: ${value} is too small, so lo = mid + 1 = ${lo}. ${oldLo === mid ? `Index ${mid} is` : `Indexes ${oldLo} to ${mid} are`} out.`)
    }
  }

  const answer = lo
  const found = answer < n
  emit(
    'done',
    found
      ? `lo meets hi at ${answer}: nums[${answer}] = ${nums[answer]} is the first number that is ${target} or more. Return ${answer}.`
      : `lo reached ${n}: all ${n} numbers are below ${target}, so the answer is ${n}, one past the end. Return ${n}.`,
    { done: true, marks: found ? [{ index: answer, role: 'found' }] : [] },
  )

  return rec.done(answer)
}

/** Independent linear scan: the first index whose number is big enough. */
function reference({ nums, target }: FirstTrueInput): number {
  for (let i = 0; i < nums.length; i++) if (nums[i] >= target) return i
  return nums.length
}

const tracer: Tracer<FirstTrueInput, number> = {
  id: 'binary-search/first-true',
  title: 'First position ≥ target',
  anchors: {
    init: 'Search [lo, hi) with hi = n, one past the end',
    mid: 'Look at the middle: mid = lo + (hi − lo) / 2',
    check: 'Is nums[mid] at least the target?',
    keep: 'Yes: mid might be the answer, so hi = mid',
    skip: 'No: mid is too small, so lo = mid + 1',
    done: 'lo == hi is the first position that works',
  },
  vars: [
    { name: 'lo', role: 'ptrA' },
    { name: 'hi', role: 'ptrB' },
    { name: 'mid', role: 'focus' },
    { name: 'target', role: 'value' },
  ],
  input: {
    fields: SORTED_FIELDS,
    parse: parseInput,
    format: ({ nums, target }) => ({ nums: nums.join(', '), target: String(target) }),
    presets: [
      { label: 'First 5, with repeats', value: { nums: [1, 3, 5, 5, 5, 8, 12, 15, 20], target: 5 } },
      { label: 'Insert position for 10', value: { nums: [2, 5, 8, 12, 16, 23, 38, 56, 72], target: 10 } },
      { label: 'Nothing big enough', value: { nums: [2, 5, 8, 12], target: 50 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const nums = randomSorted(rand, randInt(rand, 1, 12), true)
      // From just below the smallest to just above the largest, so "none big enough" shows up too.
      const target = randInt(rand, Math.max(LIMITS.min, nums[0] - 5), Math.min(LIMITS.max, nums[nums.length - 1] + 5))
      return { nums, target }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
