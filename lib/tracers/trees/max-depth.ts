/**
 * Binary trees — maximum depth, post-order (LeetCode 104).
 *
 * depth(node) asks both children how deep they are, then answers
 * 1 + max(left, right). A null child is the base case and returns 0. Nothing
 * can be answered until both children have answered, which is why this is
 * post-order: the answer comes back UP the tree, and every finished node keeps
 * an "depth k" note on the picture.
 *
 * Frames:
 *   init     depth(root) is called
 *   left / right   a child call is made, curr moves down one level
 *   base     a null child returns 0 at once
 *   combine  both sides have answered: this node returns 1 + max(left, right)
 * The last combine frame (the root) lights up one longest path. Predict:
 * 'depth-here' asks what a node returns once both sides have answered.
 * Scene: a single TreeScene. Code: content/code/trees/max-depth.{py,java,cpp}.
 */
import { mulberry32 } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import { MAX_FRAMES } from '@/lib/engine/types'
import type { Frame, InputLimits, ParseResult, PredictCandidate, Tracer, Val } from '@/lib/engine/types'
import {
  TREE_LIMITS,
  buildObjects,
  buildTree,
  formatLevelValues,
  pathEdges,
  parseLevelValues,
  randomLevelValues,
  treeScene,
} from './shared'
import type { LevelValues, TreeSceneExtras } from './shared'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface MaxDepthInput {
  /** Level-order values with `null` for a missing child. */
  values: LevelValues
}

const LIMITS: InputLimits = TREE_LIMITS

