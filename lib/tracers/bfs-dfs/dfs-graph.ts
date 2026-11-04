/**
 * BFS & DFS — depth-first search on a small undirected graph (recursive).
 *
 * Input: an edge list (`0-1, 0-2, 1-3`) and a start node. Nodes are numbered
 * from 0; the graph has as many nodes as the biggest number in the edges plus
 * one, so a node nobody connects to is simply never reached. Neighbours are
 * tried smallest first, which makes the visit order predictable.
 *
 * One frame per idea:
 *   init       nothing visited yet
 *   visit      dfs(node) starts: mark it visited, give it a discovery number
 *   skip       a neighbour is already visited
 *   descend    a neighbour is new: call dfs on it (the edge lights up)
 *   backtrack  no new neighbours left: return to the caller
 *   done       return the visit order
 *
 * Scene: a composite row, the graph beside the recursion path (the call
 * stack). Node marks: focus = current node, compare = ancestors still on the
 * stack, visited = finished nodes. Badges show discovery order.
 * Code lives in content/code/bfs-dfs/dfs-graph.{py,java,cpp}.
 */
import { createRecorder } from '@/lib/engine/recorder'
import { mulberry32, randInt } from '../rng'
import type {
  Annotation,
  CompositeScene,
  Frame,
  GraphScene,
  InputLimits,
  MarkRole,
  ParseResult,
  PredictCandidate,
  StackScene,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface DfsGraphInput {
  /** Number of nodes, 0..n-1 (the biggest edge label plus one). */
  n: number
  /** Undirected edges as [a, b] with a < b, sorted, no duplicates. */
  edges: Array<[number, number]>
  start: number
}

/** maxN is the node count; min..max is the range of node numbers. */
const LIMITS: InputLimits = { maxN: 7, min: 0, max: 6 }
const MAX_EDGES = 10
const EXAMPLE = '0-1, 0-2, 1-3, 2-3'

function parseInput(raw: Record<string, string>): ParseResult<DfsGraphInput> {
  const failOn = (field: string, error: string): ParseResult<DfsGraphInput> => ({ ok: false, field, error })

  const text = (raw.edges ?? '').replace(/[−–—]/g, '-').replace(/\s*-\s*/g, '-')
  const tokens = text.split(/[\s,;]+/).filter((t) => t !== '')
  if (tokens.length === 0) return failOn('edges', `Type some edges, like ${EXAMPLE}. Each edge joins two node numbers.`)

  const seen = new Set<string>()
  const edges: Array<[number, number]> = []
  for (const token of tokens) {
    const m = /^(\d+)-(\d+)$/.exec(token)
    if (!m) return failOn('edges', `"${token}" isn't an edge. Write each edge as two numbers with a dash, like 0-1.`)
    const a = Number(m[1])
    const b = Number(m[2])
    if (a > LIMITS.max || b > LIMITS.max) {
      return failOn('edges', `Node numbers go from ${LIMITS.min} to ${LIMITS.max}, so at most ${LIMITS.maxN} nodes.`)
    }
    if (a === b) return failOn('edges', `"${token}" joins a node to itself. Each edge needs two different nodes.`)
    const lo = Math.min(a, b)
    const hi = Math.max(a, b)
    if (seen.has(`${lo}-${hi}`)) continue
    seen.add(`${lo}-${hi}`)
    edges.push([lo, hi])
  }
  if (edges.length > MAX_EDGES) return failOn('edges', `Use at most ${MAX_EDGES} edges so the picture stays readable.`)
  edges.sort((x, y) => x[0] - y[0] || x[1] - y[1])
  const n = Math.max(...edges.map((e) => e[1])) + 1

  const startText = (raw.start ?? '').trim()
  if (startText === '') return failOn('start', 'Type a start node, like 0.')
  if (!/^\d+$/.test(startText)) return failOn('start', `"${startText}" isn't a node number. Use a whole number like 0.`)
  const start = Number(startText)
  if (start >= n) return failOn('start', `Start must be a node in the graph: 0 to ${n - 1}.`)
  return { ok: true, value: { n, edges, start } }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fixed spots on the graph canvas, so the picture never jumps. */
const SLOTS: Array<{ col: number; row: number }> = [
  { col: 0, row: 1 },
  { col: 1, row: 0 },
  { col: 1, row: 2 },
  { col: 2, row: 1 },
  { col: 3, row: 0 },
  { col: 3, row: 2 },
  { col: 4, row: 1 },
]

const idOf = (i: number): string => `n${i}`

function adjacency(n: number, edges: Array<[number, number]>): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => [])
  for (const [a, b] of edges) {
    adj[a].push(b)
    adj[b].push(a)
  }
  adj.forEach((list) => list.sort((x, y) => x - y))
  return adj
}

