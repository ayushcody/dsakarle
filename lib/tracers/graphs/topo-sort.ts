/**
 * Graphs — topological order with Kahn's algorithm (LeetCode 207 / 210 framing).
 *
 * An edge a->b means "a must come before b" (a is a prerequisite of b). The
 * algorithm keeps an indegree count per node (how many unfinished prerequisites
 * it still waits on), a FIFO queue of nodes that are ready, and the output order.
 *
 * Every frame is a CompositeScene (column): the GraphScene (indegree badges under
 * the nodes), an ArrayScene `queue` (front/back pointers) and an ArrayScene
 * `order`. Graph marks: 'compare' = waiting in the queue, 'focus' = the node just
 * taken, 'visited' = already in the order, 'changed' = indegree just dropped,
 * 'error' = stuck behind a cycle, 'found' = everything ordered. Edges that have
 * been removed are 'discarded' (faded, dashed).
 *
 * Code lives in content/code/graphs/topo-sort.{py,java,cpp}.
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
  MarkRole,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface TopoSortInput {
  n: number
  /** [a, b] means a must come before b. */
  edges: Edge[]
}

export interface TopoSortResult {
  /** A valid order of all n nodes, or [] when a cycle makes that impossible. */
  order: number[]
  possible: boolean
}

function parseInput(raw: Record<string, string>): ParseResult<TopoSortInput> {
  const n = parseNodeCount(raw.n)
  if (!n.ok) return n
  const edges = parseEdges(raw.edges, n.value, true)
  if (!edges.ok) return edges
  return { ok: true, value: { n: n.value, edges: edges.value } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const csv = (xs: number[]): string => xs.join(', ')

const COMPLETE = 'Every node is in the order'
const BLOCKED = 'A cycle blocks some nodes'
const JOINS = 'Yes, it joins the queue'
const WAITS = 'No, it still waits'

function rotate<T>(xs: T[], shift: number): T[] {
  const k = shift % xs.length
  return [...xs.slice(k), ...xs.slice(0, k)]
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ n, edges }: TopoSortInput) {
  const rec = createRecorder<TopoSortResult>()

  // Working state — mirrors the code files.
  const adj: number[][] = Array.from({ length: n }, () => [])
  const indegree: number[] = Array(n).fill(0)
  for (const [a, b] of edges) {
    adj[a].push(b)
    indegree[b]++
  }
  const queue: number[] = []
  const order: number[] = []
  const removed: boolean[] = edges.map(() => false) // edge taken out of play
  let showBadges = false

  let u: number | null = null
  let v: number | null = null
  let currentEdge = -1
  let justQueued = false
  let justTaken = false

  const emit = (
    at: string,
    say: string,
    extra: {
      /** Extra node marks for this frame (on top of the standing ones). */
      marks?: Array<{ node: number; role: MarkRole }>
      final?: 'found' | 'error'
      predict?: PredictCandidate
    } = {},
  ): void => {
    const inOrder = new Set(order)
    const marks: Array<{ node: number; role: MarkRole }> = []
    const edgeRoles: Array<EdgeRole | undefined> = edges.map((_, i) => {
      if (extra.final === 'error') {
        const [a, b] = edges[i]
        return !inOrder.has(a) && !inOrder.has(b) ? 'error' : removed[i] ? 'discarded' : undefined
      }
      if (i === currentEdge) return 'changed'
      return removed[i] ? 'discarded' : undefined
    })
    for (let i = 0; i < n; i++) {
      if (extra.final === 'found') marks.push({ node: i, role: 'found' })
      else if (extra.final === 'error') {
        if (!inOrder.has(i)) marks.push({ node: i, role: 'error' })
        else marks.push({ node: i, role: 'visited' })
      } else if (u === i) marks.push({ node: i, role: 'focus' })
      else if (inOrder.has(i)) marks.push({ node: i, role: 'visited' })
      else if (queue.includes(i)) marks.push({ node: i, role: 'compare' })
    }
    for (const m of extra.marks ?? []) marks.push(m)

    const graph = graphScene({
      n,
      directed: true,
      edges,
      edgeRoles,
      marks,
      badges: showBadges ? indegree.map((d) => `in ${d}`) : undefined,
    })
    const queueScene: ArrayScene = {
      kind: 'array',
      label: 'queue',
      cells: queue.slice(),
      capacity: n,
    }
    if (queue.length > 0) {
      queueScene.pointers = [
        { name: 'front', index: 0, role: 'ptrA' },
        { name: 'back', index: queue.length - 1, role: 'ptrB' },
      ]
      if (justQueued) queueScene.marks = [{ index: queue.length - 1, role: 'changed' }]
    }
    const orderScene: ArrayScene = {
      kind: 'array',
      label: 'order',
      cells: order.slice(),
      capacity: n,
    }
    if (justTaken && order.length > 0) orderScene.marks = [{ index: order.length - 1, role: 'changed' }]

    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { title: 'Prerequisites: an arrow A → B means A comes before B', scene: graph },
        { scene: queueScene },
        { scene: orderScene },
      ],
    }
    const vars: Record<string, Val> = {
      u,
      v,
      queue: queue.slice(),
      order: order.slice(),
    }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: order.length, max: n, label: 'Nodes in the order' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  /** The question about the next node to leave the queue rides on the frame before its pop. */
  const askNextOut = (): void => {
    if (queue.length < 2) return
    const last = rec.frames[rec.frames.length - 1]
    if (!last || last.predict) return
    last.predict = {
      tag: 'next-ready',
      kind: 'cell',
      prompt: `The queue holds ${csv(queue)}. Which node comes off the front next?`,
      answer: nodeId(queue[0]),
      why: `A queue is first in, first out. Node ${queue[0]} has waited longest, so it is taken next.`,
      hint: 'The front of the queue is the oldest arrival.',
    }
  }

  // indegree — count incoming edges.
  showBadges = true
  const heaviest = indegree.reduce((best, d, i) => (d > indegree[best] ? i : best), 0)
  emit(
    'indegree',
    `Count each node's incoming edges (its indegree). Node ${heaviest} has ${indegree[heaviest]}, so it must wait for ${indegree[heaviest] === 1 ? 'one other node' : `${indegree[heaviest]} others`}.`,
    { marks: [{ node: heaviest, role: 'compare' }] },
  )

  // seed — every node with indegree 0 starts in the queue.
  for (let i = 0; i < n; i++) if (indegree[i] === 0) queue.push(i)
  emit(
    'seed',
    queue.length === 0
      ? 'No node has indegree 0, so every node waits on another. The queue starts empty.'
      : `Nodes with indegree 0 wait on nobody, so they start in the queue: ${csv(queue)}.`,
  )
  askNextOut()

  while (queue.length > 0 && !rec.capped) {
    // pop
    const x = queue.shift() as number
    u = x
    v = null
    order.push(x)
    justTaken = true
    justQueued = false
    emit(
      'pop',
      `Take ${x} from the front of the queue and add it to the order, which is now ${csv(order)}.`,
    )
    justTaken = false
    if (rec.capped) break

    for (let k = 0; k < adj[x].length && !rec.capped; k++) {
      const w = adj[x][k]
      const edgeIndex = edges.findIndex(([a, b], i) => a === x && b === w && !removed[i])
      const before = indegree[w]
      // A question about this edge rides on the frame before it is removed.
      const last = rec.frames[rec.frames.length - 1]
      if (last && !last.predict) {
        const joins = before === 1
        last.predict = {
          tag: 'joins-queue',
          kind: 'choice',
          prompt: `Next: remove the edge ${x}→${w}. Node ${w} has indegree ${before}. Does it join the queue now?`,
          options: rotate([JOINS, WAITS], x + k),
          answer: joins ? JOINS : WAITS,
          why: joins
            ? `Its indegree goes from 1 to 0: ${x} was the last thing node ${w} was waiting for.`
            : `Its indegree goes from ${before} to ${before - 1}, which is still above 0. It waits for ${before - 1} more.`,
          hint: 'A node is ready only when no incoming edges are left.',
        }
      }

      // drop
      v = w
      indegree[w]--
      removed[edgeIndex] = true
      currentEdge = edgeIndex
      emit(
        'drop',
        indegree[w] === 0
          ? `Remove edge ${x}→${w}: node ${w}'s indegree drops from ${before} to 0. Nothing holds it back now.`
          : `Remove edge ${x}→${w}: node ${w}'s indegree drops from ${before} to ${indegree[w]}. It still waits on ${indegree[w]} more.`,
        { marks: [{ node: w, role: 'changed' }] },
      )
      currentEdge = -1
      if (rec.capped) break

      // ready
      if (indegree[w] === 0) {
        queue.push(w)
        justQueued = true
        emit('ready', `Node ${w} has indegree 0, so it joins the back of the queue: ${csv(queue)}.`)
        justQueued = false
      }
    }
    u = null
    v = null
    askNextOut()
  }

  // finish — did every node make it into the order?
  const possible = order.length === n
  const last = rec.frames[rec.frames.length - 1]
  if (last && !last.predict) {
    last.predict = {
      tag: 'cycle-or-not',
      kind: 'choice',
      prompt: `The queue is empty and the graph has ${n} nodes. What does the order tell you?`,
      options: rotate([COMPLETE, BLOCKED], n + order.length),
      answer: possible ? COMPLETE : BLOCKED,
      why: possible
        ? `All ${n} nodes were taken, so there is no cycle and the order is valid.`
        : `Only ${order.length} of ${n} nodes were taken. The rest wait on each other, so a cycle blocks them.`,
      hint: `Count the nodes in the order and compare with ${n}.`,
    }
  }
  u = null
  v = null
  if (possible) {
    emit(
      'finish',
      `All ${n} nodes are in the order: ${csv(order)}. Every prerequisite comes before the node that needs it.`,
      { final: 'found' },
    )
  } else {
    const stuck = Array.from({ length: n }, (_, i) => i).filter((i) => !order.includes(i))
    emit(
      'finish',
      `The queue is empty with only ${order.length} of ${n} nodes taken. Nodes ${csv(stuck)} are stuck behind a cycle, so no valid order exists.`,
      { final: 'error' },
    )
  }

  return rec.done({ order: possible ? order.slice() : [], possible })
}

