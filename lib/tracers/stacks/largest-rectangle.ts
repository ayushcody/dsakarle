/**
 * Stacks — monotonic stack, harder: Largest Rectangle in Histogram (LeetCode 84).
 *
 * Bars have width 1. Which rectangle, resting on the floor, has the most area?
 * The stack holds the INDICES of bars that are still "open": their rectangle can
 * still stretch to the right. Heights on the stack never fall from bottom to
 * top. A shorter bar arriving closes every taller bar on top: each popped bar h
 * can extend left until the bar now under it (the new top) and right until the
 * shorter bar i, so its width is i - newTop - 1 (or i if the stack is empty).
 * After the last bar a sentinel of height 0 flushes whatever is still open.
 *
 * Scene: a column composite: `heights` (array, pointer `i`) and the stack.
 * Stack items are labelled `bar 3 · 6`: the index, then its height.
 * Marks: `focus` on the current bar, `compare` on the bar being tested or popped,
 * `discarded` on bars already closed, `found` on the best rectangle at the end.
 * The `window` bracket spans the rectangle being measured.
 *
 * Rules (anchors): init, compare (current vs top), pop (shorter: close the top
 * bar), measure (width x height, keep the best), push (current bar opens),
 * flush (sentinel height 0 after the last bar), done.
 * Predicts: `push-or-pop` on compare, `rect-width` on pop (revealed by measure).
 * Code lives in content/code/stacks/largest-rectangle.{py,java,cpp}.
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

export interface LargestRectangleInput {
  heights: number[]
}

const LIMITS: InputLimits = { maxN: 12, min: 0, max: 9 }

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<LargestRectangleInput> {
  const text = (raw.heights ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = text.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'heights', error: 'Type at least one bar height, like 2, 1, 5, 6, 2, 3.' }
  }
  if (tokens.length > LIMITS.maxN) {
    return { ok: false, field: 'heights', error: `Use at most ${LIMITS.maxN} bars so the picture stays readable.` }
  }
  const heights: number[] = []
  for (const token of tokens) {
    if (!INTEGER.test(token)) {
      return { ok: false, field: 'heights', error: `"${token}" isn't a whole number. Use digits separated by commas.` }
    }
    const v = Number(token)
    if (v < LIMITS.min || v > LIMITS.max) {
      return { ok: false, field: 'heights', error: `Keep every height between ${LIMITS.min} and ${LIMITS.max}.` }
    }
    heights.push(v)
  }
  return { ok: true, value: { heights } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const PUSH = 'Push'
const POP = 'Pop'

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many
}

function pushOrPopPredict(heights: number[], i: number, j: number, h: number, depth: number): PredictCandidate {
  const pops = heights[j] > h
  const cur = i < heights.length ? `Bar ${i} is ${h} tall` : 'The sentinel is 0 tall'
  return {
    tag: 'push-or-pop',
    kind: 'choice',
    prompt: `${cur}. The top of the stack, bar ${j}, is ${heights[j]} tall. Does the stack pop it, or push first?`,
    options: (i + depth) % 2 === 0 ? [PUSH, POP] : [POP, PUSH],
    answer: pops ? POP : PUSH,
    why: pops
      ? `${h} is shorter than ${heights[j]}, so bar ${j} cannot stretch any further right. Its rectangle is final and it leaves the stack.`
      : `${h} is not shorter than ${heights[j]}, so bar ${j} can still stretch right. Nothing pops: the new bar is pushed on top.`,
    hint: 'Pop only when the current bar is strictly shorter than the bar on top.',
  }
}

function widthPredict(i: number, j: number, height: number, left: number, depth: number): PredictCandidate {
  const width = i - left
  const options = [width, width + 1, width > 1 ? width - 1 : width + 2].map(String)
  const rotate = (i + j + depth) % 3
  const ordered = options.map((_, k) => options[(k + rotate) % 3])
  const boundary = left === 0 ? 'the left edge of the histogram' : `bar ${left - 1}, the new top`
  return {
    tag: 'rect-width',
    kind: 'choice',
    prompt: `Bar ${j} (height ${height}) just popped. How wide is the tallest rectangle that uses its full height?`,
    options: ordered,
    answer: String(width),
    why: `It runs from just after ${boundary} (bar ${left}) to bar ${i - 1}, just before the shorter bar ${i}. That is ${width} ${plural(width, 'bar', 'bars')} wide.`,
    hint: `Count bars from ${left === 0 ? 'bar 0' : `the bar after the new top`} up to the bar just left of i.`,
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ heights }: LargestRectangleInput) {
  const rec = createRecorder<number>()
  const n = heights.length

  const stack: number[] = [] // bar indices, bottom → top
  const closed = new Set<number>()
  let best = 0
  let bestRange: { start: number; end: number } | null = null
  let area: number | null = null
  let i = -1
  let top: number | null = null

  const label = (j: number): string => `bar ${j} · ${heights[j]}`

  const emit = (
    at: string,
    say: string,
    extra: {
      cells?: Array<{ index: number; role: MarkRole }>
      stackMarks?: Array<{ index: number; role: MarkRole }>
      window?: { start: number; end: number } | null
      incoming?: StackScene['incoming']
      predict?: PredictCandidate
    } = {},
  ): void => {
    const roles = new Map<number, MarkRole>()
    for (const k of closed) roles.set(k, 'discarded')
    for (const m of extra.cells ?? []) roles.set(m.index, m.role)
    const barsScene: ArrayScene = { kind: 'array', label: 'heights', cells: heights.slice() }
    if (i >= 0) barsScene.pointers = [{ name: 'i', index: i, role: 'ptrB' }]
    if (roles.size) barsScene.marks = Array.from(roles, ([index, role]) => ({ index, role }))
    if (extra.window) barsScene.window = extra.window

    const stackScene: StackScene = { kind: 'stack', label: 'stack', items: stack.map(label) }
    if (extra.stackMarks?.length) stackScene.marks = extra.stackMarks
    if (extra.incoming) stackScene.incoming = extra.incoming

    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { title: 'histogram: bar heights', scene: barsScene },
        { title: 'stack of open bars', scene: stackScene },
      ],
    }
    const vars: Record<string, Val> = {
      i: i >= 0 ? i : null,
      top,
      area,
      best,
    }
    const frame: Frame = { scene, vars, say, at }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit('init', 'best starts at 0. The stack will hold the bars whose rectangle can still stretch to the right.')

  for (i = 0; i <= n && !rec.capped; i++) {
    const sentinel = i === n
    const h = sentinel ? 0 : heights[i]
    area = null

    if (sentinel) {
      emit(
        'flush',
        `All bars seen. Add a sentinel of height 0 at index ${n}: it is shorter than every bar, so it closes all that are still open.`,
      )
    }

    let reason = '' // why the loop stopped, used by the push frame

    while (stack.length > 0 && !rec.capped) {
      const j = stack[stack.length - 1]
      top = j
      const pops = heights[j] > h

      // compare — current bar against the bar on top of the stack.
      emit(
        'compare',
        sentinel
          ? `Sentinel (0) against bar ${j}, the top of the stack (${heights[j]}). Is the sentinel shorter?`
          : `Bar ${i} is ${h}. Is it shorter than bar ${j}, the top of the stack (${heights[j]})?`,
        {
          cells: [
            ...(sentinel ? [] : [{ index: i, role: 'focus' as const }]),
            { index: j, role: 'compare' },
          ],
          stackMarks: [{ index: stack.length - 1, role: 'compare' }],
          // A sentinel that pops nothing has no push frame to reveal the answer.
          predict: sentinel && !pops ? undefined : pushOrPopPredict(heights, i, j, h, stack.length),
        },
      )
      if (rec.capped) break

      if (!pops) {
        reason = `${h} is not shorter than ${heights[j]}, so bar ${j} stays open.`
        break
      }

      // pop — bar j is closed: its rectangle can't stretch right any more.
      stack.pop()
      closed.add(j)
      top = stack.length ? stack[stack.length - 1] : null
      const left = top === null ? 0 : top + 1
      const width = i - left
      emit(
        'pop',
        `${sentinel ? '0' : h} is shorter than ${heights[j]}: pop bar ${j}. ${
          top === null ? 'Nothing is left on the stack, so it reaches the left edge.' : `Bar ${top} is now on top, so it reaches back to bar ${left}.`
        }`,
        {
          cells: sentinel ? [{ index: j, role: 'compare' }] : [{ index: i, role: 'focus' }, { index: j, role: 'compare' }],
          incoming: { value: label(j), direction: 'pop' },
          predict: widthPredict(i, j, heights[j], left, stack.length),
        },
      )
      if (rec.capped) break

      // measure — width x height, keep the best.
      area = heights[j] * width
      const improved = area > best
      if (improved) {
        best = area
        bestRange = width > 0 ? { start: left, end: i - 1 } : null
      }
      emit(
        'measure',
        `Width ${width} (bars ${left} to ${i - 1}) × height ${heights[j]} = ${area}. ${
          improved ? `That beats the old best, so best = ${best}.` : `Best stays ${best}.`
        }`,
        {
          cells: [{ index: j, role: 'compare' }, ...(sentinel ? [] : [{ index: i, role: 'focus' as const }])],
          window: { start: left, end: i - 1 },
        },
      )
    }
    if (rec.capped) break

    if (sentinel) break

    // push — the current bar opens a rectangle of its own.
    stack.push(i)
    top = i
    area = null
    emit(
      'push',
      reason ? `${reason} Push bar ${i}.` : `The stack is empty, so push bar ${i} (${h}).`,
      {
        cells: [{ index: i, role: 'focus' }],
        stackMarks: [{ index: stack.length - 1, role: 'changed' }],
      },
    )
  }

  i = -1
  top = null
  area = null
  // done — mark the winning rectangle.
  const cells: Array<{ index: number; role: MarkRole }> = []
  if (bestRange) for (let k = bestRange.start; k <= bestRange.end; k++) cells.push({ index: k, role: 'found' })
  closed.clear()
  emit(
    'done',
    bestRange
      ? `Done. The largest rectangle covers bars ${bestRange.start} to ${bestRange.end}: area ${best}.`
      : `Done. Every bar has height 0, so the largest area is ${best}.`,
    { cells, window: bestRange },
  )
  return rec.done(best)
}

/** Independent version: for every bar, stretch left and right while bars are at least as tall. */
function reference({ heights }: LargestRectangleInput): number {
  let best = 0
  for (let k = 0; k < heights.length; k++) {
    let l = k
    let r = k
    while (l > 0 && heights[l - 1] >= heights[k]) l--
    while (r < heights.length - 1 && heights[r + 1] >= heights[k]) r++
    best = Math.max(best, heights[k] * (r - l + 1))
  }
  return best
}

