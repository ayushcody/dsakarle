/**
 * Greedy — merge intervals, framed as LeetCode 56 Merge Intervals.
 *
 * Sort by start, then sweep once. The last interval in the output is the only
 * one a new interval can touch: if the next one starts at or before its end it
 * overlaps, so stretch that end (to the larger of the two ends); otherwise it
 * starts a new output interval.
 *
 * Touching intervals DO merge here: [1,2] and [2,3] become [1,3]. That is the
 * LeetCode 56 rule, so the test is `start <= last end`. (Interval scheduling
 * treats touching as non-overlapping; this lesson treats it as joined.)
 *
 * Input format matches interval-scheduling ("1-3, 2-6, 8-10" or "[[1,3],[2,6]]").
 * Code lives in content/code/greedy/merge-intervals.{py,java,cpp}.
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

export interface MergeIntervalsInput {
  /** Each interval is [start, end] with start < end. Order is arbitrary; duplicates are allowed. */
  intervals: Interval[]
}

export const LIMITS: InputLimits = { maxN: 8, min: 0, max: 20 }

const FORMAT_HELP = `Write each interval like 1-3, separated by commas. Whole numbers from ${LIMITS.min} to ${LIMITS.max}.`
const PAIR = /^(\d+)\s*-\s*(\d+)$/
const BRACKET_PAIR = /\[\s*(\d+)\s*,\s*(\d+)\s*\]/g

