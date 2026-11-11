/**
 * Tries — helpers shared by tries/insert and tries/prefix-search.
 *
 * A trie is drawn as a TreeScene with edge labels. The letters live on the EDGES
 * (they are the keys of the parent's children map); the nodes themselves are
 * plain circles, the root shows a bullet. A double ring (`terminal`) marks a
 * node where a stored word ends.
 *
 * Node ids come from the path: the root is `t-`, the node reached by c, a, r is
 * `t-car`. Because the id never depends on insertion order, nodes keep their
 * identity from frame to frame and do not jump around. Children are kept in
 * alphabetical order, so a trie always reads like a dictionary, left to right.
 */
import type { InputLimits, MarkRole, ParseResult, PointerRole, TreeScene } from '@/lib/engine/types'

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

export const MAX_WORDS = 5
export const MAX_WORD_LEN = 6
/** Nodes including the root, so the picture stays readable. */
export const MAX_NODES = 14

/** `maxN` is the longest word or query; `min`..`max` are the character codes a-z. */
export const LIMITS: InputLimits = { maxN: MAX_WORD_LEN, min: 97, max: 122 }

const LOWER = /^[a-z]+$/

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** Number of nodes (root included) a trie built from `words` has. */
export function nodeCountOf(words: string[]): number {
  const prefixes = new Set<string>([''])
  for (const w of words) for (let i = 1; i <= w.length; i++) prefixes.add(w.slice(0, i))
  return prefixes.size
}

