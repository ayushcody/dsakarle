/**
 * Strings — valid palindrome (LeetCode 125).
 *
 * Does the text read the same forwards and backwards once you ignore capital
 * letters and everything that is not a letter or digit? Two pointers walk in
 * from the ends. A pointer that lands on a space or punctuation mark hops over
 * it; when both land on letters or digits they are compared, ignoring case. No
 * cleaned-up copy of the string is ever made.
 *
 * Scene: one array of characters (a space is drawn as ␣ so it can be seen) with
 * `left` and `right` pointers. Skipped characters are `discarded`, matched
 * pairs are `visited`, the pair being compared is `compare`, and a mismatch is
 * `error`. The `window` is the part still left to check.
 *
 * Layout matches the other tracers: input, frame helpers, `run`, `reference`.
 * Code lives in content/code/strings/palindrome.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  ArrayScene,
  Frame,
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

export interface PalindromeInput {
  text: string
}

/** `maxN` is the longest text; `min`..`max` is the printable-ASCII code range. */
const LIMITS: InputLimits = { maxN: 12, min: 32, max: 126 }

const ALNUM = /^[A-Za-z0-9]$/

function isAlnum(ch: string): boolean {
  return ALNUM.test(ch)
}

function parseInput(raw: Record<string, string>): ParseResult<PalindromeInput> {
  const field = 'text'
  const text = raw.text ?? ''
  if (text === '') {
    return { ok: false, field, error: 'Type some text, like Race car! (capitals, spaces and punctuation are fine).' }
  }
  if (text.length > LIMITS.maxN) {
    return {
      ok: false,
      field,
      error: `Use at most ${LIMITS.maxN} characters so the picture stays readable (you typed ${text.length}).`,
    }
  }
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    if (code < LIMITS.min || code > LIMITS.max) {
      return { ok: false, field, error: 'Stick to plain keyboard characters: letters, digits, spaces and punctuation.' }
    }
  }
  if (!Array.from(text).some(isAlnum)) {
    return { ok: false, field, error: 'Include at least one letter or digit. Spaces and punctuation are ignored.' }
  }
  return { ok: true, value: { text } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const SKIP = 'Skip a character'
const COMPARE = 'Compare the two'
const MATCH = 'They match'
const DIFFER = 'They differ'

/** What a cell shows: a space becomes ␣ so it is visible. */
function show(ch: string): string {
  return ch === ' ' ? '␣' : ch
}

/** How narration names a character: 'R' or the space. */
function name(ch: string): string {
  return ch === ' ' ? 'the space' : `'${ch}'`
}

function cap(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Option order alternates so the right answer is not always in the same place. */
function ordered(first: string, second: string, flip: boolean): string[] {
  return flip ? [second, first] : [first, second]
}

/** "Skip or compare?" about the step after left and right have just moved. */
function skipOrComparePredict(chars: string[], left: number, right: number): PredictCandidate {
  const l = chars[left]
  const r = chars[right]
  const leftOk = isAlnum(l)
  const rightOk = isAlnum(r)
  const skip = !leftOk || !rightOk
  let why: string
  if (!leftOk) why = `${cap(name(l))} isn't a letter or digit, so left hops over it before anything is compared.`
  else if (!rightOk) why = `${cap(name(r))} isn't a letter or digit, so right hops over it before anything is compared.`
  else why = `${cap(name(l))} and ${name(r)} are both letters or digits, so they get compared.`
  return {
    tag: 'skip-or-compare',
    kind: 'choice',
    prompt: `Left is on ${name(l)} and right is on ${name(r)}. What happens next?`,
    options: ordered(SKIP, COMPARE, (left + right) % 2 === 0),
    answer: skip ? SKIP : COMPARE,
    why,
    hint: 'Only letters and digits count in a palindrome check. Is each pointer on one?',
  }
}

/** "Do they match?" about the pair that is being compared. */
function matchPredict(a: string, b: string): PredictCandidate {
  const same = a.toLowerCase() === b.toLowerCase()
  return {
    tag: 'match',
    kind: 'choice',
    prompt: `Compare ${name(a)} with ${name(b)}, ignoring case. Do they match?`,
    options: ordered(MATCH, DIFFER, a.charCodeAt(0) % 2 === 0),
    answer: same ? MATCH : DIFFER,
    why: same
      ? `Ignoring case, ${name(a)} and ${name(b)} are the same, so both pointers step inward.`
      : `${cap(name(a))} and ${name(b)} are different, so the text can't be a palindrome and the check ends here.`,
    hint: 'Lower-case both characters, then compare them.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ text }: PalindromeInput) {
  const rec = createRecorder<boolean>()
  const chars = text.split('')
  const n = chars.length

  // Working state — mirrors the variables in the code files.
  let left = 0
  let right = n - 1
  let result: boolean | null = null
  /** Persistent roles: skipped characters are discarded, matched pairs are visited. */
  const status: Array<MarkRole | undefined> = chars.map(() => undefined)

  const emit = (
    at: string,
    say: string,
    extra: {
      marks?: Array<{ index: number; role: MarkRole }>
      pointers?: boolean
      annotations?: ArrayScene['annotations']
      predict?: PredictCandidate
    } = {},
  ): void => {
    const roles = new Map<number, MarkRole>()
    status.forEach((role, index) => {
      if (role) roles.set(index, role)
    })
    for (const m of extra.marks ?? []) roles.set(m.index, m.role)

    const scene: ArrayScene = {
      kind: 'array',
      label: 's',
      cells: chars.map(show),
      window: left <= right ? { start: left, end: right } : null,
    }
    if (extra.pointers !== false) {
      scene.pointers = [
        { name: 'left', index: left, role: 'ptrA' },
        { name: 'right', index: right, role: 'ptrB' },
      ]
    }
    const marks = Array.from(roles, ([index, role]) => ({ index, role }))
    if (marks.length) scene.marks = marks
    if (extra.annotations?.length) scene.annotations = extra.annotations

    const vars: Record<string, Val> = { left, right, result }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: Math.max(0, right - left + 1), max: n, label: 'Characters still to check' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  /** The question about whatever the pointers do next, or none when the loop is over. */
  const askNext = (): PredictCandidate | undefined =>
    left < right ? skipOrComparePredict(chars, left, right) : undefined

  emit(
    'init',
    'Put left on the first character and right on the last. Letters and digits get compared; everything else is skipped.',
    { predict: askNext() },
  )

  while (left < right && !rec.capped) {
    if (!isAlnum(chars[left])) {
      // skip — left is not a letter or digit.
      const skipped = left
      status[skipped] = 'discarded'
      left++
      emit('skip', `Left is on ${name(chars[skipped])}, not a letter or digit, so left moves on.`, {
        annotations: [{ target: `cell:${skipped}`, text: 'skipped' }],
        predict: askNext(),
      })
    } else if (!isAlnum(chars[right])) {
      // skip — right is not a letter or digit.
      const skipped = right
      status[skipped] = 'discarded'
      right--
      emit('skip', `Right is on ${name(chars[skipped])}, not a letter or digit, so right moves in.`, {
        annotations: [{ target: `cell:${skipped}`, text: 'skipped' }],
        predict: askNext(),
      })
    } else {
      // compare — two real characters, case ignored.
      const a = chars[left]
      const b = chars[right]
      emit('compare', `Compare ${name(a)} with ${name(b)}, ignoring case.`, {
        marks: [
          { index: left, role: 'compare' },
          { index: right, role: 'compare' },
        ],
        predict: matchPredict(a, b),
      })
      if (rec.capped) break

      if (a.toLowerCase() !== b.toLowerCase()) {
        result = false
        emit('done', `${cap(name(a))} and ${name(b)} differ, so "${text}" is not a palindrome: false.`, {
          marks: [
            { index: left, role: 'error' },
            { index: right, role: 'error' },
          ],
        })
        break
      }

      const l = left
      const r = right
      status[l] = 'visited'
      status[r] = 'visited'
      left++
      right--
      emit(
        'match',
        `${cap(name(a))} and ${name(b)} match${a === b ? '' : ' once case is ignored'}. Both pointers step inward.`,
        {
          marks: [
            { index: l, role: 'found' },
            { index: r, role: 'found' },
          ],
          predict: askNext(),
        },
      )
    }
  }

  if (result === null) {
    result = true
    emit('done', `The pointers met without a mismatch, so "${text}" reads the same both ways: true.`, {
      pointers: false,
      marks: chars.map((ch, index) => ({ index, role: isAlnum(ch) ? ('found' as const) : ('discarded' as const) })),
    })
  }

  return rec.done(result)
}

/** Independent version: build the cleaned lower-case copy, reverse it, compare. */
function reference({ text }: PalindromeInput): boolean {
  const cleaned = text
    .split('')
    .filter(isAlnum)
    .join('')
    .toLowerCase()
  return cleaned === cleaned.split('').reverse().join('')
}

const FILLER = [' ', ' ', ',', '.', '!', '-', ':']
const LETTERS = 'abcdefgxyz'

const tracer: Tracer<PalindromeInput, boolean> = {
  id: 'strings/palindrome',
  title: 'Valid palindrome',
  anchors: {
    init: 'Put left at the start and right at the end',
    skip: 'Not a letter or digit? Move that pointer on',
    compare: 'Compare the two characters, ignoring case',
    match: 'Same? Both pointers step inward',
    done: 'Return false at a mismatch, true if the pointers meet',
  },
  vars: [
    { name: 'left', role: 'ptrA' },
    { name: 'right', role: 'ptrB' },
    { name: 'result', label: 'palindrome?', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 'text',
        label: 'Text',
        kind: 'string',
        placeholder: 'e.g. Race car!',
        help: `Up to ${LIMITS.maxN} characters. Capitals, spaces and punctuation are allowed; only letters and digits are compared.`,
      },
    ],
    parse: parseInput,
    format: ({ text }) => ({ text }),
    presets: [
      { label: 'Race car! (true)', value: { text: 'Race car!' } },
      { label: 'Race a car (mismatch)', value: { text: 'Race a car' } },
      { label: '(Taco cat) (skips at both ends)', value: { text: '(Taco cat)' } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      // A palindromic core of letters (random capitals), maybe with one letter changed.
      const coreLen = randInt(rand, 3, 9)
      const half: string[] = []
      for (let i = 0; i < Math.ceil(coreLen / 2); i++) half.push(LETTERS[randInt(rand, 0, LETTERS.length - 1)])
      const core = half.concat(half.slice(0, Math.floor(coreLen / 2)).reverse())
      if (rand() < 0.4) {
        const at = randInt(rand, 0, coreLen - 1)
        core[at] = LETTERS[(LETTERS.indexOf(core[at]) + 1 + randInt(rand, 0, LETTERS.length - 2)) % LETTERS.length]
      }
      const chars = core.map((c) => (rand() < 0.3 ? c.toUpperCase() : c))
      // Sprinkle in spaces and punctuation.
      const extras = randInt(rand, 0, Math.min(4, LIMITS.maxN - coreLen))
      for (let i = 0; i < extras; i++) chars.splice(randInt(rand, 0, chars.length), 0, FILLER[randInt(rand, 0, FILLER.length - 1)])
      return { text: chars.join('') }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
