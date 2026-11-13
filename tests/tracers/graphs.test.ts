/**
 * Extra checks for the graphs tracers (build-adjacency, topo-sort). The generic
 * contract suite (frames, anchors, code parity, parse, correctness...) runs from
 * registry.test.ts; the harness only deep-checks array scenes, so this file also
 * checks the composite scenes (graph + adjacency list, graph + queue + order),
 * the fixed node positions, that predict answers match what the next frame
 * does, and the teaching beats of the default presets.
 */
import { describe, expect, it } from 'vitest'
import buildAdjacency from '@/lib/tracers/graphs/build-adjacency'
import type { BuildAdjacencyInput } from '@/lib/tracers/graphs/build-adjacency'
import dijkstra from '@/lib/tracers/graphs/dijkstra'
import type { DijkstraInput } from '@/lib/tracers/graphs/dijkstra'
import unionFind from '@/lib/tracers/graphs/union-find'
import type { UnionFindInput } from '@/lib/tracers/graphs/union-find'
import topoSort from '@/lib/tracers/graphs/topo-sort'
import type { TopoSortInput } from '@/lib/tracers/graphs/topo-sort'
import { MAX_NODES, MIN_NODES, POSITIONS, graphNodes } from '@/lib/tracers/graphs/common'
import type { ArrayScene, Frame, GraphScene, HashMapScene, Scene } from '@/lib/engine/types'

function parts(scene: Scene): Exclude<Scene, { kind: 'composite' }>[] {
  if (scene.kind !== 'composite') throw new Error(`expected a composite scene, got ${scene.kind}`)
  return scene.parts.map((p) => p.scene)
}
function graphOf(scene: Scene): GraphScene {
  const p = parts(scene)[0]
  if (p.kind !== 'graph') throw new Error(`part 0 is ${p.kind}, not graph`)
  return p
}
function listsOf(scene: Scene): HashMapScene {
  const p = parts(scene)[1]
  if (p.kind !== 'hash-map') throw new Error(`part 1 is ${p.kind}, not hash-map`)
  return p
}
function arrayOf(scene: Scene, index: number): ArrayScene {
  const p = parts(scene)[index]
  if (p.kind !== 'array') throw new Error(`part ${index} is ${p.kind}, not array`)
  return p
}
const idOf = (i: number): string => `n${i}`
const numOf = (id: string): number => Number(id.slice(1))

/** Structural checks shared by every graph scene. */
function checkGraph(g: GraphScene, n: number, where: string): void {
  expect(g.nodes, `${where}: node count`).toHaveLength(n)
  const ids = new Set(g.nodes.map((x) => x.id))
  expect(ids.size, `${where}: unique ids`).toBe(n)
  for (const e of g.edges) {
    expect(ids.has(e.from) && ids.has(e.to), `${where}: edge ${e.from}-${e.to} endpoints exist`).toBe(true)
    expect(e.from, `${where}: no self loop`).not.toBe(e.to)
  }
  for (const m of g.marks ?? []) expect(ids.has(m.id), `${where}: mark on ${m.id}`).toBe(true)
  for (const b of g.badges ?? []) expect(ids.has(b.id), `${where}: badge on ${b.id}`).toBe(true)
  for (const nd of g.nodes) {
    expect(nd.at.col >= 0 && nd.at.col <= 5 && nd.at.row >= 0 && nd.at.row <= 3, `${where}: ${nd.id} position`).toBe(true)
  }
}

// ===========================================================================
// Positions
// ===========================================================================