function parseInput(raw: Record<string, string>): ParseResult<MaxDepthInput> {
  const values = parseLevelValues(raw.values)
  return values.ok ? { ok: true, value: { values: values.value } } : values
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

interface Draft {
  frame: Frame
  /** Set on combine frames: what the node is about to return. */
  combine: { node: number; left: number; right: number; depth: number } | null
}

function run({ values }: MaxDepthInput) {
  const rec = createRecorder<number>()
  const tree = buildTree(values)
  const n = tree.nodes.length

  const drafts: Draft[] = []
  /** Live calls, root first: the node, and what each side has answered so far. */
  const calls: Array<{ node: number; left: number | null; right: number | null }> = []
  const answers = new Map<number, number>() // finished node -> depth it returned
  let returned: number | null = null // value handed back by the most recent call

  const valueOf = (i: number | null): number | null => (i === null ? null : tree.nodes[i].value)

  /** One longest path from the root, preferring the left side on a tie. */
  const longestPath = (): number[] => {
    const path: number[] = []
    let at = tree.root
    while (at !== null) {
      path.push(at)
      const { left, right } = tree.nodes[at]
      const l = left === null ? 0 : answers.get(left) ?? 0
      const r = right === null ? 0 : answers.get(right) ?? 0
      at = l === 0 && r === 0 ? null : l >= r ? left : right
    }
    return path
  }

  const emit = (
    at: string,
    say: string,
    opts: { curr: number | null; combine?: Draft['combine']; nullSide?: { parent: number; text: string }; final?: boolean },
  ): void => {
    if (drafts.length >= MAX_FRAMES) return
    const top = calls.length > 0 ? calls[calls.length - 1] : null
    const path = opts.final ? longestPath() : []
    const onPath = new Set(path)

    const marks: NonNullable<TreeSceneExtras['marks']> = []
    tree.nodes.forEach((_, node) => {
      if (onPath.has(node)) marks.push({ node, role: 'found' })
      else if (node === opts.curr) marks.push({ node, role: opts.combine ? 'changed' : 'focus' })
      else if (answers.has(node)) marks.push({ node, role: 'visited' })
    })
    const notes: NonNullable<TreeSceneExtras['notes']> = []
    for (const [node, d] of answers) notes.push({ node, text: `depth ${d}` })
    if (opts.nullSide) notes.push({ node: opts.nullSide.parent, text: opts.nullSide.text })

    const edgeMarks = opts.final
      ? path.slice(1).map((to, i) => ({ from: path[i], to, role: 'found' as const }))
      : pathEdges(calls.map((c) => c.node))
    const vars: Record<string, Val> = {
      curr: valueOf(opts.curr),
      left: top ? top.left : null,
      right: top ? top.right : null,
      ret: returned,
    }
    const frame: Frame = {
      scene: treeScene(tree, {
        pointers: [{ name: 'curr', target: opts.curr, role: 'focus' }],
        marks,
        edgeMarks,
        notes,
      }),
      vars,
      say,
      at,
      gauge: { value: answers.size, max: n, label: 'Nodes answered' },
    }
    drafts.push({ frame, combine: opts.combine ?? null })
  }

  /** One call of depth(node). `via` is the line that made the call. */
  const depth = (node: number | null, via: 'init' | 'left' | 'right', parent: number | null): number => {
    if (drafts.length >= MAX_FRAMES) return 0
    if (node === null) {
      returned = 0
      const p = valueOf(parent)
      emit('base', `The ${via} side of ${p} is null: an empty side has depth 0.`, {
        curr: parent,
        nullSide: parent === null ? undefined : { parent, text: 'null: 0' },
      })
      return 0
    }

    const v = tree.nodes[node].value
    calls.push({ node, left: null, right: null })
    const call = calls[calls.length - 1]
    if (via === 'init') {
      emit('init', `Ask for the depth of the whole tree: depth(${v}) starts at the root.`, { curr: node })
    } else {
      emit(via, `Ask the ${via} side of ${valueOf(parent)}: depth(${v}) is called.`, { curr: node })
    }

    call.left = depth(tree.nodes[node].left, 'left', node)
    call.right = depth(tree.nodes[node].right, 'right', node)

    const l = call.left
    const r = call.right
    const d = 1 + Math.max(l, r)
    answers.set(node, d)
    returned = d
    const isRoot = node === tree.root
    emit(
      'combine',
      l === 0 && r === 0
        ? `${v} is a leaf: both sides gave 0, so it returns 1 + max(0, 0) = 1.`
        : `${isRoot ? 'The root, ' : ''}${v}: left gave ${l}, right gave ${r}, so it returns 1 + max(${l}, ${r}) = ${d}.${isRoot ? " That is the tree's depth." : ''}`,
      { curr: node, combine: { node, left: l, right: r, depth: d }, final: isRoot },
    )
    calls.pop()
    return d
  }

  let answer = 0
  if (tree.root === null) {
    emit('init', 'Ask for the depth of the tree. The root is null: the tree is empty.', { curr: null })
    returned = 0
    emit('base', 'The root is null, so the depth is 0.', { curr: null })
  } else {
    answer = depth(tree.root, 'init', null)
  }

  // Predict pass: just before a node combines, ask what it will return.
  drafts.forEach((draft, i) => {
    const next = drafts[i + 1]
    if (!next || next.combine === null) return
    const { node, left, right, depth: d } = next.combine
    const v = tree.nodes[node].value
    const deeper = Math.max(left, right)
    const leaf = left === 0 && right === 0
    const wanted = [d, deeper, left + right + 1, Math.min(left, right) + 1]
    const options = Array.from(new Set(wanted)).slice(0, 3)
    if (!options.includes(d)) options[options.length - 1] = d
    const predict: PredictCandidate = {
      tag: 'depth-here',
      kind: 'choice',
      prompt: leaf
        ? `${v} is a leaf: its left and right sides are both null (0 and 0). What does depth(${v}) return?`
        : `The left side returned ${left} and the right side returned ${right}. What does depth(${v}) return?`,
      options: Array.from(new Set(options)).sort((a, b) => a - b).map(String),
      answer: String(d),
      why: leaf
        ? 'A leaf still counts itself: 1 + max(0, 0) = 1.'
        : `Take the deeper side (${deeper}) and add 1 for ${v} itself: ${d}.`,
      hint: 'Count this node too: 1 plus the deeper side.',
    }
    draft.frame.predict = predict
  })

  for (const draft of drafts) rec.frame(draft.frame)
  return rec.done(answer)
}

/** Independent version: count the levels with a queue, no recursion. */
function reference({ values }: MaxDepthInput): number {
  const root = buildObjects(values)
  if (root === null) return 0
  let levels = 0
  let row = [root]
  while (row.length > 0) {
    levels++
    row = row.flatMap((node) => [node.l, node.r].filter((c): c is NonNullable<typeof c> => c !== null))
  }
  return levels
}

const tracer: Tracer<MaxDepthInput, number> = {
  id: 'trees/max-depth',
  title: 'Maximum depth',
  anchors: {
    init: 'Ask for the depth of the root',
    base: 'A null side has depth 0',
    left: 'Ask the left side how deep it is',
    right: 'Ask the right side how deep it is',
    combine: 'Return 1 + the deeper side',
  },
  vars: [
    { name: 'curr', label: 'node', role: 'focus' },
    { name: 'left', label: 'left depth', role: 'ptrA' },
    { name: 'right', label: 'right depth', role: 'ptrB' },
    { name: 'ret', label: 'last returned', role: 'best' },
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
      { label: 'Deep on the left, short on the right', value: { values: [8, 4, 12, 2, null, null, null, 1] } },
      { label: 'A chain leaning right', value: { values: [1, null, 2, null, 3, null, 4] } },
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
