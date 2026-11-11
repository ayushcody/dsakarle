/**
 * Greedy — Jump Game (LeetCode 55).
 *
 * Each number is how far you may jump from that cell. The greedy move is to
 * track only `reach`, the farthest index any jump so far can land on. Walk
 * left to right: if the next index is beyond `reach`, nothing can land there and
 * you are stuck; otherwise stand on it and stretch `reach` if its jump goes
 * farther. The `reach` window is drawn as a bracket over the cells.
 *
 * Layout follows binary-search/first-true. Code lives in
 * content/code/greedy/jump-game.{py,java,cpp}.
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

export interface JumpGameInput {
  /** nums[i] = the farthest you can jump from index i (0 means you can't move). */
  nums: number[]
}

export const LIMITS: InputLimits = { maxN: 12, min: 0, max: 9 }

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<JumpGameInput> {
  const text = (raw.nums ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = text.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'nums', error: 'Type at least one jump length, like 2, 3, 1, 1, 4.' }
  }
  if (tokens.length > LIMITS.maxN) {
    return { ok: false, field: 'nums', error: `Use at most ${LIMITS.maxN} jump lengths so the picture stays readable.` }
  }
  const nums: number[] = []
  for (const token of tokens) {
    if (!INTEGER.test(token)) {
      return { ok: false, field: 'nums', error: `"${token}" isn't a whole number. Use digits separated by commas.` }
    }
    const value = Number(token)
    if (value < LIMITS.min) {
      return { ok: false, field: 'nums', error: 'A jump length can be 0 or more. You cannot jump backwards here.' }
    }
    if (value > LIMITS.max) {
      return { ok: false, field: 'nums', error: `Keep every jump length between ${LIMITS.min} and ${LIMITS.max}.` }
    }
    nums.push(value)
  }
  return { ok: true, value: { nums } }
}

// ---------------------------------------------------------------------------
// Predicts
// ---------------------------------------------------------------------------

const STAY_GOING = 'Yes, we can stand there'
const STUCK = 'No, we are stuck'

/** Asked on the check frame: what does reach become after this cell's jump? */
function reachPredict(i: number, jump: number, reach: number): PredictCandidate {
  const next = Math.max(reach, i + jump)
  const pool = [next, reach, i + jump, jump, next + 1, reach + 1, next + 2, next + 3]
  const options: number[] = []
  for (const value of pool) {
    if (!options.includes(value) && options.length < 3) options.push(value)
  }
  options.sort((a, b) => a - b)
  const grew = next > reach
  return {
    tag: 'reach',
    kind: 'choice',
    prompt: `From index ${i} you can jump ${jump}, landing as far as ${i + jump}. Reach is ${reach} now. Farthest reach becomes?`,
    options: options.map(String),
    answer: String(next),
    why: grew
      ? `${i} + ${jump} = ${i + jump} is farther than ${reach}, so reach stretches to ${next}.`
      : `${i} + ${jump} = ${i + jump} is no farther than ${reach}. Reach never shrinks, so it stays ${reach}.`,
    hint: 'Keep the bigger of the old reach and where this jump lands.',
  }
}

