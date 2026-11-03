/**
 * Linked lists — traverse: walk the chain from the head, adding up every value.
 *
 * Same layout as the sliding-window pilot:
 *   1. input type, parsing and presets
 *   2. frame helpers (scene / narration / predicts)
 *   3. `run` — the real algorithm, recording one frame per idea
 *   4. `reference` — a boring implementation the tests compare against
 *
 * Node ids are `n0..nk` in list order and never change, so the renderer can
 * keep each node in place from frame to frame. The loop test (`while curr is
 * not None`) is shown once, on the frame where it stops the loop; every other
 * lap goes straight from "visit" to "advance".
 * Code lives in content/code/linked-lists/traverse.{py,java,cpp}.
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

export interface TraverseInput {
  values: number[]
}

const LIMITS: InputLimits = { maxN: 8, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<TraverseInput> {
  const text = (raw.values ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = text.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'values', error: 'Type at least one number, like 3, 5, 8, 2.' }
  }
  if (tokens.length > LIMITS.maxN) {
    return { ok: false, field: 'values', error: `Use at most ${LIMITS.maxN} numbers so the picture stays readable.` }
  }
  const values: number[] = []
  for (const token of tokens) {
    if (!INTEGER.test(token)) {
      return { ok: false, field: 'values', error: `"${token}" isn't a whole number. Use digits separated by commas.` }
    }
    const value = Number(token)
    if (value < LIMITS.min || value > LIMITS.max) {
      return { ok: false, field: 'values', error: `Keep every number between ${LIMITS.min} and ${LIMITS.max}.` }
    }
    values.push(value)
  }
  return { ok: true, value: { values } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const OFF_THE_END = 'Off the end (null)'
const BACK_TO_HEAD = 'Back to the head'

const idOf = (i: number): string => `n${i}`

/** Scene for the list with `curr` on node `at` (null = off the end). Nodes before `at` are visited. */
function listScene(values: number[], at: number | null, focus: boolean): LinkedListScene {
  const n = values.length
  const done = at === null ? n : at
  const marks: NonNullable<LinkedListScene['marks']> = []
  for (let i = 0; i < done; i++) marks.push({ id: idOf(i), role: 'visited' })
  if (focus && at !== null) marks.push({ id: idOf(at), role: 'focus' })
  return {
    kind: 'linked-list',
    nodes: values.map((value, i) => ({ id: idOf(i), value })),
    links: values.map((_, i) => ({ from: idOf(i), to: i + 1 < n ? idOf(i + 1) : null })),
    pointers: [
      { name: 'head', target: idOf(0), role: 'ptrA' },
      { name: 'curr', target: at === null ? null : idOf(at), role: 'ptrB' },
    ],
    marks,
  }
}

function nextNodePredict(values: number[], i: number): PredictCandidate {
  const last = i === values.length - 1
  if (last) {
    return {
      tag: 'next-node',
      kind: 'choice',
      prompt: `curr is on ${values[i]}, the last node. Where does curr go next?`,
      options: [OFF_THE_END, BACK_TO_HEAD],
      answer: OFF_THE_END,
      why: "The last node's next link is null, so curr walks off the end and the loop stops.",
      hint: 'Look at the arrow leaving the last node.',
    }
  }
  return {
    tag: 'next-node',
    kind: 'cell',
    prompt: `curr is on ${values[i]}. Click the node curr moves to next.`,
    answer: idOf(i + 1),
    why: `curr = curr.next follows the arrow out of ${values[i]}, and that arrow leads to ${values[i + 1]}.`,
    hint: 'Follow the arrow that leaves curr.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ values }: TraverseInput) {
  const rec = createRecorder<number>()
  const n = values.length

  // Working state — mirrors the variables in the code files.
  let total = 0

  const emit = (
    at: string,
    say: string,
    pos: number | null,
    visited: number,
    extra: { focus?: boolean; predict?: PredictCandidate; pointers?: boolean } = {},
  ): void => {
    const scene = listScene(values, pos, extra.focus ?? false)
    if (extra.pointers === false) scene.pointers = [{ name: 'head', target: idOf(0), role: 'ptrA' }]
    const vars: Record<string, Val> = { curr: pos === null ? null : values[pos], total }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: visited, max: n, label: 'Nodes visited' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit('init', `Start at the head: curr points at ${values[0]} and the total is 0.`, 0, 0)

  for (let i = 0; i < n && !rec.capped; i++) {
    total += values[i]
    emit('visit', `Visit ${values[i]}: add it to the total, which is now ${total}.`, i, i + 1, {
      focus: true,
      predict: nextNodePredict(values, i),
    })

    const lastNode = i === n - 1
    emit(
      'advance',
      lastNode
        ? `curr = curr.next: the last node's next is null, so curr falls off the end.`
        : `curr = curr.next: follow the arrow, and curr moves on to ${values[i + 1]}.`,
      lastNode ? null : i + 1,
      i + 1,
    )
  }

  emit('check', 'curr is null, so the loop stops. Every node was visited exactly once.', null, n)
  emit('done', `Done: all ${n} node${n === 1 ? '' : 's'} visited, and the total is ${total}.`, null, n, { pointers: false })

  return rec.done(total)
}

/** Independent version: no pointers, just add the array. */
function reference({ values }: TraverseInput): number {
  return values.reduce((a, b) => a + b, 0)
}

const tracer: Tracer<TraverseInput, number> = {
  id: 'linked-lists/traverse',
  title: 'Traverse',
  anchors: {
    init: 'Start curr at the head, total at 0',
    check: 'Stop when curr is null',
    visit: "Use curr's value (add it to the total)",
    advance: 'Follow the link: curr = curr.next',
    done: 'Return the total',
  },
  vars: [
    { name: 'curr', label: 'curr value', role: 'ptrB' },
    { name: 'total', role: 'value' },
  ],
  input: {
    fields: [
      {
        name: 'values',
        label: 'List values',
        kind: 'int-array',
        placeholder: 'e.g. 3, 5, 8, 2',
        help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}, from head to tail.`,
      },
    ],
    parse: parseInput,
    format: ({ values }) => ({ values: values.join(', ') }),
    presets: [
      { label: 'Classic: add up 4 nodes', value: { values: [3, 5, 8, 2] } },
      { label: 'Negatives mixed in', value: { values: [4, -2, 6, -1, 3] } },
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
