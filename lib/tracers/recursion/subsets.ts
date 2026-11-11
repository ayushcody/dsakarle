/**
 * Backtracking — subsets with choose → explore → unchoose (LeetCode 78).
 *
 * For each number there are two branches: take it, or skip it. A call
 * `explore(i)` decides about nums[i]:
 *   prune     the path already holds `limit` numbers, so "take" is cut off
 *   choose    push nums[i] onto the path
 *   explore   recurse on i + 1
 *   unchoose  pop it again, so the path is back as it was
 *   skip      recurse on i + 1 with the path unchanged
 * When i == n every number is decided: `found` saves a COPY of the path.
 *
 * `limit` is the largest subset size we care about. With limit >= n nothing is
 * pruned and the answer is the whole power set (LeetCode 78). The result order
 * is "take first", so [1,2,3] gives [1,2,3] first and [] last.
 *
 * Scenes: a composite column of the call tree (CallTreeScene) and the current
 * `path` as an ArrayScene. Chips are labelled `i=<i> [path]`. A pruned chip is
 * the call that would have been made. Results appear on the leaves (✓ [..]) and
 * in the `found` variable.
 * Code lives in content/code/recursion/subsets.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  ArrayScene,
  CallFrameNode,
  CallTreeScene,
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

export interface SubsetsInput {
  nums: number[]
  /** Largest subset size to build. A value of nums.length or more means no limit. */
  limit: number
}

