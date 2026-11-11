/**
 * Prefix sum — build the prefix array once, then answer range-sum queries.
 *
 * Convention used everywhere in this lesson (scenes, narration, code, quiz):
 *   prefix has n + 1 cells, prefix[0] = 0, prefix[i + 1] = prefix[i] + nums[i]
 *   sum(l..r) = prefix[r + 1] - prefix[l]
 * So prefix[i] is the sum of the first i numbers, and a query that starts at
 * index 0 needs no special case (prefix[0] is 0).
 *
 * Layout mirrors the sliding-window pilot:
 *   1. input type, parsing and presets
 *   2. frame helpers (narration / predicts)
 *   3. `run` — the real algorithm, recording one frame per idea
 *   4. `reference` — a boring brute force the tests compare against
 *
 * Code lives in content/code/prefix-sum/range-sum.{py,java,cpp} (LeetCode 303,
 * class NumArray); each rule below is an anchor in all three files.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  ArrayScene,
  CompositeScene,
  Frame,
  InputLimits,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

/** A query is the inclusive index range [l, r]. */
export interface RangeQuery {
  l: number
  r: number
}

export interface RangeSumInput {
  nums: number[]
  queries: RangeQuery[]
}

export interface RangeSumResult {
  /** The N + 1 prefix array: prefix[0] = 0. */
  prefix: number[]
  /** One answer per query, in order. */
  answers: number[]
}

const LIMITS: InputLimits = { maxN: 10, min: -99, max: 99 }
const MAX_QUERIES = 3

const INTEGER = /^[+-]?\d+$/
const QUERY_RE = /^(\d+)\s*-\s*(\d+)$/

function parseInput(raw: Record<string, string>): ParseResult<RangeSumInput> {
  const numsText = (raw.nums ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = numsText.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'nums', error: 'Type at least one number, like 3, -1, 4, 1, 5, 9.' }
  }
  if (tokens.length > LIMITS.maxN) {
    return { ok: false, field: 'nums', error: `Use at most ${LIMITS.maxN} numbers so both rows stay readable.` }
  }
  const nums: number[] = []
  for (const token of tokens) {
    if (!INTEGER.test(token)) {
      return { ok: false, field: 'nums', error: `"${token.slice(0, 12)}" isn't a whole number. Use digits separated by commas.` }
    }
    const value = Number(token)
    if (value < LIMITS.min || value > LIMITS.max) {
      return { ok: false, field: 'nums', error: `Keep every number between ${LIMITS.min} and ${LIMITS.max}.` }
    }
    nums.push(value)
  }

  // Queries are written like "2-4, 0-1": left index, dash, right index.
  const parts = (raw.queries ?? '')
    .replace(/[−–]/g, '-')
    .split(/[,;]+/)
    .map((p) => p.trim())
    .filter((p) => p !== '')
  if (parts.length === 0) {
    return { ok: false, field: 'queries', error: 'Type at least one query, like 2-4 (left index, dash, right index).' }
  }
  if (parts.length > MAX_QUERIES) {
    return { ok: false, field: 'queries', error: `Use at most ${MAX_QUERIES} queries, separated by commas.` }
  }
  const queries: RangeQuery[] = []
  for (const part of parts) {
    const match = QUERY_RE.exec(part)
    if (!match) {
      return { ok: false, field: 'queries', error: `"${part.slice(0, 12)}" isn't a query. Write it like 2-4: left index, dash, right index.` }
    }
    const l = Number(match[1])
    const r = Number(match[2])
    if (r >= nums.length) {
      return {
        ok: false,
        field: 'queries',
        error: `Index ${r} is too big. You gave ${nums.length} numbers, so indices run 0 to ${nums.length - 1}.`,
      }
    }
    if (l > r) {
      return { ok: false, field: 'queries', error: `In ${l}-${r} the left index comes after the right one. Write the smaller first.` }
    }
    queries.push({ l, r })
  }
  return { ok: true, value: { nums, queries } }
}

