/**
 * Search in a rotated sorted array (LeetCode 33, distinct values).
 *
 * A sorted list was rotated, so it climbs, drops once, and climbs again:
 * [4, 5, 6, 7, 0, 1, 2]. Plain binary search breaks, but one half around mid is
 * always still in order. The loop asks three questions per round:
 *   1. is mid the target?
 *   2. which half is sorted?  (nums[lo] <= nums[mid] means the left one)
 *   3. does the target sit inside that sorted half?  If so keep it, else keep the other.
 *
 * Layout follows binary-search/classic: input and parsing, frame helpers, `run`
 * (the real algorithm, one frame per idea), then a boring `reference`.
 * Code lives in content/code/searching/rotated-search.{py,java,cpp}.
 * The helpers exported here are shared with searching/rotated-min.
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
// Input (shared with rotated-min)
// ---------------------------------------------------------------------------

export interface RotatedSearchInput {
  /** A rotation of a strictly increasing sequence (so all values differ). */
  nums: number[]
  target: number
}

export const LIMITS: InputLimits = { maxN: 12, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/

export const NUMS_FIELD: InputField = {
  name: 'nums',
  label: 'Rotated sorted numbers',
  kind: 'int-array',
  placeholder: 'e.g. 4, 5, 6, 7, 0, 1, 2',
  help: `Up to ${LIMITS.maxN} different whole numbers from ${LIMITS.min} to ${LIMITS.max}: a sorted list with some numbers moved from the front to the back.`,
}

export const SEARCH_FIELDS: InputField[] = [
  NUMS_FIELD,
  { name: 'target', label: 'Target', kind: 'int', placeholder: 'e.g. 0', help: `The number to look for. Between ${LIMITS.min} and ${LIMITS.max}.` },
]

/** Friendly parse of the `nums` text: whole numbers, all different, one rotation of a sorted list. */
export function parseRotatedNums(text: string): ParseResult<number[]> {
  const cleaned = text
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = cleaned.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'nums', error: 'Type at least one number, like 4, 5, 6, 7, 0, 1, 2.' }
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

  const seen = new Set<number>()
  for (const value of nums) {
    if (seen.has(value)) {
      return { ok: false, field: 'nums', error: `Use each number once (${value} appears twice). Rotated search needs different values.` }
    }
    seen.add(value)
  }

  // A rotation of a strictly increasing list drops at most once, and if it drops,
  // the last number is still below the first.
  const drops: number[] = []
  for (let i = 0; i + 1 < nums.length; i++) if (nums[i] > nums[i + 1]) drops.push(i)
  if (drops.length > 1) {
    const [a, b] = drops
    return {
      ok: false,
      field: 'nums',
      error: `Not a rotated sorted list: it drops at ${nums[a]} → ${nums[a + 1]} and again at ${nums[b]} → ${nums[b + 1]}. A rotation drops only once.`,
    }
  }
  if (drops.length === 1 && nums[nums.length - 1] > nums[0]) {
    return {
      ok: false,
      field: 'nums',
      error: `A rotated list wraps around: the last number (${nums[nums.length - 1]}) must be below the first (${nums[0]}).`,
    }
  }
  return { ok: true, value: nums }
}

/** A rotation of a strictly increasing list of `len` numbers. Deterministic in `rand`. */
export function randomRotated(rand: () => number, len: number): number[] {
  const sorted: number[] = []
  let value = randInt(rand, -60, 10)
  for (let i = 0; i < len; i++) {
    sorted.push(value)
    value += randInt(rand, 1, 8)
  }
  const turn = randInt(rand, 0, len - 1)
  return [...sorted.slice(turn), ...sorted.slice(0, turn)]
}

