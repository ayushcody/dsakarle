/**
 * Stacks — push, pop and peek, one operation at a time.
 *
 * The learner types operations like "push 3, push 7, pop, peek". The stack is
 * a vertical pile: only the top can be touched. Rules (anchors):
 *   push       put a value on top (two frames: the slab waits beside the
 *              stack, then lands on it)
 *   pop        take the top off (the slab that left is drawn beside the stack)
 *   peek       look at the top without removing it
 *   underflow  pop or peek on an empty stack: nothing to give back
 * Pop, peek and underflow are one frame each.
 *
 * Same layout as the other golden tracers:
 *   1. input type, parsing and presets
 *   2. frame helpers (narration / predicts)
 *   3. `run` — the real algorithm, recording one frame per idea
 *   4. `reference` — a boring implementation the tests compare against
 *
 * Predicts are attached to the frame BEFORE the operation they ask about, so
 * the reveal is the operation's own frame.
 * Code lives in content/code/stacks/push-pop.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  Frame,
  InputLimits,
  MarkRole,
  ParseResult,
  PredictCandidate,
  StackScene,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export type StackOp = { op: 'push'; value: number } | { op: 'pop' } | { op: 'peek' }

export interface PushPopInput {
  ops: StackOp[]
}

/** One entry per pop / peek, in order: the value it returned, or null on underflow. */
export type PushPopResult = Array<number | null>