/** Asked on the extend frame: can we stand on the next index? */
function stuckPredict(next: number, reach: number): PredictCandidate {
  const can = next <= reach
  return {
    tag: 'stuck-or-not',
    kind: 'choice',
    prompt: `Reach is ${reach}. We step to index ${next} next. Can we stand there?`,
    options: [STAY_GOING, STUCK],
    answer: can ? STAY_GOING : STUCK,
    why: can
      ? `Index ${next} is inside the reach of ${reach}, so some earlier jump lands on it or flies past it.`
      : `Index ${next} is past the reach of ${reach}. No earlier jump gets that far, so we can't stand there.`,
    hint: 'Is the next index within reach?',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums }: JumpGameInput) {
  const rec = createRecorder<boolean>()
  const n = nums.length
  const last = n - 1

  // Working state, mirroring the variables in the code files.
  let reach = 0
  let i = 0

  const emit = (
    at: string,
    say: string,
    extra: {
      marks?: ArrayScene['marks']
      annotations?: ArrayScene['annotations']
      predict?: PredictCandidate
      /** Draw the window out to the end of the array (success). */
      full?: boolean
    } = {},
  ): void => {
    const end = extra.full ? last : Math.min(reach, last)
    const scene: ArrayScene = {
      kind: 'array',
      label: 'nums',
      cells: nums.slice(),
      pointers: [{ name: 'i', index: i, role: 'focus' }],
      window: { start: 0, end },
    }
    if (extra.marks?.length) scene.marks = extra.marks
    if (extra.annotations?.length) scene.annotations = extra.annotations

    const vars: Record<string, Val> = { i, reach, last }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: Math.min(reach, last) + 1, max: n, label: 'Cells within reach' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  /** Cells already stood on: indexes below i. */
  const visitedBefore = (index: number): NonNullable<ArrayScene['marks']> =>
    Array.from({ length: index }, (_, k) => ({ index: k, role: 'visited' as const }))

  emit(
    'init',
    `Start on index 0 with reach = 0: for now index 0 is the only place we can stand. The goal is index ${last}.`,
    { annotations: [{ target: 'window', text: 'reach = 0' }] },
  )

  for (i = 0; i <= last && !rec.capped; i++) {
    if (i > reach) {
      emit(
        'stuck',
        `Index ${i} is past reach ${reach}: no jump lands there. We're stuck, so we stop looking.`,
        {
          marks: [
            ...visitedBefore(i),
            { index: i, role: 'error' },
            ...Array.from({ length: last - i }, (_, k) => ({ index: i + 1 + k, role: 'discarded' as const })),
          ],
          annotations: [
            { target: 'window', text: `reach = ${reach}` },
            { target: `cell:${i}`, text: `${i} > ${reach}` },
          ],
        },
      )
      break
    }

    const jump = nums[i]
    emit(
      'check',
      `Index ${i} is inside the reach of ${reach}, so we can stand on it. It lets us jump ${jump}.`,
      {
        marks: [...visitedBefore(i), { index: i, role: 'compare' }],
        annotations: [
          { target: 'window', text: `reach = ${reach}` },
          { target: `cell:${i}`, text: `${i} ≤ ${reach}` },
        ],
        predict: reachPredict(i, jump, reach),
      },
    )
    if (rec.capped) break

    const old = reach
    reach = Math.max(reach, i + jump)
    const grew = reach > old
    const marks: NonNullable<ArrayScene['marks']> = [...visitedBefore(i + 1)]
    if (grew) marks.push({ index: Math.min(reach, last), role: 'changed' })
    const done = reach >= last
    emit(
      'extend',
      grew
        ? `Jump ${jump} from ${i} lands as far as ${i + jump}. That beats ${old}, so reach = ${reach}.`
        : `Jump ${jump} from ${i} lands as far as ${i + jump}, no better than ${old}. Reach stays ${reach}.`,
      {
        marks,
        annotations: [
          { target: 'window', text: `reach = ${reach}` },
          { target: `cell:${i}`, text: `${i} + ${jump} = ${i + jump}` },
        ],
        predict: !done && i < last ? stuckPredict(i + 1, reach) : undefined,
      },
    )
    if (done) break
  }

  const ok = reach >= last
  const marks: NonNullable<ArrayScene['marks']> = ok
    ? [...visitedBefore(Math.min(i, last)), { index: last, role: 'found' }]
    : [
        ...visitedBefore(i),
        { index: i, role: 'error' },
        ...Array.from({ length: last - i }, (_, k) => ({ index: i + 1 + k, role: 'discarded' as const })),
      ]
  emit(
    'done',
    ok
      ? `Reach ${reach} is at least the last index ${last}, so the end can be reached. Return true.`
      : `Reach stopped at ${reach}, short of the last index ${last}. The end can't be reached. Return false.`,
    { marks, full: ok, annotations: [{ target: 'window', text: ok ? `reach = ${reach} ≥ ${last}` : `reach = ${reach} < ${last}` }] },
  )

  return rec.done(ok)
}

/** Independent boring check: mark every cell some earlier reachable cell can land on. */
function reference({ nums }: JumpGameInput): boolean {
  const n = nums.length
  const reachable: boolean[] = new Array<boolean>(n).fill(false)
  reachable[0] = true
  for (let from = 0; from < n; from++) {
    if (!reachable[from]) continue
    for (let to = from + 1; to <= from + nums[from] && to < n; to++) reachable[to] = true
  }
  return reachable[n - 1]
}

const tracer: Tracer<JumpGameInput, boolean> = {
  id: 'greedy/jump-game',
  title: 'Jump game: how far can we reach?',
  anchors: {
    init: 'Start at index 0 with reach = 0',
    check: 'Is index i inside the reach so far?',
    stuck: 'No: nothing lands on i, so we are stuck',
    extend: 'Yes: reach = max(reach, i + nums[i])',
    done: 'Reach covers the last index? Then true',
  },
  vars: [
    { name: 'i', role: 'focus' },
    { name: 'reach', role: 'best' },
    { name: 'last', role: 'value' },
  ],
  input: {
    fields: [
      {
        name: 'nums',
        label: 'Jump lengths',
        kind: 'int-array',
        placeholder: 'e.g. 3, 2, 1, 0, 4',
        help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}. nums[i] is the farthest you can jump from index i.`,
      },
    ],
    parse: parseInput,
    format: ({ nums }) => ({ nums: nums.join(', ') }),
    presets: [
      { label: 'Stuck behind the zero', value: { nums: [3, 2, 1, 0, 4] } },
      { label: 'Reaches the end', value: { nums: [2, 3, 1, 1, 4] } },
      { label: 'Hop over zeros', value: { nums: [4, 0, 0, 0, 9, 0, 0, 0] } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const n = randInt(rand, 1, LIMITS.maxN)
      const nums: number[] = []
      for (let k = 0; k < n; k++) {
        const r = rand()
        nums.push(r < 0.3 ? 0 : r < 0.85 ? randInt(rand, 1, 3) : randInt(rand, 4, LIMITS.max))
      }
      return { nums }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
