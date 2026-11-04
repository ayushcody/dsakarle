/**
 * Binary search trees — insert a new value.
 *
 * Walk down exactly like a search, with `parent` trailing one step behind
 * `curr`. When curr falls off the tree it is standing on an empty spot, and
 * that spot is where the new value belongs: it is always a new leaf under
 * `parent`. The new node is made first and floats beside the tree until the
 * `link` frame hangs it in (the edge is drawn as `changed`). Nothing else in
 * the tree moves. Code lives in content/code/bst/insert.{py,java,cpp}.
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
  leftOrRightPredict,
  makeNode,
  parseValueList,
  parseWholeNumber,
  preorderOf,
  ptr,
  randomDistinct,
  treeScene,
} from './common'
import type { BNode, Pointers, SceneParts } from './common'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface InsertInput {
  /** Inserted in this order to build the starting tree. Distinct. */
  values: number[]
  /** The value to insert. Not already in the tree. */
  val: number
}

// The new node makes one more, so 8 starting values keep the tree at 9 or fewer.
const LIMITS: InputLimits = { maxN: 8, min: -99, max: 99 }

function parseInput(raw: Record<string, string>): ParseResult<InsertInput> {
  const values = parseValueList(raw.values, LIMITS)
  if (!values.ok) return { ok: false, field: 'values', error: values.error }
  const val = parseWholeNumber(raw.val, LIMITS, 'to insert', '7')
  if (!val.ok) return { ok: false, field: 'val', error: val.error }
  if (values.value.includes(val.value)) {
    return { ok: false, field: 'val', error: `${val.value} is already in the tree. This tree keeps each value once, so pick a new one.` }
  }
  return { ok: true, value: { values: values.value, val: val.value } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

function whereItLandsPredict(val: number, parent: BNode, side: 'left' | 'right'): PredictCandidate {
  return {
    tag: 'where-it-lands',
    kind: 'cell',
    prompt: `${val} ${side === 'left' ? '<' : '>'} ${parent.value}, and there is no ${side} child. Which node will ${val} hang under? Click it.`,
    answer: parent.id,
    why: `A new value always becomes a leaf: it hangs under the last node we visited, ${parent.value}, on its ${side} side.`,
    hint: 'Which node was curr standing on just before it fell off the tree?',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ values, val }: InsertInput) {
  const rec = createRecorder<number[]>()
  const root = buildTree(values)
  if (root === null) throw new Error('bst/insert needs at least one starting value.')
  const node = makeNode(`n${values.length}`, val)
  const walk = new Walk()

  // Working state — mirrors the variables in the code files.
  let parent: BNode | null = null
  let curr: BNode | null = root

  const pointers = (): Pointers => {
    const out: Pointers = [ptr('curr', curr, 'ptrB')]
    if (parent !== null) out.push(ptr('parent', parent, 'ptrA'))
    return out
  }

  const emit = (
    at: string,
    say: string,
    parts: Omit<SceneParts, 'pointers'> & { pointers?: Pointers } = {},
    predict?: PredictCandidate,
  ): void => {
    const vars: Record<string, Val> = {
      val,
      curr: curr === null ? null : curr.value,
      parent: parent === null ? null : parent.value,
    }
    const frame: Frame = { scene: treeScene(root, { pointers: pointers(), ...parts }), vars, say, at }
    if (predict) frame.predict = predict
    rec.frame(frame)
  }

  emit(
    'init',
    `Make a new node holding ${val}. It floats beside the tree until we find its place. curr starts at the root, ${root.value}.`,
    { floating: [node], marks: walk.marks(curr, 'focus') },
  )

  let side: 'left' | 'right' = 'left'
  while (curr !== null && !rec.capped) {
    emit(
      'compare',
      `Compare the new value, ${val}, with this node, ${curr.value}.`,
      { floating: [node], marks: walk.marks(curr, 'compare'), edgeMarks: walk.edgeMarks('visited') },
      leftOrRightPredict(val, curr.value),
    )
    if (rec.capped) break

    const from: BNode = curr
    side = val < from.value ? 'left' : 'right'
    parent = from
    curr = walk.step(from, side)
    const ruledOut = side === 'left' ? from.right : from.left
    const ruledText = ruledOut === null ? '' : ` The ${side === 'left' ? 'right' : 'left'} subtree (all ${side === 'left' ? 'bigger' : 'smaller'}) is out.`
    const arrival = curr === null ? ` ${from.value} has no ${side} child: curr is on an empty spot.` : ` curr moves to ${curr.value}.`
    emit(
      side,
      `${val} ${side === 'left' ? '<' : '>'} ${from.value}, so go ${side}.${ruledText}${arrival}`,
      {
        floating: [node],
        marks: walk.marks(curr, 'focus'),
        edgeMarks: walk.edgeMarks('focus-last'),
        annotations: [{ target: `node:${from.id}`, text: `${val} ${side === 'left' ? '<' : '>'} ${from.value}: ${side}` }],
      },
      curr === null ? whereItLandsPredict(val, from, side) : undefined,
    )
  }

  // `parent.left = node` or `parent.right = node`: the only write in the whole insert.
  if (parent !== null && !rec.capped) {
    if (side === 'left') parent.left = node
    else parent.right = node
    emit(
      'link',
      `Link it: ${val} becomes the ${side} child of ${parent.value}. That is the only link that changes.`,
      {
        marks: [...walk.marks(null, null), { id: node.id, role: 'changed' }],
        edgeMarks: [{ from: parent.id, to: node.id, role: 'changed' }],
      },
    )
  }

  const sorted = inorderOf(root)
  curr = null
  emit(
    'done',
    `Done: ${val} is in. Read left to right, the tree is ${sorted.join(', ')}: still sorted.`,
    { marks: [{ id: node.id, role: 'found' }], pointers: [] },
  )

  return rec.done(preorderOf(root))
}

/** Independent version: recursive insert on plain objects, then read the shape off in pre-order. */
function reference({ values, val }: InsertInput): number[] {
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
  let tree: Plain | null = null
  for (const x of [...values, val]) tree = put(tree, x)
  const pre = (t: Plain | null): number[] => (t === null ? [] : [t.v, ...pre(t.l), ...pre(t.r)])
  return pre(tree)
}

const tracer: Tracer<InsertInput, number[]> = {
  id: 'bst/insert',
  title: 'Insert',
  anchors: {
    init: 'Make the new node; curr = root, parent trails behind',
    compare: 'Compare the new value with curr.val',
    left: 'Smaller: parent = curr, curr = curr.left',
    right: 'Bigger: parent = curr, curr = curr.right',
    link: 'curr is empty: hang the new node under parent',
    done: 'Return the root',
  },
  vars: [
    { name: 'val', label: 'new value', role: 'value' },
    { name: 'curr', label: 'curr value', role: 'ptrB' },
    { name: 'parent', label: 'parent value', role: 'ptrA' },
  ],
  input: {
    fields: [
      {
        ...TREE_VALUES,
        label: 'Starting tree: values inserted in this order',
        help: `Up to ${LIMITS.maxN} different whole numbers from ${LIMITS.min} to ${LIMITS.max}. The first one becomes the root.`,
      },
      {
        name: 'val',
        label: 'Value to insert',
        kind: 'int',
        placeholder: 'e.g. 7',
        help: 'A number that is not already in the tree.',
      },
    ],
    parse: parseInput,
    format: ({ values, val }) => ({ values: values.join(', '), val: String(val) }),
    presets: [
      { label: 'Insert 7', value: { values: [8, 3, 10, 1, 6, 14], val: 7 } },
      { label: 'A new smallest value', value: { values: [8, 3, 10, 1, 6, 14], val: 0 } },
      { label: 'Sorted input: a skewed tree', value: { values: [1, 2, 3, 4, 5, 6, 7, 8], val: 9 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const values = randomDistinct(rand, randInt(rand, 1, LIMITS.maxN), RANDOM_MIN, RANDOM_MAX)
      let val = randInt(rand, RANDOM_MIN - 3, RANDOM_MAX + 3)
      while (values.includes(val)) val++
      return { values, val }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
