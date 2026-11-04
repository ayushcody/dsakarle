/**
 * Heaps — push a value onto a min-heap and sift it up.
 *
 * Push values one at a time into an empty min-heap. Each push is: append in the
 * next free slot (index n), then climb: while the value is smaller than its
 * parent (index floor((i - 1) / 2)), swap them. The loop ends when the parent is
 * not bigger, or the value reaches the root.
 *
 * Frames per push: `append`, then `compare` (+ `swap`) for every level climbed,
 * then `settle`. The compare frame carries the 'swap-or-stop' predict; its
 * reveal is the next frame (a swap, or the settle). At the root there is no
 * parent to compare with, so the loop ends on a `settle` frame directly.
 *
 * Layout follows binary-search/first-true. Scenes come from ./common. Code lives
 * in content/code/heaps/push.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { HEAP_LIMITS, heapScene, listOf, parseIntList } from './common'
import type { EdgeRole, HeapView } from './common'
import { createRecorder } from '@/lib/engine/recorder'
import type { Frame, ParseResult, PredictCandidate, Tracer, Val } from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface PushInput {
  /** Pushed one at a time, in this order, onto an empty min-heap. */
  values: number[]
}

function parseInput(raw: Record<string, string>): ParseResult<PushInput> {
  const parsed = parseIntList(raw.values, 'values', HEAP_LIMITS, '5, 3, 8, 1')
  return parsed.ok ? { ok: true, value: { values: parsed.value } } : parsed
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const SWAP = 'Swap them and keep climbing'
const STAY = 'Stop: it stays here'

function swapOrStopPredict(child: number, parent: number): PredictCandidate {
  const swap = parent > child
  return {
    tag: 'swap-or-stop',
    kind: 'choice',
    prompt: `${child} sits under its parent ${parent}. In a min-heap, what happens next?`,
    options: [SWAP, STAY],
    answer: swap ? SWAP : STAY,
    why: swap
      ? `${child} is smaller than its parent ${parent}, and a min-heap wants the smaller number higher up, so they swap.`
      : child === parent
        ? `${child} equals its parent. The parent is not bigger, so the heap property already holds and the climb stops.`
        : `The parent ${parent} is already smaller than ${child}. Nothing above can be bigger, so the climb stops.`,
    hint: 'In a min-heap, may a parent be bigger than its child?',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ values }: PushInput) {
  const rec = createRecorder<number[]>()
  const total = values.length
  const heap: number[] = []

  // Working state: mirrors the variables in the code files.
  let value: number | null = null
  let i = -1
  let parent: number | null = null
  let pushed = 0

  const emit = (
    at: string,
    say: string,
    extra: {
      marks?: HeapView['marks']
      edges?: Array<{ parent: number; child: number; role: EdgeRole }>
      notes?: HeapView['notes']
      showPointer?: boolean
      predict?: PredictCandidate
    } = {},
  ): void => {
    const view: HeapView = {
      heap,
      marks: extra.marks,
      edges: extra.edges,
      notes: extra.notes,
      pointers: extra.showPointer && i >= 0 ? [{ name: 'i', index: i, role: 'focus' }] : undefined,
      capacity: total,
    }
    const vars: Record<string, Val> = { value, i: i < 0 ? null : i, parent, size: heap.length }
    const frame: Frame = {
      scene: heapScene(view),
      vars,
      say,
      at,
      gauge: { value: pushed, max: total, label: 'Values pushed' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit('init', `An empty min-heap. Push ${listOf(values)} in order; the smallest value will always end up at the top.`)

  for (const v of values) {
    if (rec.capped) break
    value = v
    parent = null
    heap.push(v)
    i = heap.length - 1
    emit(
      'append',
      i === 0
        ? `Push ${v}: the heap is empty, so it becomes the root at index 0.`
        : `Push ${v}: put it in the next free slot, index ${i}. The tree stays complete; the order may now be wrong.`,
      { marks: [{ index: i, role: 'focus' }], showPointer: true },
    )

    while (i > 0 && !rec.capped) {
      parent = (i - 1) >> 1
      const child = heap[i]
      const above = heap[parent]
      emit('compare', `Compare ${child} with its parent ${above}: the parent is at index ⌊(${i} − 1) / 2⌋ = ${parent}.`, {
        marks: [
          { index: i, role: 'focus' },
          { index: parent, role: 'compare' },
        ],
        edges: [{ parent, child: i, role: 'focus' }],
        notes: [{ index: parent, text: `${above} vs ${child}` }],
        showPointer: true,
        predict: swapOrStopPredict(child, above),
      })
      if (rec.capped || above <= child) break

      ;[heap[parent], heap[i]] = [heap[i], heap[parent]]
      const from = i
      i = parent
      emit('swap', `${child} < ${above}, so swap: ${child} moves up to index ${i} and ${above} drops to index ${from}.`, {
        marks: [
          { index: i, role: 'changed' },
          { index: from, role: 'changed' },
        ],
        edges: [{ parent: i, child: from, role: 'changed' }],
        showPointer: true,
      })
    }

    const settled = heap[i]
    let say: string
    if (i === 0) {
      say = heap.length === 1 ? `${settled} stays at the root: a heap of one is always valid.` : `${settled} reached the root, index 0. There is nothing above it, so the climb is over.`
    } else {
      const up = heap[(i - 1) >> 1]
      say = `The parent ${up} is not bigger than ${settled}, so ${settled} settles at index ${i}.`
    }
    pushed++
    emit('settle', say, { marks: [{ index: i, role: 'found' }], showPointer: true })
  }

  value = null
  i = -1
  parent = null
  emit('done', `All ${total} pushed. The smallest, ${heap[0]}, sits at the root; the heap array is [${heap.join(', ')}].`, {
    marks: [{ index: 0, role: 'found' }],
  })

  return rec.done(heap.slice())
}

/**
 * Independent check: on the path from the root to the new slot the values are
 * already sorted (each is at most its child), and a push only inserts the new
 * value into that sorted chain. Rewrite the chain, no swapping.
 */
function reference({ values }: PushInput): number[] {
  const heap: number[] = []
  for (const v of values) {
    const slot = heap.length
    const path: number[] = [] // indexes from the root down to the new slot's parent
    for (let p = slot; p > 0; ) {
      p = Math.floor((p - 1) / 2)
      path.unshift(p)
    }
    const chain = path.map((idx) => heap[idx])
    let at = chain.length
    while (at > 0 && chain[at - 1] > v) at--
    chain.splice(at, 0, v)
    const targets = [...path, slot]
    targets.forEach((idx, k) => {
      heap[idx] = chain[k]
    })
  }
  return heap
}

const tracer: Tracer<PushInput, number[]> = {
  id: 'heaps/push',
  title: 'Push (sift up)',
  anchors: {
    init: 'Start with an empty min-heap',
    append: 'Put the new value in the next free slot, at the end',
    compare: 'Is it smaller than its parent, at (i − 1) / 2?',
    swap: 'Yes: swap with the parent and keep climbing',
    settle: 'Parent not bigger, or at the root: it stays here',
    done: 'The smallest value is at the root',
  },
  vars: [
    { name: 'value', label: 'new value', role: 'value' },
    { name: 'i', label: 'i (new value’s index)', role: 'focus' },
    { name: 'parent', label: 'parent index', role: 'ptrA' },
    { name: 'size', label: 'heap size', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 'values',
        label: 'Numbers to push, in order',
        kind: 'int-array',
        placeholder: 'e.g. 5, 3, 8, 1, 6, 2',
        help: `Up to ${HEAP_LIMITS.maxN} whole numbers from ${HEAP_LIMITS.min} to ${HEAP_LIMITS.max}. They go into an empty min-heap one by one.`,
      },
    ],
    parse: parseInput,
    format: ({ values }) => ({ values: values.join(', ') }),
    presets: [
      { label: 'Six pushes, some climb far', value: { values: [5, 3, 8, 6, 2, 4] } },
      { label: 'Already ascending: no swaps', value: { values: [1, 2, 3, 4, 5, 6, 7] } },
      { label: 'Descending: every push climbs', value: { values: [9, 8, 7, 6, 5, 4, 3] } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 1, HEAP_LIMITS.maxN)
      return { values: Array.from({ length: len }, () => randInt(rand, -9, 40)) }
    },
    limits: HEAP_LIMITS,
  },
  run,
  reference,
}

export default tracer