function formatQueries(queries: RangeQuery[]): string {
  return queries.map((q) => `${q.l}-${q.r}`).join(', ')
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

/** Negative numbers in brackets so "+ -1" and "− -3" never appear. */
function term(v: number): string {
  return v < 0 ? `(${v})` : `${v}`
}

/** Three distinct options in a rotating order, so the right answer's position varies. */
function rotate<T>(items: T[], by: number): T[] {
  const shift = ((by % items.length) + items.length) % items.length
  return [...items.slice(shift), ...items.slice(0, shift)]
}

/** What goes into prefix[i + 1]? Distractors: just the new number, or the old total unchanged. */
function nextPrefixPredict(prev: number, value: number, i: number): PredictCandidate {
  const answer = prev + value
  const options: string[] = [String(answer)]
  for (const wrong of [value, prev, prev - value, answer + 1, answer - 1]) {
    if (options.length === 3) break
    if (!options.includes(String(wrong))) options.push(String(wrong))
  }
  return {
    tag: 'next-prefix',
    kind: 'choice',
    prompt: `prefix[${i}] is ${prev} and nums[${i}] is ${value}. What goes into prefix[${i + 1}]?`,
    options: rotate(options, i),
    answer: String(answer),
    why: `Each prefix cell is the total so far: the old total ${prev} plus the new number ${term(value)} makes ${answer}.`,
    hint: 'A prefix cell keeps everything added so far, not just the latest number.',
  }
}

function ref(l: number, r: number): { right: string; left: string } {
  return { right: `prefix[${r + 1}]`, left: `prefix[${l}]` }
}

/** Which two prefix cells give sum(l..r)? The classic off-by-one, as a choice. */
function whichCellsPredict(l: number, r: number): PredictCandidate {
  const good = `prefix[${r + 1}] − prefix[${l}]`
  const options = [good, `prefix[${r}] − prefix[${l}]`, `prefix[${r + 1}] − prefix[${l + 1}]`]
  return {
    tag: 'which-cells',
    kind: 'choice',
    prompt: `To get sum(${l}..${r}), which two prefix cells do we subtract?`,
    options: rotate(options, l + r),
    answer: good,
    why: `prefix[${r + 1}] holds everything up to index ${r}. prefix[${l}] holds everything before index ${l}, so the difference is exactly ${l}..${r}.`,
    hint: `prefix[i] is the sum of the first i numbers. Which cell includes index ${r} but nothing after it?`,
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums, queries }: RangeSumInput) {
  const rec = createRecorder<RangeSumResult>()
  const n = nums.length

  // Working state — mirrors the variables in the code files.
  const prefix: Array<number | null> = Array.from({ length: n + 1 }, () => null)
  const answers: number[] = []

  /** Record one frame: a column of `nums` and `prefix`. */
  const emit = (
    at: string,
    say: string,
    opts: {
      i?: number | null
      l?: number | null
      r?: number | null
      sum?: number | null
      numsPointers?: ArrayScene['pointers']
      numsWindow?: ArrayScene['window']
      numsMarks?: ArrayScene['marks']
      numsNotes?: ArrayScene['annotations']
      prefixMarks?: ArrayScene['marks']
      predict?: PredictCandidate
    } = {},
  ): void => {
    const numsPart: ArrayScene = { kind: 'array', label: 'nums', cells: nums.slice() }
    if (opts.numsPointers?.length) numsPart.pointers = opts.numsPointers
    numsPart.window = opts.numsWindow ?? null
    if (opts.numsMarks?.length) numsPart.marks = opts.numsMarks
    if (opts.numsNotes?.length) numsPart.annotations = opts.numsNotes

    const prefixPart: ArrayScene = { kind: 'array', label: 'prefix', cells: prefix.slice() }
    if (opts.prefixMarks?.length) prefixPart.marks = opts.prefixMarks

    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { title: 'nums', scene: numsPart },
        { title: 'prefix', scene: prefixPart },
      ],
    }
    const vars: Record<string, Val> = {
      i: opts.i ?? null,
      l: opts.l ?? null,
      r: opts.r ?? null,
      answer: opts.sum ?? null,
    }
    const frame: Frame = { scene, vars, say, at }
    if (opts.predict) frame.predict = opts.predict
    rec.frame(frame)
  }

  // init — one extra cell at the front: nothing added yet, so the total is 0.
  prefix[0] = 0
  emit(
    'init',
    'Start prefix with 0: before any number is added, the total is 0. That extra cell is why l = 0 needs no special case.',
    {
      prefixMarks: [{ index: 0, role: 'changed' }],
      predict: n > 0 ? nextPrefixPredict(0, nums[0], 0) : undefined,
    },
  )

  // build — prefix[i + 1] = prefix[i] + nums[i], one cell per number.
  for (let i = 0; i < n && !rec.capped; i++) {
    const prev = prefix[i] as number
    prefix[i + 1] = prev + nums[i]
    const last = i === n - 1
    emit(
      'build',
      `prefix[${i + 1}] = prefix[${i}] + nums[${i}] = ${prev} + ${term(nums[i])} = ${prefix[i + 1]}.`,
      {
        i,
        numsPointers: [{ name: 'i', index: i, role: 'ptrB' }],
        numsMarks: [{ index: i, role: 'focus' }],
        prefixMarks: [
          { index: i, role: 'compare' },
          { index: i + 1, role: 'changed' },
        ],
        predict: last ? whichCellsPredict(queries[0].l, queries[0].r) : nextPrefixPredict(prefix[i + 1] as number, nums[i + 1], i + 1),
      },
    )
  }

  // query — sum(l..r) = prefix[r + 1] - prefix[l]: two lookups, one subtraction.
  const done = prefix.map((v) => v as number)
  for (let q = 0; q < queries.length && !rec.capped; q++) {
    const { l, r } = queries[q]
    const cells = ref(l, r)
    const high = done[r + 1]
    const low = done[l]
    const sum = high - low
    answers.push(sum)
    const base = {
      l,
      r,
      numsPointers: [
        { name: 'l', index: l, role: 'ptrA' as const },
        { name: 'r', index: r, role: 'ptrB' as const },
      ],
      numsWindow: { start: l, end: r },
    }

    emit('query', `sum(${l}..${r}): take ${cells.right} = ${high} and ${cells.left} = ${low}.`, {
      ...base,
      prefixMarks: [
        { index: l, role: 'compare' },
        { index: r + 1, role: 'compare' },
      ],
    })

    const nextQuery = queries[q + 1]
    const why =
      l === 0
        ? `${high} − ${term(low)} = ${sum}. prefix[0] is 0, so a query from index 0 needs no special case.`
        : `${high} − ${term(low)} = ${sum}. Subtracting ${cells.left} cancels everything before index ${l}.`
    const foundMarks: NonNullable<ArrayScene['marks']> = []
    for (let k = l; k <= r; k++) foundMarks.push({ index: k, role: 'found' })
    emit('query', why, {
      ...base,
      sum,
      numsMarks: foundMarks,
      numsNotes: [{ target: 'window', text: `sum ${sum}` }],
      prefixMarks: [
        { index: l, role: 'compare' },
        { index: r + 1, role: 'compare' },
      ],
      predict: nextQuery ? whichCellsPredict(nextQuery.l, nextQuery.r) : undefined,
    })
  }

  return rec.done({ prefix: done, answers })
}

