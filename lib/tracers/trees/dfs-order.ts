/**
 * Binary trees — depth-first order, recursively: pre-order, in-order or
 * post-order (LeetCode 144 / 94 / 145).
 *
 * One function, `dfs(node)`, calls itself on the left and right child. The only
 * thing that changes between the three orders is WHERE the node's value is
 * written: before the two calls (pre), between them (in) or after them (post).
 *
 * Frames (one per idea):
 *   init   dfs(root) is called                      -> curr = root
 *   left / right   a child call is made, curr moves down one level
 *   base   a null child: dfs(null) returns at once  -> curr stays on the parent
 *   visit  the node's value is written to the output
 *   back   a call is finished and returns to its parent
 *   done   dfs(root) has returned
 * `curr` is the node whose call is on top of the call stack; the highlighted
 * edges are the whole call stack, root down to curr. The stack depth is
 * spelled out in the narration ("back up to 9, the stack is 1 deep").
 *
 * Scenes: a composite column of the tree and the `out` array, which fills in
 * as nodes are visited. Code: content/code/trees/dfs-order.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import { MAX_FRAMES } from '@/lib/engine/types'
import type {
  ArrayScene,
  Frame,
  InputLimits,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'
import {
  TREE_LIMITS,
  buildObjects,
  buildTree,
  formatLevelValues,
  idOf,
  join,
  parseLevelValues,
  pathEdges,
  randomLevelValues,
  treeScene,
} from './shared'
import type { LevelValues, ObjNode, Tree, TreeSceneExtras } from './shared'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export type DfsOrder = 'pre' | 'in' | 'post'

export interface DfsInput {
  /** Level-order values with `null` for a missing child. */
  values: LevelValues
  order: DfsOrder
}

const LIMITS: InputLimits = TREE_LIMITS

const ORDERS: readonly DfsOrder[] = ['pre', 'in', 'post']

function parseOrder(rawText: string | undefined): ParseResult<DfsOrder> {
  const word = (rawText ?? '').toLowerCase().replace(/[^a-z]/g, '').replace(/order$/, '')
  if (word === 'pre' || word === 'in' || word === 'post') return { ok: true, value: word }
  return { ok: false, field: 'order', error: 'Order must be pre, in or post.' }
}

function parseInput(raw: Record<string, string>): ParseResult<DfsInput> {
  const values = parseLevelValues(raw.values)
  if (!values.ok) return values
  const order = parseOrder(raw.order)
  if (!order.ok) return order
  return { ok: true, value: { values: values.value, order: order.value } }
}

// ---------------------------------------------------------------------------
// Words per order
// ---------------------------------------------------------------------------

