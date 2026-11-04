/**
 * Quick sort — Lomuto partition with the last number as the pivot.
 *
 * Same layout as the other golden tracers: input (shared.ts), frame helpers,
 * `run`, `reference`.
 *
 * Scene: one array. The bracket (`window`) is the range being partitioned and
 * the pivot is the focus-marked cell at its right end. `i` is the boundary
 * (everything left of it, inside the range, is smaller than the pivot) and `j`
 * is the scanner. Swaps flash as `changed`; a pivot that has been placed, and a
 * lone number, are `found` (in their final slot). While a smaller range is
 * being sorted, cells outside it that are not final are `discarded`.
 *
 * Frame budget: one frame per scanned number (a swap frame when it moves, a
 * scan frame when it stays). The first lone number shows the `base` rule once;
 * later ones are silent. Code lives in content/code/sorting/quick-sort.{py,java,cpp}.
 */
import { createRecorder } from '@/lib/engine/recorder'
import { LIMITS, SORT_FIELDS, formatSortInput, parseSortInput, randomSortInput, sortedCopy } from './shared'
import type { SortInput } from './shared'
import { mulberry32 } from '../rng'
import type { ArrayScene, Frame, MarkRole, PredictCandidate, Tracer, Val } from '@/lib/engine/types'

const SWAP = 'Swap it left'
const LEAVE = 'Leave it'

/** Asked on the frame before j lands on `value`: does it go to the small side? */
function swapOrNotPredict(value: number, pivot: number): PredictCandidate {
  const swap = value < pivot
  return {
    tag: 'swap-or-not',
    kind: 'choice',
    prompt: `The pivot is ${pivot}. Next j lands on ${value}. Does it get swapped to the small side?`,
    options: [SWAP, LEAVE],
    answer: swap ? SWAP : LEAVE,
    why: swap
      ? `${value} is less than ${pivot}, so it belongs with the small numbers. Swap it into slot i and the small side grows by one.`
      : `${value} is not less than ${pivot}, so it stays where it is. It is already on the big side of i.`,
    hint: 'Compare the number with the pivot. Is it smaller?',
  }
}