const GO = 'Go deeper'
const BACK = 'Backtrack'

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ n, edges, start }: DfsGraphInput) {
  const rec = createRecorder<number[]>()
  const adj = adjacency(n, edges)

  // Working state — mirrors the variables in the code files.
  const visited: boolean[] = Array.from({ length: n }, () => false)
  const order: number[] = []
  const path: number[] = [] // the call stack: dfs(path[0]) ... dfs(path[top])
  const finished = new Set<number>()
  const edgeRole = new Map<string, 'focus' | 'visited' | 'discarded'>()
  let cur: number | null = null
  let nb: number | null = null
  let incoming: StackScene['incoming'] = null

  const edgeKey = (a: number, b: number): string => `${Math.min(a, b)}-${Math.max(a, b)}`

  const graphScene = (notes: Annotation[]): GraphScene => {
    const marks: Array<{ id: string; role: MarkRole }> = []
    for (let i = 0; i < n; i++) {
      if (i === cur) marks.push({ id: idOf(i), role: 'focus' })
      else if (path.includes(i)) marks.push({ id: idOf(i), role: 'compare' })
      else if (finished.has(i)) marks.push({ id: idOf(i), role: 'visited' })
    }
    const pointers: NonNullable<GraphScene['pointers']> = []
    if (cur !== null) pointers.push({ name: 'cur', target: idOf(cur), role: 'focus' })
    if (nb !== null) pointers.push({ name: 'next', target: idOf(nb), role: 'ptrB' })
    const scene: GraphScene = {
      kind: 'graph',
      directed: false,
      nodes: Array.from({ length: n }, (_, i) => ({ id: idOf(i), label: String(i), at: SLOTS[i] })),
      edges: edges.map(([a, b]) => {
        const role = edgeRole.get(edgeKey(a, b))
        return { from: idOf(a), to: idOf(b), ...(role ? { role } : {}) }
      }),
      marks,
      pointers,
      badges: order.map((node, k) => ({ id: idOf(node), text: `#${k + 1}` })),
    }
    if (notes.length > 0) scene.annotations = notes
    return scene
  }

  const stackScene = (): StackScene => {
    const scene: StackScene = {
      kind: 'stack',
      label: 'dfs()',
      items: path.slice(),
      capacity: n,
      incoming,
    }
    if (path.length > 0) scene.marks = [{ index: path.length - 1, role: 'focus' }]
    return scene
  }

  const emit = (atRule: string, say: string, notes: Annotation[] = [], predict?: PredictCandidate): void => {
    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'row',
      parts: [
        { title: 'Graph: discovery order under each node', scene: graphScene(notes) },
        { title: 'Call stack (path from the start)', scene: stackScene() },
      ],
    }
    const vars: Record<string, Val> = {
      node: cur,
      depth: path.length,
      order: order.join(', '),
    }
    const frame: Frame = {
      scene,
      vars,
      say,
      at: atRule,
      gauge: { value: order.length, max: n, label: 'Nodes visited' },
    }
    if (predict) frame.predict = predict
    rec.frame(frame)
  }

  // --- predicts --------------------------------------------------------------

  /** What the frame after "node is being scanned at neighbour index `idx`" will be. */
  const nextMove = (node: number, idx: number): { kind: 'descend' | 'skip' | 'backtrack'; nxt: number } => {
    if (idx >= adj[node].length) return { kind: 'backtrack', nxt: -1 }
    const nxt = adj[node][idx]
    return { kind: visited[nxt] ? 'skip' : 'descend', nxt }
  }

  const predictAfter = (prev: 'visit' | 'skip' | 'backtrack', node: number, idx: number): PredictCandidate | undefined => {
    const move = nextMove(node, idx)
    if (move.kind === 'skip') return undefined
    if (move.kind === 'descend' && prev !== 'visit') {
      return {
        tag: 'next-visit',
        kind: 'cell',
        prompt: `DFS is at node ${node} and checks its neighbours smallest first. Click the node it steps into next.`,
        answer: idOf(move.nxt),
        why: `${move.nxt} is the first neighbour of ${node} that is not visited yet, so DFS dives straight in.`,
        hint: 'Skip any neighbour that already has a discovery number.',
      }
    }
    const options = (node + idx) % 2 === 0 ? [GO, BACK] : [BACK, GO]
    if (move.kind === 'descend') {
      return {
        tag: 'backtrack-or-go',
        kind: 'choice',
        prompt: `DFS is at node ${node}. Does it go deeper into a new node, or backtrack?`,
        options,
        answer: GO,
        why: `Node ${node} still has an unvisited neighbour, ${move.nxt}, so DFS goes deeper instead of backing up.`,
        hint: `Look at node ${node}'s neighbours. Is one of them still unvisited?`,
      }
    }
    return {
      tag: 'backtrack-or-go',
      kind: 'choice',
      prompt: `DFS is at node ${node}. Does it go deeper into a new node, or backtrack?`,
      options,
      answer: BACK,
      why: `Every neighbour of ${node} is already visited, so there is nothing new to dive into: DFS returns to its caller.`,
      hint: `Look at node ${node}'s neighbours. Is any of them still unvisited?`,
    }
  }

  // --- the algorithm ---------------------------------------------------------

  emit('init', `Nothing is visited yet. Start at node ${start} and keep diving into the next unvisited neighbour.`)

  function dfs(node: number): void {
    visited[node] = true
    order.push(node)
    path.push(node)
    cur = node
    nb = null
    incoming = null
    emit(
      'visit',
      `Visit ${node}: discovery number ${order.length}. The path from the start is ${path.join(' → ')}.`,
      [],
      predictAfter('visit', node, 0),
    )

    for (let idx = 0; idx < adj[node].length && !rec.capped; idx++) {
      const nxt = adj[node][idx]
      nb = nxt
      if (visited[nxt]) {
        const parent = path.length >= 2 ? path[path.length - 2] : null
        const reason =
          nxt === parent
            ? 'came from here'
            : path.includes(nxt)
              ? 'on the stack: a cycle'
              : 'visited earlier'
        if (!edgeRole.has(edgeKey(node, nxt))) edgeRole.set(edgeKey(node, nxt), 'discarded')
        emit(
          'skip',
          `Neighbour ${nxt} of ${node} is already visited: ${reason}. Skip it.`,
          [{ target: `node:${idOf(nxt)}`, text: reason }],
          predictAfter('skip', node, idx + 1),
        )
        continue
      }
      edgeRole.set(edgeKey(node, nxt), 'focus')
      incoming = { value: nxt, direction: 'push' }
      emit('descend', `Neighbour ${nxt} is new. Call dfs(${nxt}) and go deeper.`, [
        { target: `edge:${idOf(Math.min(node, nxt))}-${idOf(Math.max(node, nxt))}`, text: 'go deeper' },
      ])
      dfs(nxt)
      // Back from the call: the edge to the child becomes part of the search tree.
      edgeRole.set(edgeKey(node, nxt), 'visited')
      cur = node
      nb = null
    }

    // The loop is over: no unvisited neighbour left.
    path.pop()
    finished.add(node)
    const caller = path.length > 0 ? path[path.length - 1] : null
    cur = caller
    nb = null
    incoming = { value: node, direction: 'pop' }
    if (caller !== null) edgeRole.set(edgeKey(caller, node), 'visited')
    const resume = caller === null ? undefined : predictAfter('backtrack', caller, adj[caller].indexOf(node) + 1)
    emit(
      'backtrack',
      caller === null
        ? `Node ${node} has no unvisited neighbours left. It is the start, so the search is over.`
        : `Node ${node} has no unvisited neighbours left. Backtrack to ${caller}.`,
      [{ target: `node:${idOf(node)}`, text: 'finished' }],
      resume,
    )
    incoming = null
  }

  dfs(start)

  cur = null
  nb = null
  incoming = null
  const lost: number[] = []
  for (let i = 0; i < n; i++) if (!visited[i]) lost.push(i)
  emit(
    'done',
    lost.length === 0
      ? `Visit order: ${order.join(', ')}. All ${n} nodes were reached.`
      : `Visit order: ${order.join(', ')}. Nodes ${lost.join(', ')} are not connected to ${start}, so DFS never reaches them.`,
  )
  return rec.done(order)
}

