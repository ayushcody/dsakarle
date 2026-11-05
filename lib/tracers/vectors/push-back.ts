/**
 * Vectors — push_back, and what happens when the array is full.
 *
 * A vector is an array plus two numbers: `size` (slots in use) and `capacity`
 * (slots the block has). push_back writes at index `size`. When size equals
 * capacity there is no free slot, so the vector allocates a new block twice as
 * big, copies every element across one by one, switches to the new block and
 * only then writes. Layout follows the pilot tracer:
 *   1. input type, parsing and presets
 *   2. frame helpers (scenes, predicts)
 *   3. `run` — records one frame per idea
 *   4. `reference` — closed-form result, no simulation
 *
 * Scene model: the array scene draws the whole allocated block, `capacity`
 * slots, with null for a slot that is allocated but unused. While the vector
 * moves house, a composite column shows the old block above the new one.
 * Code lives in content/code/vectors/push-back.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  ArrayScene,
  Frame,
  InputLimits,
  ParseResult,
  PredictCandidate,
  Scene,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface PushBackInput {
  /** Values pushed one at a time, in order. */
  nums: number[]
  /** Capacity of the empty vector before the first push. */
  capacity: number
}

export interface PushBackResult {
  /** The elements in the vector at the end (size of them). */
  items: number[]
  /** Capacity at the end. */
  capacity: number
  /** How many element copies all the resizes cost in total. */
  copies: number
}

