/**
 * BFS & DFS — number of islands (LeetCode 200) by flood fill with an explicit stack.
 *
 * Input is a small grid of rows written as text of `1` (land) and `0` (water),
 * like `1100/1001/0011`. Only up, right, down, left count as touching.
 * Scan the cells row by row. A land cell with no label yet starts a new island:
 * count it, label it with the next letter and push it on a stack. Then fill:
 * pop a cell, look at its neighbours (up, right, down, left) and label and push
 * every unlabelled land neighbour. Labelling on push means a cell is never
 * pushed twice. The input grid is never changed; labels live in their own table.
 *
 * One frame per idea:
 *   init     nothing labelled, count 0
 *   scan     the scan reaches a land cell (water is skipped without a frame)
 *   counted  that land cell already has a label: skip it
 *   island   a new island: count it, label the cell, push it
 *   visit    pop a cell off the stack
 *   push     the popped cell's unlabelled land neighbours get the label and go on the stack
 *   done     return the count
 *
 * Scene: composite column, the grid on top and the stack under it. Grid cells:
 * `0` water, `1` land with no label, a letter A, B, C... = that island's label.
 * Marks: focus = the cell being scanned or popped, compare = cells waiting on
 * the stack, visited = labelled and finished, changed = just labelled,
 * found = every island at the end.
 * Code lives in content/code/bfs-dfs/islands.{py,java,cpp}.
 */
