/**
 * Heap sort — build a max-heap, then keep sending the biggest value to the back.
 *
 *   build    heapify from the last parent up to the root (sift each one down)
 *   sift     a value looks at its children: the BIGGER child is the one to compare with
 *   swap     the value is smaller than that child, so they trade places and it sinks
 *   extract  swap the root (the biggest) with the last cell of the heap
 *   shrink   the heap gives up that last cell: it is now in its final place
 *   done     the whole row is sorted
 *
 * Scene: a composite (column) of the heap region as a tree (node id `h<i>` =
 * array index i, so ids stay stable) and the whole array. The sorted tail leaves
 * the tree, and is marked `found` in the array. The bracket is the heap region.
 *
 * Predicts: 'bigger-child' (cell) on the frame BEFORE a sift whose node has two
 * children (reveal: the sift frame highlights the winner), and 'swap-or-stop'
 * (choice) on the sift frame. Code lives in content/code/sorting/heap-sort.{py,java,cpp}.
 */
import { createRecorder } from '@/lib/engine/recorder'
import { INTEGER } from '../heaps/common'
import { mulberry32, randInt } from '../rng'
import { sortedCopy } from './shared'
import type { SortInput } from './shared'
import type {
  ArrayScene,
  CompositeScene,
  Frame,
  InputField,
  InputLimits,
  MarkRole,
  ParseResult,
  PredictCandidate,
  Tracer,
  TreeScene,
  Val,
} from '@/lib/engine/types'

const LIMITS: InputLimits = { maxN: 8, min: -99, max: 99 }

const FIELDS: InputField[] = [
  {
    name: 'nums',
    label: 'Numbers to sort',
    kind: 'int-array',
    placeholder: 'e.g. 4, 10, 3, 5, 1, 7',
    help: `2 to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}, in any order. Repeats are fine.`,
  },
]