/** Independent version: an explicit stack, marking nodes when they are popped. */
function reference({ edges, start }: DfsGraphInput): number[] {
  const neighbours = (v: number): number[] => {
    const out: number[] = []
    for (const [a, b] of edges) {
      if (a === v) out.push(b)
      if (b === v) out.push(a)
    }
    return out.sort((x, y) => y - x) // largest first, so the smallest is popped first
  }
  const seen = new Set<number>()
  const out: number[] = []
  const stack = [start]
  while (stack.length > 0) {
    const v = stack.pop()!
    if (seen.has(v)) continue
    seen.add(v)
    out.push(v)
    for (const w of neighbours(v)) if (!seen.has(w)) stack.push(w)
  }
  return out
}

const tracer: Tracer<DfsGraphInput, number[]> = {
  id: 'bfs-dfs/dfs-graph',
  title: 'DFS on a graph',
  anchors: {
    init: 'Nothing is visited yet',
    visit: 'Mark the node visited and note its discovery order',
    skip: 'Skip neighbours that are already visited',
    descend: 'Go deeper: call dfs on a new neighbour',
    backtrack: 'No new neighbours left: return to the caller',
    done: 'Return the visit order',
  },
  vars: [
    { name: 'node', label: 'current node', role: 'focus' },
    { name: 'depth', label: 'stack depth', role: 'value' },
    { name: 'order', label: 'visit order', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 'edges',
        label: 'Edges',
        kind: 'string',
        placeholder: EXAMPLE,
        help: `Pairs of node numbers (0 to ${LIMITS.max}) like 0-1, up to ${MAX_EDGES} edges. Edges go both ways.`,
      },
      { name: 'start', label: 'Start node', kind: 'int', placeholder: '0', help: 'The node DFS starts from.' },
    ],
    parse: parseInput,
    format: ({ edges, start }) => ({ edges: edges.map(([a, b]) => `${a}-${b}`).join(', '), start: String(start) }),
    presets: [
      {
        label: 'A diamond with a fork',
        value: { n: 6, edges: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5]], start: 0 },
      },
      { label: 'Two islands', value: { n: 6, edges: [[0, 1], [0, 2], [1, 2], [3, 4], [4, 5]], start: 0 } },
      { label: 'A tree: no cycles', value: { n: 7, edges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]], start: 0 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const nodes = randInt(rand, 4, 7)
      const target = randInt(rand, nodes - 1, Math.min(MAX_EDGES, nodes + 2))
      const picked = new Set<string>()
      let guard = 0
      while (picked.size < target && guard++ < 200) {
        const a = randInt(rand, 0, nodes - 1)
        const b = randInt(rand, 0, nodes - 1)
        if (a !== b) picked.add(`${Math.min(a, b)}-${Math.max(a, b)}`)
      }
      const edges = [...picked]
        .map((k) => k.split('-').map(Number) as [number, number])
        .sort((x, y) => x[0] - y[0] || x[1] - y[1])
      const n = Math.max(...edges.map((e) => e[1])) + 1
      return { n, edges, start: randInt(rand, 0, n - 1) }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
