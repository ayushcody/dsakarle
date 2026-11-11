/**
 * Shared helpers for the heaps tracers (push, pop, kth-largest).
 *
 * The heap is a MIN-heap stored as an array: the parent of index i is
 * floor((i - 1) / 2) and its children are 2i + 1 and 2i + 2. Every frame shows
 * the SAME heap twice, as a CompositeScene (column): a TreeScene (complete
 * binary tree, node id `h<i>` = array index i) and an ArrayScene ("as an
 * array"), so the learner sees that they are one thing.
 *
 * Swaps are drawn as an `edgeMarks` 'changed' on the parent -> child edge plus
 * 'changed' marks on both nodes and both array cells.
 */
import type {
  ArrayScene,
  CompositeScene,
  InputLimits,
  MarkRole,
  ParseResult,
  PointerRole,
  TreeScene,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input parsing
// ---------------------------------------------------------------------------

/** At most 9 numbers keeps the tree to 4 levels. Values -99..99. */
export const HEAP_LIMITS: InputLimits = { maxN: 9, min: -99, max: 99 }

export const INTEGER = /^[+-]?\d+$/

/** Typographic minus signs and wrapping brackets are forgiven. */
function clean(text: string | undefined): string {
  return (text ?? '').replace(/[−–]/g, '-')
}

export function parseIntList(
  raw: string | undefined,
  field: string,
  limits: InputLimits,
  example: string,
): ParseResult<number[]> {
  const text = clean(raw).replace(/^\s*\[/, '').replace(/\]\s*$/, '')
  const tokens = text.split(/[\s,;]+/).filter((t) => t !== '')
  if (tokens.length === 0) {
    return { ok: false, field, error: `Type at least one number, like ${example}.` }
  }
  if (tokens.length > limits.maxN) {
    return { ok: false, field, error: `Use at most ${limits.maxN} numbers so the picture stays readable.` }
  }
  const nums: number[] = []
  for (const token of tokens) {
    if (!INTEGER.test(token)) {
      return { ok: false, field, error: `"${token}" isn't a whole number. Use digits separated by commas.` }
    }
    const value = Number(token)
    if (value < limits.min || value > limits.max) {
      return { ok: false, field, error: `Keep every number between ${limits.min} and ${limits.max}.` }
    }
    nums.push(value)
  }
  return { ok: true, value: nums }
}

/** A whole number field, or a friendly error. Range checks are left to the caller. */
export function parseWhole(raw: string | undefined, field: string, label: string, example: string): ParseResult<number> {
  const text = clean(raw).trim()
  if (text === '') return { ok: false, field, error: `Type ${label}, like ${example}.` }
  if (!INTEGER.test(text)) return { ok: false, field, error: `${label[0].toUpperCase()}${label.slice(1)} must be a whole number, not "${text}".` }
  return { ok: true, value: Number(text) }
}

// ---------------------------------------------------------------------------
// Heap operations without recording (used for silent set-up and by kth-largest)
// ---------------------------------------------------------------------------

/** Min-heap push on an array of anything with a numeric key. Returns the final index. */
export function siftUp<T>(heap: T[], key: (item: T) => number): number {
  let i = heap.length - 1
  while (i > 0) {
    const parent = (i - 1) >> 1
    if (key(heap[parent]) <= key(heap[i])) break
    ;[heap[parent], heap[i]] = [heap[i], heap[parent]]
    i = parent
  }
  return i
}

/** Which child of i the sift-down compares with, or -1 when i is a leaf. Left wins ties. */
export function smallerChild<T>(heap: T[], i: number, key: (item: T) => number): number {
  const left = 2 * i + 1
  if (left >= heap.length) return -1
  const right = left + 1
  return right < heap.length && key(heap[right]) < key(heap[left]) ? right : left
}

/** Sinks heap[i] until the heap property holds. Returns the final index. */
export function siftDown<T>(heap: T[], i: number, key: (item: T) => number): number {
  for (;;) {
    const child = smallerChild(heap, i, key)
    if (child < 0 || key(heap[child]) >= key(heap[i])) return i
    ;[heap[i], heap[child]] = [heap[child], heap[i]]
    i = child
  }
}

/** Builds a min-heap by pushing values one at a time, exactly like the push tracer. */
export function buildByPushing(values: number[]): number[] {
  const heap: number[] = []
  for (const v of values) {
    heap.push(v)
    siftUp(heap, (x) => x)
  }
  return heap
}

// ---------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------

export type EdgeRole = 'focus' | 'visited' | 'changed' | 'found' | 'error'

export interface HeapView {
  heap: ReadonlyArray<number>
  /** Index -> role, applied to the tree node and the array cell. */
  marks?: Array<{ index: number; role: MarkRole }>
  /** Parent index -> child index edges to highlight. */
  edges?: Array<{ parent: number; child: number; role: EdgeRole }>
  /** Named pointers (`i`), drawn on both views. */
  pointers?: Array<{ name: string; index: number; role: PointerRole }>
  /** Short notes drawn next to tree nodes. */
  notes?: Array<{ index: number; text: string }>
  /** Total array slots to draw (faded after the last cell). */
  capacity?: number
}

export const nodeId = (index: number): string => `h${index}`

export function treeScene(view: HeapView): TreeScene {
  const n = view.heap.length
  const child = (i: number): string | null => (i < n ? nodeId(i) : null)
  const scene: TreeScene = {
    kind: 'tree',
    root: n > 0 ? nodeId(0) : null,
    nodes: view.heap.map((value, i) => ({
      id: nodeId(i),
      value,
      children: [child(2 * i + 1), child(2 * i + 2)],
    })),
  }
  const marks = (view.marks ?? []).filter((m) => m.index >= 0 && m.index < n).map((m) => ({ id: nodeId(m.index), role: m.role }))
  if (marks.length) scene.marks = marks
  const edges = (view.edges ?? [])
    .filter((e) => e.parent >= 0 && e.child < n && e.child > e.parent)
    .map((e) => ({ from: nodeId(e.parent), to: nodeId(e.child), role: e.role }))
  if (edges.length) scene.edgeMarks = edges
  const pointers = (view.pointers ?? []).filter((p) => p.index >= 0 && p.index < n)
  if (pointers.length) scene.pointers = pointers.map((p) => ({ name: p.name, target: nodeId(p.index), role: p.role }))
  const notes = (view.notes ?? []).filter((a) => a.index >= 0 && a.index < n)
  if (notes.length) scene.annotations = notes.map((a) => ({ target: `node:${nodeId(a.index)}`, text: a.text }))
  return scene
}

export function arrayScene(view: HeapView, label = 'heap'): ArrayScene {
  const n = view.heap.length
  const scene: ArrayScene = { kind: 'array', label, cells: view.heap.slice() }
  const marks = (view.marks ?? []).filter((m) => m.index >= 0 && m.index < n)
  if (marks.length) scene.marks = marks.map((m) => ({ index: m.index, role: m.role }))
  const pointers = (view.pointers ?? []).filter((p) => p.index >= 0 && p.index < n)
  if (pointers.length) scene.pointers = pointers
  if (view.capacity && view.capacity > n) scene.capacity = view.capacity
  return scene
}

export const TREE_TITLE = 'Min-heap as a tree'
export const ARRAY_TITLE = 'The same heap as an array: children of i are 2i+1 and 2i+2'

/** The heap twice, tree on top and array below. Extra parts (e.g. an input stream) go first. */
export function heapScene(view: HeapView, before: CompositeScene['parts'] = []): CompositeScene {
  return {
    kind: 'composite',
    layout: 'column',
    parts: [
      ...before,
      { title: TREE_TITLE, scene: treeScene(view) },
      { title: ARRAY_TITLE, scene: arrayScene(view) },
    ],
  }
}

/** "4, 7, 9" or "nothing". */
export function listOf(values: ReadonlyArray<number>): string {
  return values.length === 0 ? 'nothing' : values.join(', ')
}