function parseInput(raw: Record<string, string>): ParseResult<SortInput> {
  const text = (raw.nums ?? '')
    .replace(/[−–]/g, '-')
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = text.split(/[\s,;]+/).filter((t) => t !== '')
  if (tokens.length < 2) return { ok: false, field: 'nums', error: 'Type at least two numbers, like 4, 10, 3, 5, 1, 7.' }
  if (tokens.length > LIMITS.maxN) {
    return { ok: false, field: 'nums', error: `Use at most ${LIMITS.maxN} numbers so the heap tree stays readable.` }
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
  return { ok: true, value: { nums } }
}

const formatInput = ({ nums }: SortInput): Record<string, string> => ({ nums: nums.join(', ') })

const nodeId = (i: number): string => `h${i}`

const SINK = 'Swap and sink'
const STAY = 'Stop: it stays'

function biggerChildPredict(value: number, left: number, right: number, li: number, ri: number): PredictCandidate {
  const rightWins = right > left
  const big = rightWins ? right : left
  return {
    tag: 'bigger-child',
    kind: 'cell',
    prompt: `${value} has two children, ${left} and ${right}. Click the child it should be compared with.`,
    answer: nodeId(rightWins ? ri : li),
    why: `The bigger child, ${big}, is the one to compare with. If ${value} sinks, ${big} moves up, and it is bigger than its sibling so the max-heap rule still holds.`,
    hint: 'Which child could safely become the parent of the other one?',
  }
}

function swapOrStopPredict(value: number, child: number): PredictCandidate {
  const sink = child > value
  return {
    tag: 'swap-or-stop',
    kind: 'choice',
    prompt: `${value} is above its bigger child ${child}. What happens next?`,
    options: [SINK, STAY],
    answer: sink ? SINK : STAY,
    why: sink
      ? `${child} is bigger than ${value}, and a max-heap wants the bigger number higher up, so they swap.`
      : child === value
        ? `${child} equals ${value}, so the child is not bigger. The heap rule already holds and ${value} stays.`
        : `Even the bigger child, ${child}, is smaller than ${value}, so ${value} may stay where it is.`,
    hint: 'Is the bigger child bigger than the value above it?',
  }
}

function run({ nums: input }: SortInput) {
  const rec = createRecorder<number[]>()
  const nums = input.slice()
  const n = nums.length

  // Working state, mirroring the variables in the code files.
  let size = n
  let i: number | null = null
  let child: number | null = null

  const emit = (
    at: string,
    say: string,
    extra: {
      marks?: Array<{ index: number; role: MarkRole }>
      edge?: { parent: number; child: number; role: 'focus' | 'changed' }
      predict?: PredictCandidate
      done?: boolean
    } = {},
  ): void => {
    const marks: Array<{ index: number; role: MarkRole }> = [...(extra.marks ?? [])]
    for (let k = size; k < n; k++) marks.push({ index: k, role: 'found' })
    const treeCount = extra.done ? n : size

    const tree: TreeScene = {
      kind: 'tree',
      root: nodeId(0),
      nodes: nums.slice(0, treeCount).map((value, k) => ({
        id: nodeId(k),
        value,
        children: [2 * k + 1 < treeCount ? nodeId(2 * k + 1) : null, 2 * k + 2 < treeCount ? nodeId(2 * k + 2) : null],
      })),
    }
    const treeMarks = marks.filter((m) => m.index < treeCount).map((m) => ({ id: nodeId(m.index), role: m.role }))
    if (treeMarks.length) tree.marks = treeMarks
    if (extra.edge) tree.edgeMarks = [{ from: nodeId(extra.edge.parent), to: nodeId(extra.edge.child), role: extra.edge.role }]
    const treePointers: NonNullable<TreeScene['pointers']> = []
    const arrayPointers: NonNullable<ArrayScene['pointers']> = []
    if (i !== null) {
      treePointers.push({ name: 'i', target: nodeId(i), role: 'ptrA' })
      arrayPointers.push({ name: 'i', index: i, role: 'ptrA' })
    }
    if (child !== null) {
      treePointers.push({ name: 'child', target: nodeId(child), role: 'ptrB' })
      arrayPointers.push({ name: 'child', index: child, role: 'ptrB' })
    }
    if (treePointers.length) tree.pointers = treePointers

    const array: ArrayScene = { kind: 'array', label: 'nums', cells: nums.slice() }
    if (marks.length) array.marks = marks
    if (arrayPointers.length) array.pointers = arrayPointers
    if (!extra.done && size > 0) array.window = { start: 0, end: size - 1 }

    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { title: extra.done ? 'Every value is in place' : 'Max-heap (the sorted tail has left the tree)', scene: tree },
        { title: 'The whole array: bracket = heap, green = sorted', scene: array },
      ],
    }
    const vars: Record<string, Val> = { i, child, size }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: n - size, max: n, label: 'Values placed at the back' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  /** The predict for "which child?" before sifting the value at `at`, if it has two children. */
  const childPredict = (at: number): PredictCandidate | undefined => {
    const l = 2 * at + 1
    return l + 1 < size ? biggerChildPredict(nums[at], nums[l], nums[l + 1], l, l + 1) : undefined
  }

  /** Sift nums[start] down inside the first `size` cells, one sift frame (+ one swap frame) per level. */
  const siftDown = (start: number): void => {
    let cur = start
    while (2 * cur + 1 < size && !rec.capped) {
      i = cur
      const left = 2 * cur + 1
      const c = left + 1 < size && nums[left + 1] > nums[left] ? left + 1 : left
      child = c
      const kids = left + 1 < size ? `${nums[left]} and ${nums[left + 1]}` : `${nums[left]}`
      const marks: Array<{ index: number; role: MarkRole }> = [{ index: cur, role: 'focus' }, { index: left, role: 'compare' }]
      if (left + 1 < size) marks.push({ index: left + 1, role: 'compare' })
      const goesDown = nums[c] > nums[cur]
      emit(
        'sift',
        left + 1 < size
          ? `${nums[cur]} has children ${kids}. The bigger one, ${nums[c]}, is the one to compare with.`
          : `${nums[cur]} has one child, ${nums[c]}. Compare with it.`,
        { marks, edge: { parent: cur, child: c, role: 'focus' }, predict: swapOrStopPredict(nums[cur], nums[c]) },
      )
      if (rec.capped) return
      if (!goesDown) {
        const why = nums[c] === nums[cur] ? `${nums[c]} is not bigger than ${nums[cur]}` : `${nums[c]} is smaller than ${nums[cur]}`
        emit('sift', `${why}, so ${nums[cur]} stays at index ${cur}. This sift is finished.`, {
          marks: [{ index: cur, role: 'found' }],
        })
        i = null
        child = null
        return
      }
      const parentIndex = cur
      const sunk = nums[cur]
      const rose = nums[c]
      nums[cur] = rose
      nums[c] = sunk
      cur = c
      i = cur
      child = null
      emit(
        'swap',
        `${rose} is bigger than ${sunk}, so they swap. ${rose} moves up to index ${parentIndex}, ${sunk} sinks to index ${c}.`,
        {
          marks: [{ index: parentIndex, role: 'changed' }, { index: c, role: 'changed' }],
          edge: { parent: parentIndex, child: c, role: 'changed' },
          predict: childPredict(c),
        },
      )
    }
    i = null
    child = null
  }

  // --- build the max-heap -------------------------------------------------
  for (let start = (n >> 1) - 1; start >= 0 && !rec.capped; start--) {
    i = start
    child = null
    emit(
      'build',
      start === (n >> 1) - 1
        ? `Build a max-heap. Start at the last parent, index ${start} (${nums[start]}), and sift it down.`
        : `Heapify the next parent up, index ${start} (${nums[start]}), and sift it down.`,
      { marks: [{ index: start, role: 'focus' }], predict: childPredict(start) },
    )
    siftDown(start)
  }

  // --- repeatedly move the biggest to the back ---------------------------------
  for (let end = n - 1; end > 0 && !rec.capped; end--) {
    const top = nums[0]
    const last = nums[end]
    nums[0] = last
    nums[end] = top
    emit('extract', `The root ${top} is the biggest. Swap it with the last heap cell, index ${end} (${last}).`, {
      marks: [{ index: 0, role: 'changed' }, { index: end, role: 'changed' }],
    })
    size = end
    i = 0
    emit('shrink', `${top} is now in its final place at index ${end}. The heap shrinks to ${size} value${size === 1 ? '' : 's'}.`, {
      marks: [{ index: 0, role: 'focus' }],
      predict: size > 2 ? childPredict(0) : undefined,
    })
    if (size > 1) siftDown(0)
    i = null
  }

  size = 0
  i = null
  child = null
  emit('done', `Every value is in place: [${nums.join(', ')}]. Heap sort is done.`, {
    done: true,
    marks: nums.map((_, k) => ({ index: k, role: 'found' as const })),
  })
  return rec.done(nums)
}