/** `maxN` is the number of pushes. Capacity is a separate, smaller range. */
const LIMITS: InputLimits = { maxN: 12, min: -99, max: 99 }
const CAPACITY_MIN = 1
const CAPACITY_MAX = 4

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<PushBackInput> {
  const numsText = (raw.nums ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = numsText.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'nums', error: 'Type at least one number to push, like 7, 3, 5, 8.' }
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

  const capacityText = (raw.capacity ?? '').replace(/[−–]/g, '-').trim()
  if (capacityText === '') {
    return { ok: false, field: 'capacity', error: `Type a starting capacity from ${CAPACITY_MIN} to ${CAPACITY_MAX}.` }
  }
  if (!INTEGER.test(capacityText)) {
    return { ok: false, field: 'capacity', error: `The capacity must be a whole number, not "${capacityText}".` }
  }
  const capacity = Number(capacityText)
  if (capacity < CAPACITY_MIN || capacity > CAPACITY_MAX) {
    return { ok: false, field: 'capacity', error: `Start with a capacity from ${CAPACITY_MIN} to ${CAPACITY_MAX} slots.` }
  }
  return { ok: true, value: { nums, capacity } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

type Cells = Array<number | null>

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

function pushes(count: number): string {
  return `${count} ${count === 1 ? 'push' : 'pushes'}`
}

function copiesText(count: number): string {
  return `${count} ${count === 1 ? 'copy' : 'copies'}`
}

/** One block of memory: `capacity` slots, null where nothing is stored. */
function blockScene(cells: Cells, label: string, extra: Partial<ArrayScene> = {}): ArrayScene {
  return { kind: 'array', label, cells: cells.slice(), ...extra }
}

/** The old block above the new one, drawn while the elements are being copied. */
function moveScene(
  oldCells: Cells,
  newCells: Cells,
  extra: { i?: number; annotation?: string } = {},
): Scene {
  const oldPart = blockScene(oldCells, 'data')
  const newPart = blockScene(newCells, 'bigger')
  if (extra.i !== undefined) {
    const i = extra.i
    oldPart.pointers = [{ name: 'i', index: i, role: 'ptrB' }]
    newPart.pointers = [{ name: 'i', index: i, role: 'ptrB' }]
    oldPart.marks = [
      ...Array.from({ length: i }, (_, k) => ({ index: k, role: 'visited' as const })),
      { index: i, role: 'focus' },
    ]
    newPart.marks = [{ index: i, role: 'changed' }]
    if (extra.annotation) newPart.annotations = [{ target: `cell:${i}`, text: extra.annotation }]
  }
  return {
    kind: 'composite',
    layout: 'column',
    parts: [
      { title: `Old array, capacity ${oldCells.length}`, scene: oldPart },
      { title: `New array, capacity ${newCells.length} (2×)`, scene: newPart },
    ],
  }
}

const STRAIGHT_IN = 'Write it straight in'

function growOption(newCapacity: number): string {
  return `Grow to capacity ${newCapacity}, copy, then write`
}

function roomOrResizePredict(size: number, capacity: number, newCapacity: number, value: number): PredictCandidate {
  const full = size === capacity
  return {
    tag: 'room-or-resize',
    kind: 'choice',
    prompt: `Size ${size}, capacity ${capacity}. Push ${value} — what happens?`,
    options: [STRAIGHT_IN, growOption(newCapacity)],
    answer: full ? growOption(newCapacity) : STRAIGHT_IN,
    why: full
      ? `All ${capacity} slots are taken, so index ${size} is not in the block. The vector must move to a bigger one first.`
      : `Slot ${size} is free, so ${value} goes straight in. Nothing is copied.`,
    hint: 'Compare size with capacity. Is there a free slot?',
  }
}

/** Up to three distinct counts, sorted, one of them right. The others are the usual slips. */
function copiesPredict(answer: number, slips: number[], why: string): PredictCandidate {
  const wrong: number[] = []
  for (const slip of slips) {
    if (slip >= 0 && slip !== answer && !wrong.includes(slip) && wrong.length < 2) wrong.push(slip)
  }
  const options = [answer, ...wrong].sort((a, b) => a - b).map(String)
  return {
    tag: 'copies',
    kind: 'choice',
    prompt: 'How many numbers get copied?',
    options,
    answer: String(answer),
    why,
    hint: 'Each number that is in the vector now has to be carried over once.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums, capacity: startCapacity }: PushBackInput) {
  const rec = createRecorder<PushBackResult>()
  const n = nums.length

  // Working state — mirrors the fields in the code files.
  let capacity = startCapacity
  let data: Cells = Array.from({ length: capacity }, () => null)
  let size = 0
  let copies = 0
  let value: number | null = null
  let i: number | null = null

  const emit = (
    at: string,
    say: string,
    extra: {
      scene?: Scene
      marks?: ArrayScene['marks']
      annotations?: ArrayScene['annotations']
      predict?: PredictCandidate
    } = {},
  ): void => {
    let scene: Scene
    if (extra.scene) {
      scene = extra.scene
    } else {
      const single = blockScene(data, 'data', { pointers: [{ name: 'size', index: size, role: 'ptrA' }] })
      if (extra.marks?.length) single.marks = extra.marks
      if (extra.annotations?.length) single.annotations = extra.annotations
      scene = single
    }
    const vars: Record<string, Val> = { size, capacity, copies, value, i }
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

  emit(
    'init',
    `An empty vector: capacity ${capacity}, size 0. We will push ${plural(n, 'number')}, one at a time.`,
    { annotations: [{ target: 'cell:0', text: 'allocated, empty' }] },
  )

  for (let k = 0; k < n && !rec.capped; k++) {
    value = nums[k]
    i = null
    const newCapacity = Math.max(1, 2 * capacity)

    // if size == capacity: ...
    emit('room', `Push ${value}: size is ${size}, capacity is ${capacity}. Is there a free slot?`, {
      predict: size >= capacity - 1 ? roomOrResizePredict(size, capacity, newCapacity, value) : undefined,
    })

    let resized = false
    if (size === capacity) {
      resized = true
      const oldData = data
      const bigger: Cells = Array.from({ length: newCapacity }, () => null)

      emit(
        'grow',
        `No free slot: size equals capacity. Allocate a new array with capacity ${newCapacity}, twice as big.`,
        {
          scene: moveScene(oldData, bigger),
          predict: copiesPredict(
            size,
            [newCapacity, size + 1, 1, size - 1],
            `Only the ${size} numbers stored are copied, once each. The new slots are empty, so there is nothing to copy for them.`,
          ),
        },
      )

      for (let j = 0; j < size && !rec.capped; j++) {
        bigger[j] = oldData[j]
        copies++
        i = j
        emit('copy', `Copy ${oldData[j]} from old index ${j} to new index ${j}. ${j + 1} of ${size} copied.`, {
          scene: moveScene(oldData, bigger, { i: j, annotation: `copy ${j + 1} of ${size}` }),
        })
      }

      data = bigger
      capacity = bigger.length
      i = null
      emit(
        'swap',
        `Switch to the new array and free the old one. Capacity is ${capacity} now, so ${capacity - size} slots are free.`,
        { annotations: [{ target: `cell:${size}`, text: 'spare room' }] },
      )
    }

    // data[size] = value; size += 1
    data[size] = value
    size++
    emit(
      'write',
      resized
        ? `Write ${value} at index ${size - 1}. Size is ${size}, capacity is ${capacity}. That push cost ${size} steps.`
        : `Slot ${size - 1} is free, so ${value} goes straight in. Size is ${size}, capacity is ${capacity}.`,
      { marks: [{ index: size - 1, role: 'changed' }] },
    )
  }

  value = null
  i = null
  emit(
    'done',
    copies === 0
      ? `${pushes(n)}, no copies: the capacity was enough. Growing only costs something when the vector is full.`
      : `${pushes(n)}, ${copiesText(copies)} in total. That is under 2 × ${n} = ${2 * n}, so a push costs O(1) on average.`,
    { marks: Array.from({ length: size }, (_, k) => ({ index: k, role: 'visited' as const })) },
  )

  return rec.done({ items: data.slice(0, size) as number[], capacity, copies })
}

/**
 * Independent version, no simulation. The capacity is the first c × 2^k that
 * holds every value, and the resizes copied c + 2c + ... + final/2 = final − c.
 */
function reference({ nums, capacity }: PushBackInput): PushBackResult {
  let final = capacity
  while (final < nums.length) final *= 2
  return { items: nums.slice(), capacity: final, copies: final - capacity }
}

const tracer: Tracer<PushBackInput, PushBackResult> = {
  id: 'vectors/push-back',
  title: 'Push back (and grow)',
  anchors: {
    init: 'Start with an empty array of the given capacity',
    room: 'Is there a free slot? (size < capacity)',
    grow: 'Full: allocate a new array twice as big',
    copy: 'Copy each old element into the new array',
    swap: 'Switch to the new array, free the old one',
    write: 'Write the value at index size, then size + 1',
    done: 'Return how many copies the pushes cost',
  },
  vars: [
    { name: 'size', role: 'ptrA' },
    { name: 'capacity', role: 'value' },
    { name: 'copies', label: 'copies so far', role: 'best' },
    { name: 'value', label: 'value to push', role: 'focus' },
    { name: 'i', label: 'copy index i', role: 'ptrB' },
  ],
  input: {
    fields: [
      { name: 'nums', label: 'Numbers to push', kind: 'int-array', placeholder: 'e.g. 7, 3, 5, 8, 9, 2', help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}, pushed one at a time.` },
      { name: 'capacity', label: 'Starting capacity', kind: 'int', placeholder: 'e.g. 4', help: `Slots in the empty vector, ${CAPACITY_MIN} to ${CAPACITY_MAX}. Real vectors often start at 0 and grow to 1 first.` },
    ],
    parse: parseInput,
    format: ({ nums, capacity }) => ({ nums: nums.join(', '), capacity: String(capacity) }),
    presets: [
      { label: 'Fill up, then one doubling', value: { nums: [7, 3, 5, 8, 9, 2], capacity: 4 } },
      { label: 'Start at 1: grows 1, 2, 4, 8, 16', value: { nums: [5, 2, 8, 1, 9, 4, 7, 3, 6], capacity: 1 } },
      { label: 'Exactly fits: nothing is copied', value: { nums: [4, 1, 6, 2], capacity: 4 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const capacity = randInt(rand, CAPACITY_MIN, CAPACITY_MAX)
      const len = randInt(rand, 2, 12)
      const nums = Array.from({ length: len }, () => randInt(rand, -9, 40))
      return { nums, capacity }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
