/**
 * Stacks — the monotonic stack: Daily Temperatures (LeetCode 739).
 *
 * For each day, how many days until a warmer one (0 if there never is)?
 * The stack holds the INDICES of days still waiting for a warmer day. Each new
 * day pops every waiting day it is warmer than (that day's wait is now known),
 * then joins the stack itself. Temperatures on the stack never go up from
 * bottom to top, which is why only the top ever needs checking.
 *
 * Scene: a column composite of three parts: `temps` (array, pointer `i`), the
 * `answer` array being filled in, and the stack. Stack items are labelled
 * `day 3 · 71`: the index, then its temperature.
 * Marks: `compare` on the top day while it is tested, `discarded` on a day that
 * has been popped (resolved, out of play), `changed` on the answer slot just
 * written. Days still waiting carry no mark.
 *
 * Rules (anchors): init, compare (today vs the top day), pop (warmer: record
 * the wait and pop), push (today waits too), done.
 * Predicts are attached to the compare frame; its reveal is the pop or push frame.
 * Code lives in content/code/stacks/next-greater.{py,java,cpp}.
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
  StackScene,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface NextGreaterInput {
  temps: number[]
}

const LIMITS: InputLimits = { maxN: 12, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<NextGreaterInput> {
  const text = (raw.temps ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = text.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'temps', error: 'Type at least one temperature, like 73, 74, 75, 71.' }
  }
  if (tokens.length > LIMITS.maxN) {
    return { ok: false, field: 'temps', error: `Use at most ${LIMITS.maxN} temperatures so the picture stays readable.` }
  }
  const temps: number[] = []
  for (const token of tokens) {
    if (!INTEGER.test(token)) {
      return { ok: false, field: 'temps', error: `"${token}" isn't a whole number. Use digits separated by commas.` }
    }
    const v = Number(token)
    if (v < LIMITS.min || v > LIMITS.max) {
      return { ok: false, field: 'temps', error: `Keep every temperature between ${LIMITS.min} and ${LIMITS.max}.` }
    }
    temps.push(v)
  }
  return { ok: true, value: { temps } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const POP = 'Pop'
const STAY = 'Stay'

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many
}

function popOrStayPredict(temps: number[], i: number, j: number, depth: number): PredictCandidate {
  const warmer = temps[j] < temps[i]
  return {
    tag: 'pop-or-stay',
    kind: 'choice',
    prompt: `Day ${i} is ${temps[i]}. The top of the stack, day ${j}, is ${temps[j]}. Does day ${j} pop, or stay?`,
    options: (i + depth) % 2 === 0 ? [POP, STAY] : [STAY, POP],
    answer: warmer ? POP : STAY,
    why: warmer
      ? `${temps[i]} is warmer than ${temps[j]}, so day ${j} has found its warmer day. Its wait is known and it leaves the stack.`
      : `${temps[i]} is not warmer than ${temps[j]}, so day ${j} keeps waiting. Everything under it is at least as warm, so none of those can pop either.`,
    hint: 'Pop only when today is strictly warmer than the day on top.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ temps }: NextGreaterInput) {
  const rec = createRecorder<number[]>()
  const n = temps.length

  const answer: number[] = new Array<number>(n).fill(0)
  const stack: number[] = [] // day indices, bottom → top
  const resolved = new Set<number>()
  let i = -1
  let top: number | null = null

  const label = (j: number): string => `day ${j} · ${temps[j]}`

  const emit = (
    at: string,
    say: string,
    extra: {
      cells?: Array<{ index: number; role: MarkRole }>
      answerMarks?: Array<{ index: number; role: MarkRole }>
      stackMarks?: Array<{ index: number; role: MarkRole }>
      incoming?: StackScene['incoming']
      predict?: PredictCandidate
    } = {},
  ): void => {
    const roles = new Map<number, MarkRole>()
    for (const k of resolved) roles.set(k, 'discarded')
    for (const m of extra.cells ?? []) roles.set(m.index, m.role)
    const tempsScene: ArrayScene = { kind: 'array', label: 'temps', cells: temps.slice() }
    if (i >= 0 && i < n) tempsScene.pointers = [{ name: 'i', index: i, role: 'ptrB' }]
    if (roles.size) tempsScene.marks = Array.from(roles, ([index, role]) => ({ index, role }))

    const answerScene: ArrayScene = { kind: 'array', label: 'answer', cells: answer.slice() }
    if (extra.answerMarks?.length) answerScene.marks = extra.answerMarks

    const stackScene: StackScene = { kind: 'stack', label: 'stack', items: stack.map(label) }
    if (extra.stackMarks?.length) stackScene.marks = extra.stackMarks
    if (extra.incoming) stackScene.incoming = extra.incoming

    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { title: 'temps', scene: tempsScene },
        { title: 'answer: days to wait', scene: answerScene },
        { title: 'stack of days still waiting', scene: stackScene },
      ],
    }
    const vars: Record<string, Val> = {
      i: i >= 0 && i < n ? i : null,
      top,
      answer: answer.slice(),
    }
    const frame: Frame = { scene, vars, say, at }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit('init', 'answer starts as all zeros. The stack will hold the days still waiting for a warmer day.')

  for (i = 0; i < n && !rec.capped; i++) {
    let reason = '' // why the loop stopped, used by the push frame

    while (stack.length > 0 && !rec.capped) {
      const j = stack[stack.length - 1]
      top = j
      const warmer = temps[j] < temps[i]

      // compare — today against the day on top of the stack.
      emit('compare', `Day ${i} is ${temps[i]}. Is it warmer than day ${j}, the top of the stack (${temps[j]})?`, {
        cells: [
          { index: i, role: 'focus' },
          { index: j, role: 'compare' },
        ],
        stackMarks: [{ index: stack.length - 1, role: 'compare' }],
        predict: popOrStayPredict(temps, i, j, stack.length),
      })
      if (rec.capped) break

      if (!warmer) {
        reason = `${temps[i]} is not warmer than ${temps[j]}, so day ${j} keeps waiting.`
        break
      }

      // pop — a warmer day arrived: that day's wait is known.
      stack.pop()
      answer[j] = i - j
      resolved.add(j)
      top = stack.length ? stack[stack.length - 1] : null
      const wait = i - j
      emit(
        'pop',
        `${temps[i]} beats ${temps[j]}: day ${j} waited ${wait} ${plural(wait, 'day', 'days')}, so answer[${j}] = ${wait}. It leaves the stack.`,
        {
          cells: [{ index: i, role: 'focus' }],
          answerMarks: [{ index: j, role: 'changed' }],
          incoming: { value: label(j), direction: 'pop' },
        },
      )
    }
    if (rec.capped) break

    // push — today now waits for a warmer day of its own.
    stack.push(i)
    top = i
    emit(
      'push',
      reason
        ? `${reason} Push day ${i}: it waits too.`
        : stack.length === 1 && i > 0
          ? `Nothing is waiting any more, so push day ${i} (${temps[i]}): it waits for a warmer day.`
          : `Nothing is waiting yet, so push day ${i} (${temps[i]}): it waits for a warmer day.`,
      {
        cells: [{ index: i, role: 'focus' }],
        stackMarks: [{ index: stack.length - 1, role: 'changed' }],
      },
    )
  }

  i = -1
  top = null
  const waiting = stack.length
  emit(
    'done',
    waiting === 0
      ? `Done. Every day found a warmer day ahead. Answer: [${answer.join(', ')}].`
      : `Done. ${waiting} ${plural(waiting, 'day never sees', 'days never see')} a warmer day, so ${plural(waiting, 'it stays', 'they stay')} 0. Answer: [${answer.join(', ')}].`,
    { stackMarks: stack.map((_, k) => ({ index: k, role: 'visited' as const })) },
  )
  return rec.done(answer.slice())
}

/** Independent version: for each day, scan forward for the first warmer day. */
function reference({ temps }: NextGreaterInput): number[] {
  return temps.map((t, i) => {
    for (let j = i + 1; j < temps.length; j++) if (temps[j] > t) return j - i
    return 0
  })
}

