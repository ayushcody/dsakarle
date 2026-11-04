/**
 * Graphs — building an adjacency list, one edge at a time.
 *
 * Every frame shows the SAME graph twice, as a CompositeScene (column): the
 * GraphScene (nodes at fixed positions, all edges drawn) and a HashMapScene used
 * as the adjacency list. Bucket i is node i's list and its entries are that
 * node's neighbours, so the learner sees that "a graph" and "a table of
 * neighbour lists" are one thing. (One ArrayScene per node would be far too
 * many rows; a hash-map scene is exactly "one labelled row of chips per node".)
 *
 * Edges not yet stored are drawn faded and dashed ('discarded'); the edge being
 * read is 'focus'; the edge whose list entry was just added is 'changed'.
 * Degree badges sit under each node and are derived from the lists.
 *
 * Code lives in content/code/graphs/build-adjacency.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import {
  GRAPH_LIMITS,
  MAX_EDGES,
  NODE_COUNT_FIELD,
  formatEdges,
  graphScene,
  parseEdges,
  parseNodeCount,
  randomEdges,
} from './common'
import type { Edge, EdgeRole } from './common'
import type {
  CompositeScene,
  Frame,
  HashMapScene,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface BuildAdjacencyInput {
  n: number
  directed: boolean
  edges: Edge[]
}

export interface BuildAdjacencyResult {
  /** adj[i] = node i's neighbours, in the order they were added. */
  adj: number[][]
}

