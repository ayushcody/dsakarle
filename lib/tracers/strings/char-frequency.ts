/**
 * Strings — counting letters to check an anagram (LeetCode 242).
 *
 * Two words are anagrams when they use the same letters the same number of
 * times. Count every letter of `s` in a table, then "spend" one count for every
 * letter of `t`. If a letter of `t` has no count left, `t` uses something `s`
 * cannot supply, so it is not an anagram. With equal lengths, spending every
 * letter of `t` successfully leaves every count at 0.
 *
 * Scene: a column composite — `s` and `t` as arrays of letters (a pointer `i`
 * walks whichever one is being read), and below them the counts as the same
 * 5-bucket chained table used in the hash-maps lesson. The hash function is the
 * letter's character code: bucket = code % 5 (a = 97, so a lands in bucket 2).
 * Letters are not spread evenly over 5 buckets, so collisions happen and the
 * learner sees chaining; the picture is a hash table on purpose, while the
 * lesson notes that lowercase-only input could use a plain 26-slot array
 * indexed by `ch - 'a'`.
 *
 * Which-bucket predicts are `choice`, not `cell`: with two arrays and a table on
 * screen, a clicked index would be ambiguous between a cell and a bucket.
 *
 * Code lives in content/code/strings/char-frequency.{py,java,cpp}.
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
  MarkRole,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface CharFrequencyInput {
  s: string
  t: string
}

/** Buckets in the count table; the bucket of a letter is `code % 5`. */
const M = 5

/** `maxN` is the longest word; `min`..`max` is the character-code range of a..z. */
const LIMITS: InputLimits = { maxN: 10, min: 97, max: 122 }

const WORD = /^[a-z]+$/

function parseWord(raw: string | undefined, field: 's' | 't'): ParseResult<string> {
  const text = (raw ?? '').trim()
  if (text === '') return { ok: false, field, error: `Type a word for ${field}, like ${field === 's' ? 'listen' : 'silent'}.` }
  if (text.length > LIMITS.maxN) {
    return { ok: false, field, error: `Use at most ${LIMITS.maxN} letters in ${field} so the picture stays readable.` }
  }
  if (!WORD.test(text)) {
    return { ok: false, field, error: `Use only lowercase letters a to z in ${field}, with no spaces, digits or capitals.` }
  }
  return { ok: true, value: text }
}

