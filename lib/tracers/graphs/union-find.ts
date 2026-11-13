/**
 * Graphs — union-find (disjoint sets) with path compression and union by size
 * (LeetCode 547 / 684 framing: "connect these pairs, how many groups remain?").
 *
 * Every node starts as its own group. `parent[x]` says who x points to; a root
 * points to itself and stands for its whole group. `find(x)` follows parents up
 * to the root, then points everything it passed straight at the root (path
 * compression). `union` hangs the root of the smaller group under the root of
 * the larger one (ties keep the first node's root on top).
 *
 * Every frame is a CompositeScene (column): a directed GraphScene drawing each
 * node's parent pointer as an arrow child → parent, laid out as a forest (roots
 * in row 0, children below), plus ArrayScenes `parent` and `size` (size is only
 * meaningful for roots, so other cells are empty). Marks: 'focus' = node being
 * looked up, 'compare' = nodes on the way up, 'found' = the root reached,
 * 'changed' = a pointer that just changed (arrows get role 'changed' too).
 *
 * Code lives in content/code/graphs/union-find.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import {
  GRAPH_LIMITS,
  MAX_EDGES,
  NODE_COUNT_FIELD,
  formatEdges,
  graphScene,
  nodeId,
  parseEdges,
  parseNodeCount,
  randomEdges,
} from './common'
import type { Edge, EdgeRole } from './common'
import type {
  ArrayScene,
  CompositeScene,
  Frame,
  GraphNode,
  MarkRole,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface UnionFindInput {
  n: number
  /** Pairs to connect, in order. */
  edges: Edge[]
}

export interface UnionFindResult {
  /** How many separate groups remain. */
  components: number
  /** The groups: members sorted, groups ordered by smallest member. */
  groups: number[][]
}

function parseInput(raw: Record<string, string>): ParseResult<UnionFindInput> {
  const n = parseNodeCount(raw.n)
  if (!n.ok) return n
  const edges = parseEdges(raw.edges, n.value, false)
  if (!edges.ok) return edges
  return { ok: true, value: { n: n.value, edges: edges.value } }
}

// ---------------------------------------------------------------------------
// Forest layout
// ---------------------------------------------------------------------------

