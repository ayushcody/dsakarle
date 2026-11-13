/**
 * Sliding window — longest substring without repeating characters (LeetCode 3).
 *
 * A variable window over a lowercase string. `right` reads the next letter; while
 * that letter is already in the window, `left` shrinks the window ONE letter at a
 * time (removing s[left] from `seen`) until the letter is no longer inside. Then
 * the letter is added and the window length is compared with `best`.
 * (The code does not jump `left` using last indexes — it shrinks step by step.)
 *
 * Scene: a column composite — `s` as an array of letters (left / right pointers
 * and the window bracket) and `seen`, a set drawn as the 5-bucket hash table
 * used elsewhere (bucket = character code % 5). Entries have keys only.
 * Predicts: `expand-or-shrink` on each check, `new-best` on each expand.
 * Code lives in content/code/sliding-window/longest-unique.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  ArrayScene,
  CompositeScene,
  Frame,
  HashEntry,
  HashMapScene,
  InputLimits,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

export interface LongestUniqueInput {
  s: string
}

const LIMITS: InputLimits = { maxN: 12, min: 97, max: 122 }
const BUCKETS = 5
const WORD = /^[a-z]+$/

function parseInput(raw: Record<string, string>): ParseResult<LongestUniqueInput> {
  const text = (raw.s ?? '').trim().replace(/^["']|["']$/g, '')
  if (text === '') return { ok: false, field: 's', error: 'Type a word, like abcabcbb.' }
  if (text.length > LIMITS.maxN) {
    return { ok: false, field: 's', error: `Use at most ${LIMITS.maxN} letters so the picture stays readable.` }
  }
  if (!WORD.test(text)) {
    return { ok: false, field: 's', error: 'Use only lowercase letters a to z, with no spaces, digits or capitals.' }
  }
  return { ok: true, value: { s: text } }
}

const KEEP_EXPANDING = 'Keep expanding'
const SHRINK_LEFT = 'Shrink from the left'
const YES = 'Yes'
const NO = 'No'

const bucketOf = (ch: string): number => ch.charCodeAt(0) % BUCKETS

function expandOrShrinkPredict(ch: string, dup: boolean): PredictCandidate {
  return {
    tag: 'expand-or-shrink',
    kind: 'choice',
    prompt: `Next letter is '${ch}'. Is it already in the window — expand or shrink?`,
    options: [KEEP_EXPANDING, SHRINK_LEFT],
    answer: dup ? SHRINK_LEFT : KEEP_EXPANDING,
    why: dup
      ? `'${ch}' is already inside the window, so a repeat would break the rule. Drop letters from the left first.`
      : `'${ch}' is not in the window, so adding it keeps every letter unique.`,
    hint: 'Look at the letters inside the bracket.',
  }
}

function newBestPredict(length: number, best: number): PredictCandidate {
  return {
    tag: 'new-best',
    kind: 'choice',
    prompt: `The window is ${length} long and the best so far is ${best}. Is this a new best?`,
    options: [YES, NO],
    answer: length > best ? YES : NO,
    why:
      length > best
        ? `${length} is longer than ${best}, so it becomes the best.`
        : length === best
          ? `${length} only ties ${best}. It has to be longer to replace the best.`
          : `${length} is shorter than ${best}, so the best stays.`,
    hint: 'Longer is better here. Compare the window length with the best.',
  }
}

function run({ s }: LongestUniqueInput) {
  const rec = createRecorder<number>()
  const n = s.length
  const chars = s.split('')

  // Working state — mirrors the variables in the code files.
  const seen: string[] = [] // insertion order, so chains read oldest first
  let left = 0
  let best = 0
  let bestStart = 0

  const emit = (
    right: number,
    at: string,
    say: string,
    extra: {
      marks?: ArrayScene['marks']
      window?: ArrayScene['window']
      pointers?: boolean
      hashing?: string
      mapMarks?: HashMapScene['marks']
      predict?: PredictCandidate
    } = {},
  ): void => {
    const buckets: HashEntry[][] = Array.from({ length: BUCKETS }, () => [])
    for (const ch of seen) buckets[bucketOf(ch)].push({ key: ch })
    const map: HashMapScene = {
      kind: 'hash-map',
      buckets,
      hashing: extra.hashing ? { key: extra.hashing, hash: extra.hashing.charCodeAt(0), bucket: bucketOf(extra.hashing) } : null,
    }
    if (extra.mapMarks?.length) map.marks = extra.mapMarks

    const arr: ArrayScene = {
      kind: 'array',
      label: 's',
      cells: chars.slice(),
      window: extra.window !== undefined ? extra.window : null,
    }
    if (extra.pointers !== false) {
      arr.pointers = [
        { name: 'left', index: left, role: 'ptrA' },
        { name: 'right', index: right, role: 'ptrB' },
      ]
    }
    if (extra.marks?.length) arr.marks = extra.marks

    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { title: 's', scene: arr },
        { title: 'seen: letters in the window', scene: map },
      ],
    }
    const vars: Record<string, Val> = { right, left, seen: seen.slice(), best }
    const frame: Frame = { scene, vars, say, at }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  /** The window before s[right] is added: left..right-1 (null when empty). */
  const before = (right: number): ArrayScene['window'] => (right - 1 >= left ? { start: left, end: right - 1 } : null)

  emit(-1, 'init', 'Start with an empty window and an empty seen set. We want the longest stretch with no repeated letter.', {
    window: null,
  })

  for (let right = 0; right < n && !rec.capped; right++) {
    const ch = chars[right]
    for (;;) {
      const dup = seen.includes(ch)
      emit(right, 'check', `Is '${ch}' already in the window?`, {
        window: before(right),
        marks: [{ index: right, role: 'focus' }],
        hashing: ch,
        predict: expandOrShrinkPredict(ch, dup),
      })
      if (!dup || rec.capped) break

      const dropped = chars[left]
      const droppedIndex = left
      seen.splice(seen.indexOf(dropped), 1)
      left++
      emit(
        right,
        'shrink',
        left > right - 1
          ? `Yes — drop '${dropped}' from the left. The window is empty now.`
          : `Yes — drop '${dropped}' from the left and remove it from seen.`,
        {
          window: before(right),
          marks: [
            { index: droppedIndex, role: 'discarded' },
            { index: right, role: 'focus' },
          ],
        },
      )
      if (rec.capped) break
    }
    if (rec.capped) break

    seen.push(ch)
    const length = right - left + 1
    emit(right, 'expand', `'${ch}' is new here, so add it. The window "${s.slice(left, right + 1)}" is ${length} long.`, {
      window: { start: left, end: right },
      marks: [{ index: right, role: 'changed' }],
      predict: newBestPredict(length, best),
    })
    if (rec.capped) break

    const improved = length > best
    const say = improved
      ? best === 0
        ? `Length ${length} is the first window, so best is ${length}.`
        : `Length ${length} beats ${best} — the new best.`
      : length === best
        ? `Length ${length} only ties the best of ${best}, so the earlier window stays.`
        : `Length ${length} is shorter than the best of ${best}, so the best stays.`
    if (improved) {
      best = length
      bestStart = left
    }
    emit(right, 'record', say, {
      window: { start: left, end: right },
      marks: improved ? Array.from({ length }, (_, i) => ({ index: left + i, role: 'found' as const })) : [],
    })
  }

  emit(
    n - 1,
    'done',
    `Done — the longest stretch with no repeats is "${s.slice(bestStart, bestStart + best)}", ${best} letter${best === 1 ? '' : 's'} long.`,
    {
      pointers: false,
      window: best > 0 ? { start: bestStart, end: bestStart + best - 1 } : null,
      marks: Array.from({ length: best }, (_, i) => ({ index: bestStart + i, role: 'found' as const })),
    },
  )
  return rec.done(best)
}

