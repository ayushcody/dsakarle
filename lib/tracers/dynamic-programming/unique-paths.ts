/**
 * Dynamic programming — unique paths (LeetCode 62), two dimensions.
 *
 * A robot starts at the top-left of an m × n grid and may only move right or
 * down. dp[r][c] is the number of paths from the top-left to cell (r, c). Every
 * path into (r, c) arrives from the cell above or the cell to its left, so
 * dp[r][c] = dp[r − 1][c] + dp[r][c − 1]. The first row and the first column
 * have one path each (straight along the edge).
 *
 * Code lives in content/code/dynamic-programming/unique-paths.{py,java,cpp}.
 * This is the template tracer for the lesson.
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

export interface UniquePathsInput {
  /** Rows, 1..6. */
  m: number
  /** Columns, 1..6. */
  n: number
}

export const MAX_SIDE = 6
const LIMITS: InputLimits = { maxN: MAX_SIDE, min: 1, max: MAX_SIDE }
const INTEGER = /^[+-]?\d+$/

function parseSide(raw: Record<string, string>, field: 'm' | 'n', name: string): ParseResult<number> {
  const text = (raw[field] ?? '').replace(/[−–]/g, '-').trim()
  if (text === '') return { ok: false, field, error: `Type the number of ${name}, like 3.` }
  if (!INTEGER.test(text)) return { ok: false, field, error: `${field} must be a whole number, not "${text}".` }
  const value = Number(text)
  if (value < 1) return { ok: false, field, error: `The grid needs at least 1 ${name === 'rows' ? 'row' : 'column'}.` }
  if (value > MAX_SIDE) return { ok: false, field, error: `Use at most ${MAX_SIDE} ${name} so the grid stays readable.` }
  return { ok: true, value }
}

