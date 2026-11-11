/**
 * Queues — Sliding Window Maximum (LeetCode 239) with a monotonic deque.
 *
 * The deque holds INDEXES of numbers inside the current window, and their values
 * only ever go down from front to back. So the front is always the window's
 * maximum. For each new number i:
 *   1. expire: if the front index has slid out of the window, pop it from the front
 *   2. pop-back: while the back is smaller than nums[i], it can never be a max again, so pop it
 *   3. push: add i at the back
 *   4. record: once the first window is full, the front's number is that window's max
 * Equal numbers are kept (pop only while strictly smaller).
 *
 * Scene: a composite column — the input array with the window bracket on top,
 * and the deque of indexes (front / back pointers) underneath.
 *
 * Code lives in content/code/queues/window-max.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  ArrayScene,
  CompositeScene,
  Frame,
  InputLimits,
  MarkRole,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface WindowMaxInput {
  nums: number[]
  k: number
}

const LIMITS: InputLimits = { maxN: 12, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<WindowMaxInput> {
  const numsText = (raw.nums ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = numsText.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'nums', error: 'Type at least one number, like 1, 3, -1, -3, 5, 3, 6, 7.' }
  }
  if (tokens.length > LIMITS.maxN) {
    return { ok: false, field: 'nums', error: `Use at most ${LIMITS.maxN} numbers so the picture stays readable.` }
  }
  const nums: number[] = []
  for (const token of tokens) {
    if (!INTEGER.test(token)) {
      return { ok: false, field: 'nums', error: `"${token.slice(0, 14)}" isn't a whole number. Use digits separated by commas.` }
    }
    const value = Number(token)
    if (value < LIMITS.min || value > LIMITS.max) {
      return { ok: false, field: 'nums', error: `Keep every number between ${LIMITS.min} and ${LIMITS.max}.` }
    }
    nums.push(value)
  }

  const kText = (raw.k ?? '').replace(/[−–]/g, '-').trim()
  if (kText === '') return { ok: false, field: 'k', error: 'Type a window size k, like 3.' }
  if (!INTEGER.test(kText)) return { ok: false, field: 'k', error: `k must be a whole number, not "${kText.slice(0, 14)}".` }
  const k = Number(kText)
  if (k < 1) return { ok: false, field: 'k', error: 'k must be at least 1.' }
  if (k > nums.length) {
    return { ok: false, field: 'k', error: `k can't be bigger than the number of values (you gave ${nums.length}).` }
  }
  return { ok: true, value: { nums, k } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const POP_IT = 'Pop it: it is smaller'
const KEEP_IT = 'Keep it: it is not smaller'
const LEAVES = 'Yes: it slid out'
const STAYS = 'No: still inside'

/** "indexes 1 to 3" */
function span(start: number, end: number): string {
  return start === end ? `index ${start}` : `indexes ${start} to ${end}`
}

/** Asked right before the new number meets the back of the deque. */
function popBackPredict(nums: number[], dq: number[], i: number): PredictCandidate {
  const b = dq[dq.length - 1]
  const pop = nums[b] < nums[i]
  return {
    tag: 'pop-back-or-keep',
    kind: 'choice',
    prompt: `${nums[i]} arrives. The back of the deque is index ${b}, which holds ${nums[b]}. Pop it or keep it?`,
    options: [POP_IT, KEEP_IT],
    answer: pop ? POP_IT : KEEP_IT,
    why: pop
      ? `${nums[b]} is smaller than ${nums[i]} and older, so it leaves the window first. It can never be the maximum again.`
      : `${nums[b]} is not smaller than ${nums[i]}. It leaves first, so ${nums[i]} stays behind it as the next candidate.`,
    hint: 'Compare the back with the new number. An older, smaller number is useless.',
  }
}

