/**
 * Binary search trees — delete a key.
 *
 * Search for the node with `parent` trailing behind `curr`, then pick one of
 * three cases by counting its children:
 *   1. leaf         — cut the link from its parent
 *   2. one child    — lift that child into its place
 *   3. two children — copy the in-order successor's value into the node, then
 *                     remove the successor (the leftmost node of the right
 *                     subtree, which never has a left child, so it is case 1 or 2)
 * All three end in the same `relink` move: the parent's link (or the root) is
 * pointed at `child`. The removed node is lifted out of the tree (floating and
 * discarded) for one frame, then dropped. Node ids never change: the node that
 * held the deleted key keeps its id and shows the successor's value.
 * Code lives in content/code/bst/delete.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type { Frame, InputLimits, ParseResult, PredictCandidate, Tracer, Val } from '@/lib/engine/types'
import {
  RANDOM_MAX,
  RANDOM_MIN,
  TREE_VALUES,
  Walk,
  buildTree,
  inorderOf,
  makeNode,
  parseValueList,
  parseWholeNumber,
  preorderOf,
  ptr,
  randomDistinct,
  treeScene,
} from './common'
import type { BNode, EdgeMarks, IdMarks, Pointers, SceneParts } from './common'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface DeleteInput {
  /** Inserted in this order to build the tree. Distinct. */
  values: number[]
  /** Delete the node holding this value. If none does, the tree stays as it is. */
  key: number
}

const LIMITS: InputLimits = { maxN: 9, min: -99, max: 99 }

