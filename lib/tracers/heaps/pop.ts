/**
 * Heaps — pop the smallest value and sift down.
 *
 * Start from a min-heap built from `values` (by pushing them one at a time, the
 * same way the push tracer does), then pop `pops` times. One pop is:
 *   take    the root: it is the smallest
 *   move    the LAST element to the root and shrink the heap
 *   sift    while the moving value has children, find the SMALLER child
 *           (`children`), compare (`compare`), and swap down (`swap`) if that
 *           child is smaller; otherwise stop. Either way the sift ends on a
 *           `settle` frame, which is also where a value with no children stops.
 *
 * Predicts: 'which-child' (cell, answer is the node id `h<i>`) on the children
 * frame when there are two children, and 'swap-or-stop' on the compare frame.
 * Their reveal is the next frame. Scenes come from ./common. Code lives in
 * content/code/heaps/pop.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { HEAP_LIMITS, buildByPushing, heapScene, listOf, nodeId, parseIntList, parseWhole, smallerChild } from './common'
import type { EdgeRole, HeapView } from './common'
import { createRecorder } from '@/lib/engine/recorder'
import type { Frame, ParseResult, PredictCandidate, Tracer, Val } from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface PopInput {
  /** Pushed one at a time onto an empty min-heap to build the starting heap. */
  values: number[]
  /** How many times to pop (1..values.length). */
  pops: number
}

