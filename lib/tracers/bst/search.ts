/**
 * Binary search trees — search for a key.
 *
 * Same layout as the other golden tracers:
 *   1. input type, parsing and presets
 *   2. `run` — the real algorithm, recording one frame per idea
 *   3. `reference` — a boring implementation the tests compare against
 *
 * The tree is built by inserting `values` in order (so the first value is the
 * root), then `key` is searched for. Every node asks one question — is the key
 * equal, smaller or bigger? — and the answer rules out a whole subtree, which
 * is drawn as `discarded`. Two frames per node: `compare` (what is being
 * compared, with the predict) and `left` / `right` (the move and what it rules
 * out). Code lives in content/code/bst/search.{py,java,cpp}.
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
  leftOrRightPredict,
  parseValueList,
  parseWholeNumber,
  ptr,
  randomDistinct,
  sizeOf,
  treeScene,
} from './common'
import type { BNode } from './common'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface SearchInput {
  /** Inserted in this order to build the tree. Distinct. */
  values: number[]
  key: number
}

const LIMITS: InputLimits = { maxN: 9, min: -99, max: 99 }

function parseInput(raw: Record<string, string>): ParseResult<SearchInput> {
  const values = parseValueList(raw.values, LIMITS)
  if (!values.ok) return { ok: false, field: 'values', error: values.error }
  const key = parseWholeNumber(raw.key, LIMITS, 'to look for', '6')
  if (!key.ok) return { ok: false, field: 'key', error: key.error }
  return { ok: true, value: { values: values.value, key: key.value } }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ values, key }: SearchInput) {
  const rec = createRecorder<boolean>()
  const root = buildTree(values)
  const total = values.length
  const walk = new Walk()

  // Working state — mirrors the variable in the code files.
  let curr: BNode | null = root
  let compares = 0

  const emit = (
    at: string,
    say: string,
    scene: { mode?: 'visited' | 'focus-last' | 'found'; role?: 'compare' | 'focus' | 'found' | null; note?: string; noteOn?: BNode },
    gaugeValue: number,
    predict?: PredictCandidate,
  ): void => {
    const vars: Record<string, Val> = { key, curr: curr === null ? null : curr.value }
    const frame: Frame = {
      scene: treeScene(root, {
        pointers: [ptr('curr', curr, 'ptrB')],
        marks: walk.marks(curr, scene.role === undefined ? null : scene.role),
        edgeMarks: walk.edgeMarks(scene.mode ?? 'visited'),
        annotations: scene.note !== undefined && scene.noteOn !== undefined ? [{ target: `node:${scene.noteOn.id}`, text: scene.note }] : [],
      }),
      vars,
      say,
      at,
      gauge: { value: gaugeValue, max: total, label: 'Nodes still possible' },
    }
    if (predict) frame.predict = predict
    rec.frame(frame)
  }

  emit('init', `Looking for ${key}. curr starts at the root, ${root === null ? 'nothing' : root.value}. All ${total} nodes are still possible.`, {}, total)

  let found = false
  while (curr !== null && !rec.capped) {
    compares++
    const equal = key === curr.value
    emit(
      'compare',
      `Compare the key, ${key}, with this node, ${curr.value}.`,
      { role: 'compare' },
      sizeOf(curr),
      equal ? undefined : leftOrRightPredict(key, curr.value),
    )
    if (rec.capped) break

    if (equal) {
      found = true
      break
    }

    const from: BNode = curr
    const dir = key < from.value ? 'left' : 'right'
    curr = walk.step(from, dir)
    const ruledOut = dir === 'left' ? from.right : from.left
    const ruledText = ruledOut === null ? '' : ` The ${dir === 'left' ? 'right' : 'left'} subtree (all ${dir === 'left' ? 'bigger' : 'smaller'}) is ruled out.`
    const arrival = curr === null ? ` ${from.value} has no ${dir} child, so ${key} isn't in the tree.` : ` curr moves to ${curr.value}.`
    emit(
      dir,
      `${key} ${dir === 'left' ? '<' : '>'} ${from.value}, so go ${dir}.${ruledText}${arrival}`,
      { role: 'focus', mode: 'focus-last', note: `${key} ${dir === 'left' ? '<' : '>'} ${from.value}: ${dir}`, noteOn: from },
      curr === null ? 0 : sizeOf(curr),
    )
  }

  const plural = compares === 1 ? 'compare' : 'compares'
  if (found && curr !== null) {
    emit('done', `${key} equals ${curr.value}: found it after ${compares} ${plural}. Return the node.`, { role: 'found', mode: 'found' }, 1)
  } else {
    emit('done', `curr fell off the tree: ${key} isn't here, and it took ${compares} ${plural} to be sure. Return nothing.`, {}, 0)
  }

  return rec.done(found)
}

/** Independent version: the tree holds exactly the values it was built from. */
function reference({ values, key }: SearchInput): boolean {
  return values.includes(key)
}

const tracer: Tracer<SearchInput, boolean> = {
  id: 'bst/search',
  title: 'Search',
  anchors: {
    init: 'Start at the root: curr = root',
    compare: 'Compare the key with curr.val',
    left: 'Smaller: go left, the right subtree is ruled out',
    right: 'Bigger: go right, the left subtree is ruled out',
    done: 'Found it, or fell off the tree',
  },
  vars: [
    { name: 'key', label: 'key', role: 'value' },
    { name: 'curr', label: 'curr value', role: 'ptrB' },
  ],
  input: {
    fields: [
      {
        ...TREE_VALUES,
        help: `Up to ${LIMITS.maxN} different whole numbers from ${LIMITS.min} to ${LIMITS.max}. The first one becomes the root; the rest are inserted in order.`,
      },
      {
        name: 'key',
        label: 'Value to find',
        kind: 'int',
        placeholder: 'e.g. 6',
        help: 'It may or may not be in the tree.',
      },
    ],
    parse: parseInput,
    format: ({ values, key }) => ({ values: values.join(', '), key: String(key) }),
    presets: [
      { label: 'Find 6', value: { values: [8, 3, 10, 1, 6, 14, 4, 7, 13], key: 6 } },
      { label: 'A value that is not there', value: { values: [8, 3, 10, 1, 6, 14, 4, 7, 13], key: 5 } },
      { label: 'Sorted input: a skewed tree', value: { values: [1, 2, 3, 4, 5, 6, 7], key: 7 } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const values = randomDistinct(rand, randInt(rand, 1, LIMITS.maxN), RANDOM_MIN, RANDOM_MAX)
      // Mostly a value that is in the tree, sometimes one that is not.
      const key = rand() < 0.7 ? values[randInt(rand, 0, values.length - 1)] : randInt(rand, RANDOM_MIN - 3, RANDOM_MAX + 3)
      return { values, key }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
