/**
 * Binary trees — level-order traversal with a queue (LeetCode 102).
 *
 * The queue holds the nodes waiting for their turn. Each lap of the outer loop
 * handles exactly one level: `size` is the queue length when the level starts,
 * so exactly that many nodes come off before the next level begins. A node's
 * children join the back of the queue, so they are served after everyone on
 * the current level.
 *
 * Frames:
 *   init    the root (if any) goes into the queue; an empty tree gives an empty queue
 *   level   size = len(queue): the level is frozen            (queue window)
 *   pop     the front node comes off the queue                (predict: who is next?)
 *   visit   its value is written into the current level
 *   push    its children join the back of the queue           (skipped for a leaf)
 *   group   the finished level is added to the result
 *   check   the queue is empty, so the loop stops (shown once, like the golden tracers)
 *   done    the grouped result is returned
 *
 * Scene: a composite column of the tree, the `queue` array (front and back
 * pointers; the level being served is its window) and the `output` array,
 * annotated "level 1", "level 2", ... Code: content/code/trees/level-order.{py,java,cpp}.
 */
import { mulberry32 } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import { MAX_FRAMES } from '@/lib/engine/types'
import type {
  Annotation,
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
  randomLevelValues,
  treeScene,
} from './shared'
import type { LevelValues, ObjNode, TreeSceneExtras } from './shared'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface LevelOrderInput {
  /** Level-order values with `null` for a missing child. */
  values: LevelValues
}

const LIMITS: InputLimits = TREE_LIMITS