/** Independent brute force: add every query's numbers up from scratch. */
function reference({ nums, queries }: RangeSumInput): RangeSumResult {
  const prefix = [0]
  for (const value of nums) prefix.push(prefix[prefix.length - 1] + value)
  const answers = queries.map(({ l, r }) => {
    let total = 0
    for (let i = l; i <= r; i++) total += nums[i]
    return total
  })
  return { prefix, answers }
}

const tracer: Tracer<RangeSumInput, RangeSumResult> = {
  id: 'prefix-sum/range-sum',
  title: 'Range sum queries',
  anchors: {
    init: 'Start prefix with a 0 in front',
    build: 'prefix[i + 1] = prefix[i] + nums[i]',
    query: 'sum(l..r) = prefix[r + 1] − prefix[l]',
  },
  vars: [
    { name: 'i', role: 'ptrB' },
    { name: 'l', role: 'ptrA' },
    { name: 'r', role: 'ptrB' },
    { name: 'answer', label: 'sum(l..r)', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 'nums',
        label: 'Numbers',
        kind: 'int-array',
        placeholder: 'e.g. 3, -1, 4, 1, 5, 9',
        help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}.`,
      },
      {
        name: 'queries',
        label: 'Queries',
        kind: 'string',
        placeholder: 'e.g. 2-4, 0-1',
        help: `Up to ${MAX_QUERIES} ranges like 2-4 (left index, dash, right index), separated by commas. Indices start at 0 and are inclusive.`,
      },
    ],
    parse: parseInput,
    format: ({ nums, queries }) => ({ nums: nums.join(', '), queries: formatQueries(queries) }),
    presets: [
      {
        label: 'Three queries, one from index 0',
        value: { nums: [3, -1, 4, 1, 5, 9], queries: [{ l: 2, r: 4 }, { l: 0, r: 1 }, { l: 3, r: 5 }] },
      },
      {
        label: 'Whole array and a single cell',
        value: { nums: [1, 2, 3, 4, 5], queries: [{ l: 0, r: 4 }, { l: 2, r: 2 }] },
      },
      {
        label: 'Negatives and a zero',
        value: { nums: [5, -2, -3, 4, 0, 7], queries: [{ l: 1, r: 2 }, { l: 0, r: 5 }, { l: 3, r: 4 }] },
      },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 4, LIMITS.maxN)
      const nums = Array.from({ length: len }, () => randInt(rand, -9, 20))
      const count = randInt(rand, 1, MAX_QUERIES)
      const queries: RangeQuery[] = Array.from({ length: count }, () => {
        const a = randInt(rand, 0, len - 1)
        const b = randInt(rand, 0, len - 1)
        return { l: Math.min(a, b), r: Math.max(a, b) }
      })
      return { nums, queries }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
