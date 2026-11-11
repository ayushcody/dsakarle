/**
 * Stacks — Valid Parentheses (LeetCode 20).
 *
 * Read the string left to right. An opener is pushed. A closer must match the
 * opener on top of the stack: if it does, pop it; if not (or the stack is
 * empty) the string is invalid. At the end the stack must be empty.
 *
 * Scene: a column composite. The string sits on top as an array with a pointer
 * `i`; below it the stack of openers that are still waiting for a partner.
 * Array marks: `compare` on the closer and the opener it is tested against,
 * `found` on a pair that just matched, `visited` on pairs matched earlier.
 * Cells with no mark are openers still waiting (they are on the stack).
 *
 * Rules (anchors): init, push, check (closer vs the top; a mismatch ends the
 * run on this frame), pop (they match), done (end of string: valid or
 * leftovers).
 *
 * Predicts are attached to the frame BEFORE the character they ask about.
 * Code lives in content/code/stacks/valid-parentheses.{py,java,cpp}.
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

export interface ValidParenthesesInput {
  s: string
}

/** `maxN` is the string length. The value range is unused for text. */
const LIMITS: InputLimits = { maxN: 12, min: -99, max: 99 }

const OPENERS = '([{'
const CLOSERS = ')]}'
const PAIR: Record<string, string> = { ')': '(', ']': '[', '}': '{' }
const PARTNER: Record<string, string> = { '(': ')', '[': ']', '{': '}' }

