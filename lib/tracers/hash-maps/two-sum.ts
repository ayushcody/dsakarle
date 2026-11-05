/**
 * Hash maps — Two Sum (LeetCode 1) with a "seen" map.
 *
 * Walk the array once. For each number work out what partner it needs
 * (`target - nums[i]`) and look for that partner among the numbers already seen.
 * If it is there, that is the answer; if not, remember this number and move on.
 *
 * Scene: a column composite. The array sits on top with a pointer `i`; below it
 * is the `seen` map drawn as the same 5-bucket chained table as put-get
 * (bucket = value % 5, entry = value -> index). Reusing real buckets, rather
 * than one box per key, lets the lookup frame show the idea of the lesson:
 * hash the number you need and look in that one bucket only. Values are 0..99,
 * so `value % 5` is easy to follow; a partner below zero cannot be stored, and
 * the narration says so instead of hashing a negative number.
 *
 * Layout matches the sliding-window tracers: input, frame helpers, `run`,
 * `reference`. Code lives in content/code/hash-maps/two-sum.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  ArrayScene,
  CompositeScene,
  Frame,
  HashEntry,
  HashMapScene,
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

export interface TwoSumInput {
  nums: number[]
  target: number
}

/** Buckets in the `seen` map; the bucket of a value is `value % 5`. */
const M = 5

