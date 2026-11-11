/**
 * Find the minimum in a rotated sorted array (LeetCode 153, distinct values).
 *
 * The minimum is the spot where the list drops. Comparing nums[mid] with the LAST
 * cell of the range (nums[hi]) tells you which side of mid the drop is on:
 *   nums[mid] > nums[hi]  ->  the drop is right of mid, so the minimum is too.
 *   nums[mid] < nums[hi]  ->  mid..hi is in order, so the minimum is mid or left of it.
 *
 * Layout follows searching/rotated-search, whose input parsing it shares.
 * Code lives in content/code/searching/rotated-min.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { LIMITS, NUMS_FIELD, parseRotatedNums, randomRotated } from './rotated-search'
import { createRecorder } from '@/lib/engine/recorder'
import type { ArrayScene, Frame, ParseResult, PredictCandidate, Tracer, Val } from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface RotatedMinInput {
  /** A rotation of a strictly increasing sequence (so all values differ). */
  nums: number[]
}

function parseInput(raw: Record<string, string>): ParseResult<RotatedMinInput> {
  const nums = parseRotatedNums(raw.nums ?? '')
  return nums.ok ? { ok: true, value: { nums: nums.value } } : nums
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const RIGHT_OF_MID = 'Right of mid'
const MID_OR_LEFT = 'At mid or to its left'

/** Asked on the mid frame, before the comparison is shown. */
function minSidePredict(mid: number, midValue: number, hiValue: number): PredictCandidate {
  const bigger = midValue > hiValue
  return {
    tag: 'min-side',
    kind: 'choice',
    prompt: `nums[mid] = ${midValue} and nums[hi] = ${hiValue}. Where is the minimum?`,
    options: [RIGHT_OF_MID, MID_OR_LEFT],
    answer: bigger ? RIGHT_OF_MID : MID_OR_LEFT,
    why: bigger
      ? `${midValue} is bigger than the last cell ${hiValue}, so the list must drop somewhere after index ${mid}. The minimum is there.`
      : `${midValue} is below ${hiValue}, so mid..hi climbs with no drop. The minimum is mid itself or something to its left.`,
    hint: 'The last cell is the yardstick: a number bigger than it must come before the drop.',
  }
}

function outOfPlay(from: number, to: number): string {
  return from === to ? `Index ${from} is` : `Indexes ${from} to ${to} are`
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums }: RotatedMinInput) {
  const rec = createRecorder<number>()
  const n = nums.length

  // Working state — mirrors the variables in the code files. [lo, hi] is inclusive and hi can only equal lo at the end.
  let lo = 0
  let hi = n - 1
  let mid: number | null = null
  let rounds = 0

  const emit = (
    at: string,
    say: string,
    extra: {
      pointers?: 'range' | 'range+mid' | 'none'
      marks?: ArrayScene['marks']
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
      window: lo < hi ? { start: lo, end: hi } : null,
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

    const vars: Record<string, Val> = { lo, hi, mid }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: hi - lo + 1, max: n, label: 'Candidates left' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit('init', `Find the smallest number in a rotated sorted list of ${n}. Search lo = 0 to hi = ${hi}; nothing is ruled out yet.`)

  while (lo < hi && !rec.capped) {
    mid = lo + Math.floor((hi - lo) / 2)
    const midValue = nums[mid]
    const hiValue = nums[hi]
    const bigger = midValue > hiValue
    rounds++

    emit(
      'mid',
      rounds === 1
        ? `Middle of ${lo}..${hi}: mid = lo + (hi − lo) / 2 = ${mid}, which holds ${midValue}. The last cell holds ${hiValue}.`
        : `Middle of indexes ${lo} to ${hi}: mid = ${mid}, which holds ${midValue}. The last cell holds ${hiValue}.`,
      { pointers: 'range+mid', predict: minSidePredict(mid, midValue, hiValue) },
    )
    if (rec.capped) break

    // The half that has no drop is the sorted one: lo..mid when mid is bigger than the end, else mid..hi.
    const annotations: NonNullable<ArrayScene['annotations']> = [{ target: `cell:${mid}`, text: `${midValue} ${bigger ? '>' : '<'} ${hiValue}` }]
    if (bigger && lo !== mid) annotations.push({ target: `cell:${lo}`, text: 'left half sorted' })
    if (!bigger) annotations.push({ target: `cell:${hi}`, text: 'right half sorted' })
    emit(
      'compare',
      bigger
        ? `nums[mid] = ${midValue} is bigger than nums[hi] = ${hiValue}: the drop is right of mid, and the minimum sits at the drop.`
        : `nums[mid] = ${midValue} is smaller than nums[hi] = ${hiValue}: mid..hi climbs, so the minimum is mid or to its left.`,
      {
        pointers: 'range+mid',
        marks: [
          { index: mid, role: 'compare' },
          { index: hi, role: 'compare' },
        ],
        annotations,
      },
    )
    if (rec.capped) break

    if (bigger) {
      const oldLo = lo
      lo = mid + 1
      emit('go-right', `Mid can't be the minimum, since ${hiValue} is smaller: lo = mid + 1 = ${lo}. ${outOfPlay(oldLo, mid)} out.`)
    } else {
      const oldHi = hi
      hi = mid
      emit('go-left', `Mid might be the minimum, so keep it: hi = mid = ${hi}. ${outOfPlay(mid + 1, oldHi)} out.`)
    }
  }

  const result = nums[lo]
  const marks: NonNullable<ArrayScene['marks']> = []
  for (let i = 0; i < n; i++) marks.push({ index: i, role: i === lo ? 'found' : 'discarded' })
  emit('done', `lo meets hi at index ${lo}: ${result} is the minimum. Return ${result}.`, {
    pointers: 'none',
    discard: false,
    marks,
  })

  return rec.done(result)
}

/** Independent scan: the smallest value, found by looking at every cell. */
function reference({ nums }: RotatedMinInput): number {
  let smallest = nums[0]
  for (const value of nums) if (value < smallest) smallest = value
  return smallest
}

const tracer: Tracer<RotatedMinInput, number> = {
  id: 'searching/rotated-min',
  title: 'Find the minimum',
  anchors: {
    init: 'Start with the whole array: lo = 0, hi = n − 1',
    mid: 'Look at the middle: mid = lo + (hi − lo) / 2',
    compare: 'Compare nums[mid] with the last cell, nums[hi]',
    'go-right': 'Bigger than the end: the drop is right, so lo = mid + 1',
    'go-left': 'Smaller than the end: mid may be the minimum, so hi = mid',
    done: 'lo == hi is the minimum: return nums[lo]',
  },
  vars: [
    { name: 'lo', role: 'ptrA' },
    { name: 'hi', role: 'ptrB' },
    { name: 'mid', role: 'focus' },
  ],
  input: {
    fields: [NUMS_FIELD],
    parse: parseInput,
    format: ({ nums }) => ({ nums: nums.join(', ') }),
    presets: [
      { label: 'Classic rotation', value: { nums: [4, 5, 6, 7, 0, 1, 2] } },
      { label: 'Minimum near the front', value: { nums: [8, 9, 1, 2, 3, 4, 5, 6, 7] } },
      { label: 'Not rotated at all', value: { nums: [11, 13, 15, 17, 19] } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      return { nums: randomRotated(rand, randInt(rand, 1, 12)) }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
