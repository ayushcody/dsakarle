/**
 * Heaps — the k-th largest number of a stream (LeetCode 215, 703).
 *
 * The Top-K template: keep a MIN-heap that never holds more than k numbers.
 * Push each number; if the heap now holds more than k, pop the smallest. The
 * heap is always the k largest numbers seen so far, and its root, the smallest
 * of them, is the k-th largest.
 *
 * The code files use the standard library (heapq / PriorityQueue /
 * priority_queue with std::greater). The picture is drawn with the by-hand
 * sift-up and sift-down from the push and pop tracers, so one `push` or `pop`
 * frame shows the finished result of a whole sift. The stream is a third
 * scene part with the pointer `i`; numbers that were popped out are marked
 * 'discarded' there.
 *
 * Frames: `init`, then per number a `push` frame and, when the heap grew past k,
 * a `pop` frame, then `done`. The 'push-then-pop' predict sits on the push frame
 * and its reveal is the next frame. Code lives in content/code/heaps/kth-largest.
 */
import { mulberry32, randInt } from '../rng'
import { heapScene, listOf, parseIntList, parseWhole, siftDown, siftUp } from './common'
import type { HeapView } from './common'
import { createRecorder } from '@/lib/engine/recorder'
import type { ArrayScene, Frame, InputLimits, MarkRole, ParseResult, PredictCandidate, Tracer, Val } from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface KthLargestInput {
  nums: number[]
  k: number
}

const LIMITS: InputLimits = { maxN: 12, min: -99, max: 99 }
/** The heap peaks at k + 1 numbers, and the tree picture holds 9. */
const MAX_K = 8

