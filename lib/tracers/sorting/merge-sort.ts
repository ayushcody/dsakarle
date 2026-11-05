/**
 * Merge sort — split in half, sort each half, then merge the two sorted halves
 * (LeetCode 912, Sort an Array).
 *
 * Same layout as the other golden tracers: input (shared.ts), frame helpers,
 * `run`, `reference`.
 *
 * Scene: a column composite. On top is `nums` with the current range bracketed
 * (`window`). Underneath is the `merged` buffer, the same length, so a merge of
 * indexes lo..hi fills exactly the cells under lo..hi. The buffer is shared by
 * every merge, which is why `k` is an absolute index like `i` and `j`.
 *
 * Frame budget: a split is ONE frame per range (the recursion down to single
 * numbers is not replayed call by call), but every comparison in every merge
 * gets its own `take` frame. The first single-number range shows the `base`
 * rule once; later ones are silent. Code lives in
 * content/code/sorting/merge-sort.{py,java,cpp}.
 */
import { createRecorder } from '@/lib/engine/recorder'
import { LIMITS, SORT_FIELDS, formatSortInput, parseSortInput, randomSortInput, sortedCopy } from './shared'
import type { SortInput } from './shared'
import { mulberry32 } from '../rng'
import type {
  ArrayScene,
  CompositeScene,
  Frame,
  MarkRole,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

const LEFT = 'Left'
const RIGHT = 'Right'

/** Asked while both halves still have numbers: which front number goes into the buffer next? */
function whichGoesFirstPredict(a: number, b: number): PredictCandidate {
  const left = a <= b
  return {
    tag: 'which-goes-first',
    kind: 'choice',
    prompt: `Left has ${a}, right has ${b}. Which goes into the buffer next?`,
    options: [LEFT, RIGHT],
    answer: left ? LEFT : RIGHT,
    why:
      a === b
        ? `They tie, and the left one wins. Taking left first keeps equal numbers in their original order, which is what makes merge sort stable.`
        : left
          ? `${a} is smaller than ${b}. Both halves are sorted, so the smaller front number is the smallest one left.`
          : `${b} is smaller than ${a}. Both halves are sorted, so the smaller front number is the smallest one left.`,
    hint: 'Each half is sorted, so only the front numbers can be next. Which front is smaller?',
  }
}

function run({ nums: input }: SortInput) {
  const rec = createRecorder<number[]>()
  const nums = input.slice()
  const n = nums.length
  const merged: number[] = new Array(n).fill(0)

  /** Ranges that have already been merged (and are sorted). */
  const finished: Array<[number, number]> = []
  let baseShown = false

  // Working state shown in the vars panel.
  const v: { lo: number | null; hi: number | null; mid: number | null; i: number | null; j: number | null; k: number | null } = {
    lo: null,
    hi: null,
    mid: null,
    i: null,
    j: null,
    k: null,
  }

  const emit = (
    at: string,
    say: string,
    extra: {
      window?: { start: number; end: number } | null
      pointers?: ArrayScene['pointers']
      marks?: Array<{ index: number; role: MarkRole }>
      annotations?: ArrayScene['annotations']
      /** The buffer slots in use: indexes lo..filledTo-1 hold merged numbers. */
      buffer?: { lo: number; filledTo: number; pointer?: boolean; changed?: number[]; window?: { start: number; end: number } }
      allFound?: boolean
      predict?: PredictCandidate
    } = {},
  ): void => {
    const win = extra.window ?? null
    const marks: Array<{ index: number; role: MarkRole }> = []
    if (extra.allFound) {
      for (let x = 0; x < n; x++) marks.push({ index: x, role: 'found' })
    } else {
      // Finished runs outside the current range are done for now.
      for (const [a, b] of finished) {
        for (let x = a; x <= b; x++) {
          if (!win || x < win.start || x > win.end) marks.push({ index: x, role: 'visited' })
        }
      }
      for (const m of extra.marks ?? []) {
        const at2 = marks.findIndex((e) => e.index === m.index)
        if (at2 >= 0) marks.splice(at2, 1)
        marks.push(m)
      }
    }

    const top: ArrayScene = { kind: 'array', label: 'nums', cells: nums.slice(), window: win }
    if (extra.pointers?.length) top.pointers = extra.pointers
    if (marks.length) top.marks = marks
    if (extra.annotations?.length) top.annotations = extra.annotations

    const cells: Array<number | null> = new Array(n).fill(null)
    const bottom: ArrayScene = { kind: 'array', label: 'merged', cells }
    if (extra.buffer) {
      for (let x = extra.buffer.lo; x < extra.buffer.filledTo; x++) cells[x] = merged[x]
      if (extra.buffer.window) bottom.window = extra.buffer.window
      if (extra.buffer.pointer) bottom.pointers = [{ name: 'k', index: extra.buffer.filledTo, role: 'focus' }]
      if (extra.buffer.changed?.length) bottom.marks = extra.buffer.changed.map((index) => ({ index, role: 'changed' as const }))
    }

    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { title: 'nums', scene: top },
        { title: 'merged buffer', scene: bottom },
      ],
    }
    const vars: Record<string, Val> = { lo: v.lo, hi: v.hi, mid: v.mid, i: v.i, j: v.j, k: v.k }
    const frame: Frame = { scene, vars, say, at }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  const sortRange = (lo: number, hi: number): void => {
    if (rec.capped) return
    v.lo = lo
    v.hi = hi
    v.mid = v.i = v.j = v.k = null

    if (lo >= hi) {
      if (!baseShown) {
        baseShown = true
        emit('base', `Index ${lo} is a range of one number, ${nums[lo]}. One number is already sorted, so this stops here. So does every one-number range.`, {
          window: { start: lo, end: lo },
        })
      }
      return
    }

    const mid = Math.floor((lo + hi) / 2)
    v.mid = mid
    const both = hi - lo === 1
    emit(
      'split',
      `Split indexes ${lo} to ${hi} at mid = ${mid}: left half ${lo} to ${mid}, right half ${mid + 1} to ${hi}.${both ? ' Each half is one number.' : ''}`,
      {
        window: { start: lo, end: hi },
        pointers: [
          { name: 'lo', index: lo, role: 'ptrA' },
          { name: 'mid', index: mid, role: 'focus' },
          { name: 'hi', index: hi, role: 'ptrB' },
        ],
        annotations: [{ target: 'ptr:mid', text: 'left ends here' }],
      },
    )

    sortRange(lo, mid)
    sortRange(mid + 1, hi)
    if (rec.capped) return

    // Both halves are sorted now. Merge them into the buffer.
    v.lo = lo
    v.hi = hi
    v.mid = mid
    let i = lo
    let j = mid + 1
    let k = lo
    v.i = i
    v.j = j
    v.k = k

    /** Cells already taken from either half (drawn faded). */
    const consumed = (): Array<{ index: number; role: MarkRole }> => {
      const out: Array<{ index: number; role: MarkRole }> = []
      for (let x = lo; x < i; x++) out.push({ index: x, role: 'visited' })
      for (let x = mid + 1; x < j; x++) out.push({ index: x, role: 'visited' })
      return out
    }
    const pointers = (): NonNullable<ArrayScene['pointers']> => {
      const out: NonNullable<ArrayScene['pointers']> = []
      if (i <= mid) out.push({ name: 'i', index: i, role: 'ptrA' })
      if (j <= hi) out.push({ name: 'j', index: j, role: 'ptrB' })
      return out
    }
    const fronts = (): Array<{ index: number; role: MarkRole }> => {
      const out: Array<{ index: number; role: MarkRole }> = []
      if (i <= mid) out.push({ index: i, role: 'compare' })
      if (j <= hi) out.push({ index: j, role: 'compare' })
      return out
    }
    const range = { start: lo, end: hi }

    emit(
      'merge',
      `Both halves are sorted. Merge them: i leads the left half, j the right, k is the next free slot in the buffer.`,
      {
        window: range,
        pointers: pointers(),
        marks: fronts(),
        annotations: [
          { target: `cell:${lo}`, text: 'left half' },
          { target: `cell:${mid + 1}`, text: 'right half' },
        ],
        buffer: { lo, filledTo: k, pointer: true, window: range },
        predict: whichGoesFirstPredict(nums[i], nums[j]),
      },
    )

    while (i <= mid && j <= hi && !rec.capped) {
      const a = nums[i]
      const b = nums[j]
      const takeLeft = a <= b
      const taken = takeLeft ? a : b
      merged[k] = taken
      const slot = k
      if (takeLeft) i++
      else j++
      k++
      v.i = i
      v.j = j
      v.k = k

      const why =
        a === b
          ? `Left ${a} and right ${b} tie, so the left one goes first. That keeps equal numbers in order.`
          : `Left ${a} vs right ${b}: ${taken} is smaller, so ${taken} goes into buffer slot ${slot}.`
      const bothLeft = i <= mid && j <= hi
      emit('take', why, {
        window: range,
        pointers: pointers(),
        marks: [...consumed(), ...fronts()],
        buffer: { lo, filledTo: k, pointer: k <= hi, changed: [slot], window: range },
        predict: bothLeft ? whichGoesFirstPredict(nums[i], nums[j]) : undefined,
      })
    }
    if (rec.capped) return

    if (i <= mid || j <= hi) {
      const side = i <= mid ? 'Left' : 'Right'
      const start = i <= mid ? i : j
      const end = i <= mid ? mid : hi
      const rest = nums.slice(start, end + 1)
      for (let x = start; x <= end; x++) merged[k++] = nums[x]
      if (i <= mid) i = mid + 1
      else j = hi + 1
      v.i = i
      v.j = j
      v.k = k
      emit(
        'drain',
        `${side} still has ${rest.join(', ')}. The other half is used up and these are already in order, so copy them straight in.`,
        {
          window: range,
          pointers: pointers(),
          marks: consumed(),
          buffer: {
            lo,
            filledTo: k,
            pointer: false,
            changed: rest.map((_, d) => k - rest.length + d),
            window: range,
          },
        },
      )
      if (rec.capped) return
    }

    for (let x = lo; x <= hi; x++) nums[x] = merged[x]
    finished.push([lo, hi])
    v.i = v.j = null
    emit('copy', `Copy the buffer back into nums. Indexes ${lo} to ${hi} are now sorted: [${nums.slice(lo, hi + 1).join(', ')}].`, {
      window: range,
      marks: Array.from({ length: hi - lo + 1 }, (_, d) => ({ index: lo + d, role: 'changed' as const })),
      buffer: { lo, filledTo: hi + 1, pointer: false, window: range },
    })
  }

  emit('init', `Sort all ${n} numbers (indexes 0 to ${n - 1}). The merged buffer starts empty and is as long as nums.`)
  sortRange(0, n - 1)

  v.lo = v.hi = v.mid = v.i = v.j = v.k = null
  emit('done', `Every merge is finished. The whole row is sorted: [${nums.join(', ')}].`, { allFound: true })

  return rec.done(nums)
}

