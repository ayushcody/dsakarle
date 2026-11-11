/**
 * Arrays — insert a value at index i (shifting everything after it right).
 *
 * The array has a fixed capacity, n + 2 slots, and holds n numbers. To open a
 * gap at index i the numbers from the end are copied one slot to the right,
 * last one first, so nothing is overwritten. Layout follows the pilot tracer:
 *   1. input type, parsing and presets
 *   2. frame helpers (predicts)
 *   3. `run` — records one frame per idea
 *   4. `reference` — splice
 *
 * Scene model: `cells` is the array's n numbers plus the one free slot that
 * is about to be used (null), and `capacity` draws the one spare slot beyond
 * that. A slot a number has just left is drawn empty (null): it is the gap that
 * travels left until it reaches index i.
 * Code lives in content/code/arrays/insert.{py,java,cpp}.
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

export interface InsertInput {
  nums: number[]
  index: number
  value: number
}

/** maxN 10: the array needs spare room, and scenes stay within 12 slots. */
const LIMITS: InputLimits = { maxN: 10, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<InsertInput> {
  const numsText = (raw.nums ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = numsText.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'nums', error: 'Type at least one number, like 7, 3, 9, 4, 1.' }
  }
  if (tokens.length > LIMITS.maxN) {
    return { ok: false, field: 'nums', error: `Use at most ${LIMITS.maxN} numbers: the array needs spare room to grow.` }
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
  if (indexText === '') return { ok: false, field: 'index', error: 'Type the index to insert at, like 2.' }
  if (!INTEGER.test(indexText)) {
    return { ok: false, field: 'index', error: `The index must be a whole number, not "${indexText}".` }
  }
  const index = Number(indexText)
  if (index < 0 || index > nums.length) {
    return {
      ok: false,
      field: 'index',
      error: `Use an index from 0 to ${nums.length} (${nums.length} means add at the end).`,
    }
  }

  const valueText = (raw.value ?? '').replace(/[−–]/g, '-').trim()
  if (valueText === '') return { ok: false, field: 'value', error: 'Type the number to insert, like 8.' }
  if (!INTEGER.test(valueText)) {
    return { ok: false, field: 'value', error: `The value must be a whole number, not "${valueText}".` }
  }
  const value = Number(valueText)
  if (value < LIMITS.min || value > LIMITS.max) {
    return { ok: false, field: 'value', error: `Keep the value between ${LIMITS.min} and ${LIMITS.max}.` }
  }
  return { ok: true, value: { nums, index, value } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/** Up to three distinct counts, sorted, one of them right. The others are the usual slips. */
function howManyShiftPredict(answer: number, slips: number[], where: string): PredictCandidate {
  const wrong: number[] = []
  for (const slip of slips) {
    if (slip >= 0 && slip !== answer && !wrong.includes(slip) && wrong.length < 2) wrong.push(slip)
  }
  const options = [answer, ...wrong].sort((a, b) => a - b).map(String)
  return {
    tag: 'how-many-shift',
    kind: 'choice',
    prompt: `Putting a number ${where} means making a gap. How many numbers must move?`,
    options,
    answer: String(answer),
    why:
      answer === 0
        ? 'Nothing sits after that slot, so no number has to move.'
        : `Every number from that index to the end moves one slot right: ${plural(answer, 'number')}.`,
    hint: 'Count the numbers that sit at or after the insert position.',
  }
}

function whichMovesNextPredict(gap: number): PredictCandidate {
  return {
    tag: 'which-moves-next',
    kind: 'cell',
    prompt: `Slot ${gap} is free. Which number moves into it next?`,
    answer: gap - 1,
    why: `The number just left of the gap moves in. Working from the end means nothing is overwritten.`,
    hint: 'Which neighbour of the empty slot has not moved yet?',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums, index, value }: InsertInput) {
  const rec = createRecorder<number[]>()
  const n = nums.length
  const capacity = n + 2
  const moves = n - index

  // Working state — mirrors the variables in the code files. `slots` is the
  // array; null is a slot that is free right now.
  const slots: Array<number | null> = [...nums, null]
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
      capacity: capacity - slots.length,
      window: extra.window ?? null,
      pointers: [{ name: 'i', index, role: 'ptrA' }],
    }
    if (extra.j !== undefined) scene.pointers!.push({ name: 'j', index: extra.j, role: 'ptrB' })
    if (extra.marks?.length) scene.marks = extra.marks
    if (extra.annotations?.length) scene.annotations = extra.annotations
    const vars: Record<string, Val> = { size, i: index, j: extra.j ?? null, value }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: size, max: capacity, label: 'Slots in use' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  const where = index === n ? 'at the end' : `at index ${index}`
  emit('room', `The array has ${capacity} slots and holds ${n}, so there is room. Goal: put ${value} ${where}.`, {
    predict: howManyShiftPredict(moves, [n, index, moves + 1, moves - 1], where),
  })

  // for j from size down to i + 1: nums[j] = nums[j - 1]
  let moved = 0
  for (let j = n; j > index && !rec.capped; j--) {
    const mover = slots[j - 1] as number
    slots[j] = mover
    slots[j - 1] = null
    size = n // the size only changes once the new number is written
    moved++
    const remaining = j - 2 >= index ? { start: index, end: j - 2 } : null
    emit(
      'shift',
      `Move ${mover} from index ${j - 1} into index ${j}. Slot ${j - 1} is free now.`,
      {
        j,
        window: remaining,
        marks: [{ index: j, role: 'changed' }],
        annotations: [
          moved === 1
            ? { target: `cell:${index}`, text: `${plural(moves, 'number')} to move` }
            : { target: `cell:${j}`, text: `${moved} of ${moves} moved` },
        ],
        predict: j - 1 > index ? whichMovesNextPredict(j - 1) : undefined,
      },
    )
  }

  slots[index] = value
  size = n + 1
  emit(
    'write',
    moves === 0
      ? `Index ${index} is the free slot at the end, so ${value} goes straight in. Nothing had to move.`
      : `The gap has reached index ${index}. Write ${value} into it.`,
    {
      marks: [{ index, role: 'changed' }],
    },
  )

  const result = slots.slice(0, n + 1) as number[]
  emit('done', `Done. ${value} is at index ${index}, the array holds ${size} numbers, and ${plural(moves, 'number')} moved.`, {
    marks: [{ index, role: 'found' }],
  })

  return rec.done(result)
}

/** Independent version: build the new array with slices. */
function reference({ nums, index, value }: InsertInput): number[] {
  return [...nums.slice(0, index), value, ...nums.slice(index)]
}

const tracer: Tracer<InsertInput, number[]> = {
  id: 'arrays/insert',
  title: 'Insert at an index',
  anchors: {
    room: 'Check there is a free slot (size < capacity)',
    shift: 'Move nums[j - 1] one slot right, last number first',
    write: 'Write the new value into the gap',
    done: 'The size grows by one',
  },
  vars: [
    { name: 'size', role: 'value' },
    { name: 'i', label: 'insert at i', role: 'ptrA' },
    { name: 'j', label: 'slot j', role: 'ptrB' },
    { name: 'value', label: 'new value', role: 'best' },
  ],
  input: {
    fields: [
      { name: 'nums', label: 'Numbers', kind: 'int-array', placeholder: 'e.g. 7, 3, 9, 4, 1', help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}. The array gets 2 spare slots.` },
      { name: 'index', label: 'Insert at index', kind: 'int', placeholder: 'e.g. 2', help: 'From 0 (the front) up to the number of values (the end).' },
      { name: 'value', label: 'New value', kind: 'int', placeholder: 'e.g. 8', help: `A whole number from ${LIMITS.min} to ${LIMITS.max}.` },
    ],
    parse: parseInput,
    format: ({ nums, index, value }) => ({ nums: nums.join(', '), index: String(index), value: String(value) }),
    presets: [
      { label: 'Classic: insert 8 at index 2', value: { nums: [7, 3, 9, 4, 1], index: 2, value: 8 } },
      { label: 'At the end: nothing moves', value: { nums: [7, 3, 9, 4, 1], index: 5, value: 8 } },
      { label: 'At the front: everything moves', value: { nums: [7, 3, 9, 4, 1], index: 0, value: 8 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 3, 10)
      const nums = Array.from({ length: len }, () => randInt(rand, -9, 40))
      const index = randInt(rand, 0, len)
      const value = randInt(rand, -9, 40)
      return { nums, index, value }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