const tracer: Tracer<LargestRectangleInput, number> = {
  id: 'stacks/largest-rectangle',
  title: 'Largest rectangle',
  anchors: {
    init: 'Start with best = 0 and an empty stack of bar indices',
    compare: 'Is the current bar shorter than the bar on top?',
    pop: 'Yes: pop that bar. Its rectangle is final',
    measure: 'Width × height; keep the best area',
    push: 'Push the current bar: it is still open',
    flush: 'After the last bar, a height-0 sentinel closes what is left',
    done: 'Return the best area',
  },
  vars: [
    { name: 'i', label: 'current bar (i)', role: 'ptrB' },
    { name: 'top', label: 'bar on top', role: 'ptrA' },
    { name: 'area', label: 'area measured', role: 'value' },
    { name: 'best', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 'heights',
        label: 'Bar heights',
        kind: 'int-array',
        placeholder: 'e.g. 2, 1, 5, 6, 2, 3',
        help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}, one per bar.`,
      },
    ],
    parse: parseInput,
    format: ({ heights }) => ({ heights: heights.join(', ') }),
    presets: [
      { label: 'LeetCode example', value: { heights: [2, 1, 5, 6, 2, 3] } },
      { label: 'Rising staircase', value: { heights: [1, 2, 3, 4, 5] } },
      { label: 'Valley and plateau', value: { heights: [3, 3, 1, 4, 4, 4, 2] } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 3, 10)
      return { heights: Array.from({ length: len }, () => randInt(rand, 0, 9)) }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