const tracer: Tracer<SortInput, number[]> = {
  id: 'sorting/heap-sort',
  title: 'Heap sort',
  anchors: {
    build: 'Build a max-heap: sift each parent down, last parent first',
    sift: 'Compare a value with its bigger child',
    swap: 'A smaller value swaps with the bigger child and sinks',
    extract: 'Swap the root (the biggest) with the last heap cell',
    shrink: 'The heap gives up that cell: it is sorted',
    done: 'Every value is in place: sorted',
  },
  vars: [
    { name: 'i', role: 'ptrA' },
    { name: 'child', role: 'ptrB' },
    { name: 'size', role: 'value' },
  ],
  input: {
    fields: FIELDS,
    parse: parseInput,
    format: formatInput,
    presets: [
      { label: 'Six numbers, shuffled', value: { nums: [4, 10, 3, 5, 1, 7] } },
      { label: 'Already sorted', value: { nums: [1, 2, 3, 4, 5, 6, 7] } },
      { label: 'Repeats', value: { nums: [5, 3, 5, 1, 3, 5] } },
    ],
    random: (seed) => {
      const rand = mulberry32(seed)
      const len = randInt(rand, 2, LIMITS.maxN)
      return { nums: Array.from({ length: len }, () => randInt(rand, -20, 40)) }
    },
    limits: LIMITS,
  },
  run,
  reference: ({ nums }) => sortedCopy(nums),
}

export default tracer
