/**
 * Bubble sort — compare neighbours, swap the ones out of order, and let the
 * biggest number bubble to the right end of the row.
 *
 * Scene: one array. The bracket (`window`) is the sorted suffix that grows from
 * the right; `j` is the pair being compared. If a whole pass makes no swap the
 * row is already in order, so the `swapped` flag lets us stop early.
 * Code lives in content/code/sorting/bubble-sort.{py,java,cpp}.
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
    return { ok: false, field: 'nums', error: `Use at most ${LIMITS.maxN} numbers so every pass stays readable.` }
  }
  return parseSortInput(raw)
}

const SWAP = 'Swap them'
const LEAVE = 'Leave them'
const STOP = 'Yes, stop now'
const AGAIN = 'No, another pass'

function swapPredict(a: number, b: number): PredictCandidate {
  const swap = a > b
  return {
    tag: 'swap-or-not',
    kind: 'choice',
    prompt: `Neighbours ${a} and ${b}. Does bubble sort swap them?`,
    options: [SWAP, LEAVE],
    answer: swap ? SWAP : LEAVE,
    why: swap
      ? `${a} is bigger than ${b}, so they are out of order. Swapping moves the bigger one right.`
      : `${a} is not bigger than ${b}, so this pair is already in order. Nothing to swap.`,
    hint: 'Is the left number bigger than the right one?',
  }
}

function sortedYetPredict(swapped: boolean): PredictCandidate {
  return {
    tag: 'sorted-yet',
    kind: 'choice',
    prompt: 'That pass is over. Can we stop, or is another pass needed?',
    options: [STOP, AGAIN],
    answer: swapped ? AGAIN : STOP,
    why: swapped
      ? 'Something was swapped, so the row may still be out of order. Run another pass.'
      : 'Not a single swap happened, so every neighbour pair is in order. The row is sorted.',
    hint: 'Did any swap happen during the pass?',
  }
}

function run({ nums: input }: SortInput) {
  const rec = createRecorder<number[]>()
  const nums = input.slice()
  const n = nums.length

  let end = n - 1
  let j = -1
  let swapped = false
  let sortedFrom = n // indices >= sortedFrom are settled
  let passes = 0

  const emit = (
    at: string,
    say: string,
    extra: {
      pointer?: boolean
      marks?: ArrayScene['marks']
      predict?: PredictCandidate
      done?: boolean
    } = {},
  ): void => {
    const scene: ArrayScene = { kind: 'array', label: 'nums', cells: nums.slice() }
    const suffix = at === 'done' ? n : sortedFrom
    if (suffix < n) scene.window = { start: suffix, end: n - 1 }
    const marks: NonNullable<ArrayScene['marks']> = []
    for (let k = suffix; k < n; k++) marks.push({ index: k, role: 'found' })
    marks.push(...(extra.marks ?? []))
    if (marks.length) scene.marks = marks
    if (extra.pointer) scene.pointers = [{ name: 'j', index: j, role: 'ptrB' }]
    const vars: Record<string, Val> = {
      end: at === 'init' || at === 'done' ? null : end,
      j: extra.pointer ? j : null,
      swapped: at === 'init' || at === 'done' ? null : swapped,
    }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: n - sortedFrom, max: n, label: 'Numbers settled on the right' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit('init', `Bubble sort compares neighbours and swaps any pair out of order. ${n} numbers to sort.`)

  for (end = n - 1; end > 0 && !rec.capped; end--) {
    passes++
    swapped = false
    emit('pass', `Pass ${passes}: scan indices 0 to ${end} and set swapped to false.`)

    for (j = 0; j < end && !rec.capped; j++) {
      const a = nums[j]
      const b = nums[j + 1]
      emit('compare', `Compare ${a} at index ${j} with ${b} at index ${j + 1}.`, {
        pointer: true,
        marks: [
          { index: j, role: 'compare' },
          { index: j + 1, role: 'compare' },
        ],
        predict: swapPredict(a, b),
      })
      if (a > b) {
        nums[j] = b
        nums[j + 1] = a
        swapped = true
        emit('swap', `${a} is bigger than ${b}, so they swap. ${a} moves one step right.`, {
          pointer: true,
          marks: [
            { index: j, role: 'changed' },
            { index: j + 1, role: 'changed' },
          ],
        })
      }
    }
    if (rec.capped) break

    sortedFrom = end
    const settled = nums[end]
    emit('check', `${settled} has bubbled to index ${end} and stays. ${swapped ? 'Swaps happened.' : 'No swaps happened.'}`, {
      predict: end > 1 ? sortedYetPredict(swapped) : undefined,
    })
    if (!swapped) {
      emit('early', 'A whole pass without a swap means every pair is in order, so we stop early.')
      break
    }
  }

  emit('done', `Sorted: [${nums.join(', ')}] after ${passes} pass${passes === 1 ? '' : 'es'}.`, {
    done: true,
    marks: nums.map((_, index) => ({ index, role: 'found' as const })),
  })
  return rec.done(nums)
}

const tracer: Tracer<SortInput, number[]> = {
  id: 'sorting/bubble-sort',
  title: 'Bubble sort',
  anchors: {
    init: 'Start with the unsorted row',
    pass: 'Start a pass with swapped = false',
    compare: 'Compare two neighbours',
    swap: 'Swap them if the left is bigger',
    check: 'End of pass: the biggest is settled',
    early: 'No swap in a whole pass: stop early',
    done: 'The row is sorted',
  },
  vars: [
    { name: 'end', role: 'ptrA' },
    { name: 'j', role: 'ptrB' },
    { name: 'swapped', role: 'value' },
  ],
  input: {
    fields: SORT_FIELDS.map((f) => ({
      ...f,
      help: `2 to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}, in any order. Repeats are fine.`,
    })),
    parse: parseInput,
    format: formatSortInput,
    presets: [
      { label: 'Early exit after three passes', value: { nums: [5, 1, 4, 2, 8] } },
      { label: 'Already sorted (best case)', value: { nums: [1, 2, 3, 4, 5, 6] } },
      { label: 'Reversed (worst case)', value: { nums: [6, 5, 4, 3, 2, 1] } },
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
