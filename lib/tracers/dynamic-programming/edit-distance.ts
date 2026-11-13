/**
 * Dynamic programming — edit distance (LeetCode 72, Levenshtein distance).
 *
 * dp[i][j] is the fewest edits that turn the first i letters of a into the first
 * j letters of b. Turning a prefix into an empty word costs one delete per letter
 * (column 0), and building a prefix from nothing costs one insert per letter
 * (row 0). If a[i - 1] == b[j - 1] the last letters already agree, so the cell
 * copies its diagonal for free. Otherwise it is 1 + the smallest of three
 * neighbours: up (delete a[i - 1]), left (insert b[j - 1]) or diagonal (replace
 * a[i - 1] with b[j - 1]). Ties prefer replace, then delete, then insert.
 *
 * Words are lower-cased by parse and must have at least one letter. Code lives
 * in content/code/dynamic-programming/edit-distance.{py,java,cpp}.
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

export interface EditDistanceInput {
  /** 1..6 letters, lower case. */
  a: string
  /** 1..6 letters, lower case. */
  b: string
}

export const MAX_LEN = 6
const LIMITS: InputLimits = { maxN: MAX_LEN, min: 1, max: MAX_LEN }

function parseWord(raw: string | undefined, field: 'a' | 'b'): ParseResult<string> {
  const text = (raw ?? '').trim().replace(/^["']|["']$/g, '')
  if (text === '') return { ok: false, field, error: `Type the ${field === 'a' ? 'first' : 'second'} word, like horse.` }
  if (!/^[A-Za-z]+$/.test(text)) return { ok: false, field, error: 'Use letters only, with no spaces, digits or symbols.' }
  if (text.length > MAX_LEN) return { ok: false, field, error: `Use at most ${MAX_LEN} letters so the table stays readable.` }
  return { ok: true, value: text.toLowerCase() }
}

function parseInput(raw: Record<string, string>): ParseResult<EditDistanceInput> {
  const a = parseWord(raw.a, 'a')
  if (!a.ok) return a
  const b = parseWord(raw.b, 'b')
  if (!b.ok) return b
  return { ok: true, value: { a: a.value, b: b.value } }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function copyOrEditPredict(i: number, j: number, x: string, y: string, diag: number, up: number, left: number): PredictCandidate {
  const options = ['Copy the diagonal', '1 + the smallest neighbour']
  const match = x === y
  const smallest = Math.min(diag, up, left)
  return {
    tag: 'copy-or-edit',
    kind: 'choice',
    prompt: `dp[${i}][${j}] compares ${x} (row) with ${y} (column). Copy the diagonal, or 1 + the smallest neighbour?`,
    options,
    answer: match ? options[0] : options[1],
    why: match
      ? `${x} equals ${y}, so no edit is needed: dp[${i}][${j}] copies the diagonal, ${diag}.`
      : `${x} and ${y} differ, so one edit is needed: 1 + the smallest of ${diag}, ${up}, ${left} = ${smallest + 1}.`,
    hint: 'Are the two letters the same?',
  }
}

function run({ a, b }: EditDistanceInput) {
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
    const vars: Record<string, Val> = { i, j, diag, up, left }
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

  emit('init', `Turn "${a}" into "${b}". dp[i][j] = fewest edits to turn the first i letters of a into the first j letters of b.`)

  const baseMarks: NonNullable<GridScene['marks']> = []
  for (let c = 0; c <= n; c++) {
    dp[0][c] = c
    baseMarks.push({ r: 0, c, role: 'changed' })
  }
  for (let r = 1; r <= m; r++) {
    dp[r][0] = r
    baseMarks.push({ r, c: 0, role: 'changed' })
  }
  emit('base', 'Row 0 and column 0 count the inserts or deletes needed to reach or leave an empty word.', { marks: baseMarks })

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
        predict: copyOrEditPredict(r, c, x, y, diag, up, left),
      })
      if (rec.capped) break

      if (x === y) {
        dp[r][c] = diag
        emit('match', `${x} = ${y}: no edit needed. dp[${r}][${c}] copies the diagonal, ${diag}.`, {
          marks: [
            { r: r - 1, c: c - 1, role: 'compare' },
            { r, c, role: 'found' },
          ],
          arrows: [{ from: [r - 1, c - 1], to: [r, c] }],
        })
      } else {
        const best = Math.min(diag, up, left)
        dp[r][c] = best + 1
        const op = best === diag ? 'replace' : best === up ? 'delete' : 'insert'
        const from: [number, number] = best === diag ? [r - 1, c - 1] : best === up ? [r - 1, c] : [r, c - 1]
        emit('edit', `${x} ≠ ${y}: 1 + min(${diag}, ${up}, ${left}) = ${best + 1}. Best is to ${op}.`, {
          marks: [
            { r: r - 1, c: c - 1, role: 'compare' },
            { r: r - 1, c, role: 'compare' },
            { r, c: c - 1, role: 'compare' },
            { r, c, role: 'changed' },
          ],
          arrows: [{ from, to: [r, c] }],
        })
      }
    }
  }

  i = null
  j = null
  diag = null
  up = null
  left = null
  const distance = dp[m][n] as number
  emit(
    'done',
    distance === 0 ? 'The corner holds 0: the words are the same.' : `The corner holds ${distance}: "${a}" turns into "${b}" in ${distance} edit${distance === 1 ? '' : 's'}.`,
    { marks: [{ r: m, c: n, role: 'found' }] },
  )
  return rec.done(distance)
}

