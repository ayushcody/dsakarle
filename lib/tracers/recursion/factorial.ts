/**
 * Recursion — factorial, one call at a time.
 *
 * fact(n) = n × fact(n - 1), with a base case that stops the recursion. With
 * stop = 1 (the default) this is the factorial: the base case is n <= 1. The
 * learner may also move `stop`: the base case n <= stop returns 1, so the
 * recursion multiplies only the numbers above `stop`. Moving the base case
 * makes the point that without one the stack never stops growing.
 * The tracer runs the real recursive function and records:
 *   call     a new call is pushed onto the stack
 *   check    is n <= 1 yet? (the base-case test)
 *   base     the base case returns 1, the stack starts to unwind
 *   combine  a waiting call gets its answer back and returns n × smaller
 *
 * Scenes are a CallTreeScene: a straight chain of calls plus the live stack.
 * Chips on the stack that are waiting are `pending`; only the top call is
 * `active`; finished calls are `returned` with their result.
 * Code lives in content/code/recursion/factorial.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  CallFrameNode,
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

export interface FactorialInput {
  n: number
  /** The base case is n <= stop. 1 gives the usual factorial. */
  stop: number
}

const LIMITS: InputLimits = { maxN: 6, min: 0, max: 6 }

const INTEGER = /^[+-]?\d+$/

function parseWhole(raw: Record<string, string>, field: 'n' | 'stop', example: string): ParseResult<number> {
  const text = (raw[field] ?? '').replace(/[−–]/g, '-').trim()
  if (text === '') {
    return { ok: false, field, error: `Type a whole number from ${LIMITS.min} to ${LIMITS.max}, like ${example}.` }
  }
  if (!INTEGER.test(text)) {
    return { ok: false, field, error: `"${text.slice(0, 12)}" isn't a whole number. Try something like ${example}.` }
  }
  const value = Number(text)
  if (value < LIMITS.min || value > LIMITS.max) {
    return { ok: false, field, error: `Keep ${field} between ${LIMITS.min} and ${LIMITS.max} so the stack stays readable.` }
  }
  return { ok: true, value }
}

