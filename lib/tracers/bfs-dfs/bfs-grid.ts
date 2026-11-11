/**
 * BFS & DFS — shortest path on a grid with breadth-first search.
 *
 * Input is a small grid written as rows of text: `S` start, `E` end, `.` open,
 * `#` wall (`S..#/.#../...E`). Moves are up, right, down, left. The queue holds
 * cells waiting to be expanded; `dist` stamps every cell the moment it is first
 * seen, so a cell is never queued twice. The input grid is never changed: the
 * distances live in their own table.
 *
 * One frame per idea:
 *   init      stamp S with 0 and queue it
 *   pop       take the front cell out of the queue
 *   skip      a neighbour is a wall or already has a distance
 *   discover  a neighbour is new: stamp dist + 1 and queue it
 *   done      E was popped (answer = its distance), or the queue ran dry (-1)
 * Off-grid neighbours are skipped silently (no frame).
 *
 * Scene: a composite column, the grid on top and the queue under it. Marks:
 * focus = the cell being expanded, compare = cells waiting in the queue,
 * visited = cells already expanded, discarded = the neighbour just skipped,
 * changed = the neighbour just stamped, found = the shortest path.
 * Code lives in content/code/bfs-dfs/bfs-grid.{py,java,cpp}.
 */
import { createRecorder } from '@/lib/engine/recorder'
import { mulberry32, randInt } from '../rng'
import type {
  Annotation,
  ArrayScene,
  CompositeScene,
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

export interface BfsGridInput {
  /** Equal-length rows of `S`, `E`, `.` and `#`; exactly one S and one E. */
  rows: string[]
}

/** maxN is the largest side of the grid. */
const LIMITS: InputLimits = { maxN: 6, min: 0, max: 0 }
const EXAMPLE = 'S..#/.#../...E'

function parseInput(raw: Record<string, string>): ParseResult<BfsGridInput> {
  const field = 'grid'
  const fail = (error: string): ParseResult<BfsGridInput> => ({ ok: false, field, error })
  const tokens = (raw.grid ?? '')
    .toUpperCase()
    .split(/[\s/|,;]+/)
    .filter((t) => t !== '')

  if (tokens.length === 0) return fail(`Type the grid row by row, like ${EXAMPLE}. S start, E end, . open, # wall.`)
  if (tokens.length > LIMITS.maxN) return fail(`Use at most ${LIMITS.maxN} rows so the picture stays readable.`)
  for (const [i, row] of tokens.entries()) {
    const bad = [...row].find((ch) => !'SE.#'.includes(ch))
    if (bad !== undefined) return fail(`Row ${i + 1} has "${bad}". Use S (start), E (end), . (open) or # (wall).`)
  }
  const width = tokens[0].length
  for (const [i, row] of tokens.entries()) {
    if (row.length !== width) {
      return fail(`Every row needs the same width: row 1 has ${width} cells but row ${i + 1} has ${row.length}.`)
    }
  }
  if (width > LIMITS.maxN) return fail(`Use at most ${LIMITS.maxN} columns so the picture stays readable.`)
  const text = tokens.join('')
  const count = (ch: string): number => [...text].filter((c) => c === ch).length
  if (count('S') !== 1) return fail('Put exactly one S (the start) in the grid.')
  if (count('E') !== 1) return fail('Put exactly one E (the end) in the grid.')
  return { ok: true, value: { rows: tokens } }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** up, right, down, left — the same order as the code files. */
const DIRS: Array<{ dr: number; dc: number; name: string }> = [
  { dr: -1, dc: 0, name: 'up' },
  { dr: 0, dc: 1, name: 'right' },
  { dr: 1, dc: 0, name: 'down' },
  { dr: 0, dc: -1, name: 'left' },
]

const at = (r: number, c: number): string => `(${r},${c})`

function findCell(rows: string[], ch: string): [number, number] {
  for (let r = 0; r < rows.length; r++) {
    const c = rows[r].indexOf(ch)
    if (c >= 0) return [r, c]
  }
  throw new Error(`no ${ch} in grid`)
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ rows }: BfsGridInput) {
  const rec = createRecorder<number>()
  const R = rows.length
  const C = rows[0].length
  const [sr, sc] = findCell(rows, 'S')
  const [er, ec] = findCell(rows, 'E')
  const open = rows.join('').replace(/#/g, '').length

  // Working state — mirrors the variables in the code files.
  const dist: number[][] = rows.map((line) => [...line].map(() => -1))
  dist[sr][sc] = 0
  const queue: Array<[number, number]> = [[sr, sc]]
  const expanded = new Set<string>()
  let cur: [number, number] | null = null
  let nb: [number, number] | null = null
  let skipped: [number, number] | null = null
  let fresh: [number, number] | null = null
  let path = new Set<string>()
  let failed = false
  let reached = 1

  const key = (r: number, c: number): string => `${r},${c}`
  const inQueue = (): Set<string> => new Set(queue.map(([r, c]) => key(r, c)))

  const gridScene = (notes: Annotation[]): GridScene => {
    const queued = inQueue()
    const cells: GridScene['rows'] = rows.map((line, r) =>
      [...line].map((ch, c) => {
        if (ch === '#') return '#'
        if (r === sr && c === sc) return 'S'
        if (dist[r][c] >= 0) return dist[r][c]
        return ch === 'E' ? 'E' : null
      }),
    )
    const marks: Array<{ r: number; c: number; role: MarkRole }> = []
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        const k = key(r, c)
        if (skipped && skipped[0] === r && skipped[1] === c) {
          marks.push({ r, c, role: 'discarded' })
        } else if (path.has(k)) {
          marks.push({ r, c, role: 'found' })
        } else if (failed && r === er && c === ec) {
          marks.push({ r, c, role: 'error' })
        } else if (cur && cur[0] === r && cur[1] === c) {
          marks.push({ r, c, role: 'focus' })
        } else if (queued.has(k)) {
          marks.push({ r, c, role: 'compare' })
          if (fresh && fresh[0] === r && fresh[1] === c) marks.push({ r, c, role: 'changed' })
        } else if (expanded.has(k)) {
          marks.push({ r, c, role: 'visited' })
        }
      }
    }
    const pointers: NonNullable<GridScene['pointers']> = []
    if (cur) pointers.push({ name: 'cur', r: cur[0], c: cur[1], role: 'focus' })
    if (nb) pointers.push({ name: 'next', r: nb[0], c: nb[1], role: 'ptrB' })
    const scene: GridScene = {
      kind: 'grid',
      rows: cells,
      rowLabels: rows.map((_, r) => String(r)),
      colLabels: Array.from({ length: C }, (_, c) => String(c)),
      marks,
      pointers,
    }
    if (notes.length > 0) scene.annotations = notes
    return scene
  }

  const queueScene = (): ArrayScene => {
    const scene: ArrayScene = {
      kind: 'array',
      label: 'queue',
      cells: queue.map(([r, c]) => key(r, c)),
    }
    if (queue.length > 0) {
      scene.pointers = [
        { name: 'front', index: 0, role: 'ptrA' },
        { name: 'back', index: queue.length - 1, role: 'ptrB' },
      ]
    }
    if (fresh) {
      const i = queue.findIndex(([r, c]) => r === fresh![0] && c === fresh![1])
      if (i >= 0) scene.marks = [{ index: i, role: 'changed' }]
    }
    return scene
  }

  const emit = (atRule: string, say: string, notes: Annotation[] = [], predict?: PredictCandidate): void => {
    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { title: 'Grid: distance from S, written in each cell', scene: gridScene(notes) },
        { title: 'Queue (front is next out)', scene: queueScene() },
      ],
    }
    const vars: Record<string, Val> = {
      cell: cur ? key(cur[0], cur[1]) : null,
      dist: cur ? dist[cur[0]][cur[1]] : null,
      queued: queue.length,
    }
    const frame: Frame = {
      scene,
      vars,
      say,
      at: atRule,
      gauge: { value: reached, max: open, label: 'Cells reached' },
    }
    if (predict) frame.predict = predict
    rec.frame(frame)
  }

  // --- predicts ------------------------------------------------------------

  const nextFromQueue = (): PredictCandidate | undefined => {
    if (queue.length < 2) return undefined
    const [r, c] = queue[0]
    return {
      tag: 'next-from-queue',
      kind: 'cell',
      prompt: `The queue holds ${queue.length} cells. Click the cell that comes out of the queue next.`,
      answer: key(r, c),
      why: `A queue is first in, first out. ${at(r, c)} has waited longest, so it is the front and leaves first.`,
      hint: 'Look at the front end of the queue: the oldest cell.',
    }
  }

  /** Neighbour indices (from `from`) that are inside the grid. */
  const nextInBounds = (r: number, from: number, c: number): number => {
    for (let i = from; i < DIRS.length; i++) {
      const nr = r + DIRS[i].dr
      const nc = c + DIRS[i].dc
      if (nr >= 0 && nr < R && nc >= 0 && nc < C) return i
    }
    return -1
  }
  const isNew = (nr: number, nc: number): boolean => rows[nr][nc] !== '#' && dist[nr][nc] === -1

  /** Predict for the frame before the next neighbour check from `from` (or before the next pop). */
  const upNext = (r: number, c: number, from: number): PredictCandidate | undefined => {
    const i = nextInBounds(r, from, c)
    if (i < 0) return nextFromQueue()
    const nr = r + DIRS[i].dr
    const nc = c + DIRS[i].dc
    if (!isNew(nr, nc)) return undefined
    const d = dist[r][c]
    const pos = Math.min((r + c + i) % 3, d + 1) // where the right answer sits among the three options
    const first = d + 1 - pos
    return {
      tag: 'distance-here',
      kind: 'choice',
      prompt: `${at(r, c)} has distance ${d}. Its ${DIRS[i].name} neighbour ${at(nr, nc)} is open and new. What distance does it get?`,
      options: [first, first + 1, first + 2].map(String),
      answer: String(d + 1),
      why: `One step further than ${at(r, c)}: ${d} + 1 = ${d + 1}. BFS finishes every distance-${d} cell before any distance-${d + 1}.`,
      hint: 'A neighbour is exactly one step away from the cell you popped.',
    }
  }

  // --- the algorithm ---------------------------------------------------------

  emit(
    'init',
    `Cells are (row, col). Stamp S at ${at(sr, sc)} with distance 0 and put it in the queue.`,
  )

  let answer = -1
  while (queue.length > 0 && !rec.capped) {
    const [r, c] = queue.shift()!
    cur = [r, c]
    nb = null
    skipped = null
    fresh = null
    if (r === er && c === ec) {
      answer = dist[r][c]
      // Display only: walk back along distances d, d-1, ... 0 to light the path.
      path = new Set([key(r, c)])
      let pr = r
      let pc = c
      while (dist[pr][pc] > 0) {
        for (const { dr, dc } of DIRS) {
          const qr = pr + dr
          const qc = pc + dc
          if (qr >= 0 && qr < R && qc >= 0 && qc < C && dist[qr][qc] === dist[pr][pc] - 1) {
            pr = qr
            pc = qc
            break
          }
        }
        path.add(key(pr, pc))
      }
      emit('done', `Pop E at ${at(r, c)}. Its distance, ${answer}, is the length of the shortest path.`)
      return rec.done(answer)
    }
    expanded.add(key(r, c))
    emit(
      'pop',
      `Pop ${at(r, c)} from the front. Its distance is ${dist[r][c]}. Check up, right, down, left.`,
      [],
      upNext(r, c, 0),
    )

    for (let i = 0; i < DIRS.length && !rec.capped; i++) {
      const nr = r + DIRS[i].dr
      const nc = c + DIRS[i].dc
      if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue
      nb = [nr, nc]
      fresh = null
      skipped = null
      if (rows[nr][nc] === '#' || dist[nr][nc] !== -1) {
        skipped = [nr, nc]
        const wall = rows[nr][nc] === '#'
        const upcoming = i + 1 < DIRS.length ? upNext(r, c, i + 1) : nextFromQueue()
        emit(
          'skip',
          wall
            ? `Look ${DIRS[i].name}: ${at(nr, nc)} is a wall. Skip it.`
            : `Look ${DIRS[i].name}: ${at(nr, nc)} already has distance ${dist[nr][nc]}, so it was seen. Skip it.`,
          [{ target: `cell:${nr},${nc}`, text: wall ? 'wall' : 'already seen' }],
          upcoming,
        )
      } else {
        dist[nr][nc] = dist[r][c] + 1
        queue.push([nr, nc])
        reached++
        fresh = [nr, nc]
        const upcoming = i + 1 < DIRS.length ? upNext(r, c, i + 1) : nextFromQueue()
        emit(
          'discover',
          `Look ${DIRS[i].name}: ${at(nr, nc)} is open and new. Stamp it ${dist[nr][nc]} and queue it at the back.`,
          [],
          upcoming,
        )
      }
    }
    nb = null
    skipped = null
    fresh = null
  }

  cur = null
  nb = null
  skipped = null
  fresh = null
  failed = true
  emit('done', `The queue is empty and E at ${at(er, ec)} was never reached, so there is no path: -1.`)
  return rec.done(answer)
}

