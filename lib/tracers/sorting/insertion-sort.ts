/**
 * Insertion sort — sort a hand of cards by sliding each new card into place.
 *
 * Same layout as the other golden tracers:
 *   1. input (shared.ts)
 *   2. frame helpers (narration / predicts)
 *   3. `run` — the real algorithm, recording one frame per idea
 *   4. `reference` — a plain library sort the tests compare against
 *
 * Scene: one array. The bracket (`window`) is the sorted hand. When a card is
 * picked up its cell becomes an empty gap (null) and the card, the "key", is
 * held aside as a note on the gap. Bigger cards slide one slot right into the
 * gap, so the gap walks left until the key fits.
 *
 * Equal cards never move past each other (the test is strictly `>`), which is
 * what makes insertion sort stable. Code lives in
 * content/code/sorting/insertion-sort.{py,java,cpp}.
 */
import { createRecorder } from '@/lib/engine/recorder'
import { LIMITS, SORT_FIELDS, formatSortInput, parseSortInput, randomSortInput, sortedCopy } from './shared'
import type { SortInput } from './shared'
import { mulberry32 } from '../rng'
import type { ArrayScene, Frame, PredictCandidate, Tracer, Val } from '@/lib/engine/types'

const SHIFT = 'Shift it right'
const PLACE = 'Place the key here'

/** Asked on the compare frame: does the card on the left move, or does the key land? */
function shiftOrPlacePredict(key: number, left: number): PredictCandidate {
  const shift = left > key
  return {
    tag: 'shift-or-place',
    kind: 'choice',
    prompt: `The key is ${key} and the card on its left is ${left}. Does that card shift right, or does the key go in the gap?`,
    options: [SHIFT, PLACE],
    answer: shift ? SHIFT : PLACE,
    why: shift
      ? `${left} is bigger than ${key}, so ${left} belongs to the right of the key. It slides over and the gap moves left.`
      : `${left} is not bigger than ${key}, so the hand is already in order up to here. The key goes in the gap.`,
    hint: 'The hand is sorted. Is the card on the left bigger than the key?',
  }
}

