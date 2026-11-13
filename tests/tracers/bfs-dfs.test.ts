/**
 * Extra checks for the BFS & DFS tracers (bfs-grid, dfs-graph). The generic
 * contract suite runs from registry.test.ts and only deep-checks array scenes,
 * so this file adds:
 *   - grid / graph / stack / array scene sanity for every frame of every run
 *   - predict answers that match what the next frame really does
 *   - the teaching beats of each default preset
 *   - input rules specific to each tracer
 *   - the lesson file wires up to these tracers
 */
import islands from '@/lib/tracers/bfs-dfs/islands'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { lessonV2Schema } from '@/lib/content-schema'
import type { LessonV2 } from '@/types/learning'
import bfsGrid from '@/lib/tracers/bfs-dfs/bfs-grid'
import type { BfsGridInput } from '@/lib/tracers/bfs-dfs/bfs-grid'
import dfsGraph from '@/lib/tracers/bfs-dfs/dfs-graph'
import type { DfsGraphInput } from '@/lib/tracers/bfs-dfs/dfs-graph'
import type { AnyTracer, ArrayScene, Frame, GraphScene, GridScene, Scene, StackScene } from '@/lib/engine/types'

function parts(scene: Scene): Array<Exclude<Scene, { kind: 'composite' }>> {
  if (scene.kind !== 'composite') throw new Error(`expected a composite scene, got ${scene.kind}`)
  return scene.parts.map((p) => p.scene)
}
function gridOf(f: Frame): GridScene {
  const s = parts(f.scene)[0]
  if (s.kind !== 'grid') throw new Error('part 0 is not a grid')
  return s
}
function queueOf(f: Frame): ArrayScene {
  const s = parts(f.scene)[1]
  if (s.kind !== 'array') throw new Error('part 1 is not an array')
  return s
}
function graphOf(f: Frame): GraphScene {
  const s = parts(f.scene)[0]
  if (s.kind !== 'graph') throw new Error('part 0 is not a graph')
  return s
}
function stackOf(f: Frame): StackScene {
  const s = parts(f.scene)[1]
  if (s.kind !== 'stack') throw new Error('part 1 is not a stack')
  return s
}

function runsOf<I>(tracer: AnyTracer): Array<{ input: I; frames: Frame[]; result: unknown }> {
  const inputs: I[] = [...tracer.input.presets.map((p) => p.value as I), ...Array.from({ length: 200 }, (_, i) => tracer.input.random(i + 1) as I)]
  return inputs.map((input) => ({ input, ...tracer.run(input) }))
}

const wordCount = (text: string): number => text.split(/\s+/).filter(Boolean).length

// ===========================================================================
// bfs-dfs/bfs-grid
// ===========================================================================

const bg = bfsGrid.input
const bgDefault = bg.presets[0].value as BfsGridInput
const gridRuns = runsOf<BfsGridInput>(bfsGrid)