function parseInput(raw: Record<string, string>): ParseResult<KthLargestInput> {
  const nums = parseIntList(raw.nums, 'nums', LIMITS, '3, 2, 1, 5, 6, 4')
  if (!nums.ok) return nums
  const k = parseWhole(raw.k, 'k', 'k', '2')
  if (!k.ok) return k
  if (k.value < 1) return { ok: false, field: 'k', error: 'k must be at least 1.' }
  if (k.value > nums.value.length) {
    return { ok: false, field: 'k', error: `k can't be bigger than the number of values (you gave ${nums.value.length}).` }
  }
  if (k.value > MAX_K) return { ok: false, field: 'k', error: `Use k up to ${MAX_K} so the heap picture stays readable.` }
  return { ok: true, value: { nums: nums.value, k: k.value } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const KEEP_ALL = 'Nothing: keep them all'
const POP_SMALLEST = 'Pop the smallest'

function pushThenPopPredict(size: number, k: number): PredictCandidate {
  const over = size > k
  return {
    tag: 'push-then-pop',
    kind: 'choice',
    prompt: `The heap now holds ${size} number${size === 1 ? '' : 's'} and k = ${k}. What happens before the next number?`,
    options: [KEEP_ALL, POP_SMALLEST],
    answer: over ? POP_SMALLEST : KEEP_ALL,
    why: over
      ? `${size} is more than k = ${k}. The heap may only keep the k largest, so the smallest of them has to go.`
      : `${size} is not more than k = ${k}, so there is still room: all of them stay.`,
    hint: 'Compare the heap size with k.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

interface Item {
  v: number
  /** Index in the stream, to tell equal numbers apart. */
  src: number
}

function run({ nums, k }: KthLargestInput) {
  const rec = createRecorder<number>()
  const n = nums.length
  const heap: Item[] = []
  const dropped = new Set<number>()
  const key = (item: Item): number => item.v

  // Working state: mirrors the variables in the code files.
  let i = -1
  let num: number | null = null

  const emit = (
    at: string,
    say: string,
    extra: {
      heapMarks?: HeapView['marks']
      predict?: PredictCandidate
      pointer?: boolean
    } = {},
  ): void => {
    const roles = new Map<number, MarkRole>()
    for (let s = 0; s < n; s++) {
      if (s > i) break
      roles.set(s, dropped.has(s) ? 'discarded' : 'visited')
    }
    if (extra.pointer && i >= 0 && i < n && !dropped.has(i)) roles.set(i, 'focus')
    const stream: ArrayScene = {
      kind: 'array',
      label: 'nums',
      cells: nums.slice(),
      marks: Array.from(roles, ([index, role]) => ({ index, role })),
    }
    if (extra.pointer && i >= 0 && i < n) stream.pointers = [{ name: 'i', index: i, role: 'ptrB' }]
    if (!stream.marks?.length) delete stream.marks

    const values = heap.map(key)
    const view: HeapView = { heap: values, marks: extra.heapMarks, capacity: k + 1 }
    const vars: Record<string, Val> = {
      i: i < 0 ? null : i,
      num,
      size: heap.length,
      k,
      kth: heap.length >= k ? values[0] : null,
    }
    const frame: Frame = {
      scene: heapScene(view, [{ title: 'The stream', scene: stream }]),
      vars,
      say,
      at,
      gauge: { value: heap.length, max: k, label: 'Heap size (k allowed)' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit('init', `Find the ${k}${ordinal(k)} largest of ${listOf(nums)}. Keep a min-heap that never holds more than ${k} number${k === 1 ? '' : 's'}.`)

  for (i = 0; i < n && !rec.capped; i++) {
    num = nums[i]
    heap.push({ v: num, src: i })
    const at = siftUp(heap, key)
    emit('push', `Push ${num} from the stream. It settles at index ${at}, and the heap now holds ${heap.length} number${heap.length === 1 ? '' : 's'}.`, {
      heapMarks: [{ index: at, role: 'focus' }],
      pointer: true,
      predict: pushThenPopPredict(heap.length, k),
    })
    if (rec.capped) break

    if (heap.length > k) {
      const out = heap[0]
      const lastItem = heap.pop() as Item
      if (heap.length > 0) {
        heap[0] = lastItem
        siftDown(heap, 0, key)
      }
      dropped.add(out.src)
      const kth = heap[0].v
      emit('pop', `The heap holds ${heap.length + 1}, one more than k = ${k}: pop the smallest, ${out.v}. Root ${kth} is now the ${k}${ordinal(k)} largest so far.`, {
        heapMarks: [{ index: 0, role: 'focus' }],
        pointer: true,
      })
    }
  }

  i = n
  num = null
  emit('done', `The stream is over. The heap holds the ${k} largest; its root, ${heap[0].v}, is the ${k}${ordinal(k)} largest. Return ${heap[0].v}.`, {
    heapMarks: [{ index: 0, role: 'found' }],
  })

  return rec.done(heap[0].v)
}

/** 1 → "st", 2 → "nd", 3 → "rd", 11 → "th". */
function ordinal(n: number): string {
  const teen = n % 100 >= 11 && n % 100 <= 13
  if (!teen && n % 10 === 1) return 'st'
  if (!teen && n % 10 === 2) return 'nd'
  if (!teen && n % 10 === 3) return 'rd'
  return 'th'
}

/** Independent check: sort everything, largest first, and take position k. */
function reference({ nums, k }: KthLargestInput): number {
  return [...nums].sort((a, b) => b - a)[k - 1]
}

const tracer: Tracer<KthLargestInput, number> = {
  id: 'heaps/kth-largest',
  title: 'K-th largest (Top K)',
  anchors: {
    init: 'Start with an empty min-heap',
    push: 'Push the next number from the stream',
    pop: 'More than k numbers? Pop the smallest',
    done: 'The root is the k-th largest',
  },
  vars: [
    { name: 'i', label: 'i (stream position)', role: 'ptrB' },
    { name: 'num', label: 'next number', role: 'value' },
    { name: 'size', label: 'heap size', role: 'value' },
    { name: 'k', role: 'value' },
    { name: 'kth', label: 'k-th largest so far', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 'nums',
        label: 'Numbers (the stream)',
        kind: 'int-array',
        placeholder: 'e.g. 3, 2, 3, 1, 2, 4, 5, 5, 6',
        help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}, read left to right.`,
      },
      { name: 'k', label: 'k', kind: 'int', placeholder: 'e.g. 4', help: `Which largest to find: between 1 and the number of values, at most ${MAX_K}.` },
    ],
    parse: parseInput,
    format: ({ nums, k }) => ({ nums: nums.join(', '), k: String(k) }),
    presets: [
      { label: 'LeetCode 215: 4th largest of nine', value: { nums: [3, 2, 3, 1, 2, 4, 5, 5, 6], k: 4 } },
      { label: '2nd largest of six', value: { nums: [3, 2, 1, 5, 6, 4], k: 2 } },
      { label: 'k equals the length: nothing is popped', value: { nums: [7, 1, 9], k: 3 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 1, LIMITS.maxN)
      const nums = Array.from({ length: len }, () => randInt(rand, -9, 40))
      return { nums, k: randInt(rand, 1, Math.min(len, MAX_K)) }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
