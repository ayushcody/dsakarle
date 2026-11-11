/**
 * Hash maps — a tiny teaching hash table with separate chaining.
 *
 * Five buckets (m = 5). Keys are small non-negative whole numbers (0..99), so
 * the hash function is the key itself and the bucket is `key % 5`: the learner
 * can do the arithmetic in their head. Each bucket holds a chain (a list) of
 * entries; two keys that land in the same bucket simply sit in the same chain.
 *
 * Same layout as the sliding-window tracers:
 *   1. input type, parsing and presets
 *   2. frame helpers (narration / predicts)
 *   3. `run` — the real algorithm, recording one frame per idea
 *   4. `reference` — a boring JS Map the tests compare against
 *
 * Code lives in content/code/hash-maps/put-get.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type {
  Frame,
  HashEntry,
  HashMapScene,
  InputLimits,
  ParseResult,
  PredictCandidate,
  Tracer,
  Val,
} from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export type PutGetOp = { op: 'put'; key: number; value: string } | { op: 'get'; key: number }

export interface PutGetInput {
  ops: PutGetOp[]
}

export interface PutGetResult {
  /** One entry per `get`, in order; null when the key was missing. */
  gets: Array<string | null>
  /** Final contents: one chain of [key, value] pairs per bucket, oldest first. */
  table: Array<Array<[number, string]>>
}

/** Number of buckets. Part of the lesson: the bucket is `key % 5`. */
const M = 5

/** `maxN` is the operation limit; `min`..`max` is the key range. */
const LIMITS: InputLimits = { maxN: 8, min: 0, max: 99 }

const VALUE_RE = /^[A-Za-z0-9]{1,3}$/
const INTEGER = /^[+-]?\d+$/

/** Keep echoed user text short so error messages stay friendly. */
function shown(text: string): string {
  return text.length > 14 ? `${text.slice(0, 13)}…` : text
}

function parseInput(raw: Record<string, string>): ParseResult<PutGetInput> {
  const field = 'ops'
  const parts = (raw.ops ?? '')
    .split(/[,;\n]+/)
    .map((p) => p.trim())
    .filter((p) => p !== '')

  if (parts.length === 0) {
    return { ok: false, field, error: 'Type at least one operation, like put 12 a, get 12.' }
  }
  if (parts.length > LIMITS.maxN) {
    return { ok: false, field, error: `Use at most ${LIMITS.maxN} operations so the table stays readable.` }
  }

  const ops: PutGetOp[] = []
  for (const part of parts) {
    const words = part.split(/\s+/)
    const verb = words[0].toLowerCase()
    if (verb !== 'put' && verb !== 'get') {
      return { ok: false, field, error: `"${shown(words[0])}" isn't an operation here. Use put KEY VALUE or get KEY.` }
    }
    if (verb === 'put' && words.length !== 3) {
      return { ok: false, field, error: 'put needs a key and a value, like put 12 a. Separate operations with commas.' }
    }
    if (verb === 'get' && words.length !== 2) {
      return { ok: false, field, error: 'get takes just a key, like get 12. Separate operations with commas.' }
    }
    const keyText = words[1]
    if (!INTEGER.test(keyText) || Number(keyText) < LIMITS.min || Number(keyText) > LIMITS.max) {
      return {
        ok: false,
        field,
        error: `Keys are whole numbers from ${LIMITS.min} to ${LIMITS.max}, not "${shown(keyText)}".`,
      }
    }
    const key = Number(keyText)
    if (verb === 'get') {
      ops.push({ op: 'get', key })
      continue
    }
    const value = words[2]
    if (!VALUE_RE.test(value)) {
      return { ok: false, field, error: `Values are 1 to 3 letters or digits, like a or x7, not "${shown(value)}".` }
    }
    ops.push({ op: 'put', key, value })
  }
  return { ok: true, value: { ops } }
}

function formatOps(ops: PutGetOp[]): string {
  return ops.map((o) => (o.op === 'put' ? `put ${o.key} ${o.value}` : `get ${o.key}`)).join(', ')
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

interface Entry {
  key: number
  value: string
}

const OVERWRITE = 'Overwrite'
const CHAIN = 'Chain it'

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many
}

/** "put 12" / "get 7" */
function opName(op: PutGetOp): string {
  return `${op.op} ${op.key}`
}

/** Which-bucket question about an upcoming operation. Answer is the bucket index. */
function whichBucketPredict(op: PutGetOp): PredictCandidate {
  const bucket = op.key % M
  return {
    tag: 'which-bucket',
    kind: 'cell',
    prompt: `Next is ${opName(op)}. With ${M} buckets, which one does key ${op.key} belong in?`,
    answer: bucket,
    why: `${op.key} % ${M} = ${bucket}. The remainder is the bucket number, so put and get both go straight to bucket ${bucket}.`,
    hint: `Divide ${op.key} by ${M}. The remainder is the bucket.`,
  }
}

/**
 * Collision question: the key is new but its bucket is already occupied.
 * Option order flips with the key so the right answer is not always second.
 */
