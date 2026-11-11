/**
 * Queues — a circular queue with 6 slots, running enqueue and dequeue.
 *
 * The queue lives in a fixed array. Nobody ever shifts: `front` marks the slot
 * of the oldest arrival, `back` marks the slot of the newest, and `size` counts
 * how many slots are in use. Both markers only move forward, and `% 6` wraps
 * them from the last slot back to slot 0, so freed slots get reused. An empty
 * queue starts with front = 0 and back = 5 (one step "behind" slot 0), so the
 * first enqueue lands in (5 + 1) % 6 = 0.
 *
 * Same layout as the other tracers:
 *   1. input type, parsing and presets
 *   2. frame helpers (narration / predicts)
 *   3. `run` — the real algorithm, recording one frame per operation
 *   4. `reference` — a boring JS array the tests compare against
 *
 * Code lives in content/code/queues/enqueue-dequeue.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  ArrayScene,
  Frame,
  InputLimits,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export type QueueOp = { op: 'enqueue'; value: number } | { op: 'dequeue' }

export interface EnqueueDequeueInput {
  ops: QueueOp[]
}

export interface EnqueueDequeueResult {
  /** One entry per `dequeue`, in order; null when the line was empty. */
  served: Array<number | null>
  /** How many operations were refused (enqueue on a full line, dequeue on an empty one). */
  refused: number
  /** What is left in the line, front to back. */
  queue: number[]
}

/** Number of slots. Part of the lesson: wrap-around is `% 6`. */
const CAPACITY = 6

