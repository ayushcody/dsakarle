/**
 * Shared pieces for the three fast-and-slow-pointer tracers (cycle, middle,
 * cycle-start): input parsing, the list scene, and the predicts that two of
 * them have in common.
 *
 * The list is described by `values` (head to tail) and `pos`, exactly like
 * LeetCode 141 / 142: the tail's `next` points back at node `pos`, or at null
 * when `pos` is -1. Node ids are `n0..nk` in list order. A cycle is drawn as
 * one more link, from the tail back to an earlier node.
 *
 * This file is not a tracer and is not in the registry.
 */
import type { Recorder } from '@/lib/engine/recorder'
import type {
  Frame,
  Gauge,
  InputField,
  InputLimits,
  LinkedListScene,
  ParseResult,
  PredictCandidate,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface LoopListInput {
  values: number[]
  /** Index the tail links back to; -1 means the list ends in null. */
  pos: number
}

export interface PlainListInput {
  values: number[]
}

export const LIMITS: InputLimits = { maxN: 8, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/

export const VALUES_FIELD: InputField = {
  name: 'values',
  label: 'List values',
  kind: 'int-array',
  placeholder: 'e.g. 3, 2, 0, -4',
  help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}, from head to tail.`,
}

export const POS_FIELD: InputField = {
  name: 'pos',
  label: 'Tail links back to',
  kind: 'int',
  placeholder: 'e.g. 1',
  help: 'The index (starting at 0) the last node points back to. Type -1 for no cycle.',
}

export function parseValues(raw: Record<string, string>): ParseResult<number[]> {
  const text = (raw.values ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = text.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'values', error: 'Type at least one number, like 3, 2, 0, -4.' }
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
  return { ok: true, value: values }
}

export function parseLoopList(raw: Record<string, string>): ParseResult<LoopListInput> {
  const values = parseValues(raw)
  if (!values.ok) return values
  const text = (raw.pos ?? '').replace(/[−–]/g, '-').trim()
  if (text === '') {
    return { ok: false, field: 'pos', error: 'Type where the tail links back to: an index like 1, or -1 for no cycle.' }
  }
  if (!INTEGER.test(text)) {
    return { ok: false, field: 'pos', error: `"${text}" isn't a whole number. Use an index like 1, or -1 for no cycle.` }
  }
  const pos = Number(text)
  const n = values.value.length
  if (pos < -1 || pos > n - 1) {
    return { ok: false, field: 'pos', error: `With ${n} node${n === 1 ? '' : 's'}, pos must be -1 (no cycle) or 0 to ${n - 1}.` }
  }
  return { ok: true, value: { values: values.value, pos } }
}

export function parsePlainList(raw: Record<string, string>): ParseResult<PlainListInput> {
  const values = parseValues(raw)
  return values.ok ? { ok: true, value: { values: values.value } } : values
}

/** `len` different numbers from -9..30, so two nodes never look alike on screen. */
export function distinctValues(rand: () => number, len: number): number[] {
  const pool = Array.from({ length: 40 }, (_, i) => i - 9)
  for (let i = 0; i < len; i++) {
    const j = i + Math.floor(rand() * (pool.length - i))
    const tmp = pool[i]
    pool[i] = pool[j]
    pool[j] = tmp
  }
  return pool.slice(0, len)
}

// ---------------------------------------------------------------------------
// The list
// ---------------------------------------------------------------------------

export const idOf = (i: number): string => `n${i}`
const idOrNull = (i: number | null): string | null => (i === null ? null : idOf(i))

/** Where node `i`'s next link goes: the following node, the cycle target (tail only), or null. */
export function nextOf(n: number, pos: number, i: number): number | null {
  if (i < n - 1) return i + 1
  return pos >= 0 ? pos : null
}

/** Independent check used by the references: walk with a set of seen nodes; the first repeat is the cycle start. */
export function firstRepeat(n: number, pos: number): number {
  const seen = new Set<number>()
  let at: number | null = 0
  while (at !== null) {
    if (seen.has(at)) return at
    seen.add(at)
    at = nextOf(n, pos, at)
  }
  return -1
}