const tracer: Tracer<SortInput, number[]> = {
  id: 'sorting/merge-sort',
  title: 'Merge sort',
  anchors: {
    init: 'Make an empty buffer, then sort the whole row',
    base: 'One number is already sorted: stop',
    split: 'Split the range in half and sort each half',
    merge: 'Start merging: i, j on the fronts, k on the buffer',
    take: 'Take the smaller front number (ties go left)',
    drain: 'One half is used up: copy the rest of the other',
    copy: 'Copy the merged run back into nums',
    done: 'Return the sorted numbers',
  },
  vars: [
    { name: 'lo', role: 'ptrA' },
    { name: 'mid', role: 'focus' },
    { name: 'hi', role: 'ptrB' },
    { name: 'i', role: 'ptrA' },
    { name: 'j', role: 'ptrB' },
    { name: 'k', role: 'focus' },
  ],
  input: {
    fields: SORT_FIELDS,
    parse: parseSortInput,
    format: formatSortInput,
    presets: [
      { label: 'Eight numbers', value: { nums: [5, 2, 4, 7, 1, 3, 2, 6] } },
      { label: 'Already sorted', value: { nums: [1, 2, 3, 4, 5, 6] } },
      { label: 'Reversed', value: { nums: [6, 5, 4, 3, 2, 1] } },
    ],
    random: (seed) => randomSortInput(mulberry32(seed)),
    limits: LIMITS,
  },
  run,
  reference: ({ nums }) => sortedCopy(nums),
}

export default tracer
