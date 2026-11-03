/**
 * Lesson engine contract.
 *
 * A tracer runs a real algorithm on an input and records frames. Each frame is
 * one moment the learner can see: a scene (what the data looks like), the
 * variables, a sentence of narration, and the rule (anchor) being executed.
 *
 * The same tracer powers the guided walkthrough, the learner's own-input
 * playground, predict-then-reveal prompts and per-language code highlighting.
 * See docs/CONTENT_GUIDE.md for authoring rules.
 */

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

/** `<topic-slug>/<algorithm>`, e.g. `sliding-window/max-sum-k`. Also the code file path. */
export type TracerId = `${string}/${string}`

/** A rule in the algorithm, e.g. `expand`. Marked in code files as a trailing `# @expand` / `// @expand`. */
export type AnchorId = string

/** Languages every lesson ships, line-synced to the walkthrough. */
export type Lang = 'python' | 'java' | 'cpp'
export const LANGS: readonly Lang[] = ['python', 'java', 'cpp'] as const

/** Plain, JSON-serialisable values only. */
export type Val = number | string | boolean | null | Val[]

// ---------------------------------------------------------------------------
// Semantic roles — the single colour language (see lib/stage/semantics.ts)
// ---------------------------------------------------------------------------

/** Roles a pointer can play. A = left/slow/lo/prev, B = right/fast/hi/curr. */
export type PointerRole = 'ptrA' | 'ptrB' | 'focus'

/** Roles a cell, node or entry can be marked with. Several may apply at once. */
export type MarkRole =
  | 'focus'      // the thing being processed right now
  | 'compare'    // being compared against something
  | 'visited'    // already processed
  | 'discarded'  // out of play (e.g. eliminated half in binary search)
  | 'changed'    // value just changed (flashes once)
  | 'found'      // answer / success
  | 'error'      // violation / failure

/** Role of a variable in the variables panel; pointer roles share pointer colours. */
export type VarRole = PointerRole | 'value' | 'best'

// ---------------------------------------------------------------------------
// Scenes — what the data looks like in one frame. Tracers never compute layout.
// ---------------------------------------------------------------------------

export interface Annotation {
  /** What the note points at: `cell:3`, `node:n2`, `bucket:1`, `ptr:left`, `window`. */
  target: string
  text: string
}

export interface ArrayPointer {
  name: string            // label drawn on the tag, e.g. `left`, `mid`
  index: number           // may be -1 or cells.length to show "off the end"
  role: PointerRole
}

export interface ArrayScene {
  kind: 'array'
  label?: string                          // variable name, e.g. `nums`
  cells: Array<number | string | null>    // null = empty slot (e.g. after a shift)
  pointers?: ArrayPointer[]
  /** Inclusive range drawn as a bracket + tint. null/absent = no window. */
  window?: { start: number; end: number } | null
  marks?: Array<{ index: number; role: MarkRole }>
  /** Show the address row (`base + i × size`) under the cells — arrays lesson. */
  addresses?: { base: number; size: number }
  /** Extra slots drawn faded after the last cell, to show capacity. */
  capacity?: number
  annotations?: Annotation[]
}

export interface ListNode {
  id: string
  value: number | string
}

export interface LinkedListScene {
  kind: 'linked-list'
  /** Nodes in display order, left to right. */
  nodes: ListNode[]
  /** `next` links. to = null draws a link to a `null` terminator. */
  links: Array<{ from: string; to: string | null; role?: 'focus' | 'changed' | 'error' }>
  /** Node ids drawn below the main row (e.g. a new node before it is linked in). */
  floating?: string[]
  pointers?: Array<{ name: string; target: string | null; role: PointerRole }>
  marks?: Array<{ id: string; role: MarkRole }>
  annotations?: Annotation[]
}

export interface HashEntry {
  key: number | string
  value?: number | string
}

export interface HashMapScene {
  kind: 'hash-map'
  /** One array of chained entries per bucket. */
  buckets: HashEntry[][]
  /** The key currently being hashed, shown as `key → hash(key) % m = bucket`. */
  hashing?: { key: number | string; hash: number; bucket: number } | null
  marks?: Array<{ bucket: number; slot?: number; role: MarkRole }>
  annotations?: Annotation[]
}