function parseInput(raw: Record<string, string>): ParseResult<DeleteInput> {
  const values = parseValueList(raw.values, LIMITS)
  if (!values.ok) return { ok: false, field: 'values', error: values.error }
  const key = parseWholeNumber(raw.key, LIMITS, 'to delete', '3')
  if (!key.ok) return { ok: false, field: 'key', error: key.error }
  return { ok: true, value: { values: values.value, key: key.value } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const LEAF = 'Leaf: no children'
const ONE_CHILD = 'One child'
const TWO_CHILDREN = 'Two children'

function whichCasePredict(key: number, curr: BNode): PredictCandidate {
  const kids = (curr.left === null ? 0 : 1) + (curr.right === null ? 0 : 1)
  const answer = kids === 0 ? LEAF : kids === 1 ? ONE_CHILD : TWO_CHILDREN
  const why =
    kids === 0
      ? `${key} has no children, so nothing needs a new home: just cut the link from its parent.`
      : kids === 1
        ? `${key} has one child, so that child can simply take ${key}'s place.`
        : `${key} has two children, and one parent link can't hold both, so a replacement value is needed.`
  return {
    tag: 'which-case',
    kind: 'choice',
    prompt: `Found ${key}. Which case is it: how many children does ${key} have?`,
    options: [LEAF, ONE_CHILD, TWO_CHILDREN],
    answer,
    why,
    hint: 'Count the arrows that leave the node.',
  }
}

function successorPredict(key: number, curr: BNode, succ: BNode): PredictCandidate {
  return {
    tag: 'successor',
    kind: 'cell',
    prompt: `${key} has two children. Which node holds its in-order successor, the next bigger value? Click it.`,
    answer: succ.id,
    why: `The next bigger value is the smallest one in the right subtree: go right from ${curr.value}, then left as far as you can. That is ${succ.value}.`,
    hint: 'Go right once, then keep going left.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ values, key }: DeleteInput) {
  const rec = createRecorder<number[]>()
  let root = buildTree(values)
  const walk = new Walk()

  // Working state — mirrors the variables in the code files.
  let parent: BNode | null = null
  let curr: BNode | null = root
  let succ: BNode | null = null

  const emit = (
    at: string,
    say: string,
    parts: SceneParts = {},
    predict?: PredictCandidate,
  ): void => {
    const pointers: Pointers = [ptr('curr', curr, 'ptrB')]
    if (parent !== null) pointers.push(ptr('parent', parent, 'ptrA'))
    const vars: Record<string, Val> = {
      key,
      curr: curr === null ? null : curr.value,
      parent: parent === null ? null : parent.value,
    }
    if (succ !== null) vars.succ = succ.value
    const frame: Frame = { scene: treeScene(root, { pointers, ...parts }), vars, say, at }
    if (predict) frame.predict = predict
    rec.frame(frame)
  }

  emit(
    'init',
    `Find ${key} the way a search does, with parent trailing one step behind curr. Then remove it. curr starts at the root.`,
    { marks: walk.marks(curr, 'focus') },
  )

  // `while curr is not None and curr.val != key`: every test is one frame.
  for (;;) {
    if (curr === null) {
      emit('search', `curr is null: we walked off the tree, so ${key} isn't in it and there is nothing to delete.`, {
        marks: walk.marks(null, null),
        edgeMarks: walk.edgeMarks('visited'),
      })
      break
    }
    if (curr.value === key) {
      emit(
        'search',
        `curr is ${curr.value}: that's the node to delete.`,
        { marks: walk.marks(curr, 'found'), edgeMarks: walk.edgeMarks('found') },
        whichCasePredict(key, curr),
      )
      break
    }
    const dir = key < curr.value ? 'left' : 'right'
    emit(
      'search',
      `curr is ${curr.value}, not ${key}. ${key} is ${dir === 'left' ? 'smaller' : 'bigger'}, so it can only be in the ${dir} subtree.`,
      { marks: walk.marks(curr, 'compare'), edgeMarks: walk.edgeMarks('visited') },
    )
    if (rec.capped) break

    const from: BNode = curr
    parent = from
    curr = walk.step(from, dir)
    emit(
      'walk',
      `parent steps onto ${from.value}, and curr moves ${dir} to ${curr === null ? 'null' : curr.value}.`,
      { marks: walk.marks(curr, 'focus'), edgeMarks: walk.edgeMarks('focus-last') },
    )
    if (rec.capped) break
  }

  const target: BNode | null = curr
  const found = target !== null
  if (target !== null && !rec.capped) {
    const targetMarks = (): IdMarks => [{ id: target.id, role: 'found' }]

    // The three cases. `case` names it; two children get the extra successor + copy frames.
    if (target.left !== null && target.right !== null) {
      const right: BNode = target.right
      // `succ = curr.right`, then keep going left while there is a left child.
      const hops: BNode[] = [right]
      let sp: BNode = target
      let s: BNode = right
      while (s.left !== null) {
        sp = s
        s = s.left
        hops.push(s)
      }
      emit(
        'case',
        `Case 3, two children (${target.left.value} and ${right.value}): cutting ${key} out would orphan one side, so borrow its in-order successor.`,
        { marks: targetMarks() },
        successorPredict(key, target, s),
      )
      if (rec.capped) return rec.done(preorderOf(root))

      succ = s
      parent = sp
      const chain: EdgeMarks = []
      let from: BNode = target
      for (const h of hops) {
        chain.push({ from: from.id, to: h.id, role: 'focus' })
        from = h
      }
      const hopText = hops.map((h) => h.value).join(' → ')
      emit(
        'successor',
        hops.length === 1
          ? `Go right to ${right.value}. It has no left child, so ${s.value} is the in-order successor: the smallest value on the right.`
          : `Go right, then left as far as possible: ${hopText}. ${s.value} has no left child, so it is the in-order successor.`,
        {
          pointers: [ptr('curr', target, 'ptrB'), ptr('succ', s, 'focus')],
          marks: [...targetMarks(), { id: s.id, role: 'compare' }],
          edgeMarks: chain,
          annotations: [{ target: `node:${s.id}`, text: 'smallest on the right' }],
        },
      )
      if (rec.capped) return rec.done(preorderOf(root))

      // `curr.val = succ.val`, then `curr = succ`: the successor's node is now the one to remove.
      target.value = s.value
      curr = s
      emit(
        'copy',
        `Copy ${s.value} up into the node that held ${key}. The ${s.value} below is now a duplicate, and it is the node to remove.`,
        {
          marks: [{ id: target.id, role: 'changed' }, { id: s.id, role: 'discarded' }],
        },
      )
    } else if (target.left !== null || target.right !== null) {
      const only: BNode = (target.left ?? target.right)!
      emit(
        'case',
        `Case 2, one child (${only.value}): lift that child into ${key}'s place, and its whole subtree comes along.`,
        { marks: targetMarks() },
      )
    } else {
      emit(
        'case',
        `Case 1, leaf: ${key} has no children, so ${parent === null ? 'removing it empties the tree' : 'just cut the link from its parent'}.`,
        { marks: targetMarks() },
      )
    }
    if (rec.capped) return rec.done(preorderOf(root))

    // `child = curr.left or curr.right`, then point parent's link (or the root) at child.
    const removed: BNode = curr as BNode
    const child: BNode | null = removed.left !== null ? removed.left : removed.right
    let side: 'left' | 'right' | null = null
    if (parent === null) {
      root = child
    } else if (parent.left === removed) {
      parent.left = child
      side = 'left'
    } else {
      parent.right = child
      side = 'right'
    }
    const gone = makeNode(removed.id, removed.value)
    const childText = child === null ? 'null' : String(child.value)
    const marks: IdMarks = [{ id: removed.id, role: 'discarded' }]
    if (parent !== null) marks.push({ id: parent.id, role: 'changed' })
    const edgeMarks: EdgeMarks = parent !== null && child !== null ? [{ from: parent.id, to: child.id, role: 'changed' }] : []
    const say =
      parent === null
        ? child === null
          ? `${removed.value} was the root and had no children, so the tree is now empty.`
          : `${removed.value} was the root: its child, ${child.value}, becomes the new root.`
        : `${parent.value}'s ${side} link now points at ${childText}, skipping the node that held ${removed.value}. That node is out.`
    curr = gone
    emit('relink', say, { floating: [gone], marks, edgeMarks })
  }

  // return root — the removed node is gone from the picture.
  curr = null
  succ = null
  parent = null
  const sorted = inorderOf(root)
  emit(
    'done',
    !found
      ? `Done: ${key} wasn't there, so the tree is unchanged.`
      : sorted.length === 0
        ? `Done: ${key} was the only node, so the tree is now empty.`
        : `Done: ${key} is gone. Read left to right, the tree is ${sorted.join(', ')}: still sorted.`,
    { pointers: [] },
  )

  return rec.done(preorderOf(root))
}

/** Independent version: the textbook recursive delete on plain objects, read off in pre-order. */
function reference({ values, key }: DeleteInput): number[] {
  interface Plain {
    v: number
    l: Plain | null
    r: Plain | null
  }
  const put = (t: Plain | null, x: number): Plain => {
    if (t === null) return { v: x, l: null, r: null }
    if (x < t.v) t.l = put(t.l, x)
    else t.r = put(t.r, x)
    return t
  }
  const smallest = (t: Plain): number => (t.l === null ? t.v : smallest(t.l))
  const remove = (t: Plain | null, x: number): Plain | null => {
    if (t === null) return null
    if (x < t.v) t.l = remove(t.l, x)
    else if (x > t.v) t.r = remove(t.r, x)
    else if (t.l === null) return t.r
    else if (t.r === null) return t.l
    else {
      t.v = smallest(t.r)
      t.r = remove(t.r, t.v)
    }
    return t
  }
  let tree: Plain | null = null
  for (const x of values) tree = put(tree, x)
  tree = remove(tree, key)
  const pre = (t: Plain | null): number[] => (t === null ? [] : [t.v, ...pre(t.l), ...pre(t.r)])
  return pre(tree)
}

const tracer: Tracer<DeleteInput, number[]> = {
  id: 'bst/delete',
  title: 'Delete',
  anchors: {
    init: 'Start at the root: parent = null, curr = root',
    search: 'Stop when curr holds the key (or is null)',
    walk: 'Step toward the key: parent = curr, curr goes left or right',
    case: 'Count curr’s children: leaf, one child, or two',
    successor: 'Two children: find the successor, the leftmost node on the right',
    copy: 'Copy the successor’s value into curr; the successor is the node to remove',
    relink: 'Point parent’s link at curr’s only child (or null)',
    done: 'Return the root',
  },
  vars: [
    { name: 'key', label: 'key', role: 'value' },
    { name: 'parent', label: 'parent value', role: 'ptrA' },
    { name: 'curr', label: 'curr value', role: 'ptrB' },
    { name: 'succ', label: 'successor value', role: 'focus' },
  ],
  input: {
    fields: [
      {
        ...TREE_VALUES,
        help: `Up to ${LIMITS.maxN} different whole numbers from ${LIMITS.min} to ${LIMITS.max}. The first one becomes the root; the rest are inserted in order.`,
      },
      {
        name: 'key',
        label: 'Value to delete',
        kind: 'int',
        placeholder: 'e.g. 3',
        help: 'If no node holds it, the tree stays as it is.',
      },
    ],
    parse: parseInput,
    format: ({ values, key }) => ({ values: values.join(', '), key: String(key) }),
    presets: [
      { label: 'Two children: delete 3', value: { values: [8, 3, 10, 1, 6, 4, 7, 14, 13], key: 3 } },
      { label: 'A leaf: delete 13', value: { values: [8, 3, 10, 1, 6, 4, 7, 14, 13], key: 13 } },
      { label: 'One child: delete 10', value: { values: [8, 3, 10, 1, 6, 4, 7, 14, 13], key: 10 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const values = randomDistinct(rand, randInt(rand, 1, LIMITS.maxN), RANDOM_MIN, RANDOM_MAX)
      // Mostly a value that is in the tree, sometimes one that is not.
      const key = rand() < 0.85 ? values[randInt(rand, 0, values.length - 1)] : randInt(rand, RANDOM_MIN - 3, RANDOM_MAX + 3)
      return { values, key }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
