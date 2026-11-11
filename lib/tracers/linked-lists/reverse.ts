/**
 * Linked lists — reverse a list in place, one link at a time (LeetCode 206).
 *
 * The showpiece. Three pointers dance down the list:
 *   prev  the node behind curr (starts as null)
 *   curr  the node whose link we are turning around
 *   nxt   curr's old next, saved first so the rest of the list is not lost
 * Each lap is three frames: save (nxt), flip (curr.next = prev), advance (both
 * pointers slide one node on).
 *
 * Same layout as the sliding-window pilot:
 *   1. input type, parsing and presets
 *   2. frame helpers (scene / narration / predicts)
 *   3. `run` — the real algorithm, recording one frame per idea
 *   4. `reference` — a boring implementation the tests compare against
 *
 * Node ids are `n0..nk` in the ORIGINAL order and nodes keep their place in
 * the row while links flip (so the learner sees the arrows turn around). Only
 * the final frame re-lists the nodes in head-to-tail order. The loop test is
 * shown once, on the frame where `curr` is null and the loop stops.
 * Code lives in content/code/linked-lists/reverse.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  Frame,
  InputLimits,
  LinkedListScene,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface ReverseInput {
  values: number[]
}

const LIMITS: InputLimits = { maxN: 8, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<ReverseInput> {
  const text = (raw.values ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = text.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'values', error: 'Type at least one number, like 1, 2, 3, 4.' }
  }
  if (tokens.length > LIMITS.maxN) {
    return { ok: false, field: 'values', error: `Use at most ${LIMITS.maxN} numbers so the picture stays readable.` }
  }
  const values: number[] = []
  for (const token of tokens) {
    if (!INTEGER.test(token)) {
      return { ok: false, field: 'values', error: `"${token}" isn't a whole number. Use digits separated by commas.` }
    }
    const v = Number(token)
    if (v < LIMITS.min || v > LIMITS.max) {
      return { ok: false, field: 'values', error: `Keep every number between ${LIMITS.min} and ${LIMITS.max}.` }
    }
    values.push(v)
  }
  return { ok: true, value: { values } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const STILL_FORWARD = 'Still forward'
const YES = 'Yes'
const NO = 'No'

const idOf = (i: number): string => `n${i}`

/** Predict, attached to the save frame: where will curr.next point after the flip? */
function whereNextPointsPredict(values: number[], curr: number, prev: number | null): PredictCandidate {
  if (prev === null) {
    return {
      tag: 'where-does-curr-next-point',
      kind: 'choice',
      prompt: `curr is ${values[curr]}, the first node, and prev is null. After curr.next = prev, where does ${values[curr]} point?`,
      options: ['null', STILL_FORWARD],
      answer: 'null',
      why: `prev is null, so ${values[curr]} now points at null. It becomes the tail of the reversed list.`,
      hint: 'curr.next is set to whatever prev is.',
    }
  }
  return {
    tag: 'where-does-curr-next-point',
    kind: 'cell',
    prompt: `curr is ${values[curr]}. After curr.next = prev, click the node ${values[curr]} points at.`,
    answer: idOf(prev),
    why: `curr.next = prev turns the arrow around: ${values[curr]} now points back at ${values[prev]}, the node behind it.`,
    hint: 'The arrow no longer goes forward. It goes to prev.',
  }
}