/** Independent brute force: try every substring and test it for repeats. */
function reference({ s }: LongestUniqueInput): number {
  let best = 0
  for (let i = 0; i < s.length; i++) {
    for (let j = i; j < s.length; j++) {
      const part = s.slice(i, j + 1)
      if (new Set(part).size === part.length) best = Math.max(best, part.length)
    }
  }
  return best
}

const tracer: Tracer<LongestUniqueInput, number> = {
  id: 'sliding-window/longest-unique',
  title: 'Window with a set',
  anchors: {
    init: 'Start with an empty window and an empty set',
    check: 'Is s[right] already in the window?',
    shrink: 'Drop s[left] from the window',
    expand: 'Add s[right] to the window',
    record: 'Keep the longest length seen',
    done: 'Return the longest length',
  },
  vars: [
    { name: 'right', role: 'ptrB' },
    { name: 'left', role: 'ptrA' },
    { name: 'seen', label: 'letters in window', role: 'value' },
    { name: 'best', label: 'longest length', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 's',
        label: 'Word',
        kind: 'string',
        placeholder: 'e.g. abcabcbb',
        help: `Up to ${LIMITS.maxN} lowercase letters, a to z.`,
      },
    ],
    parse: parseInput,
    format: ({ s }) => ({ s }),
    presets: [
      { label: 'Classic: abcabcbb', value: { s: 'abcabcbb' } },
      { label: 'Repeat in the middle: pwwkew', value: { s: 'pwwkew' } },
      { label: 'All the same letter', value: { s: 'bbbb' } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const len = randInt(rand, 4, LIMITS.maxN)
      const pool = 'abcdefghij'.slice(0, randInt(rand, 3, 7))
      return { s: Array.from({ length: len }, () => pool[randInt(rand, 0, pool.length - 1)]).join('') }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