export interface CompositeScene {
  kind: 'composite'
  layout: 'row' | 'column'
  parts: Array<{ title?: string; scene: Exclude<Scene, CompositeScene> }>
}

/**
 * A vertical stack, bottom item first. Queues and deques use ArrayScene with
 * `front` / `back` pointers instead.
 */
export interface StackScene {
  kind: 'stack'
  label?: string
  /** Bottom → top. */
  items: Array<number | string>
  /** Extra empty slots drawn above the top, to show capacity. */
  capacity?: number
  /** Item index → role. The top item is items.length - 1. */
  marks?: Array<{ index: number; role: MarkRole }>
  /** An item being pushed or just popped, drawn beside the stack. */
  incoming?: { value: number | string; direction: 'push' | 'pop' } | null
  annotations?: Annotation[]
}

export interface TreeNode {
  id: string
  value: number | string
  /**
   * Child ids in order. Binary trees always use [left, right] with null for a
   * missing child so left/right placement is stable. Tries use any number.
   */
  children: Array<string | null>
  /** Labels on the edge to each child (tries: the character). Same length as children. */
  edgeLabels?: Array<string | null>
  /** Trie end-of-word marker, drawn as a double ring. */
  terminal?: boolean
}

export interface TreeScene {
  kind: 'tree'
  /** Root id, or null for an empty tree. */
  root: string | null
  nodes: TreeNode[]
  pointers?: Array<{ name: string; target: string | null; role: PointerRole }>
  marks?: Array<{ id: string; role: MarkRole }>
  /** Highlight the edge parent → child (e.g. the path taken, or a swap in a heap). */
  edgeMarks?: Array<{ from: string; to: string; role: 'focus' | 'visited' | 'changed' | 'found' | 'error' }>
  /** Node not yet attached (e.g. BST insert before linking), drawn beside the tree. */
  floating?: string[]
  annotations?: Annotation[]
}

export interface GraphNode {
  id: string
  label: string
  /**
   * Placement on a small logical grid (col 0..5, row 0..3). Tracers give
   * positions so graphs look the same every frame; the layout scales them.
   */
  at: { col: number; row: number }
}

export interface GraphScene {
  kind: 'graph'
  directed: boolean
  nodes: GraphNode[]
  edges: Array<{ from: string; to: string; weight?: number; role?: 'focus' | 'visited' | 'changed' | 'found' | 'error' | 'discarded' }>
  marks?: Array<{ id: string; role: MarkRole }>
  pointers?: Array<{ name: string; target: string | null; role: PointerRole }>
  /** Small badge under a node, e.g. BFS distance or DFS discovery order. */
  badges?: Array<{ id: string; text: string }>
  annotations?: Annotation[]
}

export interface GridScene {
  kind: 'grid'
  label?: string
  /** rows[r][c]; null = empty cell. Keep ≤ 8 × 8. */
  rows: Array<Array<number | string | null>>
  rowLabels?: string[]
  colLabels?: string[]
  marks?: Array<{ r: number; c: number; role: MarkRole }>
  pointers?: Array<{ name: string; r: number; c: number; role: PointerRole }>
  /** Dependency arrows, e.g. dp[i][j] ← dp[i-1][j]. */
  arrows?: Array<{ from: [number, number]; to: [number, number] }>
  annotations?: Annotation[]
}

export interface CallFrameNode {
  id: string
  /** e.g. `fib(3)` or `subsets([1], i=1)`. */
  label: string
  parent: string | null
  status: 'pending' | 'active' | 'returned' | 'pruned'
  /** Shown once returned, e.g. `= 2` or `✓ [1,2]`. */
  result?: string
}

export interface CallTreeScene {
  kind: 'call-tree'
  /** Every call made so far, in call order. */
  calls: CallFrameNode[]
  /** The live call stack, bottom → top, as call ids. */
  stack: string[]
  marks?: Array<{ id: string; role: MarkRole }>
  annotations?: Annotation[]
}

/** Scene union (Opus owns this file; agents must not edit it). */
export type Scene =
  | ArrayScene
  | LinkedListScene
  | HashMapScene
  | StackScene
  | TreeScene
  | GraphScene
  | GridScene
  | CallTreeScene
  | CompositeScene
export type SceneKind = Scene['kind']