describe('graphs: fixed node positions', () => {
  it('has a layout for every legal node count, one distinct spot per node', () => {
    for (let n = MIN_NODES; n <= MAX_NODES; n++) {
      const spots = graphNodes(n).map((x) => `${x.at.col},${x.at.row}`)
      expect(new Set(spots).size, `n=${n}`).toBe(n)
    }
  })

  it('never lets an edge pass through a third node (no near-collinear triples)', () => {
    const PX = 147
    const PY = 92
    for (let n = MIN_NODES; n <= MAX_NODES; n++) {
      const pts = POSITIONS[n].map(([c, r]) => ({ x: c * PX, y: r * PY }))
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          for (let k = 0; k < n; k++) {
            if (k === i || k === j) continue
            const dx = pts[j].x - pts[i].x
            const dy = pts[j].y - pts[i].y
            const t = Math.max(0, Math.min(1, ((pts[k].x - pts[i].x) * dx + (pts[k].y - pts[i].y) * dy) / (dx * dx + dy * dy)))
            const d = Math.hypot(pts[k].x - (pts[i].x + t * dx), pts[k].y - (pts[i].y + t * dy))
            expect(d, `n=${n}: node ${k} is ${d.toFixed(0)}px from edge ${i}-${j}`).toBeGreaterThan(40)
          }
        }
      }
    }
  })
})

// ===========================================================================
// graphs/build-adjacency
// ===========================================================================

const ba = buildAdjacency.input
const baDefault = ba.presets[0].value as BuildAdjacencyInput

function allBuildRuns(): Array<{ input: BuildAdjacencyInput; frames: Frame[] }> {
  const inputs = [...ba.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => ba.random(i + 1))] as BuildAdjacencyInput[]
  return inputs.map((value) => ({ input: value, frames: buildAdjacency.run(value).frames }))
}

describe('graphs/build-adjacency: default preset', () => {
  const { frames, result } = buildAdjacency.run(baDefault)

  it('stores five undirected edges as ten list entries', () => {
    expect(result.adj).toEqual([[1, 2], [0, 3], [0, 3], [1, 2, 4], [3]])
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect(frames).toHaveLength(17)
    expect([count('init'), count('read'), count('forward'), count('back'), count('done')]).toEqual([1, 5, 5, 5, 1])
    expect(frames[16].say).toContain('10 list entries')
  })

  it('shows the same graph twice: a graph scene and a hash-map adjacency list', () => {
    for (const f of frames) {
      const [g, lists] = parts(f.scene)
      expect(g.kind).toBe('graph')
      expect(lists.kind).toBe('hash-map')
      expect((lists as HashMapScene).buckets).toHaveLength(5)
    }
  })

  it('draws edges not yet stored faded, the edge being read focused', () => {
    const g1 = graphOf(frames[1].scene)
    expect(g1.edges[0].role).toBe('focus')
    expect(g1.edges.slice(1).every((e) => e.role === 'discarded')).toBe(true)
    const g2 = graphOf(frames[2].scene)
    expect(g2.edges[0].role).toBe('changed')
    const last = graphOf(frames[16].scene)
    expect(last.edges.every((e) => e.role === undefined)).toBe(true)
  })

  it('shows degree badges that match the lists', () => {
    const last = frames[16].scene
    const badges = new Map((graphOf(last).badges ?? []).map((b) => [b.id, b.text]))
    listsOf(last).buckets.forEach((row, i) => expect(badges.get(idOf(i))).toBe(`deg ${row.length}`))
  })
})