/**
 * Independent version. Cycle test: depth-first search with three colours. Order:
 * Kahn's idea again but with indegrees recounted from the raw edge list and a
 * read position instead of shift().
 */
function reference({ n, edges }: TopoSortInput): TopoSortResult {
  // Cycle check by DFS colouring.
  const colour: number[] = Array(n).fill(0) // 0 new, 1 on the path, 2 done
  let cyclic = false
  const visit = (node: number): void => {
    colour[node] = 1
    for (const [a, b] of edges) {
      if (a !== node) continue
      if (colour[b] === 1) cyclic = true
      else if (colour[b] === 0) visit(b)
    }
    colour[node] = 2
  }
  for (let i = 0; i < n; i++) if (colour[i] === 0) visit(i)
  if (cyclic) return { order: [], possible: false }

  const out: number[] = []
  const waiting = Array.from({ length: n }, (_, i) => edges.filter(([, b]) => b === i).length)
  for (let i = 0; i < n; i++) if (waiting[i] === 0) out.push(i)
  for (let read = 0; read < out.length; read++) {
    for (const [a, b] of edges) {
      if (a !== out[read]) continue
      waiting[b]--
      if (waiting[b] === 0) out.push(b)
    }
  }
  return { order: out, possible: true }
}

const tracer: Tracer<TopoSortInput, TopoSortResult> = {
  id: 'graphs/topo-sort',
  title: 'Topological order',
  anchors: {
    indegree: 'Count the incoming edges of every node (indegree)',
    seed: 'Queue every node whose indegree is 0',
    pop: 'Take a node off the front and add it to the order',
    drop: 'Remove its outgoing edges: lower each neighbour’s indegree',
    ready: 'A neighbour that reaches indegree 0 joins the queue',
    finish: 'All n nodes taken: that is the order. Fewer: a cycle',
  },
  vars: [
    { name: 'u', label: 'node taken', role: 'focus' },
    { name: 'v', label: 'neighbour', role: 'ptrB' },
    { name: 'queue', role: 'value' },
    { name: 'order', role: 'best' },
  ],
  input: {
    fields: [
      NODE_COUNT_FIELD,
      {
        name: 'edges',
        label: 'Prerequisites',
        kind: 'string',
        placeholder: 'e.g. 0->1, 0->2, 1->3',
        help: `Up to ${MAX_EDGES} edges. 1->3 means node 1 must come before node 3.`,
      },
    ],
    parse: parseInput,
    format: ({ n, edges }) => ({ n: String(n), edges: formatEdges(edges, true) }),
    presets: [
      { label: 'Course plan (a valid order)', value: { n: 6, edges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [3, 5], [4, 5]] } },
      { label: 'A cycle blocks the end', value: { n: 6, edges: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5], [5, 3]] } },
      { label: 'Three ways to start', value: { n: 7, edges: [[0, 3], [1, 3], [2, 4], [3, 5], [4, 5], [5, 6]] } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const n = randInt(rand, 3, 7)
      const count = randInt(rand, Math.max(2, n - 2), Math.min(MAX_EDGES, n + 2))
      if (rand() < 0.35) return { n, edges: randomEdges(rand, n, true, count) }
      // A DAG: shuffle the nodes, then only draw edges from earlier to later.
      const perm = Array.from({ length: n }, (_, i) => i)
      for (let i = n - 1; i > 0; i--) {
        const j = randInt(rand, 0, i)
        ;[perm[i], perm[j]] = [perm[j], perm[i]]
      }
      const edges: Edge[] = []
      const seen = new Set<string>()
      let guard = 0
      while (edges.length < count && guard++ < 200) {
        const i = randInt(rand, 0, n - 2)
        const j = randInt(rand, i + 1, n - 1)
        const key = `${perm[i]},${perm[j]}`
        if (seen.has(key)) continue
        seen.add(key)
        edges.push([perm[i], perm[j]])
      }
      return { n, edges }
    },
    limits: GRAPH_LIMITS,
  },
  run,
  reference,
}

export default tracer