// ---------------------------------------------------------------------------
// Frames
// ---------------------------------------------------------------------------

/**
 * A predict-then-reveal candidate. It is attached to frame i and asks what
 * happens on the way to frame i + 1; the reveal is frame i + 1.
 */
export interface PredictCandidate {
  /** Groups candidates so lessons can choose which kinds to ask, e.g. `expand-or-shrink`. */
  tag: string
  prompt: string
  /**
   * `choice`: learner picks one of `options` (answer = the option string).
   * `cell`:   learner clicks a cell index / node id / bucket index in the scene (answer = that index or id).
   */
  kind: 'choice' | 'cell'
  options?: string[]
  answer: string | number
  /** One sentence shown on reveal explaining why. */
  why: string
  /** Shown after a wrong first try, before the reveal. */
  hint?: string
}

export interface Gauge {
  value: number
  max: number
  label: string
}

export interface Frame {
  scene: Scene
  /** Variable values at this moment, keyed by VarSpec.name. */
  vars: Record<string, Val>
  /** One plain-English sentence, ≤ 140 chars, present tense: "Add 5 to the window." */
  say: string
  /** The rule being executed — must be a key of Tracer.anchors and appear in every language's code. */
  at: AnchorId
  gauge?: Gauge
  predict?: PredictCandidate
}

export interface TraceResult<R> {
  frames: Frame[]
  result: R
}

// ---------------------------------------------------------------------------
// Inputs (guided presets + learner playground)
// ---------------------------------------------------------------------------

export type InputKind = 'int-array' | 'int' | 'string' | 'string-array'

export interface InputField {
  name: string
  label: string
  kind: InputKind
  placeholder?: string
  help?: string
}

export interface InputLimits {
  /** Max array / string length. Scenes are designed for ≤ 12 cells. */
  maxN: number
  /** Inclusive value range for numbers. */
  min: number
  max: number
}

export type ParseResult<I> = { ok: true; value: I } | { ok: false; error: string; field?: string }

export interface TracerInput<I> {
  fields: InputField[]
  /** Raw text from the playground form → validated input. Must enforce `limits`. */
  parse(raw: Record<string, string>): ParseResult<I>
  /** Input → text for the form (used to prefill from presets). */
  format(input: I): Record<string, string>
  /** Guided runs pick one of these by index; the first is the default. */
  presets: Array<{ label: string; value: I }>
  /** Deterministic random input for the "Random" button and tests. */
  random(seed: number): I
  limits: InputLimits
}

export interface VarSpec {
  name: string
  /** Display label; defaults to name. */
  label?: string
  role: VarRole
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

/** Hard cap on frames per run (keeps playground inputs bounded). */
export const MAX_FRAMES = 400

export interface Tracer<I = unknown, R = unknown> {
  id: TracerId
  /** Short name shown on the track picker, e.g. "Fixed-size window". */
  title: string
  /**
   * Rules of the algorithm in Rule Rail order: anchor → plain-English label,
   * e.g. `{ init: 'Start with an empty window', expand: 'Add nums[right]', ... }`.
   */
  anchors: Record<AnchorId, string>
  vars: VarSpec[]
  input: TracerInput<I>
  /** Pure and deterministic. Must stop at MAX_FRAMES. */
  run(input: I): TraceResult<R>
  /** Independent straightforward implementation; tests assert run().result equals this. */
  reference(input: I): R
}

/** Erased tracer type for registries and UI. */
export type AnyTracer = Tracer<any, any> // eslint-disable-line @typescript-eslint/no-explicit-any

// ---------------------------------------------------------------------------
// Code (canonical files under content/code/<tracer-id>.{py,java,cpp})
// ---------------------------------------------------------------------------

/** `<topic-slug>/<name>`; resolves to content/code/<topic-slug>/<name>.{py,java,cpp}. Usually equals a TracerId. */
export type CodeRef = `${string}/${string}`

export const CODE_EXT: Record<Lang, string> = { python: 'py', java: 'java', cpp: 'cpp' }

export interface ParsedCode {
  /** Source with anchor markers stripped. */
  source: string
  /** Anchor → 1-based line numbers in `source`. An anchor may mark several lines. */
  anchors: Record<AnchorId, number[]>
}