/** `maxN` is the operation limit; `min`..`max` is the pushed-value range. */
const LIMITS: InputLimits = { maxN: 8, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/

/** Keep echoed user text short so error messages stay friendly. */
function shown(text: string): string {
  return text.length > 14 ? `${text.slice(0, 13)}…` : text
}

function parseInput(raw: Record<string, string>): ParseResult<PushPopInput> {
  const field = 'ops'
  const parts = (raw.ops ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .split(/[,;\n]+/)
    .map((p) => p.trim())
    .filter((p) => p !== '')

  if (parts.length === 0) {
    return { ok: false, field, error: 'Type at least one operation, like push 3, push 7, pop.' }
  }
  if (parts.length > LIMITS.maxN) {
    return { ok: false, field, error: `Use at most ${LIMITS.maxN} operations so the stack stays readable.` }
  }

  const ops: StackOp[] = []
  for (const part of parts) {
    const words = part.split(/\s+/)
    const verb = words[0].toLowerCase()
    if (verb === 'push') {
      if (words.length !== 2) {
        return { ok: false, field, error: 'push needs one number, like push 3. Separate operations with commas.' }
      }
      const text = words[1]
      if (!INTEGER.test(text) || Number(text) < LIMITS.min || Number(text) > LIMITS.max) {
        return { ok: false, field, error: `Push a whole number from ${LIMITS.min} to ${LIMITS.max}, not "${shown(text)}".` }
      }
      ops.push({ op: 'push', value: Number(text) })
    } else if (verb === 'pop' || verb === 'peek' || verb === 'top') {
      if (words.length !== 1) {
        return { ok: false, field, error: `${verb} takes no number: it works on the top. Write just ${verb}, then a comma.` }
      }
      ops.push({ op: verb === 'pop' ? 'pop' : 'peek' })
    } else {
      return { ok: false, field, error: `"${shown(words[0])}" isn't an operation here. Use push N, pop or peek.` }
    }
  }
  return { ok: true, value: { ops } }
}

function formatOps(ops: StackOp[]): string {
  return ops.map((o) => (o.op === 'push' ? `push ${o.value}` : o.op)).join(', ')
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

/** Rotate so the right answer is not always in the same slot. */
function rotate<T>(list: T[], by: number): T[] {
  const k = list.length === 0 ? 0 : by % list.length
  return [...list.slice(k), ...list.slice(0, k)]
}

function opName(op: StackOp): string {
  return op.op === 'push' ? `push ${op.value}` : op.op
}

/** The question (if any) about operation `k`, given the stack just before it. */
function predictFor(op: StackOp, k: number, items: number[]): PredictCandidate | undefined {
  if (op.op === 'push') return undefined

  if (op.op === 'pop') {
    if (items.length === 0) {
      const options = rotate(['It reports an underflow', 'It returns 0'], k)
      return {
        tag: 'pop-empty',
        kind: 'choice',
        prompt: 'The stack is empty and the next operation is pop. What happens?',
        options,
        answer: 'It reports an underflow',
        why: 'There is nothing to remove, so pop has no value to give back. That is an underflow, and the stack is left as it was.',
        hint: 'Is there anything on the stack to take off?',
      }
    }
    // Distinct values, top first. Need two or the question is not a decision.
    const distinct: number[] = []
    for (let i = items.length - 1; i >= 0; i--) if (!distinct.includes(items[i])) distinct.push(items[i])
    if (distinct.length < 2) return undefined
    const top = items[items.length - 1]
    const bottom = distinct[distinct.length - 1]
    const picks = [top, bottom, ...distinct.slice(1, -1)].slice(0, 3)
    return {
      tag: 'what-pops',
      kind: 'choice',
      prompt: `The stack holds ${items.join(', ')} (top is last). Next is pop. Which value comes off?`,
      options: rotate(picks.map(String), k),
      answer: String(top),
      why: `pop always takes the top, the item pushed most recently. That is ${top}; ${bottom} has to wait until everything above it is gone.`,
      hint: 'Only the top is within reach.',
    }
  }

  // peek
  if (items.length === 0) return undefined
  return {
    tag: 'peek-removes',
    kind: 'choice',
    prompt: 'Next is peek. After it, does the top item leave the stack?',
    options: rotate(['No, it stays', 'Yes, it comes off'], k),
    answer: 'No, it stays',
    why: 'peek only looks at the top. Nothing is removed, so the stack looks exactly the same afterwards.',
    hint: 'peek and pop are different operations.',
  }
}

function listText(values: Array<number | null>): string {
  return values.map((v) => (v === null ? 'nothing' : String(v))).join(', ')
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ ops }: PushPopInput) {
  const rec = createRecorder<PushPopResult>()
  const items: number[] = []
  const outputs: PushPopResult = []
  let current = 'start'
  let last: number | null | undefined = undefined // undefined = nothing returned yet

  const emit = (
    at: string,
    say: string,
    extra: {
      incoming?: StackScene['incoming']
      marks?: Array<{ index: number; role: MarkRole }>
      notes?: StackScene['annotations']
      predict?: PredictCandidate
    } = {},
  ): void => {
    const scene: StackScene = { kind: 'stack', label: 'stack', items: items.slice() }
    if (extra.marks?.length) scene.marks = extra.marks
    if (extra.incoming) scene.incoming = extra.incoming
    if (extra.notes?.length) scene.annotations = extra.notes
    const vars: Record<string, Val> = {
      op: current,
      size: items.length,
      top: items.length ? items[items.length - 1] : null,
      last: last === undefined ? null : last,
    }
    const frame: Frame = { scene, vars, say, at }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  /** Predict about operation k, attached to whichever frame comes right before it. */
  const askAbout = (k: number): PredictCandidate | undefined => (k < ops.length ? predictFor(ops[k], k, items) : undefined)

  emit(
    'init',
    'The stack starts empty. Only the top can be touched, so everything goes in and comes out there.',
    { predict: askAbout(0) },
  )

  for (let k = 0; k < ops.length && !rec.capped; k++) {
    const op = ops[k]
    current = opName(op)

    if (op.op === 'push') {
      const v = op.value
      emit(
        'push',
        items.length === 0
          ? `push ${v}: the stack is empty, so ${v} will be both the bottom and the top.`
          : `push ${v}: the new item waits beside the stack, ready to go on top of ${items[items.length - 1]}.`,
        { incoming: { value: v, direction: 'push' } },
      )
      if (rec.capped) break
      items.push(v)
      emit(
        'push',
        items.length === 1 ? `${v} lands. It is the only item, so it is the top.` : `${v} lands on top. The top is ${v} now.`,
        { marks: [{ index: items.length - 1, role: 'changed' }], predict: askAbout(k + 1) },
      )
      continue
    }

    if (items.length === 0) {
      outputs.push(null)
      last = null
      emit(
        'underflow',
        op.op === 'pop'
          ? 'pop on an empty stack: nothing to remove. That is an underflow, so we report nothing instead of crashing.'
          : 'peek on an empty stack: there is no top to look at. That is an underflow, so we report nothing.',
        { predict: askAbout(k + 1) },
      )
      continue
    }

    if (op.op === 'pop') {
      const v = items.pop() as number
      outputs.push(v)
      last = v
      emit(
        'pop',
        items.length === 0
          ? `pop: ${v} was on top, so ${v} comes off. The stack is empty again.`
          : `pop: ${v} was on top, so ${v} comes off. ${items[items.length - 1]} is the top now.`,
        { incoming: { value: v, direction: 'pop' }, predict: askAbout(k + 1) },
      )
      continue
    }

    // peek
    const v = items[items.length - 1]
    outputs.push(v)
    last = v
    emit('peek', `peek: the top is ${v}. We only look, so nothing is removed.`, {
      marks: [{ index: items.length - 1, role: 'compare' }],
      notes: [{ target: 'top', text: 'just a look' }],
      predict: askAbout(k + 1),
    })
  }

  current = 'done'
  emit(
    'done',
    `Done. The reads gave ${outputs.length ? listText(outputs) : 'nothing (no pop or peek)'}. ${
      items.length === 0 ? 'The stack ends empty.' : `The stack ends holding ${items.join(', ')}, top last.`
    }`,
    { marks: items.length ? [{ index: items.length - 1, role: 'found' }] : [] },
  )

  return rec.done(outputs)
}

/** Independent version: a plain array, `at(-1)` for the top. */
function reference({ ops }: PushPopInput): PushPopResult {
  const stack: number[] = []
  const results: PushPopResult = []
  for (const op of ops) {
    if (op.op === 'push') stack.push(op.value)
    else if (op.op === 'pop') results.push(stack.length > 0 ? (stack.pop() as number) : null)
    else results.push(stack.length > 0 ? (stack[stack.length - 1] as number) : null)
  }
  return results
}

const tracer: Tracer<PushPopInput, PushPopResult> = {
  id: 'stacks/push-pop',
  title: 'Push & pop',
  anchors: {
    init: 'Start with an empty stack',
    push: 'push: put the value on top',
    pop: 'pop: take the top off',
    peek: 'peek: look at the top, change nothing',
    underflow: 'Empty stack: nothing to pop or peek',
    done: 'Return what pop and peek gave back',
  },
  vars: [
    { name: 'op', label: 'operation', role: 'focus' },
    { name: 'size', label: 'items', role: 'value' },
    { name: 'top', label: 'top item', role: 'ptrB' },
    { name: 'last', label: 'last pop / peek', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 'ops',
        label: 'Operations',
        kind: 'string',
        placeholder: 'e.g. push 3, push 7, pop, peek',
        help: `Up to ${LIMITS.maxN} operations, separated by commas: push N, pop or peek. Pushed numbers are ${LIMITS.min} to ${LIMITS.max}.`,
      },
    ],
    parse: parseInput,
    format: ({ ops }) => ({ ops: formatOps(ops) }),
    presets: [
      {
        label: 'Push, pop, peek, then pop too far',
        value: {
          ops: [
            { op: 'push', value: 3 },
            { op: 'push', value: 7 },
            { op: 'pop' },
            { op: 'peek' },
            { op: 'push', value: 1 },
            { op: 'pop' },
            { op: 'pop' },
            { op: 'pop' },
          ],
        },
      },
      {
        label: 'Last in, first out',
        value: {
          ops: [
            { op: 'push', value: 1 },
            { op: 'push', value: 2 },
            { op: 'push', value: 3 },
            { op: 'push', value: 4 },
            { op: 'pop' },
            { op: 'pop' },
            { op: 'pop' },
            { op: 'pop' },
          ],
        },
      },
      {
        label: 'Pop from nothing',
        value: { ops: [{ op: 'pop' }, { op: 'push', value: 5 }, { op: 'peek' }, { op: 'pop' }] },
      },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 4, 8)
      const ops: StackOp[] = []
      for (let k = 0; k < len; k++) {
        const r = rand()
        if (k === 0 || r < 0.5) ops.push({ op: 'push', value: randInt(rand, -9, 30) })
        else if (r < 0.82) ops.push({ op: 'pop' })
        else ops.push({ op: 'peek' })
      }
      return { ops }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