function loopAgainPredict(nextCurr: number | null, n: number, values: number[]): PredictCandidate {
  const again = nextCurr !== null
  return {
    tag: 'loop-again',
    kind: 'choice',
    prompt: again
      ? `curr is now on ${values[nextCurr]}. Does the loop run again?`
      : 'curr is now null. Does the loop run again?',
    options: [YES, NO],
    answer: again ? YES : NO,
    why: again
      ? `curr is on a real node (${nextCurr + 1} of ${n}), so there is still a link to flip.`
      : 'curr is null, so we have walked off the end. Every link has been flipped.',
    hint: 'The loop runs while curr is not null.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ values }: ReverseInput) {
  const rec = createRecorder<number[]>()
  const n = values.length
  const reversed = values.slice().reverse()

  // Working state — mirrors the variables in the code files. `next[i]` is the
  // index node i points at right now (null = end of list).
  const next: Array<number | null> = values.map((_, i) => (i + 1 < n ? i + 1 : null))
  let prev: number | null = null
  let curr: number | null = 0
  let nxt: number | null | undefined = undefined // undefined = not saved yet
  let flipped = 0

  const idOrNull = (i: number | null): string | null => (i === null ? null : idOf(i))
  const valueOf = (i: number | null | undefined): Val => (i === null || i === undefined ? null : values[i])
  const nodes = (): LinkedListScene['nodes'] => values.map((v, i) => ({ id: idOf(i), value: v }))
  const links = (changed?: number): LinkedListScene['links'] =>
    next.map((to, i) => ({
      from: idOf(i),
      to: idOrNull(to),
      ...(i === changed ? { role: 'changed' as const } : {}),
    }))
  /** Nodes already turned around: everything from prev back to the original head. */
  const reversedMarks = (): NonNullable<LinkedListScene['marks']> =>
    Array.from({ length: flipped }, (_, i) => ({ id: idOf(i), role: 'visited' as const }))

  const emit = (
    at: string,
    say: string,
    scene: Partial<LinkedListScene> = {},
    predict?: PredictCandidate,
  ): void => {
    const pointers: NonNullable<LinkedListScene['pointers']> = [
      { name: 'prev', target: idOrNull(prev), role: 'ptrA' },
      { name: 'curr', target: idOrNull(curr), role: 'ptrB' },
    ]
    if (nxt !== undefined) pointers.push({ name: 'nxt', target: idOrNull(nxt), role: 'focus' })
    const full: LinkedListScene = {
      kind: 'linked-list',
      nodes: nodes(),
      links: links(),
      pointers,
      marks: reversedMarks(),
      ...scene,
    }
    const vars: Record<string, Val> = { prev: valueOf(prev), curr: valueOf(curr), nxt: valueOf(nxt) }
    const frame: Frame = {
      scene: full,
      vars,
      say,
      at,
      gauge: { value: flipped, max: n, label: 'Links flipped' },
    }
    if (predict) frame.predict = predict
    rec.frame(frame)
  }

  emit(
    'init',
    `prev starts as null: nothing is behind us yet. curr starts at the head, ${values[0]}. We'll turn every arrow around.`,
  )

  while (curr !== null && !rec.capped) {
    const c: number = curr
    const old: number | null = next[c] // curr's old next

    // save: nxt = curr.next
    nxt = old
    emit(
      'save',
      old === null
        ? `nxt = curr.next: it is null, because ${values[c]} is the last node. Nothing is left to lose.`
        : `nxt = curr.next: nxt marks ${values[old]}, so flipping this link won't lose the rest of the list.`,
      { marks: [...reversedMarks(), { id: idOf(c), role: 'focus' }] },
      whereNextPointsPredict(values, c, prev),
    )

    // flip: curr.next = prev
    next[c] = prev
    flipped++
    emit(
      'flip',
      prev === null
        ? `curr.next = prev: ${values[c]} now points at null. It becomes the end of the reversed list.`
        : old === null
          ? `curr.next = prev: ${values[c]} now points back at ${values[prev]}. Its old arrow went to null.`
          : `curr.next = prev: ${values[c]} now points back at ${values[prev]}, not forward at ${values[old]}.`,
      {
        links: links(c),
        marks: [...reversedMarks().slice(0, -1), { id: idOf(c), role: 'changed' }],
        annotations: [{ target: `node:${idOf(c)}`, text: prev === null ? 'now ends the list' : 'now points back' }],
      },
    )

    // advance: prev = curr; curr = nxt
    prev = c
    curr = old
    emit(
      'advance',
      old === null
        ? `prev = curr, curr = nxt: prev lands on ${values[c]} and curr becomes null, off the end.`
        : `prev = curr, curr = nxt: prev slides onto ${values[c]} and curr jumps to ${values[old]}.`,
      {},
      loopAgainPredict(old, n, values),
    )
  }

  // while curr is not None: curr is null, so the loop stops.
  nxt = undefined
  emit('check', 'curr is null, so the loop stops. Every arrow now points the other way.')

  // return prev — list the nodes head-to-tail so the answer reads left to right.
  const order: number[] = []
  for (let at: number | null = prev; at !== null; at = next[at]) order.push(at)
  curr = null
  emit(
    'done',
    `Done: prev is the new head, ${values[prev ?? 0]}. The list now reads ${reversed.join(' → ')}.`,
    {
      nodes: order.map((i) => ({ id: idOf(i), value: values[i] })),
      links: order.map((i) => ({ from: idOf(i), to: idOrNull(next[i]) })),
      pointers: [{ name: 'head', target: idOrNull(prev), role: 'ptrA' }],
      marks: order.map((i) => ({ id: idOf(i), role: 'found' as const })),
    },
  )

  return rec.done(order.map((i) => values[i]))
}

/** Independent version: reverse a copy of the array. */
function reference({ values }: ReverseInput): number[] {
  return values.slice().reverse()
}

const tracer: Tracer<ReverseInput, number[]> = {
  id: 'linked-lists/reverse',
  title: 'Reverse',
  anchors: {
    init: 'Start with prev = null and curr = head',
    check: 'Stop when curr is null',
    save: 'Save the way on: nxt = curr.next',
    flip: 'Turn the arrow around: curr.next = prev',
    advance: 'Slide forward: prev = curr, curr = nxt',
    done: 'Return prev (the new head)',
  },
  vars: [
    { name: 'prev', label: 'prev value', role: 'ptrA' },
    { name: 'curr', label: 'curr value', role: 'ptrB' },
    { name: 'nxt', label: 'nxt value', role: 'focus' },
  ],
  input: {
    fields: [
      {
        name: 'values',
        label: 'List values',
        kind: 'int-array',
        placeholder: 'e.g. 1, 2, 3, 4',
        help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}, from head to tail.`,
      },
    ],
    parse: parseInput,
    format: ({ values }) => ({ values: values.join(', ') }),
    presets: [
      { label: 'Classic: reverse 1, 2, 3, 4', value: { values: [1, 2, 3, 4] } },
      { label: 'Just two nodes', value: { values: [5, 9] } },
      { label: 'A list of one', value: { values: [7] } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 2, 8)
      return { values: Array.from({ length: len }, () => randInt(rand, -9, 30)) }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
