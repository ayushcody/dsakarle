/**
 * Graphs — Kruskal's minimum spanning tree with Union-Find (LeetCode 1584 framing:
 * "connect every point as cheaply as possible").
 *
 * Sort the edges by weight (ties: smaller lower endpoint, then smaller higher
 * endpoint). Walk the sorted list. For each edge find the set of both ends with a
 * plain `find` (follow parents to the root). Different roots: take the edge and
 * hang one root under the other. Same root: the edge would close a cycle, skip it.
 * Stop once n - 1 edges are taken. If the graph is not connected the run goes
 * through every edge and the result is the weight of the minimum spanning forest
 * (one tree per piece); Prim's reference computes the same forest weight.
 *
 * Scene: composite column = the weighted graph + the sorted edge list.
 * Graph edges: focus = being looked at, found = taken, error = just rejected
 * (cycle), discarded = rejected earlier. Node badges show the set (its root) as
 * `s<root>`; nodes: compare = the two ends, changed = the merged ends.
 * Code lives in content/code/graphs/kruskal.{py,java,cpp}.
 */
import { createRecorder } from '@/lib/engine/recorder'
import { mulberry32, randInt } from '../rng'
import {
  GRAPH_LIMITS,
  MAX_EDGES,
  MAX_NODES,
  MIN_WEIGHT,
  NODE_COUNT_FIELD,
  formatWeightedEdges,
  graphScene,
  parseNodeCount,
  parseWeightedEdges,
} from './common'
import type { EdgeRole, WeightedEdge } from './common'
import type {
  ArrayScene,
  CompositeScene,
  MarkRole,
  ParseResult,
  PredictCandidate,
  Tracer,
} from '@/lib/engine/types'

export const KRUSKAL_MAX_WEIGHT = 20

export interface KruskalInput {
  n: number
  /** [a, b, weight], undirected, listed once each. */
  edges: WeightedEdge[]
}

/** Total weight of the minimum spanning tree (forest, when the graph is not connected). */
export type KruskalResult = number

function parseInput(raw: Record<string, string>): ParseResult<KruskalInput> {
  const n = parseNodeCount(raw.n)
  if (!n.ok) return n
  const edges = parseWeightedEdges(raw.edges, n.value, false, KRUSKAL_MAX_WEIGHT)
  if (!edges.ok) return edges
  return { ok: true, value: { n: n.value, edges: edges.value } }
}

const TAKE = 'Take it'
const SKIP = 'Skip it (cycle)'

const lo = (e: WeightedEdge): number => Math.min(e[0], e[1])
const hi = (e: WeightedEdge): number => Math.max(e[0], e[1])
const name = (e: WeightedEdge): string => `${lo(e)}-${hi(e)}`

function rotate<T>(xs: T[], shift: number): T[] {
  const k = shift % xs.length
  return [...xs.slice(k), ...xs.slice(0, k)]
}