const LIMITS: InputLimits = { maxN: 8, min: 0, max: 99 }
const TARGET_MAX = 198

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<TwoSumInput> {
  const numsText = (raw.nums ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = numsText.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'nums', error: 'Type at least one number, like 8, 3, 2, 4, 6.' }
  }
  if (tokens.length > LIMITS.maxN) {
    return { ok: false, field: 'nums', error: `Use at most ${LIMITS.maxN} numbers so the picture stays readable.` }
  }
  const nums: number[] = []
  for (const token of tokens) {
    if (!INTEGER.test(token)) {
      return { ok: false, field: 'nums', error: `"${token}" isn't a whole number. Use digits separated by commas.` }
    }
    const value = Number(token)
    if (value < LIMITS.min || value > LIMITS.max) {
      return {
        ok: false,
        field: 'nums',
        error: `Keep every number between ${LIMITS.min} and ${LIMITS.max}, so it fits the buckets (value % ${M}).`,
      }
    }
    nums.push(value)
  }

  const targetText = (raw.target ?? '').replace(/[−–]/g, '-').trim()
  if (targetText === '') return { ok: false, field: 'target', error: 'Type a target sum, like 9.' }
  if (!INTEGER.test(targetText)) {
    return { ok: false, field: 'target', error: `The target must be a whole number, not "${targetText}".` }
  }
  const target = Number(targetText)
  if (target < 0 || target > TARGET_MAX) {
    return { ok: false, field: 'target', error: `Keep the target between 0 and ${TARGET_MAX}.` }
  }
  return { ok: true, value: { nums, target } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const YES = 'Yes'
const NO = 'No'

function seenItPredict(
  nums: number[],
  target: number,
  i: number,
  need: number,
  partner: number | undefined,
): PredictCandidate {
  const x = nums[i]
  const inMap = partner !== undefined
  return {
    tag: 'seen-it',
    kind: 'choice',
    prompt: `Need ${target} − ${x} = ${need}. Is ${need} in the map?`,
    options: [YES, NO],
    answer: inMap ? YES : NO,
    why: inMap
      ? `${need} was stored from index ${partner}, so ${nums[partner]} + ${x} = ${target}.`
      : need < 0
        ? `Every number we store is 0 or more, so ${need} can never be in the map. ${x} waits for a later partner.`
        : `Nothing stored equals ${need} yet, so ${x} goes into the map to wait for a later partner.`,
    hint: 'Only the numbers before this one are in the map. Is the one we need among them?',
  }
}

function bucketOf(value: number): number {
  return value % M
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums, target }: TwoSumInput) {
  const rec = createRecorder<number[]>()
  const n = nums.length

  // Working state — mirrors the variables in the code files.
  const seen = new Map<number, number>() // value -> index; Map keeps first-insertion order, like a chain
  let answer: number[] = []

  /** The seen map as 5 chained buckets, derived from `seen` so the two can never disagree. */
  const chains = (): Array<Array<{ key: number; value: number }>> => {
    const out: Array<Array<{ key: number; value: number }>> = Array.from({ length: M }, () => [])
    seen.forEach((index, value) => out[bucketOf(value)].push({ key: value, value: index }))
    return out
  }

  const emit = (
    i: number,
    at: string,
    say: string,
    extra: {
      /** Roles for array cells beyond the default "everything before i is visited". */
      cellMarks?: Array<{ index: number; role: MarkRole }>
      pointer?: boolean
      need?: number | null
      hashing?: { key: number } | null
      mapMarks?: HashMapScene['marks']
      mapNotes?: HashMapScene['annotations']
      predict?: PredictCandidate
    } = {},
  ): void => {
    const array: ArrayScene = { kind: 'array', label: 'nums', cells: nums.slice() }
    if (extra.pointer !== false && i >= 0) array.pointers = [{ name: 'i', index: i, role: 'ptrB' }]
    const roles = new Map<number, MarkRole>()
    for (let k = 0; k < i; k++) roles.set(k, 'visited')
    for (const m of extra.cellMarks ?? []) roles.set(m.index, m.role)
    const marks = Array.from(roles, ([index, role]) => ({ index, role }))
    if (marks.length) array.marks = marks

    const map: HashMapScene = {
      kind: 'hash-map',
      buckets: chains().map((chain): HashEntry[] => chain.map((e) => ({ key: e.key, value: e.value }))),
      hashing: extra.hashing ? { key: extra.hashing.key, hash: extra.hashing.key, bucket: bucketOf(extra.hashing.key) } : null,
    }
    if (extra.mapMarks?.length) map.marks = extra.mapMarks
    if (extra.mapNotes?.length) map.annotations = extra.mapNotes

    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { title: 'nums', scene: array },
        { title: 'seen: number → index', scene: map },
      ],
    }
    const vars: Record<string, Val> = {
      target,
      i: i >= 0 ? i : null,
      need: extra.need ?? null,
      answer: answer.length ? answer.slice() : null,
    }
    const frame: Frame = { scene, vars, say, at }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit(
    -1,
    'init',
    `We want two numbers that add up to ${target}. The seen map starts empty. It will hold each number and its index.`,
  )

  let foundAt = -1
  for (let i = 0; i < n && !rec.capped; i++) {
    const x = nums[i]
    const need = target - x
    const partner = seen.get(need)

    // need — what partner would finish the pair?
    emit(i, 'need', `Index ${i} holds ${x}. To make ${target} we need ${target} − ${x} = ${need}.`, {
      cellMarks: [{ index: i, role: 'focus' }],
      need,
      predict: seenItPredict(nums, target, i, need, partner),
    })
    if (rec.capped) break

    // check — hash the number we need and look in that one bucket only.
    if (need < 0) {
      emit(i, 'check', `${need} is below zero, and every stored number is 0 or more, so it can't be in the map.`, {
        cellMarks: [{ index: i, role: 'focus' }],
        need,
      })
    } else {
      const b = bucketOf(need)
      const chain = chains()[b]
      const slot = chain.findIndex((e) => e.key === need)
      const found = partner !== undefined
      const say = found
        ? `Look only in bucket ${b}: ${need} is there, stored from index ${partner}.`
        : chain.length === 0
          ? `Look only in bucket ${b}: it is empty, so ${need} was never seen.`
          : `Look only in bucket ${b}: it holds ${chain.length} other ${chain.length === 1 ? 'number' : 'numbers'}, but not ${need}.`
      emit(i, 'check', say, {
        cellMarks: [{ index: i, role: 'focus' }],
        need,
        hashing: { key: need },
        mapMarks: found ? [{ bucket: b, slot, role: 'compare' }] : [{ bucket: b, role: 'focus' }],
      })
    }
    if (rec.capped) break

    if (partner !== undefined) {
      // found — the stored partner and this number are the pair.
      answer = [partner, i]
      foundAt = i
      const b = bucketOf(need)
      const slot = chains()[b].findIndex((e) => e.key === need)
      emit(i, 'found', `${nums[partner]} + ${x} = ${target}, so indices ${partner} and ${i} are the pair.`, {
        cellMarks: [
          { index: partner, role: 'found' },
          { index: i, role: 'found' },
        ],
        need,
        mapMarks: [{ bucket: b, slot, role: 'found' }],
      })
      break
    }

    // store — remember this number so a later number can find it.
    const b = bucketOf(x)
    const before = chains()[b]
    const existed = seen.has(x)
    seen.set(x, i)
    const after = chains()[b]
    const slot = after.findIndex((e) => e.key === x)
    const say = existed
      ? `${x} is already stored, so update its index to ${i}.`
      : before.length === 0
        ? `No partner yet, so store ${x} → index ${i} in bucket ${b}.`
        : `No partner yet. Store ${x} → index ${i} in bucket ${b}, chained after ${before[before.length - 1].key}.`
    emit(i, 'store', say, {
      cellMarks: [{ index: i, role: 'visited' }],
      need,
      hashing: { key: x },
      mapMarks: [{ bucket: b, slot, role: 'changed' }],
      mapNotes: !existed && before.length > 0 ? [{ target: `bucket:${b}`, text: 'chained' }] : undefined,
    })
  }

  if (answer.length) {
    emit(
      foundAt,
      'done',
      `Done — return [${answer[0]}, ${answer[1]}]: ${nums[answer[0]]} + ${nums[answer[1]]} = ${target}.`,
      {
        pointer: false,
        cellMarks: [
          { index: answer[0], role: 'found' },
          { index: answer[1], role: 'found' },
        ],
      },
    )
  } else {
    emit(n - 1, 'done', `Done — no two numbers add up to ${target}, so the answer is empty.`, {
      pointer: false,
      cellMarks: nums.map((_, index) => ({ index, role: 'visited' as const })),
    })
  }
  return rec.done(answer)
}