function parseInput(raw: Record<string, string>): ParseResult<LevelOrderInput> {
  const values = parseLevelValues(raw.values)
  return values.ok ? { ok: true, value: { values: values.value } } : values
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

/** A recorded frame plus the facts the predict pass needs. */
interface Draft {
  frame: Frame
  /** Node taken off the queue in this frame (pop frames only). */
  popped: number | null
  /** The queue (node indices, front first) when this frame was recorded. */
  queue: number[]
}

const nested = (levels: number[][]): string => `[${levels.map((l) => `[${join(l)}]`).join(', ')}]`

function run({ values }: LevelOrderInput) {
  const rec = createRecorder<number[][]>()
  const tree = buildTree(values)
  const n = tree.nodes.length

  const drafts: Draft[] = []
  const queue: number[] = [] // node indices, front first
  const written: number[] = [] // node indices in the output, in order
  const levelStarts: number[] = [] // output index where each level begins
  const result: number[][] = []
  const valueOf = (i: number | null): number | null => (i === null ? null : tree.nodes[i].value)

  // Per-frame working state (mirrors the variables in the code files)
  let curr: number | null = null
  let size: number | null = null
  let remaining = 0 // nodes of the current level still waiting in the queue
  let level: number[] = []

  const emit = (
    at: string,
    say: string,
    opts: {
      popped?: number
      flash?: 'visit' | 'push' | 'init' | 'group'
      pushed?: number[]
      edges?: TreeSceneExtras['edgeMarks']
    } = {},
  ): void => {
    if (drafts.length >= MAX_FRAMES) return

    // Tree
    const seen = new Set(written)
    const marks: NonNullable<TreeSceneExtras['marks']> = []
    const group = opts.flash === 'group' ? new Set(level) : new Set<number>()
    tree.nodes.forEach((_, node) => {
      if (group.has(node)) marks.push({ node, role: 'found' })
      else if (opts.pushed?.includes(node)) marks.push({ node, role: 'changed' })
      else if (opts.flash === 'init' && node === tree.root) marks.push({ node, role: 'changed' })
      else if (node === curr) marks.push({ node, role: opts.flash === 'visit' ? 'changed' : 'focus' })
      else if (seen.has(node)) marks.push({ node, role: 'visited' })
    })
    const treePart = treeScene(tree, {
      pointers: [{ name: 'curr', target: curr, role: 'focus' }],
      marks,
      edgeMarks: opts.edges,
    })

    // Queue: front and back pointers; the window is the level being served.
    const queueCells = queue.map((i) => tree.nodes[i].value)
    const queuePart: ArrayScene = {
      kind: 'array',
      label: 'queue',
      cells: queueCells,
      capacity: n - queue.length,
    }
    if (queue.length > 0) {
      queuePart.pointers = [
        { name: 'front', index: 0, role: 'ptrA' },
        { name: 'back', index: queue.length - 1, role: 'ptrB' },
      ]
    }
    if (remaining > 0) queuePart.window = { start: 0, end: remaining - 1 }
    if (opts.pushed && opts.pushed.length > 0) {
      queuePart.marks = opts.pushed.map((node) => ({ index: queue.indexOf(node), role: 'changed' as const }))
    }

    // Output: filled left to right, annotated by level.
    const outCells: ArrayScene['cells'] = Array.from({ length: n }, (_, i) => (i < written.length ? tree.nodes[written[i]].value : null))
    const outPart: ArrayScene = { kind: 'array', label: 'output', cells: outCells }
    const notes: Annotation[] = levelStarts
      .filter((start) => start < written.length)
      .map((start, k) => ({ target: `cell:${start}`, text: `level ${k + 1}` }))
    if (notes.length > 0) outPart.annotations = notes
    if (levelStarts.length > 0 && written.length > levelStarts[levelStarts.length - 1] && opts.flash !== 'group') {
      outPart.window = { start: levelStarts[levelStarts.length - 1], end: written.length - 1 }
    }
    if (opts.flash === 'visit' && written.length > 0) outPart.marks = [{ index: written.length - 1, role: 'changed' }]

    const vars: Record<string, Val> = {
      curr: valueOf(curr),
      size,
      queue: queueCells,
      level: level.map((i) => tree.nodes[i].value),
    }
    const frame: Frame = {
      scene: {
        kind: 'composite',
        layout: 'column',
        parts: [
          { title: 'Tree', scene: treePart },
          { title: 'Queue', scene: queuePart },
          { title: 'Output by level', scene: outPart },
        ],
      },
      vars,
      say,
      at,
      gauge: { value: written.length, max: n, label: 'Nodes visited' },
    }
    drafts.push({ frame, popped: opts.popped ?? null, queue: queue.slice() })
  }

  // init: queue = deque([root]) if root is not None else deque()
  if (tree.root !== null) queue.push(tree.root)
  emit(
    'init',
    tree.root === null
      ? 'The tree is empty, so the queue starts empty and there is nothing to visit.'
      : `Put the root, ${tree.nodes[tree.root].value}, in the queue. The queue holds the nodes waiting for their turn.`,
    { flash: 'init' },
  )

  // while queue:
  while (queue.length > 0 && drafts.length < MAX_FRAMES) {
    const k = result.length + 1
    size = queue.length
    remaining = size
    level = []
    curr = null
    levelStarts.push(written.length)
    emit('level', `Level ${k} starts. The queue holds ${size}, so size = ${size}: we take exactly ${size} off before the next level.`)

    for (let taken = 0; taken < size; taken++) {
      const node = queue.shift() as number
      const v = tree.nodes[node].value
      curr = node
      remaining = size - taken - 1
      emit(
        'pop',
        remaining === 0 ? `Take ${v} off the front of the queue. It is the last node of level ${k}.` : `Take ${v} off the front of the queue. ${remaining} more in level ${k}.`,
        { popped: node },
      )

      level.push(node)
      written.push(node)
      const { left, right } = tree.nodes[node]
      const kids = [left, right].filter((c): c is number => c !== null)
      emit(
        'visit',
        `Write ${v} into level ${k}: [${join(level.map((i) => tree.nodes[i].value))}].${kids.length === 0 ? ' It is a leaf, so nothing joins the queue.' : ''}`,
        { flash: 'visit' },
      )

      if (kids.length > 0) {
        queue.push(...kids)
        const [a, b] = [left, right].map((c) => (c === null ? null : tree.nodes[c].value))
        const say =
          left !== null && right !== null
            ? `Add ${v}'s children, ${a} and ${b}, to the back of the queue.`
            : left !== null
              ? `${v} has just a left child, ${a}: add it to the back of the queue.`
              : `${v} has just a right child, ${b}: add it to the back of the queue.`
        emit('push', say, {
          flash: 'push',
          pushed: kids,
          edges: kids.map((to) => ({ from: node, to, role: 'focus' as const })),
        })
      }
    }

    result.push(level.map((i) => tree.nodes[i].value))
    curr = null
    emit('group', `Level ${k} is complete: [${join(result[result.length - 1])}]. Add it to the result.`, { flash: 'group' })
    size = null
  }

  curr = null
  remaining = 0
  emit('check', 'The queue is empty, so the loop stops: every level is done.')
  emit('done', result.length === 0 ? 'Done: the tree was empty, so the result is [].' : `Done: ${nested(result)}.`)

  // Predict pass: who comes off the queue next? Only when the next frame is a
  // pop and the queue holds at least two nodes (a single node is no decision).
  drafts.forEach((draft, i) => {
    const next = drafts[i + 1]
    if (!next || next.popped === null || draft.queue.length < 2) return
    const v = tree.nodes[next.popped].value
    const predict: PredictCandidate = {
      tag: 'next-in-queue',
      kind: 'cell',
      prompt: `The queue is [${join(draft.queue.map((q) => tree.nodes[q].value))}], front first. Click the node that comes off next.`,
      answer: idOf(next.popped),
      why: `A queue is first in, first out: ${v} has waited longest, so it leaves first.`,
      hint: 'The front of the queue is the oldest arrival.',
    }
    draft.frame.predict = predict
  })

  for (const draft of drafts) rec.frame(draft.frame)
  return rec.done(result)
}

/** Independent version: walk the tree recursively and file each value under its depth. */
function reference({ values }: LevelOrderInput): number[][] {
  const levels: number[][] = []
  const walk = (node: ObjNode | null, depth: number): void => {
    if (node === null) return
    if (levels.length === depth) levels.push([])
    levels[depth].push(node.v)
    walk(node.l, depth + 1)
    walk(node.r, depth + 1)
  }
  walk(buildObjects(values), 0)
  return levels
}

const tracer: Tracer<LevelOrderInput, number[][]> = {
  id: 'trees/level-order',
  title: 'Level order (BFS)',
  anchors: {
    init: 'Start the queue with the root',
    check: 'Stop when the queue is empty',
    level: 'Freeze this level: size = len(queue)',
    pop: 'Take the front node off the queue',
    visit: "Write the node's value into this level",
    push: 'Add its children to the back of the queue',
    group: 'Add the finished level to the result',
    done: 'Return the grouped result',
  },
  vars: [
    { name: 'curr', label: 'node', role: 'focus' },
    { name: 'size', label: 'level size', role: 'value' },
    { name: 'queue', label: 'queue', role: 'value' },
    { name: 'level', label: 'this level', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 'values',
        label: 'Tree (level by level)',
        kind: 'int-array',
        placeholder: 'e.g. 3, 9, 20, null, null, 15, 7',
        help: `Like LeetCode: up to ${LIMITS.maxN} nodes from ${LIMITS.min} to ${LIMITS.max}, left to right, level by level. Write null for a missing child, or [] for an empty tree.`,
      },
    ],
    parse: parseInput,
    format: ({ values }) => ({ values: formatLevelValues(values) }),
    presets: [
      { label: 'Classic: 3, 9, 20, null, null, 15, 7', value: { values: [3, 9, 20, null, null, 15, 7] } },
      { label: 'A full tree of seven', value: { values: [4, 2, 6, 1, 3, 5, 7] } },
      { label: 'Lopsided: one node per level', value: { values: [1, 2, null, 3, null, 4] } },
    ],
    random(seed) {
      return { values: randomLevelValues(mulberry32(seed)) }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