function parseInput(raw: Record<string, string>): ParseResult<FactorialInput> {
  const n = parseWhole(raw, 'n', '4')
  if (!n.ok) return n
  const stop = parseWhole(raw, 'stop', '1')
  if (!stop.ok) return stop
  return { ok: true, value: { n: n.value, stop: stop.value } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const BASE_OPTION = 'Base case: return 1'
const RECURSE_OPTION = 'Recurse: call fact(n - 1)'

/** Predict on the call frame: does this call stop, or go deeper? */
function baseCaseYetPredict(n: number, stop: number): PredictCandidate {
  const isBase = n <= stop
  return {
    tag: 'base-case-yet',
    kind: 'choice',
    prompt: `fact(${n}) was just called. Is it the base case, or does it call itself again?`,
    options: n % 2 === 0 ? [BASE_OPTION, RECURSE_OPTION] : [RECURSE_OPTION, BASE_OPTION],
    answer: isBase ? BASE_OPTION : RECURSE_OPTION,
    why: isBase
      ? `n is ${n}, which is ${stop} or less, so the base case answers right away.`
      : `n is ${n}, bigger than ${stop}, so fact(${n}) needs fact(${n - 1}) first.`,
    hint: `The base case is the test n <= ${stop}.`,
  }
}

/** Predict: the waiting call at n gets `smaller` back. What does it return? */
function returnsPredict(n: number, smaller: number): PredictCandidate {
  const product = n * smaller
  const options = Array.from(new Set([String(product), String(n + smaller), String(smaller), String(product + 2)])).slice(0, 3)
  if (!options.includes(String(product))) options[0] = String(product)
  const shift = n % 3
  const rotated = options.map((_, i) => options[(i + shift) % options.length])
  return {
    tag: 'returns',
    kind: 'choice',
    prompt: `fact(${n - 1}) just gave ${smaller} back to fact(${n}). What does fact(${n}) return?`,
    options: rotated,
    answer: String(product),
    why: `fact(${n}) returns n × smaller = ${n} × ${smaller} = ${product}.`,
    hint: 'The recursive step multiplies n by the answer that came back.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ n: start, stop }: FactorialInput) {
  const rec = createRecorder<number>()

  interface Rec {
    id: string
    n: number
    parent: string | null
    done: boolean
    result?: number
  }
  const calls: Rec[] = []
  const stack: string[] = []
  let smallerVar: number | null = null
  let resultVar: number | null = null

  const sceneCalls = (): CallFrameNode[] =>
    calls.map((c) => {
      const onStack = stack.includes(c.id)
      const status: CallFrameNode['status'] = c.done ? 'returned' : onStack && stack[stack.length - 1] === c.id ? 'active' : 'pending'
      const node: CallFrameNode = { id: c.id, label: `fact(${c.n})`, parent: c.parent, status }
      if (c.done && c.result !== undefined) node.result = `= ${c.result}`
      return node
    })

  const emit = (
    at: string,
    say: string,
    nVar: number,
    opts: { marks?: Array<{ id: string; role: MarkRole }>; note?: { id: string; text: string }; predict?: PredictCandidate } = {},
  ): void => {
    const vars: Record<string, Val> = { n: nVar, smaller: smallerVar, result: resultVar }
    const frame: Frame = {
      scene: {
        kind: 'call-tree',
        calls: sceneCalls(),
        stack: stack.slice(),
        ...(opts.marks ? { marks: opts.marks } : {}),
        ...(opts.note ? { annotations: [{ target: `call:${opts.note.id}`, text: opts.note.text }] } : {}),
      },
      vars,
      say,
      at,
      gauge: { value: stack.length, max: start + 1, label: 'Stack depth' },
    }
    if (opts.predict) frame.predict = opts.predict
    rec.frame(frame)
  }

  const fact = (n: number, parent: string | null): number => {
    const id = `c${calls.length}`
    calls.push({ id, n, parent, done: false })
    stack.push(id)
    smallerVar = null
    resultVar = null
    emit(
      'call',
      parent === null
        ? `fact(${n}) is called. Its frame goes on the call stack.`
        : `fact(${n}) is called and pushed on top. The stack is now ${stack.length} deep.`,
      n,
      { predict: baseCaseYetPredict(n, stop) },
    )

    if (n <= stop) {
      emit('check', `n = ${n}, and ${n} <= ${stop} is true. This is the base case, so no more calls.`, n)
      const me = calls[calls.length - 1]
      me.done = true
      me.result = 1
      stack.pop()
      resultVar = 1
      emit('base', `The base case returns 1 without calling anyone. fact(${n}) is done and leaves the stack.`, n, {
        marks: [{ id, role: 'found' }],
        note: { id, text: 'base case' },
        predict: parent !== null ? returnsPredict(n + 1, 1) : undefined,
      })
      return 1
    }

    emit('check', `n = ${n}, and ${n} <= ${stop} is false. Not the base case, so ask fact(${n - 1}) for help.`, n)
    const smaller = fact(n - 1, id)
    const me = calls.find((c) => c.id === id)!
    smallerVar = smaller
    const out = n * smaller
    me.done = true
    me.result = out
    stack.pop()
    resultVar = out
    const outer = parent !== null
    emit(
      'combine',
      outer
        ? `fact(${n}) gets ${smaller} back, so it returns ${n} × ${smaller} = ${out}. The stack shrinks to ${stack.length}.`
        : `fact(${n}) gets ${smaller} back and returns ${n} × ${smaller} = ${out}. The stack is empty: that is the answer.`,
      n,
      {
        marks: outer ? [{ id, role: 'changed' }] : [{ id, role: 'found' }],
        predict: outer ? returnsPredict(n + 1, out) : undefined,
      },
    )
    return out
  }

  const answer = fact(start, null)
  return rec.done(answer)
}

/** Independent version: a plain loop. */
function reference({ n, stop }: FactorialInput): number {
  let product = 1
  for (let k = stop + 1; k <= n; k++) product *= k
  return product
}

const tracer: Tracer<FactorialInput, number> = {
  id: 'recursion/factorial',
  title: 'Factorial',
  anchors: {
    check: 'Base case? Is n <= 1',
    base: 'Base case: return 1',
    call: 'Recursive call: ask fact(n - 1)',
    combine: 'Combine: return n × smaller',
  },
  vars: [
    { name: 'n', label: 'n', role: 'ptrB' },
    { name: 'smaller', label: 'smaller', role: 'value' },
    { name: 'result', label: 'returns', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 'n',
        label: 'n',
        kind: 'int',
        placeholder: 'e.g. 4',
        help: `A whole number from ${LIMITS.min} to ${LIMITS.max}.`,
      },
      {
        name: 'stop',
        label: 'Base case: stop at',
        kind: 'int',
        placeholder: 'e.g. 1',
        help: `The base case is n <= stop. Keep 1 for a real factorial, or move it to cut the recursion short (${LIMITS.min} to ${LIMITS.max}).`,
      },
    ],
    parse: parseInput,
    format: ({ n, stop }) => ({ n: String(n), stop: String(stop) }),
    presets: [
      { label: 'Classic: fact(4)', value: { n: 4, stop: 1 } },
      { label: 'Deeper: fact(6)', value: { n: 6, stop: 1 } },
      { label: 'Move the base case: fact(5), stop at 3', value: { n: 5, stop: 3 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      return { n: randInt(rand, LIMITS.min, LIMITS.max), stop: rand() < 0.4 ? 1 : randInt(rand, LIMITS.min, LIMITS.max) }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