/** LeetCode 78 allows -10..10, and at most 4 numbers keeps the tree to 16 leaves. */
const LIMITS: InputLimits = { maxN: 4, min: -10, max: 10 }

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<SubsetsInput> {
  const text = (raw.nums ?? '')
    .replace(/[−–]/g, '-')
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = text.split(/[\s,;]+/).filter((t) => t !== '')
  if (tokens.length === 0) {
    return { ok: false, field: 'nums', error: 'Type at least one number, like 1, 2, 3.' }
  }
  if (tokens.length > LIMITS.maxN) {
    return { ok: false, field: 'nums', error: `Use at most ${LIMITS.maxN} numbers: ${LIMITS.maxN} numbers already make 16 subsets.` }
  }
  const nums: number[] = []
  for (const token of tokens) {
    if (!INTEGER.test(token)) {
      return { ok: false, field: 'nums', error: `"${token.slice(0, 12)}" isn't a whole number. Use digits separated by commas.` }
    }
    const v = Number(token)
    if (v < LIMITS.min || v > LIMITS.max) {
      return { ok: false, field: 'nums', error: `Keep every number between ${LIMITS.min} and ${LIMITS.max}.` }
    }
    if (nums.includes(v)) {
      return { ok: false, field: 'nums', error: `${v} appears twice. Use distinct numbers so every subset is different.` }
    }
    nums.push(v)
  }

  const limitText = (raw.limit ?? '').trim()
  if (limitText === '') {
    return { ok: false, field: 'limit', error: `Type a size limit from 0 to ${LIMITS.maxN}. A limit as big as the list means no pruning.` }
  }
  if (!INTEGER.test(limitText)) {
    return { ok: false, field: 'limit', error: `"${limitText.slice(0, 12)}" isn't a whole number. Try 2.` }
  }
  const limit = Number(limitText)
  if (limit < 0 || limit > LIMITS.maxN) {
    return { ok: false, field: 'limit', error: `Keep the limit between 0 and ${LIMITS.maxN}.` }
  }
  return { ok: true, value: { nums, limit } }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (path: number[]): string => `[${path.join(',')}]`
const plural = (k: number, word: string): string => `${k} ${word}${k === 1 ? '' : 's'}`

const rotate = <T>(items: T[], by: number): T[] => items.map((_, i) => items[(i + by) % items.length])

/** How many subsets of size <= cap an n-element set has (binomials). */
function countSubsets(n: number, cap: number): number {
  let total = 0
  let c = 1
  for (let k = 0; k <= Math.min(n, cap); k++) {
    total += c
    c = (c * (n - k)) / (k + 1)
  }
  return total
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums, limit }: SubsetsInput) {
  const rec = createRecorder<number[][]>()
  const n = nums.length
  const cap = Math.min(limit, n)
  const limited = limit < n
  const total = countSubsets(n, cap)

  interface Rec {
    id: string
    label: string
    parent: string | null
    state: 'open' | 'done' | 'pruned'
    result?: string
    saved: number
  }
  const calls: Rec[] = []
  const stack: string[] = []
  const path: number[] = []
  const res: number[][] = []
  let unchooseAsked = 0
  let skipAsked = 0

  const get = (id: string): Rec => calls.find((c) => c.id === id)!

  const sceneOf = (marks: Array<{ id: string; role: MarkRole }>, note?: { id: string; text: string }, pathMark?: number): Frame['scene'] => {
    const top = stack[stack.length - 1]
    const nodes: CallFrameNode[] = calls.map((c) => {
      const status: CallFrameNode['status'] =
        c.state === 'done' ? 'returned' : c.state === 'pruned' ? 'pruned' : c.id === top ? 'active' : 'pending'
      const node: CallFrameNode = { id: c.id, label: c.label, parent: c.parent, status }
      if (c.state === 'done' && c.result !== undefined) node.result = c.result
      return node
    })
    const tree: CallTreeScene = {
      kind: 'call-tree',
      calls: nodes,
      stack: stack.slice(),
      ...(marks.length ? { marks } : {}),
      ...(note ? { annotations: [{ target: `call:${note.id}`, text: note.text }] } : {}),
    }
    const array: ArrayScene = {
      kind: 'array',
      label: 'path',
      cells: path.slice(),
      capacity: Math.max(1, cap, path.length),
      ...(pathMark !== undefined ? { marks: [{ index: pathMark, role: 'changed' as const }] } : {}),
    }
    return {
      kind: 'composite',
      layout: 'column',
      parts: [{ scene: tree }, { scene: array }],
    }
  }

  const emit = (
    at: string,
    say: string,
    i: number,
    opts: { marks?: Array<{ id: string; role: MarkRole }>; note?: { id: string; text: string }; pathMark?: number; predict?: PredictCandidate } = {},
  ): void => {
    const vars: Record<string, Val> = { i, path: path.slice(), saved: res.length }
    const frame: Frame = {
      scene: sceneOf(opts.marks ?? [], opts.note, opts.pathMark),
      vars,
      say,
      at,
      gauge: { value: res.length, max: total, label: 'Subsets saved' },
    }
    if (opts.predict) frame.predict = opts.predict
    rec.frame(frame)
  }

  const newCall = (label: string, parent: string | null): string => {
    const id = `c${calls.length}`
    calls.push({ id, label, parent, state: 'open', saved: 0 })
    stack.push(id)
    return id
  }

  /** Silent return: mark the call done, pop it, and tell its caller how many subsets it saved. */
  const finish = (id: string, result: string): void => {
    const c = get(id)
    c.state = 'done'
    c.result = result
    stack.pop()
    if (c.parent !== null) get(c.parent).saved += c.saved
  }

  /** The decision a non-leaf call is about to make, asked on the frame that entered it. */
  const decisionPredict = (i: number): PredictCandidate => {
    const v = nums[i]
    if (path.length < cap) {
      return {
        tag: 'include-or-skip',
        kind: 'choice',
        prompt: `explore(${i}) has path ${fmt(path)} and decides about ${v}. Which branch does it run first?`,
        options: i % 2 === 0 ? [`Take ${v}`, `Skip ${v}`] : [`Skip ${v}`, `Take ${v}`],
        answer: `Take ${v}`,
        why: `The code runs choose, explore, unchoose first, so the take branch for ${v} comes before the skip branch.`,
        hint: 'Read the order of the lines: the guarded block comes before the last call.',
      }
    }
    return {
      tag: 'prune-or-take',
      kind: 'choice',
      prompt: `path ${fmt(path)} already holds ${plural(path.length, 'number')} and the limit is ${cap}. Can this call take ${v}?`,
      options: i % 2 === 0 ? ['Yes, take it', 'No, prune it'] : ['No, prune it', 'Yes, take it'],
      answer: 'No, prune it',
      why: `The path is full at ${cap}, so adding ${v} would break the limit. That whole branch is cut.`,
      hint: 'Compare the path length with the limit.',
    }
  }

  const explore = (i: number, id: string): void => {
    if (rec.capped) {
      finish(id, '✕')
      return
    }
    if (i === n) {
      res.push(path.slice())
      get(id).saved = 1
      emit(
        'found',
        `Base case: all ${n} numbers are decided. Save a copy of ${fmt(path)}. ${plural(res.length, 'subset')} saved so far.`,
        i,
        { marks: [{ id, role: 'found' }], note: { id, text: 'saved a copy' } },
      )
      finish(id, `✓ ${fmt(path)}`)
      return
    }

    const v = nums[i]
    if (path.length < cap) {
      path.push(v)
      emit('choose', `Choose ${v}: push it onto the path. path = ${fmt(path)}.`, i, { pathMark: path.length - 1 })
      const child = newCall(`i=${i + 1} ${fmt(path)}`, id)
      const leaf = i + 1 === n
      emit(
        'explore',
        leaf
          ? `explore(${i + 1}) is pushed. All ${n} numbers are decided, so it is the base case.`
          : `explore(${i + 1}) is pushed on the stack with path ${fmt(path)}. Now it decides about ${nums[i + 1]}.`,
        i + 1,
        leaf ? {} : { predict: decisionPredict(i + 1) },
      )
      explore(i + 1, child)

      // Everything below the take branch is finished. Ask what unchoose will do.
      const last = rec.frames[rec.frames.length - 1]
      if (last && !last.predict) {
        const remove = `Remove ${v} (the last choice)`
        const options = rotate([remove, 'Empty the whole path', 'Add the next number'], unchooseAsked % 3)
        unchooseAsked++
        last.predict = {
          tag: 'what-unchoose-does',
          kind: 'choice',
          prompt: `Everything under "take ${v}" has returned and path is ${fmt(path)}. What does unchoose do to the path?`,
          options,
          answer: remove,
          why: `Unchoose undoes only the last choice: ${v} comes off, so the path is ${fmt(path.slice(0, -1))} again.`,
          hint: 'It reverses the choose line, and nothing else.',
        }
      }
      path.pop()
      emit(
        'unchoose',
        `Everything under "take ${v}" has returned. Unchoose ${v}: pop it, so path = ${fmt(path)}.`,
        i,
        {
          marks: [{ id, role: 'changed' }],
          predict: {
            tag: 'include-or-skip',
            kind: 'choice',
            prompt: `The take branch for ${v} is done and undone. What does explore(${i}) do next?`,
            options: rotate([`Skip ${v}`, `Take ${v} again`], skipAsked++ % 2),
            answer: `Skip ${v}`,
            why: `The take branch is finished. The other branch leaves ${v} out: explore(${i + 1}) with the same path.`,
            hint: 'Every number has exactly two branches.',
          },
        },
      )
    } else {
      const ghost = calls.length
      calls.push({ id: `c${ghost}`, label: `i=${i + 1} ${fmt([...path, v])}`, parent: id, state: 'pruned', saved: 0 })
      emit(
        'prune',
        `path ${fmt(path)} already holds ${plural(path.length, 'number')}, the limit. Taking ${v} would be too big, so prune that branch.`,
        i,
        { marks: [{ id: `c${ghost}`, role: 'error' }], note: { id: `c${ghost}`, text: 'over the limit' } },
      )
    }

    const skipChild = newCall(`i=${i + 1} ${fmt(path)}`, id)
    const leaf = i + 1 === n
    emit(
      'skip',
      leaf
        ? `Skip ${v}: explore(${i + 1}) is pushed with path ${fmt(path)}. Nothing is left to decide, so it is the base case.`
        : `Skip ${v}: explore(${i + 1}) is pushed with the path unchanged, ${fmt(path)}. ${v} stays out of this branch.`,
      i + 1,
      leaf ? {} : { predict: decisionPredict(i + 1) },
    )
    explore(i + 1, skipChild)
    finish(id, `${get(id).saved} saved`)
  }

  const rootId = newCall(`i=0 ${fmt(path)}`, null)
  emit(
    'init',
    `Start with an empty path and nothing saved. explore(0) is the first call: no number is decided yet.`,
    0,
    { predict: n > 0 ? decisionPredict(0) : undefined },
  )
  explore(0, rootId)

  emit(
    'done',
    `explore(0) returns. ${plural(res.length, 'subset')} found${limited ? `, each with at most ${plural(cap, 'number')}` : ': the whole power set'}.`,
    0,
    { marks: [{ id: rootId, role: 'found' }] },
  )
  return rec.done(res.map((s) => s.slice()))
}