describe('graphs/build-adjacency: scenes on every preset and random run', () => {
  it('keeps graph nodes fixed, lists consistent with the edges stored so far, and bucket marks valid', () => {
    for (const { input, frames } of allBuildRuns()) {
      const nodes0 = JSON.stringify(graphOf(frames[0].scene).nodes)
      frames.forEach((f, i) => {
        const where = `n=${input.n} frame ${i}`
        const g = graphOf(f.scene)
        checkGraph(g, input.n, where)
        expect(g.directed, where).toBe(input.directed)
        expect(JSON.stringify(g.nodes), `${where}: nodes move`).toBe(nodes0)
        const lists = listsOf(f.scene)
        expect(lists.buckets, where).toHaveLength(input.n)
        lists.buckets.forEach((row, b) => {
          row.forEach((e) => expect(Number.isInteger(e.key) && (e.key as number) >= 0 && (e.key as number) < input.n, `${where}: key`).toBe(true))
          expect(row.length, `${where}: bucket ${b}`).toBeLessThanOrEqual(input.n)
        })
        for (const m of lists.marks ?? []) {
          expect(m.bucket >= 0 && m.bucket < input.n, `${where}: mark bucket`).toBe(true)
          expect(m.slot !== undefined && m.slot >= 0 && m.slot < lists.buckets[m.bucket].length, `${where}: mark slot`).toBe(true)
        }
        // Undirected: after the back frame both ends are listed; entries equal edges stored (x2 if undirected).
        const entries = lists.buckets.reduce((s, row) => s + row.length, 0)
        expect(entries, `${where}: entries`).toBeLessThanOrEqual(input.edges.length * (input.directed ? 1 : 2))
      })
      const lastLists = listsOf(frames[frames.length - 1].scene)
      expect(lastLists.buckets.reduce((s, row) => s + row.length, 0)).toBe(input.edges.length * (input.directed ? 1 : 2))
    }
  })

  it('directed runs never use the back rule; undirected runs always do', () => {
    for (const { input, frames } of allBuildRuns()) {
      const backs = frames.filter((f) => f.at === 'back').length
      expect(backs).toBe(input.directed ? 0 : input.edges.length)
    }
  })
})

describe('graphs/build-adjacency: predicts', () => {
  it('neighbours: the right option is the list shown on the next frame', () => {
    let asked = 0
    for (const { input, frames } of allBuildRuns()) {
      frames.forEach((f, i) => {
        const p = f.predict
        if (!p || p.tag !== 'neighbours') return
        asked++
        const next = frames[i + 1]
        expect(next.at).toBe('forward')
        const [u] = input.edges[frames.slice(0, i).filter((x) => x.at === 'read').length]
        const shown = `[${listsOf(next.scene).buckets[u].map((e) => e.key).join(', ')}]`
        expect(p.answer).toBe(shown)
        expect(p.options).toContain(shown)
        expect(new Set(p.options).size).toBe(p.options!.length)
        expect(p.options!.length).toBeGreaterThanOrEqual(2)
      })
    }
    expect(asked).toBeGreaterThan(100)
  })

  it('both-ways: undirected edges get a mirror entry next, directed ones change nothing', () => {
    for (const { input, frames } of allBuildRuns()) {
      frames.forEach((f, i) => {
        const p = f.predict
        if (!p || p.tag !== 'both-ways') return
        const next = frames[i + 1]
        const entries = (fr: Frame): number => listsOf(fr.scene).buckets.reduce((s, row) => s + row.length, 0)
        if (input.directed) {
          expect(p.answer).toBe('No, only the first list changes')
          expect(next.at === 'read' || next.at === 'done').toBe(true)
          expect(entries(next)).toBe(entries(f))
        } else {
          expect(p.answer).toBe('Also add it to the other list')
          expect(next.at).toBe('back')
          expect(entries(next)).toBe(entries(f) + 1)
        }
        expect(p.options).toContain(p.answer)
      })
    }
  })

  it('does not always put the right answer in the same position', () => {
    const positions = new Set<number>()
    for (const { frames } of allBuildRuns()) {
      for (const f of frames) if (f.predict) positions.add(f.predict.options!.indexOf(String(f.predict.answer)))
    }
    expect(positions.size).toBeGreaterThanOrEqual(2)
  })
})