/** What a learner reads for a node: its value, or "null" off the end. */
export function nameOf(values: number[], i: number | null): string {
  return i === null ? 'null' : String(values[i])
}

const valueOf = (values: number[], i: number | null): Val => (i === null ? null : values[i])

export interface Race {
  slow: number | null
  fast: number | null
}

export interface EmitExtras {
  marks?: NonNullable<LinkedListScene['marks']>
  annotations?: NonNullable<LinkedListScene['annotations']>
  gauge?: Gauge
  predict?: PredictCandidate
}

/** Builds the frame recorder for a list with slow (ptrA) and fast (ptrB) pointers. */
export function createRaceEmitter<R>(values: number[], pos: number, rec: Recorder<R>) {
  const n = values.length
  const nodes: LinkedListScene['nodes'] = values.map((v, i) => ({ id: idOf(i), value: v }))
  const links: LinkedListScene['links'] = values.map((_, i) => ({ from: idOf(i), to: idOrNull(nextOf(n, pos, i)) }))

  return (at: string, say: string, race: Race, extras: EmitExtras = {}): void => {
    const scene: LinkedListScene = {
      kind: 'linked-list',
      nodes,
      links,
      pointers: [
        { name: 'slow', target: idOrNull(race.slow), role: 'ptrA' },
        { name: 'fast', target: idOrNull(race.fast), role: 'ptrB' },
      ],
      marks: extras.marks ?? [],
    }
    if (extras.annotations) scene.annotations = extras.annotations
    const frame: Frame = {
      scene,
      vars: { slow: valueOf(values, race.slow), fast: valueOf(values, race.fast) },
      say,
      at,
    }
    if (extras.gauge) frame.gauge = extras.gauge
    if (extras.predict) frame.predict = extras.predict
    rec.frame(frame)
  }
}

// ---------------------------------------------------------------------------
// Predicts shared by `cycle` and `cycle-start` (the race phase)
// ---------------------------------------------------------------------------

/** True when fast has two nodes ahead to step through (the loop test `fast and fast.next`). */
export function canRace(n: number, pos: number, fast: number | null): boolean {
  return fast !== null && nextOf(n, pos, fast) !== null
}

/** On the check frame: where will fast land after two steps? Null when it falls off the end (nothing to click). */
export function whereFastLandsPredict(
  values: number[],
  pos: number,
  slow: number,
  fast: number,
): PredictCandidate | undefined {
  const n = values.length
  const first = nextOf(n, pos, fast)
  const land = first === null ? null : nextOf(n, pos, first)
  if (first === null || land === null) return undefined
  return {
    tag: 'where-fast-lands',
    kind: 'cell',
    prompt: `slow is on ${values[slow]}, fast is on ${values[fast]}. fast takes two steps. Click the node fast lands on.`,
    answer: idOf(land),
    why: `fast goes ${values[fast]} to ${values[first]} to ${values[land]}: two links ahead.${
      fast === n - 1 || first === n - 1 ? ' At the tail, the next link loops back.' : ''
    }`,
    hint: 'Follow the arrows twice from fast, one link at a time.',
  }
}

const RACING = 'Still racing'
const RAN_OUT = 'Fast runs out'

/** On a compare frame where slow and fast differ: at the next loop test, can fast still step twice? */
export function meetOrNullPredict(values: number[], pos: number, slow: number | null, fast: number | null): PredictCandidate {
  const n = values.length
  const racing = canRace(n, pos, fast)
  return {
    tag: 'meet-or-null',
    kind: 'choice',
    prompt: `slow is on ${nameOf(values, slow)}, fast is on ${nameOf(values, fast)}: not the same node. At the next loop test, does fast still have two nodes ahead?`,
    options: [RACING, RAN_OUT],
    answer: racing ? RACING : RAN_OUT,
    why: racing
      ? pos >= 0
        ? 'On a loop every node has a next, so fast never runs out. It keeps coming round until it meets slow.'
        : `fast still has two nodes ahead, so the race goes on.`
      : fast === null
        ? 'fast is already null. Falling off the end means the list does not loop.'
        : `fast is on the last node, ${values[fast]}, with nothing after it. Falling off the end means no loop.`,
    hint: 'Does the list end in null, or do the arrows loop back?',
  }
}