describe('bfs-dfs/bfs-grid: scenes are well formed', () => {
  it('is a grid over a queue, with the right size, marks, pointers and notes on every frame', () => {
    for (const { input, frames } of gridRuns) {
      const R = input.rows.length
      const C = input.rows[0].length
      expect(R).toBeLessThanOrEqual(6)
      expect(C).toBeLessThanOrEqual(6)
      frames.forEach((frame, i) => {
        const where = `frame ${i} (${frame.at})`
        const grid = gridOf(frame)
        const queue = queueOf(frame)
        expect(grid.rows, where).toHaveLength(R)
        grid.rows.forEach((row, r) => {
          expect(row, where).toHaveLength(C)
          row.forEach((v, c) => {
            // Walls stay walls, and nothing else is ever written over a wall.
            expect(v === '#', `${where}: (${r},${c})`).toBe(input.rows[r][c] === '#')
          })
        })
        for (const m of grid.marks ?? []) {
          expect(m.r >= 0 && m.r < R && m.c >= 0 && m.c < C, `${where}: mark (${m.r},${m.c})`).toBe(true)
          expect(input.rows[m.r][m.c] !== '#' || m.role === 'discarded', `${where}: a wall is only ever discarded`).toBe(true)
        }
        for (const p of grid.pointers ?? []) expect(p.r >= 0 && p.r < R && p.c >= 0 && p.c < C, `${where}: pointer ${p.name}`).toBe(true)
        for (const a of grid.annotations ?? []) {
          const m = /^cell:(\d+),(\d+)$/.exec(a.target)
          expect(m, `${where}: note target ${a.target}`).not.toBeNull()
          expect(wordCount(a.text), `${where}: note "${a.text}"`).toBeLessThanOrEqual(6)
        }
        // Queue entries are "r,c" cells that are not walls, none repeated.
        expect(new Set(queue.cells).size, `${where}: a cell is queued twice`).toBe(queue.cells.length)
        for (const cell of queue.cells) {
          const [r, c] = String(cell).split(',').map(Number)
          expect(input.rows[r][c] !== '#', `${where}: queued wall`).toBe(true)
        }
        for (const p of queue.pointers ?? []) expect(p.index >= 0 && p.index < queue.cells.length, `${where}: queue pointer`).toBe(true)
      })
    }
  })

  it('never changes the input grid: S and E are still where they were, and presets are intact', () => {
    for (const preset of bg.presets) {
      const before = structuredClone(preset.value)
      bfsGrid.run(preset.value)
      expect(preset.value).toEqual(before)
    }
  })

  it('distances in the grid are consistent: each stamped cell is 1 more than a neighbour, and S stays S', () => {
    for (const { input, frames } of gridRuns.slice(0, 60)) {
      const last = gridOf(frames[frames.length - 1])
      last.rows.forEach((row, r) =>
        row.forEach((v, c) => {
          if (typeof v !== 'number') return
          expect(v).toBeGreaterThan(0)
          const near = [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dr, dc]) => last.rows[r + dr]?.[c + dc])
          const ok = near.some((x) => x === v - 1 || (x === 'S' && v === 1))
          expect(ok, `${JSON.stringify(input.rows)} cell (${r},${c}) = ${v}`).toBe(true)
        }),
      )
    }
  })
})

describe('bfs-dfs/bfs-grid: default preset', () => {
  const { frames, result } = bfsGrid.run(bgDefault)

  it('is the detour grid and the shortest path is 5 steps', () => {
    expect(bgDefault.rows).toEqual(['S..#', '.#..', '...E'])
    expect(result).toBe(5)
    expect(frames.length).toBeGreaterThanOrEqual(8)
    expect(frames.length).toBeLessThanOrEqual(40)
  })

  it('starts with S queued, ends on E popped, and shows every rule', () => {
    expect(frames[0].at).toBe('init')
    expect(queueOf(frames[0]).cells).toEqual(['0,0'])
    const last = frames[frames.length - 1]
    expect(last.at).toBe('done')
    expect(gridOf(last).rows[2][3]).toBe(5)
    const found = (gridOf(last).marks ?? []).filter((m) => m.role === 'found')
    expect(found).toHaveLength(6) // S, 4 cells between, E
    expect(new Set(frames.map((f) => f.at))).toEqual(new Set(Object.keys(bfsGrid.anchors)))
  })

  it('pops cells in order of distance: 0, 1, 1, 2, 2, 3, 3, 4, 4, then finishes on E', () => {
    expect(frames.filter((f) => f.at === 'pop').map((f) => f.vars.dist)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4])
  })

  it('the unreachable preset ends on -1 with E marked as an error', () => {
    const run = bfsGrid.run(bg.presets[1].value)
    expect(run.result).toBe(-1)
    const last = run.frames[run.frames.length - 1]
    expect(last.at).toBe('done')
    expect((gridOf(last).marks ?? []).some((m) => m.role === 'error')).toBe(true)
    expect(queueOf(last).cells).toEqual([])
  })

  it('BFS pops cells in non-decreasing distance on every run (FIFO order)', () => {
    for (const { frames: fs } of gridRuns) {
      const dists = fs.filter((f) => f.at === 'pop').map((f) => f.vars.dist as number)
      for (let i = 1; i < dists.length; i++) expect(dists[i]).toBeGreaterThanOrEqual(dists[i - 1])
    }
  })
})

