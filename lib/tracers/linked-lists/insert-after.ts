/**
 * Linked lists — insert a new node after the node at position p.
 *
 * Same layout as the sliding-window pilot:
 *   1. input type, parsing and presets
 *   2. frame helpers (scene / narration / predicts)
 *   3. `run` — the real algorithm, recording one frame per idea
 *   4. `reference` — a boring implementation the tests compare against
 *
 * Node ids are `n0..nk` in list order; the new node is `n<length>`. It is
 * listed in `nodes` right after `curr` (where it will end up) but also in
 * `floating`, so it is drawn below the row until the final frame, when it
 * joins the row. The order of the two link writes is the whole lesson:
 * `node.next = curr.next` first, so the rest of the list is never lost.
 * Code lives in content/code/linked-lists/insert-after.{py,java,cpp}.
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

export interface InsertAfterInput {
  values: number[]
  /** Insert after the node at this position; 0 is the head. */
  pos: number
  /** Value of the new node. */
  value: number
}

// One node is added, so 7 in keeps the finished list at 8 or fewer.
const LIMITS: InputLimits = { maxN: 7, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<InsertAfterInput> {
  const text = (raw.values ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = text.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'values', error: 'Type at least one number, like 10, 20, 30, 40.' }
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

  const posText = (raw.pos ?? '').replace(/[−–]/g, '-').trim()
  if (posText === '') return { ok: false, field: 'pos', error: 'Type a position, like 1. Position 0 is the head.' }
  if (!INTEGER.test(posText)) return { ok: false, field: 'pos', error: `The position must be a whole number, not "${posText}".` }
  const pos = Number(posText)
  if (pos < 0) return { ok: false, field: 'pos', error: 'The position can\'t be negative. Position 0 is the head.' }
  if (pos > values.length - 1) {
    return {
      ok: false,
      field: 'pos',
      error: `Your list has ${values.length} node${values.length === 1 ? '' : 's'}, so the last position is ${values.length - 1}.`,
    }
  }

  const valueText = (raw.value ?? '').replace(/[−–]/g, '-').trim()
  if (valueText === '') return { ok: false, field: 'value', error: 'Type the value for the new node, like 25.' }
  if (!INTEGER.test(valueText)) return { ok: false, field: 'value', error: `The new value must be a whole number, not "${valueText}".` }
  const value = Number(valueText)
  if (value < LIMITS.min || value > LIMITS.max) {
    return { ok: false, field: 'value', error: `Keep the new value between ${LIMITS.min} and ${LIMITS.max}.` }
  }
  return { ok: true, value: { values, pos, value } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const WALK_ON = 'Walk on'
const STOP_HERE = 'Stop here'
const LINK_NEW_FIRST = 'node.next = curr.next'
const LINK_CURR_FIRST = 'curr.next = node'

const idOf = (i: number): string => `n${i}`

function walkOrStopPredict(at: number, pos: number): PredictCandidate {
  const stop = at === pos
  return {
    tag: 'walk-or-stop',
    kind: 'choice',
    prompt: `curr is at position ${at}. We want to insert after position ${pos}. Walk on, or stop here?`,
    options: [WALK_ON, STOP_HERE],
    answer: stop ? STOP_HERE : WALK_ON,
    why: stop
      ? `Position ${at} is the node we insert after, so curr is exactly where it should be.`
      : `We're at position ${at} and need position ${pos}, so curr has to hop ${pos - at} more time${pos - at === 1 ? '' : 's'}.`,
    hint: 'Compare the position curr is on with the position we want.',
  }
}

function linkOrderPredict(): PredictCandidate {
  return {
    tag: 'link-order',
    kind: 'choice',
    prompt: 'The new node is ready but not linked in. Which link do we set first?',
    options: [LINK_NEW_FIRST, LINK_CURR_FIRST],
    answer: LINK_NEW_FIRST,
    why: "curr.next is the only thing pointing at the rest of the list. Overwrite it first and the rest is lost, so hook the new node onto it first.",
    hint: 'Which link holds the only way to the rest of the list?',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ values, pos, value }: InsertAfterInput) {
  const rec = createRecorder<number[]>()
  const n = values.length
  const newId = idOf(n)
  const result = [...values.slice(0, pos + 1), value, ...values.slice(pos + 1)]

  // Working state — mirrors the variables in the code files.
  let curr = 0
  let created = false

  const nextOfCurr = (): string | null => (curr + 1 < n ? idOf(curr + 1) : null)
  const nextValue = (): string => (curr + 1 < n ? String(values[curr + 1]) : 'null')

  /** Main-row nodes (the new one is placed after curr but floats until `joined`). */
  const baseNodes = (): LinkedListScene['nodes'] => {
    const out: LinkedListScene['nodes'] = []
    values.forEach((v, i) => {
      out.push({ id: idOf(i), value: v })
      if (i === pos && created) out.push({ id: newId, value })
    })
    return out
  }
  const chain = (): LinkedListScene['links'] =>
    values.map((_, i) => ({ from: idOf(i), to: i + 1 < n ? idOf(i + 1) : null }))

  const emit = (
    at: string,
    say: string,
    scene: Partial<LinkedListScene>,
    extra: { predict?: PredictCandidate; hops?: number } = {},
  ): void => {
    const full: LinkedListScene = {
      kind: 'linked-list',
      nodes: baseNodes(),
      links: chain(),
      pointers: [
        { name: 'head', target: idOf(0), role: 'ptrA' },
        { name: 'curr', target: idOf(curr), role: 'ptrB' },
      ],
      ...scene,
    }
    const vars: Record<string, Val> = { curr: values[curr], node: created ? value : null }
    const frame: Frame = { scene: full, vars, say, at }
    if (pos > 0) frame.gauge = { value: extra.hops ?? curr, max: pos, label: `Hops to position ${pos}` }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }
  const passed = (): NonNullable<LinkedListScene['marks']> =>
    Array.from({ length: curr }, (_, i) => ({ id: idOf(i), role: 'visited' as const }))

  emit(
    'init',
    pos === 0
      ? `Insert ${value} after position 0, the head. curr already sits where it needs to be.`
      : `Insert ${value} after position ${pos}. curr starts at the head and needs ${pos} hop${pos === 1 ? '' : 's'} to get there.`,
    {},
    { predict: walkOrStopPredict(0, pos) },
  )

  // `for _ in range(p)`: one frame per hop.
  for (let hop = 1; hop <= pos && !rec.capped; hop++) {
    curr = hop
    emit(
      'walk',
      `curr = curr.next: hop to position ${hop}, which holds ${values[hop]}.`,
      { marks: passed() },
      { predict: walkOrStopPredict(hop, pos) },
    )
  }

  created = true
  emit(
    'create',
    `Make a new node holding ${value}. It floats free for now: nothing points at it, and it points at nothing.`,
    {
      floating: [newId],
      links: chain().filter((l) => l.from !== newId),
      marks: [...passed(), { id: idOf(curr), role: 'focus' }, { id: newId, role: 'changed' }],
      annotations: [{ target: `node:${newId}`, text: 'not linked in yet' }],
    },
    { predict: linkOrderPredict() },
  )

  const nextId = nextOfCurr()
  emit(
    'link-new',
    nextId === null
      ? `node.next = curr.next: curr is the last node, so the new node points at null.`
      : `node.next = curr.next: the new node points at ${nextValue()} too, so the rest of the list is safe.`,
    {
      floating: [newId],
      links: [...chain(), { from: newId, to: nextId, role: 'changed' }],
      marks: [...passed(), { id: idOf(curr), role: 'focus' }, { id: newId, role: 'changed' }],
    },
  )

  const spliced: LinkedListScene['links'] = chain().map((l) => (l.from === idOf(curr) ? { from: l.from, to: newId, role: 'changed' as const } : l))
  emit(
    'link-curr',
    `curr.next = node: curr now points at the new node, which carries on to ${nextValue()}.`,
    {
      floating: [newId],
      links: [...spliced, { from: newId, to: nextId }],
      marks: [...passed(), { id: idOf(curr), role: 'focus' }, { id: newId, role: 'changed' }],
    },
  )

  // After the splice the row is the new list; ids stay with their nodes.
  const finalNodes = baseNodes()
  const finalIds = finalNodes.map((nd) => nd.id)
  emit(
    'done',
    `Done: ${value} now sits after position ${pos}. The list reads ${result.join(' → ')}.`,
    {
      nodes: finalNodes,
      links: finalIds.map((id, i) => ({ from: id, to: i + 1 < finalIds.length ? finalIds[i + 1] : null })),
      pointers: [{ name: 'head', target: idOf(0), role: 'ptrA' }],
      marks: [{ id: newId, role: 'found' }],
    },
  )

  return rec.done(result)
}

/** Independent version: splice into a copy of the array. */
function reference({ values, pos, value }: InsertAfterInput): number[] {
  const out = values.slice()
  out.splice(pos + 1, 0, value)
  return out
}

const tracer: Tracer<InsertAfterInput, number[]> = {
  id: 'linked-lists/insert-after',
  title: 'Insert',
  anchors: {
    init: 'Start curr at the head',
    walk: 'Walk curr forward to the insert position',
    create: 'Make the new node',
    'link-new': 'Point the new node at curr.next',
    'link-curr': 'Point curr at the new node',
    done: 'Return the head',
  },
  vars: [
    { name: 'curr', label: 'curr value', role: 'ptrB' },
    { name: 'node', label: 'new node', role: 'value' },
  ],
  input: {
    fields: [
      {
        name: 'values',
        label: 'List values',
        kind: 'int-array',
        placeholder: 'e.g. 10, 20, 30, 40',
        help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}, from head to tail.`,
      },
      {
        name: 'pos',
        label: 'Insert after position',
        kind: 'int',
        placeholder: 'e.g. 1',
        help: 'Position 0 is the head. Between 0 and the last position.',
      },
      {
        name: 'value',
        label: 'New value',
        kind: 'int',
        placeholder: 'e.g. 25',
        help: `The value of the new node, from ${LIMITS.min} to ${LIMITS.max}.`,
      },
    ],
    parse: parseInput,
    format: ({ values, pos, value }) => ({ values: values.join(', '), pos: String(pos), value: String(value) }),
    presets: [
      { label: 'Classic: insert in the middle', value: { values: [10, 20, 30, 40], pos: 1, value: 25 } },
      { label: 'Right after the head', value: { values: [10, 20, 30], pos: 0, value: 15 } },
      { label: 'After the last node', value: { values: [10, 20, 30], pos: 2, value: 40 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 2, 7)
      const values = Array.from({ length: len }, () => randInt(rand, -9, 30))
      return { values, pos: randInt(rand, 0, len - 1), value: randInt(rand, -9, 30) }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