const ORDER_TEXT: Record<DfsOrder, { name: string; hint: string; why: (v: number) => string; visitSay: (v: number) => string }> = {
  pre: {
    name: 'Pre-order',
    hint: 'Write first, then go down.',
    why: (v) => `Pre-order writes a node the moment its call starts, so ${v} goes out before anything below it.`,
    visitSay: (v) => `Pre-order: write ${v} now, before going down.`,
  },
  in: {
    name: 'In-order',
    hint: 'Left side first, then the node itself.',
    why: (v) => `In-order writes a node after its left side is finished, so ${v} goes out now.`,
    visitSay: (v) => `In-order: the left side of ${v} is done, so write ${v}.`,
  },
  post: {
    name: 'Post-order',
    hint: 'Both sides first, the node itself last.',
    why: (v) => `Post-order writes a node last, after both sides are finished, so ${v} goes out now.`,
    visitSay: (v) => `Post-order: both sides of ${v} are done, so write ${v} last.`,
  },
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

/** A recorded frame plus the facts the predict pass needs. */
interface Draft {
  frame: Frame
  /** Node the `curr` pointer is on (null = none). */
  curr: number | null
  /** Node written to the output in this frame, if this is a visit frame. */
  visit: number | null
  /** How many values were in the output when this frame was recorded. */
  written: number
}

function run({ values, order }: DfsInput) {
  const rec = createRecorder<number[]>()
  const tree: Tree = buildTree(values)
  const n = tree.nodes.length
  const text = ORDER_TEXT[order]

  const drafts: Draft[] = []
  const stack: number[] = [] // call stack: nodes whose dfs() call is still running
  const out: number[] = [] // node indices, in the order they were written

  const valueOf = (i: number | null): number | null => (i === null ? null : tree.nodes[i].value)
  const outValues = (): number[] => out.map((i) => tree.nodes[i].value)

  const outputScene = (flash: boolean): ArrayScene => {
    const cells: ArrayScene['cells'] = Array.from({ length: n }, (_, i) => (i < out.length ? tree.nodes[out[i]].value : null))
    const scene: ArrayScene = { kind: 'array', label: 'out', cells }
    if (flash && out.length > 0) scene.marks = [{ index: out.length - 1, role: 'changed' }]
    return scene
  }

  const emit = (
    at: string,
    say: string,
    opts: { curr: number | null; visit?: number; notes?: TreeSceneExtras['notes']; allFound?: boolean },
  ): void => {
    if (drafts.length >= MAX_FRAMES) return
    const visited = new Set(out)
    const marks: NonNullable<TreeSceneExtras['marks']> = []
    for (const node of tree.nodes.keys()) {
      if (opts.allFound) marks.push({ node, role: 'found' })
      else if (node === opts.curr && opts.visit !== undefined) marks.push({ node, role: 'changed' })
      else if (node === opts.curr) marks.push({ node, role: 'focus' })
      else if (visited.has(node)) marks.push({ node, role: 'visited' })
    }
    const extras: TreeSceneExtras = {
      pointers: [{ name: 'curr', target: opts.curr, role: 'focus' }],
      marks,
      edgeMarks: pathEdges(stack),
      notes: opts.notes,
    }
    const vars: Record<string, Val> = {
      curr: valueOf(opts.curr),
      depth: stack.length,
      stack: stack.length === 0 ? 'empty' : stack.map((i) => tree.nodes[i].value).join(' > '),
      out: outValues(),
    }
    const frame: Frame = {
      scene: {
        kind: 'composite',
        layout: 'column',
        parts: [
          { title: 'Tree', scene: treeScene(tree, extras) },
          { title: 'Output', scene: outputScene(opts.visit !== undefined) },
        ],
      },
      vars,
      say,
      at,
      gauge: { value: out.length, max: n, label: 'Nodes written' },
    }
    drafts.push({ frame, curr: opts.curr, visit: opts.visit ?? null, written: out.length })
  }

  const visit = (node: number): void => {
    out.push(node)
    emit('visit', `${text.visitSay(tree.nodes[node].value)} Output: [${join(outValues())}].`, { curr: node, visit: node })
  }

  /** One call of dfs(node). `via` is the line that made the call. */
  const dfs = (node: number | null, via: 'init' | 'left' | 'right', parent: number | null): void => {
    if (drafts.length >= MAX_FRAMES) return
    if (node === null) {
      // dfs(null): the base case. We are still inside the parent's call.
      const p = valueOf(parent)
      emit('base', `The ${via} child of ${p} is null, so that call returns at once. Still inside ${p}, ${stack.length} deep.`, {
        curr: parent,
        notes: parent === null ? undefined : [{ node: parent, text: `${via} is null` }],
      })
      return
    }

    const v = tree.nodes[node].value
    stack.push(node)
    const deep = `the stack is ${stack.length} deep`
    if (via === 'init') {
      emit('init', `Call dfs on the root, ${v}. The call stack is ${stack.length} deep.`, { curr: node })
    } else {
      emit(via, `Go ${via} from ${valueOf(parent)}: dfs(${v}) is called, so ${deep}.`, { curr: node })
    }

    if (order === 'pre') visit(node)
    dfs(tree.nodes[node].left, 'left', node)
    if (order === 'in') visit(node)
    dfs(tree.nodes[node].right, 'right', node)
    if (order === 'post') visit(node)

    stack.pop()
    if (stack.length === 0) {
      emit('back', `Finished ${v}, the root. The call stack is empty.`, { curr: node })
    } else {
      emit('back', `Finished ${v}, so its call returns. Back up to ${tree.nodes[stack[stack.length - 1]].value}: the stack is ${stack.length} deep.`, { curr: node })
    }
  }

  if (tree.root === null) {
    emit('init', 'Call dfs on the root. It is null: the tree is empty.', { curr: null })
    emit('base', 'The root is null, so dfs returns at once and nothing is written.', { curr: null })
  } else {
    dfs(tree.root, 'init', null)
  }

  emit('done', `Done. ${text.name} wrote [${join(outValues())}].`, { curr: null, allFound: n > 0 })

  // Predict pass: ask "which node is written next?" only where the very next
  // frame already moves the pointer onto that node (so the reveal is visible),
  // and never when the pointer is already sitting on it (that would be a give-away).
  drafts.forEach((draft, i) => {
    const next = drafts[i + 1]
    if (!next) return
    let answer: number | null = null
    for (let j = i + 1; j < drafts.length; j++) {
      if (drafts[j].visit !== null) {
        answer = drafts[j].visit
        break
      }
    }
    if (answer === null || next.curr !== answer || draft.curr === answer) return
    const so = draft.written === 0 ? 'Nothing is written yet.' : `Output so far: [${join(out.slice(0, draft.written).map((k) => tree.nodes[k].value))}].`
    const predict: PredictCandidate = {
      tag: 'next-visit',
      kind: 'cell',
      prompt: `${text.name}. ${so} Click the node that is written next.`,
      answer: idOf(answer),
      why: text.why(tree.nodes[answer].value),
      hint: text.hint,
    }
    draft.frame.predict = predict
  })

  for (const draft of drafts) rec.frame(draft.frame)
  return rec.done(outValues())
}

/** Independent version: build plain linked objects, then use explicit stacks (no recursion). */
function reference({ values, order }: DfsInput): number[] {
  type N = ObjNode
  const root = buildObjects(values)
  if (root === null) return []

  const result: number[] = []
  if (order === 'pre') {
    const todo: N[] = [root]
    while (todo.length > 0) {
      const node = todo.pop() as N
      result.push(node.v)
      if (node.r) todo.push(node.r)
      if (node.l) todo.push(node.l)
    }
  } else if (order === 'in') {
    const todo: N[] = []
    let node: N | null = root
    while (node !== null || todo.length > 0) {
      while (node !== null) {
        todo.push(node)
        node = node.l
      }
      node = todo.pop() as N
      result.push(node.v)
      node = node.r
    }
  } else {
    // root, right, left reversed is left, right, root
    const todo: N[] = [root]
    while (todo.length > 0) {
      const node = todo.pop() as N
      result.push(node.v)
      if (node.l) todo.push(node.l)
      if (node.r) todo.push(node.r)
    }
    result.reverse()
  }
  return result
}

const tracer: Tracer<DfsInput, number[]> = {
  id: 'trees/dfs-order',
  title: 'Depth-first order',
  anchors: {
    init: 'Call dfs on the root',
    base: 'If the node is null, return',
    visit: 'Visit: write the node to the output',
    left: 'Recurse into the left child',
    right: 'Recurse into the right child',
    back: 'Finish the call and return to the parent',
    done: 'Return the output',
  },
  vars: [
    { name: 'curr', label: 'curr node', role: 'focus' },
    { name: 'depth', label: 'stack depth', role: 'value' },
    { name: 'stack', label: 'call stack', role: 'value' },
    { name: 'out', label: 'output', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 'values',
        label: 'Tree (level by level)',
        kind: 'int-array',
        placeholder: 'e.g. 3, 9, 20, null, null, 15, 7',
        help: `Like LeetCode: up to ${LIMITS.maxN} nodes from ${LIMITS.min} to ${LIMITS.max}, left to right, level by level. Write null for a missing child.`,
      },
      {
        name: 'order',
        label: 'Order',
        kind: 'string',
        placeholder: 'pre',
        help: 'pre, in or post: where the node is written.',
      },
    ],
    parse: parseInput,
    format: ({ values, order }) => ({ values: formatLevelValues(values), order }),
    presets: [
      { label: 'Pre-order: node first', value: { values: [7, 2, 9, 5, 1, null, 4], order: 'pre' } },
      { label: 'In-order: node in the middle', value: { values: [7, 2, 9, 5, 1, null, 4], order: 'in' } },
      { label: 'Post-order: node last', value: { values: [7, 2, 9, 5, 1, null, 4], order: 'post' } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const values = randomLevelValues(rand)
      return { values, order: ORDERS[randInt(rand, 0, ORDERS.length - 1)] }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