/** Place the forest on the logical grid: roots on row 0, leaves spread left to right. */
export function forestNodes(parent: number[]): GraphNode[] {
  const n = parent.length
  const kids: number[][] = Array.from({ length: n }, () => [])
  for (let i = 0; i < n; i++) if (parent[i] !== i) kids[parent[i]].push(i)
  const x: number[] = Array(n).fill(0)
  const depth: number[] = Array(n).fill(0)
  let units = 0
  const place = (node: number, d: number): void => {
    depth[node] = d
    if (kids[node].length === 0) {
      x[node] = units++
      return
    }
    for (const k of kids[node]) place(k, d + 1)
    x[node] = (x[kids[node][0]] + x[kids[node][kids[node].length - 1]]) / 2
  }
  for (let i = 0; i < n; i++) if (parent[i] === i) place(i, 0)
  const gap = units > 1 ? Math.min(1.5, 5 / (units - 1)) : 0
  const left = (5 - gap * Math.max(0, units - 1)) / 2
  return Array.from({ length: n }, (_, i) => ({
    id: nodeId(i),
    label: String(i),
    at: { col: Math.round((left + x[i] * gap) * 100) / 100, row: Math.min(3, depth[i]) },
  }))
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

const YES = 'Yes, same group'
const NO = 'No, different groups'

function rotate<T>(xs: T[], shift: number): T[] {
  const k = shift % xs.length
  return [...xs.slice(k), ...xs.slice(0, k)]
}

function run({ n, edges }: UnionFindInput) {
  const rec = createRecorder<UnionFindResult>()

  // Working state — mirrors the code files.
  const parent: number[] = Array.from({ length: n }, (_, i) => i)
  const size: number[] = Array(n).fill(1)
  let components = n

  let a: number | null = null
  let b: number | null = null
  let ra: number | null = null
  let rb: number | null = null

  const emit = (
    at: string,
    say: string,
    view: {
      /** Nodes drawn with a role this frame (later entries win). */
      marks?: Array<{ node: number; role: MarkRole }>
      /** Nodes whose arrow to their parent gets a role. */
      arrows?: Array<{ node: number; role: EdgeRole }>
      final?: boolean
    } = {},
  ): void => {
    const nodes = forestNodes(parent)
    const kids = Array.from({ length: n }, (_, i) => i).filter((i) => parent[i] !== i)
    const roleOf = new Map((view.arrows ?? []).map((x) => [x.node, x.role]))
    const markRoles = new Map<number, MarkRole>()
    if (view.final) {
      for (let i = 0; i < n; i++) markRoles.set(i, parent[i] === i ? 'found' : 'visited')
    }
    for (const m of view.marks ?? []) markRoles.set(m.node, m.role)

    const graph = graphScene({
      n,
      directed: true,
      nodes,
      edges: kids.map((i) => [i, parent[i]] as Edge),
      edgeRoles: kids.map((i) => roleOf.get(i)),
      marks: Array.from(markRoles, ([node, role]) => ({ node, role })),
    })
    const parentScene: ArrayScene = { kind: 'array', label: 'parent', cells: parent.slice() }
    const sizeScene: ArrayScene = {
      kind: 'array',
      label: 'size',
      cells: parent.map((p, i) => (p === i ? size[i] : null)),
    }
    if (markRoles.size) {
      parentScene.marks = Array.from(markRoles, ([index, role]) => ({ index, role }))
      sizeScene.marks = Array.from(markRoles)
        .filter(([index]) => parent[index] === index)
        .map(([index, role]) => ({ index, role }))
    }
    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { title: 'Groups as trees: an arrow points from a node to its parent, the top node is the root', scene: graph },
        { scene: parentScene },
        { scene: sizeScene },
      ],
    }
    const vars: Record<string, Val> = { a, b, ra, rb, parent: parent.slice(), components }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: components, max: n, label: 'Groups' },
    }
    rec.frame(frame)
  }

  const askOnLast = (p: PredictCandidate): void => {
    const last = rec.frames[rec.frames.length - 1]
    if (last && !last.predict) last.predict = p
  }

  /** find(x) with path compression, recording a `find` frame and, when needed, a `compress` frame. */
  const find = (x: number): number => {
    const path = [x]
    while (parent[path[path.length - 1]] !== path[path.length - 1]) path.push(parent[path[path.length - 1]])
    const root = path[path.length - 1]
    const hops = path.length - 1
    const label = `find(${x})`
    const marks: Array<{ node: number; role: MarkRole }> = path.map((node) => ({ node, role: 'compare' as MarkRole }))
    marks[0] = { node: x, role: 'focus' }
    marks[marks.length - 1] = { node: root, role: 'found' }
    if (hops === 0) {
      emit('find', `${label}: node ${x} points to itself, so it is a root.`, { marks })
    } else {
      emit(
        'find',
        `${label}: follow the pointers ${path.join(' → ')}. The root is ${root}.`,
        { marks, arrows: path.slice(0, -1).map((node) => ({ node, role: 'focus' as EdgeRole })) },
      )
    }
    if (hops >= 2) {
      const flattened = path.slice(0, -2) // everything above the root's direct children
      for (const node of flattened) parent[node] = root
      emit(
        'compress',
        `Path compression: ${flattened.join(', ')} now ${flattened.length === 1 ? 'points' : 'point'} straight at ${root}. Next lookups take one hop.`,
        {
          marks: [...flattened.map((node) => ({ node, role: 'changed' as MarkRole })), { node: root, role: 'found' }],
          arrows: flattened.map((node) => ({ node, role: 'changed' as EdgeRole })),
        },
      )
    }
    return root
  }

  // init — everyone is alone.
  emit('init', `${n} nodes, ${n} groups: every node is its own parent, a root of size 1.`)

  for (let e = 0; e < edges.length && !rec.capped; e++) {
    const [p, q] = edges[e]
    a = p
    b = q
    ra = null
    rb = null

    // Ask for find(p)'s root when it takes at least one hop.
    let rootP = p
    while (parent[rootP] !== rootP) rootP = parent[rootP]
    if (rootP !== p) {
      askOnLast({
        tag: 'find-root',
        kind: 'cell',
        prompt: `Next pair: ${p}-${q}. Follow the parent pointers up from ${p}. Which root do you reach?`,
        answer: nodeId(rootP),
        why: `Each step moves to the parent until a node points to itself. That node, ${rootP}, is the root of ${p}'s group.`,
        hint: 'Keep following the arrows upward until you reach the top node.',
      })
    }
    ra = find(p)
    if (rec.capped) break

    let rootQ = q
    while (parent[rootQ] !== rootQ) rootQ = parent[rootQ]
    const same = ra === rootQ
    askOnLast({
      tag: 'connected',
      kind: 'choice',
      prompt: `${p} is in the group of root ${ra}. Is ${q} already in that same group?`,
      options: rotate([YES, NO], p + q),
      answer: same ? YES : NO,
      why: same
        ? `Walking up from ${q} also ends at ${ra}. One group, so this pair adds nothing new.`
        : `Walking up from ${q} ends at ${rootQ}, not ${ra}. They are different groups, so this pair joins them.`,
      hint: 'Two nodes are connected exactly when they share a root.',
    })
    rb = find(q)
    if (rec.capped) break

    if (ra === rb) {
      emit('same', `Both roots are ${ra}, so ${p} and ${q} are already connected. Skip this pair.`, {
        marks: [{ node: p, role: 'focus' }, { node: q, role: 'focus' }, { node: ra, role: 'found' }],
      })
      continue
    }

    // union — hang the smaller group under the bigger one (tie: first root stays on top).
    let top = ra
    let low = rb
    if (size[top] < size[low]) {
      top = rb
      low = ra
    }
    if (size[ra] !== size[rb]) {
      askOnLast({
        tag: 'bigger-root',
        kind: 'cell',
        prompt: `Roots ${ra} (size ${size[ra]}) and ${rb} (size ${size[rb]}) are different groups. Which root stays on top?`,
        answer: nodeId(top),
        why: `The bigger group keeps its root, so fewer nodes get one level deeper. Root ${top} wins.`,
        hint: 'Hang the smaller tree under the bigger one.',
      })
    }
    parent[low] = top
    size[top] += size[low]
    components--
    emit(
      'union',
      `Roots ${ra} and ${rb} differ: hang root ${low} under root ${top}. Group size ${size[top]}, ${components} ${components === 1 ? 'group' : 'groups'} left.`,
      {
        marks: [{ node: top, role: 'found' }, { node: low, role: 'changed' }],
        arrows: [{ node: low, role: 'changed' }],
      },
    )
  }

  // finish — count the groups.
  a = null
  b = null
  ra = null
  rb = null
  const rootOf = (x: number): number => {
    let r = x
    while (parent[r] !== r) r = parent[r]
    return r
  }
  const byRoot = new Map<number, number[]>()
  for (let i = 0; i < n; i++) {
    const r = rootOf(i)
    byRoot.set(r, [...(byRoot.get(r) ?? []), i])
  }
  const groups = Array.from(byRoot.values()).sort((x, y) => x[0] - y[0])
  emit(
    'finish',
    `All pairs are processed. ${components} ${components === 1 ? 'group' : 'groups'}: ${groups.map((g) => `{${g.join(', ')}}`).join(' ')}.`,
    { final: true },
  )

  return rec.done({ components, groups })
}