function run({ nums: input }: SortInput) {
  const rec = createRecorder<number[]>()
  const nums = input.slice()
  const n = nums.length

  // Working state, mirroring the variables in the code files.
  let i = 0
  let j = -1
  let key: number | null = null
  /** The gap left by the key; it is where the key will land. null when nothing is held. */
  let hole: number | null = null

  const emit = (
    at: string,
    say: string,
    extra: {
      window?: { start: number; end: number } | null
      marks?: ArrayScene['marks']
      pointers?: boolean
      annotations?: ArrayScene['annotations']
      predict?: PredictCandidate
      done?: boolean
    } = {},
  ): void => {
    const cells: Array<number | null> = nums.slice()
    if (hole !== null) cells[hole] = null
    const scene: ArrayScene = { kind: 'array', label: 'nums', cells }
    scene.window = extra.window === undefined ? { start: 0, end: i - 1 } : extra.window
    if (extra.pointers) {
      scene.pointers = [{ name: 'j', index: j, role: 'ptrB' }]
    }
    if (extra.marks?.length) scene.marks = extra.marks
    if (extra.annotations?.length) scene.annotations = extra.annotations

    const vars: Record<string, Val> = { i: at === 'init' || at === 'done' ? null : i, j: j >= 0 ? j : null, key }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: extra.done ? n : i, max: n, label: 'Cards in the sorted hand' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  i = 1
  emit('init', `The first card, ${nums[0]}, is a sorted hand of one. Every other card still has to be placed.`, {
    window: { start: 0, end: 0 },
  })

  for (i = 1; i < n && !rec.capped; i++) {
    key = nums[i]
    hole = i
    j = i - 1
    const hand = nums.slice(0, i).join(', ')
    emit('pick', `Pick up ${key} as the key. The sorted hand to its left is [${hand}].`, {
      window: { start: 0, end: i - 1 },
      annotations: [{ target: `cell:${i}`, text: `key = ${key}` }],
      marks: [{ index: i, role: 'focus' }],
    })
    if (rec.capped) break

    while (j >= 0 && nums[j] > key && !rec.capped) {
      emit('compare', `Compare the key ${key} with the card at index ${j}, which is ${nums[j]}.`, {
        window: { start: 0, end: i },
        pointers: true,
        marks: [
          { index: j, role: 'compare' },
          { index: hole, role: 'focus' },
        ],
        annotations: [{ target: `cell:${hole}`, text: `key = ${key}` }],
        predict: shiftOrPlacePredict(key, nums[j]),
      })
      if (rec.capped) break

      const moved = nums[j]
      nums[j + 1] = nums[j]
      hole = j
      const to = j + 1
      emit('shift', `${moved} is bigger than ${key}, so it slides one slot right to index ${to}. The gap moves left.`, {
        window: { start: 0, end: i },
        marks: [{ index: to, role: 'changed' }, { index: hole, role: 'focus' }],
        annotations: [{ target: `cell:${hole}`, text: `key = ${key}` }],
      })
      j--
    }
    if (rec.capped) break

    // Compare once more only when the loop stopped because a card was not bigger.
    if (j >= 0 && hole !== null) {
      emit('compare', `Compare the key ${key} with the card at index ${j}, which is ${nums[j]}.`, {
        window: { start: 0, end: i },
        pointers: true,
        marks: [
          { index: j, role: 'compare' },
          { index: hole, role: 'focus' },
        ],
        annotations: [{ target: `cell:${hole}`, text: `key = ${key}` }],
        predict: shiftOrPlacePredict(key, nums[j]),
      })
      if (rec.capped) break
    }

    const spot = j + 1
    nums[spot] = key
    hole = null
    const reason =
      j < 0
        ? `There is nothing left of it, so ${key} is the smallest so far and goes to index ${spot}.`
        : spot === i
          ? `${nums[j]} is not bigger, so ${key} stays at index ${spot}. No move needed.`
          : `${nums[j]} is not bigger, so ${key} goes into the gap at index ${spot}.`
    emit('place', reason, {
      window: { start: 0, end: i },
      marks: [{ index: spot, role: 'found' }],
    })
  }

  i = n
  hole = null
  key = null
  j = -1
  emit('done', `All ${n} cards are placed: [${nums.join(', ')}]. The whole row is the sorted hand.`, {
    window: null,
    done: true,
    marks: nums.map((_, index) => ({ index, role: 'found' as const })),
  })

  return rec.done(nums)
}

const tracer: Tracer<SortInput, number[]> = {
  id: 'sorting/insertion-sort',
  title: 'Insertion sort',
  anchors: {
    init: 'The first card is a sorted hand of one',
    pick: 'Pick up the next card as the key',
    compare: 'Compare the key with the card on its left',
    shift: 'A bigger card slides one slot right',
    place: 'Drop the key into the gap',
    done: 'Every card is placed: sorted',
  },
  vars: [
    { name: 'i', role: 'ptrA' },
    { name: 'j', role: 'ptrB' },
    { name: 'key', role: 'focus' },
  ],
  input: {
    fields: SORT_FIELDS,
    parse: parseSortInput,
    format: formatSortInput,
    presets: [
      { label: 'A hand of six cards', value: { nums: [5, 2, 4, 6, 1, 3] } },
      { label: 'Already sorted (best case)', value: { nums: [1, 2, 3, 4, 5, 6] } },
      { label: 'Reversed (worst case)', value: { nums: [6, 5, 4, 3, 2, 1] } },
    ],
    random: (seed) => randomSortInput(mulberry32(seed)),
    limits: LIMITS,
  },
  run,
  reference: ({ nums }) => sortedCopy(nums),
}

export default tracer
