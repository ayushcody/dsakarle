/**
 * Two pointers, converging — Container With Most Water (LeetCode 11).
 *
 * Each number is the height of a wall. Two walls and the floor between them
 * hold min(height[left], height[right]) * (right - left) water. Start with the
 * widest container and always move the SHORTER wall inward (ties move right):
 * the shorter wall caps the water, and moving the taller one only shrinks the
 * width, so it can never do better.
 *
 * Scene: the heights as an array (left / right pointers, the container as the
 * window bracket) — the same plain array rendering stacks/largest-rectangle uses,
 * since there is no separate bar scene.
 * Predicts: `new-best` on measure, `which-pointer-moves` on record (same option
 * wording as pair-sum).
 * Code lives in content/code/two-pointers/container-water.{py,java,cpp}.
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

export interface ContainerWaterInput {
  heights: number[]
}

const LIMITS: InputLimits = { maxN: 10, min: 0, max: 20 }
const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<ContainerWaterInput> {
  const text = (raw.heights ?? '')
    .replace(/[−–]/g, '-')
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = text.split(/[\s,;]+/).filter((t) => t !== '')
  if (tokens.length < 2) return { ok: false, field: 'heights', error: 'Type at least two heights, like 1, 8, 6, 2, 5.' }
  if (tokens.length > LIMITS.maxN) {
    return { ok: false, field: 'heights', error: `Use at most ${LIMITS.maxN} heights so the picture stays readable.` }
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

const MOVE_LEFT = 'Move left →'
const MOVE_RIGHT = 'Move right ←'
const YES = 'Yes'
const NO = 'No'

function newBestPredict(area: number, best: number): PredictCandidate {
  return {
    tag: 'new-best',
    kind: 'choice',
    prompt: `This container holds ${area} and the best so far is ${best}. Is this a new best?`,
    options: [YES, NO],
    answer: area > best ? YES : NO,
    why:
      area > best
        ? `${area} is more than ${best}, so it becomes the best.`
        : area === best
          ? `${area} only ties ${best}. It has to be more to replace the best.`
          : `${area} is less than ${best}, so the best stays.`,
    hint: 'Bigger is better here. Compare the area with the best.',
  }
}

function whichPointerPredict(a: number, b: number): PredictCandidate {
  const leftShorter = a < b
  return {
    tag: 'which-pointer-moves',
    kind: 'choice',
    prompt: `Left wall is ${a}, right wall is ${b}. Which pointer moves?`,
    options: [MOVE_LEFT, MOVE_RIGHT],
    answer: leftShorter ? MOVE_LEFT : MOVE_RIGHT,
    why: leftShorter
      ? `The left wall (${a}) is the shorter one and caps the water. Moving the taller wall could never help, so move left.`
      : a === b
        ? `The walls are equal at ${a}. Either one caps the water; the code moves right.`
        : `The right wall (${b}) is the shorter one and caps the water. Moving the taller wall could never help, so move right.`,
    hint: 'Which wall limits the water? Move that one.',
  }
}

function run({ heights }: ContainerWaterInput) {
  const rec = createRecorder<number>()
  const n = heights.length

  // Working state — mirrors the variables in the code files.
  let left = 0
  let right = n - 1
  let best = 0
  let bestL = 0
  let bestR = 0
  let area: number | null = null

  const emit = (
    at: string,
    say: string,
    extra: {
      marks?: ArrayScene['marks']
      pointers?: boolean
      window?: ArrayScene['window']
      annotations?: ArrayScene['annotations']
      predict?: PredictCandidate
    } = {},
  ): void => {
    const scene: ArrayScene = {
      kind: 'array',
      label: 'height',
      cells: heights.slice(),
      window: extra.window !== undefined ? extra.window : { start: left, end: right },
    }
    if (extra.pointers !== false) {
      scene.pointers = [
        { name: 'left', index: left, role: 'ptrA' },
        { name: 'right', index: right, role: 'ptrB' },
      ]
    }
    if (extra.marks?.length) scene.marks = extra.marks
    if (extra.annotations?.length) scene.annotations = extra.annotations
    const vars: Record<string, Val> = { left, right, area, best }
    const frame: Frame = { scene, vars, say, at }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit('init', `Start with the widest container: left on ${heights[left]}, right on ${heights[right]}. We want the most water.`)

  while (left < right && !rec.capped) {
    const a = heights[left]
    const b = heights[right]
    const width = right - left
    area = Math.min(a, b) * width
    const ends: ArrayScene['marks'] = [
      { index: left, role: 'compare' },
      { index: right, role: 'compare' },
    ]
    emit('measure', `min(${a}, ${b}) × width ${width} = ${area}. The shorter wall caps the water.`, {
      marks: ends,
      annotations: [{ target: 'window', text: `area ${area}` }],
      predict: newBestPredict(area, best),
    })
    if (rec.capped) break

    const improved = area > best
    const say = improved
      ? best === 0
        ? `${area} is the first container, so best is ${area}.`
        : `${area} beats ${best} — the new best.`
      : area === best
        ? `${area} only ties the best of ${best}, so the earlier container stays.`
        : `${area} is less than the best of ${best}, so the best stays.`
    if (improved) {
      best = area
      bestL = left
      bestR = right
    }
    emit('record', say, {
      marks: improved
        ? [
            { index: left, role: 'found' },
            { index: right, role: 'found' },
          ]
        : ends,
      annotations: [{ target: 'window', text: `area ${area}` }],
      predict: whichPointerPredict(a, b),
    })
    if (rec.capped) break

    if (a < b) {
      const dropped = left
      left++
      emit('move-left', `The left wall ${a} is shorter than ${b}. Drop it, move left on to ${heights[left]}.`, {
        marks: [{ index: dropped, role: 'discarded' }],
      })
    } else {
      const dropped = right
      right--
      emit(
        'move-right',
        a === b
          ? `Both walls are ${a}. Drop the right one, move right back to ${heights[right]}.`
          : `The right wall ${b} is shorter than ${a}. Drop it, move right back to ${heights[right]}.`,
        { marks: [{ index: dropped, role: 'discarded' }] },
      )
    }
  }

  emit('done', `The pointers met. The most water any container holds is ${best}, between heights ${heights[bestL]} and ${heights[bestR]}.`, {
    pointers: false,
    window: { start: bestL, end: bestR },
    marks: [
      { index: bestL, role: 'found' },
      { index: bestR, role: 'found' },
    ],
  })
  return rec.done(best)
}

/** Independent brute force: try every pair of walls. */
function reference({ heights }: ContainerWaterInput): number {
  let best = 0
  for (let i = 0; i < heights.length; i++) {
    for (let j = i + 1; j < heights.length; j++) {
      best = Math.max(best, Math.min(heights[i], heights[j]) * (j - i))
    }
  }
  return best
}

