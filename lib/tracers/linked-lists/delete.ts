/**
 * Linked lists — delete the first node holding a value, using a dummy node.
 *
 * Same layout as the sliding-window pilot:
 *   1. input type, parsing and presets
 *   2. frame helpers (scene / narration / predicts)
 *   3. `run` — the real algorithm, recording one frame per idea
 *   4. `reference` — a boring implementation the tests compare against
 *
 * Node ids are `n0..nk` in list order plus `dummy`, which sits before the
 * head and holds no data. `prev` trails one node behind `curr`; the bypass
 * (`prev.next = curr.next`) lifts the removed node out of the row (it becomes
 * `floating` and `discarded`) and the final frame drops it. Because the dummy
 * is always there, deleting the head is the same move as deleting any other node.
 * Code lives in content/code/linked-lists/delete.{py,java,cpp}.
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

export interface DeleteInput {
  values: number[]
  /** Delete the first node holding this value. */
  target: number
}

// The dummy node takes one slot, so 7 values keep the row at 8 or fewer.
const LIMITS: InputLimits = { maxN: 7, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<DeleteInput> {
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

  const targetText = (raw.target ?? '').replace(/[−–]/g, '-').trim()
  if (targetText === '') return { ok: false, field: 'target', error: 'Type the value to delete, like 30.' }
  if (!INTEGER.test(targetText)) {
    return { ok: false, field: 'target', error: `The value to delete must be a whole number, not "${targetText}".` }
  }
  const target = Number(targetText)
  if (target < LIMITS.min || target > LIMITS.max) {
    return { ok: false, field: 'target', error: `Keep the value between ${LIMITS.min} and ${LIMITS.max}.` }
  }
  return { ok: true, value: { values, target } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const ONLY_CURR = 'Only curr moves'
const BOTH_MOVE = 'prev and curr both move'

const DUMMY = 'dummy'
const idOf = (i: number): string => (i < 0 ? DUMMY : `n${i}`)

function prevTrailsPredict(value: number, target: number): PredictCandidate {
  return {
    tag: 'prev-trails',
    kind: 'choice',
    prompt: `curr is ${value}, not ${target}. What moves next?`,
    options: [ONLY_CURR, BOTH_MOVE],
    answer: BOTH_MOVE,
    why: 'prev has to stay right behind curr, so it steps onto the node curr is leaving.',
    hint: 'We will need the node just before the one we delete.',
  }
}

function wherePrevPointsPredict(values: number[], currIdx: number): PredictCandidate {
  const nextIdx = currIdx + 1
  if (nextIdx < values.length) {
    return {
      tag: 'where-prev-points',
      kind: 'cell',
      prompt: `We're deleting ${values[currIdx]}. After the bypass, which node should prev.next point to? Click it.`,
      answer: idOf(nextIdx),
      why: `prev.next = curr.next skips over ${values[currIdx]} and lands on the node after it, ${values[nextIdx]}.`,
      hint: 'Skip over the node being deleted.',
    }
  }
  return {
    tag: 'where-prev-points',
    kind: 'choice',
    prompt: `We're deleting ${values[currIdx]}, the last node. After the bypass, where does prev.next point?`,
    options: ['null', `Still ${values[currIdx]}`],
    answer: 'null',
    why: `curr.next is null, so prev.next = curr.next makes prev the new last node.`,
    hint: 'Copy whatever the deleted node was pointing at.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ values, target }: DeleteInput) {
  const rec = createRecorder<number[]>()
  const n = values.length
  const found = values.indexOf(target)
  const result = found < 0 ? values.slice() : [...values.slice(0, found), ...values.slice(found + 1)]

  // Working state — mirrors the variables in the code files (-1 = the dummy).
  let prev = -1
  let curr = 0

  const prevLabel = (): string => (prev < 0 ? 'the dummy' : String(values[prev]))
  const valueAt = (i: number): string => (i < n ? String(values[i]) : 'null')

  /** Row of node ids left to right, minus any removed index. */
  const rowIds = (skip: number): string[] => {
    const ids = [DUMMY]
    for (let i = 0; i < n; i++) if (i !== skip) ids.push(idOf(i))
    return ids
  }
  const nodesOf = (ids: string[]): LinkedListScene['nodes'] =>
    ids.map((id) => ({ id, value: id === DUMMY ? 'D' : values[Number(id.slice(1))] }))
  const chainOf = (ids: string[]): LinkedListScene['links'] =>
    ids.map((id, i) => ({ from: id, to: i + 1 < ids.length ? ids[i + 1] : null }))
  const passed = (): NonNullable<LinkedListScene['marks']> =>
    Array.from({ length: curr }, (_, i) => ({ id: idOf(i), role: 'visited' as const }))

  const emit = (
    at: string,
    say: string,
    scene: Partial<LinkedListScene> = {},
    predict?: PredictCandidate,
  ): void => {
    const ids = rowIds(-2)
    const full: LinkedListScene = {
      kind: 'linked-list',
      nodes: nodesOf(ids),
      links: chainOf(ids),
      pointers: [
        { name: 'prev', target: idOf(prev), role: 'ptrA' },
        { name: 'curr', target: curr < n ? idOf(curr) : null, role: 'ptrB' },
      ],
      ...scene,
    }
    const vars: Record<string, Val> = { prev: prev < 0 ? 'dummy' : values[prev], curr: curr < n ? values[curr] : null }
    const frame: Frame = { scene: full, vars, say, at }
    if (predict) frame.predict = predict
    rec.frame(frame)
  }

  emit(
    'init',
    `Put a dummy node in front of the head. prev starts on the dummy, curr on the head (${values[0]}). We delete ${target}.`,
    { annotations: [{ target: `node:${DUMMY}`, text: 'stand-in, holds no data' }] },
  )

  // `while curr is not None and curr.val != v`: every test is one frame.
  for (;;) {
    if (curr >= n) {
      emit('search', `curr ran off the end: ${target} isn't in this list, so there is nothing to delete.`, {
        marks: passed(),
      })
      break
    }
    if (values[curr] === target) {
      emit(
        'search',
        `curr is ${values[curr]}: that's the one to delete. prev is the node just before it (${prevLabel()}).`,
        { marks: [...passed(), { id: idOf(curr), role: 'found' }] },
        wherePrevPointsPredict(values, curr),
      )
      break
    }
    emit(
      'search',
      `curr is ${values[curr]}, not ${target}. Keep looking, with prev trailing one node behind.`,
      { marks: [...passed(), { id: idOf(curr), role: 'compare' }] },
      prevTrailsPredict(values[curr], target),
    )
    if (rec.capped) break

    const left = values[curr]
    prev = curr
    curr = curr + 1
    emit('advance', `prev steps onto ${left}, and curr steps on to ${valueAt(curr)}.`, { marks: passed() })
    if (rec.capped) break
  }

  if (found >= 0 && !rec.capped) {
    // The bypass: prev jumps over curr. The removed node is lifted out of the row.
    const ids = rowIds(found)
    const links = chainOf(ids).map((l) => (l.from === idOf(prev) ? { ...l, role: 'changed' as const } : l))
    links.push({ from: idOf(found), to: found + 1 < n ? idOf(found + 1) : null })
    const nextText = found + 1 < n ? `straight at ${values[found + 1]}, skipping ${values[found]}` : `at null, cutting ${values[found]} off the end`
    emit(
      'bypass',
      `prev.next = curr.next: ${prev < 0 ? 'The dummy' : values[prev]} now points ${nextText}.`,
      {
        nodes: nodesOf([...ids, idOf(found)]),
        links,
        floating: [idOf(found)],
        marks: [...passed(), { id: idOf(prev), role: 'changed' }, { id: idOf(found), role: 'discarded' }],
      },
    )
  }

  // return dummy.next — the removed node is gone from the picture.
  const ids = rowIds(found)
  const headId = ids.length > 1 ? ids[1] : null
  emit(
    'done',
    found < 0
      ? `Done: ${target} wasn't there, so the list is unchanged.`
      : result.length === 0
        ? `Done: ${target} was the only node, so the list is now empty.`
        : `Done: ${target} is gone. dummy.next is the head of ${result.join(' → ')}.`,
    {
      nodes: nodesOf(ids),
      links: chainOf(ids),
      pointers: [{ name: 'head', target: headId, role: 'ptrA' }],
      marks: [{ id: DUMMY, role: 'discarded' }],
    },
  )

  return rec.done(result)
}

/** Independent version: drop the first match from a copy of the array. */
function reference({ values, target }: DeleteInput): number[] {
  const out = values.slice()
  const at = out.indexOf(target)
  if (at >= 0) out.splice(at, 1)
  return out
}

const tracer: Tracer<DeleteInput, number[]> = {
  id: 'linked-lists/delete',
  title: 'Delete',
  anchors: {
    init: 'Add a dummy before the head; prev = dummy, curr = head',
    search: 'Stop when curr holds the value (or is null)',
    advance: 'Move both on: prev = curr, curr = curr.next',
    bypass: 'Skip the node: prev.next = curr.next',
    done: 'Return dummy.next',
  },
  vars: [
    { name: 'prev', label: 'prev value', role: 'ptrA' },
    { name: 'curr', label: 'curr value', role: 'ptrB' },
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
        name: 'target',
        label: 'Value to delete',
        kind: 'int',
        placeholder: 'e.g. 30',
        help: 'The first node holding this value is removed. If none does, the list stays as it is.',
      },
    ],
    parse: parseInput,
    format: ({ values, target }) => ({ values: values.join(', '), target: String(target) }),
    presets: [
      { label: 'Classic: delete from the middle', value: { values: [10, 20, 30, 40], target: 30 } },
      { label: 'Delete the head', value: { values: [5, 8, 3], target: 5 } },
      { label: 'Value not in the list', value: { values: [4, 6, 9], target: 7 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 2, 7)
      const values = Array.from({ length: len }, () => randInt(rand, -9, 30))
      // Mostly pick a value from the list; sometimes one that isn't there.
      const target = rand() < 0.8 ? values[randInt(rand, 0, len - 1)] : randInt(rand, -9, 30)
      return { values, target }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