describe('graphs/build-adjacency: parsing', () => {
  const base = ba.format(baDefault)
  it('accepts arrows and dashes, and normalises directed text', () => {
    const r = ba.parse({ n: '4', directed: 'Directed', edges: '0->1, 1 -> 2; 2→0' })
    expect(r.ok && r.value).toEqual({ n: 4, directed: true, edges: [[0, 1], [1, 2], [2, 0]] })
    expect(ba.format({ n: 4, directed: true, edges: [[0, 1]] }).edges).toBe('0->1')
  })

  it('rejects self-loops, unknown nodes, duplicates and bad words kindly', () => {
    const bad: Array<[string, Record<string, string>, RegExp]> = [
      ['self loop', { edges: '1-1' }, /itself/],
      ['node out of range', { edges: '0-9' }, /Node 9/],
      ['duplicate undirected', { edges: '0-1, 1-0' }, /same road/],
      ['too many nodes', { n: '8' }, /2 to 7/],
      ['one node', { n: '1' }, /2 to 7/],
      ['bad kind', { directed: 'sideways' }, /undirected/],
      ['no dash', { edges: '0 1' }, /isn't an edge/],
      ['too many edges', { edges: Array.from({ length: 11 }, (_, i) => `${i % 5}-${(i + 1) % 5}`).join(', ') }, /at most 10/],
    ]
    for (const [label, override, re] of bad) {
      const r = ba.parse({ ...base, ...override })
      expect(r.ok, label).toBe(false)
      if (!r.ok) expect(r.error, label).toMatch(re)
    }
    // Directed allows both directions of the same pair.
    expect(ba.parse({ n: '3', directed: 'directed', edges: '0->1, 1->0' }).ok).toBe(true)
  })
})

// ===========================================================================
// graphs/topo-sort
// ===========================================================================

const ts = topoSort.input
const tsDefault = ts.presets[0].value as TopoSortInput

function allTopoRuns(): Array<{ input: TopoSortInput; frames: Frame[]; order: number[]; possible: boolean }> {
  const inputs = [...ts.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => ts.random(i + 1))] as TopoSortInput[]
  return inputs.map((value) => {
    const { frames, result } = topoSort.run(value)
    return { input: value, frames, order: result.order, possible: result.possible }
  })
}

describe('graphs/topo-sort: default preset', () => {
  const { frames, result } = topoSort.run(tsDefault)

  it('finds the order 0..5 and uses every rule', () => {
    expect(result).toEqual({ order: [0, 1, 2, 3, 4, 5], possible: true })
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect([count('indegree'), count('seed'), count('pop'), count('drop'), count('ready'), count('finish')]).toEqual([1, 1, 6, 7, 5, 1])
    expect(frames).toHaveLength(21)
  })

  it('shows indegree badges from the first frame and lowers them on each drop', () => {
    const badges = (f: Frame): string[] => (graphOf(f.scene).badges ?? []).map((b) => b.text)
    expect(badges(frames[0])).toEqual(['in 0', 'in 1', 'in 1', 'in 1', 'in 2', 'in 2'])
    const lastDrop = frames.filter((f) => f.at === 'drop').pop() as Frame
    expect(badges(lastDrop)).toEqual(['in 0', 'in 0', 'in 0', 'in 0', 'in 0', 'in 0'])
  })

  it('queues in first-in-first-out order and shows front/back pointers', () => {
    const readies = frames.filter((f) => f.at === 'ready')
    expect(arrayOf(readies[1].scene, 1).cells).toEqual([1, 2])
    const q = arrayOf(readies[1].scene, 1)
    expect(q.pointers).toEqual([
      { name: 'front', index: 0, role: 'ptrA' },
      { name: 'back', index: 1, role: 'ptrB' },
    ])
    const pops = frames.filter((f) => f.at === 'pop')
    expect(arrayOf(pops[1].scene, 2).cells).toEqual([0, 1])
    expect(arrayOf(pops[1].scene, 1).cells).toEqual([2])
  })

  it('marks removed edges as discarded and ends with everything found', () => {
    const lastG = graphOf(frames[frames.length - 1].scene)
    expect(lastG.edges.every((e) => e.role === 'discarded')).toBe(true)
    expect((lastG.marks ?? []).every((m) => m.role === 'found')).toBe(true)
    expect(frames[frames.length - 1].say).toContain('0, 1, 2, 3, 4, 5')
  })
})