describe('bfs-dfs/bfs-grid: predicts tell the truth', () => {
  it('next-from-queue: the answer is the front of the queue, and the next frame expands (or finishes on) it', () => {
    let asked = 0
    for (const { frames } of gridRuns) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'next-from-queue') return
        asked++
        expect(p.kind).toBe('cell')
        expect(p.answer).toBe(String(queueOf(frame).cells[0]))
        const next = frames[i + 1]
        expect(['pop', 'done']).toContain(next.at)
        const ptr = (gridOf(next).pointers ?? []).find((q) => q.name === 'cur')!
        expect(`${ptr.r},${ptr.c}`).toBe(p.answer)
      })
    }
    expect(asked).toBeGreaterThan(0)
  })

  it('distance-here: the answer is the popped cell distance + 1, and the next frame stamps exactly that', () => {
    let asked = 0
    const positions = new Set<number>()
    for (const { frames } of gridRuns) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'distance-here') return
        asked++
        expect(p.kind).toBe('choice')
        expect(p.options).toHaveLength(3)
        expect(p.options).toContain(p.answer)
        positions.add(p.options!.indexOf(p.answer as string))
        const next = frames[i + 1]
        expect(next.at).toBe('discover')
        const d = frame.vars.dist as number
        expect(p.answer).toBe(String(d + 1))
        const ptr = (gridOf(next).pointers ?? []).find((q) => q.name === 'next')!
        expect(gridOf(next).rows[ptr.r][ptr.c]).toBe(d + 1)
        for (const o of p.options!) expect(Number(o)).toBeGreaterThanOrEqual(0)
      })
    }
    expect(asked).toBeGreaterThan(0)
    expect(positions, 'the right answer is not always in the same position').toEqual(new Set([0, 1, 2]))
  })

  it('the default preset emits both tags', () => {
    const tags = new Set(bfsGrid.run(bgDefault).frames.flatMap((f) => (f.predict ? [f.predict.tag] : [])))
    expect(tags).toEqual(new Set(['next-from-queue', 'distance-here']))
  })
})

describe('bfs-dfs/bfs-grid: input rules', () => {
  const ok = (grid: string) => bg.parse({ grid })

  it('accepts friendly formats', () => {
    expect(ok('S..#/.#../...E')).toEqual({ ok: true, value: { rows: ['S..#', '.#..', '...E'] } })
    expect(ok('s.. \n ..e')).toEqual({ ok: true, value: { rows: ['S..', '..E'] } })
    expect(ok('S.E')).toEqual({ ok: true, value: { rows: ['S.E'] } })
  })

  it('says what is wrong', () => {
    expect(ok('S../..E/..')).toMatchObject({ ok: false, field: 'grid', error: expect.stringMatching(/same width/) })
    expect(ok('S.x/..E')).toMatchObject({ ok: false, field: 'grid', error: expect.stringMatching(/"X"/) })
    expect(ok('.../..E')).toMatchObject({ ok: false, field: 'grid', error: expect.stringMatching(/one S/) })
    expect(ok('SS./..E')).toMatchObject({ ok: false, field: 'grid', error: expect.stringMatching(/one S/) })
    expect(ok('S../...')).toMatchObject({ ok: false, field: 'grid', error: expect.stringMatching(/one E/) })
    expect(ok('S......./......E.')).toMatchObject({ ok: false, field: 'grid', error: expect.stringMatching(/at most 6 columns/) })
    expect(ok(Array(7).fill('S.E').join('/'))).toMatchObject({ ok: false, field: 'grid', error: expect.stringMatching(/at most 6 rows/) })
  })

  it('accepts the full 6 by 6 size', () => {
    const rows = ['S.....', '......', '......', '......', '......', '.....E']
    expect(ok(rows.join('/'))).toEqual({ ok: true, value: { rows } })
    expect(bfsGrid.run({ rows }).result).toBe(10)
  })

  it('handles E next to S, and S boxed in by walls', () => {
    expect(bfsGrid.run({ rows: ['SE'] }).result).toBe(1)
    expect(bfsGrid.run({ rows: ['S#', '#E'] }).result).toBe(-1)
  })
})

// ===========================================================================
// bfs-dfs/dfs-graph
// ===========================================================================

const dg = dfsGraph.input
const dgDefault = dg.presets[0].value as DfsGraphInput
const graphRuns = runsOf<DfsGraphInput>(dfsGraph)

