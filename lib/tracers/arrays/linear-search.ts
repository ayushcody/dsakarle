/**
 * Arrays — linear search: look at every slot until you find the target.
 *
 * What you do when you only know the values, not where they are. Layout
 * follows the pilot tracer:
 *   1. input type, parsing and presets
 *   2. frame helpers (predicts)
 *   3. `run` — records one frame per idea (look at a slot, then compare)
 *   4. `reference` — indexOf
 *
 * Returns the index of the first match, or -1.
 * Code lives in content/code/arrays/linear-search.{py,java,cpp}.
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

export interface LinearSearchInput {
  nums: number[]
  target: number
}

const LIMITS: InputLimits = { maxN: 12, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<LinearSearchInput> {
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

  const targetText = (raw.target ?? '').replace(/[−–]/g, '-').trim()
  if (targetText === '') return { ok: false, field: 'target', error: 'Type the number to look for, like 4.' }
  if (!INTEGER.test(targetText)) {
    return { ok: false, field: 'target', error: `The target must be a whole number, not "${targetText}".` }
  }
  const target = Number(targetText)
  if (target < LIMITS.min || target > LIMITS.max) {
    return { ok: false, field: 'target', error: `Keep the target between ${LIMITS.min} and ${LIMITS.max}.` }
  }
  return { ok: true, value: { nums, target } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const KEEP_LOOKING = 'Keep looking'
const STOP = 'Stop, found it'

function foundYetPredict(i: number, value: number, target: number): PredictCandidate {
  const match = value === target
  return {
    tag: 'found-yet',
    kind: 'choice',
    prompt: `Index ${i} holds ${value} and we want ${target}. Stop or keep looking?`,
    options: [KEEP_LOOKING, STOP],
    answer: match ? STOP : KEEP_LOOKING,
    why: match
      ? `${value} is the number we want, so the search can stop right here.`
      : `${value} is not ${target}, so this slot tells us nothing more. On to the next one.`,
    hint: 'Compare the number in the slot with the target.',
  }
}

function whereStopPredict(stopAt: number, target: number): PredictCandidate {
  return {
    tag: 'where-stop',
    kind: 'cell',
    prompt: `We scan from index 0 looking for ${target}. Click the slot where the search will stop.`,
    answer: stopAt,
    why: `The scan stops at the first ${target} it meets, index ${stopAt}. Slots after it are never looked at.`,
    hint: 'Scan from the left. The first match wins.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ nums, target }: LinearSearchInput) {
  const rec = createRecorder<number>()
  const n = nums.length

  // Working state — mirrors the variables in the code files.
  let i: number | null = null
  let checked = 0

  const visitedBefore = (upTo: number): Array<{ index: number; role: 'visited' }> =>
    Array.from({ length: upTo }, (_, k) => ({ index: k, role: 'visited' as const }))

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
    const scene: ArrayScene = { kind: 'array', label: 'nums', cells: nums.slice() }
    if (extra.pointer && i !== null) scene.pointers = [{ name: 'i', index: i, role: 'focus' }]
    if (extra.marks?.length) scene.marks = extra.marks
    if (extra.annotations?.length) scene.annotations = extra.annotations
    const vars: Record<string, Val> = { i, target }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: checked, max: n, label: 'Slots checked' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  const firstMatch = nums.indexOf(target)

  let found = -1
  for (let k = 0; k < n && !rec.capped; k++) {
    i = k
    const value = nums[k]
    // The first frame doubles as the start of the run, and carries the big question.
    const say =
      k === 0
        ? `Look for ${target}. Start at index 0, which holds ${value}.`
        : `Look at index ${k}: it holds ${value}.`
    emit('next', say, {
      pointer: true,
      marks: [...visitedBefore(k), { index: k, role: 'focus' }],
      predict: k === 0 && firstMatch >= 0 ? whereStopPredict(firstMatch, target) : foundYetPredict(k, value, target),
    })
    if (rec.capped) break

    checked = k + 1
    if (value === target) {
      found = k
      emit('compare', `${value} equals ${target}. Found it at index ${k}!`, {
        pointer: true,
        marks: [...visitedBefore(k), { index: k, role: 'found' }],
        annotations: [{ target: `cell:${k}`, text: `it's ${target}` }],
      })
      break
    }
    emit('compare', `${value} is not ${target}, so move on to the next slot.`, {
      pointer: true,
      marks: [...visitedBefore(k), { index: k, role: 'compare' }],
      annotations: [{ target: `cell:${k}`, text: `not ${target}` }],
    })
  }

  if (found >= 0) {
    emit('done', `Done. ${target} is at index ${found}, found after looking at ${found + 1} slot${found === 0 ? '' : 's'}.`, {
      pointer: true,
      marks: [...visitedBefore(found), { index: found, role: 'found' }],
    })
  } else {
    i = null
    emit('done', `Done. Checked all ${n} slot${n === 1 ? '' : 's'} and never saw ${target}, so the answer is -1.`, {
      marks: visitedBefore(n),
    })
  }

  return rec.done(found)
}

/** Independent version. */
function reference({ nums, target }: LinearSearchInput): number {
  return nums.indexOf(target)
}

const tracer: Tracer<LinearSearchInput, number> = {
  id: 'arrays/linear-search',
  title: 'Linear search',
  anchors: {
    next: 'Look at the next slot, nums[i]',
    compare: 'Is nums[i] the target?',
    done: 'Return the index, or -1 if never found',
  },
  vars: [
    { name: 'i', label: 'index i', role: 'focus' },
    { name: 'target', role: 'best' },
  ],
  input: {
    fields: [
      { name: 'nums', label: 'Numbers', kind: 'int-array', placeholder: 'e.g. 7, 3, 9, 4, 1', help: `Up to ${LIMITS.maxN} whole numbers from ${LIMITS.min} to ${LIMITS.max}.` },
      { name: 'target', label: 'Number to find', kind: 'int', placeholder: 'e.g. 4', help: `A whole number from ${LIMITS.min} to ${LIMITS.max}. It need not be in the list.` },
    ],
    parse: parseInput,
    format: ({ nums, target }) => ({ nums: nums.join(', '), target: String(target) }),
    presets: [
      { label: 'Classic: find 4', value: { nums: [7, 3, 9, 4, 1], target: 4 } },
      { label: 'Not here: look at everything', value: { nums: [7, 3, 9, 4, 1], target: 6 } },
      { label: 'Two matches: the first wins', value: { nums: [5, 2, 8, 2, 6, 2], target: 2 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 4, 10)
      const nums = Array.from({ length: len }, () => randInt(rand, -9, 20))
      // About one run in four searches for a number that is not there.
      const target = rand() < 0.25 ? randInt(rand, 21, 30) : nums[randInt(rand, 0, len - 1)]
      return { nums, target }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