export function parseWords(text: string, field: string): ParseResult<string[]> {
  const tokens = text
    .replace(/["'[\]]/g, ' ')
    .split(/[\s,;]+/)
    .filter((t) => t !== '')
  if (tokens.length === 0) {
    return { ok: false, field, error: 'Type at least one word, like cat, car, card, dog.' }
  }
  if (tokens.length > MAX_WORDS) {
    return { ok: false, field, error: `Use at most ${MAX_WORDS} words so the picture stays readable.` }
  }
  for (const token of tokens) {
    if (!LOWER.test(token)) {
      return { ok: false, field, error: `"${token}" has characters other than a to z. Use lowercase letters only.` }
    }
    if (token.length > MAX_WORD_LEN) {
      return { ok: false, field, error: `"${token}" is ${token.length} letters. Use words of at most ${MAX_WORD_LEN} letters.` }
    }
  }
  const nodes = nodeCountOf(tokens)
  if (nodes > MAX_NODES) {
    return {
      ok: false,
      field,
      error: `Those words need ${nodes} nodes. Keep it to ${MAX_NODES} (root included): use shorter words, or words that share starts.`,
    }
  }
  return { ok: true, value: tokens }
}

export function parseQuery(text: string, field: string, noun: string): ParseResult<string> {
  const q = text.trim()
  if (q === '') return { ok: false, field, error: `Type a ${noun} to look for, like car.` }
  if (!LOWER.test(q)) {
    return { ok: false, field, error: `"${q}" has characters other than a to z. Use lowercase letters only.` }
  }
  if (q.length > MAX_WORD_LEN) {
    return { ok: false, field, error: `Use at most ${MAX_WORD_LEN} letters (you typed ${q.length}).` }
  }
  return { ok: true, value: q }
}

// ---------------------------------------------------------------------------
// The trie model
// ---------------------------------------------------------------------------

export const idOf = (path: string): string => `t-${path}`

/** A trie keyed by path (`''` is the root). */
export class TrieModel {
  private readonly ends = new Map<string, boolean>([['', false]])

  has(path: string): boolean {
    return this.ends.has(path)
  }
  add(path: string): void {
    if (!this.ends.has(path)) this.ends.set(path, false)
  }
  setWord(path: string): void {
    this.ends.set(path, true)
  }
  isWord(path: string): boolean {
    return this.ends.get(path) === true
  }
  get size(): number {
    return this.ends.size
  }
  /** Letters leaving `path`, in alphabetical order. */
  kids(path: string): string[] {
    const out: string[] = []
    for (const key of this.ends.keys()) {
      if (key.length === path.length + 1 && key.startsWith(path)) out.push(key[key.length - 1])
    }
    return out.sort()
  }
  /** All paths, root first, in depth-first alphabetical order. */
  paths(): string[] {
    return Array.from(this.ends.keys()).sort()
  }
  /** Stored words under `path` (itself included), alphabetical. */
  wordsUnder(path: string): string[] {
    return this.paths().filter((p) => p.startsWith(path) && this.ends.get(p) === true)
  }
}

export function buildModel(words: string[]): TrieModel {
  const m = new TrieModel()
  for (const w of words) {
    for (let i = 1; i <= w.length; i++) m.add(w.slice(0, i))
    m.setWord(w)
  }
  return m
}

// ---------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------

export interface SceneExtras {
  pointers?: Array<{ name: string; target: string | null; role: PointerRole }>
  marks?: Array<{ id: string; role: MarkRole }>
  edgeMarks?: NonNullable<TreeScene['edgeMarks']>
  annotations?: Array<{ target: string; text: string }>
}

export function treeScene(model: TrieModel, extra: SceneExtras = {}): TreeScene {
  const nodes: TreeScene['nodes'] = model.paths().map((path) => {
    const kids = model.kids(path)
    return {
      id: idOf(path),
      value: path === '' ? '•' : '',
      children: kids.map((c) => idOf(path + c)),
      edgeLabels: kids,
      terminal: model.isWord(path),
    }
  })
  const scene: TreeScene = { kind: 'tree', root: idOf(''), nodes }
  if (extra.pointers) scene.pointers = extra.pointers
  if (extra.marks) scene.marks = extra.marks
  if (extra.edgeMarks) scene.edgeMarks = extra.edgeMarks
  if (extra.annotations) scene.annotations = extra.annotations
  return scene
}

/** Words for narration: the root reads "the root", anything else 'car'. */
export function where(path: string): string {
  return path === '' ? 'the root' : `'${path}'`
}

/** Marks and edge marks for a walk that has reached `depth` letters of `word`. */
export function walkMarks(
  word: string,
  depth: number,
  curRole: MarkRole,
): { marks: Array<{ id: string; role: MarkRole }>; edgeMarks: NonNullable<TreeScene['edgeMarks']> } {
  const marks: Array<{ id: string; role: MarkRole }> = []
  const edgeMarks: NonNullable<TreeScene['edgeMarks']> = []
  for (let i = 0; i < depth; i++) {
    marks.push({ id: idOf(word.slice(0, i)), role: 'visited' })
    edgeMarks.push({ from: idOf(word.slice(0, i)), to: idOf(word.slice(0, i + 1)), role: 'visited' })
  }
  marks.push({ id: idOf(word.slice(0, depth)), role: curRole })
  return { marks, edgeMarks }
}

// ---------------------------------------------------------------------------
// Random words
// ---------------------------------------------------------------------------

/** Up to 5 short words, built to share starts, within the node budget. */
export function randomWords(rand: () => number, randInt: (r: () => number, a: number, b: number) => number): string[] {
  const pool = 'acdeiknoprst'.split('')
  const letters = Array.from({ length: randInt(rand, 4, 6) }, () => pool[randInt(rand, 0, pool.length - 1)])
  const pick = (): string => letters[randInt(rand, 0, letters.length - 1)]
  const fresh = (len: number): string => Array.from({ length: len }, pick).join('')

  const target = randInt(rand, 3, MAX_WORDS)
  const words: string[] = []
  while (words.length < target) {
    let w: string
    if (words.length > 0 && rand() < 0.65) {
      const base = words[randInt(rand, 0, words.length - 1)]
      const keep = randInt(rand, 1, base.length)
      const extra = rand() < 0.25 ? 0 : randInt(rand, 1, MAX_WORD_LEN - keep)
      w = (base.slice(0, keep) + fresh(Math.max(extra, 0))).slice(0, MAX_WORD_LEN)
    } else {
      w = fresh(randInt(rand, 2, MAX_WORD_LEN))
    }
    if (w === '') continue
    if (nodeCountOf([...words, w]) > MAX_NODES) {
      if (words.length >= 2) break
      continue
    }
    words.push(w)
  }
  return words
}

export const sortedDistinct = (words: string[]): string[] => Array.from(new Set(words)).sort()