function parseInput(raw: Record<string, string>): ParseResult<MergeIntervalsInput> {
  const text = (raw.intervals ?? '').replace(/[−–—]/g, '-').trim() // typographic dashes
  const pairs: Array<[string, string]> = []

  if (text.includes('[')) {
    // LeetCode style: [[1,3],[2,6]]
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

const MERGE_IT = 'Merge it'
const NEW_ONE = 'Start a new one'

const show = ([start, end]: Interval): string => `${start}–${end}`

/** Asked on the check frame: does the next interval overlap (or touch) the last merged one? */
function mergeOrNewPredict(iv: Interval, lastEnd: number): PredictCandidate {
  const [start] = iv
  const merge = start <= lastEnd
  return {
    tag: 'merge-or-new',
    kind: 'choice',
    prompt: `The last merged interval ends at ${lastEnd}. Next is ${show(iv)}, which starts at ${start}. Merge or start a new interval?`,
    options: [MERGE_IT, NEW_ONE],
    answer: merge ? MERGE_IT : NEW_ONE,
    why: merge
      ? start === lastEnd
        ? `${show(iv)} starts at ${start}, exactly where the last one ends. Touching counts, so merge.`
        : `${show(iv)} starts at ${start}, before ${lastEnd}, so the two overlap. Merge them.`
      : `${show(iv)} starts at ${start}, after ${lastEnd}, so there is a gap. It starts a new interval.`,
    hint: 'Compare its start with the last merged end.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ intervals }: MergeIntervalsInput) {
  const rec = createRecorder<Interval[]>()
  const n = intervals.length

  // Stable sort by start, the same as the code files.
  const sorted: Interval[] = intervals.map(([s, e]): Interval => [s, e]).sort((a, b) => a[0] - b[0])
  const alreadySorted = sorted.every((iv, k) => iv[0] === intervals[k][0] && iv[1] === intervals[k][1])

  // Working state, mirroring the variables in the code files.
  let merged: Interval[] = []
  let i: number | null = null

  const emit = (
    at: string,
    cells: Interval[],
    say: string,
    extra: {
      /** Cell in the input row being looked at. */
      current?: number
      /** Input cells already swept (index < this). */
      swept?: number
      /** Output cell to highlight as the compare target / the changed one. */
      mergedMarks?: NonNullable<ArrayScene['marks']>
      inputMarks?: NonNullable<ArrayScene['marks']>
      inputNote?: string
      mergedNote?: string
      showMerged?: boolean
      allFound?: boolean
      predict?: PredictCandidate
    } = {},
  ): void => {
    const input: ArrayScene = { kind: 'array', label: 'intervals', cells: cells.map(show) }
    const marks: NonNullable<ArrayScene['marks']> = []
    if (extra.swept !== undefined) {
      for (let k = 0; k < extra.swept; k++) marks.push({ index: k, role: 'visited' })
    }
    if (extra.current !== undefined) marks.push({ index: extra.current, role: 'focus' })
    for (const m of extra.inputMarks ?? []) marks.push(m)
    if (marks.length) input.marks = marks
    if (extra.current !== undefined) input.pointers = [{ name: 'i', index: extra.current, role: 'focus' }]
    if (extra.inputNote !== undefined && extra.current !== undefined) {
      input.annotations = [{ target: `cell:${extra.current}`, text: extra.inputNote }]
    }

    const out: ArrayScene = {
      kind: 'array',
      label: 'merged',
      cells: merged.length ? merged.map(show) : [null],
    }
    const outMarks: NonNullable<ArrayScene['marks']> = [...(extra.mergedMarks ?? [])]
    if (extra.allFound) merged.forEach((_, k) => outMarks.push({ index: k, role: 'found' }))
    if (outMarks.length) out.marks = outMarks
    if (extra.mergedNote !== undefined && merged.length) {
      out.annotations = [{ target: `cell:${merged.length - 1}`, text: extra.mergedNote }]
    }

    const parts: Array<{ title?: string; scene: ArrayScene }> = [{ title: 'Sorted by start', scene: input }]
    if (extra.showMerged !== false) parts.push({ title: 'Merged so far', scene: out })

    const vars: Record<string, Val> = {
      i,
      last_end: merged.length ? merged[merged.length - 1][1] : '—',
      merged: merged.map(show),
    }
    const frame: Frame = {
      scene: { kind: 'composite', layout: 'column', parts },
      vars,
      say,
      at,
      gauge: { value: extra.swept ?? 0, max: n, label: 'Intervals swept' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  const order = sorted.map(show).join(', ')
  if (alreadySorted) {
    emit('sort', sorted, `Sort by start time. These are already in order: ${order}.`, { showMerged: false })
  } else {
    emit('sort', intervals, 'Rule one: sort the intervals by start time, so overlaps sit next to each other. Here they are as given.', {
      showMerged: false,
    })
    emit('sort', sorted, `Sorted by start: ${order}. Anything that overlaps is now a neighbour.`, {
      showMerged: false,
      inputMarks: sorted.map((_, k) => ({ index: k, role: 'changed' as const })),
    })
  }

  // Take the first interval as the start of the output.
  i = 0
  merged = [[sorted[0][0], sorted[0][1]]]
  emit('start', sorted, `Take ${show(sorted[0])} as the first merged interval. Everything after it will join it or follow it.`, {
    current: 0,
    swept: 1,
    mergedMarks: [{ index: 0, role: 'changed' }],
    mergedNote: `ends at ${sorted[0][1]}`,
  })

  for (let k = 1; k < n && !rec.capped; k++) {
    i = k
    const iv = sorted[k]
    const [start, end] = iv
    const last = merged[merged.length - 1]
    const lastEnd = last[1]

    emit('check', sorted, `Look at ${show(iv)}. It starts at ${start}; the last merged interval ends at ${lastEnd}.`, {
      current: k,
      swept: k,
      inputNote: `start ${start} ${start <= lastEnd ? '≤' : '>'} last end ${lastEnd}`,
      mergedMarks: [{ index: merged.length - 1, role: 'compare' }],
      mergedNote: `last end = ${lastEnd}`,
      predict: mergeOrNewPredict(iv, lastEnd),
    })
    if (rec.capped) break

    if (start <= lastEnd) {
      const before = show(last)
      last[1] = Math.max(lastEnd, end)
      const grew = last[1] > lastEnd
      const why = start === lastEnd ? `${show(iv)} touches the last interval at ${start}, so they join.` : `${show(iv)} overlaps ${before}.`
      emit(
        'extend',
        sorted,
        grew
          ? `${why} Stretch the end from ${lastEnd} to ${last[1]}: merged is now ${show(last)}.`
          : `${why} It ends at ${end}, inside ${before}, so the end stays ${lastEnd}.`,
        {
          current: k,
          swept: k + 1,
          mergedMarks: grew ? [{ index: merged.length - 1, role: 'changed' }] : [{ index: merged.length - 1, role: 'compare' }],
          mergedNote: `end = max(${lastEnd}, ${end}) = ${last[1]}`,
        },
      )
    } else {
      merged.push([start, end])
      emit('push', sorted, `${show(iv)} starts at ${start}, after ${lastEnd}. A gap, so start a new merged interval.`, {
        current: k,
        swept: k + 1,
        mergedMarks: [{ index: merged.length - 1, role: 'changed' }],
        mergedNote: `new: ${show(iv)}`,
      })
    }
  }

  i = null
  emit('done', sorted, `Done. ${n} intervals merged into ${merged.length}: ${merged.map(show).join(', ')}.`, {
    swept: n,
    allFound: true,
  })

  return rec.done(merged.map(([s, e]): Interval => [s, e]))
}

/**
 * Independent boring check: keep joining any two intervals that overlap or
 * touch until no pair does, then list what is left ordered by start.
 */
function reference({ intervals }: MergeIntervalsInput): Interval[] {
  let pool: Interval[] = intervals.map(([s, e]): Interval => [s, e])
  let changed = true
  while (changed) {
    changed = false
    outer: for (let a = 0; a < pool.length; a++) {
      for (let b = a + 1; b < pool.length; b++) {
        if (pool[a][0] <= pool[b][1] && pool[b][0] <= pool[a][1]) {
          const joined: Interval = [Math.min(pool[a][0], pool[b][0]), Math.max(pool[a][1], pool[b][1])]
          pool = pool.filter((_, k) => k !== a && k !== b)
          pool.push(joined)
          changed = true
          break outer
        }
      }
    }
  }
  return pool.sort((x, y) => x[0] - y[0])
}

const tracer: Tracer<MergeIntervalsInput, Interval[]> = {
  id: 'greedy/merge-intervals',
  title: 'Merge intervals (sort by start)',
  anchors: {
    sort: 'Sort the intervals by start time',
    start: 'Take the first interval as the first merged one',
    check: 'Does it start at or before the last merged end?',
    extend: 'Yes: overlap, so stretch the last end to the larger end',
    push: 'No: a gap, so start a new merged interval',
    done: 'Return the merged list',
  },
  vars: [
    { name: 'i', role: 'focus' },
    { name: 'last_end', role: 'best' },
    { name: 'merged', role: 'value' },
  ],
  input: {
    fields: [
      {
        name: 'intervals',
        label: 'Intervals',
        kind: 'string',
        placeholder: 'e.g. 1-3, 2-6, 8-10',
        help: `Up to ${LIMITS.maxN} intervals, each written start-end with the start smaller. Numbers from ${LIMITS.min} to ${LIMITS.max}. Touching intervals like 1-2 and 2-3 merge.`,
      },
    ],
    parse: parseInput,
    format: ({ intervals }) => ({ intervals: intervals.map(([s, e]) => `${s}-${e}`).join(', ') }),
    presets: [
      { label: 'Overlaps and gaps', value: { intervals: [[8, 10], [1, 3], [2, 6], [17, 20], [15, 18]] } },
      { label: 'Touching ends join', value: { intervals: [[1, 2], [2, 3], [3, 4], [6, 7]] } },
      { label: 'One long interval swallows the rest', value: { intervals: [[1, 10], [2, 3], [4, 5], [6, 7], [12, 14]] } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const n = randInt(rand, 1, LIMITS.maxN)
      const intervals: Interval[] = []
      for (let k = 0; k < n; k++) {
        const start = randInt(rand, 0, LIMITS.max - 1)
        intervals.push([start, Math.min(LIMITS.max, start + randInt(rand, 1, 6))])
      }
      return { intervals }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