import { createRecorder } from '@/lib/engine/recorder'
import { mulberry32, randInt } from '../rng'
import type {
  Annotation,
  CompositeScene,
  GridScene,
  InputLimits,
  MarkRole,
  ParseResult,
  PredictCandidate,
  StackScene,
  Tracer,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface IslandsInput {
  /** Equal-length rows of `1` (land) and `0` (water). */
  rows: string[]
}

/** maxN is the largest side of the grid. */
const LIMITS: InputLimits = { maxN: 6, min: 0, max: 0 }
const EXAMPLE = '11000/11001/00100'

function parseInput(raw: Record<string, string>): ParseResult<IslandsInput> {
  const field = 'grid'
  const fail = (error: string): ParseResult<IslandsInput> => ({ ok: false, field, error })
  const tokens = (raw.grid ?? '').split(/[\s/|,;]+/).filter((t) => t !== '')

  if (tokens.length === 0) return fail(`Type the grid row by row, like ${EXAMPLE}. 1 is land, 0 is water.`)
  if (tokens.length > LIMITS.maxN) return fail(`Use at most ${LIMITS.maxN} rows so the picture stays readable.`)
  for (const [i, row] of tokens.entries()) {
    const bad = [...row].find((ch) => ch !== '0' && ch !== '1')
    if (bad !== undefined) return fail(`Row ${i + 1} has "${bad}". Use 1 for land and 0 for water.`)
  }
  const width = tokens[0].length
  for (const [i, row] of tokens.entries()) {
    if (row.length !== width) {
      return fail(`Every row needs the same width: row 1 has ${width} cells but row ${i + 1} has ${row.length}.`)
    }
  }
  if (width > LIMITS.maxN) return fail(`Use at most ${LIMITS.maxN} columns so the picture stays readable.`)
  return { ok: true, value: { rows: tokens } }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** up, right, down, left — the same order as the code files. */
const DIRS: Array<[number, number]> = [[-1, 0], [0, 1], [1, 0], [0, -1]]

const at = (r: number, c: number): string => `(${r},${c})`
const letter = (island: number): string => String.fromCharCode(64 + island)

const NEW = 'New island'
const COUNTED = 'Already counted'

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ rows }: IslandsInput) {
  const rec = createRecorder<number>()
  const R = rows.length
  const C = rows[0].length

  // Working state — mirrors the variables in the code files.
  const label: number[][] = rows.map((line) => [...line].map(() => 0))
  let count = 0
  const stack: Array<[number, number]> = []
  let scan: [number, number] | null = null
  let cur: [number, number] | null = null
  let fresh: Array<[number, number]> = []
  let final = false
  const finished = new Set<string>()
  const key = (r: number, c: number): string => `${r},${c}`

  const emit = (atRule: string, say: string, notes: Annotation[] = [], predict?: PredictCandidate): void => {
    const waiting = new Set(stack.map(([r, c]) => key(r, c)))
    const fresh_ = new Set(fresh.map(([r, c]) => key(r, c)))
    const cells: GridScene['rows'] = rows.map((line, r) =>
      [...line].map((ch, c) => (ch === '0' ? '0' : label[r][c] > 0 ? letter(label[r][c]) : '1')),
    )
    const marks: GridScene['marks'] = []
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        const k = key(r, c)
        const isCur = (cur && cur[0] === r && cur[1] === c) || (scan && !cur && scan[0] === r && scan[1] === c)
        if (final && label[r][c] > 0) marks.push({ r, c, role: 'found' })
        else if (isCur) marks.push({ r, c, role: 'focus' })
        else if (fresh_.has(k)) marks.push({ r, c, role: 'changed' })
        else if (waiting.has(k)) marks.push({ r, c, role: 'compare' })
        else if (finished.has(k)) marks.push({ r, c, role: 'visited' })
      }
    }
    const pointers: NonNullable<GridScene['pointers']> = []
    if (scan && !final) pointers.push({ name: 'scan', r: scan[0], c: scan[1], role: 'ptrA' })
    if (cur) pointers.push({ name: 'cur', r: cur[0], c: cur[1], role: 'focus' })
    const grid: GridScene = {
      kind: 'grid',
      label: 'grid',
      rows: cells,
      rowLabels: rows.map((_, r) => String(r)),
      colLabels: Array.from({ length: C }, (_, c) => String(c)),
      marks,
      pointers,
    }
    if (notes.length > 0) grid.annotations = notes
    const stackScene: StackScene = {
      kind: 'stack',
      label: 'stack',
      items: stack.map(([r, c]) => at(r, c)),
    }
    if (stack.length > 0) stackScene.marks = [{ index: stack.length - 1, role: 'focus' as MarkRole }]
    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { title: 'Grid: 1 land, 0 water, letters are island labels', scene: grid },
        { scene: stackScene },
      ],
    }
    rec.frame({
      scene,
      vars: {
        scan: scan ? at(scan[0], scan[1]) : null,
        cur: cur ? at(cur[0], cur[1]) : null,
        count,
        stack: stack.length,
      },
      say,
      at: atRule,
      ...(predict ? { predict } : {}),
    })
  }

  emit('init', `A ${R} by ${C} grid. No cell has a label yet and the island count is 0.`)

  for (let r = 0; r < R && !rec.capped; r++) {
    for (let c = 0; c < C && !rec.capped; c++) {
      if (rows[r][c] !== '1') continue // water: skipped, no frame
      scan = [r, c]
      cur = null
      fresh = []
      const isNew = label[r][c] === 0
      emit(
        'scan',
        `The scan reaches land at ${at(r, c)}. Does it have a label yet?`,
        [],
        {
          tag: 'new-island',
          kind: 'choice',
          prompt: `The scan reaches land at ${at(r, c)}. New island, or already counted?`,
          options: (r + c) % 2 === 0 ? [NEW, COUNTED] : [COUNTED, NEW],
          answer: isNew ? NEW : COUNTED,
          why: isNew
            ? 'No earlier fill reached this cell, so it belongs to an island nobody has counted yet.'
            : `An earlier fill already labelled it ${letter(label[r][c])}, so it is part of an island counted before.`,
          hint: 'Look for a letter in the cell: a label means an earlier fill reached it.',
        },
      )
      if (rec.capped) break
      if (!isNew) {
        emit('counted', `${at(r, c)} already carries label ${letter(label[r][c])}. Skip it; that island is counted.`)
        continue
      }

      count++
      label[r][c] = count
      stack.push([r, c])
      fresh = [[r, c]]
      emit('island', `New island! Count is ${count}. Label ${at(r, c)} with ${letter(count)} and push it on the stack.`)

      while (stack.length > 0 && !rec.capped) {
        const [cr, cc] = stack.pop()!
        cur = [cr, cc]
        fresh = []
        emit('visit', `Pop ${at(cr, cc)} off the stack and check its four neighbours.`)
        if (rec.capped) break
        const pushed: Array<[number, number]> = []
        for (const [dr, dc] of DIRS) {
          const nr = cr + dr
          const nc = cc + dc
          if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue
          if (rows[nr][nc] !== '1' || label[nr][nc] !== 0) continue
          label[nr][nc] = count
          stack.push([nr, nc])
          pushed.push([nr, nc])
        }
        finished.add(key(cr, cc))
        if (pushed.length === 0) continue
        fresh = pushed
        const top = stack[stack.length - 1]
        const names = pushed.map(([pr, pc]) => at(pr, pc)).join(' and ')
        let predict: PredictCandidate | undefined
        if (stack.length >= 2) {
          const recent = stack.slice(-4).map(([sr, sc]) => at(sr, sc))
          const k = (cr + cc) % recent.length
          const options = [...recent.slice(k), ...recent.slice(0, k)]
          predict = {
            tag: 'next-fill',
            kind: 'choice',
            prompt: `The stack holds ${stack.length} cells. Which one does the fill pop next?`,
            options,
            answer: at(top[0], top[1]),
            why: `A stack gives back the last cell pushed first, so ${at(top[0], top[1])} comes off next.`,
            hint: 'Last in, first out: the newest cell on the stack leaves first.',
          }
        }
        emit('push', `Label ${names} with ${letter(count)} and push ${pushed.length === 1 ? 'it' : 'them'} on the stack.`, [], predict)
      }
      cur = null
      fresh = []
    }
  }

  scan = null
  cur = null
  fresh = []
  final = true
  emit('done', count === 0 ? 'The scan found no land at all: 0 islands.' : `The scan is finished. ${count} ${count === 1 ? 'island' : 'islands'}.`)
  return rec.done(count)
}