function collisionPredict(key: number, chain: Entry[]): PredictCandidate {
  const first = chain[0].key
  const last = chain[chain.length - 1].key
  const overwrite = chain.length === 1 ? `${OVERWRITE} ${first}` : `${OVERWRITE} one of them`
  const chained = `${CHAIN} after ${last}`
  const where =
    chain.length === 1
      ? `where ${first} already lives`
      : `where ${chain.length} keys already live`
  return {
    tag: 'collision',
    kind: 'choice',
    prompt: `${key} lands in bucket ${key % M}, ${where}. What happens?`,
    options: key % 2 === 0 ? [overwrite, chained] : [chained, overwrite],
    answer: chained,
    why: `Different keys can share a bucket. ${key} is a new key, so it is added to the chain and nothing is overwritten.`,
    hint: 'Overwriting only happens when the key is the same, not just the bucket.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ ops }: PutGetInput) {
  const rec = createRecorder<PutGetResult>()

  // Working state — mirrors the HashTable class in the code files.
  const table: Entry[][] = Array.from({ length: M }, () => [])
  const gets: Array<string | null> = []
  let size = 0
  let lastGet: string | null = null

  // What the current operation is hashing (null before the first and when idle).
  let key: number | null = null
  let bucket: number | null = null

  const emit = (
    at: string,
    say: string,
    extra: {
      marks?: HashMapScene['marks']
      annotations?: HashMapScene['annotations']
      predict?: PredictCandidate
    } = {},
  ): void => {
    const scene: HashMapScene = {
      kind: 'hash-map',
      buckets: table.map((chain): HashEntry[] => chain.map((e) => ({ key: e.key, value: e.value }))),
      hashing: key !== null && bucket !== null ? { key, hash: key, bucket } : null,
    }
    if (extra.marks?.length) scene.marks = extra.marks
    if (extra.annotations?.length) scene.annotations = extra.annotations

    const vars: Record<string, Val> = { key, bucket, size, result: lastGet }
    const frame: Frame = {
      scene,
      vars,
      say,
      at,
      gauge: { value: size, max: M, label: `Entries vs ${M} buckets` },
    }
    if (extra.predict) frame.predict = extra.predict
    rec.frame(frame)
  }

  /** The which-bucket question about operation `o` rides on the frame before its hash frame. */
  const askBucketAbout = (o: number): void => {
    if (o >= ops.length) return
    const last = rec.frames[rec.frames.length - 1]
    if (last && !last.predict) last.predict = whichBucketPredict(ops[o])
  }

  emit(
    'init',
    `Five empty buckets, numbered 0 to 4. Our hash function is simply key % ${M}. It names the bucket.`,
  )
  askBucketAbout(0)

  for (let o = 0; o < ops.length && !rec.capped; o++) {
    const op = ops[o]
    key = op.key
    bucket = op.key % M
    const chain = table[bucket]
    const isNew = !chain.some((e) => e.key === op.key)

    // hash — pick the bucket; the key is never compared with entries elsewhere.
    emit(
      'hash',
      `${opName(op)}: ${op.key} % ${M} = ${bucket}, so go to bucket ${bucket}. ${
        chain.length === 0 ? 'It is empty.' : `It holds ${chain.length} ${plural(chain.length, 'entry', 'entries')}.`
      }`,
      {
        marks: [{ bucket, role: 'focus' }],
        predict: op.op === 'put' && chain.length > 0 && isNew ? collisionPredict(op.key, chain) : undefined,
      },
    )
    if (rec.capped) break

    // walk — compare the key with each entry in this one chain.
    let hit = -1
    for (let s = 0; s < chain.length && !rec.capped; s++) {
      const match = chain[s].key === op.key
      const lastEntry = s === chain.length - 1
      const say = match
        ? `Compare ${chain[s].key} with ${op.key}: same key, this is the entry.`
        : lastEntry
          ? `Compare ${chain[s].key} with ${op.key}: different. That was the last entry in the chain.`
          : `Compare ${chain[s].key} with ${op.key}: different keys, so move on to the next entry.`
      const marks: NonNullable<HashMapScene['marks']> = []
      for (let v = 0; v < s; v++) marks.push({ bucket, slot: v, role: 'visited' })
      marks.push({ bucket, slot: s, role: 'compare' })
      emit('walk', say, { marks })
      if (match) {
        hit = s
        break
      }
    }
    if (rec.capped) break

    if (op.op === 'put') {
      if (hit >= 0) {
        const old = chain[hit].value
        chain[hit].value = op.value
        emit('update', `Key ${op.key} is already here, so replace its value: ${old} becomes ${op.value}.`, {
          marks: [{ bucket, slot: hit, role: 'changed' }],
        })
      } else {
        chain.push({ key: op.key, value: op.value })
        size++
        const collided = chain.length > 1
        emit(
          'insert',
          collided
            ? `${op.key} isn't in the chain, so add (${op.key}, ${op.value}) at the end. Bucket ${bucket} now chains ${chain.length} entries.`
            : `Bucket ${bucket} is empty, so the new entry (${op.key}, ${op.value}) goes straight in.`,
          {
            marks: [{ bucket, slot: chain.length - 1, role: 'changed' }],
            annotations: collided ? [{ target: `bucket:${bucket}`, text: 'chained' }] : undefined,
          },
        )
      }
    } else if (hit >= 0) {
      const value = chain[hit].value
      gets.push(value)
      lastGet = value
      emit('found', `Found it: key ${op.key} holds ${value}. Only bucket ${bucket} was searched.`, {
        marks: [{ bucket, slot: hit, role: 'found' }],
      })
    } else {
      gets.push(null)
      lastGet = null
      emit(
        'missing',
        chain.length === 0
          ? `Bucket ${bucket} is empty, so ${op.key} isn't stored and get returns nothing.`
          : `The chain ends with no ${op.key}, so get returns nothing. The key isn't stored.`,
        { marks: [{ bucket, role: 'error' }] },
      )
    }

    askBucketAbout(o + 1)
  }

  return rec.done({
    gets,
    table: table.map((chain) => chain.map((e): [number, string] => [e.key, e.value])),
  })
}

/** Independent version: a plain JS Map, then group by key % 5. Map keeps first-insertion order, like a chain. */
function reference({ ops }: PutGetInput): PutGetResult {
  const map = new Map<number, string>()
  const gets: Array<string | null> = []
  for (const op of ops) {
    if (op.op === 'put') map.set(op.key, op.value)
    else gets.push(map.has(op.key) ? (map.get(op.key) as string) : null)
  }
  const table: PutGetResult['table'] = Array.from({ length: M }, () => [])
  map.forEach((value, k) => table[k % M].push([k, value]))
  return { gets, table }
}

const VALUE_LETTERS = 'abcdefghjkmnpqrstuvwxyz'

const tracer: Tracer<PutGetInput, PutGetResult> = {
  id: 'hash-maps/put-get',
  title: 'Put & get',
  anchors: {
    init: `Start with ${M} empty buckets`,
    hash: 'Hash the key to pick a bucket (key % 5)',
    walk: 'Walk that bucket’s chain, comparing keys',
    insert: 'put, key not found: add a new entry at the end',
    update: 'put, key found: replace its value',
    found: 'get, key found: return its value',
    missing: 'get, key not found: return nothing',
  },
  vars: [
    { name: 'key', role: 'focus' },
    { name: 'bucket', label: 'bucket = key % 5', role: 'value' },
    { name: 'size', label: 'entries stored', role: 'value' },
    { name: 'result', label: 'last get', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 'ops',
        label: 'Operations',
        kind: 'string',
        placeholder: 'e.g. put 12 a, put 8 b, get 12',
        help: `Up to ${LIMITS.maxN} operations, separated by commas: put KEY VALUE or get KEY. Keys are whole numbers ${LIMITS.min} to ${LIMITS.max}; values are 1 to 3 letters or digits.`,
      },
    ],
    parse: parseInput,
    format: ({ ops }) => ({ ops: formatOps(ops) }),
    presets: [
      {
        label: 'Collisions and lookups',
        value: {
          ops: [
            { op: 'put', key: 12, value: 'a' },
            { op: 'put', key: 8, value: 'b' },
            { op: 'put', key: 17, value: 'c' },
            { op: 'put', key: 12, value: 'd' },
            { op: 'get', key: 17 },
            { op: 'get', key: 22 },
          ],
        },
      },
      {
        label: 'Everything collides',
        value: {
          ops: [
            { op: 'put', key: 5, value: 'a' },
            { op: 'put', key: 10, value: 'b' },
            { op: 'put', key: 15, value: 'c' },
            { op: 'put', key: 20, value: 'd' },
            { op: 'get', key: 20 },
          ],
        },
      },
      {
        label: 'Spread out',
        value: {
          ops: [
            { op: 'put', key: 0, value: 'a' },
            { op: 'put', key: 1, value: 'b' },
            { op: 'put', key: 2, value: 'c' },
            { op: 'put', key: 3, value: 'd' },
            { op: 'get', key: 2 },
            { op: 'get', key: 4 },
          ],
        },
      },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      // A small pool of keys, so buckets collide and gets often hit.
      const pool = new Set<number>()
      const poolSize = randInt(rand, 3, 5)
      while (pool.size < poolSize) pool.add(randInt(rand, 0, 30))
      const keys = Array.from(pool)
      const count = randInt(rand, 4, LIMITS.maxN)
      const ops: PutGetOp[] = []
      for (let i = 0; i < count; i++) {
        const wantPut = i === 0 || rand() < 0.6
        if (wantPut) {
          ops.push({
            op: 'put',
            key: keys[randInt(rand, 0, keys.length - 1)],
            value: VALUE_LETTERS[randInt(rand, 0, VALUE_LETTERS.length - 1)],
          })
        } else {
          const key = rand() < 0.7 ? keys[randInt(rand, 0, keys.length - 1)] : randInt(rand, 0, 30)
          ops.push({ op: 'get', key })
        }
      }
      return { ops }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