/** Independent check: top-down recursion with a memo table. */
function reference({ a, b }: EditDistanceInput): number {
  const memo = new Map<string, number>()
  const solve = (i: number, j: number): number => {
    if (i === 0) return j
    if (j === 0) return i
    const key = `${i},${j}`
    const known = memo.get(key)
    if (known !== undefined) return known
    const value =
      a[i - 1] === b[j - 1] ? solve(i - 1, j - 1) : 1 + Math.min(solve(i - 1, j), solve(i, j - 1), solve(i - 1, j - 1))
    memo.set(key, value)
    return value
  }
  return solve(a.length, b.length)
}

const tracer: Tracer<EditDistanceInput, number> = {
  id: 'dynamic-programming/edit-distance',
  title: 'Edit distance',
  anchors: {
    init: 'Make a table: dp[i][j] = edits from a[:i] to b[:j]',
    base: 'Row 0 and column 0: inserts or deletes only',
    check: 'Look at the letters a[i − 1] and b[j − 1]',
    match: 'Same letter: dp[i][j] = dp[i − 1][j − 1], free',
    edit: 'Different: 1 + min(up, left, diagonal)',
    done: 'The bottom-right cell is the distance',
  },
  vars: [
    { name: 'i', role: 'ptrA' },
    { name: 'j', role: 'ptrB' },
    { name: 'diag', role: 'value' },
    { name: 'up', role: 'value' },
    { name: 'left', role: 'value' },
  ],
  input: {
    fields: [
      { name: 'a', label: 'From word', kind: 'string', placeholder: 'horse', help: `Letters only, up to ${MAX_LEN}` },
      { name: 'b', label: 'To word', kind: 'string', placeholder: 'ros', help: `Letters only, up to ${MAX_LEN}` },
    ],
    parse: parseInput,
    format: ({ a, b }) => ({ a, b }),
    presets: [
      { label: 'horse to ros', value: { a: 'horse', b: 'ros' } },
      { label: 'kitten to sit', value: { a: 'kitten', b: 'sit' } },
      { label: 'Same word', value: { a: 'cat', b: 'cat' } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const word = (): string => Array.from({ length: randInt(rand, 1, MAX_LEN) }, () => 'abc'[randInt(rand, 0, 2)]).join('')
      return { a: word(), b: word() }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