function parseInput(raw: Record<string, string>): ParseResult<UniquePathsInput> {
  const m = parseSide(raw, 'm', 'rows')
  if (!m.ok) return m
  const n = parseSide(raw, 'n', 'columns')
  if (!n.ok) return n
  return { ok: true, value: { m: m.value, n: n.value } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

/** Asked on the look frame: what goes in dp[r][c]? */
function nextValuePredict(r: number, c: number, up: number, left: number): PredictCandidate {
  const sum = up + left
  const options = [String(sum), String(up), String(sum + 1)]
  const rotated = options.map((_, k) => options[(k + r + c) % options.length])
  return {
    tag: 'next-value',
    kind: 'choice',
    prompt: `The cell above holds ${up} and the cell to the left holds ${left}. What goes in dp[${r}][${c}]?`,
    options: rotated,
    answer: String(sum),
    why: `Each path into (${r}, ${c}) comes from above or from the left, and the two groups never overlap: ${up} + ${left} = ${sum}.`,
    hint: 'Paths arrive from exactly two places. Count both groups.',
  }
}

/** Asked on the frame before a look frame: which cell is the "above" cell? */
function whichCellPredict(r: number, c: number): PredictCandidate {
  return {
    tag: 'which-cells',
    kind: 'cell',
    prompt: `Next is dp[${r}][${c}] (row ${r}, column ${c}). It adds two neighbours. Click the one directly above it.`,
    answer: `${r - 1},${c}`,
    why: `Paths can only move right or down, so a path into (${r}, ${c}) came from (${r - 1}, ${c}) above or from (${r}, ${c - 1}) on the left.`,
    hint: 'Moving down means the previous cell was one row up.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ m, n }: UniquePathsInput) {
  const rec = createRecorder<number>()

  const dp: Array<Array<number | null>> = Array.from({ length: m }, () => Array.from({ length: n }, () => null))
  const rowLabels = dp.map((_, r) => String(r))
  const colLabels = dp[0].map((_, c) => String(c))
  const total = m * n

  let r: number | null = null
  let c: number | null = null
  let up: number | null = null
  let left: number | null = null
  let ways: number | null = null

  const emit = (
    at: string,
    say: string,
    extra: {
      marks?: NonNullable<GridScene['marks']>
      arrows?: GridScene['arrows']
      annotations?: GridScene['annotations']
      predict?: PredictCandidate
    } = {},
  ): void => {
    const scene: GridScene = { kind: 'grid', label: 'dp', rows: dp.map((row) => row.slice()), rowLabels, colLabels }
    if (extra.marks?.length) scene.marks = extra.marks
    if (extra.arrows?.length) scene.arrows = extra.arrows
    if (extra.annotations?.length) scene.annotations = extra.annotations
    const vars: Record<string, Val> = { m, n, r, c, up, left, ways }
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

  emit('init', `Make an empty ${m} × ${n} table. dp[r][c] will count the paths from the top-left to cell (r, c).`)

  const baseMarks: NonNullable<GridScene['marks']> = []
  for (let row = 0; row < m; row++) {
    dp[row][0] = 1
    baseMarks.push({ r: row, c: 0, role: 'changed' })
  }
  for (let col = 0; col < n; col++) {
    dp[0][col] = 1
    if (col > 0) baseMarks.push({ r: 0, c: col, role: 'changed' })
  }
  const innerLeft = (m - 1) * (n - 1)
  emit(
    'base',
    innerLeft > 0
      ? 'The first row and first column can only be reached by going straight, so each cell there is 1.'
      : `With one ${m === 1 ? 'row' : 'column'}, every cell can only be reached by going straight: each is 1.`,
    {
      marks: baseMarks,
      predict: innerLeft > 0 ? whichCellPredict(1, 1) : undefined,
    },
  )

  for (let row = 1; row < m && !rec.capped; row++) {
    for (let col = 1; col < n && !rec.capped; col++) {
      r = row
      c = col
      up = dp[row - 1][col] as number
      left = dp[row][col - 1] as number
      const arrows: GridScene['arrows'] = [
        { from: [row - 1, col], to: [row, col] },
        { from: [row, col - 1], to: [row, col] },
      ]
      emit('look', `dp[${row}][${col}] reads the cell above (${up}) and the cell to its left (${left}).`, {
        marks: [
          { r: row - 1, c: col, role: 'compare' },
          { r: row, c: col - 1, role: 'compare' },
          { r: row, c: col, role: 'focus' },
        ],
        arrows,
        annotations: [
          { target: `cell:${row - 1},${col}`, text: 'up' },
          { target: `cell:${row},${col - 1}`, text: 'left' },
        ],
        predict: nextValuePredict(row, col, up, left),
      })
      if (rec.capped) break

      dp[row][col] = up + left
      // The frame after this one is the next look frame (if any): ask which cell is "above" it.
      const nextCol = col + 1 < n ? col + 1 : 1
      const nextRow = col + 1 < n ? row : row + 1
      emit('fill', `dp[${row}][${col}] = ${up} + ${left} = ${dp[row][col]}. Written once, never recomputed.`, {
        marks: [{ r: row, c: col, role: 'changed' }],
        arrows,
        predict: nextRow < m ? whichCellPredict(nextRow, nextCol) : undefined,
      })
    }
  }

  ways = dp[m - 1][n - 1]
  r = null
  c = null
  up = null
  left = null
  emit('done', `The bottom-right cell holds ${ways}: there ${ways === 1 ? 'is 1 path' : `are ${ways} paths`} from the top-left to the bottom-right.`, {
    marks: [{ r: m - 1, c: n - 1, role: 'found' }],
  })

  return rec.done(ways as number)
}

/** Independent check: the closed form C(m + n − 2, m − 1), built with exact integer steps. */
function reference({ m, n }: UniquePathsInput): number {
  let result = 1
  for (let k = 1; k <= m - 1; k++) result = (result * (n - 1 + k)) / k
  return result
}

const tracer: Tracer<UniquePathsInput, number> = {
  id: 'dynamic-programming/unique-paths',
  title: 'Grid paths (2D)',
  anchors: {
    init: 'Make an m × n table: dp[r][c] = paths to cell (r, c)',
    base: 'First row and first column are 1: only one straight path',
    look: 'Read the cell above and the cell to the left',
    fill: 'dp[r][c] = up + left',
    done: 'The bottom-right cell is the answer',
  },
  vars: [
    { name: 'm', role: 'value' },
    { name: 'n', role: 'value' },
    { name: 'r', role: 'ptrA' },
    { name: 'c', role: 'ptrB' },
    { name: 'up', role: 'value' },
    { name: 'left', role: 'value' },
    { name: 'ways', role: 'best' },
  ],
  input: {
    fields: [
      { name: 'm', label: 'Rows (m)', kind: 'int', placeholder: '3', help: `1 to ${MAX_SIDE}` },
      { name: 'n', label: 'Columns (n)', kind: 'int', placeholder: '4', help: `1 to ${MAX_SIDE}` },
    ],
    parse: parseInput,
    format: ({ m, n }) => ({ m: String(m), n: String(n) }),
    presets: [
      { label: '3 × 4 grid', value: { m: 3, n: 4 } },
      { label: '4 × 6 grid', value: { m: 4, n: 6 } },
      { label: 'Single row', value: { m: 1, n: 5 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      return { m: randInt(rand, 1, MAX_SIDE), n: randInt(rand, 1, MAX_SIDE) }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
