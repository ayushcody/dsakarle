/**
 * Dynamic programming — longest common subsequence (LeetCode 1143).
 *
 * dp[i][j] is the length of the LCS of the first i letters of a and the first j
 * letters of b. If a[i - 1] == b[j - 1] the letters extend the best answer for
 * both shorter prefixes: dp[i - 1][j - 1] + 1. Otherwise one of the two letters
 * is unused: max(dp[i - 1][j], dp[i][j - 1]). Row 0 and column 0 (an empty
 * prefix) are 0. After the table is full a traceback walks from the bottom-right
 * corner and collects one LCS (diagonal on a match, else towards the larger
 * neighbour, up on a tie).
 *
 * Strings are upper-cased by parse. Code lives in
 * content/code/dynamic-programming/lcs.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  Frame,
  GridScene,
  InputLimits,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface LcsInput {
  /** 1..7 letters, upper case. */
  a: string
  /** 1..7 letters, upper case. */
  b: string
}

export const MAX_LEN = 7
const LIMITS: InputLimits = { maxN: MAX_LEN, min: 1, max: MAX_LEN }

function parseWord(raw: string | undefined, field: 'a' | 'b'): ParseResult<string> {
  const text = (raw ?? '').trim().replace(/^["']|["']$/g, '')
  if (text === '') return { ok: false, field, error: `Type the ${field === 'a' ? 'first' : 'second'} word, like ABCB.` }
  if (!/^[A-Za-z]+$/.test(text)) return { ok: false, field, error: 'Use letters only, with no spaces, digits or symbols.' }
  if (text.length > MAX_LEN) return { ok: false, field, error: `Use at most ${MAX_LEN} letters so the table stays readable.` }
  return { ok: true, value: text.toUpperCase() }
}

function parseInput(raw: Record<string, string>): ParseResult<LcsInput> {
  const a = parseWord(raw.a, 'a')
  if (!a.ok) return a
  const b = parseWord(raw.b, 'b')
  if (!b.ok) return b
  return { ok: true, value: { a: a.value, b: b.value } }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function matchPredict(i: number, j: number, x: string, y: string, diag: number, up: number, left: number): PredictCandidate {
  const match = x === y
  const options = ['Match: diagonal + 1', 'No match: max of up and left']
  return {
    tag: 'match-or-max',
    kind: 'choice',
    prompt: `dp[${i}][${j}] compares the letter ${x} (row) with the letter ${y} (column). How is it filled?`,
    options,
    answer: match ? options[0] : options[1],
    why: match
      ? `${x} equals ${y}, so both letters join the subsequence: dp[${i - 1}][${j - 1}] + 1 = ${diag + 1}.`
      : `${x} and ${y} differ, so one of them is left out: max(up ${up}, left ${left}) = ${Math.max(up, left)}.`,
    hint: 'Are the two letters the same?',
  }
}

function run({ a, b }: LcsInput) {
  const rec = createRecorder<number>()
  const m = a.length
  const n = b.length
  const dp: Array<Array<number | null>> = Array.from({ length: m + 1 }, () => Array.from({ length: n + 1 }, () => null))
  const rowLabels = ['', ...a.split('')]
  const colLabels = ['', ...b.split('')]
  const total = (m + 1) * (n + 1)

  let i: number | null = null
  let j: number | null = null
  let diag: number | null = null
  let up: number | null = null
  let left: number | null = null
  let lcs = ''

  const emit = (
    at: string,
    say: string,
    extra: {
      marks?: NonNullable<GridScene['marks']>
      arrows?: GridScene['arrows']
      predict?: PredictCandidate
    } = {},
  ): void => {
    const scene: GridScene = { kind: 'grid', label: 'dp', rows: dp.map((row) => row.slice()), rowLabels, colLabels }
    if (extra.marks?.length) scene.marks = extra.marks
    if (extra.arrows?.length) scene.arrows = extra.arrows
    const vars: Record<string, Val> = { i, j, diag, up, left, lcs }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: dp.reduce((sum, row) => sum + row.filter((v) => v !== null).length, 0), max: total, label: 'Cells filled' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit('init', `Compare "${a}" and "${b}". dp[i][j] = LCS length of the first i letters of a and the first j letters of b.`)

  const baseMarks: NonNullable<GridScene['marks']> = []
  for (let c = 0; c <= n; c++) {
    dp[0][c] = 0
    baseMarks.push({ r: 0, c, role: 'changed' })
  }
  for (let r = 1; r <= m; r++) {
    dp[r][0] = 0
    baseMarks.push({ r, c: 0, role: 'changed' })
  }
  emit('base', 'Row 0 and column 0 are 0: an empty word has nothing in common with anything.', { marks: baseMarks })

  for (let r = 1; r <= m && !rec.capped; r++) {
    for (let c = 1; c <= n && !rec.capped; c++) {
      i = r
      j = c
      diag = dp[r - 1][c - 1] as number
      up = dp[r - 1][c] as number
      left = dp[r][c - 1] as number
      const x = a[r - 1]
      const y = b[c - 1]
      emit('check', `dp[${r}][${c}] looks at the letters ${x} (row ${r}) and ${y} (column ${c}).`, {
        marks: [
          { r: r - 1, c: c - 1, role: 'compare' },
          { r: r - 1, c, role: 'compare' },
          { r, c: c - 1, role: 'compare' },
          { r, c, role: 'focus' },
        ],
        predict: matchPredict(r, c, x, y, diag, up, left),
      })
      if (rec.capped) break

      if (x === y) {
        dp[r][c] = diag + 1
        emit('match', `${x} = ${y}: both letters join the subsequence. dp[${r}][${c}] = ${diag} + 1 = ${diag + 1}.`, {
          marks: [
            { r: r - 1, c: c - 1, role: 'compare' },
            { r, c, role: 'found' },
          ],
          arrows: [{ from: [r - 1, c - 1], to: [r, c] }],
        })
      } else {
        dp[r][c] = Math.max(up, left)
        emit('mismatch', `${x} ≠ ${y}: drop one letter. dp[${r}][${c}] = max(${up}, ${left}) = ${dp[r][c]}.`, {
          marks: [
            { r: r - 1, c, role: 'compare' },
            { r, c: c - 1, role: 'compare' },
            { r, c, role: 'changed' },
          ],
          arrows: [
            { from: [r - 1, c], to: [r, c] },
            { from: [r, c - 1], to: [r, c] },
          ],
        })
      }
    }
  }

  const length = dp[m][n] as number

  // Traceback: walk back from the corner and collect one LCS.
  diag = null
  up = null
  left = null
  const path: NonNullable<GridScene['marks']> = [{ r: m, c: n, role: 'found' }]
  let r = m
  let c = n
  i = r
  j = c
  emit('trace', `The corner says the LCS has length ${length}. Walk back from it to read one out.`, { marks: path.slice() })
  while (r > 0 && c > 0 && !rec.capped) {
    let say: string
    if (a[r - 1] === b[c - 1]) {
      lcs = a[r - 1] + lcs
      say = `${a[r - 1]} = ${b[c - 1]} here, so ${a[r - 1]} is in the LCS. Step diagonally. LCS so far: ${lcs}.`
      r--
      c--
    } else if ((dp[r - 1][c] as number) >= (dp[r][c - 1] as number)) {
      say = `No match here; up (${dp[r - 1][c]}) is at least left (${dp[r][c - 1]}), so step up.`
      r--
    } else {
      say = `No match here; left (${dp[r][c - 1]}) beats up (${dp[r - 1][c]}), so step left.`
      c--
    }
    i = r
    j = c
    path.push({ r, c, role: 'found' })
    emit('trace', say, { marks: path.slice() })
  }

  i = null
  j = null
  emit('done', length === 0 ? 'The corner holds 0: the words share no letters.' : `The LCS has length ${length}: "${lcs}" is one of the longest.`, {
    marks: [{ r: m, c: n, role: 'found' }],
  })
  return rec.done(length)
}

/** Independent check: the longest subsequence of a (tried over every subset) that is also a subsequence of b. */
function reference({ a, b }: LcsInput): number {
  const isSubsequence = (s: string): boolean => {
    let k = 0
    for (const ch of b) if (k < s.length && ch === s[k]) k++
    return k === s.length
  }
  let best = 0
  for (let mask = 0; mask < 1 << a.length; mask++) {
    let s = ''
    for (let k = 0; k < a.length; k++) if (mask & (1 << k)) s += a[k]
    if (s.length > best && isSubsequence(s)) best = s.length
  }
  return best
}

const tracer: Tracer<LcsInput, number> = {
  id: 'dynamic-programming/lcs',
  title: 'Longest common subsequence',
  anchors: {
    init: 'Make a table: dp[i][j] = LCS of a[:i] and b[:j]',
    base: 'Row 0 and column 0 are 0: an empty word',
    check: 'Look at the letters a[i − 1] and b[j − 1]',
    match: 'Same letter: dp[i][j] = dp[i − 1][j − 1] + 1',
    mismatch: 'Different: dp[i][j] = max(up, left)',
    trace: 'Walk back from the corner to read out one LCS',
    done: 'The bottom-right cell is the length',
  },
  vars: [
    { name: 'i', role: 'ptrA' },
    { name: 'j', role: 'ptrB' },
    { name: 'diag', role: 'value' },
    { name: 'up', role: 'value' },
    { name: 'left', role: 'value' },
    { name: 'lcs', role: 'best' },
  ],
  input: {
    fields: [
      { name: 'a', label: 'First word', kind: 'string', placeholder: 'ABCB', help: `Letters only, up to ${MAX_LEN}` },
      { name: 'b', label: 'Second word', kind: 'string', placeholder: 'BCAB', help: `Letters only, up to ${MAX_LEN}` },
    ],
    parse: parseInput,
    format: ({ a, b }) => ({ a, b }),
    presets: [
      { label: 'ABCB and BCAB', value: { a: 'ABCB', b: 'BCAB' } },
      { label: 'ABCDGH and AEDFHR', value: { a: 'ABCDGH', b: 'AEDFHR' } },
      { label: 'No letters in common', value: { a: 'ABC', b: 'XYZ' } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const word = (): string => Array.from({ length: randInt(rand, 1, MAX_LEN) }, () => 'ABCD'[randInt(rand, 0, 3)]).join('')
      return { a: word(), b: word() }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