export function parseSearchInput(raw: Record<string, string>): ParseResult<RotatedSearchInput> {
  const nums = parseRotatedNums(raw.nums ?? '')
  if (!nums.ok) return nums

  const targetText = (raw.target ?? '').replace(/[−–]/g, '-').trim()
  if (targetText === '') return { ok: false, field: 'target', error: 'Type a target to look for, like 0.' }
  if (!INTEGER.test(targetText)) {
    return { ok: false, field: 'target', error: `The target must be a whole number, not "${targetText}".` }
  }
  const target = Number(targetText)
  if (target < LIMITS.min || target > LIMITS.max) {
    return { ok: false, field: 'target', error: `Keep the target between ${LIMITS.min} and ${LIMITS.max}.` }
  }
  return { ok: true, value: { nums: nums.value, target } }
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

/** Asked on the check frame: which half around mid is in order? */
function whichHalfPredict(a: number, b: number): PredictCandidate {
  const left = a <= b
  return {
    tag: 'which-half-sorted',
    kind: 'choice',
    prompt: `nums[lo] = ${a} ${left ? '≤' : '>'} nums[mid] = ${b}. Which half is sorted?`,
    options: [LEFT_HALF, RIGHT_HALF],
    answer: left ? LEFT_HALF : RIGHT_HALF,
    why: left
      ? `The drop can't be between lo and mid, because ${a} doesn't fall to ${b}. So the left half climbs all the way.`
      : `${a} is bigger than ${b}, so the drop is somewhere between lo and mid. That makes the right half the sorted one.`,
    hint: 'A rotated list falls only once. Which side of mid does that fall hide on?',
  }
}

/** Asked on the which frame: after knowing the sorted half, where do we keep searching? */
function goWherePredict(target: number, sortedLeft: boolean, lowEnd: number, highEnd: number, inside: boolean): PredictCandidate {
  const keep = sortedLeft === inside ? LEFT_HALF : RIGHT_HALF
  const side = sortedLeft ? 'left' : 'right'
  return {
    tag: 'go-where',
    kind: 'choice',
    prompt: `The ${side} half runs ${lowEnd} to ${highEnd} in order. The target is ${target}. Which half do we keep?`,
    options: [LEFT_HALF, RIGHT_HALF],
    answer: keep,
    why: inside
      ? `${target} fits between ${lowEnd} and ${highEnd}, and that half is in order, so the target can only be in it.`
      : `${target} doesn't fit between ${lowEnd} and ${highEnd}, so it can't be in the sorted half. Only the other half is left.`,
    hint: `Does ${target} fall between ${lowEnd} and ${highEnd}?`,
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums, target }: RotatedSearchInput) {
  const rec = createRecorder<number>()
  const n = nums.length

  // Working state — mirrors the variables in the code files.
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

  emit('init', `Look for ${target} in a rotated sorted list of ${n}. Nothing is ruled out yet: lo = 0, hi = ${hi}.`)

  let result = -1
  while (lo <= hi && !rec.capped) {
    mid = lo + Math.floor((hi - lo) / 2)
    const value = nums[mid]
    rounds++

    emit(
      'mid',
      rounds === 1
        ? `Middle of ${lo}..${hi}: mid = lo + (hi − lo) / 2 = ${mid}, which holds ${value}.`
        : lo === hi
          ? `Only index ${mid} is left: mid = ${mid}, which holds ${value}.`
          : `Middle of indexes ${lo} to ${hi}: mid = ${mid}, which holds ${value}.`,
      { pointers: 'range+mid' },
    )
    if (rec.capped) break

    if (value === target) {
      emit('check', `nums[${mid}] = ${value} is exactly ${target} — found it!`, {
        pointers: 'range+mid',
        marks: [{ index: mid, role: 'compare' }],
        annotations: [{ target: `cell:${mid}`, text: `${value} = ${target}` }],
      })
      result = mid
      break
    }

    // Both halves are sorted when the whole range has no drop; then "which half" has two right answers, so don't ask.
    const askSorted = lo < hi && nums[lo] > nums[hi]
    emit('check', `nums[${mid}] = ${value} is not ${target}. Before dropping a half, which half around mid is in order?`, {
      pointers: 'range+mid',
      marks: [{ index: mid, role: 'compare' }],
      annotations: [{ target: `cell:${mid}`, text: `${value} ≠ ${target}` }],
      predict: askSorted ? whichHalfPredict(nums[lo], value) : undefined,
    })
    if (rec.capped) break

    const sortedLeft = nums[lo] <= value
    const sortedFrom = sortedLeft ? lo : mid
    const sortedTo = sortedLeft ? mid : hi
    const lowEnd = nums[sortedFrom]
    const highEnd = nums[sortedTo]
    const sortedMarks: NonNullable<ArrayScene['marks']> = []
    for (let i = sortedFrom; i <= sortedTo; i++) sortedMarks.push({ index: i, role: 'compare' })
    const inside = sortedLeft ? lowEnd <= target && target < highEnd : lowEnd < target && target <= highEnd

    emit(
      'which',
      sortedLeft
        ? `nums[lo] = ${nums[lo]} ≤ nums[mid] = ${value}: no drop between them, so the left half ${lowEnd}..${highEnd} is sorted.`
        : `nums[lo] = ${nums[lo]} > nums[mid] = ${value}: the drop is on the left, so the right half ${lowEnd}..${highEnd} is sorted.`,
      {
        pointers: 'range+mid',
        marks: sortedMarks,
        annotations: [{ target: `cell:${sortedLeft ? lo : hi}`, text: `sorted ${lowEnd}..${highEnd}` }],
        predict: lo < hi ? goWherePredict(target, sortedLeft, lowEnd, highEnd, inside) : undefined,
      },
    )
    if (rec.capped) break

    const sideName = sortedLeft ? 'left' : 'right'
    const otherName = sortedLeft ? 'right' : 'left'
    emit(
      'inside',
      inside
        ? `${target} is between ${lowEnd} and ${highEnd}, so it can only be in the sorted ${sideName} half. Keep that half.`
        : `${target} is not between ${lowEnd} and ${highEnd}, so it can't be in the sorted ${sideName} half. Keep the ${otherName} half.`,
      {
        pointers: 'range+mid',
        marks: sortedMarks,
        annotations: [{ target: `cell:${mid}`, text: `${target} ${inside ? 'fits' : 'does not fit'} ${lowEnd}..${highEnd}` }],
      },
    )
    if (rec.capped) break

    // Keep the left half exactly when (left is sorted) matches (target is inside it).
    if (sortedLeft === inside) {
      const oldHi = hi
      hi = mid - 1
      emit('go-left', `Keep the left half: hi = mid − 1 = ${hi}. ${outOfPlay(mid, oldHi)} out of play.`)
    } else {
      const oldLo = lo
      lo = mid + 1
      emit('go-right', `Keep the right half: lo = mid + 1 = ${lo}. ${outOfPlay(oldLo, mid)} out of play.`)
    }
  }

  if (result >= 0) {
    const marks: NonNullable<ArrayScene['marks']> = []
    for (let i = 0; i < n; i++) marks.push({ index: i, role: i === result ? 'found' : 'discarded' })
    emit('done', `Found ${target} at index ${result} after ${rounds} round${rounds === 1 ? '' : 's'}. Return ${result}.`, {
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
function reference({ nums, target }: RotatedSearchInput): number {
  for (let i = 0; i < nums.length; i++) if (nums[i] === target) return i
  return -1
}

const tracer: Tracer<RotatedSearchInput, number> = {
  id: 'searching/rotated-search',
  title: 'Search a rotated array',
  anchors: {
    init: 'Start with the whole array: lo = 0, hi = n − 1',
    mid: 'Look at the middle: mid = lo + (hi − lo) / 2',
    check: 'Is nums[mid] the target? If so, return mid',
    which: 'Which half is sorted? nums[lo] ≤ nums[mid] means the left',
    inside: 'Does the target fall inside the sorted half?',
    'go-left': 'Keep the left half: hi = mid − 1',
    'go-right': 'Keep the right half: lo = mid + 1',
    done: 'Return mid when found, or −1 once lo passes hi',
  },
  vars: [
    { name: 'lo', role: 'ptrA' },
    { name: 'hi', role: 'ptrB' },
    { name: 'mid', role: 'focus' },
    { name: 'target', role: 'value' },
  ],
  input: {
    fields: SEARCH_FIELDS,
    parse: parseSearchInput,
    format: ({ nums, target }) => ({ nums: nums.join(', '), target: String(target) }),
    presets: [
      { label: 'Find 2, wrapped around', value: { nums: [6, 7, 8, 1, 2, 3, 4, 5], target: 2 } },
      { label: 'Classic: find 0', value: { nums: [4, 5, 6, 7, 0, 1, 2], target: 0 } },
      { label: 'Not found: look for 3', value: { nums: [4, 5, 6, 7, 0, 1, 2], target: 3 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const nums = randomRotated(rand, randInt(rand, 1, 12))
      const lowest = Math.min(...nums)
      const highest = Math.max(...nums)
      // Roughly half the runs search for something that is there, the rest for a miss.
      const target =
        rand() < 0.55 ? nums[randInt(rand, 0, nums.length - 1)] : randInt(rand, Math.max(LIMITS.min, lowest - 10), Math.min(LIMITS.max, highest + 10))
      return { nums, target }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