/** `maxN` is the operation limit; `min`..`max` is the value range. */
const LIMITS: InputLimits = { maxN: 10, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/

/** Keep echoed user text short so error messages stay friendly. */
function shown(text: string): string {
  return text.length > 14 ? `${text.slice(0, 13)}…` : text
}

function parseInput(raw: Record<string, string>): ParseResult<EnqueueDequeueInput> {
  const field = 'ops'
  const parts = (raw.ops ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .split(/[,;\n]+/)
    .map((p) => p.trim())
    .filter((p) => p !== '')

  if (parts.length === 0) {
    return { ok: false, field, error: 'Type at least one operation, like enqueue 4, dequeue.' }
  }
  if (parts.length > LIMITS.maxN) {
    return { ok: false, field, error: `Use at most ${LIMITS.maxN} operations so the line stays readable.` }
  }

  const ops: QueueOp[] = []
  for (const part of parts) {
    const words = part.split(/\s+/)
    const verb = words[0].toLowerCase()
    if (verb !== 'enqueue' && verb !== 'dequeue') {
      return { ok: false, field, error: `"${shown(words[0])}" isn't an operation here. Use enqueue VALUE or dequeue.` }
    }
    if (verb === 'dequeue') {
      if (words.length !== 1) {
        return { ok: false, field, error: 'dequeue takes no value, it just serves whoever is first. Separate operations with commas.' }
      }
      ops.push({ op: 'dequeue' })
      continue
    }
    if (words.length !== 2) {
      return { ok: false, field, error: 'enqueue needs one number, like enqueue 4. Separate operations with commas.' }
    }
    if (!INTEGER.test(words[1])) {
      return { ok: false, field, error: `"${shown(words[1])}" isn't a whole number. Try enqueue 4.` }
    }
    const value = Number(words[1])
    if (value < LIMITS.min || value > LIMITS.max) {
      return { ok: false, field, error: `Keep every value between ${LIMITS.min} and ${LIMITS.max}.` }
    }
    ops.push({ op: 'enqueue', value })
  }
  return { ok: true, value: { ops } }
}

function formatOps(ops: QueueOp[]): string {
  return ops.map((o) => (o.op === 'enqueue' ? `enqueue ${o.value}` : 'dequeue')).join(', ')
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const GOES_IN = 'It goes in'
const ENQUEUE_REFUSED = 'Refused: the line is full'
const SERVED = 'Someone is served'
const DEQUEUE_REFUSED = 'Refused: the line is empty'

interface State {
  buf: Array<number | null>
  front: number
  back: number
  size: number
}

/** Question asked before the op at hand is shown (attached to the frame before it). */
function predictFor(op: QueueOp, s: State): PredictCandidate {
  if (op.op === 'enqueue') {
    if (s.size === CAPACITY) {
      return {
        tag: 'refused-or-ok',
        kind: 'choice',
        prompt: `The line holds ${s.size} of ${CAPACITY} slots. What happens to enqueue ${op.value}?`,
        options: [GOES_IN, ENQUEUE_REFUSED],
        answer: ENQUEUE_REFUSED,
        why: `Every slot is taken. The next slot, ${(s.back + 1) % CAPACITY}, is the front's own, and writing there would erase someone who is still waiting.`,
        hint: 'Count the slots in use. Is there a free one?',
      }
    }
    const next = (s.back + 1) % CAPACITY
    const wraps = next < s.back && s.size > 0
    return {
      tag: 'where-back-goes',
      kind: 'cell',
      prompt: `Next is enqueue ${op.value}, and back is at slot ${s.back}. Which slot gets ${op.value}?`,
      answer: next,
      why: `back becomes (${s.back} + 1) % ${CAPACITY} = ${next}${wraps ? ', wrapping from the last slot to the first' : ''}, and ${op.value} is written there.`,
      hint: 'Move back one slot to the right. After slot 5 comes slot 0.',
    }
  }
  if (s.size === 0) {
    return {
      tag: 'refused-or-ok',
      kind: 'choice',
      prompt: 'The line is empty (size 0). What happens to dequeue?',
      options: [SERVED, DEQUEUE_REFUSED],
      answer: DEQUEUE_REFUSED,
      why: 'There is nobody to serve, so dequeue has to refuse and change nothing.',
      hint: 'Is anyone waiting?',
    }
  }
  const value = s.buf[s.front]
  return {
    tag: 'who-leaves',
    kind: 'cell',
    prompt: 'Next is dequeue. Which slot holds the person who is served?',
    answer: s.front,
    why: `The oldest arrival sits at front: slot ${s.front} holds ${value}, so ${value} is served, not the newest.`,
    hint: 'First in, first out. Look for the pointer marked front.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ ops }: EnqueueDequeueInput) {
  const rec = createRecorder<EnqueueDequeueResult>()

  // Working state — mirrors the variables in the code files.
  const s: State = {
    buf: Array.from({ length: CAPACITY }, () => null),
    front: 0,
    back: CAPACITY - 1,
    size: 0,
  }
  const served: Array<number | null> = []
  let refused = 0

  const emit = (
    at: string,
    say: string,
    extra: {
      marks?: ArrayScene['marks']
      annotations?: ArrayScene['annotations']
      predict?: PredictCandidate
    } = {},
  ): void => {
    const scene: ArrayScene = {
      kind: 'array',
      label: 'line',
      cells: s.buf.slice(),
      pointers: [
        { name: 'front', index: s.front, role: 'ptrA' },
        { name: 'back', index: s.back, role: 'ptrB' },
      ],
    }
    if (extra.marks?.length) scene.marks = extra.marks
    if (extra.annotations?.length) scene.annotations = extra.annotations
    const vars: Record<string, Val> = { front: s.front, back: s.back, size: s.size }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: s.size, max: CAPACITY, label: 'Slots in use' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit(
    'init',
    `A line with ${CAPACITY} empty slots. front = 0 and back = ${CAPACITY - 1}, so the first enqueue lands in (${CAPACITY - 1} + 1) % ${CAPACITY} = 0.`,
    { predict: ops.length > 0 ? predictFor(ops[0], s) : undefined },
  )

  for (let o = 0; o < ops.length && !rec.capped; o++) {
    const op = ops[o]
    const nextPredict = (): PredictCandidate | undefined => (o + 1 < ops.length ? predictFor(ops[o + 1], s) : undefined)

    if (op.op === 'enqueue') {
      if (s.size === CAPACITY) {
        refused++
        const next = (s.back + 1) % CAPACITY
        emit(
          'full',
          `Enqueue ${op.value}: (${s.back} + 1) % ${CAPACITY} = ${next} is the front's slot and size is ${CAPACITY}, so the line is full. Refused.`,
          {
            marks: [{ index: s.front, role: 'error' }],
            annotations: [{ target: `cell:${s.front}`, text: 'still in use' }],
            predict: nextPredict(),
          },
        )
        continue
      }
      const oldBack = s.back
      const wrapped = (oldBack + 1) % CAPACITY < oldBack && s.size > 0
      s.back = (oldBack + 1) % CAPACITY
      s.buf[s.back] = op.value
      s.size++
      emit(
        'enqueue',
        `Enqueue ${op.value}: back = (${oldBack} + 1) % ${CAPACITY} = ${s.back}, so ${op.value} goes in slot ${s.back}.${wrapped ? ' back wrapped round to the start.' : ''}`,
        {
          marks: [{ index: s.back, role: 'changed' }],
          annotations: [{ target: `cell:${s.back}`, text: `${op.value} in` }],
          predict: nextPredict(),
        },
      )
      continue
    }

    // dequeue
    if (s.size === 0) {
      refused++
      served.push(null)
      emit('empty', 'Dequeue on an empty line: size is 0, so there is nobody to serve. It reports empty and changes nothing.', {
        annotations: [{ target: 'ptr:front', text: 'nobody here' }],
        predict: nextPredict(),
      })
      continue
    }
    const oldFront = s.front
    const value = s.buf[oldFront] as number
    s.buf[oldFront] = null
    s.front = (oldFront + 1) % CAPACITY
    s.size--
    served.push(value)
    const wrapped = s.front < oldFront
    emit(
      'dequeue',
      `Dequeue: slot ${oldFront} holds ${value}, so ${value} is served. front = (${oldFront} + 1) % ${CAPACITY} = ${s.front}. Slot ${oldFront} is free again.${wrapped ? ' front wrapped round.' : ''}${s.size === 0 ? ' The line is empty.' : ''}`,
      {
        marks: [{ index: oldFront, role: 'discarded' }],
        annotations: [{ target: `cell:${oldFront}`, text: `${value} leaves` }],
        predict: nextPredict(),
      },
    )
  }

  const queue: number[] = []
  for (let i = 0; i < s.size; i++) queue.push(s.buf[(s.front + i) % CAPACITY] as number)
  return rec.done({ served, refused, queue })
}

/** Independent version: a plain JS array that shifts, with the same capacity rule. */
function reference({ ops }: EnqueueDequeueInput): EnqueueDequeueResult {
  const line: number[] = []
  const served: Array<number | null> = []
  let refused = 0
  for (const op of ops) {
    if (op.op === 'enqueue') {
      if (line.length >= CAPACITY) refused++
      else line.push(op.value)
    } else if (line.length === 0) {
      refused++
      served.push(null)
    } else {
      served.push(line.shift() as number)
    }
  }
  return { served, refused, queue: line }
}

const tracer: Tracer<EnqueueDequeueInput, EnqueueDequeueResult> = {
  id: 'queues/enqueue-dequeue',
  title: 'Circular queue',
  anchors: {
    init: 'Start with 6 empty slots, front = 0, back = 5, size = 0',
    full: 'Full? Refuse the newcomer',
    enqueue: 'Enqueue: back = (back + 1) % 6, then write there',
    empty: 'Empty? Refuse, there is nobody to serve',
    dequeue: 'Dequeue: read the front, then front = (front + 1) % 6',
  },
  vars: [
    { name: 'front', role: 'ptrA' },
    { name: 'back', role: 'ptrB' },
    { name: 'size', label: 'size', role: 'value' },
  ],
  input: {
    fields: [
      {
        name: 'ops',
        label: 'Operations',
        kind: 'string',
        placeholder: 'e.g. enqueue 4, enqueue 9, dequeue, enqueue 2',
        help: `Up to ${LIMITS.maxN} operations, separated by commas: enqueue VALUE or dequeue. Values are whole numbers ${LIMITS.min} to ${LIMITS.max}. The line has ${CAPACITY} slots.`,
      },
    ],
    parse: parseInput,
    format: ({ ops }) => ({ ops: formatOps(ops) }),
    presets: [
      {
        label: 'Empty, wrap-around, full',
        value: {
          ops: [
            { op: 'enqueue', value: 4 },
            { op: 'dequeue' },
            { op: 'dequeue' },
            { op: 'enqueue', value: 7 },
            { op: 'enqueue', value: 2 },
            { op: 'enqueue', value: 9 },
            { op: 'enqueue', value: 5 },
            { op: 'enqueue', value: 8 },
            { op: 'enqueue', value: 3 },
            { op: 'enqueue', value: 6 },
          ],
        },
      },
      {
        label: 'A steady line',
        value: {
          ops: [
            { op: 'enqueue', value: 4 },
            { op: 'enqueue', value: 9 },
            { op: 'dequeue' },
            { op: 'enqueue', value: 2 },
            { op: 'enqueue', value: 7 },
            { op: 'dequeue' },
            { op: 'enqueue', value: 5 },
            { op: 'enqueue', value: 8 },
            { op: 'dequeue' },
            { op: 'enqueue', value: 3 },
          ],
        },
      },
      {
        label: 'Fill it, then free a slot',
        value: {
          ops: [
            { op: 'enqueue', value: 5 },
            { op: 'enqueue', value: 1 },
            { op: 'enqueue', value: 8 },
            { op: 'enqueue', value: 2 },
            { op: 'enqueue', value: 6 },
            { op: 'enqueue', value: 3 },
            { op: 'enqueue', value: 9 },
            { op: 'dequeue' },
            { op: 'enqueue', value: 9 },
            { op: 'dequeue' },
          ],
        },
      },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const count = randInt(rand, 5, LIMITS.maxN)
      const enqueueChance = 0.45 + rand() * 0.4 // 0.45..0.85, so some lines fill up and some run dry
      const ops: QueueOp[] = []
      for (let i = 0; i < count; i++) {
        ops.push(rand() < enqueueChance ? { op: 'enqueue', value: randInt(rand, -20, 99) } : { op: 'dequeue' })
      }
      return { ops }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