describe('graphs/topo-sort: the cycle preset', () => {
  const input = ts.presets[1].value as TopoSortInput
  const { frames, result } = topoSort.run(input)

  it('takes 0, 1, 2 and then gets stuck on the 3-4-5 cycle', () => {
    expect(result).toEqual({ order: [], possible: false })
    const last = frames[frames.length - 1]
    expect(last.at).toBe('finish')
    expect(last.say).toContain('3, 4, 5')
    expect(last.say).toContain('cycle')
    const g = graphOf(last.scene)
    expect((g.marks ?? []).filter((m) => m.role === 'error').map((m) => m.id)).toEqual(['n3', 'n4', 'n5'])
    expect(g.edges.filter((e) => e.role === 'error').map((e) => `${numOf(e.from)}${numOf(e.to)}`)).toEqual(['34', '45', '53'])
    expect(arrayOf(last.scene, 2).cells).toEqual([0, 1, 2])
  })
})

describe('graphs/topo-sort: scenes and correctness on every run', () => {
  it('keeps nodes fixed, queue and order consistent, every order valid, and the cycle verdict equal to a DFS', () => {
    for (const { input, frames, order, possible } of allTopoRuns()) {
      const nodes0 = JSON.stringify(graphOf(frames[0].scene).nodes)
      frames.forEach((f, i) => {
        const where = `n=${input.n} ${JSON.stringify(input.edges)} frame ${i}`
        const g = graphOf(f.scene)
        checkGraph(g, input.n, where)
        expect(g.directed, where).toBe(true)
        expect(JSON.stringify(g.nodes), `${where}: nodes move`).toBe(nodes0)
        const q = arrayOf(f.scene, 1)
        const o = arrayOf(f.scene, 2)
        expect(q.label).toBe('queue')
        expect(o.label).toBe('order')
        expect(q.cells.length + o.cells.length, `${where}: queue + order never exceed n`).toBeLessThanOrEqual(input.n)
        expect(new Set([...q.cells, ...o.cells]).size, `${where}: a node is in one place`).toBe(q.cells.length + o.cells.length)
        for (const p of q.pointers ?? []) expect(p.index >= 0 && p.index < q.cells.length, `${where}: queue pointer`).toBe(true)
        expect(f.vars.queue, where).toEqual(q.cells)
        expect(f.vars.order, where).toEqual(o.cells)
        // Badges are indegrees of the edges still in play.
        const live = new Map<string, number>()
        for (const e of g.edges) if (e.role !== 'discarded') live.set(e.to, (live.get(e.to) ?? 0) + 1)
        if (f.at !== 'drop' && f.at !== 'finish') {
          for (const b of g.badges ?? []) expect(b.text, `${where}: badge ${b.id}`).toBe(`in ${live.get(b.id) ?? 0}`)
        }
      })
      // Result: valid topological order, or [] exactly when a cycle exists.
      if (possible) {
        expect(order).toHaveLength(input.n)
        const pos = new Map(order.map((x, i) => [x, i]))
        for (const [a, b] of input.edges) expect(pos.get(a)!, `edge ${a}->${b} in ${order}`).toBeLessThan(pos.get(b)!)
      } else {
        expect(order).toEqual([])
      }
      const last = frames[frames.length - 1]
      expect(last.at).toBe('finish')
      expect((graphOf(last.scene).marks ?? []).some((m) => m.role === 'error')).toBe(!possible)
    }
  })

  it('exercises both outcomes, queues of two or more, and many starting points', () => {
    const runs = allTopoRuns()
    expect(runs.some((r) => r.possible)).toBe(true)
    expect(runs.some((r) => !r.possible)).toBe(true)
    expect(runs.some((r) => r.frames.some((f) => f.at === 'seed' && arrayOf(f.scene, 1).cells.length >= 3))).toBe(true)
  })
})

