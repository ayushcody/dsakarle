/**
 * Arrays — delete the number at index i (sliding everything after it left).
 *
 * Mirror image of arrays/insert: the numbers after the doomed one are copied
 * one slot to the left, first one first, then the last slot is cleared. Layout
 * follows the pilot tracer:
 *   1. input type, parsing and presets
 *   2. frame helpers (predicts)
 *   3. `run` — records one frame per idea
 *   4. `reference` — splice
 *
 * Scene model: `cells` is the array at its full length (capacity n). A slot a
 * number has just left is drawn empty (null): the gap travels right until it
 * reaches the last slot, which is then cleared and no longer counted in `size`.
 * Code lives in content/code/arrays/delete.{py,java,cpp}.
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

export interface DeleteInput {
  nums: number[]
  index: number
}

const LIMITS: InputLimits = { maxN: 12, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<DeleteInput> {
  const numsText = (raw.nums ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = numsText.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'nums', error: 'Type at least one number, like 7, 3, 9, 4, 1.' }
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
      return { ok: false, field: 'nums', error: `Keep every number between ${LIMITS.min} and ${LIMITS.max}.` }
    }
    nums.push(value)
  }

  const indexText = (raw.index ?? '').replace(/[−–]/g, '-').trim()
  if (indexText === '') return { ok: false, field: 'index', error: 'Type the index to delete, like 1.' }
  if (!INTEGER.test(indexText)) {
    return { ok: false, field: 'index', error: `The index must be a whole number, not "${indexText}".` }
  }
  const index = Number(indexText)
  if (index < 0 || index >= nums.length) {
    return {
      ok: false,
      field: 'index',
      error: `Index ${index} doesn't exist. With ${nums.length} number${nums.length === 1 ? '' : 's'}, use 0 to ${nums.length - 1}.`,
    }
  }
  return { ok: true, value: { nums, index } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

function howManyShiftPredict(answer: number, slips: number[], index: number): PredictCandidate {
  const wrong: number[] = []
  for (const slip of slips) {
    if (slip >= 0 && slip !== answer && !wrong.includes(slip) && wrong.length < 2) wrong.push(slip)
  }
  const options = [answer, ...wrong].sort((a, b) => a - b).map(String)
  return {
    tag: 'how-many-shift',
    kind: 'choice',
    prompt: `Deleting index ${index} leaves a hole. How many numbers must slide left to close it?`,
    options,
    answer: String(answer),
    why:
      answer === 0
        ? 'It is the last number, so nothing sits after it and nothing has to slide.'
        : `Every number after index ${index} slides one slot left: ${plural(answer, 'number')}.`,
    hint: 'Count the numbers that sit after the deleted one.',
  }
}

function whichMovesNextPredict(gap: number): PredictCandidate {
  return {
    tag: 'which-moves-next',
    kind: 'cell',
    prompt: `Slot ${gap} is free. Which number slides into it next?`,
    answer: gap + 1,
    why: 'The number just right of the gap slides in. Working from the front means nothing is overwritten.',
    hint: 'Which neighbour of the empty slot has not moved yet?',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums, index }: DeleteInput) {
  const rec = createRecorder<number[]>()
  const n = nums.length
  const last = n - 1
  const moves = last - index
  const doomed = nums[index]

  // Working state — mirrors the variables in the code files.
  const slots: Array<number | null> = nums.slice()
  let size = n

  const emit = (
    at: string,
    say: string,
    extra: {
      j?: number
      window?: ArrayScene['window']
      marks?: ArrayScene['marks']
      annotations?: ArrayScene['annotations']
      predict?: PredictCandidate
    } = {},
  ): void => {
    const scene: ArrayScene = {
      kind: 'array',
      label: 'nums',
      cells: slots.slice(),
      window: extra.window ?? null,
      pointers: [{ name: 'i', index, role: 'ptrA' }],
    }
    if (extra.j !== undefined) scene.pointers!.push({ name: 'j', index: extra.j, role: 'ptrB' })
    if (extra.marks?.length) scene.marks = extra.marks
    if (extra.annotations?.length) scene.annotations = extra.annotations
    const vars: Record<string, Val> = { size, i: index, j: extra.j ?? null, last }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: size, max: n, label: 'Slots in use' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit('init', `Delete ${doomed} at index ${index}. The last number is at index ${last}.`, {
    marks: [{ index, role: 'discarded' }],
    predict: howManyShiftPredict(moves, [n, index, moves + 1, moves - 1], index),
  })

  // for j from i to last - 1: nums[j] = nums[j + 1]
  let moved = 0
  for (let j = index; j < last && !rec.capped; j++) {
    const mover = slots[j + 1] as number
    slots[j] = mover
    slots[j + 1] = null
    moved++
    const remaining = j + 2 <= last ? { start: j + 2, end: last } : null
    emit(
      'shift',
      moved === 1
        ? `Slide ${mover} from index ${j + 1} into index ${j}, covering the ${doomed} we are deleting.`
        : `Slide ${mover} from index ${j + 1} into index ${j}. Slot ${j + 1} is free now.`,
      {
        j,
        window: remaining,
        marks: [{ index: j, role: 'changed' }],
        annotations: [
          moved === 1
            ? { target: `cell:${index}`, text: `${plural(moves, 'number')} to slide` }
            : { target: `cell:${j}`, text: `${moved} of ${moves} moved` },
        ],
        predict: j + 1 < last ? whichMovesNextPredict(j + 1) : undefined,
      },
    )
  }

  slots[last] = null
  size = n - 1
  emit('clear', `The last slot is spare now, so the size drops from ${n} to ${size}.`, {
    marks: [{ index: last, role: 'discarded' }],
  })

  const result = slots.slice(0, size) as number[]
  emit(
    'done',
    result.length === 0
      ? `Done. ${doomed} is gone and the array is empty.`
      : `Done. ${doomed} is gone, the array holds ${plural(size, 'number')}, and ${plural(moves, 'number')} slid left.`,
  )

  return rec.done(result)
}

/** Independent version: build the new array with slices. */
function reference({ nums, index }: DeleteInput): number[] {
  return [...nums.slice(0, index), ...nums.slice(index + 1)]
}