describe('bfs-dfs/dfs-graph: scenes are well formed', () => {
  it('is a graph beside a stack, with real nodes, edges, pointers, badges and notes on every frame', () => {
    for (const { input, frames } of graphRuns) {
      expect(input.n).toBeLessThanOrEqual(7)
      const ids = Array.from({ length: input.n }, (_, i) => `n${i}`)
      frames.forEach((frame, i) => {
        const where = `frame ${i} (${frame.at})`
        const g = graphOf(frame)
        const stack = stackOf(frame)
        expect(g.directed).toBe(false)
        expect(g.nodes.map((n) => n.id), where).toEqual(ids)
        const known = new Set(ids)
        const spots = new Set(g.nodes.map((n) => `${n.at.col},${n.at.row}`))
        expect(spots.size, `${where}: two nodes share a spot`).toBe(input.n)
        expect(g.edges.map((e) => [e.from, e.to]), where).toEqual(input.edges.map(([a, b]) => [`n${a}`, `n${b}`]))
        for (const m of g.marks ?? []) expect(known.has(m.id), `${where}: mark on ${m.id}`).toBe(true)
        for (const p of g.pointers ?? []) expect(p.target === null || known.has(p.target), `${where}: pointer ${p.name}`).toBe(true)
        // Badges are discovery numbers 1..k, each on a different node.
        const badges = g.badges ?? []
        expect(new Set(badges.map((b) => b.id)).size, where).toBe(badges.length)
        expect(badges.map((b) => b.text), where).toEqual(badges.map((_, k) => `#${k + 1}`))
        for (const a of g.annotations ?? []) {
          const [kind, id] = a.target.split(/:(.*)/)
          if (kind === 'node') expect(known.has(id), `${where}: note on ${id}`).toBe(true)
          if (kind === 'edge') {
            const [from, to] = id.split('-')
            expect(g.edges.some((e) => e.from === from && e.to === to), `${where}: note on edge ${id}`).toBe(true)
          }
          expect(wordCount(a.text), `${where}: note "${a.text}"`).toBeLessThanOrEqual(6)
        }
        for (const item of stack.items) expect(Number.isInteger(item) && (item as number) < input.n, `${where}: stack item`).toBe(true)
        // The stack is a walk: each item is joined to the one below it by an edge.
        for (let k = 1; k < stack.items.length; k++) {
          const a = Math.min(stack.items[k - 1] as number, stack.items[k] as number)
          const b = Math.max(stack.items[k - 1] as number, stack.items[k] as number)
          expect(input.edges.some(([x, y]) => x === a && y === b), `${where}: stack ${stack.items} is not a path`).toBe(true)
        }
        expect(new Set(stack.items).size, `${where}: a node is on the stack twice`).toBe(stack.items.length)
      })
    }
  })

  it('the stack is the path of marked-compare/focus nodes, and its top is the focus node', () => {
    for (const { frames } of graphRuns) {
      for (const frame of frames) {
        if (frame.at === 'init' || frame.at === 'done') continue
        const g = graphOf(frame)
        const stack = stackOf(frame)
        const onStack = new Set(stack.items.map((v) => `n${v}`))
        for (const m of g.marks ?? []) if (m.role === 'compare') expect(onStack.has(m.id)).toBe(true)
        if (frame.at !== 'backtrack') {
          expect(stack.items.length).toBeGreaterThan(0)
          const focus = (g.marks ?? []).find((m) => m.role === 'focus')!
          expect(focus.id).toBe(`n${stack.items[stack.items.length - 1]}`)
        }
      }
    }
  })

  it('a backtrack frame shows the popped node leaving the stack; a descend frame shows the new one arriving', () => {
    for (const { frames } of graphRuns) {
      frames.forEach((frame, i) => {
        if (frame.at === 'backtrack') {
          const inc = stackOf(frame).incoming
          expect(inc?.direction).toBe('pop')
          expect(stackOf(frames[i - 1]).items.length, 'the frame before still has the node on the stack').toBe(stackOf(frame).items.length + 1)
        }
        if (frame.at === 'descend') {
          expect(stackOf(frame).incoming?.direction).toBe('push')
          expect(frames[i + 1].at).toBe('visit')
          expect(stackOf(frames[i + 1]).items).toHaveLength(stackOf(frame).items.length + 1)
        }
      })
    }
  })

  it('does not change its input', () => {
    for (const preset of dg.presets) {
      const before = structuredClone(preset.value)
      dfsGraph.run(preset.value)
      expect(preset.value).toEqual(before)
    }
  })
})

