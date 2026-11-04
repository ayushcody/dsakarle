/**
 * Binary search trees — pieces shared by the three tracers (search, insert, delete).
 *
 * Not a tracer itself, and not in the registry: it holds
 *   1. a tiny mutable tree (`BNode`) the tracers run the real algorithm on
 *   2. `treeScene`, which turns that tree into a TreeScene (no layout, only state)
 *   3. `Walk`, the bookkeeping for "the path taken" and "the part ruled out"
 *   4. input parsing and random helpers
 *
 * Node ids are `n0..nk` in the order the values are inserted (n0 is the root of
 * the tree the learner typed). Ids never change: delete copies a value into a
 * node and removes the successor's node, it never renames anything.
 */
import type {
  InputLimits,
  MarkRole,
  PointerRole,
  PredictCandidate,
  TreeScene,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// The tree the tracers run on
// ---------------------------------------------------------------------------

export interface BNode {
  id: string
  value: number
  left: BNode | null
  right: BNode | null
}

export function makeNode(id: string, value: number): BNode {
  return { id, value, left: null, right: null }
}

/** Insert the values one by one, in order. `n{i}` is the node made from values[i]. */
export function buildTree(values: number[]): BNode | null {
  let root: BNode | null = null
  for (let i = 0; i < values.length; i++) {
    const node = makeNode(`n${i}`, values[i])
    if (root === null) {
      root = node
      continue
    }
    let curr: BNode = root
    for (;;) {
      const next: BNode | null = values[i] < curr.value ? curr.left : curr.right
      if (next === null) break
      curr = next
    }
    if (values[i] < curr.value) curr.left = node
    else curr.right = node
  }
  return root
}

/** Every node reachable from `root`, in pre-order (node, left, right). */
export function nodesOf(root: BNode | null): BNode[] {
  const out: BNode[] = []
  const visit = (node: BNode | null): void => {
    if (node === null) return
    out.push(node)
    visit(node.left)
    visit(node.right)
  }
  visit(root)
  return out
}

export function sizeOf(root: BNode | null): number {
  return nodesOf(root).length
}

/** Values left to right (in-order): sorted, if the tree is a BST. */
export function inorderOf(root: BNode | null): number[] {
  const out: number[] = []
  const visit = (node: BNode | null): void => {
    if (node === null) return
    visit(node.left)
    out.push(node.value)
    visit(node.right)
  }
  visit(root)
  return out
}

/** Values in pre-order: it pins down the exact shape of a BST. */
export function preorderOf(root: BNode | null): number[] {
  return nodesOf(root).map((n) => n.value)
}

// ---------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------

export type Pointers = NonNullable<TreeScene['pointers']>
export type EdgeMarks = NonNullable<TreeScene['edgeMarks']>
export type IdMarks = NonNullable<TreeScene['marks']>

export interface SceneParts {
  pointers?: Pointers
  marks?: IdMarks
  edgeMarks?: EdgeMarks
  /** Nodes drawn beside the tree, not linked in. They are drawn without children. */
  floating?: BNode[]
  annotations?: NonNullable<TreeScene['annotations']>
}

export const ptr = (name: string, node: BNode | null, role: PointerRole): Pointers[number] => ({
  name,
  target: node === null ? null : node.id,
  role,
})

export function treeScene(root: BNode | null, parts: SceneParts = {}): TreeScene {
  const floating = parts.floating ?? []
  const asNode = (n: BNode): TreeScene['nodes'][number] => ({
    id: n.id,
    value: n.value,
    children: [n.left === null ? null : n.left.id, n.right === null ? null : n.right.id],
  })
  const scene: TreeScene = {
    kind: 'tree',
    root: root === null ? null : root.id,
    nodes: [
      ...nodesOf(root).map(asNode),
      ...floating.map((n) => ({ id: n.id, value: n.value, children: [null, null] })),
    ],
  }
  if (parts.pointers && parts.pointers.length > 0) scene.pointers = parts.pointers
  if (parts.marks && parts.marks.length > 0) scene.marks = parts.marks
  if (parts.edgeMarks && parts.edgeMarks.length > 0) scene.edgeMarks = parts.edgeMarks
  if (floating.length > 0) scene.floating = floating.map((n) => n.id)
  if (parts.annotations && parts.annotations.length > 0) scene.annotations = parts.annotations
  return scene
}

/**
 * The walk down from the root: which nodes were passed, which edges were taken,
 * and which subtrees each step ruled out ("discarded").
 */
export class Walk {
  private readonly passedIds: string[] = []
  private readonly ruledOut = new Set<string>()
  private readonly edges: Array<{ from: string; to: string }> = []

  /** Leave `from` through its `dir` child; the other child's whole subtree is out. Returns the child. */
  step(from: BNode, dir: 'left' | 'right'): BNode | null {
    this.passedIds.push(from.id)
    const kept = dir === 'left' ? from.left : from.right
    const other = dir === 'left' ? from.right : from.left
    for (const n of nodesOf(other)) this.ruledOut.add(n.id)
    if (kept !== null) this.edges.push({ from: from.id, to: kept.id })
    return kept
  }

  get passed(): readonly string[] {
    return this.passedIds
  }

  /** Marks for one frame: passed nodes visited, ruled-out subtrees discarded, `curr` in its role. */
  marks(curr: BNode | null, role: MarkRole | null): IdMarks {
    const marks: IdMarks = []
    for (const id of this.passedIds) marks.push({ id, role: 'visited' })
    this.ruledOut.forEach((id) => marks.push({ id, role: 'discarded' }))
    if (curr !== null && role !== null) marks.push({ id: curr.id, role })
    return marks
  }

  /** The path so far as edge marks; `focus-last` highlights the edge just taken, `found` lights the whole path. */
  edgeMarks(mode: 'visited' | 'focus-last' | 'found'): EdgeMarks {
    return this.edges.map((e, i) => ({
      from: e.from,
      to: e.to,
      role: mode === 'found' ? 'found' : mode === 'focus-last' && i === this.edges.length - 1 ? 'focus' : 'visited',
    }))
  }
}

// ---------------------------------------------------------------------------
// Predicts shared by search and insert
// ---------------------------------------------------------------------------

export const GO_LEFT = 'Go left'
export const GO_RIGHT = 'Go right'

/** Asked on a compare frame: the reveal is the step frame that follows. `value` is never equal to `nodeValue`. */
export function leftOrRightPredict(value: number, nodeValue: number): PredictCandidate {
  const left = value < nodeValue
  return {
    tag: 'left-or-right',
    kind: 'choice',
    prompt: `${value} ${left ? '<' : '>'} ${nodeValue}. Go left or right?`,
    options: [GO_LEFT, GO_RIGHT],
    answer: left ? GO_LEFT : GO_RIGHT,
    why: left
      ? `Everything right of ${nodeValue} is bigger than ${nodeValue}, so ${value} can only be in the left subtree.`
      : `Everything left of ${nodeValue} is smaller than ${nodeValue}, so ${value} can only be in the right subtree.`,
    hint: 'Smaller goes left, bigger goes right.',
  }
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export const INTEGER = /^[+-]?\d+$/

export const TREE_VALUES = {
  name: 'values',
  label: 'Values, inserted in this order',
  kind: 'int-array' as const,
  placeholder: 'e.g. 8, 3, 10, 1, 6, 14',
}

export function normaliseMinus(text: string): string {
  return text.replace(/[−–]/g, '-')
}

/** Keep echoed user text short so error messages stay friendly. */
function shown(text: string): string {
  return text.length > 14 ? `${text.slice(0, 13)}…` : text
}

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string }

/** Distinct whole numbers inside the limits. The first one becomes the root. */
export function parseValueList(raw: string | undefined, limits: InputLimits): Parsed<number[]> {
  const text = normaliseMinus(raw ?? '')
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
  const tokens = text.split(/[\s,;]+/).filter((t) => t !== '')
  if (tokens.length === 0) return { ok: false, error: 'Type at least one number, like 8, 3, 10, 1, 6, 14.' }
  if (tokens.length > limits.maxN) {
    return { ok: false, error: `Use at most ${limits.maxN} numbers so the tree stays readable.` }
  }
  const values: number[] = []
  for (const token of tokens) {
    if (!INTEGER.test(token)) {
      return { ok: false, error: `"${shown(token)}" isn't a whole number. Use digits separated by commas.` }
    }
    const v = Number(token)
    if (v < limits.min || v > limits.max) {
      return { ok: false, error: `Keep every number between ${limits.min} and ${limits.max}.` }
    }
    if (values.includes(v)) {
      return { ok: false, error: `${v} appears twice. This tree keeps each value once, so use each number only once.` }
    }
    values.push(v)
  }
  return { ok: true, value: values }
}

export function parseWholeNumber(raw: string | undefined, limits: InputLimits, what: string, example: string): Parsed<number> {
  const text = normaliseMinus(raw ?? '').trim()
  if (text === '') return { ok: false, error: `Type the value ${what}, like ${example}.` }
  if (!INTEGER.test(text)) return { ok: false, error: `The value ${what} must be a whole number, not "${shown(text)}".` }
  const v = Number(text)
  if (v < limits.min || v > limits.max) {
    return { ok: false, error: `Keep the value between ${limits.min} and ${limits.max}.` }
  }
  return { ok: true, value: v }
}

// ---------------------------------------------------------------------------
// Random inputs
// ---------------------------------------------------------------------------

/** `count` distinct values in [min, max], deterministic for a given `rand`. */
export function randomDistinct(rand: () => number, count: number, min: number, max: number): number[] {
  const out: number[] = []
  while (out.length < count) {
    const v = min + Math.floor(rand() * (max - min + 1))
    if (!out.includes(v)) out.push(v)
  }
  return out
}

/** The range random values are drawn from: small numbers, with a few negatives. */
export const RANDOM_MIN = -9
export const RANDOM_MAX = 40
