/**
 * Vectors — pop_back, and the optional shrink.
 *
 * pop_back only lowers `size`: the old value stays in its slot but is past the
 * end, so it no longer counts. Nothing is copied. Shrinking is a separate,
 * optional policy, and this lesson uses a common textbook one: when size falls
 * to a quarter of capacity or less (and capacity is at least 4), move to an
 * array half as big. Quarter, not half, so a push and a pop at the boundary
 * can't make the vector copy everything over and over.
 *
 * Be honest about the real world: C++ std::vector and Java's ArrayList do not
 * shrink on pop; CPython's list does give memory back once it is under about
 * half full. The quarter rule here is the policy the lesson teaches.
 *
 * Starting state: the vector holds the given numbers in the smallest
 * power-of-two capacity that fits them (as if it had been built by pushing
 * from capacity 1). Code lives in content/code/vectors/pop-back.{py,java,cpp}.
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

export interface PopBackInput {
  /** What the vector holds before the first pop, front to back. */
  nums: number[]
  /** How many times pop_back is called. 1..nums.length. */
  pops: number
}

export interface PopBackResult {
  /** The elements left in the vector. */
  items: number[]
  /** Capacity at the end. */
  capacity: number
  /** Elements copied by all the shrinks together. */
  copies: number
  /** Values removed, in the order they came off the back. */
  popped: number[]
}

const LIMITS: InputLimits = { maxN: 12, min: -99, max: 99 }

