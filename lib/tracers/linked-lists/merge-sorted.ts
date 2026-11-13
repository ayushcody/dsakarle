/**
 * Linked lists — merge two sorted lists with a dummy head (LeetCode 21).
 *
 * Two sorted lists, A and B, are stitched into one. A throwaway `dummy` node
 * means the merged list never has to be special-cased when it is empty, and a
 * `tail` pointer always sits on the last node of the merged list:
 *   a, b   the front of each list that has not been used yet
 *   tail   the end of the merged list so far (starts on dummy)
 * Each lap is three frames: compare the two fronts, attach the smaller one
 * (tail.next = it, and its list moves on), then slide tail onto it. When one
 * list runs out the loop stops (`stop`) and the other list's remaining nodes,
 * already sorted, are attached in one move (`leftover`). Ties go to A.
 *
 * Scenes are a composite column of three linked lists: List A, List B and the
 * Merged list (dummy first). Nodes taken from A or B are marked visited there
 * and appear in Merged as copies with ids m0..mk (the real code relinks the
 * same nodes; the picture keeps the sources visible so the learner can see
 * what is left). The final frame drops dummy and shows the answer.
 * Both lists must have 1 to 5 nodes, sorted non-decreasing.
 * Code lives in content/code/linked-lists/merge-sorted.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  Frame,
  InputLimits,
  LinkedListScene,
  MarkRole,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface MergeSortedInput {
  a: number[]
  b: number[]
}

const LIMITS: InputLimits = { maxN: 5, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/

function parseList(raw: Record<string, string>, field: 'a' | 'b'): ParseResult<number[]> {
  const name = field === 'a' ? 'List A' : 'List B'
  const text = (raw[field] ?? '')
    .replace(/[−–]/g, '-')
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = text.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field, error: `${name} needs at least one number, like 1, 3, 5.` }
  }
  if (tokens.length > LIMITS.maxN) {
    return { ok: false, field, error: `Use at most ${LIMITS.maxN} numbers in ${name} so the picture stays readable.` }
  }
  const values: number[] = []
  for (const token of tokens) {
    if (!INTEGER.test(token)) {
      return { ok: false, field, error: `"${token.slice(0, 12)}" isn't a whole number. Use digits separated by commas.` }
    }
    const v = Number(token)
    if (v < LIMITS.min || v > LIMITS.max) {
      return { ok: false, field, error: `Keep every number in ${name} between ${LIMITS.min} and ${LIMITS.max}.` }
    }
    values.push(v)
  }
  for (let i = 1; i < values.length; i++) {
    if (values[i] < values[i - 1]) {
      return { ok: false, field, error: `${name} must be sorted from smallest to largest, but ${values[i]} comes after ${values[i - 1]}.` }
    }
  }
  return { ok: true, value: values }
}

function parseInput(raw: Record<string, string>): ParseResult<MergeSortedInput> {
  const a = parseList(raw, 'a')
  if (!a.ok) return a
  const b = parseList(raw, 'b')
  if (!b.ok) return b
  return { ok: true, value: { a: a.value, b: b.value } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const FROM_A = 'From list A'
const FROM_B = 'From list B'

/** Predict on the compare frame: which front node is attached next? */
function whichNextPredict(x: number, y: number): PredictCandidate {
  const fromA = x <= y
  return {
    tag: 'which-next',
    kind: 'choice',
    prompt: `a is on ${x} and b is on ${y}. Which node goes next: from A or from B?`,
    options: [FROM_A, FROM_B],
    answer: fromA ? FROM_A : FROM_B,
    why: fromA
      ? x === y
        ? `${x} and ${y} tie, and the rule is <=, so A's node goes first.`
        : `${x} is smaller than ${y}, and both lists are sorted, so ${x} is the smallest node left.`
      : `${y} is smaller than ${x}, and both lists are sorted, so ${y} is the smallest node left.`,
    hint: 'Both lists are sorted, so the smallest node left is at the front of one of them.',
  }
}

