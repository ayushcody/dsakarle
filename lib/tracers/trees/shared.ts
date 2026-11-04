/**
 * Shared helpers for the three binary-tree tracers (dfs-order, level-order,
 * max-depth). Not a tracer itself, so it is not in the registry.
 *
 * Input is a LeetCode-style level-order array: `3, 9, 20, null, null, 15, 7`.
 * Only real nodes get children in the list, and trailing nulls are dropped, so
 * every tree has exactly one canonical array (that is what `format` prints and
 * what presets and `random()` must use).
 *
 * A built `Tree` lists the real nodes in level order. Node ids are `n0, n1, ...`
 * in that order, so id order is also BFS order, and a node's `left` / `right`
 * are indices into `nodes`.
 */
import { randInt } from '../rng'
import type {
  Annotation,
  InputLimits,
  ParseResult,
  PointerRole,
  TreeScene,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

/** Level-order values; `null` marks a missing child. `[]` is the empty tree. */
export type LevelValues = Array<number | null>

export interface TreeInput {
  values: LevelValues
}

/** Limits are on real nodes (not on array length, which also counts nulls). */
export const TREE_LIMITS: InputLimits = { maxN: 9, min: -99, max: 99 }

const INTEGER = /^[+-]?\d+$/
const NULL_WORDS = new Set(['null', 'none', 'nil', '#'])

const EXAMPLE = '3, 9, 20, null, null, 15, 7'

export function parseLevelValues(rawText: string | undefined): ParseResult<LevelValues> {
  const field = 'values'
  const fail = (error: string): ParseResult<LevelValues> => ({ ok: false, field, error })

  const trimmed = (rawText ?? '').replace(/[−–]/g, '-').trim()
  if (/^\[\s*\]$/.test(trimmed)) return { ok: true, value: [] } // LeetCode's empty tree
  const tokens = trimmed
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(/[\s,;]+/)
    .filter((t) => t !== '')

  if (tokens.length === 0) {
    return fail(`Type the tree level by level, like ${EXAMPLE}. Use null for a missing child.`)
  }

  const items: LevelValues = []
  for (const token of tokens) {
    if (NULL_WORDS.has(token.toLowerCase())) {
      items.push(null)
      continue
    }
    if (!INTEGER.test(token)) {
      return fail(`"${token}" isn't a whole number or null. Try something like ${EXAMPLE}.`)
    }
    const v = Number(token)
    if (v < TREE_LIMITS.min || v > TREE_LIMITS.max) {
      return fail(`Keep every value between ${TREE_LIMITS.min} and ${TREE_LIMITS.max}.`)
    }
    items.push(v)
  }

  if (items.length === 1 && items[0] === null) return { ok: true, value: [] } // a lone null: empty tree
  if (items[0] === null) return fail('The first value is the root, so it cannot be null. Type [] for an empty tree.')

  // Attach values level by level, exactly like LeetCode reads the array.
  let nodes = 1
  let pos = 1
  const parents: number[] = [0]
  while (parents.length > 0 && pos < items.length) {
    parents.shift()
    for (let slot = 0; slot < 2 && pos < items.length; slot++, pos++) {
      if (items[pos] === null) continue
      nodes++
      if (nodes > TREE_LIMITS.maxN) {
        return fail(`Use at most ${TREE_LIMITS.maxN} nodes so the picture stays readable.`)
      }
      parents.push(pos)
    }
  }
  if (pos < items.length) {
    return fail(`Value ${pos + 1} has no parent. A null has no children, so don't list any under it.`)
  }

  return { ok: true, value: canonical(items) }
}

/** Drop trailing nulls so one tree has one array. */
function canonical(items: LevelValues): LevelValues {
  const out = items.slice()
  while (out.length > 0 && out[out.length - 1] === null) out.pop()
  return out
}

export function formatLevelValues(values: LevelValues): string {
  return values.length === 0 ? '[]' : values.map((v) => (v === null ? 'null' : String(v))).join(', ')
}

// ---------------------------------------------------------------------------
// Tree
// ---------------------------------------------------------------------------

export interface TreeNodeData {
  id: string
  value: number
  /** Indices into `Tree.nodes`. */
  left: number | null
  right: number | null
}

export interface Tree {
  nodes: TreeNodeData[]
  /** Index of the root in `nodes`, or null for the empty tree. */
  root: number | null
}

export const idOf = (i: number): string => `n${i}`

/** Level-order array -> tree. Assumes `values` is valid (it came through parse or random). */
export function buildTree(values: LevelValues): Tree {
  if (values.length === 0 || values[0] === null) return { nodes: [], root: null }
  const nodes: TreeNodeData[] = [{ id: idOf(0), value: values[0], left: null, right: null }]
  let pos = 1
  for (let parent = 0; parent < nodes.length && pos < values.length; parent++) {
    for (const side of ['left', 'right'] as const) {
      if (pos >= values.length) break
      const v = values[pos++]
      if (v === null) continue
      nodes.push({ id: idOf(nodes.length), value: v, left: null, right: null })
      nodes[parent][side] = nodes.length - 1
    }
  }
  return { nodes, root: 0 }
}

/** Plain linked node, for the tests' and tracers' independent `reference()` implementations. */
export interface ObjNode {
  v: number
  l: ObjNode | null
  r: ObjNode | null
}

/**
 * Level-order array -> linked objects, built the way LeetCode reads the array
 * (a queue of parents), without going through `buildTree`.
 */
export function buildObjects(values: LevelValues): ObjNode | null {
  if (values.length === 0 || values[0] === null) return null
  const root: ObjNode = { v: values[0], l: null, r: null }
  const waiting: ObjNode[] = [root]
  let at = 1
  while (waiting.length > 0 && at < values.length) {
    const parent = waiting.shift() as ObjNode
    const a = values[at++]
    if (a !== null) {
      parent.l = { v: a, l: null, r: null }
      waiting.push(parent.l)
    }
    if (at < values.length) {
      const b = values[at++]
      if (b !== null) {
        parent.r = { v: b, l: null, r: null }
        waiting.push(parent.r)
      }
    }
  }
  return root
}

/** Random tree with 3..9 nodes, values 1..30, as a canonical level-order array. */
export function randomLevelValues(rand: () => number): LevelValues {
  const n = randInt(rand, 3, TREE_LIMITS.maxN)
  const tree: Tree = { nodes: [{ id: idOf(0), value: randInt(rand, 1, 30), left: null, right: null }], root: 0 }
  while (tree.nodes.length < n) {
    const slots: Array<[number, 'left' | 'right']> = []
    tree.nodes.forEach((node, i) => {
      if (node.left === null) slots.push([i, 'left'])
      if (node.right === null) slots.push([i, 'right'])
    })
    const [parent, side] = slots[randInt(rand, 0, slots.length - 1)]
    tree.nodes.push({ id: idOf(tree.nodes.length), value: randInt(rand, 1, 30), left: null, right: null })
    tree.nodes[parent][side] = tree.nodes.length - 1
  }
  return serializeTree(tree)
}

/** Tree -> canonical LeetCode level-order array (nodes may be in any index order). */
export function serializeTree(tree: Tree): LevelValues {
  if (tree.root === null) return []
  const out: LevelValues = []
  const queue: Array<number | null> = [tree.root]
  for (let head = 0; head < queue.length; head++) {
    const at = queue[head]
    if (at === null) {
      out.push(null)
      continue
    }
    out.push(tree.nodes[at].value)
    queue.push(tree.nodes[at].left, tree.nodes[at].right)
  }
  return canonical(out)
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export interface TreeSceneExtras {
  pointers?: Array<{ name: string; target: number | null; role: PointerRole }>
  marks?: Array<{ node: number; role: 'focus' | 'compare' | 'visited' | 'discarded' | 'changed' | 'found' | 'error' }>
  edgeMarks?: Array<{ from: number; to: number; role: 'focus' | 'visited' | 'changed' | 'found' | 'error' }>
  /** Annotations on nodes, by node index. */
  notes?: Array<{ node: number; text: string }>
}

/** Binary-tree scene: children are always `[left, right]`, with null for a missing child. */
export function treeScene(tree: Tree, extras: TreeSceneExtras = {}): TreeScene {
  const ref = (i: number | null): string | null => (i === null ? null : tree.nodes[i].id)
  const scene: TreeScene = {
    kind: 'tree',
    root: ref(tree.root),
    nodes: tree.nodes.map((n) => ({ id: n.id, value: n.value, children: [ref(n.left), ref(n.right)] })),
  }
  if (extras.pointers && extras.pointers.length > 0) {
    scene.pointers = extras.pointers.map((p) => ({ name: p.name, target: ref(p.target), role: p.role }))
  }
  if (extras.marks && extras.marks.length > 0) {
    scene.marks = extras.marks.map((m) => ({ id: tree.nodes[m.node].id, role: m.role }))
  }
  if (extras.edgeMarks && extras.edgeMarks.length > 0) {
    scene.edgeMarks = extras.edgeMarks.map((e) => ({ from: tree.nodes[e.from].id, to: tree.nodes[e.to].id, role: e.role }))
  }
  if (extras.notes && extras.notes.length > 0) {
    scene.annotations = extras.notes.map((a): Annotation => ({ target: `node:${tree.nodes[a.node].id}`, text: a.text }))
  }
  return scene
}

/** Edge marks along a call stack (root first): each node to the one it called. */
export function pathEdges(stack: number[], role: 'focus' | 'visited' | 'found' = 'focus'): NonNullable<TreeSceneExtras['edgeMarks']> {
  const edges: NonNullable<TreeSceneExtras['edgeMarks']> = []
  for (let i = 1; i < stack.length; i++) edges.push({ from: stack[i - 1], to: stack[i], role })
  return edges
}

export const join = (values: ReadonlyArray<number | string>): string => values.join(', ')
