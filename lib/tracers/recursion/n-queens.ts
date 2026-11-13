/**
 * Backtracking — N-Queens, stopping at the first solution (LeetCode 51, one answer).
 *
 * One queen per row. `place(row)` tries the columns 0..n-1 of that row:
 *   try       look at one column (shown only while the run is short enough)
 *   conflict  an earlier queen shares the column or a diagonal: skip the column
 *   place     no earlier queen attacks the square: put the queen there
 *   recurse   call place(row + 1) for the next row
 *   unplace   place(row + 1) failed: take the queen off again (backtrack)
 *   solved    row == n: every row has a queen, stop everywhere
 * A row whose columns are all attacked returns False; the row above then runs
 * its `unplace` and moves on to its next column.
 *
 * Input: n (4..6) only; columns are always tried left to right, 0..n-1.
 *
 * Scenes: a composite column of the board (GridScene, "Q" in placed cells) and
 * `cols`, the column of each row's queen. Marks: focus = square being tried,
 * error = a square that is attacked, compare = the queen that attacks it,
 * visited = queens already on the board, changed = the queen just placed or
 * removed, found = the finished solution.
 *
 * Frame budget: the longest run (n = 6) is 229 frames, under MAX_FRAMES.
 * Code lives in content/code/recursion/n-queens.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  ArrayScene,
  Frame,
  GridScene,
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

export interface NQueensInput {
  /** Board size, 4..6. */
  n: number
}

const MIN_N = 4
const MAX_N = 6
const LIMITS: InputLimits = { maxN: MAX_N, min: MIN_N, max: MAX_N }

const INTEGER = /^[+-]?\d+$/

function parseInput(raw: Record<string, string>): ParseResult<NQueensInput> {
  const text = (raw.n ?? '').trim()
  if (text === '') return { ok: false, field: 'n', error: `Type the board size, a whole number from ${MIN_N} to ${MAX_N}, like 4.` }
  if (!INTEGER.test(text)) return { ok: false, field: 'n', error: `"${text.slice(0, 12)}" isn't a whole number. Try 4.` }
  const n = Number(text)
  if (n < MIN_N || n > MAX_N) return { ok: false, field: 'n', error: `Keep the board size between ${MIN_N} and ${MAX_N}.` }
  return { ok: true, value: { n } }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sq = (r: number, c: number): string => `(row ${r}, col ${c})`

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ n }: NQueensInput) {
  const rec = createRecorder<number[]>()
  const cols: number[] = []
  let solved = false

  /** First earlier queen [row, col] that attacks (row, c), or null. */
  const attacker = (row: number, c: number): [number, number] | null => {
    for (let r = 0; r < row; r++) {
      if (cols[r] === c || Math.abs(cols[r] - c) === row - r) return [r, cols[r]]
    }
    return null
  }

  interface Opts {
    focus?: [number, number]
    error?: [number, number]
    from?: [number, number]
    changed?: [number, number]
    found?: boolean
    note?: { r: number; c: number; text: string }
    predict?: PredictCandidate
  }

  const emit = (at: string, say: string, row: number, col: number | null, opts: Opts = {}): void => {
    const rows: GridScene['rows'] = Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (_, c) => (cols[r] === c ? 'Q' : null)),
    )
    const marks: Array<{ r: number; c: number; role: MarkRole }> = []
    cols.forEach((c, r) => marks.push({ r, c, role: opts.found ? 'found' : 'visited' }))
    if (opts.changed) marks.push({ r: opts.changed[0], c: opts.changed[1], role: 'changed' })
    if (opts.from) marks.push({ r: opts.from[0], c: opts.from[1], role: 'compare' })
    if (opts.focus) marks.push({ r: opts.focus[0], c: opts.focus[1], role: 'focus' })
    if (opts.error) marks.push({ r: opts.error[0], c: opts.error[1], role: 'error' })
    const grid: GridScene = {
      kind: 'grid',
      rows,
      rowLabels: Array.from({ length: n }, (_, r) => String(r)),
      colLabels: Array.from({ length: n }, (_, c) => String(c)),
      marks,
      ...(opts.note ? { annotations: [{ target: `cell:${opts.note.r},${opts.note.c}`, text: opts.note.text }] } : {}),
    }
    const arrayScene: ArrayScene = {
      kind: 'array',
      label: 'cols',
      cells: Array.from({ length: n }, (_, r) => (r < cols.length ? cols[r] : null)),
      capacity: n,
      marks: [
        ...cols.map((_, r) => ({ index: r, role: (opts.found ? 'found' : 'visited') as MarkRole })),
        ...(opts.changed ? [{ index: opts.changed[0], role: 'changed' as MarkRole }] : []),
      ],
    }
    const vars: Record<string, Val> = { row, col, cols: cols.slice() }
    const frame: Frame = {
      scene: {
        kind: 'composite',
        layout: 'column',
        parts: [
          { title: 'Board: one queen per row', scene: grid },
          { title: 'cols[row] = column of that row\'s queen', scene: arrayScene },
        ],
      },
      vars,
      say,
      at,
      gauge: { value: cols.length, max: n, label: 'Queens placed' },
    }
    if (opts.predict) frame.predict = opts.predict
    rec.frame(frame)
  }

  const backtrackQuestion = (row: number, c: number, what: string): PredictCandidate => {
    const last = c === n - 1
    return {
      tag: 'backtrack-or-continue',
      kind: 'choice',
      prompt: `${what} Row ${row} has ${last ? 'no columns left to try' : 'more columns to try'}. What happens next?`,
      options: row % 2 === 0
        ? ['Try the next column', 'Backtrack to the row above']
        : ['Backtrack to the row above', 'Try the next column'],
      answer: last ? 'Backtrack to the row above' : 'Try the next column',
      why: last
        ? `Every column of row ${row} is used up. The row above must remove its queen and try its next column.`
        : `Row ${row} still has columns left, so it moves on to the next one before giving up.`,
      hint: 'Count the columns this row has not tried yet.',
    }
  }

  const place = (row: number): boolean => {
    if (rec.capped) return false
    for (let k = 0; k < n; k++) {
      const c = k
      const by = attacker(row, c)
      {
        emit('try', `Row ${row}: try column ${c}. Is ${sq(row, c)} safe from the queens above?`, row, c, {
          focus: [row, c],
          predict: {
            tag: 'safe-or-attacked',
            kind: 'choice',
            prompt: `Row ${row}, column ${c}, with queens at ${cols.length ? cols.map((q, r) => sq(r, q)).join(', ') : 'none yet'}. Is this square safe?`,
            options: (row + c) % 2 === 0 ? ['Safe', 'Attacked'] : ['Attacked', 'Safe'],
            answer: by ? 'Attacked' : 'Safe',
            why: by
              ? `The queen at ${sq(by[0], by[1])} shares ${by[1] === c ? 'the column' : 'a diagonal'} with it, so it attacks this square.`
              : 'No earlier queen shares its column or either diagonal, so the square is safe.',
            hint: 'Compare the column, and the row and column differences, with each queen above.',
          },
        })
      }
      if (by) {
        emit(
          'conflict',
          `${sq(row, c)} is attacked by the queen at ${sq(by[0], by[1])} (${by[1] === c ? 'same column' : 'same diagonal'}). Skip it.`,
          row,
          c,
          {
            error: [row, c],
            from: by,
            note: { r: row, c, text: 'attacked' },
            predict: backtrackQuestion(row, c, `Column ${c} is attacked.`),
          },
        )
        continue
      }
      cols.push(c)
      emit(
        'place',
        `${sq(row, c)} is safe. Place a queen there. cols = [${cols.join(', ')}].`,
        row,
        c,
        { changed: [row, c] },
      )
      if (row === n - 1) {
        solved = true
        emit('solved', `Row ${n} of ${n} has a queen: row == n is the base case. The first solution is [${cols.join(', ')}].`, n, null, {
          found: true,
        })
        return true
      }
      emit('recurse', `Recurse: place(${row + 1}) starts on row ${row + 1} with ${cols.length} ${cols.length === 1 ? 'queen' : 'queens'} on the board.`, row + 1, null)
      if (place(row + 1)) return true
      if (rec.capped) return false
      cols.pop()
      emit(
        'unplace',
        `place(${row + 1}) found no safe column. Backtrack: take the queen off ${sq(row, c)}.`,
        row,
        c,
        { changed: [row, c], predict: backtrackQuestion(row, c, `The queen at ${sq(row, c)} is removed.`) },
      )
    }
    return false
  }

  emit('init', `Start with an empty board and an empty cols list. place(0) fills row 0 first.`, 0, null)
  place(0)
  emit('done', `Return cols = [${cols.join(', ')}]: the column of the queen in each row.`, n, null, { found: true })
  return rec.done(solved ? cols.slice() : [])
}