describe('graphs/topo-sort: predicts', () => {
  it('next-ready: the node answered is the one taken next, and it was at the front of the queue', () => {
    let asked = 0
    for (const { frames } of allTopoRuns()) {
      frames.forEach((f, i) => {
        const p = f.predict
        if (!p || p.tag !== 'next-ready') return
        asked++
        const next = frames[i + 1]
        expect(p.kind).toBe('cell')
        expect(next.at).toBe('pop')
        const q = arrayOf(f.scene, 1).cells
        expect(q.length).toBeGreaterThanOrEqual(2)
        expect(p.answer).toBe(idOf(q[0] as number))
        expect(next.vars.u).toBe(q[0])
        expect(graphOf(next.scene).marks).toContainEqual({ id: p.answer, role: 'focus' })
      })
    }
    expect(asked).toBeGreaterThan(50)
  })

  it('joins-queue: the answer matches the indegree after the next frame', () => {
    let asked = 0
    for (const { frames } of allTopoRuns()) {
      frames.forEach((f, i) => {
        const p = f.predict
        if (!p || p.tag !== 'joins-queue') return
        asked++
        const next = frames[i + 1]
        expect(next.at).toBe('drop')
        const w = next.vars.v as number
        const badge = (graphOf(next.scene).badges ?? []).find((b) => b.id === idOf(w))
        const joins = badge?.text === 'in 0'
        expect(p.answer).toBe(joins ? 'Yes, it joins the queue' : 'No, it still waits')
        if (joins) expect(frames[i + 2].at).toBe('ready')
        expect(p.options).toContain(p.answer)
      })
    }
    expect(asked).toBeGreaterThan(100)
  })

  it('cycle-or-not: asked on the frame before finish, and the answer matches the order length', () => {
    for (const { input, frames, possible } of allTopoRuns()) {
      const i = frames.length - 2
      const p = frames[i].predict
      expect(p, 'no cycle-or-not before finish').toBeDefined()
      expect(p!.tag).toBe('cycle-or-not')
      expect(p!.answer).toBe(possible ? 'Every node is in the order' : 'A cycle blocks some nodes')
      expect(arrayOf(frames[i].scene, 2).cells.length === input.n).toBe(possible)
      expect(frames[i + 1].at).toBe('finish')
    }
  })
})

describe('graphs/topo-sort: parsing', () => {
  const base = ts.format(tsDefault)
  it('formats edges with arrows and rejects bad input kindly', () => {
    expect(base.edges).toBe('0->1, 0->2, 1->3, 1->4, 2->4, 3->5, 4->5')
    const bad: Array<[string, Record<string, string>, RegExp]> = [
      ['self loop', { edges: '2->2' }, /itself/],
      ['unknown node', { edges: '0->6, 1->2' }, /Node 6/],
      ['duplicate', { edges: '0->1, 0->1' }, /twice/],
      ['no edges', { edges: ' ' }, /at least one edge/],
    ]
    for (const [label, override, re] of bad) {
      const r = ts.parse({ ...base, ...override })
      expect(r.ok, label).toBe(false)
      if (!r.ok) expect(r.error, label).toMatch(re)
    }
    expect(ts.parse({ n: '2', edges: '0->1, 1->0' }).ok).toBe(true)
  })
})

// ===========================================================================
// graphs/dijkstra
// ===========================================================================

const dj = dijkstra.input

function allDijkstraRuns(): Array<{ input: DijkstraInput; frames: Frame[]; dist: number[] }> {
  const inputs = [...dj.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => dj.random(i + 1))] as DijkstraInput[]
  return inputs.map((value) => {
    const { frames, result } = dijkstra.run(value)
    return { input: value, frames, dist: result.dist }
  })
}

describe('graphs/dijkstra: scenes', () => {
  it('draws a weighted graph plus a dist array that agrees with the badges', () => {
    for (const { input, frames } of allDijkstraRuns()) {
      frames.forEach((f, i) => {
        const where = `n=${input.n} frame ${i}`
        const g = graphOf(f.scene)
        checkGraph(g, input.n, where)
        expect(g.edges.map((e) => e.weight), `${where}: weights`).toEqual(input.edges.map(([, , w]) => w))
        const dist = arrayOf(f.scene, 1)
        expect(dist.cells, where).toHaveLength(input.n)
        const badges = new Map((g.badges ?? []).map((b) => [b.id, b.text]))
        dist.cells.forEach((c, k) => expect(badges.get(idOf(k)), `${where}: badge ${k}`).toBe(String(c)))
      })
    }
  })

  it('only ever lowers a distance, and settled distances never change', () => {
    for (const { input, frames } of allDijkstraRuns()) {
      for (let i = 1; i < frames.length; i++) {
        const prev = arrayOf(frames[i - 1].scene, 1).cells.map((c) => (c === '∞' ? Infinity : (c as number)))
        const cur = arrayOf(frames[i].scene, 1).cells.map((c) => (c === '∞' ? Infinity : (c as number)))
        cur.forEach((d, k) => expect(d, `n=${input.n} frame ${i} node ${k}`).toBeLessThanOrEqual(prev[k]))
      }
    }
  })
})