function parseInput(raw: Record<string, string>): ParseResult<ValidParenthesesInput> {
  const field = 's'
  const text = (raw.s ?? '').replace(/^[\s"'`]+|[\s"'`]+$/g, '').replace(/\s+/g, '')
  if (text === '') {
    return { ok: false, field, error: 'Type some brackets, like ()[]{} or {[()]}.' }
  }
  for (const ch of text) {
    if (!OPENERS.includes(ch) && !CLOSERS.includes(ch)) {
      return { ok: false, field, error: `"${ch}" isn't a bracket. Use only ( ) [ ] { }.` }
    }
  }
  if (text.length > LIMITS.maxN) {
    return { ok: false, field, error: `Use at most ${LIMITS.maxN} brackets so the picture stays readable.` }
  }
  return { ok: true, value: { s: text } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const PUSH = 'Push'
const POP = 'Pop'
const YES = 'Yes'
const NO = 'No'

/** Question about character i, attached to the frame just before it. */
function pushOrPopPredict(s: string, i: number): PredictCandidate {
  const ch = s[i]
  const opener = OPENERS.includes(ch)
  return {
    tag: 'push-or-pop',
    kind: 'choice',
    prompt: `The next character is ${ch}. Do we push it, or pop the top?`,
    options: i % 2 === 0 ? [PUSH, POP] : [POP, PUSH],
    answer: opener ? PUSH : POP,
    why: opener
      ? `${ch} opens something that is still unclosed, so it goes on the stack to wait for ${PARTNER[ch]}.`
      : `${ch} closes something, so it is never pushed. It tries to pop its partner ${PAIR[ch]} off the top.`,
    hint: 'Is it an opener or a closer?',
  }
}

function matchPredict(s: string, i: number, top: string): PredictCandidate {
  const ch = s[i]
  const ok = PAIR[ch] === top
  return {
    tag: 'match',
    kind: 'choice',
    prompt: `The closer is ${ch} and the top of the stack is ${top}. Do they match?`,
    options: i % 2 === 0 ? [YES, NO] : [NO, YES],
    answer: ok ? YES : NO,
    why: ok
      ? `${ch} closes ${top}, so this is the opener it wants. Pop it.`
      : `${ch} wants ${PAIR[ch]}, but ${top} is still open on top. The nesting is broken, so the string is invalid.`,
    hint: `${ch} pairs with ${PAIR[ch]}.`,
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ s }: ValidParenthesesInput) {
  const rec = createRecorder<boolean>()
  const n = s.length

  // Working state: `open` holds the string index of each opener on the stack.
  const open: number[] = []
  const matched = new Set<number>()
  let i = -1
  let valid: boolean | null = null

  const emit = (
    at: string,
    say: string,
    extra: {
      cells?: Array<{ index: number; role: MarkRole }>
      stackMarks?: Array<{ index: number; role: MarkRole }>
      incoming?: StackScene['incoming']
      predict?: PredictCandidate
    } = {},
  ): void => {
    const roles = new Map<number, MarkRole>()
    for (const k of matched) roles.set(k, 'visited')
    for (const m of extra.cells ?? []) roles.set(m.index, m.role)
    const array: ArrayScene = { kind: 'array', label: 's', cells: s.split('') }
    if (i >= 0) array.pointers = [{ name: 'i', index: i, role: 'ptrB' }]
    if (roles.size) array.marks = Array.from(roles, ([index, role]) => ({ index, role }))

    const stack: StackScene = { kind: 'stack', label: 'stack', items: open.map((k) => s[k]) }
    if (extra.stackMarks?.length) stack.marks = extra.stackMarks
    if (extra.incoming) stack.incoming = extra.incoming

    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { title: 's', scene: array },
        { title: 'stack of open brackets', scene: stack },
      ],
    }
    const vars: Record<string, Val> = {
      i: i >= 0 ? i : null,
      ch: i >= 0 ? s[i] : null,
      top: open.length ? s[open[open.length - 1]] : null,
      open: open.length,
      valid,
    }
    const frame: Frame = { scene, vars, say, at }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  const ask = (next: number): PredictCandidate | undefined => (next < n ? pushOrPopPredict(s, next) : undefined)

  emit('init', `We read "${s}" left to right. The stack will hold openers still waiting for their closer.`, {
    predict: ask(0),
  })

  let failed = false
  for (i = 0; i < n && !rec.capped; i++) {
    const ch = s[i]

    if (OPENERS.includes(ch)) {
      open.push(i)
      emit('push', `${ch} is an opener. Push it: it waits for its partner ${PARTNER[ch]}.`, {
        cells: [{ index: i, role: 'focus' }],
        stackMarks: [{ index: open.length - 1, role: 'changed' }],
        predict: ask(i + 1),
      })
      continue
    }

    // check — a closer meets the top of the stack.
    if (open.length === 0) {
      valid = false
      emit('check', `${ch} is a closer, but the stack is empty. Nothing is open for it to close, so the answer is false.`, {
        cells: [{ index: i, role: 'error' }],
      })
      failed = true
      break
    }
    const j = open[open.length - 1]
    const top = s[j]
    emit('check', `${ch} is a closer. Compare it with the top of the stack, ${top}.`, {
      cells: [
        { index: i, role: 'compare' },
        { index: j, role: 'compare' },
      ],
      stackMarks: [{ index: open.length - 1, role: 'compare' }],
      predict: matchPredict(s, i, top),
    })
    if (rec.capped) break

    if (PAIR[ch] !== top) {
      valid = false
      emit('check', `${top} is on top, but ${ch} needs ${PAIR[ch]}. They don't match, so the answer is false.`, {
        cells: [
          { index: i, role: 'error' },
          { index: j, role: 'error' },
        ],
        stackMarks: [{ index: open.length - 1, role: 'error' }],
      })
      failed = true
      break
    }

    // pop — they match.
    open.pop()
    emit('pop', `${ch} closes ${top}. Pop it: that pair is matched.`, {
      cells: [
        { index: i, role: 'found' },
        { index: j, role: 'found' },
      ],
      incoming: { value: top, direction: 'pop' },
      predict: ask(i + 1),
    })
    matched.add(i)
    matched.add(j)
  }

  if (!failed) {
    // done — end of string: valid only if nothing is left open.
    i = n - 1
    valid = open.length === 0
    if (valid) {
      emit('done', 'The string ends and the stack is empty: every opener was closed, so the answer is true.', {
        cells: Array.from({ length: n }, (_, k) => ({ index: k, role: 'found' as const })),
      })
    } else {
      const top = s[open[open.length - 1]]
      emit(
        'done',
        open.length === 1
          ? `The string ends, but ${top} was never closed. The stack is not empty, so the answer is false.`
          : `The string ends, but ${open.length} openers were never closed (the top is ${top}), so the answer is false.`,
        {
          cells: open.map((k) => ({ index: k, role: 'error' as const })),
          stackMarks: open.map((_, k) => ({ index: k, role: 'error' as const })),
        },
      )
    }
  }
  return rec.done(valid === true)
}

/** Independent version: keep deleting adjacent matched pairs until nothing changes. */
function reference({ s }: ValidParenthesesInput): boolean {
  let text = s
  let before = ''
  while (text !== before) {
    before = text
    text = text.replace('()', '').replace('[]', '').replace('{}', '')
  }
  return text === ''
}

/** Build a balanced string of `pairs` pairs, using the rng. */
function balanced(rand: () => number, pairs: number): string {
  const total = pairs * 2
  const out: string[] = []
  const stack: string[] = []
  while (out.length < total) {
    const remaining = total - out.length
    if (stack.length === remaining || (stack.length > 0 && rand() < 0.5)) {
      out.push(PARTNER[stack.pop() as string])
    } else {
      const o = OPENERS[randInt(rand, 0, 2)]
      stack.push(o)
      out.push(o)
    }
  }
  return out.join('')
}

const tracer: Tracer<ValidParenthesesInput, boolean> = {
  id: 'stacks/valid-parentheses',
  title: 'Valid parentheses',
  anchors: {
    init: 'Start with an empty stack',
    push: 'Opener: push it',
    check: 'Closer: compare it with the top (no match: invalid)',
    pop: 'They match: pop the opener',
    done: 'End of string: valid only if the stack is empty',
  },
  vars: [
    { name: 'i', role: 'ptrB' },
    { name: 'ch', label: 'character', role: 'focus' },
    { name: 'top', label: 'top of stack', role: 'ptrA' },
    { name: 'open', label: 'openers waiting', role: 'value' },
    { name: 'valid', label: 'answer', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 's',
        label: 'Brackets',
        kind: 'string',
        placeholder: 'e.g. {[()]}()',
        help: `Up to ${LIMITS.maxN} of these characters: ( ) [ ] { }`,
      },
    ],
    parse: parseInput,
    format: ({ s }) => ({ s }),
    presets: [
      { label: 'Nested and matched', value: { s: '{[()]}()' } },
      { label: 'Crossed: ([)]', value: { s: '([)]' } },
      { label: 'One opener left over', value: { s: '(()' } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      if (rand() < 0.5) {
        let s = balanced(rand, randInt(rand, 1, 6))
        if (rand() < 0.45) {
          const at = randInt(rand, 0, s.length - 1)
          const symbols = OPENERS + CLOSERS
          s = s.slice(0, at) + symbols[randInt(rand, 0, 5)] + s.slice(at + 1)
        }
        return { s }
      }
      const len = randInt(rand, 2, 10)
      const symbols = OPENERS + CLOSERS
      let s = ''
      for (let k = 0; k < len; k++) s += symbols[randInt(rand, 0, 5)]
      return { s }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
