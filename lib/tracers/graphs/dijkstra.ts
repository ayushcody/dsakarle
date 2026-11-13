/**
 * Graphs — Dijkstra's shortest paths on a small weighted, undirected graph
 * (LeetCode 743 "Network Delay Time" framing).
 *
 * State: `dist[]` (cheapest known cost from the source, INF = not reached yet),
 * `done[]` (settled nodes, whose distance is final). Repeatedly settle the
 * unsettled node with the smallest `dist`, then try to improve each unsettled
 * neighbour by going through it ("relax" the edge).
 *
 * Every frame is a CompositeScene (column): the weighted GraphScene (badge =
 * tentative distance; marks: 'focus' = node being settled, 'visited' = settled,
 * 'changed' = distance just lowered; edges: 'focus' = edge being checked,
 * 'changed' = edge that just improved a distance, 'visited' = edge on the
 * settled shortest-path tree, 'found' = final tree) plus an ArrayScene `dist`.
 *
 * Unreachable nodes show "∞" in the scene and are -1 in the result.
 *
 * Code lives in content/code/graphs/dijkstra.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import {
  GRAPH_LIMITS,
  MAX_EDGES,
  MAX_NODES,
  MAX_WEIGHT,
  MIN_WEIGHT,
  NODE_COUNT_FIELD,
  formatWeightedEdges,
  graphScene,
  nodeId,
  parseNodeCount,
  parseWeightedEdges,
} from './common'
import type { EdgeRole, WeightedEdge } from './common'
import type {
  ArrayScene,
  CompositeScene,
  Frame,
  MarkRole,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface DijkstraInput {
  n: number
  /** [a, b, weight]: a road between a and b (both ways). */
  edges: WeightedEdge[]
  src: number
}

/** Shortest distance from `src` to every node; -1 when a node cannot be reached. */
export interface DijkstraResult {
  dist: number[]
}

const INF = 1_000_000_000
const show = (d: number): string => (d >= INF ? '∞' : String(d))