function parseInput(raw: Record<string, string>): ParseResult<CharFrequencyInput> {
  const s = parseWord(raw.s, 's')
  if (!s.ok) return s
  const t = parseWord(raw.t, 't')
  if (!t.ok) return t
  return { ok: true, value: { s: s.value, t: t.value } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const YES = 'Yes, spend one'
const NO = 'No, give up'

function codeOf(ch: string): number {
  return ch.charCodeAt(0)
}

function bucketOf(ch: string): number {
  return codeOf(ch) % M
}

/** Three bucket options that always include the right one, in ascending order. */
function bucketOptions(right: number): string[] {
  return [right, (right + 1) % M, (right + 3) % M].sort((a, b) => a - b).map((b) => `Bucket ${b}`)
}

/** Which-bucket question about a letter that the next frame will hash. */
function whichBucketPredict(ch: string): PredictCandidate {
  const code = codeOf(ch)
  const b = bucketOf(ch)
  return {
    tag: 'which-bucket',
    kind: 'choice',
    prompt: `Next letter is '${ch}', character code ${code}. Which bucket does ${code} % ${M} pick?`,
    options: bucketOptions(b),
    answer: `Bucket ${b}`,
    why: `${code} % ${M} = ${b}, so '${ch}' always lives in bucket ${b}. Counting and spending both look there.`,
    hint: `The bucket is the remainder when you divide ${code} by ${M}.`,
  }
}

/** Anagram-yet question about a letter of t that is about to be spent. */
function anagramYetPredict(ch: string, count: number | undefined, bucket: number): PredictCandidate {
  const ok = count !== undefined && count > 0
  let why: string
  if (ok) why = `Bucket ${bucket} holds '${ch}' with count ${count}, so one can be spent.`
  else if (count === 0) why = `'${ch}' is in bucket ${bucket} but its count is already 0, so t uses it more often than s does.`
  else why = `There is no '${ch}' in bucket ${bucket} at all, so s never had that letter.`
  return {
    tag: 'anagram-yet',
    kind: 'choice',
    prompt: `Now t offers '${ch}'. Is there still a count of '${ch}' to spend?`,
    options: ch.charCodeAt(0) % 2 === 0 ? [YES, NO] : [NO, YES],
    answer: ok ? YES : NO,
    why,
    hint: `Look in bucket ${bucket} for '${ch}' and see whether its count is above zero.`,
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ s, t }: CharFrequencyInput) {
  const rec = createRecorder<boolean>()
  const sChars = s.split('')
  const tChars = t.split('')
  const n = sChars.length

  // Working state — mirrors the variables in the code files.
  const counts = new Map<string, number>() // letter -> count; Map keeps insertion order, like a chain
  let sDone = 0 // letters of s already counted
  let tDone = 0 // letters of t already spent
  let result: boolean | null = null

  /** The count table as 5 chained buckets, derived from `counts` so the two cannot disagree. */
  const chains = (): Array<Array<{ key: string; count: number }>> => {
    const out: Array<Array<{ key: string; count: number }>> = Array.from({ length: M }, () => [])
    counts.forEach((count, key) => out[bucketOf(key)].push({ key, count }))
    return out
  }
  const total = (): number => {
    let sum = 0
    counts.forEach((c) => (sum += c))
    return sum
  }

  const emit = (
    at: string,
    say: string,
    extra: {
      /** Pointer `i` on s or t. */
      sPtr?: number
      tPtr?: number
      sMarks?: Array<{ index: number; role: MarkRole }>
      tMarks?: Array<{ index: number; role: MarkRole }>
      hashing?: string | null
      mapMarks?: HashMapScene['marks']
      mapNotes?: HashMapScene['annotations']
      ch?: string
      count?: number | null
      predict?: PredictCandidate
    } = {},
  ): void => {
    const arrayOf = (
      label: string,
      chars: string[],
      done: number,
      ptr: number | undefined,
      overrides: Array<{ index: number; role: MarkRole }> | undefined,
    ): ArrayScene => {
      const scene: ArrayScene = { kind: 'array', label, cells: chars.slice() }
      if (ptr !== undefined) scene.pointers = [{ name: 'i', index: ptr, role: 'ptrB' }]
      const roles = new Map<number, MarkRole>()
      for (let k = 0; k < done; k++) roles.set(k, 'visited')
      for (const m of overrides ?? []) roles.set(m.index, m.role)
      const marks = Array.from(roles, ([index, role]) => ({ index, role }))
      if (marks.length) scene.marks = marks
      return scene
    }

    const map: HashMapScene = {
      kind: 'hash-map',
      buckets: chains().map((chain): HashEntry[] => chain.map((e) => ({ key: e.key, value: e.count }))),
      hashing: extra.hashing ? { key: extra.hashing, hash: codeOf(extra.hashing), bucket: bucketOf(extra.hashing) } : null,
    }
    if (extra.mapMarks?.length) map.marks = extra.mapMarks
    if (extra.mapNotes?.length) map.annotations = extra.mapNotes

    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { title: 's', scene: arrayOf('s', sChars, sDone, extra.sPtr, extra.sMarks) },
        { title: 't', scene: arrayOf('t', tChars, tDone, extra.tPtr, extra.tMarks) },
        { title: 'counts: letter → how many', scene: map },
      ],
    }
    const ptr = extra.sPtr ?? extra.tPtr
    const vars: Record<string, Val> = {
      i: ptr ?? null,
      ch: extra.ch ?? null,
      bucket: extra.ch !== undefined ? bucketOf(extra.ch) : null,
      count: extra.count ?? null,
      result,
    }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: total(), max: n, label: 'Counts still to spend' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  /** Slot of `ch` in its bucket, or -1. */
  const slotOf = (ch: string): number => chains()[bucketOf(ch)].findIndex((e) => e.key === ch)

  /** Marks for every entry in the table. */
  const allEntries = (role: MarkRole): NonNullable<HashMapScene['marks']> => {
    const marks: NonNullable<HashMapScene['marks']> = []
    chains().forEach((chain, bucket) => chain.forEach((_, slot) => marks.push({ bucket, slot, role })))
    return marks
  }

  // lengths — different lengths can never be anagrams.
  if (sChars.length !== tChars.length) {
    emit('lengths', `s has ${sChars.length} letters but t has ${tChars.length}, so they can't be anagrams.`)
    result = false
    emit('done', 'Different lengths mean no match, so the answer is false.')
    return rec.done(result)
  }
  emit('lengths', `Both words have ${n} letters, so they could be anagrams. Next: count the letters of s.`)

  // init — an empty table.
  emit('init', `Start with an empty table of ${M} buckets. A letter goes in bucket (its code) % ${M}, so a is 97 % ${M} = 2.`, {
    predict: whichBucketPredict(sChars[0]),
  })

  // count — add one for every letter of s.
  for (let i = 0; i < n && !rec.capped; i++) {
    const ch = sChars[i]
    const b = bucketOf(ch)
    const before = counts.get(ch) ?? 0
    const others = chains()[b].filter((e) => e.key !== ch)
    counts.set(ch, before + 1)
    sDone = i
    const slot = slotOf(ch)
    const base = `'${ch}' is code ${codeOf(ch)}: ${codeOf(ch)} % ${M} = ${b}, so bucket ${b}.`
    const say =
      before > 0
        ? `${base} Count ${before} → ${before + 1}.`
        : others.length > 0
          ? `${base} New letter, chained after ${others[others.length - 1].key}: count 1.`
          : `${base} New letter: count 1.`
    const last = i === n - 1
    emit('count', say, {
      sPtr: i,
      sMarks: [{ index: i, role: 'focus' }],
      hashing: ch,
      mapMarks: [{ bucket: b, slot, role: 'changed' }],
      mapNotes: before === 0 && others.length > 0 ? [{ target: `bucket:${b}`, text: 'chained' }] : undefined,
      ch,
      count: before + 1,
      predict: whichBucketPredict(last ? tChars[0] : sChars[i + 1]),
    })
  }
  sDone = n

  // check / spend — one letter of t at a time.
  for (let j = 0; j < n && !rec.capped; j++) {
    const ch = tChars[j]
    const b = bucketOf(ch)
    const have = counts.get(ch)
    tDone = j
    const slot = slotOf(ch)
    emit('check', `Next letter of t is '${ch}' (code ${codeOf(ch)}): bucket ${b}. Does '${ch}' have a count left?`, {
      tPtr: j,
      tMarks: [{ index: j, role: 'focus' }],
      hashing: ch,
      mapMarks: slot >= 0 ? [{ bucket: b, slot, role: 'compare' }] : [{ bucket: b, role: 'focus' }],
      ch,
      count: have ?? null,
      predict: anagramYetPredict(ch, have, b),
    })
    if (rec.capped) break

    if (have === undefined || have === 0) {
      result = false
      emit(
        'done',
        have === 0
          ? `'${ch}' has no count left in bucket ${b}: t uses it more often than s does, so not an anagram.`
          : `There is no '${ch}' in bucket ${b}: s never had that letter, so they are not anagrams.`,
        {
          tPtr: j,
          tMarks: [{ index: j, role: 'error' }],
          mapMarks: slot >= 0 ? [{ bucket: b, slot, role: 'error' }] : [{ bucket: b, role: 'error' }],
          ch,
          count: have ?? null,
        },
      )
      return rec.done(result)
    }

    counts.set(ch, have - 1)
    tDone = j + 1
    const last = j === n - 1
    emit('spend', `Spend one '${ch}': its count goes from ${have} to ${have - 1}.`, {
      tPtr: j,
      hashing: ch,
      mapMarks: [{ bucket: b, slot, role: 'changed' }],
      ch,
      count: have - 1,
      predict: last ? undefined : whichBucketPredict(tChars[j + 1]),
    })
  }

  result = true
  emit('done', `Every letter of t was spent and every count is 0, so "${s}" and "${t}" are anagrams: true.`, {
    sMarks: sChars.map((_, index) => ({ index, role: 'found' as const })),
    tMarks: tChars.map((_, index) => ({ index, role: 'found' as const })),
    mapMarks: allEntries('found'),
  })
  return rec.done(result)
}

/** Independent version: sort the letters of both words and compare. */
function reference({ s, t }: CharFrequencyInput): boolean {
  const sorted = (word: string): string => word.split('').sort().join('')
  return sorted(s) === sorted(t)
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

function shuffled(rand: () => number, letters: string[]): string[] {
  const out = letters.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(rand, 0, i)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const tracer: Tracer<CharFrequencyInput, boolean> = {
  id: 'strings/char-frequency',
  title: 'Anagram check',
  anchors: {
    lengths: 'Different lengths? Then it cannot be an anagram',
    init: 'Start with an empty count table',
    count: 'For each letter of s, add one to its count',
    check: 'For each letter of t, does it still have a count left?',
    spend: 'It does: subtract one',
    done: 'Return false when a count runs out, true if every letter was spent',
  },
  vars: [
    { name: 'i', role: 'ptrB' },
    { name: 'ch', label: 'letter', role: 'focus' },
    { name: 'bucket', label: 'bucket = code % 5', role: 'value' },
    { name: 'count', label: 'count of letter', role: 'value' },
    { name: 'result', label: 'anagram?', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 's',
        label: 'Word s',
        kind: 'string',
        placeholder: 'e.g. anagram',
        help: `Up to ${LIMITS.maxN} lowercase letters, a to z.`,
      },
      {
        name: 't',
        label: 'Word t',
        kind: 'string',
        placeholder: 'e.g. nagaram',
        help: `Up to ${LIMITS.maxN} lowercase letters. Is t made of the same letters as s?`,
      },
    ],
    parse: parseInput,
    format: ({ s, t }) => ({ s, t }),
    presets: [
      { label: 'Anagram: anagram / nagaram', value: { s: 'anagram', t: 'nagaram' } },
      { label: 'Same letters, wrong counts', value: { s: 'aab', t: 'abb' } },
      { label: 'A letter s never had', value: { s: 'rat', t: 'car' } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      // A small alphabet, so letters repeat and buckets collide.
      const pool = shuffled(rand, ALPHABET.split('')).slice(0, randInt(rand, 3, 7))
      const len = randInt(rand, 3, LIMITS.maxN)
      const letters = Array.from({ length: len }, () => pool[randInt(rand, 0, pool.length - 1)])
      const s = letters.join('')
      const roll = rand()
      let t: string
      if (roll < 0.45) {
        t = shuffled(rand, letters).join('') // a real anagram
      } else if (roll < 0.7) {
        const other = shuffled(rand, letters)
        other[randInt(rand, 0, len - 1)] = ALPHABET[randInt(rand, 0, 25)] // one letter changed
        t = other.join('')
      } else if (roll < 0.85) {
        t = shuffled(rand, letters).slice(0, len - 1).join('') // one letter short
      } else {
        t = Array.from({ length: len }, () => pool[randInt(rand, 0, pool.length - 1)]).join('') // independent
      }
      return { s, t }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