describe('graphs/dijkstra: default preset', () => {
  const { frames, result } = dijkstra.run(dj.presets[0].value as DijkstraInput)
  it('finds the detour through node 2 and stays in the guided range', () => {
    expect(result.dist).toEqual([0, 3, 1, 8, 9, 14])
    expect(frames.length).toBeGreaterThanOrEqual(15)
    expect(frames.length).toBeLessThanOrEqual(40)
    expect(frames.some((f) => f.say.includes('drops from 4 to 3'))).toBe(true)
  })
  it('shows a no-improvement relax and a final tree', () => {
    expect(frames.some((f) => f.at === 'relax' && f.say.includes('no better'))).toBe(true)
    const last = graphOf(frames[frames.length - 1].scene)
    expect(last.edges.filter((e) => e.role === 'found')).toHaveLength(5)
  })
})

describe('graphs/dijkstra: predicts and parsing', () => {
  it('next-settled answers match the pick frame; improves answers match the update that follows', () => {
    let nextSettled = 0
    let improves = 0
    for (const { frames } of allDijkstraRuns()) {
      frames.forEach((f, i) => {
        const p = f.predict
        if (!p) return
        const next = frames[i + 1]
        if (p.tag === 'next-settled') {
          nextSettled++
          expect(next.at).toBe('pick')
          const focus = (graphOf(next.scene).marks ?? []).find((m) => m.role === 'focus')
          expect(focus?.id).toBe(p.answer)
        } else {
          improves++
          expect(p.tag).toBe('improves')
          expect(next.at).toBe('relax')
          expect(frames[i + 2].at === 'update', String(p.prompt)).toBe(p.answer === 'Yes, it is cheaper')
        }
      })
    }
    expect(nextSettled).toBeGreaterThan(50)
    expect(improves).toBeGreaterThan(50)
  })

  it('parses weighted roads and rejects bad ones kindly', () => {
    const base = dj.format(dj.presets[0].value)
    expect(base.edges).toBe('0-1:4, 0-2:1, 1-2:2, 1-3:5, 2-4:8, 3-4:3, 3-5:6')
    const bad: Array<[string, Record<string, string>, RegExp]> = [
      ['no weight', { edges: '0-1' }, /weight/],
      ['weight 0', { edges: '0-1:0' }, /Weights/],
      ['weight 10', { edges: '0-1:10' }, /Weights/],
      ['unknown node', { edges: '0-9:2' }, /Node 9/],
      ['duplicate', { edges: '0-1:2, 1-0:3' }, /same road/],
      ['bad start', { src: '6' }, /Start/],
    ]
    for (const [label, override, re] of bad) {
      const r = dj.parse({ ...base, ...override })
      expect(r.ok, label).toBe(false)
      if (!r.ok) expect(r.error, label).toMatch(re)
    }
  })
})

// ===========================================================================
// graphs/union-find
// ===========================================================================

const uf = unionFind.input

function allUnionFindRuns(): Array<{ input: UnionFindInput; frames: Frame[] }> {
  const inputs = [...uf.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => uf.random(i + 1))] as UnionFindInput[]
  return inputs.map((value) => ({ input: value, frames: unionFind.run(value).frames }))
}