/** Independent version: breadth-first search with a visited set. */
function reference({ rows }: IslandsInput): number {
  const R = rows.length
  const C = rows[0].length
  const seen = new Set<number>()
  let islands = 0
  for (let start = 0; start < R * C; start++) {
    if (rows[Math.floor(start / C)][start % C] !== '1' || seen.has(start)) continue
    islands++
    const queue = [start]
    seen.add(start)
    for (let head = 0; head < queue.length; head++) {
      const r = Math.floor(queue[head] / C)
      const c = queue[head] % C
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr
        const nc = c + dc
        if (nr < 0 || nr >= R || nc < 0 || nc >= C || rows[nr][nc] !== '1' || seen.has(nr * C + nc)) continue
        seen.add(nr * C + nc)
        queue.push(nr * C + nc)
      }
    }
  }
  return islands
}

const tracer: Tracer<IslandsInput, number> = {
  id: 'bfs-dfs/islands',
  title: 'Number of islands: flood fill',
  anchors: {
    init: 'Start with no labels and a count of 0',
    scan: 'Scan the grid row by row; stop on land',
    counted: 'Land that already has a label belongs to a counted island: skip',
    island: 'Unlabelled land is a new island: count it, label it, push it',
    visit: 'Pop a cell off the stack',
    push: 'Label and push every unlabelled land neighbour',
    done: 'Return the island count',
  },
  vars: [
    { name: 'scan', label: 'scan (row,col)', role: 'ptrA' },
    { name: 'cur', label: 'popped cell', role: 'focus' },
    { name: 'count', label: 'islands', role: 'best' },
    { name: 'stack', label: 'cells on stack', role: 'value' },
  ],
  input: {
    fields: [
      {
        name: 'grid',
        label: 'Grid',
        kind: 'string',
        placeholder: EXAMPLE,
        help: `Rows separated by /, up to ${LIMITS.maxN} by ${LIMITS.maxN}. 1 is land, 0 is water.`,
      },
    ],
    parse: parseInput,
    format: ({ rows }) => ({ grid: rows.join('/') }),
    presets: [
      { label: 'Four islands', value: { rows: ['11000', '11001', '00100', '00011'] } },
      { label: 'Diagonals do not connect', value: { rows: ['1010', '0101', '1010'] } },
      { label: 'One island around a lake', value: { rows: ['111', '101', '111'] } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const R = randInt(rand, 3, 6)
      const C = randInt(rand, 3, 6)
      const density = 0.35 + rand() * 0.25
      return {
        rows: Array.from({ length: R }, () =>
          Array.from({ length: C }, () => (rand() < density ? '1' : '0')).join(''),
        ),
      }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