function parseInput(raw: Record<string, string>): ParseResult<DijkstraInput> {
  const n = parseNodeCount(raw.n)
  if (!n.ok) return n
  const edges = parseWeightedEdges(raw.edges, n.value, false)
  if (!edges.ok) return edges
  const text = (raw.src ?? '').trim()
  if (!/^\d+$/.test(text) || Number(text) >= n.value) {
    return { ok: false, field: 'src', error: `Start must be a node number from 0 to ${n.value - 1}.` }
  }
  return { ok: true, value: { n: n.value, edges: edges.value, src: Number(text) } }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

const IMPROVES = 'Yes, it is cheaper'
const KEEPS = 'No, keep the old one'

function rotate<T>(xs: T[], shift: number): T[] {
  const k = shift % xs.length
  return [...xs.slice(k), ...xs.slice(0, k)]
}

function run({ n, edges, src }: DijkstraInput) {
  const rec = createRecorder<DijkstraResult>()

  // Working state — mirrors the code files.
  const adj: Array<Array<{ to: number; w: number; edge: number }>> = Array.from({ length: n }, () => [])
  edges.forEach(([a, b, w], i) => {
    adj[a].push({ to: b, w, edge: i })
    adj[b].push({ to: a, w, edge: i })
  })
  const dist: number[] = Array(n).fill(INF)
  const done: boolean[] = Array(n).fill(false)
  const viaEdge: number[] = Array(n).fill(-1) // edge that gave each node its best distance (for drawing)
  const settledOrder: number[] = []

  let u: number | null = null
  let v: number | null = null
  let checking = -1
  let improved = -1
  let changedNode = -1

  const emit = (
    at: string,
    say: string,
    extra: { final?: boolean; predict?: PredictCandidate } = {},
  ): void => {
    const edgeRoles: Array<EdgeRole | undefined> = edges.map((_, i) => {
      if (i === improved) return 'changed'
      if (i === checking) return 'focus'
      const inTree = Array.from({ length: n }, (_, x) => x).some((x) => done[x] && viaEdge[x] === i)
      if (inTree) return extra.final ? 'found' : 'visited'
      return undefined
    })
    const marks: Array<{ node: number; role: MarkRole }> = []
    for (let i = 0; i < n; i++) {
      if (extra.final) marks.push({ node: i, role: done[i] ? 'found' : 'discarded' })
      else if (u === i && !done[i]) marks.push({ node: i, role: 'focus' })
      else if (changedNode === i) marks.push({ node: i, role: 'changed' })
      else if (done[i]) marks.push({ node: i, role: 'visited' })
      else if (v === i) marks.push({ node: i, role: 'compare' })
    }
    const graph = graphScene({
      n,
      directed: false,
      edges: edges.map(([a, b]) => [a, b]),
      weights: edges.map(([, , w]) => w),
      edgeRoles,
      marks,
      badges: dist.map(show),
    })
    const distScene: ArrayScene = {
      kind: 'array',
      label: 'dist',
      cells: dist.map((d) => (d >= INF ? '∞' : d)),
      capacity: n,
    }
    const arrMarks: ArrayScene['marks'] = []
    for (let i = 0; i < n; i++) {
      if (extra.final && done[i]) arrMarks.push({ index: i, role: 'found' })
      else if (u === i && !done[i]) arrMarks.push({ index: i, role: 'focus' })
      else if (changedNode === i) arrMarks.push({ index: i, role: 'changed' })
      else if (done[i]) arrMarks.push({ index: i, role: 'visited' })
    }
    if (arrMarks.length) distScene.marks = arrMarks
    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { title: 'Roads (numbers are lengths). Badge = cheapest cost found so far', scene: graph },
        { scene: distScene },
      ],
    }
    const vars: Record<string, Val> = {
      u,
      v,
      dist: dist.map((d) => (d >= INF ? '∞' : d)),
      settled: settledOrder.slice(),
    }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: settledOrder.length, max: n, label: 'Nodes settled' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  /** Attach a question to the frame just recorded (the reveal is the next frame). */
  const askOnLast = (p: PredictCandidate): void => {
    const last = rec.frames[rec.frames.length - 1]
    if (last && !last.predict) last.predict = p
  }

  // init — the source costs 0, everything else is unknown.
  dist[src] = 0
  emit('init', `Start at node ${src}: it costs 0 to get here. Every other node is ∞, not reached yet.`, {})

  while (!rec.capped) {
    // pick — closest unsettled node (ties: lowest number).
    let best = -1
    for (let i = 0; i < n; i++) if (!done[i] && dist[i] < INF && (best === -1 || dist[i] < dist[best])) best = i
    if (best === -1) {
      if (done.includes(false)) {
        u = null
        v = null
        checking = -1
        improved = -1
        changedNode = -1
        emit('pick', 'Every node left is ∞: no road reaches it, so Dijkstra stops here.')
      }
      break
    }
    // Ask which node is next only when the answer is unambiguous and there is a real choice.
    const open = Array.from({ length: n }, (_, i) => i).filter((i) => !done[i] && dist[i] < INF)
    if (open.length >= 2 && open.filter((i) => dist[i] === dist[best]).length === 1) {
      askOnLast({
        tag: 'next-settled',
        kind: 'cell',
        prompt: `Nodes ${open.map((i) => `${i} (${dist[i]})`).join(', ')} are reached but not settled. Which one is settled next?`,
        answer: nodeId(best),
        why: `Node ${best} has the smallest distance, ${dist[best]}. No other route can reach it more cheaply, so its cost is final.`,
        hint: 'Pick the unsettled node with the smallest badge.',
      })
    }
    u = best
    v = null
    checking = -1
    improved = -1
    changedNode = -1
    emit('pick', `Node ${best} has the smallest distance among unsettled nodes (${dist[best]}), so it goes next.`)
    if (rec.capped) break

    // settle — its distance is final.
    done[best] = true
    settledOrder.push(best)
    emit('settle', `Settle node ${best} at cost ${dist[best]}. With no negative roads, no shorter route can show up later.`)
    if (rec.capped) break

    // relax — try to improve every unsettled neighbour through u.
    for (const { to, w, edge } of adj[best]) {
      if (done[to] || rec.capped) continue
      const via = dist[best] + w
      const better = via < dist[to]
      askOnLast({
        tag: 'improves',
        kind: 'choice',
        prompt: `Next, road ${best}-${to} (length ${w}). Going through ${best} costs ${dist[best]} + ${w}. Node ${to} is at ${show(dist[to])} now. Is the road cheaper?`,
        options: rotate([IMPROVES, KEEPS], best + to),
        answer: better ? IMPROVES : KEEPS,
        why: better
          ? `${dist[best]} + ${w} = ${via} is less than ${show(dist[to])}, so node ${to} gets a cheaper route.`
          : `${dist[best]} + ${w} = ${via} is not less than ${dist[to]}, so the old route to node ${to} stays.`,
        hint: 'Add the road length to the settled node’s distance and compare.',
      })
      v = to
      checking = edge
      improved = -1
      changedNode = -1
      emit(
        'relax',
        better
          ? `Road ${best}-${to}: ${dist[best]} + ${w} = ${via} beats ${show(dist[to])}.`
          : `Road ${best}-${to}: ${dist[best]} + ${w} = ${via} is no better than ${dist[to]}. Keep it.`,
      )
      if (rec.capped) break
      if (better) {
        const before = dist[to]
        dist[to] = via
        viaEdge[to] = edge
        improved = edge
        changedNode = to
        checking = -1
        emit(
          'update',
          before >= INF
            ? `Node ${to} was unreachable; now it costs ${via} through node ${best}.`
            : `Node ${to} drops from ${before} to ${via} through node ${best}.`,
        )
      }
    }
    v = null
    checking = -1
    improved = -1
    changedNode = -1
  }

  // finish — the dist array is the answer.
  u = null
  v = null
  checking = -1
  improved = -1
  changedNode = -1
  const unreachable = dist.filter((d) => d >= INF).length
  emit(
    'finish',
    unreachable > 0
      ? `Done. Distances from ${src}: ${dist.map(show).join(', ')}. ∞ means unreachable (-1 in the result).`
      : `Done. Shortest distances from ${src}: ${dist.join(', ')}. The highlighted roads form the cheapest routes.`,
    { final: true },
  )

  return rec.done({ dist: dist.map((d) => (d >= INF ? -1 : d)) })
}