/** Independent version: walk every column assignment in order and keep the first legal one. */
function reference({ n }: NQueensInput): number[] {
  const pos = new Array<number>(n).fill(0)
  for (;;) {
    let ok = true
    for (let a = 0; a < n && ok; a++) {
      for (let b = a + 1; b < n; b++) {
        if (pos[a] === pos[b] || Math.abs(pos[a] - pos[b]) === b - a) {
          ok = false
          break
        }
      }
    }
    if (ok) return pos.slice()
    // Count up like an odometer, last row fastest.
    let i = n - 1
    while (i >= 0 && pos[i] === n - 1) pos[i--] = 0
    if (i < 0) return []
    pos[i]++
  }
}

const tracer: Tracer<NQueensInput, number[]> = {
  id: 'recursion/n-queens',
  title: 'N-Queens',
  anchors: {
    init: 'Start with an empty board and call place(0)',
    try: 'Try the next column of this row',
    conflict: 'Conflict: an earlier queen attacks the square, skip it',
    place: 'Safe: put the queen on the square',
    recurse: 'Recurse: place the next row',
    unplace: 'Backtrack: the rows below failed, remove the queen',
    solved: 'Base case: every row has a queen, stop',
    done: 'Return the column of each row\'s queen',
  },
  vars: [
    { name: 'row', label: 'row', role: 'ptrA' },
    { name: 'col', label: 'col', role: 'ptrB' },
    { name: 'cols', label: 'cols', role: 'value' },
  ],
  input: {
    fields: [
      {
        name: 'n',
        label: 'Board size n',
        kind: 'int',
        placeholder: 'e.g. 4',
        help: `n queens on an n by n board, ${MIN_N} to ${MAX_N}.`,
      },
    ],
    parse: parseInput,
    format: ({ n }) => ({ n: String(n) }),
    presets: [
      { label: '4 queens: place, check, backtrack', value: { n: 4 } },
      { label: '5 queens', value: { n: 5 } },
      { label: '6 queens', value: { n: 6 } },
    ],
    random(seed) {
      return { n: randInt(mulberry32(seed), MIN_N, MAX_N) }
    },
    space: 3,
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