/** Asked right before the window slides on to include index i. */
function frontExpiredPredict(dq: number[], i: number, k: number): PredictCandidate {
  const f = dq[0]
  const leaves = f === i - k
  return {
    tag: 'front-expired',
    kind: 'choice',
    prompt: `The window slides to ${span(i - k + 1, i)}. The front of the deque is index ${f}. Does it leave?`,
    options: [LEAVES, STAYS],
    answer: leaves ? LEAVES : STAYS,
    why: leaves
      ? `Index ${f} is before ${i - k + 1}, the start of the window, so it has to be popped from the front.`
      : `Index ${f} is still between ${i - k + 1} and ${i}, so it stays at the front.`,
    hint: 'Is the front index at least the window start?',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums, k }: WindowMaxInput) {
  const rec = createRecorder<number[]>()
  const n = nums.length

  // Working state — mirrors the variables in the code files.
  const dq: number[] = []
  const out: number[] = []
  const maxIndexes: number[] = []

  /**
   * Record a frame. `cur` is the index being processed (-1 before the loop and
   * on the final frame); `pushed` says whether cur is already in the deque.
   */
  const emit = (
    cur: number,
    pushed: boolean,
    at: string,
    say: string,
    extra: {
      inputMarks?: Array<{ index: number; role: MarkRole }>
      dequeMarks?: Array<{ index: number; role: MarkRole }>
      done?: boolean
      predict?: PredictCandidate
    } = {},
  ): void => {
    // Input marks: everything already seen that is not in the deque is out of play.
    const roles = new Map<number, MarkRole>()
    const seenUpTo = pushed ? cur : cur - 1
    for (let j = 0; j <= seenUpTo; j++) if (!dq.includes(j)) roles.set(j, 'discarded')
    if (cur >= 0 && !pushed) roles.set(cur, 'focus')
    for (const m of extra.inputMarks ?? []) roles.set(m.index, m.role)

    const input: ArrayScene = { kind: 'array', label: 'nums', cells: nums.slice() }
    if (!extra.done) {
      input.window = cur >= 0 ? { start: Math.max(0, cur - k + 1), end: cur } : null
      if (cur >= 0) input.pointers = [{ name: 'i', index: cur, role: 'ptrB' }]
    }
    if (roles.size) input.marks = Array.from(roles, ([index, role]) => ({ index, role }))

    // The deque is drawn with k slots; unused ones are empty.
    const deque: ArrayScene = {
      kind: 'array',
      label: 'deque (indexes)',
      cells: Array.from({ length: k }, (_, s) => (s < dq.length ? dq[s] : null)),
      pointers: [
        { name: 'front', index: 0, role: 'ptrA' },
        { name: 'back', index: dq.length - 1, role: 'ptrB' },
      ],
    }
    if (extra.dequeMarks?.length) deque.marks = extra.dequeMarks

    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { title: 'Numbers', scene: input },
        { title: 'Deque of indexes, biggest value at the front', scene: deque },
      ],
    }
    const vars: Record<string, Val> = { i: cur >= 0 ? cur : null, deque: dq.slice(), out: out.slice() }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: dq.length, max: k, label: 'Deque size' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit(-1, false, 'init', `Slide a window of ${k} over the numbers. The deque will hold indexes of candidates, the biggest value at the front.`)

  for (let i = 0; i < n && !rec.capped; i++) {
    // The question asked before step i's first frame is attached to the frame before it.
    // It is the last frame recorded so far, and it is filled in below once we know it.
    const attach = (p: PredictCandidate | undefined): void => {
      if (p && rec.frames.length > 0) rec.frames[rec.frames.length - 1].predict = p
    }

    if (i >= k) {
      // Step i opens by asking whether the front has slid out of the window.
      attach(frontExpiredPredict(dq, i, k))
      const front = dq[0]
      const leaves = front === i - k
      if (leaves) dq.shift()
      emit(
        i,
        false,
        'expire',
        leaves
          ? `Window is now ${span(i - k + 1, i)}. Front index ${front} slid out, so pop it from the front.`
          : `Window is now ${span(i - k + 1, i)}. Front index ${front} is still inside, so it stays.`,
        { inputMarks: leaves ? [{ index: front, role: 'discarded' }] : [], predict: dq.length > 0 ? popBackPredict(nums, dq, i) : undefined },
      )
    } else if (dq.length > 0) {
      // Window still filling: nothing can expire, so the pop-back question goes on the previous frame.
      attach(popBackPredict(nums, dq, i))
    }

    while (dq.length > 0 && nums[dq[dq.length - 1]] < nums[i] && !rec.capped) {
      const b = dq.pop() as number
      emit(
        i,
        false,
        'pop-back',
        `${nums[b]} (index ${b}) is smaller than ${nums[i]} and older, so it can never be a max. Pop it from the back.`,
        {
          inputMarks: [{ index: b, role: 'discarded' }],
          predict: dq.length > 0 ? popBackPredict(nums, dq, i) : undefined,
        },
      )
    }

    dq.push(i)
    emit(
      i,
      true,
      'push',
      dq.length === 1
        ? `Push index ${i} (${nums[i]}). The deque holds just index ${i}, so it is the front.`
        : `Push index ${i} (${nums[i]}) at the back. Values along the deque never go up: ${dq.map((x) => nums[x]).join(', ')}.`,
      { inputMarks: [{ index: i, role: 'changed' }], dequeMarks: [{ index: dq.length - 1, role: 'changed' }] },
    )

    if (i >= k - 1) {
      const front = dq[0]
      out.push(nums[front])
      maxIndexes.push(front)
      emit(
        i,
        true,
        'record',
        `The window, ${span(i - k + 1, i)}, is full. The front is index ${front}, so its max is ${nums[front]}.`,
        { inputMarks: [{ index: front, role: 'found' }], dequeMarks: [{ index: 0, role: 'found' }] },
      )
    }
  }

  emit(
    -1,
    false,
    'done',
    `Done. The maximum of each window of ${k} is [${out.join(', ')}].`,
    { done: true, inputMarks: maxIndexes.map((index) => ({ index, role: 'found' as const })) },
  )

  return rec.done(out)
}