describe('bfs-dfs/dfs-graph: default preset', () => {
  const { frames, result } = dfsGraph.run(dgDefault)

  it('visits 0, 1, 3, 2, 4, 5 and shows every rule', () => {
    expect(result).toEqual([0, 1, 3, 2, 4, 5])
    expect(frames.length).toBeGreaterThanOrEqual(8)
    expect(frames.length).toBeLessThanOrEqual(40)
    expect(new Set(frames.map((f) => f.at))).toEqual(new Set(Object.keys(dfsGraph.anchors)))
  })

  it('numbers each node in the order it is first visited', () => {
    const last = graphOf(frames[frames.length - 1])
    const badge = (id: string) => last.badges!.find((b) => b.id === id)!.text
    expect([0, 1, 3, 2, 4, 5].map((v) => badge(`n${v}`))).toEqual(['#1', '#2', '#3', '#4', '#5', '#6'])
  })

  it('backtracks once per node: 6 visits, 6 backtracks, 5 descends', () => {
    const count = (at: string) => frames.filter((f) => f.at === at).length
    expect([count('visit'), count('backtrack'), count('descend')]).toEqual([6, 6, 5])
  })

  it('Two islands never reaches the other component, and says so', () => {
    const run = dfsGraph.run(dg.presets[1].value)
    expect(run.result).toEqual([0, 1, 2])
    expect(run.frames[run.frames.length - 1].say).toMatch(/Nodes 3, 4, 5 are not connected/)
  })

  it('a start node with no edges is visited alone', () => {
    const run = dfsGraph.run({ n: 3, edges: [[0, 2]], start: 1 })
    expect(run.result).toEqual([1])
    expect(run.frames.map((f) => f.at)).toEqual(['init', 'visit', 'backtrack', 'done'])
  })

  it('every neighbour entry of every visited node gets exactly one skip or descend frame', () => {
    for (const { input, frames: fs, result } of graphRuns) {
      const degree = (v: number) => input.edges.filter(([a, b]) => a === v || b === v).length
      const expected = (result as number[]).reduce((sum, v) => sum + degree(v), 0)
      expect(fs.filter((f) => f.at === 'skip' || f.at === 'descend')).toHaveLength(expected)
    }
  })
})

describe('bfs-dfs/dfs-graph: predicts tell the truth', () => {
  it('next-visit: the answer is the node the next descend frame steps into', () => {
    let asked = 0
    for (const { frames } of graphRuns) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'next-visit') return
        asked++
        expect(p.kind).toBe('cell')
        const next = frames[i + 1]
        expect(next.at).toBe('descend')
        const ptr = graphOf(next).pointers!.find((q) => q.name === 'next')!
        expect(p.answer).toBe(ptr.target)
        // It is the current node's smallest unvisited neighbour.
        const cur = graphOf(frame).pointers!.find((q) => q.name === 'cur')!.target!
        expect(graphOf(next).pointers!.find((q) => q.name === 'cur')!.target).toBe(cur)
        const seen = new Set((graphOf(frame).badges ?? []).map((b) => b.id))
        expect(seen.has(String(p.answer))).toBe(false)
      })
    }
    expect(asked).toBeGreaterThan(0)
  })

  it('backtrack-or-go: Go deeper exactly when the next frame descends, Backtrack when it backtracks', () => {
    let go = 0
    let back = 0
    const positions = new Set<number>()
    for (const { frames } of graphRuns) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'backtrack-or-go') return
        expect(p.kind).toBe('choice')
        expect(p.options).toEqual(expect.arrayContaining(['Go deeper', 'Backtrack']))
        positions.add(p.options!.indexOf(p.answer as string))
        const next = frames[i + 1]
        if (p.answer === 'Go deeper') {
          go++
          expect(next.at).toBe('descend')
        } else {
          back++
          expect(p.answer).toBe('Backtrack')
          expect(next.at).toBe('backtrack')
        }
      })
    }
    expect(go).toBeGreaterThan(0)
    expect(back).toBeGreaterThan(0)
    expect(positions).toEqual(new Set([0, 1]))
  })

  it('the default preset emits both tags', () => {
    const tags = new Set(dfsGraph.run(dgDefault).frames.flatMap((f) => (f.predict ? [f.predict.tag] : [])))
    expect(tags).toEqual(new Set(['next-visit', 'backtrack-or-go']))
  })
})

