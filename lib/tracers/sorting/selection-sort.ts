/**
 * Selection sort — find the smallest number in the unsorted part and swap it
 * into the next slot of the sorted prefix.
 *
 * Scene: one array. The bracket (`window`) is the sorted prefix growing from the
 * left. `i` is the slot being filled, `lowest` is the index of the smallest value
 * seen so far in this scan, `j` is the cell being looked at.
 * Code lives in content/code/sorting/selection-sort.{py,java,cpp}.
 */
import { createRecorder } from '@/lib/engine/recorder'
import { SORT_FIELDS, formatSortInput, parseSortInput, sortedCopy } from './shared'
import type { SortInput } from './shared'
import { mulberry32, randInt } from '../rng'
import type { ArrayScene, Frame, InputLimits, ParseResult, PredictCandidate, Tracer, Val } from '@/lib/engine/types'

const LIMITS: InputLimits = { maxN: 8, min: -99, max: 99 }

function parseInput(raw: Record<string, string>): ParseResult<SortInput> {
  const tokens = (raw.nums ?? '')
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
    .split(/[\s,;]+/)
    .filter((t) => t !== '')
  if (tokens.length > LIMITS.maxN) {
    return { ok: false, field: 'nums', error: `Use at most ${LIMITS.maxN} numbers so every scan stays readable.` }
  }
  return parseSortInput(raw)
}

const NEW_MIN = 'New minimum'
const KEEP = 'Keep the old one'

function newMinPredict(value: number, lowestValue: number): PredictCandidate {
  const smaller = value < lowestValue
  return {
    tag: 'new-min',
    kind: 'choice',
    prompt: `The smallest so far is ${lowestValue}. Is ${value} a new minimum?`,
    options: [NEW_MIN, KEEP],
    answer: smaller ? NEW_MIN : KEEP,
    why: smaller
      ? `${value} is smaller than ${lowestValue}, so lowest moves to this cell.`
      : `${value} is not smaller than ${lowestValue}, so ${lowestValue} stays the smallest so far.`,
    hint: 'Is this number smaller than the smallest seen so far?',
  }
}

function run({ nums: input }: SortInput) {
  const rec = createRecorder<number[]>()
  const nums = input.slice()
  const n = nums.length

  let i = 0
  let j = -1
  let lowest = 0
  let sortedCount = 0

  const emit = (
    at: string,
    say: string,
    extra: { marks?: ArrayScene['marks']; pointers?: boolean; predict?: PredictCandidate; done?: boolean } = {},
  ): void => {
    const scene: ArrayScene = { kind: 'array', label: 'nums', cells: nums.slice() }
    if (sortedCount > 0 && !extra.done) scene.window = { start: 0, end: sortedCount - 1 }
    const marks: NonNullable<ArrayScene['marks']> = []
    for (let k = 0; k < sortedCount; k++) marks.push({ index: k, role: 'found' })
    marks.push(...(extra.marks ?? []))
    if (marks.length) scene.marks = marks
    if (extra.pointers) {
      const pointers: NonNullable<ArrayScene['pointers']> = [{ name: 'i', index: i, role: 'ptrA' }]
      if (j >= 0) pointers.push({ name: 'j', index: j, role: 'ptrB' })
      if (lowest !== i) pointers.push({ name: 'lowest', index: lowest, role: 'focus' })
      scene.pointers = pointers
    }
    const idle = at === 'init' || at === 'done'
    const vars: Record<string, Val> = {
      i: idle ? null : i,
      j: extra.pointers && j >= 0 ? j : null,
      lowest: idle ? null : lowest,
    }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: sortedCount, max: n, label: 'Numbers placed on the left' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit('init', `Selection sort fills slots from the left, one smallest number at a time. ${n} numbers to sort.`)

  for (i = 0; i < n - 1 && !rec.capped; i++) {
    lowest = i
    j = -1
    emit('outer', `Fill index ${i}. Start by assuming ${nums[i]} at index ${i} is the smallest.`, {
      pointers: true,
      marks: [{ index: i, role: 'focus' }],
    })

    for (j = i + 1; j < n && !rec.capped; j++) {
      emit('scan', `Look at ${nums[j]} at index ${j}. Compare it with the smallest so far, ${nums[lowest]}.`, {
        pointers: true,
        marks: [
          { index: j, role: 'compare' },
          { index: lowest, role: 'focus' },
        ],
        predict: newMinPredict(nums[j], nums[lowest]),
      })
      if (nums[j] < nums[lowest]) {
        lowest = j
        emit('newmin', `${nums[j]} is smaller, so lowest moves to index ${j}.`, {
          pointers: true,
          marks: [{ index: lowest, role: 'focus' }],
        })
      }
    }
    if (rec.capped) break

    j = -1
    const picked = nums[lowest]
    const displaced = nums[i]
    nums[lowest] = displaced
    nums[i] = picked
    sortedCount = i + 1
    emit(
      'swap',
      lowest === i
        ? `${picked} is already the smallest, so it stays at index ${i}.`
        : `Swap ${picked} into index ${i}. ${displaced} moves to index ${lowest}.`,
      { marks: lowest === i ? [] : [{ index: lowest, role: 'changed' }] },
    )
  }

  sortedCount = n
  emit('done', `Sorted: [${nums.join(', ')}]. The last number is automatically in place.`, {
    done: true,
    marks: nums.map((_, index) => ({ index, role: 'found' as const })),
  })
  return rec.done(nums)
}

const tracer: Tracer<SortInput, number[]> = {
  id: 'sorting/selection-sort',
  title: 'Selection sort',
  anchors: {
    init: 'Start with the unsorted row',
    outer: 'Pick the next slot i and assume it holds the smallest',
    scan: 'Scan the rest, comparing with the smallest so far',
    newmin: 'A smaller number becomes the new lowest',
    swap: 'Swap the smallest into slot i',
    done: 'The row is sorted',
  },
  vars: [
    { name: 'i', role: 'ptrA' },
    { name: 'j', role: 'ptrB' },
    { name: 'lowest', role: 'focus' },
  ],
  input: {
    fields: SORT_FIELDS.map((f) => ({
      ...f,
      help: `2 to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}, in any order. Repeats are fine.`,
    })),
    parse: parseInput,
    format: formatSortInput,
    presets: [
      { label: 'Five numbers, shuffled', value: { nums: [29, 10, 14, 37, 13] } },
      { label: 'Already sorted', value: { nums: [1, 2, 3, 4, 5, 6] } },
      { label: 'Repeats', value: { nums: [4, 2, 4, 1, 2] } },
    ],
    random: (seed) => {
      const rand = mulberry32(seed)
      const len = randInt(rand, 2, LIMITS.maxN)
      return { nums: Array.from({ length: len }, () => randInt(rand, -20, 40)) }
    },
    limits: LIMITS,
  },
  run,
  reference: ({ nums }) => sortedCopy(nums),
}

export default tracer
