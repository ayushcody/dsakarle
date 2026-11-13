/**
 * Recursion — Fibonacci with a memo: never solve the same problem twice.
 *
 * fib(k) = fib(k - 1) + fib(k - 2), with fib(0) = 0 and fib(1) = 1. Plain
 * recursion re-solves the same smaller problems again and again. A memo (an
 * array indexed by k) remembers each answer the first time it is found:
 *   call     fib(k) is called
 *   base     k < 2 returns k at once (base cases are not stored)
 *   hit      fib(k) is already in the memo, so return it with no more calls
 *   compute  not in the memo: ask fib(k - 1) first, then fib(k - 2)
 *   store    both answers are back: save memo[k] = a + b and return it
 * With the memo, fib(n) makes exactly 2n - 1 calls (n >= 1); plain recursion
 * makes 2 × fib(n + 1) - 1. The gauge shows calls made against that plain count.
 *
 * Scenes are a composite column: the call tree (CallTreeScene) over the memo
 * (ArrayScene, one slot per k from 0 to n, empty until stored). A call that
 * answered from the memo ends with `(memo)` in its result and is marked found.
 * Only ~8 distinct inputs exist (n = 1..8), so `space` is set to 8.
 * Code lives in content/code/recursion/fib-memo.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  ArrayScene,
  CallFrameNode,
  Frame,
  InputLimits,
  MarkRole,
  ParseResult,
  PredictCandidate,
  Scene,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface FibMemoInput {
  n: number
}

const MIN_N = 1
const MAX_N = 8
const LIMITS: InputLimits = { maxN: MAX_N, min: MIN_N, max: MAX_N }

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<FibMemoInput> {
  const text = (raw.n ?? '').replace(/[−–]/g, '-').trim()
  if (text === '') {
    return { ok: false, field: 'n', error: `Type a whole number from ${MIN_N} to ${MAX_N}, like 5.` }
  }
  if (!INTEGER.test(text)) {
    return { ok: false, field: 'n', error: `"${text.slice(0, 12)}" isn't a whole number. Try something like 5.` }
  }
  const n = Number(text)
  if (n < MIN_N || n > MAX_N) {
    return { ok: false, field: 'n', error: `Keep n between ${MIN_N} and ${MAX_N} so the call tree stays readable.` }
  }
  return { ok: true, value: { n } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const YES = 'Yes, it is saved'
const NO = 'No, not yet'

/** Calls that plain recursion (no memo) makes for fib(k), counting fib(k) itself. */
function plainCalls(k: number): number {
  let a = 1 // calls for k = 0
  let b = 1 // calls for k = 1
  for (let i = 2; i <= k; i++) [a, b] = [b, a + b + 1]
  return k < 2 ? 1 : b
}

/** Predict on the call frame: is fib(k) already in the memo? */
function inMemoPredict(k: number, saved: boolean): PredictCandidate {
  return {
    tag: 'in-memo',
    kind: 'choice',
    prompt: `fib(${k}) was just called. Is fib(${k}) already in the memo?`,
    options: k % 2 === 0 ? [YES, NO] : [NO, YES],
    answer: saved ? YES : NO,
    why: saved
      ? `memo[${k}] was filled in earlier, so fib(${k}) answers at once instead of recursing again.`
      : `Nothing has stored memo[${k}] yet, so this call must work it out from fib(${k - 1}) and fib(${k - 2}).`,
    hint: `Look at slot ${k} in the memo. Is it empty?`,
  }
}