function run({ nums: input }: SortInput) {
  const rec = createRecorder<number[]>()
  const nums = input.slice()
  const n = nums.length

  /** Indexes that hold their final number: placed pivots and lone numbers. */
  const final = new Set<number>()
  let baseShown = false

  const v: { lo: number | null; hi: number | null; i: number | null; j: number | null; pivot: number | null } = {
    lo: null,
    hi: null,
    i: null,
    j: null,
    pivot: null,
  }

  const emit = (
    at: string,
    say: string,
    extra: {
      window?: { start: number; end: number } | null
      pointers?: ArrayScene['pointers']
      marks?: Array<{ index: number; role: MarkRole }>
      annotations?: ArrayScene['annotations']
      allFound?: boolean
      predict?: PredictCandidate
    } = {},
  ): void => {
    const win = extra.window ?? null
    const roles = new Map<number, MarkRole>()
    if (extra.allFound) {
      for (let x = 0; x < n; x++) roles.set(x, 'found')
    } else {
      for (let x = 0; x < n; x++) {
        if (final.has(x)) roles.set(x, 'found')
        else if (win && (x < win.start || x > win.end)) roles.set(x, 'discarded')
      }
      for (const m of extra.marks ?? []) roles.set(m.index, m.role)
    }
    const marks = Array.from(roles, ([index, role]) => ({ index, role })).sort((a, b) => a.index - b.index)

    const scene: ArrayScene = { kind: 'array', label: 'nums', cells: nums.slice(), window: win }
    if (extra.pointers?.length) scene.pointers = extra.pointers
    if (marks.length) scene.marks = marks
    if (extra.annotations?.length) scene.annotations = extra.annotations

    const vars: Record<string, Val> = { lo: v.lo, hi: v.hi, i: v.i, j: v.j, pivot: v.pivot }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: extra.allFound ? n : final.size, max: n, label: 'Numbers in their final place' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  const sortRange = (lo: number, hi: number): void => {
    if (rec.capped) return
    if (lo >= hi) {
      if (lo === hi) final.add(lo)
      if (lo === hi && !baseShown) {
        baseShown = true
        v.lo = lo
        v.hi = hi
        v.i = v.j = v.pivot = null
        emit('base', `Index ${lo} is alone, so ${nums[lo]} is already in its final place. Empty and one-number ranges stop here.`, {
          window: { start: lo, end: lo },
        })
      }
      return
    }

    // pivot: the last number of the range, with i and j both at the start.
    const pivot = nums[hi]
    let i = lo
    v.lo = lo
    v.hi = hi
    v.pivot = pivot
    v.i = i
    v.j = lo
    const range = { start: lo, end: hi }
    const pointers = (j: number | null): NonNullable<ArrayScene['pointers']> => {
      const out: NonNullable<ArrayScene['pointers']> = [{ name: 'i', index: i, role: 'ptrA' }]
      if (j !== null) out.push({ name: 'j', index: j, role: 'ptrB' })
      return out
    }
    const smallZone = (): Array<{ index: number; role: MarkRole }> => {
      const out: Array<{ index: number; role: MarkRole }> = []
      for (let x = lo; x < i; x++) out.push({ index: x, role: 'visited' })
      return out
    }

    emit(
      'pivot',
      `Take the last number, ${pivot}, as the pivot. i is where the next small number goes; j scans from index ${lo}.`,
      {
        window: range,
        pointers: pointers(lo),
        marks: [{ index: hi, role: 'focus' }],
        annotations: [{ target: `cell:${hi}`, text: `pivot ${pivot}` }],
        predict: swapOrNotPredict(nums[lo], pivot),
      },
    )

    for (let j = lo; j < hi && !rec.capped; j++) {
      const x = nums[j]
      v.j = j
      const next = j + 1 < hi ? swapOrNotPredict(nums[j + 1], pivot) : undefined
      if (x < pivot) {
        const slot = i
        const temp = nums[i]
        nums[i] = nums[j]
        nums[j] = temp
        i++
        v.i = i
        const changed: Array<{ index: number; role: MarkRole }> = [{ index: slot, role: 'changed' }]
        if (slot !== j) changed.push({ index: j, role: 'changed' })
        emit(
          'swap',
          slot === j
            ? `${x} is less than ${pivot} and already sits at slot ${slot}, so the swap changes nothing. i moves on to ${i}.`
            : `${x} is less than ${pivot}: swap it with the number at slot ${slot} (${temp}). i moves on to ${i}.`,
          {
            window: range,
            pointers: pointers(j),
            marks: [...smallZone(), { index: hi, role: 'focus' }, ...changed],
            predict: next,
          },
        )
      } else {
        emit('scan', `${x} is not less than ${pivot}, so it stays put on the big side. j moves on.`, {
          window: range,
          pointers: pointers(j),
          marks: [...smallZone(), { index: hi, role: 'focus' }, { index: j, role: 'compare' }],
          predict: next,
        })
      }
    }
    if (rec.capped) return

    // place: swap the pivot into the boundary slot. It is now in its final place.
    const swapped = nums[i]
    nums[hi] = swapped
    nums[i] = pivot
    final.add(i)
    v.j = null
    v.i = i
    const placeMarks: Array<{ index: number; role: MarkRole }> = [{ index: i, role: 'found' }]
    if (i !== hi) placeMarks.push({ index: hi, role: 'changed' })
    emit(
      'place',
      i === hi
        ? `Every number was smaller, so the pivot ${pivot} already sits at slot ${i}. It is in its final place.`
        : `Swap the pivot with the number at slot ${i} (${swapped}). ${pivot} is in its final place: smaller on its left, the rest on its right.`,
      {
        window: range,
        pointers: [{ name: 'i', index: i, role: 'ptrA' }],
        marks: placeMarks,
      },
    )

    // recurse: each side is the same problem, smaller.
    const sides: Array<[string, number, number]> = [
      ['left', lo, i - 1],
      ['right', i + 1, hi],
    ]
    for (const [name, a, b] of sides) {
      if (rec.capped) return
      if (b - a >= 1) {
        v.lo = a
        v.hi = b
        v.i = v.j = v.pivot = null
        emit('recurse', `Now sort the ${name} side, indexes ${a} to ${b}. The cells outside it are out of play for now.`, {
          window: { start: a, end: b },
        })
      }
      sortRange(a, b)
    }
  }

  emit('init', `Sort all ${n} numbers. Each round picks a pivot, puts it in its final place, then sorts the two sides.`)
  sortRange(0, n - 1)

  v.lo = v.hi = v.i = v.j = v.pivot = null
  emit('done', `Every number is in its final place: [${nums.join(', ')}].`, { allFound: true })

  return rec.done(nums)
}

const tracer: Tracer<SortInput, number[]> = {
  id: 'sorting/quick-sort',
  title: 'Quick sort',
  anchors: {
    init: 'Sort the whole range',
    base: 'One number (or none) is already sorted: stop',
    pivot: 'Take the last number as the pivot; i and j start at lo',
    scan: 'j looks at a number: is it less than the pivot?',
    swap: 'Yes: swap it to the small side, i moves on',
    place: 'Swap the pivot into slot i: its final place',
    recurse: 'Sort the left side, then the right side',
    done: 'Return the sorted numbers',
  },
  vars: [
    { name: 'lo', role: 'value' },
    { name: 'hi', role: 'value' },
    { name: 'pivot', role: 'focus' },
    { name: 'i', role: 'ptrA' },
    { name: 'j', role: 'ptrB' },
  ],
  input: {
    fields: SORT_FIELDS,
    parse: parseSortInput,
    format: formatSortInput,
    presets: [
      { label: 'Eight numbers', value: { nums: [4, 7, 1, 6, 2, 8, 3, 5] } },
      { label: 'Already sorted (worst case)', value: { nums: [1, 2, 3, 4, 5, 6] } },
      { label: 'Pivot lands in the middle', value: { nums: [3, 1, 2, 6, 5, 7, 4] } },
    ],
    random: (seed) => randomSortInput(mulberry32(seed)),
    limits: LIMITS,
  },
  run,
  reference: ({ nums }) => sortedCopy(nums),
}

export default tracer