/** Predict on the stop frame: which list still has nodes to attach? */
function leftoverPredict(aLeft: number, bLeft: number): PredictCandidate {
  const fromA = aLeft > 0
  return {
    tag: 'leftover-list',
    kind: 'choice',
    prompt: 'The loop has stopped. Which list still has nodes, and gets attached to tail?',
    options: [FROM_A, FROM_B],
    answer: fromA ? FROM_A : FROM_B,
    why: fromA
      ? `List B is used up, so A's last ${aLeft} node${aLeft === 1 ? '' : 's'} are already in order and hang on tail as they are.`
      : `List A is used up, so B's last ${bLeft} node${bLeft === 1 ? '' : 's'} are already in order and hang on tail as they are.`,
    hint: 'The loop stops as soon as either list is null. The other one is not.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

const arrow = (values: number[]): string => values.join(' → ')

function run({ a: A, b: B }: MergeSortedInput) {
  const rec = createRecorder<number[]>()
  const la = A.length
  const lb = B.length
  const total = la + lb

  // Working state, mirroring the variables in the code files.
  let pa = 0 // index of node a in A; la means null
  let pb = 0
  const merged: number[] = [] // values attached after dummy, head to tail
  let tailAt = -1 // -1 = dummy, otherwise an index into merged
  let showDummy = true
  let headPointer = false // final frame: a `head` pointer replaces `tail`

  const idA = (i: number): string => `a${i}`
  const idB = (i: number): string => `b${i}`
  const idM = (i: number): string => `m${i}`
  const sourceNodes = (values: number[], id: (i: number) => string): LinkedListScene['nodes'] =>
    values.map((v, i) => ({ id: id(i), value: v }))
  const sourceLinks = (values: number[], id: (i: number) => string): LinkedListScene['links'] =>
    values.map((_, i) => ({ from: id(i), to: i + 1 < values.length ? id(i + 1) : null }))
  const pick = (values: number[], at: number): number | null => (at < values.length ? values[at] : null)

  const emit = (
    at: string,
    say: string,
    opts: {
      marksA?: Array<{ id: string; role: MarkRole }>
      marksB?: Array<{ id: string; role: MarkRole }>
      marksM?: Array<{ id: string; role: MarkRole }>
      changedLink?: boolean
      predict?: PredictCandidate
    } = {},
  ): void => {
    const usedA: Array<{ id: string; role: MarkRole }> = Array.from({ length: pa }, (_, i) => ({ id: idA(i), role: 'visited' as const }))
    const usedB: Array<{ id: string; role: MarkRole }> = Array.from({ length: pb }, (_, i) => ({ id: idB(i), role: 'visited' as const }))

    const mNodes: LinkedListScene['nodes'] = []
    const mLinks: LinkedListScene['links'] = []
    const chain: string[] = []
    if (showDummy) {
      mNodes.push({ id: 'd', value: 'dummy' })
      chain.push('d')
    }
    merged.forEach((v, i) => {
      mNodes.push({ id: idM(i), value: v })
      chain.push(idM(i))
    })
    const tailId = tailAt < 0 ? 'd' : idM(tailAt)
    chain.forEach((id, i) => {
      mLinks.push({
        from: id,
        to: i + 1 < chain.length ? chain[i + 1] : null,
        // The link out of tail is the one tail.next = ... just set.
        ...(opts.changedLink && id === tailId ? { role: 'changed' as const } : {}),
      })
    })

    const mPointers: NonNullable<LinkedListScene['pointers']> = headPointer
      ? [{ name: 'head', target: merged.length > 0 ? idM(0) : null, role: 'ptrA' }]
      : [{ name: 'tail', target: tailId, role: 'focus' }]

    const listA: LinkedListScene = {
      kind: 'linked-list',
      nodes: sourceNodes(A, idA),
      links: sourceLinks(A, idA),
      pointers: [{ name: 'a', target: pa < la ? idA(pa) : null, role: 'ptrA' }],
      marks: [...usedA, ...(opts.marksA ?? [])],
    }
    const listB: LinkedListScene = {
      kind: 'linked-list',
      nodes: sourceNodes(B, idB),
      links: sourceLinks(B, idB),
      pointers: [{ name: 'b', target: pb < lb ? idB(pb) : null, role: 'ptrB' }],
      marks: [...usedB, ...(opts.marksB ?? [])],
    }
    const listM: LinkedListScene = {
      kind: 'linked-list',
      nodes: mNodes,
      links: mLinks,
      pointers: mPointers,
      ...(opts.marksM ? { marks: opts.marksM } : {}),
    }

    const vars: Record<string, Val> = {
      a: pick(A, pa),
      b: pick(B, pb),
      tail: tailAt < 0 ? 'dummy' : merged[tailAt],
    }
    const frame: Frame = {
      scene: {
        kind: 'composite',
        layout: 'column',
        parts: [
          { title: 'List A', scene: listA },
          { title: 'List B', scene: listB },
          { title: 'Merged', scene: listM },
        ],
      },
      vars,
      say,
      at,
      gauge: { value: merged.length, max: total, label: 'Nodes merged' },
    }
    if (opts.predict) frame.predict = opts.predict
    rec.frame(frame)
  }

  emit(
    'init',
    `Make a dummy node and put tail on it. a starts at ${A[0]}, b at ${B[0]}. The merged list will grow after tail.`,
  )

  while (pa < la && pb < lb && !rec.capped) {
    const x = A[pa]
    const y = B[pb]
    const fromA = x <= y

    emit(
      'compare',
      x === y
        ? `a = ${x} and b = ${y} tie. Ties go to A (the test is <=), so A's node goes next.`
        : `Compare a = ${x} with b = ${y}. ${fromA ? x : y} is smaller, so the node from ${fromA ? 'A' : 'B'} goes next.`,
      {
        marksA: [{ id: idA(pa), role: 'compare' }],
        marksB: [{ id: idB(pb), role: 'compare' }],
        predict: whichNextPredict(x, y),
      },
    )

    // attach: tail.next = a (or b); that list moves on
    const taken = fromA ? x : y
    const takenId = fromA ? idA(pa) : idB(pb)
    merged.push(taken)
    if (fromA) pa++
    else pb++
    const rest = fromA ? pick(A, pa) : pick(B, pb)
    emit(
      'attach',
      `tail.next = ${fromA ? 'a' : 'b'}: ${taken} joins the merged list. ${fromA ? 'a' : 'b'} moves on to ${rest === null ? 'null' : rest}.`,
      {
        marksA: fromA ? [{ id: takenId, role: 'changed' }] : [],
        marksB: fromA ? [] : [{ id: takenId, role: 'changed' }],
        marksM: [{ id: idM(merged.length - 1), role: 'changed' }],
        changedLink: true,
      },
    )

    // advance: tail = tail.next
    tailAt = merged.length - 1
    emit('advance', `tail = tail.next: tail slides onto ${taken}, the newest node. Merged so far: ${arrow(merged)}.`, {
      marksM: [{ id: idM(tailAt), role: 'focus' }],
    })
  }

  // while a and b are both not null: one of them is null, so the loop stops.
  const aLeft = la - pa
  const bLeft = lb - pb
  emit(
    'stop',
    aLeft === 0 ? 'a is null: list A is used up, so the loop stops.' : 'b is null: list B is used up, so the loop stops.',
    { predict: leftoverPredict(aLeft, bLeft) },
  )

  // leftover: tail.next = a if a else b — the rest is already sorted.
  const restOf = aLeft > 0 ? A.slice(pa) : B.slice(pb)
  const restFrom = aLeft > 0 ? 'A' : 'B'
  const start = merged.length
  for (const v of restOf) merged.push(v)
  const leftoverMarks = restOf.map((_, i) => ({ id: idM(start + i), role: 'found' as const }))
  const usedRest = restOf.map((_, i) => ({ id: aLeft > 0 ? idA(pa + i) : idB(pb + i), role: 'visited' as const }))
  emit(
    'leftover',
    `tail.next = the rest of ${restFrom}: ${arrow(restOf)} is already sorted, so it hangs on in one move.`,
    {
      marksA: aLeft > 0 ? usedRest : [],
      marksB: aLeft > 0 ? [] : usedRest,
      marksM: leftoverMarks,
      changedLink: true,
    },
  )
  if (aLeft > 0) pa = la
  else pb = lb

  // return dummy.next — the dummy node is dropped from the picture.
  showDummy = false
  headPointer = true
  emit('done', `Return dummy.next: the merged list reads ${arrow(merged)}.`, {
    marksM: merged.map((_, i) => ({ id: idM(i), role: 'found' as const })),
  })

  return rec.done(merged.slice())
}

/** Independent version: concatenate and sort numerically. */
function reference({ a, b }: MergeSortedInput): number[] {
  return [...a, ...b].sort((x, y) => x - y)
}

const tracer: Tracer<MergeSortedInput, number[]> = {
  id: 'linked-lists/merge-sorted',
  title: 'Merge two sorted lists',
  anchors: {
    init: 'Start with a dummy node and tail = dummy',
    compare: 'Compare the fronts: a.val <= b.val?',
    attach: 'Attach the smaller node: tail.next = it',
    advance: 'Slide forward: tail = tail.next',
    stop: 'Stop when either list is null',
    leftover: 'Attach the leftover list in one move',
    done: 'Return dummy.next',
  },
  vars: [
    { name: 'a', label: 'a value', role: 'ptrA' },
    { name: 'b', label: 'b value', role: 'ptrB' },
    { name: 'tail', label: 'tail value', role: 'focus' },
  ],
  input: {
    fields: [
      {
        name: 'a',
        label: 'List A',
        kind: 'int-array',
        placeholder: 'e.g. 1, 3, 5',
        help: `1 to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}, sorted from smallest to largest.`,
      },
      {
        name: 'b',
        label: 'List B',
        kind: 'int-array',
        placeholder: 'e.g. 2, 4, 6',
        help: `1 to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}, sorted from smallest to largest.`,
      },
    ],
    parse: parseInput,
    format: ({ a, b }) => ({ a: a.join(', '), b: b.join(', ') }),
    presets: [
      { label: 'Interleaved: 1, 3, 5 and 2, 4, 6', value: { a: [1, 3, 5], b: [2, 4, 6] } },
      { label: 'With ties: 1, 2, 4 and 1, 3, 4', value: { a: [1, 2, 4], b: [1, 3, 4] } },
      { label: 'One list runs out early', value: { a: [1, 2, 3, 4], b: [7, 8] } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const make = (): number[] =>
        Array.from({ length: randInt(rand, 1, LIMITS.maxN) }, () => randInt(rand, -5, 30)).sort((x, y) => x - y)
      const a = make()
      const b = make()
      return { a, b }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