/** Independent brute force: scan every window for its maximum. */
function reference({ nums, k }: WindowMaxInput): number[] {
  const out: number[] = []
  for (let start = 0; start + k <= nums.length; start++) {
    let best = -Infinity
    for (let j = start; j < start + k; j++) if (nums[j] > best) best = nums[j]
    out.push(best)
  }
  return out
}

const tracer: Tracer<WindowMaxInput, number[]> = {
  id: 'queues/window-max',
  title: 'Sliding window maximum',
  anchors: {
    init: 'Start with an empty deque of indexes',
    expire: 'Front index left the window? Pop it from the front',
    'pop-back': 'Pop from the back while it is smaller than nums[i]',
    push: 'Push index i at the back',
    record: 'Window is full: the front index holds the max',
    done: 'Return every window maximum',
  },
  vars: [
    { name: 'i', role: 'ptrB' },
    { name: 'deque', label: 'deque (indexes)', role: 'value' },
    { name: 'out', label: 'maxima so far', role: 'best' },
  ],
  input: {
    fields: [
      { name: 'nums', label: 'Numbers', kind: 'int-array', placeholder: 'e.g. 1, 3, -1, -3, 5, 3, 6, 7', help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}.` },
      { name: 'k', label: 'Window size (k)', kind: 'int', placeholder: 'e.g. 3', help: 'How many numbers the window holds. Between 1 and the number of values.' },
    ],
    parse: parseInput,
    format: ({ nums, k }) => ({ nums: nums.join(', '), k: String(k) }),
    presets: [
      { label: 'LeetCode 239 example', value: { nums: [1, 3, -1, -3, 5, 3, 6, 7], k: 3 } },
      { label: 'Falling numbers', value: { nums: [9, 7, 5, 4, 2, 1], k: 3 } },
      { label: 'Rising numbers with a tie', value: { nums: [2, 2, 4, 4, 6, 3], k: 2 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = 5 + Math.floor(rand() * 8) // 5..12
      const nums = Array.from({ length: len }, () => randInt(rand, -9, 20))
      const k = 1 + Math.floor(rand() * Math.min(len, 5)) // 1..5, small windows keep the deque readable
      return { nums, k }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