/** Independent version: count through the bitmasks, most significant bit first. */
function reference({ nums, limit }: SubsetsInput): number[][] {
  const n = nums.length
  const out: number[][] = []
  for (let mask = (1 << n) - 1; mask >= 0; mask--) {
    const subset: number[] = []
    for (let i = 0; i < n; i++) if (mask & (1 << (n - 1 - i))) subset.push(nums[i])
    if (subset.length <= limit) out.push(subset)
  }
  return out
}

const tracer: Tracer<SubsetsInput, number[][]> = {
  id: 'recursion/subsets',
  title: 'Subsets',
  anchors: {
    init: 'Start with an empty path and call explore(0)',
    found: 'Base case: every number decided, save a copy of the path',
    prune: 'Prune: the path is full, so "take" is cut off',
    choose: 'Choose: add nums[i] to the path',
    explore: 'Explore: recurse on i + 1',
    unchoose: 'Unchoose: remove it again',
    skip: 'Skip: recurse on i + 1 without it',
    done: 'Return every subset found',
  },
  vars: [
    { name: 'i', label: 'i', role: 'ptrB' },
    { name: 'path', label: 'path', role: 'value' },
    { name: 'saved', label: 'saved', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 'nums',
        label: 'Numbers',
        kind: 'int-array',
        placeholder: 'e.g. 1, 2, 3',
        help: `Up to ${LIMITS.maxN} distinct whole numbers from ${LIMITS.min} to ${LIMITS.max}.`,
      },
      {
        name: 'limit',
        label: 'Size limit',
        kind: 'int',
        placeholder: 'e.g. 2',
        help: `Biggest subset to build, 0 to ${LIMITS.maxN}. As many as the numbers (or more) means no pruning.`,
      },
    ],
    parse: parseInput,
    format: ({ nums, limit }) => ({ nums: nums.join(', '), limit: String(limit) }),
    presets: [
      { label: 'With a limit: [1, 2, 3], size at most 2', value: { nums: [1, 2, 3], limit: 2 } },
      { label: 'LeetCode 78: [1, 2, 3], no limit', value: { nums: [1, 2, 3], limit: 3 } },
      { label: 'Two numbers: [4, 7]', value: { nums: [4, 7], limit: 2 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 1, LIMITS.maxN)
      const pool: number[] = []
      for (let v = LIMITS.min; v <= LIMITS.max; v++) pool.push(v)
      const nums: number[] = []
      for (let k = 0; k < len; k++) nums.push(pool.splice(randInt(rand, 0, pool.length - 1), 1)[0])
      const limit = rand() < 0.4 ? len : randInt(rand, 0, len)
      return { nums, limit }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