/**
 * Independent brute force: for each j in order, look back over earlier indices
 * (nearest first, matching the map's "latest index wins" for repeated values).
 */
function reference({ nums, target }: TwoSumInput): number[] {
  for (let j = 0; j < nums.length; j++) {
    for (let i = j - 1; i >= 0; i--) {
      if (nums[i] + nums[j] === target) return [i, j]
    }
  }
  return []
}

const tracer: Tracer<TwoSumInput, number[]> = {
  id: 'hash-maps/two-sum',
  title: 'Two Sum',
  anchors: {
    init: 'Start with an empty seen map',
    need: 'Work out the partner we need: target − nums[i]',
    check: 'Look for that partner in seen',
    store: 'Not seen: remember nums[i] → i',
    found: 'Seen it: that is the pair',
    done: 'Return the pair (or nothing)',
  },
  vars: [
    { name: 'target', role: 'value' },
    { name: 'i', role: 'ptrB' },
    { name: 'need', label: 'need = target − nums[i]', role: 'value' },
    { name: 'answer', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 'nums',
        label: 'Numbers',
        kind: 'int-array',
        placeholder: 'e.g. 8, 3, 2, 4, 6',
        help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}.`,
      },
      { name: 'target', label: 'Target sum', kind: 'int', placeholder: 'e.g. 9', help: `The sum a pair must reach. Between 0 and ${TARGET_MAX}.` },
    ],
    parse: parseInput,
    format: ({ nums, target }) => ({ nums: nums.join(', '), target: String(target) }),
    presets: [
      { label: 'Find the pair', value: { nums: [8, 3, 2, 4, 6], target: 9 } },
      { label: 'Classic: 2, 7, 11, 15', value: { nums: [2, 7, 11, 15], target: 9 } },
      { label: 'No pair (not with itself)', value: { nums: [5, 1, 3, 4], target: 10 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 4, LIMITS.maxN)
      const nums = Array.from({ length: len }, () => randInt(rand, 0, 30))
      // Most runs have a real pair; some ask for a sum nobody reaches.
      let target: number
      if (rand() < 0.7) {
        const a = randInt(rand, 0, len - 1)
        let b = randInt(rand, 0, len - 2)
        if (b >= a) b++
        target = nums[a] + nums[b]
      } else {
        target = randInt(rand, 0, 60)
      }
      return { nums, target }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