/** Predict on the frame before `store`: what will fib(k) save and return? */
function returnsPredict(k: number, a: number, b: number): PredictCandidate {
  const sum = a + b
  const options = [String(sum), String(sum + 1), String(sum - 1)]
  const shift = k % 3
  return {
    tag: 'fib-returns',
    kind: 'choice',
    prompt: `fib(${k - 1}) gave ${a} and fib(${k - 2}) gave ${b}. What does fib(${k}) save and return?`,
    options: options.map((_, i) => options[(i + shift) % options.length]),
    answer: String(sum),
    why: `fib(${k}) = fib(${k - 1}) + fib(${k - 2}) = ${a} + ${b} = ${sum}, and it goes into memo[${k}].`,
    hint: 'Add the two answers that came back.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ n: start }: FibMemoInput) {
  const rec = createRecorder<number>()
  const naive = plainCalls(start)

  interface Rec {
    id: string
    k: number
    parent: string | null
    done: boolean
    result?: number
    hit?: boolean
  }
  const calls: Rec[] = []
  const stack: string[] = []
  const memo: Array<number | null> = Array.from({ length: start + 1 }, () => null)
  let aVar: number | null = null
  let bVar: number | null = null
  let resultVar: number | null = null

  const callNodes = (): CallFrameNode[] =>
    calls.map((c) => {
      const status: CallFrameNode['status'] = c.done ? 'returned' : stack[stack.length - 1] === c.id ? 'active' : 'pending'
      const node: CallFrameNode = { id: c.id, label: `fib(${c.k})`, parent: c.parent, status }
      if (c.done && c.result !== undefined) node.result = c.hit ? `= ${c.result} (memo)` : `= ${c.result}`
      return node
    })

  const emit = (
    at: string,
    say: string,
    kVar: number,
    opts: {
      marks?: Array<{ id: string; role: MarkRole }>
      memoMarks?: Array<{ index: number; role: MarkRole }>
      predict?: PredictCandidate
    } = {},
  ): void => {
    const topId = stack[stack.length - 1]
    const top = calls.find((c) => c.id === topId)
    const memoScene: ArrayScene = {
      kind: 'array',
      label: 'memo',
      cells: memo.slice(),
      ...(top ? { pointers: [{ name: 'k', index: top.k, role: 'ptrB' as const }] } : {}),
      ...(opts.memoMarks ? { marks: opts.memoMarks } : {}),
    }
    const scene: Scene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { scene: { kind: 'call-tree', calls: callNodes(), stack: stack.slice(), ...(opts.marks ? { marks: opts.marks } : {}) } },
        { scene: memoScene },
      ],
    }
    const vars: Record<string, Val> = { k: kVar, a: aVar, b: bVar, result: resultVar }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: calls.length, max: naive, label: `Calls made (plain recursion: ${naive})` },
    }
    if (opts.predict) frame.predict = opts.predict
    rec.frame(frame)
  }

  const fib = (k: number, parent: string | null): number => {
    const id = `c${calls.length}`
    const me: Rec = { id, k, parent, done: false }
    calls.push(me)
    stack.push(id)
    aVar = null
    bVar = null
    resultVar = null
    const saved = k >= 2 && memo[k] !== null
    emit(
      'call',
      parent === null
        ? `fib(${k}) is called with an empty memo.`
        : `fib(${k}) is called. That is call number ${calls.length}, and the stack is ${stack.length} deep.`,
      k,
      k >= 2 ? { predict: inMemoPredict(k, saved) } : {},
    )

    // Base case: k < 2 returns k. Nothing is stored for it.
    if (k < 2) {
      me.done = true
      me.result = k
      stack.pop()
      resultVar = k
      emit(
        'base',
        parent === null
          ? `${k} < 2, so fib(${k}) = ${k} straight from the base case. One call, no memo needed.`
          : `${k} < 2 is the base case: fib(${k}) returns ${k} with no memo needed.`,
        k,
        { marks: [{ id, role: 'visited' }] },
      )
      return k
    }

    // Memo hit: answer from the saved value, no further calls.
    const cached = memo[k]
    if (cached !== null) {
      me.done = true
      me.hit = true
      me.result = cached
      stack.pop()
      resultVar = cached
      emit(
        'hit',
        `memo[${k}] holds ${cached}, so fib(${k}) returns it at once. Plain recursion would make ${plainCalls(k) - 1} more calls here.`,
        k,
        { marks: [{ id, role: 'found' }], memoMarks: [{ index: k, role: 'found' }] },
      )
      return cached
    }

    // Miss: ask for the two smaller answers, then store the sum.
    emit('compute', `memo[${k}] is empty, so fib(${k}) must ask fib(${k - 1}) first, then fib(${k - 2}).`, k)
    const a = fib(k - 1, id)
    aVar = a
    const b = fib(k - 2, id)
    bVar = b
    resultVar = null
    if (!rec.capped) rec.frames[rec.frames.length - 1].predict = returnsPredict(k, a, b)

    const sum = a + b
    memo[k] = sum
    me.done = true
    me.result = sum
    stack.pop()
    resultVar = sum
    emit(
      'store',
      parent === null
        ? `fib(${k}) = ${a} + ${b} = ${sum}, saved in memo[${k}]. That took ${calls.length} calls; plain recursion needs ${naive}.`
        : `fib(${k}) = ${a} + ${b} = ${sum}. Save it in memo[${k}] so nobody solves it again.`,
      k,
      { marks: [{ id, role: parent === null ? 'found' : 'changed' }], memoMarks: [{ index: k, role: 'changed' }] },
    )
    return sum
  }

  return rec.done(fib(start, null))
}

/** Independent version: an iterative loop. */
function reference({ n }: FibMemoInput): number {
  let prev = 0
  let curr = 1
  for (let i = 0; i < n; i++) [prev, curr] = [curr, prev + curr]
  return prev
}

const tracer: Tracer<FibMemoInput, number> = {
  id: 'recursion/fib-memo',
  title: 'Memoization',
  anchors: {
    call: 'Call fib(k), passing the shared memo',
    base: 'Base case: k < 2 returns k',
    hit: 'Memo hit: return the saved answer',
    compute: 'Miss: ask fib(k - 1), then fib(k - 2)',
    store: 'Save memo[k] = a + b and return it',
  },
  vars: [
    { name: 'k', label: 'k', role: 'ptrB' },
    { name: 'a', label: 'fib(k - 1)', role: 'value' },
    { name: 'b', label: 'fib(k - 2)', role: 'value' },
    { name: 'result', label: 'returns', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 'n',
        label: 'n',
        kind: 'int',
        placeholder: 'e.g. 5',
        help: `A whole number from ${MIN_N} to ${MAX_N}. Bigger n shows the memo saving more calls.`,
      },
    ],
    parse: parseInput,
    format: ({ n }) => ({ n: String(n) }),
    presets: [
      { label: 'fib(5): watch the memo save calls', value: { n: 5 } },
      { label: 'Small: fib(3)', value: { n: 3 } },
      { label: 'Biggest: fib(8)', value: { n: 8 } },
    ],
    random(seed) {
      return { n: randInt(mulberry32(seed), MIN_N, MAX_N) }
    },
    space: MAX_N - MIN_N + 1,
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