describe('bfs-dfs/dfs-graph: input rules', () => {
  const ok = (edges: string, start = '0') => dg.parse({ edges, start })

  it('accepts friendly formats and normalises them', () => {
    expect(ok('0-1, 0-2, 1-3')).toEqual({ ok: true, value: { n: 4, edges: [[0, 1], [0, 2], [1, 3]], start: 0 } })
    expect(ok('2 - 0  1-0; 0-1')).toEqual({ ok: true, value: { n: 3, edges: [[0, 1], [0, 2]], start: 0 } })
    expect(ok('3−1', '3')).toEqual({ ok: true, value: { n: 4, edges: [[1, 3]], start: 3 } })
  })

  it('says what is wrong', () => {
    expect(ok('')).toMatchObject({ ok: false, field: 'edges' })
    expect(ok('0-1, 1')).toMatchObject({ ok: false, field: 'edges', error: expect.stringMatching(/"1" isn't an edge/) })
    expect(ok('0-7')).toMatchObject({ ok: false, field: 'edges', error: expect.stringMatching(/0 to 6/) })
    expect(ok('2-2')).toMatchObject({ ok: false, field: 'edges', error: expect.stringMatching(/itself/) })
    expect(ok('0-1, 1-2, 2-3, 3-4, 4-5, 5-6, 0-2, 0-3, 0-4, 0-5, 0-6')).toMatchObject({ ok: false, field: 'edges', error: expect.stringMatching(/at most 10/) })
    expect(ok('0-1', '2')).toMatchObject({ ok: false, field: 'start', error: expect.stringMatching(/0 to 1/) })
    expect(ok('0-1', '')).toMatchObject({ ok: false, field: 'start' })
    expect(ok('0-1', '-1')).toMatchObject({ ok: false, field: 'start' })
  })
})

// ===========================================================================
// The lesson file wires up to these tracers
// ===========================================================================

describe('content/topics/bfs-dfs.json', () => {
  const lesson = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../../content/topics/bfs-dfs.json', import.meta.url)), 'utf8')) as LessonV2
  const byId = new Map<string, AnyTracer>([bfsGrid, dfsGraph, islands].map((t) => [t.id as string, t]))

  it('is a valid v2 lesson', () => {
    expect(lessonV2Schema.safeParse(lesson).success).toBe(true)
    expect(lesson.slug).toBe('bfs-dfs')
  })

  it('has a track per tracer, each asking predict tags its guided run really emits', () => {
    expect(lesson.stage.tracks.map((t) => t.tracer)).toEqual(['bfs-dfs/bfs-grid', 'bfs-dfs/dfs-graph', 'bfs-dfs/islands'])
    for (const track of lesson.stage.tracks) {
      const tracer = byId.get(track.tracer)!
      const preset = tracer.input.presets[track.preset ?? 0]
      const emitted = tracer.run(preset.value).frames.flatMap((f) => (f.predict ? [f.predict.tag] : []))
      expect(track.predict!.max).toBeLessThanOrEqual(4)
      for (const tag of track.predict!.tags) expect(emitted, `${track.id}: tag ${tag} in the guided run`).toContain(tag)
    }
  })

  it('ties the template to bfs-grid: every pseudocode anchor is one of its rules, and every rule has a line', () => {
    expect(lesson.template.tracer).toBe('bfs-dfs/bfs-grid')
    const anchors = Object.keys(bfsGrid.anchors).sort()
    const used = [...new Set(lesson.template.pseudocode.flatMap((l) => (l.anchor ? [l.anchor] : [])))].sort()
    expect(used).toEqual(anchors)
  })

  it('draws the shape as a grid over a queue, and the callouts point at things that exist', () => {
    const scene = lesson.shape.scene
    expect(scene.kind).toBe('composite')
    if (scene.kind !== 'composite') return
    const grid = scene.parts.map((p) => p.scene).find((s): s is GridScene => s.kind === 'grid')!
    expect(grid).toBeDefined()
    for (const c of lesson.shape.callouts) {
      expect(wordCount(c.text)).toBeLessThanOrEqual(6)
      const m = /^(cell|ptr|row|col):(.+)$/.exec(c.target)
      expect(m, c.target).not.toBeNull()
      if (m![1] === 'cell') {
        const [r, col] = m![2].split(',').map(Number)
        expect(r >= 0 && r < grid.rows.length && col >= 0 && col < grid.rows[0].length, c.target).toBe(true)
      }
    }
  })
})

describe('bfs-dfs/islands', () => {
  const run = (rows: string[]) => islands.run({ rows })

  it('counts islands and keeps diagonals apart', () => {
    expect(run(['1010', '0101', '1010']).result).toBe(6)
    expect(run(['111', '101', '111']).result).toBe(1)
    expect(run(['000', '000']).result).toBe(0)
  })

  it('answers every predict like the next frame shows', () => {
    for (const preset of islands.input.presets) {
      const { frames } = islands.run(preset.value)
      frames.forEach((f, i) => {
        if (!f.predict) return
        const next = frames[i + 1]
        if (f.predict.tag === 'new-island') {
          expect(next.at).toBe(f.predict.answer === 'New island' ? 'island' : 'counted')
        } else {
          expect(next.at).toBe('visit')
          expect(next.vars.cur).toBe(f.predict.answer)
        }
      })
    }
  })
})