/** Independent version: keep relaxing distances until nothing changes. */
function reference({ rows }: BfsGridInput): number {
  const R = rows.length
  const C = rows[0].length
  const [sr, sc] = findCell(rows, 'S')
  const [er, ec] = findCell(rows, 'E')
  const best: number[][] = rows.map((line) => [...line].map(() => Infinity))
  best[sr][sc] = 0
  let changed = true
  while (changed) {
    changed = false
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        if (rows[r][c] === '#') continue
        for (const { dr, dc } of DIRS) {
          const nr = r + dr
          const nc = c + dc
          if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue
          if (best[nr][nc] + 1 < best[r][c]) {
            best[r][c] = best[nr][nc] + 1
            changed = true
          }
        }
      }
    }
  }
  return Number.isFinite(best[er][ec]) ? best[er][ec] : -1
}

const tracer: Tracer<BfsGridInput, number> = {
  id: 'bfs-dfs/bfs-grid',
  title: 'BFS on a grid',
  anchors: {
    init: 'Stamp S with distance 0 and queue it',
    pop: 'Pop the cell at the front of the queue',
    skip: 'Skip walls and cells that already have a distance',
    discover: 'Stamp a new neighbour with distance + 1 and queue it',
    done: 'Return the distance when E is popped, or -1',
  },
  vars: [
    { name: 'cell', label: 'cell (row,col)', role: 'focus' },
    { name: 'dist', label: 'its distance', role: 'value' },
    { name: 'queued', label: 'cells in queue', role: 'value' },
  ],
  input: {
    fields: [
      {
        name: 'grid',
        label: 'Grid',
        kind: 'string',
        placeholder: EXAMPLE,
        help: `Rows separated by /, up to ${LIMITS.maxN} by ${LIMITS.maxN}. S start, E end, . open, # wall.`,
      },
    ],
    parse: parseInput,
    format: ({ rows }) => ({ grid: rows.join('/') }),
    presets: [
      { label: 'Detour round a wall', value: { rows: ['S..#', '.#..', '...E'] } },
      { label: 'Walled off: no path', value: { rows: ['S.#.', '.##.', '..#E'] } },
      { label: 'Open 3 by 3 field', value: { rows: ['S..', '...', '..E'] } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const R = randInt(rand, 3, 6)
      const C = randInt(rand, 3, 6)
      const cells: string[][] = Array.from({ length: R }, () => Array.from({ length: C }, () => (rand() < 0.25 ? '#' : '.')))
      const s = randInt(rand, 0, R * C - 1)
      let e = randInt(rand, 0, R * C - 2)
      if (e >= s) e++
      cells[Math.floor(s / C)][s % C] = 'S'
      cells[Math.floor(e / C)][e % C] = 'E'
      return { rows: cells.map((row) => row.join('')) }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