const tracer: Tracer<NextGreaterInput, number[]> = {
  id: 'stacks/next-greater',
  title: 'Monotonic stack',
  anchors: {
    init: 'Start with answer all 0 and an empty stack of days',
    compare: 'Is today warmer than the day on top?',
    pop: 'Yes: record the wait and pop that day',
    push: 'Push today: it waits for a warmer day',
    done: 'Return answer (days left on the stack stay 0)',
  },
  vars: [
    { name: 'i', label: 'today (i)', role: 'ptrB' },
    { name: 'top', label: 'day on top', role: 'ptrA' },
    { name: 'answer', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 'temps',
        label: 'Temperatures',
        kind: 'int-array',
        placeholder: 'e.g. 73, 74, 75, 71, 69, 72, 76, 73',
        help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}, one per day.`,
      },
    ],
    parse: parseInput,
    format: ({ temps }) => ({ temps: temps.join(', ') }),
    presets: [
      { label: 'Daily temperatures', value: { temps: [73, 74, 75, 71, 69, 72, 76, 73] } },
      { label: 'Colder every day', value: { temps: [90, 85, 80, 75, 70] } },
      { label: 'Warmer every day', value: { temps: [60, 65, 70, 75, 80] } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 3, 10)
      return { temps: Array.from({ length: len }, () => randInt(rand, 60, 80)) }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
