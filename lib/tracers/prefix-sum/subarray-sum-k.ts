/**
 * Prefix sum + hash map — count the subarrays that sum to k (LeetCode 560).
 *
 * Keep a running sum (the prefix sum so far) and a map from "running sum seen
 * earlier" to "how many times". A stretch ending at i sums to k exactly when
 * some earlier running sum equals running - k, so each i is one lookup.
 *
 * The scene draws the map as a small teaching hash table: 5 buckets, key = a
 * running sum (it can be negative), bucket = ((sum % 5) + 5) % 5. The bucket
 * arithmetic is a picture; the code files use the language's own map.
 *
 * Code lives in content/code/prefix-sum/subarray-sum-k.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  ArrayScene,
  CompositeScene,
  Frame,
  HashMapScene,
  InputLimits,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface SubarraySumKInput {
  nums: number[]
  k: number
}

/** Number of buckets in the picture. */
const M = 5

const LIMITS: InputLimits = { maxN: 10, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<SubarraySumKInput> {
  const numsText = (raw.nums ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = numsText.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'nums', error: 'Type at least one number, like 2, -3, 4, 1, -2, 3.' }
  }
  if (tokens.length > LIMITS.maxN) {
    return { ok: false, field: 'nums', error: `Use at most ${LIMITS.maxN} numbers so the picture stays readable.` }
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

  const kText = (raw.k ?? '').replace(/[−–]/g, '-').trim()
  if (kText === '') return { ok: false, field: 'k', error: 'Type the target sum k, like 3.' }
  if (!INTEGER.test(kText)) return { ok: false, field: 'k', error: `k must be a whole number, not "${kText.slice(0, 12)}".` }
  const k = Number(kText)
  if (k < LIMITS.min || k > LIMITS.max) {
    return { ok: false, field: 'k', error: `Keep k between ${LIMITS.min} and ${LIMITS.max}.` }
  }
  return { ok: true, value: { nums, k } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

/** The bucket a sum lives in. Plain `%` can be negative, so shift it back into 0..M-1. */
function bucketOf(sum: number): number {
  return ((sum % M) + M) % M
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many
}

/** Is `need` in the map? A yes/no decision, asked right after the running sum changes. */
function seenItPredict(running: number, k: number, need: number, seenCount: number): PredictCandidate {
  const found = seenCount > 0
  return {
    tag: 'seen-it',
    kind: 'choice',
    prompt: `Running sum ${running}, k = ${k}: is ${need} in the map?`,
    options: ['Yes', 'No'],
    answer: found ? 'Yes' : 'No',
    why: found
      ? `${need} was a running sum earlier, so the stretch since then adds up to ${running} − ${need} = ${k}.`
      : `No earlier running sum equals ${need}, so no stretch ending here adds up to ${k}.`,
    hint: `A stretch sums to k when two running sums differ by k. Look for ${running} − ${k}.`,
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums, k }: SubarraySumKInput) {
  const rec = createRecorder<number>()
  const n = nums.length

  // Working state — mirrors the variables in the code files.
  const seen = new Map<number, number>() // running sum -> times seen (insertion order = chain order)
  let running = 0
  let count = 0
  let i = -1
  let need: number | null = null
  let explainedNegative = false

  /** The map as bucket chains: [sum, times seen] pairs, oldest first. */
  const chains = (): Array<Array<[number, number]>> => {
    const out: Array<Array<[number, number]>> = Array.from({ length: M }, () => [])
    seen.forEach((times, sum) => out[bucketOf(sum)].push([sum, times]))
    return out
  }

  const emit = (
    at: string,
    say: string,
    opts: {
      hashing?: number | null
      mapMarks?: HashMapScene['marks']
      mapNotes?: HashMapScene['annotations']
      numsMarks?: ArrayScene['marks']
      numsNotes?: ArrayScene['annotations']
      pointer?: boolean
      predict?: PredictCandidate
    } = {},
  ): void => {
    const numsPart: ArrayScene = { kind: 'array', label: 'nums', cells: nums.slice() }
    if (opts.pointer !== false) numsPart.pointers = [{ name: 'i', index: i, role: 'ptrB' }]
    const visited: NonNullable<ArrayScene['marks']> = []
    for (let c = 0; c < i; c++) visited.push({ index: c, role: 'visited' })
    const marks = [...visited, ...(opts.numsMarks ?? [])]
    if (marks.length) numsPart.marks = marks
    if (opts.numsNotes?.length) numsPart.annotations = opts.numsNotes

    const mapPart: HashMapScene = {
      kind: 'hash-map',
      buckets: chains().map((chain) => chain.map(([key, value]) => ({ key, value }))),
      hashing:
        opts.hashing === undefined || opts.hashing === null
          ? null
          : { key: opts.hashing, hash: opts.hashing, bucket: bucketOf(opts.hashing) },
    }
    if (opts.mapMarks?.length) mapPart.marks = opts.mapMarks
    if (opts.mapNotes?.length) mapPart.annotations = opts.mapNotes

    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { title: 'nums', scene: numsPart },
        { title: `seen: running sum → times`, scene: mapPart },
      ],
    }
    const vars: Record<string, Val> = { i, running, need, count }
    const frame: Frame = { scene, vars, say, at }
    if (opts.predict) frame.predict = opts.predict
    rec.frame(frame)
  }

  /** The one-time note about negative sums, added to the first frame that hashes one. */
  const negativeNote = (sum: number): string => {
    if (sum >= 0 || explainedNegative) return ''
    explainedNegative = true
    return ` Negative, so bucket = ((${sum} % ${M}) + ${M}) % ${M} = ${bucketOf(sum)}.`
  }

  // init — the empty stretch has sum 0, and it counts as one earlier running sum.
  seen.set(0, 1)
  emit(
    'init',
    'Before any number the running sum is 0. Put 0 in the map once, so a stretch that starts at index 0 can be found.',
    { mapMarks: [{ bucket: 0, slot: 0, role: 'changed' }] },
  )

  for (i = 0; i < n && !rec.capped; i++) {
    // add — extend the running sum by nums[i].
    running += nums[i]
    need = running - k
    const timesSeen = seen.get(need) ?? 0
    emit(
      'add',
      `Add nums[${i}] = ${nums[i]}. The running sum is now ${running}.`,
      {
        numsMarks: [{ index: i, role: 'changed' }],
        numsNotes: [{ target: `cell:${i}`, text: `sum ${running}` }],
        predict: seenItPredict(running, k, need, timesSeen),
      },
    )
    if (rec.capped) break

    // check — look up running - k: each earlier match is one stretch ending at i.
    const bucket = bucketOf(need)
    const note = negativeNote(need)
    let say: string
    if (timesSeen > 0) {
      count += timesSeen
      say = `Need ${need} (${running} − ${k}).${note} Seen ${timesSeen} ${plural(timesSeen, 'time', 'times')}, so +${timesSeen}. Count is ${count}.`
    } else {
      say = `Need ${need} (${running} − ${k}).${note} Bucket ${bucket} has no ${need}, so no stretch ends here.`
    }
    const slot = chains()[bucket].findIndex(([sum]) => sum === need)
    emit('check', say, {
      hashing: need,
      mapMarks: timesSeen > 0 ? [{ bucket, slot, role: 'found' }] : [{ bucket, role: 'discarded' }],
      numsMarks: [
        { index: i, role: timesSeen > 0 ? 'found' : 'focus' },
      ],
      numsNotes: [{ target: `cell:${i}`, text: `sum ${running}` }],
    })
    if (rec.capped) break

    // store — remember this running sum for the numbers that come later.
    seen.set(running, (seen.get(running) ?? 0) + 1)
    const times = seen.get(running) as number
    const storeBucket = bucketOf(running)
    const storeSlot = chains()[storeBucket].findIndex(([sum]) => sum === running)
    const storeNote = negativeNote(running)
    emit(
      'store',
      times === 1
        ? `Store ${running} in bucket ${storeBucket}: seen once.${storeNote}`
        : `Store ${running} in bucket ${storeBucket}: seen ${times} times now.${storeNote}`,
      {
        hashing: running,
        mapMarks: [{ bucket: storeBucket, slot: storeSlot, role: 'changed' }],
        numsMarks: [{ index: i, role: 'visited' }],
      },
    )
  }

  i = n - 1
  need = null
  emit(
    'done',
    count === 0
      ? `Done: no stretch of nums adds up to ${k}.`
      : `Done: ${count} ${plural(count, 'stretch', 'stretches')} of nums add${count === 1 ? 's' : ''} up to ${k}.`,
    { pointer: false },
  )
  return rec.done(count)
}

/** Independent brute force: try every start and end and add the numbers up. */
function reference({ nums, k }: SubarraySumKInput): number {
  let count = 0
  for (let start = 0; start < nums.length; start++) {
    let total = 0
    for (let end = start; end < nums.length; end++) {
      total += nums[end]
      if (total === k) count++
    }
  }
  return count
}

const tracer: Tracer<SubarraySumKInput, number> = {
  id: 'prefix-sum/subarray-sum-k',
  title: 'Subarrays that sum to k',
  anchors: {
    init: 'Start with running = 0, and 0 seen once',
    add: 'Add nums[i] to the running sum',
    check: 'Look up running − k: each match is one stretch',
    store: 'Remember this running sum in the map',
    done: 'Return the count',
  },
  vars: [
    { name: 'i', role: 'ptrB' },
    { name: 'running', label: 'running sum', role: 'value' },
    { name: 'need', label: 'need = running − k', role: 'focus' },
    { name: 'count', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 'nums',
        label: 'Numbers',
        kind: 'int-array',
        placeholder: 'e.g. 2, -3, 4, 1, -2, 3',
        help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}. Negatives are fine.`,
      },
      {
        name: 'k',
        label: 'Target sum (k)',
        kind: 'int',
        placeholder: 'e.g. 3',
        help: 'Count the stretches of neighbouring numbers that add up to exactly k.',
      },
    ],
    parse: parseInput,
    format: ({ nums, k }) => ({ nums: nums.join(', '), k: String(k) }),
    presets: [
      { label: 'With negatives: four stretches', value: { nums: [2, -3, 4, 1, -2, 3], k: 3 } },
      { label: 'Zeros pile up', value: { nums: [0, 0, 0, 0], k: 0 } },
      { label: 'Longer run', value: { nums: [3, 4, 7, 2, -3, 1, 4, 2], k: 7 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 4, LIMITS.maxN)
      const nums = Array.from({ length: len }, () => randInt(rand, -5, 9))
      const k = randInt(rand, -3, 10)
      return { nums, k }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