function run({ n, edges }: KruskalInput) {
  const rec = createRecorder<KruskalResult>()

  // Sorted order, as indexes into `edges` (so the drawing keeps the typed order).
  const order = edges
    .map((_, i) => i)
    .sort((x, y) => edges[x][2] - edges[y][2] || lo(edges[x]) - lo(edges[y]) || hi(edges[x]) - hi(edges[y]))
  const sorted = order.map((i) => edges[i])

  // Working state — mirrors the code files.
  const parent: number[] = Array.from({ length: n }, (_, i) => i)
  const find = (x: number): number => {
    while (parent[x] !== x) x = parent[x]
    return x
  }
  let total = 0
  let used = 0
  const status: Array<'taken' | 'rejected' | undefined> = sorted.map(() => undefined)

  let cur = -1 // position in the sorted list
  let ra: number | null = null
  let rb: number | null = null
  let justRejected = false
  let merged: number[] = []

  const emit = (at: string, say: string, predict?: PredictCandidate, final = false): void => {
    const edgeRoles: Array<EdgeRole | undefined> = edges.map(() => undefined)
    const cells = sorted.map((e) => `${name(e)} (${e[2]})`)
    const arrayMarks: ArrayScene['marks'] = []
    sorted.forEach((_, k) => {
      const i = order[k]
      let role: MarkRole | undefined
      let eRole: EdgeRole | undefined
      if (status[k] === 'taken') {
        role = 'found'
        eRole = 'found'
      } else if (status[k] === 'rejected') {
        role = 'discarded'
        eRole = k === cur && justRejected ? 'error' : 'discarded'
      }
      if (k === cur && !status[k]) {
        role = 'compare'
        eRole = 'focus'
      }
      if (role) arrayMarks.push({ index: k, role })
      edgeRoles[i] = eRole
    })

    const nodeMarks: Array<{ node: number; role: MarkRole }> = []
    if (final) {
      for (let i = 0; i < n; i++) nodeMarks.push({ node: i, role: 'found' })
    } else if (cur >= 0) {
      const role: MarkRole = merged.length ? 'changed' : justRejected ? 'error' : 'compare'
      nodeMarks.push({ node: lo(sorted[cur]), role }, { node: hi(sorted[cur]), role })
    }

    const graph = graphScene({
      n,
      directed: false,
      edges: edges.map(([a, b]) => [a, b] as [number, number]),
      weights: edges.map((e) => e[2]),
      edgeRoles,
      marks: nodeMarks,
      badges: Array.from({ length: n }, (_, i) => `s${find(i)}`),
    })
    const list: ArrayScene = { kind: 'array', label: 'edges, cheapest first', cells }
    if (cur >= 0 && cur < sorted.length && !final) list.pointers = [{ name: 'edge', index: cur, role: 'ptrB' }]
    if (arrayMarks.length) list.marks = arrayMarks
    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { title: 'Graph: numbers on the lines are weights; s<k> is the set a node belongs to', scene: graph },
        { scene: list },
      ],
    }
    const frame = {
      scene,
      vars: {
        edge: cur >= 0 && cur < sorted.length ? `${name(sorted[cur])}:${sorted[cur][2]}` : null,
        ra,
        rb,
        taken: used,
        total,
      },
      say,
      at,
      gauge: { value: used, max: n - 1, label: 'Edges taken' },
      ...(predict ? { predict } : {}),
    }
    rec.frame(frame)
  }

  emit('init', `Sort the ${edges.length} edges by weight, cheapest first. Every node starts in its own set.`)

  for (let k = 0; k < sorted.length && !rec.capped; k++) {
    const e = sorted[k]
    const [a, b, w] = [lo(e), hi(e), e[2]]
    cur = k
    ra = null
    rb = null
    justRejected = false
    merged = []
    const sameSet = find(a) === find(b)
    emit(
      'consider',
      `Next cheapest edge is ${a}-${b} with weight ${w}. Does it join two different sets?`,
      {
        tag: 'take-or-skip',
        kind: 'choice',
        prompt: `Edge ${a}-${b} (weight ${w}) is next. Take this edge, or would it make a cycle?`,
        options: rotate([TAKE, SKIP], a + b + k),
        answer: sameSet ? SKIP : TAKE,
        why: sameSet
          ? `${a} and ${b} are already connected through cheaper edges, so adding ${a}-${b} would close a loop.`
          : `${a} and ${b} sit in different sets, so this edge connects two separate pieces without a loop.`,
        hint: 'Check whether the two ends already share a set. Same set means a cycle.',
      },
    )
    if (rec.capped) break

    ra = find(a)
    rb = find(b)
    emit(
      'find',
      ra === rb
        ? `find(${a}) = ${ra} and find(${b}) = ${rb}: same root, so ${a} and ${b} are already connected.`
        : `find(${a}) = ${ra} and find(${b}) = ${rb}: different roots, so the sets are separate.`,
    )
    if (rec.capped) break

    if (ra === rb) {
      status[k] = 'rejected'
      justRejected = true
      emit('skip', `Skip ${a}-${b}: it would make a cycle inside set ${ra}.`)
      continue
    }
    parent[rb] = ra
    status[k] = 'taken'
    used++
    total += w
    merged = [a, b]
    emit('take', `Take ${a}-${b}: merge set ${rb} into set ${ra}. Total weight is now ${total}.`)
    merged = []
    if (used === n - 1) break
  }

  cur = -1
  ra = null
  rb = null
  justRejected = false
  const left = status.filter((s) => s === undefined).length
  const pieces = n - used
  emit(
    'done',
    used === n - 1
      ? `${n - 1} edges connect all ${n} nodes${left ? `, so the ${left} unchecked ${left === 1 ? 'edge is' : 'edges are'} not needed` : ''}. Minimum weight: ${total}.`
      : `All edges checked. ${pieces} separate pieces remain, so the cheapest spanning forest weighs ${total}.`,
    undefined,
    true,
  )
  return rec.done(total)
}

