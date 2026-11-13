/**
 * Graphs — pieces shared by the two tracers (build-adjacency, topo-sort).
 *
 * Not a tracer itself and not in the registry. It holds
 *   1. fixed node positions per node count (so the drawing never moves)
 *   2. `graphScene`, which turns state into a GraphScene (no layout, only state)
 *   3. input parsing for "node count + edges text" and random helpers
 *
 * Node ids are `n0..n6` (label "0".."6"). The `n` prefix keeps a node id from
 * ever equalling an array index when a predict asks the learner to click a node
 * in a scene that also contains an array.
 *
 * Positions are chosen so that every node sits on the outline of a convex shape
 * (triangle, diamond, pentagon, hexagon, heptagon). No three nodes are ever in a
 * line, so an edge never passes through a third node. Node i is placed roughly
 * left to right in index order, so prerequisite graphs read left to right.
 */
import { randInt } from '../rng'
import type {
  GraphNode,
  GraphScene,
  InputField,
  InputLimits,
  MarkRole,
  ParseResult,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Limits and types
// ---------------------------------------------------------------------------

export const MIN_NODES = 2
export const MAX_NODES = 7
export const MAX_EDGES = 10

/** `maxN` is the node limit; `min`..`max` is the node-label range. */
export const GRAPH_LIMITS: InputLimits = { maxN: MAX_NODES, min: 0, max: MAX_NODES - 1 }

/** [from, to]. For undirected graphs the order is only how the learner typed it. */
export type Edge = [number, number]

export type EdgeRole = NonNullable<GraphScene['edges'][number]['role']>

// ---------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------

/** Logical grid positions (col 0..5, row 0..3) for node i of an n-node graph. */
export const POSITIONS: Record<number, Array<[col: number, row: number]>> = {
  2: [[0, 1], [2, 1]],
  3: [[0, 1], [2, 0], [2, 2]],
  4: [[0, 1], [2, 0], [2, 2], [4, 1]],
  5: [[0, 1], [2, 0], [2, 2], [4, 0], [4, 2]],
  6: [[0, 1], [1, 0], [1, 2], [3, 0], [3, 2], [4, 1]],
  7: [[0, 1], [1, 0], [1, 3], [3, 0], [3, 3], [4, 1], [4, 2]],
}

export function nodeId(i: number): string {
  return `n${i}`
}

export function graphNodes(n: number): GraphNode[] {
  const spots = POSITIONS[n]
  return Array.from({ length: n }, (_, i) => ({
    id: nodeId(i),
    label: String(i),
    at: { col: spots[i][0], row: spots[i][1] },
  }))
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export interface GraphView {
  n: number
  directed: boolean
  edges: Edge[]
  /** One role per edge (same order as `edges`); undefined = plain. */
  edgeRoles?: Array<EdgeRole | undefined>
  /** Node index → mark roles. */
  marks?: Array<{ node: number; role: MarkRole }>
  /** One badge text per node; '' or undefined = none. */
  badges?: Array<string | undefined>
  /** One weight per edge (same order as `edges`); drawn as a chip on the edge. */
  weights?: number[]
  /** Custom node placement (same order as node ids); default is the fixed layout for n. */
  nodes?: GraphNode[]
  annotations?: GraphScene['annotations']
}

export function graphScene(view: GraphView): GraphScene {
  const scene: GraphScene = {
    kind: 'graph',
    directed: view.directed,
    nodes: view.nodes ?? graphNodes(view.n),
    edges: view.edges.map(([a, b], i) => {
      const role = view.edgeRoles?.[i]
      const edge: GraphScene['edges'][number] = { from: nodeId(a), to: nodeId(b) }
      if (view.weights) edge.weight = view.weights[i]
      if (role) edge.role = role
      return edge
    }),
  }
  if (view.marks?.length) scene.marks = view.marks.map((m) => ({ id: nodeId(m.node), role: m.role }))
  const badges: NonNullable<GraphScene['badges']> = []
  view.badges?.forEach((text, i) => {
    if (text) badges.push({ id: nodeId(i), text })
  })
  if (badges.length) scene.badges = badges
  if (view.annotations?.length) scene.annotations = view.annotations
  return scene
}

// ---------------------------------------------------------------------------
// Input fields and parsing
// ---------------------------------------------------------------------------

export const NODE_COUNT_FIELD: InputField = {
  name: 'n',
  label: 'Nodes',
  kind: 'int',
  placeholder: 'e.g. 5',
  help: `How many nodes, ${MIN_NODES} to ${MAX_NODES}. They are numbered 0, 1, 2 and so on.`,
}

/** Keep echoed user text short so error messages stay friendly. */
function shown(text: string): string {
  return text.length > 14 ? `${text.slice(0, 13)}…` : text
}

export function parseNodeCount(raw: string | undefined): ParseResult<number> {
  const text = (raw ?? '').trim()
  if (!/^\d+$/.test(text)) {
    return {
      ok: false,
      field: 'n',
      error: `Nodes must be a whole number from ${MIN_NODES} to ${MAX_NODES}, not "${shown(text)}".`,
    }
  }
  const n = Number(text)
  if (n < MIN_NODES || n > MAX_NODES) {
    return { ok: false, field: 'n', error: `Use ${MIN_NODES} to ${MAX_NODES} nodes so the picture stays readable.` }
  }
  return { ok: true, value: n }
}

const EDGE_RE = /^(\d+)\s*(?:->|→|-|–)\s*(\d+)$/

/**
 * "0-1, 0-2, 1-3" (or "0->1"). Rejects self-loops, duplicates, unknown nodes and
 * more than MAX_EDGES edges. For undirected graphs 0-1 and 1-0 are the same edge.
 */
export function parseEdges(raw: string | undefined, n: number, directed: boolean): ParseResult<Edge[]> {
  const field = 'edges'
  const parts = (raw ?? '')
    .split(/[,;\n]+/)
    .map((p) => p.trim())
    .filter((p) => p !== '')
  if (parts.length === 0) {
    return { ok: false, field, error: 'Type at least one edge, like 0-1, 0-2. Each edge joins two node numbers.' }
  }
  if (parts.length > MAX_EDGES) {
    return { ok: false, field, error: `Use at most ${MAX_EDGES} edges so the picture stays readable.` }
  }
  const edges: Edge[] = []
  const seen = new Set<string>()
  for (const part of parts) {
    const match = EDGE_RE.exec(part)
    if (!match) {
      return { ok: false, field, error: `"${shown(part)}" isn't an edge. Write two node numbers with a dash, like 0-1.` }
    }
    const a = Number(match[1])
    const b = Number(match[2])
    for (const node of [a, b]) {
      if (node >= n) {
        return { ok: false, field, error: `Node ${node} isn't in the graph: with ${n} nodes the labels run from 0 to ${n - 1}.` }
      }
    }
    if (a === b) {
      return { ok: false, field, error: `Edge ${a}-${b} joins a node to itself. Use two different nodes.` }
    }
    const key = directed || a < b ? `${a},${b}` : `${b},${a}`
    if (seen.has(key)) {
      return {
        ok: false,
        field,
        error: directed
          ? `Edge ${a}->${b} is listed twice. List each edge once.`
          : `Edges ${a}-${b} and ${b}-${a} are the same road. List it once.`,
      }
    }
    seen.add(key)
    edges.push([a, b])
  }
  return { ok: true, value: edges }
}

/** [from, to, weight]. */
export type WeightedEdge = [number, number, number]

export const MIN_WEIGHT = 1
export const MAX_WEIGHT = 9

/**
 * "0-1:4, 0-2:1". Same rules as parseEdges (undirected unless `directed`), plus a
 * weight from MIN_WEIGHT to MAX_WEIGHT after a colon on every edge.
 */
export function parseWeightedEdges(raw: string | undefined, n: number, directed: boolean): ParseResult<WeightedEdge[]> {
  const field = 'edges'
  const parts = (raw ?? '')
    .split(/[,;\n]+/)
    .map((p) => p.trim())
    .filter((p) => p !== '')
  if (parts.length === 0) {
    return { ok: false, field, error: 'Type at least one road with its length, like 0-1:4, 0-2:1.' }
  }
  const weights: number[] = []
  const bare: string[] = []
  for (const part of parts) {
    const i = part.indexOf(':')
    const wText = i < 0 ? '' : part.slice(i + 1).trim()
    if (i < 0 || !/^\d+$/.test(wText)) {
      return { ok: false, field, error: `"${shown(part)}" needs a weight. Write it like 0-1:4, where 4 is the road length.` }
    }
    const w = Number(wText)
    if (w < MIN_WEIGHT || w > MAX_WEIGHT) {
      return { ok: false, field, error: `Weights run from ${MIN_WEIGHT} to ${MAX_WEIGHT}, not ${w}.` }
    }
    weights.push(w)
    bare.push(part.slice(0, i))
  }
  const edges = parseEdges(bare.join(', '), n, directed)
  if (!edges.ok) return edges
  return { ok: true, value: edges.value.map(([a, b], k) => [a, b, weights[k]] as WeightedEdge) }
}

export function formatWeightedEdges(edges: WeightedEdge[], directed: boolean): string {
  return edges.map(([a, b, w]) => `${a}${directed ? '->' : '-'}${b}:${w}`).join(', ')
}

export function formatEdges(edges: Edge[], directed: boolean): string {
  return edges.map(([a, b]) => `${a}${directed ? '->' : '-'}${b}`).join(', ')
}

// ---------------------------------------------------------------------------
// Random helpers
// ---------------------------------------------------------------------------

/** Distinct random edges. Undirected pairs are unordered; directed pairs may appear in both directions. */
export function randomEdges(rand: () => number, n: number, directed: boolean, count: number): Edge[] {
  const edges: Edge[] = []
  const seen = new Set<string>()
  let guard = 0
  while (edges.length < count && guard++ < 200) {
    const a = randInt(rand, 0, n - 1)
    const b = randInt(rand, 0, n - 1)
    if (a === b) continue
    const key = directed || a < b ? `${a},${b}` : `${b},${a}`
    if (seen.has(key)) continue
    seen.add(key)
    edges.push([a, b])
  }
  return edges
}