describe('graphs/union-find: scenes', () => {
  it('draws one parent arrow per non-root, laid out as a forest on the grid, matching the parent array', () => {
    for (const { input, frames } of allUnionFindRuns()) {
      frames.forEach((f, i) => {
        const where = `n=${input.n} frame ${i}`
        const g = graphOf(f.scene)
        checkGraph(g, input.n, where)
        expect(g.directed, where).toBe(true)
        const parent = arrayOf(f.scene, 1).cells as number[]
        const roots = parent.flatMap((p, k) => (p === k ? [k] : []))
        expect(g.edges, `${where}: edge count`).toHaveLength(input.n - roots.length)
        for (const e of g.edges) expect(parent[numOf(e.from)], `${where}: ${e.from}->${e.to}`).toBe(numOf(e.to))
        for (const r of roots) expect(g.nodes[r].at.row, `${where}: root ${r} in row 0`).toBe(0)
        for (const nd of g.nodes) {
          if (parent[numOf(nd.id)] !== numOf(nd.id)) {
            expect(nd.at.row, `${where}: child below parent`).toBeGreaterThan(g.nodes[parent[numOf(nd.id)]].at.row)
          }
        }
        const spots = g.nodes.map((nd) => `${nd.at.col},${nd.at.row}`)
        expect(new Set(spots).size, `${where}: distinct spots`).toBe(input.n)
      })
    }
  })
})

describe('graphs/union-find: default preset', () => {
  const { frames, result } = unionFind.run(uf.presets[0].value as UnionFindInput)
  it('ends with one group and uses compression, a skipped pair and union by size', () => {
    expect(result.components).toBe(1)
    expect(frames.length).toBeGreaterThanOrEqual(15)
    expect(frames.length).toBeLessThanOrEqual(40)
    expect(frames.filter((f) => f.at === 'same')).toHaveLength(1)
    const compress = frames.find((f) => f.at === 'compress')!
    expect(graphOf(compress.scene).edges.some((e) => e.role === 'changed')).toBe(true)
    // Last pair 5-4: the bigger group (root 0) stays on top.
    expect(frames[frames.length - 2].say).toContain('hang root 5 under root 0')
  })
})

describe('graphs/union-find: predicts and parsing', () => {
  it('find-root, connected and bigger-root answers match what the next frame shows', () => {
    const seen = new Set<string>()
    for (const { frames } of allUnionFindRuns()) {
      frames.forEach((f, i) => {
        const p = f.predict
        if (!p) return
        const next = frames[i + 1]
        seen.add(p.tag)
        if (p.tag === 'find-root') {
          expect(next.at).toBe('find')
          expect(next.say).toContain(`The root is ${numOf(String(p.answer))}.`)
        } else if (p.tag === 'connected') {
          expect(next.at).toBe('find')
          const after = frames.slice(i + 2).find((x) => x.at === 'same' || x.at === 'union')!
          expect(after.at === 'same').toBe(p.answer === 'Yes, same group')
        } else {
          expect(p.tag).toBe('bigger-root')
          expect(next.at).toBe('union')
          const top = (graphOf(next.scene).marks ?? []).find((m) => m.role === 'found')
          expect(top?.id).toBe(p.answer)
        }
      })
    }
    expect([...seen].sort()).toEqual(['bigger-root', 'connected', 'find-root'])
  })

  it('counts groups correctly and parses pairs', () => {
    expect(unionFind.run({ n: 4, edges: [[0, 1], [2, 3], [1, 0 + 2]] }).result).toEqual({ components: 1, groups: [[0, 1, 2, 3]] })
    expect(unionFind.run({ n: 3, edges: [[0, 1]] }).result).toEqual({ components: 2, groups: [[0, 1], [2]] })
    const base = uf.format(uf.presets[0].value)
    expect(base.edges).toBe('0-1, 2-3, 0-2, 3-4, 1-4, 5-4')
    expect(uf.parse({ ...base, edges: '0-9' }).ok).toBe(false)
    expect(uf.parse({ ...base, edges: '1-1' }).ok).toBe(false)
  })
})