const tracer: Tracer<ContainerWaterInput, number> = {
  id: 'two-pointers/container-water',
  title: 'Container with most water',
  anchors: {
    init: 'Put left at the start and right at the end',
    measure: 'Area = shorter wall × width',
    record: 'Keep the largest area',
    'move-left': 'Left wall is shorter: move left forward',
    'move-right': 'Right wall is shorter (or equal): move right back',
    done: 'Return the largest area',
  },
  vars: [
    { name: 'left', role: 'ptrA' },
    { name: 'right', role: 'ptrB' },
    { name: 'area', role: 'value' },
    { name: 'best', label: 'most water', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 'heights',
        label: 'Wall heights',
        kind: 'int-array',
        placeholder: 'e.g. 1, 8, 6, 2, 5, 4, 8, 3, 7',
        help: `2 to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}.`,
      },
    ],
    parse: parseInput,
    format: ({ heights }) => ({ heights: heights.join(', ') }),
    presets: [
      { label: 'Classic: nine walls', value: { heights: [1, 8, 6, 2, 5, 4, 8, 3, 7] } },
      { label: 'Two walls only', value: { heights: [1, 1] } },
      { label: 'Tall walls close together', value: { heights: [4, 3, 2, 1, 4] } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 3, LIMITS.maxN)
      return { heights: Array.from({ length: len }, () => randInt(rand, 1, 15)) }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