function parseInput(raw: Record<string, string>): ParseResult<BuildAdjacencyInput> {
  const n = parseNodeCount(raw.n)
  if (!n.ok) return n
  const kind = (raw.directed ?? '').trim().toLowerCase()
  if (kind !== 'directed' && kind !== 'undirected') {
    return { ok: false, field: 'directed', error: 'Type "undirected" (roads go both ways) or "directed" (one-way roads).' }
  }
  const directed = kind === 'directed'
  const edges = parseEdges(raw.edges, n.value, directed)
  if (!edges.ok) return edges
  return { ok: true, value: { n: n.value, directed, edges: edges.value } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const list = (xs: number[]): string => `[${xs.join(', ')}]`
const arrow = (a: number, b: number, directed: boolean): string => `${a}${directed ? '→' : '-'}${b}`

const BOTH_YES = 'Also add it to the other list'
const BOTH_NO = 'Nothing more: one entry is enough'
const ONE_WAY_NO = 'No, only the first list changes'
const ONE_WAY_YES = 'Yes, add it to the other list too'

/** Rotate options by `shift` so the right answer is not always in the same place. */
function rotate<T>(xs: T[], shift: number): T[] {
  const k = shift % xs.length
  return [...xs.slice(k), ...xs.slice(0, k)]
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ n, directed, edges }: BuildAdjacencyInput) {
  const rec = createRecorder<BuildAdjacencyResult>()
  const adj: number[][] = Array.from({ length: n }, () => [])
  const total = edges.length

  // Per-edge state: 0 = not read yet, 1 = stored.
  const stored: boolean[] = edges.map(() => false)
  let current = -1 // index of the edge being read
  let focusEdge: EdgeRole | undefined
  let entries = 0

  const inDegree = (v: number): number => adj.reduce((sum, row) => sum + row.filter((x) => x === v).length, 0)
  const badge = (i: number): string =>
    directed ? `in ${inDegree(i)} out ${adj[i].length}` : `deg ${adj[i].length}`

  const emit = (
    at: string,
    say: string,
    extra: {
      nodes?: number[]
      nodeRole?: 'focus' | 'changed'
      bucket?: { index: number }
      predict?: PredictCandidate
    } = {},
  ): void => {
    const edgeRoles: Array<EdgeRole | undefined> = edges.map((_, i) => {
      if (i === current) return focusEdge
      return stored[i] ? undefined : 'discarded'
    })
    const graph = graphScene({
      n,
      directed,
      edges,
      edgeRoles,
      marks: (extra.nodes ?? []).map((node) => ({ node, role: extra.nodeRole ?? 'focus' })),
      badges: Array.from({ length: n }, (_, i) => badge(i)),
    })
    const lists: HashMapScene = {
      kind: 'hash-map',
      buckets: adj.map((row) => row.map((v) => ({ key: v }))),
    }
    if (extra.bucket) {
      const row = adj[extra.bucket.index]
      lists.marks = [{ bucket: extra.bucket.index, slot: row.length - 1, role: 'changed' }]
    }
    const scene: CompositeScene = {
      kind: 'composite',
      layout: 'column',
      parts: [
        { title: directed ? 'The graph (arrows are one-way)' : 'The graph', scene: graph },
        { title: 'Adjacency list: row i holds the neighbours of node i', scene: lists },
      ],
    }
    const vars: Record<string, Val> = {
      edge: current >= 0 ? arrow(edges[current][0], edges[current][1], directed) : null,
      stored: stored.filter(Boolean).length,
      entries,
    }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: stored.filter(Boolean).length, max: total, label: 'Edges stored' },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  emit(
    'init',
    `${n} nodes and ${total} ${total === 1 ? 'edge' : 'edges'} to store. Every node starts with an empty list of neighbours.`,
  )

  for (let e = 0; e < total && !rec.capped; e++) {
    const [u, v] = edges[e]
    current = e
    focusEdge = 'focus'

    // A question about this edge rides on the frame before the list changes.
    const before = adj[u].slice()
    const after = [...before, v]
    const options = [list(after), list(before)]
    if (adj[v].length > 0 && !options.includes(list(adj[v]))) options.push(list(adj[v]))
    const neighbours: PredictCandidate = {
      tag: 'neighbours',
      kind: 'choice',
      prompt: `Edge ${arrow(u, v, directed)} is next. After it is added, who are node ${u}'s neighbours?`,
      options: rotate(options, e),
      answer: list(after),
      why: `${v} is added to node ${u}'s list, after ${before.length === 0 ? 'nothing yet' : list(before)}. The list is ${list(after)}.`,
      hint: `Start from what node ${u}'s list holds now and add the node at the other end of the edge.`,
    }

    emit(
      'read',
      directed
        ? `Next edge: ${u}→${v}. It is one-way: you can go from ${u} to ${v}, not back.`
        : `Next edge: ${u}-${v}. It works in both directions: from ${u} you reach ${v}, and from ${v} you reach ${u}.`,
      { nodes: [u, v], predict: neighbours },
    )
    if (rec.capped) break

    adj[u].push(v)
    entries++
    focusEdge = 'changed'
    const mirrorQuestion: PredictCandidate = directed
      ? {
          tag: 'both-ways',
          kind: 'choice',
          prompt: `${v} was just added to node ${u}'s list. The edge ${u}→${v} is one-way. Does node ${v}'s list change?`,
          options: rotate([ONE_WAY_NO, ONE_WAY_YES], e + 1),
          answer: ONE_WAY_NO,
          why: `A one-way edge is stored once, in the list of the node it leaves. Node ${v}'s list stays as it is.`,
          hint: 'Can you walk back along a one-way road?',
        }
      : {
          tag: 'both-ways',
          kind: 'choice',
          prompt: `${v} is now in node ${u}'s list. The edge ${u}-${v} is undirected. What else must be stored?`,
          options: rotate([BOTH_YES, BOTH_NO], e + 1),
          answer: BOTH_YES,
          why: `An undirected edge works both ways, so ${u} must also appear in node ${v}'s list. Otherwise ${v} could not find ${u}.`,
          hint: 'Could you walk from the other end of the edge?',
        }
    emit(
      'forward',
      `Add ${v} to node ${u}'s list. From ${u} you can now reach ${v}; its list is ${list(adj[u])}.`,
      { nodes: [u], nodeRole: 'changed', bucket: { index: u }, predict: mirrorQuestion },
    )
    if (rec.capped) break

    if (!directed) {
      adj[v].push(u)
      entries++
      emit(
        'back',
        `Undirected, so also add ${u} to node ${v}'s list. Now ${v} can find ${u} too; its list is ${list(adj[v])}.`,
        { nodes: [v], nodeRole: 'changed', bucket: { index: v } },
      )
    }
    stored[e] = true
    current = -1
    focusEdge = undefined
  }

  const kindText = directed
    ? `A one-way edge is stored once, at the node it leaves.`
    : `Each undirected edge is stored twice, once from each end.`
  emit(
    'done',
    `All ${total} ${total === 1 ? 'edge' : 'edges'} stored as ${entries} list ${entries === 1 ? 'entry' : 'entries'}. ${kindText}`,
  )

  return rec.done({ adj: adj.map((row) => row.slice()) })
}

/** Independent version: for each node, scan the whole edge list and collect what touches it. */
function reference({ n, directed, edges }: BuildAdjacencyInput): BuildAdjacencyResult {
  const adj: number[][] = []
  for (let node = 0; node < n; node++) {
    const row: number[] = []
    for (const [a, b] of edges) {
      if (a === node) row.push(b)
      else if (!directed && b === node) row.push(a)
    }
    adj.push(row)
  }
  return { adj }
}

const tracer: Tracer<BuildAdjacencyInput, BuildAdjacencyResult> = {
  id: 'graphs/build-adjacency',
  title: 'Build an adjacency list',
  anchors: {
    init: 'Give every node an empty list of neighbours',
    read: 'Take the next edge u-v',
    forward: 'Add v to the list of u',
    back: 'Undirected: also add u to the list of v',
    done: 'Return the lists',
  },
  vars: [
    { name: 'edge', label: 'edge being stored', role: 'focus' },
    { name: 'stored', label: 'edges stored', role: 'value' },
    { name: 'entries', label: 'list entries', role: 'best' },
  ],
  input: {
    fields: [
      NODE_COUNT_FIELD,
      {
        name: 'edges',
        label: 'Edges',
        kind: 'string',
        placeholder: 'e.g. 0-1, 0-2, 1-3',
        help: `Up to ${MAX_EDGES} edges separated by commas. Each joins two node numbers, like 1-3.`,
      },
      {
        name: 'directed',
        label: 'Kind of graph',
        kind: 'string',
        placeholder: 'undirected or directed',
        help: 'Undirected: every edge works both ways. Directed: every edge is a one-way arrow from the first node to the second.',
      },
    ],
    parse: parseInput,
    format: ({ n, directed, edges }) => ({
      n: String(n),
      edges: formatEdges(edges, directed),
      directed: directed ? 'directed' : 'undirected',
    }),
    presets: [
      { label: 'Undirected: a diamond with a tail', value: { n: 5, directed: false, edges: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4]] } },
      { label: 'Directed: one-way roads', value: { n: 4, directed: true, edges: [[0, 1], [1, 2], [2, 0], [2, 3]] } },
      { label: 'A hub with five neighbours', value: { n: 6, directed: false, edges: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]] } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const n = randInt(rand, 3, 7)
      const directed = rand() < 0.4
      const count = randInt(rand, Math.max(2, n - 2), Math.min(MAX_EDGES, n + 2))
      return { n, directed, edges: randomEdges(rand, n, directed, count) }
    },
    limits: GRAPH_LIMITS,
  },
  run,
  reference,
}

export default tracer