/** Shrink when size × SHRINK_AT ≤ capacity, and never below capacity SHRINK_AT. */
const SHRINK_AT = 4

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<PopBackInput> {
  const numsText = (raw.nums ?? '')
    .replace(/[−–]/g, '-') // typographic minus signs
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = numsText.split(/[\s,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) {
    return { ok: false, field: 'nums', error: 'Type at least one number for the vector to hold, like 7, 3, 9, 4.' }
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

  const popsText = (raw.pops ?? '').replace(/[−–]/g, '-').trim()
  if (popsText === '') return { ok: false, field: 'pops', error: 'Type how many times to pop, like 5.' }
  if (!INTEGER.test(popsText)) {
    return { ok: false, field: 'pops', error: `The number of pops must be a whole number, not "${popsText}".` }
  }
  const pops = Number(popsText)
  if (pops < 1) return { ok: false, field: 'pops', error: 'Pop at least once.' }
  if (pops > nums.length) {
    return {
      ok: false,
      field: 'pops',
      error: `You can pop at most ${nums.length} time${nums.length === 1 ? '' : 's'}: the vector only holds ${nums.length}.`,
    }
  }
  return { ok: true, value: { nums, pops } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

type Cells = Array<number | null>

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/** Smallest power of two that holds `n` values. */
function startingCapacity(n: number): number {
  let capacity = 1
  while (capacity < n) capacity *= 2
  return capacity
}

function blockScene(cells: Cells, label: string, extra: Partial<ArrayScene> = {}): ArrayScene {
  return { kind: 'array', label, cells: cells.slice(), ...extra }
}

/** The old block above the new, half-size one, drawn while the elements are being copied. */
function moveScene(
  oldCells: Cells,
  newCells: Cells,
  size: number,
  extra: { i?: number; annotation?: string } = {},
): Scene {
  const oldPart = blockScene(oldCells, 'data')
  const newPart = blockScene(newCells, 'smaller')
  // Slots past `size` hold stale values nobody counts any more.
  oldPart.marks = oldCells.flatMap((cell, index) =>
    index >= size && cell !== null ? [{ index, role: 'discarded' as const }] : [],
  )
  if (extra.i !== undefined) {
    const i = extra.i
    oldPart.pointers = [{ name: 'i', index: i, role: 'ptrB' }]
    newPart.pointers = [{ name: 'i', index: i, role: 'ptrB' }]
    oldPart.marks = [...oldPart.marks, { index: i, role: 'focus' }]
    newPart.marks = [{ index: i, role: 'changed' }]
    if (extra.annotation) newPart.annotations = [{ target: `cell:${i}`, text: extra.annotation }]
  }
  return {
    kind: 'composite',
    layout: 'column',
    parts: [
      { title: `Old array, capacity ${oldCells.length}`, scene: oldPart },
      { title: `New array, capacity ${newCells.length} (half)`, scene: newPart },
    ],
  }
}

const KEEP = 'Keep the same array'

function shrinkOption(newCapacity: number): string {
  return `Shrink to capacity ${newCapacity}`
}

function shrinkOrKeepPredict(size: number, capacity: number): PredictCandidate {
  const shrinks = size * SHRINK_AT <= capacity && capacity >= SHRINK_AT
  const limit = capacity / SHRINK_AT
  return {
    tag: 'shrink-or-keep',
    kind: 'choice',
    prompt: `After this pop: size ${size}, capacity ${capacity}. Does the vector shrink?`,
    options: [KEEP, shrinkOption(capacity / 2)],
    answer: shrinks ? shrinkOption(capacity / 2) : KEEP,
    why: shrinks
      ? `Size ${size} is at most ${capacity} ÷ ${SHRINK_AT} = ${limit}, so the array is mostly empty and it moves to a half-size one.`
      : `Size ${size} is more than ${capacity} ÷ ${SHRINK_AT} = ${limit}, so the array is not empty enough to be worth moving.`,
    hint: `The rule is size ≤ capacity ÷ ${SHRINK_AT}. Work out capacity ÷ ${SHRINK_AT} first.`,
  }
}

/** Up to three distinct counts, sorted, one of them right. The others are the usual slips. */
function copiesPredict(answer: number, slips: number[]): PredictCandidate {
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
    why: `Only the ${plural(answer, 'number')} still in use move over, once each. The popped values stay behind in the old array.`,
    hint: 'Count the numbers the vector still holds, not the slots.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums, pops }: PopBackInput) {
  const rec = createRecorder<PopBackResult>()
  const n = nums.length

  // Working state — mirrors the fields in the code files. `data` is the whole
  // allocated block. pop_back does not erase: slots past `size` keep stale values.
  let capacity = startingCapacity(n)
  let data: Cells = [...nums, ...Array.from({ length: capacity - n }, () => null)]
  let size = n
  let copies = 0
  let i: number | null = null
  const popped: number[] = []

  const emit = (
    at: string,
    say: string,
    extra: {
      scene?: Scene
      changed?: number
      predict?: PredictCandidate
    } = {},
  ): void => {
    let scene: Scene
    if (extra.scene) {
      scene = extra.scene
    } else {
      const marks: NonNullable<ArrayScene['marks']> = data.flatMap((cell, index) =>
        index >= size && cell !== null ? [{ index, role: 'discarded' as const }] : [],
      )
      if (extra.changed !== undefined) marks.push({ index: extra.changed, role: 'changed' })
      const single = blockScene(data, 'data', { pointers: [{ name: 'size', index: size, role: 'ptrA' }] })
      if (marks.length) single.marks = marks
      scene = single
    }
    const vars: Record<string, Val> = { size, capacity, copies, i }
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
    `A vector holds ${plural(n, 'number')} in ${capacity} slots. We will pop ${plural(pops, 'time')} from the back.`,
  )

  for (let k = 0; k < pops && !rec.capped; k++) {
    // size -= 1
    size--
    const value = data[size] as number
    popped.push(value)
    const nearShrink = capacity >= SHRINK_AT && size * 8 <= capacity * 3
    emit(
      'pop',
      k === 0
        ? `Pop ${value}: size drops to ${size}. The ${value} stays in its slot but is past the end, so it no longer counts.`
        : `Pop ${value}: size drops to ${size}. Nothing is erased or copied.`,
      { changed: size, predict: nearShrink ? shrinkOrKeepPredict(size, capacity) : undefined },
    )

    // if size × 4 <= capacity and capacity >= 4: ...
    const shrinks = size * SHRINK_AT <= capacity && capacity >= SHRINK_AT
    if (!shrinks) {
      emit(
        'check',
        capacity < SHRINK_AT
          ? `Capacity ${capacity} is below ${SHRINK_AT}, so the vector never shrinks this small. Keep the array.`
          : `Size ${size} is more than ${capacity} ÷ ${SHRINK_AT} = ${capacity / SHRINK_AT}, so keep the array as it is.`,
      )
      continue
    }

    emit('check', `Size ${size} is at most ${capacity} ÷ ${SHRINK_AT} = ${capacity / SHRINK_AT}: the array is mostly empty, so shrink it.`)

    const newCapacity = capacity / 2
    const oldData = data
    const smaller: Cells = Array.from({ length: newCapacity }, () => null)
    emit(
      'shrink',
      size === 0
        ? `Allocate a new array with capacity ${newCapacity}, half the old one. Nothing is left to copy.`
        : `Allocate a new array with capacity ${newCapacity}, half the old one. Then the ${plural(size, 'number')} still in use move over.`,
      {
        scene: moveScene(oldData, smaller, size),
        predict: size > 0 ? copiesPredict(size, [capacity, newCapacity, size + 1, size - 1]) : undefined,
      },
    )

    for (let j = 0; j < size && !rec.capped; j++) {
      smaller[j] = oldData[j]
      copies++
      i = j
      emit('copy', `Copy ${oldData[j]} from old index ${j} to new index ${j}. ${j + 1} of ${size} copied.`, {
        scene: moveScene(oldData, smaller, size, { i: j, annotation: `copy ${j + 1} of ${size}` }),
      })
    }

    data = smaller
    capacity = newCapacity
    i = null
    emit(
      'swap',
      `Switch to the new array and free the old one. Capacity is ${capacity} now, and ${size} of its slots are in use.`,
    )
  }

  i = null
  emit(
    'done',
    copies === 0
      ? `Done. ${plural(pops, 'pop')} left ${plural(size, 'number')} in capacity ${capacity}. No shrink happened, so nothing was copied.`
      : `Done. ${plural(pops, 'pop')} left ${plural(size, 'number')} in capacity ${capacity}. Pops are O(1); only the shrink copied ${plural(copies, 'number')}.`,
  )

  return rec.done({ items: data.slice(0, size) as number[], capacity, copies, popped })
}

/** Independent version: replay the sizes with plain arithmetic on the capacity. */
function reference({ nums, pops }: PopBackInput): PopBackResult {
  const n = nums.length
  let capacity = 1
  while (capacity < n) capacity *= 2
  let copies = 0
  for (let size = n - 1; size >= n - pops; size--) {
    if (size * SHRINK_AT <= capacity && capacity >= SHRINK_AT) {
      copies += size
      capacity /= 2
    }
  }
  return {
    items: nums.slice(0, n - pops),
    capacity,
    copies,
    popped: nums.slice(n - pops).reverse(),
  }
}

const tracer: Tracer<PopBackInput, PopBackResult> = {
  id: 'vectors/pop-back',
  title: 'Pop back (and shrink)',
  anchors: {
    init: 'Start with a vector holding some numbers',
    pop: 'Lower the size by one: the last value no longer counts',
    check: 'Is size ≤ capacity ÷ 4, with capacity at least 4?',
    shrink: 'Mostly empty: allocate an array half as big',
    copy: 'Copy each number still in use into the new array',
    swap: 'Switch to the new array, free the old one',
    done: 'Return how many copies the pops cost',
  },
  vars: [
    { name: 'size', role: 'ptrA' },
    { name: 'capacity', role: 'value' },
    { name: 'copies', label: 'copies so far', role: 'best' },
    { name: 'i', label: 'copy index i', role: 'ptrB' },
  ],
  input: {
    fields: [
      { name: 'nums', label: 'Numbers in the vector', kind: 'int-array', placeholder: 'e.g. 7, 3, 9, 4, 1, 8, 2, 6, 5', help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}. The capacity starts at the smallest power of two that fits them.` },
      { name: 'pops', label: 'Number of pops', kind: 'int', placeholder: 'e.g. 6', help: 'From 1 up to how many numbers the vector holds.' },
    ],
    parse: parseInput,
    format: ({ nums, pops }) => ({ nums: nums.join(', '), pops: String(pops) }),
    presets: [
      { label: 'Pop 6 of 9: one shrink', value: { nums: [7, 3, 9, 4, 1, 8, 2, 6, 5], pops: 6 } },
      { label: 'Pop 2 of 5: no shrink', value: { nums: [7, 3, 9, 4, 1], pops: 2 } },
      { label: 'Pop all 8: it halves again and again', value: { nums: [5, 2, 8, 1, 9, 4, 7, 3], pops: 8 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 3, 12)
      const nums = Array.from({ length: len }, () => randInt(rand, -9, 40))
      const pops = randInt(rand, 1, len)
      return { nums, pops }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
