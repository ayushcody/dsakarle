/**
 * Greedy — interval scheduling, framed as LeetCode 435 Non-overlapping Intervals.
 *
 * Keeping the most non-overlapping intervals means always taking the one that
 * ends earliest. So: sort by end, then sweep once, keeping an interval when it
 * starts at or after `last_end` (touching ends are fine) and dropping it
 * otherwise. The result is the LeetCode answer: the minimum number removed.
 *
 * Each cell is an interval drawn as "start–end". Kept intervals are marked
 * `found`, dropped ones `discarded`. Code lives in
 * content/code/greedy/interval-scheduling.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  ArrayScene,
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

export type Interval = [start: number, end: number]

export interface IntervalSchedulingInput {
  /** Each interval is [start, end] with start < end. Order is arbitrary; duplicates are allowed. */
  intervals: Interval[]
}

export const LIMITS: InputLimits = { maxN: 8, min: 0, max: 99 }

const FORMAT_HELP = `Write each interval like 1-3, separated by commas. Whole numbers from ${LIMITS.min} to ${LIMITS.max}.`
const PAIR = /^(\d+)\s*-\s*(\d+)$/
const BRACKET_PAIR = /\[\s*(\d+)\s*,\s*(\d+)\s*\]/g

function parseInput(raw: Record<string, string>): ParseResult<IntervalSchedulingInput> {
  const text = (raw.intervals ?? '').replace(/[−–—]/g, '-').trim() // typographic dashes
  const pairs: Array<[string, string]> = []

  if (text.includes('[')) {
    // LeetCode style: [[1,2],[2,3]]
    for (const match of text.matchAll(BRACKET_PAIR)) pairs.push([match[1], match[2]])
    const leftover = text.replace(BRACKET_PAIR, '').replace(/[\s,[\]]/g, '')
    if (leftover !== '') {
      return { ok: false, field: 'intervals', error: `That doesn't look like intervals. ${FORMAT_HELP}` }
    }
  } else {
    for (const token of text.split(/[,;]+/).map((t) => t.trim()).filter((t) => t !== '')) {
      const match = PAIR.exec(token)
      if (!match) {
        return { ok: false, field: 'intervals', error: `"${token}" isn't an interval. ${FORMAT_HELP}` }
      }
      pairs.push([match[1], match[2]])
    }
  }

  if (pairs.length === 0) {
    return { ok: false, field: 'intervals', error: `Type at least one interval. ${FORMAT_HELP}` }
  }
  if (pairs.length > LIMITS.maxN) {
    return { ok: false, field: 'intervals', error: `Use at most ${LIMITS.maxN} intervals so the picture stays readable.` }
  }

  const intervals: Interval[] = []
  for (const [a, b] of pairs) {
    const start = Number(a)
    const end = Number(b)
    if (start > LIMITS.max || end > LIMITS.max) {
      return { ok: false, field: 'intervals', error: `Keep every number between ${LIMITS.min} and ${LIMITS.max}.` }
    }
    if (start >= end) {
      return {
        ok: false,
        field: 'intervals',
        error: `${start}-${end} has no length. The start must be smaller than the end, like 1-3.`,
      }
    }
    intervals.push([start, end])
  }
  return { ok: true, value: { intervals } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const KEEP_IT = 'Keep it'
const DROP_IT = 'Drop it'

const show = ([start, end]: Interval): string => `${start}–${end}`

/** Asked on the check frame: does this interval overlap the last kept one? */
function keepOrDropPredict(iv: Interval, lastEnd: number): PredictCandidate {
  const [start] = iv
  const keep = start >= lastEnd
  return {
    tag: 'keep-or-drop',
    kind: 'choice',
    prompt: `The last kept interval ends at ${lastEnd}. Next is ${show(iv)}, which starts at ${start}. Keep it or drop it?`,
    options: [KEEP_IT, DROP_IT],
    answer: keep ? KEEP_IT : DROP_IT,
    why: keep
      ? `${show(iv)} starts at ${start}, not before ${lastEnd}, so it doesn't overlap anything we kept. Touching ends are fine.`
      : `${show(iv)} starts at ${start}, before ${lastEnd}, so it overlaps the interval we kept. Drop it.`,
    hint: 'Compare its start with the last end.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ intervals }: IntervalSchedulingInput) {
  const rec = createRecorder<number>()
  const n = intervals.length

  // Stable sort by end, the same as the code files.
  const sorted: Interval[] = intervals.map(([s, e]): Interval => [s, e]).sort((a, b) => a[1] - b[1])
  const alreadySorted = sorted.every((iv, k) => iv[0] === intervals[k][0] && iv[1] === intervals[k][1])

  // Working state, mirroring the variables in the code files.
  let removed = 0
  let lastEnd: number | null = null // null stands for −∞: nothing kept yet
  let i: number | null = null
  const verdict: Array<'kept' | 'dropped' | null> = sorted.map(() => null)

  const emit = (
    at: string,
    cells: Interval[],
    say: string,
    extra: {
      pointer?: boolean
      marks?: ArrayScene['marks']
      annotations?: ArrayScene['annotations']
      predict?: PredictCandidate
      decided?: number
    } = {},
  ): void => {
    const scene: ArrayScene = { kind: 'array', label: 'intervals', cells: cells.map(show) }
    if (extra.pointer && i !== null) scene.pointers = [{ name: 'i', index: i, role: 'focus' }]
    const marks: NonNullable<ArrayScene['marks']> = []
    if (at !== 'sort') {
      verdict.forEach((v, k) => {
        if (v === 'kept') marks.push({ index: k, role: 'found' })
        if (v === 'dropped') marks.push({ index: k, role: 'discarded' })
      })
    }
    for (const m of extra.marks ?? []) marks.push(m)
    if (marks.length) scene.marks = marks
    if (extra.annotations?.length) scene.annotations = extra.annotations

    const vars: Record<string, Val> = { i, last_end: lastEnd === null ? '−∞' : lastEnd, removed }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: extra.decided ?? 0, max: n, label: 'Intervals decided' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  const order = sorted.map(show).join(', ')
  if (alreadySorted) {
    emit('sort', sorted, `Sort by end time, earliest end first. These are already in order: ${order}.`)
  } else {
    emit('sort', intervals, 'Rule one: sort the intervals by end time, earliest end first. Here they are as given.')
    emit('sort', sorted, `Sorted by end: ${order}. The interval that frees you soonest goes first.`, {
      marks: sorted.map((_, k) => ({ index: k, role: 'changed' as const })),
    })
  }

  emit('init', sorted, 'Nothing is kept yet: removed = 0 and last end = −∞, so the first interval always fits.', {
    annotations: [{ target: 'cell:0', text: 'last end = −∞' }],
  })

  for (let k = 0; k < n && !rec.capped; k++) {
    i = k
    const iv = sorted[k]
    const [start, end] = iv

    emit(
      'check',
      sorted,
      lastEnd === null
        ? `Look at ${show(iv)}. Nothing is kept yet, so there is nothing for it to overlap.`
        : `Look at ${show(iv)}. It starts at ${start}; the last kept interval ends at ${lastEnd}.`,
      {
        pointer: true,
        marks: [{ index: k, role: 'compare' }],
        annotations: [
          {
            target: `cell:${k}`,
            text: lastEnd === null ? 'last end = −∞' : `start ${start} ${start >= lastEnd ? '≥' : '<'} last end ${lastEnd}`,
          },
        ],
        predict: lastEnd === null ? undefined : keepOrDropPredict(iv, lastEnd),
        decided: k,
      },
    )
    if (rec.capped) break

    if (lastEnd === null || start >= lastEnd) {
      const before: number | null = lastEnd
      lastEnd = end
      verdict[k] = 'kept'
      const why =
        before === null
          ? `Keep ${show(iv)}: nothing is in its way.`
          : start === before
            ? `Keep ${show(iv)}: it starts at ${start}, exactly when the last kept one ends. Touching is fine.`
            : `Keep ${show(iv)}: it starts at ${start}, after the last end ${before}.`
      emit('keep', sorted, `${why} last end = ${end}.`, {
        pointer: true,
        annotations: [{ target: `cell:${k}`, text: `last end = ${end}` }],
        decided: k + 1,
      })
    } else {
      removed++
      verdict[k] = 'dropped'
      emit('drop', sorted, `Drop ${show(iv)}: it starts at ${start}, before the last kept one ends at ${lastEnd}. Overlap, so removed = ${removed}.`, {
        pointer: true,
        annotations: [{ target: `cell:${k}`, text: `overlaps: ${start} < ${lastEnd}` }],
        decided: k + 1,
      })
    }
  }

  i = null
  const kept = n - removed
  emit(
    'done',
    sorted,
    `Kept ${kept} of ${n} intervals. The fewest to remove is ${removed}.`,
    { decided: n },
  )

  return rec.done(removed)
}

/**
 * Independent boring check: the most intervals that can be kept is the longest
 * chain where each starts at or after the previous one ends (quadratic DP over
 * start order). Everything else must be removed.
 */
function reference({ intervals }: IntervalSchedulingInput): number {
  const byStart = intervals.map(([s, e]): Interval => [s, e]).sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const best: number[] = []
  let longest = 0
  for (let a = 0; a < byStart.length; a++) {
    best[a] = 1
    for (let b = 0; b < a; b++) {
      if (byStart[b][1] <= byStart[a][0]) best[a] = Math.max(best[a], best[b] + 1)
    }
    longest = Math.max(longest, best[a])
  }
  return byStart.length - longest
}

const tracer: Tracer<IntervalSchedulingInput, number> = {
  id: 'greedy/interval-scheduling',
  title: 'Non-overlapping intervals (earliest end)',
  anchors: {
    sort: 'Sort the intervals by end time',
    init: 'Nothing kept yet: removed = 0, last end = −∞',
    check: 'Does it start at or after the last end?',
    keep: 'Yes: keep it and move last end to its end',
    drop: 'No: it overlaps, so drop it (removed += 1)',
    done: 'Return how many were removed',
  },
  vars: [
    { name: 'i', role: 'focus' },
    { name: 'last_end', role: 'best' },
    { name: 'removed', role: 'value' },
  ],
  input: {
    fields: [
      {
        name: 'intervals',
        label: 'Intervals',
        kind: 'string',
        placeholder: 'e.g. 1-3, 2-4, 3-5',
        help: `Up to ${LIMITS.maxN} intervals, each written start-end with the start smaller. Numbers from ${LIMITS.min} to ${LIMITS.max}.`,
      },
    ],
    parse: parseInput,
    format: ({ intervals }) => ({ intervals: intervals.map(([s, e]) => `${s}-${e}`).join(', ') }),
    presets: [
      { label: 'LeetCode 435 example', value: { intervals: [[1, 2], [2, 3], [3, 4], [1, 3]] } },
      { label: 'A long meeting in the way', value: { intervals: [[0, 10], [1, 3], [4, 6], [7, 9]] } },
      { label: 'All the same slot', value: { intervals: [[1, 2], [1, 2], [1, 2]] } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const n = randInt(rand, 1, LIMITS.maxN)
      const intervals: Interval[] = []
      for (let k = 0; k < n; k++) {
        const start = randInt(rand, 0, 70)
        intervals.push([start, Math.min(LIMITS.max, start + randInt(rand, 1, 20))])
      }
      return { intervals }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