/** Independent version: label propagation over the pair list until nothing changes. */
function reference({ n, edges }: UnionFindInput): UnionFindResult {
  const label = Array.from({ length: n }, (_, i) => i)
  let changed = true
  while (changed) {
    changed = false
    for (const [x, y] of edges) {
      const low = Math.min(label[x], label[y])
      if (label[x] !== low || label[y] !== low) {
        label[x] = low
        label[y] = low
        changed = true
      }
    }
  }
  const groups: number[][] = []
  for (const l of Array.from(new Set(label)).sort((x, y) => x - y)) {
    groups.push(label.flatMap((v, i) => (v === l ? [i] : [])))
  }
  groups.sort((x, y) => x[0] - y[0])
  return { components: groups.length, groups }
}

const tracer: Tracer<UnionFindInput, UnionFindResult> = {
  id: 'graphs/union-find',
  title: 'Union-Find: who is connected?',
  anchors: {
    init: 'Every node starts as its own group (its own parent)',
    find: 'find: follow parent pointers up to the root',
    compress: 'Path compression: point everything we passed at the root',
    same: 'Same root for both nodes: already connected, skip',
    union: 'Different roots: hang the smaller group under the bigger',
    finish: 'After all pairs, the roots left are the groups',
  },
  vars: [
    { name: 'a', label: 'first node', role: 'ptrA' },
    { name: 'b', label: 'second node', role: 'ptrB' },
    { name: 'ra', label: 'root of a', role: 'ptrA' },
    { name: 'rb', label: 'root of b', role: 'ptrB' },
    { name: 'parent', role: 'value' },
    { name: 'components', label: 'groups', role: 'best' },
  ],
  input: {
    fields: [
      NODE_COUNT_FIELD,
      {
        name: 'edges',
        label: 'Pairs to connect',
        kind: 'string',
        placeholder: 'e.g. 0-1, 2-3, 0-2',
        help: `Up to ${MAX_EDGES} pairs, processed left to right. 0-1 connects node 0 with node 1.`,
      },
    ],
    parse: parseInput,
    format: ({ n, edges }) => ({ n: String(n), edges: formatEdges(edges, false) }),
    presets: [
      { label: 'Friends join up', value: { n: 6, edges: [[0, 1], [2, 3], [0, 2], [3, 4], [1, 4], [5, 4]] } },
      { label: 'Long paths get flattened', value: { n: 6, edges: [[0, 1], [2, 3], [4, 5], [0, 2], [2, 4], [5, 3]] } },
      { label: 'Three separate groups', value: { n: 6, edges: [[0, 1], [1, 2], [3, 4]] } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const n = randInt(rand, 3, 7)
      const count = randInt(rand, 2, Math.min(MAX_EDGES, n + 2))
      return { n, edges: randomEdges(rand, n, false, count) }
    },
    limits: GRAPH_LIMITS,
  },
  run,
  reference,
}

export default tracer