function parseInput(raw: Record<string, string>): ParseResult<PopInput> {
  const values = parseIntList(raw.values, 'values', HEAP_LIMITS, '6, 2, 3, 4, 5, 9, 7')
  if (!values.ok) return values
  const pops = parseWhole(raw.pops, 'pops', 'how many times to pop', '2')
  if (!pops.ok) return pops
  if (pops.value < 1) return { ok: false, field: 'pops', error: 'Pop at least once.' }
  if (pops.value > values.value.length) {
    return { ok: false, field: 'pops', error: `You can't pop more than the ${values.value.length} numbers in the heap.` }
  }
  return { ok: true, value: { values: values.value, pops: pops.value } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const SINK = 'Swap and sink further'
const STAY = 'Stop: it stays here'

function whichChildPredict(value: number, left: number, right: number, li: number, ri: number): PredictCandidate {
  const rightWins = right < left
  const small = rightWins ? right : left
  const index = rightWins ? ri : li
  return {
    tag: 'which-child',
    kind: 'cell',
    prompt: `${value} has two children, ${left} and ${right}. Click the child it should be compared with.`,
    answer: nodeId(index),
    why: `The smaller child, ${small}, is the one to compare with. If ${value} must go down, it swaps with that child, because the other child is bigger and could not sit above it.`,
    hint: 'Which child could safely become the parent of the other one?',
  }
}

function swapOrStopPredict(value: number, child: number): PredictCandidate {
  const sink = child < value
  return {
    tag: 'swap-or-stop',
    kind: 'choice',
    prompt: `${value} is above its smaller child ${child}. What happens next?`,
    options: [SINK, STAY],
    answer: sink ? SINK : STAY,
    why: sink
      ? `${child} is smaller than ${value}, and a min-heap wants the smaller number higher up, so they swap.`
      : child === value
        ? `${child} equals ${value}, so the smaller child is not smaller. The heap property already holds and ${value} stays.`
        : `Even the smaller child, ${child}, is bigger than ${value}, so both children are bigger and ${value} may stay.`,
    hint: 'A parent must be no bigger than either child.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ values, pops }: PopInput) {
  const rec = createRecorder<number[]>()
  const total = values.length
  const heap = buildByPushing(values)
  const popped: number[] = []

  // Working state: mirrors the variables in the code files.
  let smallest: number | null = null
  let last: number | null = null
  let i = -1
  let child: number | null = null

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
    const vars: Record<string, Val> = {
      smallest,
      last,
      i: i < 0 ? null : i,
      child,
      popped: popped.slice(),
      size: heap.length,
    }
    const frame: Frame = {
      scene: heapScene(view),
      vars,
      say,
      at,
      gauge: { value: heap.length, max: total, label: 'Heap size' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit('init', `A min-heap built from ${listOf(values)}. Pop ${pops} time${pops === 1 ? '' : 's'}: each pop hands back the smallest number left.`)

  for (let pop = 0; pop < pops && !rec.capped; pop++) {
    smallest = heap[0]
    last = null
    child = null
    i = -1
    emit('take', `Take the root, ${smallest}: in a min-heap the smallest of all ${heap.length} number${heap.length === 1 ? '' : 's'} is always at the top.`, {
      marks: [{ index: 0, role: 'found' }],
    })
    if (rec.capped) break

    // Move the last element to the root and shrink the heap.
    last = heap.pop() as number
    popped.push(smallest)
    if (heap.length === 0) {
      emit('move', `${last} was the only number, so removing it leaves an empty heap.`)
      continue
    }
    heap[0] = last
    i = 0
    emit('move', `Move the last number, ${last}, to the root and shrink the heap. It was a leaf, so it is probably too big up here.`, {
      marks: [{ index: 0, role: 'changed' }],
      showPointer: true,
    })

    // Sift down.
    for (;;) {
      const c = smallerChild(heap, i, (x) => x)
      if (c < 0 || rec.capped) break
      const left = 2 * i + 1
      const right = left + 1
      const two = right < heap.length
      child = c
      const kids = two ? [left, right] : [left]
      emit(
        'children',
        two
          ? `${heap[i]} at index ${i} has two children: ${heap[left]} and ${heap[right]}. Only the smaller one matters.`
          : `${heap[i]} at index ${i} has just one child: ${heap[left]}.`,
        {
          marks: [{ index: i, role: 'focus' }, ...kids.map((k) => ({ index: k, role: 'compare' as const }))],
          edges: kids.map((k) => ({ parent: i, child: k, role: 'focus' as const })),
          showPointer: true,
          predict: two ? whichChildPredict(heap[i], heap[left], heap[right], left, right) : undefined,
        },
      )
      if (rec.capped) break

      const moving = heap[i]
      const under = heap[c]
      emit('compare', `${two ? `The smaller child is ${under}, at index ${c}. ` : ''}Compare ${under} with ${moving}.`, {
        marks: [
          { index: i, role: 'focus' },
          { index: c, role: 'compare' },
        ],
        edges: [{ parent: i, child: c, role: 'focus' }],
        notes: [{ index: c, text: `${under} vs ${moving}` }],
        showPointer: true,
        predict: swapOrStopPredict(moving, under),
      })
      if (rec.capped || under >= moving) break

      ;[heap[i], heap[c]] = [heap[c], heap[i]]
      const from = i
      i = c
      emit('swap', `${under} < ${moving}, so swap: ${under} rises to index ${from} and ${moving} sinks to index ${i}.`, {
        marks: [
          { index: from, role: 'changed' },
          { index: i, role: 'changed' },
        ],
        edges: [{ parent: from, child: i, role: 'changed' }],
        showPointer: true,
      })
    }

    const settled = heap[i]
    const c = smallerChild(heap, i, (x) => x)
    child = null
    const say =
      c < 0
        ? `${settled} at index ${i} has no children, so it stays. The heap property holds again.`
        : `${settled} is no bigger than its smaller child ${heap[c]}, so it stays at index ${i}. The heap property holds again.`
    emit('settle', say, {
      marks: [{ index: i, role: 'found' }, ...(c >= 0 ? [{ index: c, role: 'compare' as const }] : [])],
      showPointer: true,
    })
  }

  smallest = null
  last = null
  i = -1
  child = null
  emit('done', `Popped ${listOf(popped)}, smallest first. The heap now holds [${heap.join(', ')}].`)

  return rec.done(popped.slice())
}

/** Independent check: popping a min-heap yields the numbers in ascending order. */
function reference({ values, pops }: PopInput): number[] {
  return [...values].sort((a, b) => a - b).slice(0, pops)
}

const tracer: Tracer<PopInput, number[]> = {
  id: 'heaps/pop',
  title: 'Pop (sift down)',
  anchors: {
    init: 'Start with a valid min-heap',
    take: 'Take the root: it is the smallest',
    move: 'Move the last element to the root and shrink the heap',
    children: 'Find the smaller child of i',
    compare: 'Is that child smaller than the moving value?',
    swap: 'Yes: swap with it and keep sinking',
    settle: 'No children, or none smaller: it stays here',
    done: 'Return the popped values, smallest first',
  },
  vars: [
    { name: 'smallest', label: 'popped value', role: 'best' },
    { name: 'last', label: 'last element', role: 'value' },
    { name: 'i', label: 'i (moving value’s index)', role: 'focus' },
    { name: 'child', label: 'smaller child', role: 'ptrB' },
    { name: 'popped', label: 'popped so far', role: 'value' },
    { name: 'size', label: 'heap size', role: 'value' },
  ],
  input: {
    fields: [
      {
        name: 'values',
        label: 'Numbers in the heap',
        kind: 'int-array',
        placeholder: 'e.g. 6, 2, 3, 4, 5, 9, 7',
        help: `Up to ${HEAP_LIMITS.maxN} whole numbers from ${HEAP_LIMITS.min} to ${HEAP_LIMITS.max}. They are pushed into a min-heap first.`,
      },
      { name: 'pops', label: 'Pops', kind: 'int', placeholder: 'e.g. 2', help: 'How many times to pop. Between 1 and the number of values.' },
    ],
    parse: parseInput,
    format: ({ values, pops }) => ({ values: values.join(', '), pops: String(pops) }),
    presets: [
      { label: 'Pop twice from seven', value: { values: [6, 2, 3, 4, 5, 9, 7], pops: 2 } },
      { label: 'Drain a small heap', value: { values: [4, 2, 7], pops: 3 } },
      { label: 'Equal values stop the sink', value: { values: [3, 3, 3, 1, 3, 3], pops: 1 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 1, HEAP_LIMITS.maxN)
      const values = Array.from({ length: len }, () => randInt(rand, -9, 40))
      return { values, pops: randInt(rand, 1, Math.min(len, 3)) }
    },
    limits: HEAP_LIMITS,
  },
  run,
  reference,
}

export default tracer
