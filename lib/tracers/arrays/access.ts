/**
 * Arrays — jump straight to index i.
 *
 * Shows why reading nums[i] costs one step however long the array is: the
 * computer does `address = base + i × size` and goes there. Layout follows the
 * pilot tracer (sliding-window/max-sum-k):
 *   1. input type, parsing and presets
 *   2. frame helpers (predicts)
 *   3. `run` — records one frame per idea
 *   4. `reference` — the plain `nums[i]`
 *
 * The addresses are illustrative: the array starts at 1000 and every box takes
 * 4 bytes (a 32-bit int). Code lives in content/code/arrays/access.{py,java,cpp}.
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

export interface AccessInput {
  nums: number[]
  i: number
}

const LIMITS: InputLimits = { maxN: 12, min: -99, max: 99 }

/** Where the pretend array starts in memory, and how many bytes each box takes. */
const BASE = 1000
const SIZE = 4

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<AccessInput> {
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

  const iText = (raw.i ?? '').replace(/[−–]/g, '-').trim()
  if (iText === '') return { ok: false, field: 'i', error: 'Type an index to read, like 3.' }
  if (!INTEGER.test(iText)) return { ok: false, field: 'i', error: `The index must be a whole number, not "${iText}".` }
  const i = Number(iText)
  if (i < 0 || i >= nums.length) {
    return {
      ok: false,
      field: 'i',
      error: `Index ${i} doesn't exist. With ${nums.length} number${nums.length === 1 ? '' : 's'}, use 0 to ${nums.length - 1}.`,
    }
  }
  return { ok: true, value: { nums, i } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const COUNT = 'Count from the start'
const JUMP = 'Jump straight there'

function jumpOrCountPredict(i: number): PredictCandidate {
  return {
    tag: 'jump-or-count',
    kind: 'choice',
    prompt: `To reach index ${i}, does the computer count boxes from the start, or jump straight there?`,
    options: [COUNT, JUMP],
    answer: JUMP,
    why: `Counting would take ${i} steps. Instead it does one multiply and one add, so index ${i} costs the same as index 0.`,
    hint: 'Think about what the computer knows: where the array starts and how big each box is.',
  }
}

/** Three addresses, sorted, one of them right. The wrong ones are the classic slips. */
function whichAddressPredict(i: number, address: number): PredictCandidate {
  const slips = [BASE + i, BASE + (i + 1) * SIZE, BASE + (i + 2) * SIZE, BASE + (i - 1) * SIZE]
  const wrong: number[] = []
  for (const slip of slips) {
    if (slip !== address && slip >= BASE && !wrong.includes(slip) && wrong.length < 2) wrong.push(slip)
  }
  const options = [address, ...wrong].sort((a, b) => a - b).map(String)
  return {
    tag: 'which-address',
    kind: 'choice',
    prompt: `The array starts at ${BASE} and each box takes ${SIZE} bytes. Where does index ${i} live?`,
    options,
    answer: String(address),
    why: `Skip ${i} boxes of ${SIZE} bytes: ${BASE} + ${i} × ${SIZE} = ${address}.`,
    hint: `Each step along the row moves ${SIZE} bytes, not 1.`,
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums, i }: AccessInput) {
  const rec = createRecorder<number>()
  const n = nums.length

  // Working state — mirrors the variables in the code files.
  let address: number | null = null
  let value: number | null = null

  const emit = (
    at: string,
    say: string,
    extra: {
      pointer?: boolean
      marks?: ArrayScene['marks']
      annotations?: ArrayScene['annotations']
      predict?: PredictCandidate
    } = {},
  ): void => {
    const scene: ArrayScene = {
      kind: 'array',
      label: 'nums',
      cells: nums.slice(),
      addresses: { base: BASE, size: SIZE },
    }
    if (extra.pointer) scene.pointers = [{ name: 'i', index: i, role: 'focus' }]
    if (extra.marks?.length) scene.marks = extra.marks
    if (extra.annotations?.length) scene.annotations = extra.annotations
    const vars: Record<string, Val> = { i, address, value }
    const frame: Frame = { scene, vars, say, at }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit('init', `The array starts at address ${BASE} and each box takes ${SIZE} bytes. We want index ${i}.`, {
    predict: i > 0 ? jumpOrCountPredict(i) : undefined,
  })

  const expected = BASE + i * SIZE
  emit('check', `Index ${i} is between 0 and ${n - 1}, so it is inside the array.`, {
    pointer: true,
    predict: whichAddressPredict(i, expected),
  })

  address = expected
  emit('address', `Address = ${BASE} + ${i} × ${SIZE} = ${address}. One multiply and one add, no counting.`, {
    pointer: true,
    marks: [{ index: i, role: 'focus' }],
    annotations: [{ target: `cell:${i}`, text: `${BASE} + ${i} × ${SIZE}` }],
  })

  value = nums[i]
  emit('read', `The box at address ${address} holds ${value}. One jump, however long the array is.`, {
    pointer: true,
    marks: [{ index: i, role: 'found' }],
    annotations: [{ target: `cell:${i}`, text: `${value}` }],
  })

  return rec.done(value)
}

/** The plain version. */
function reference({ nums, i }: AccessInput): number {
  return nums[i]
}

const tracer: Tracer<AccessInput, number> = {
  id: 'arrays/access',
  title: 'Access by index',
  anchors: {
    init: 'Know where the array starts and how big each box is',
    check: 'Is the index inside the array?',
    address: 'Jump: address = base + i × size',
    read: 'Read the box at that address',
  },
  vars: [
    { name: 'i', label: 'index i', role: 'focus' },
    { name: 'address', role: 'value' },
    { name: 'value', label: 'value read', role: 'best' },
  ],
  input: {
    fields: [
      { name: 'nums', label: 'Numbers', kind: 'int-array', placeholder: 'e.g. 7, 3, 9, 4, 1', help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}.` },
      { name: 'i', label: 'Index to read', kind: 'int', placeholder: 'e.g. 3', help: 'Counting starts at 0, so the first box is index 0.' },
    ],
    parse: parseInput,
    format: ({ nums, i }) => ({ nums: nums.join(', '), i: String(i) }),
    presets: [
      { label: 'Classic: read index 3', value: { nums: [7, 3, 9, 4, 1], i: 3 } },
      { label: 'First box: the address is the base', value: { nums: [7, 3, 9, 4, 1], i: 0 } },
      { label: 'Last of 8: still one jump', value: { nums: [20, 15, 8, 42, 16, 23, 4, 9], i: 7 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 4, 10)
      const nums = Array.from({ length: len }, () => randInt(rand, -20, 60))
      const i = randInt(rand, 0, len - 1)
      return { nums, i }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