const tracer: Tracer<DeleteInput, number[]> = {
  id: 'arrays/delete',
  title: 'Delete at an index',
  anchors: {
    init: 'Find the last index',
    shift: 'Slide nums[j + 1] one slot left, first number first',
    clear: 'Clear the last slot',
    done: 'The size shrinks by one',
  },
  vars: [
    { name: 'size', role: 'value' },
    { name: 'i', label: 'delete at i', role: 'ptrA' },
    { name: 'j', label: 'slot j', role: 'ptrB' },
    { name: 'last', label: 'last index', role: 'value' },
  ],
  input: {
    fields: [
      { name: 'nums', label: 'Numbers', kind: 'int-array', placeholder: 'e.g. 7, 3, 9, 4, 1', help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}.` },
      { name: 'index', label: 'Delete index', kind: 'int', placeholder: 'e.g. 1', help: 'Counting starts at 0, so the first number is index 0.' },
    ],
    parse: parseInput,
    format: ({ nums, index }) => ({ nums: nums.join(', '), index: String(index) }),
    presets: [
      { label: 'Classic: delete index 1', value: { nums: [7, 3, 9, 4, 1], index: 1 } },
      { label: 'Delete the last: nothing slides', value: { nums: [7, 3, 9, 4, 1], index: 4 } },
      { label: 'Delete the first: everything slides', value: { nums: [7, 3, 9, 4, 1], index: 0 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 3, 10)
      const nums = Array.from({ length: len }, () => randInt(rand, -9, 40))
      const index = randInt(rand, 0, len - 1)
      return { nums, index }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