/** Independent version: Prim's algorithm grown from each unvisited node (spanning forest). */
function reference({ n, edges }: KruskalInput): KruskalResult {
  const adj: Array<Array<[number, number]>> = Array.from({ length: n }, () => [])
  for (const [a, b, w] of edges) {
    adj[a].push([b, w])
    adj[b].push([a, w])
  }
  const inTree: boolean[] = Array(n).fill(false)
  let total = 0
  for (let start = 0; start < n; start++) {
    if (inTree[start]) continue
    const best: number[] = Array(n).fill(Infinity)
    best[start] = 0
    for (;;) {
      let u = -1
      for (let v = 0; v < n; v++) if (!inTree[v] && best[v] < Infinity && (u < 0 || best[v] < best[u])) u = v
      if (u < 0) break
      inTree[u] = true
      total += best[u]
      for (const [v, w] of adj[u]) if (!inTree[v] && w < best[v]) best[v] = w
    }
  }
  return total
}

function randomInput(seed: number): KruskalInput {
  const rand = mulberry32(seed)
  const n = randInt(rand, 3, MAX_NODES)
  const edges: WeightedEdge[] = []
  const seen = new Set<string>()
  const add = (a: number, b: number): void => {
    const key = a < b ? `${a},${b}` : `${b},${a}`
    if (a === b || seen.has(key) || edges.length >= MAX_EDGES) return
    seen.add(key)
    edges.push([Math.min(a, b), Math.max(a, b), randInt(rand, MIN_WEIGHT, KRUSKAL_MAX_WEIGHT)])
  }
  // Mostly connected: hook each node to an earlier one, now and then skipping a node.
  for (let i = 1; i < n; i++) if (rand() > 0.1) add(randInt(rand, 0, i - 1), i)
  const extra = randInt(rand, 1, 4)
  for (let t = 0; t < extra * 3 && edges.length < n - 1 + extra; t++) add(randInt(rand, 0, n - 1), randInt(rand, 0, n - 1))
  if (edges.length === 0) add(0, 1)
  return { n, edges }
}

const tracer: Tracer<KruskalInput, KruskalResult> = {
  id: 'graphs/kruskal',
  title: 'Kruskal: cheapest edges, no cycles',
  anchors: {
    init: 'Sort the edges by weight; every node is its own set',
    consider: 'Take the next cheapest edge',
    find: 'find the set (root) of both ends',
    skip: 'Same set: the edge would make a cycle, skip it',
    take: 'Different sets: take the edge and merge them',
    done: 'Stop at n - 1 edges and return the total weight',
  },
  vars: [
    { name: 'edge', label: 'edge', role: 'focus' },
    { name: 'ra', label: 'root of one end', role: 'ptrA' },
    { name: 'rb', label: 'root of other end', role: 'ptrB' },
    { name: 'taken', label: 'edges taken', role: 'value' },
    { name: 'total', label: 'total weight', role: 'best' },
  ],
  input: {
    fields: [
      NODE_COUNT_FIELD,
      {
        name: 'edges',
        label: 'Roads with weights',
        kind: 'string',
        placeholder: 'e.g. 0-1:4, 1-2:2, 0-2:7',
        help: `Up to ${MAX_EDGES} roads. 0-1:4 joins nodes 0 and 1 at cost 4 (cost ${MIN_WEIGHT} to ${KRUSKAL_MAX_WEIGHT}).`,
      },
    ],
    parse: parseInput,
    format: ({ n, edges }) => ({ n: String(n), edges: formatWeightedEdges(edges, false) }),
    presets: [
      {
        label: 'Cheapest edges, skipping cycles',
        value: { n: 6, edges: [[0, 1, 4], [0, 2, 3], [1, 2, 1], [1, 3, 2], [2, 3, 4], [3, 4, 2], [3, 5, 7], [4, 5, 5]] },
      },
      {
        label: 'Ties: lowest nodes first',
        value: { n: 4, edges: [[0, 1, 5], [1, 2, 5], [0, 2, 5], [2, 3, 7]] },
      },
      {
        label: 'Not connected: a forest',
        value: { n: 6, edges: [[0, 1, 3], [1, 2, 5], [0, 2, 2], [3, 4, 4]] },
      },
    ],
    random: randomInput,
    limits: GRAPH_LIMITS,
  },
  run,
  reference,
}

export default tracer