/** Independent version: Bellman-Ford, relaxing every road until nothing improves. */
function reference({ n, edges, src }: DijkstraInput): DijkstraResult {
  const d: number[] = Array(n).fill(Infinity)
  d[src] = 0
  for (let pass = 0; pass < n; pass++) {
    let changed = false
    for (const [a, b, w] of edges) {
      if (d[a] + w < d[b]) {
        d[b] = d[a] + w
        changed = true
      }
      if (d[b] + w < d[a]) {
        d[a] = d[b] + w
        changed = true
      }
    }
    if (!changed) break
  }
  return { dist: d.map((x) => (x === Infinity ? -1 : x)) }
}

function randomInput(seed: number): DijkstraInput {
  const rand = mulberry32(seed)
  const n = randInt(rand, 3, MAX_NODES)
  const edges: WeightedEdge[] = []
  const seen = new Set<string>()
  const add = (a: number, b: number): void => {
    const key = a < b ? `${a},${b}` : `${b},${a}`
    if (a === b || seen.has(key) || edges.length >= MAX_EDGES) return
    seen.add(key)
    edges.push([Math.min(a, b), Math.max(a, b), randInt(rand, MIN_WEIGHT, MAX_WEIGHT)])
  }
  // Mostly connected: hook each node to an earlier one, now and then skipping a node.
  for (let i = 1; i < n; i++) if (rand() > 0.1) add(randInt(rand, 0, i - 1), i)
  const extra = randInt(rand, 1, 4)
  for (let k = 0; k < extra * 3 && edges.length < Math.min(MAX_EDGES, n - 1 + extra); k++) {
    add(randInt(rand, 0, n - 1), randInt(rand, 0, n - 1))
  }
  if (edges.length === 0) add(0, 1)
  return { n, edges, src: randInt(rand, 0, n - 1) }
}

const tracer: Tracer<DijkstraInput, DijkstraResult> = {
  id: 'graphs/dijkstra',
  title: 'Dijkstra: cheapest routes',
  anchors: {
    init: 'The source costs 0; every other node starts at ∞',
    pick: 'Take the unsettled node with the smallest distance',
    settle: 'Settle it: its distance is now final',
    relax: 'Try each road out of it: is going through it cheaper?',
    update: 'If cheaper, lower the neighbour’s distance',
    finish: 'No reachable node is left: dist holds the answers',
  },
  vars: [
    { name: 'u', label: 'node settled', role: 'focus' },
    { name: 'v', label: 'neighbour', role: 'ptrB' },
    { name: 'dist', role: 'value' },
    { name: 'settled', role: 'best' },
  ],
  input: {
    fields: [
      NODE_COUNT_FIELD,
      {
        name: 'edges',
        label: 'Roads',
        kind: 'string',
        placeholder: 'e.g. 0-1:4, 0-2:1, 2-1:2',
        help: `Up to ${MAX_EDGES} roads. 0-1:4 is a two-way road between 0 and 1 of length 4 (1 to ${MAX_WEIGHT}).`,
      },
      {
        name: 'src',
        label: 'Start node',
        kind: 'int',
        placeholder: 'e.g. 0',
        help: 'The node distances are measured from.',
      },
    ],
    parse: parseInput,
    format: ({ n, edges, src }) => ({ n: String(n), edges: formatWeightedEdges(edges, false), src: String(src) }),
    presets: [
      {
        label: 'A detour beats a short hop',
        value: { n: 6, edges: [[0, 1, 4], [0, 2, 1], [1, 2, 2], [1, 3, 5], [2, 4, 8], [3, 4, 3], [3, 5, 6]], src: 0 },
      },
      {
        label: 'The long way round is cheaper',
        value: { n: 5, edges: [[0, 1, 9], [0, 2, 2], [2, 4, 3], [1, 4, 1], [1, 3, 2]], src: 0 },
      },
      {
        label: 'Some nodes are cut off',
        value: { n: 5, edges: [[0, 1, 3], [1, 2, 2], [0, 2, 7], [3, 4, 1]], src: 0 },
      },
    ],
    random: randomInput,
    limits: GRAPH_LIMITS,
  },
  run,
  reference,
}

export default tracer
