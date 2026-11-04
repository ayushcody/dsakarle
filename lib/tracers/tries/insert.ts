/**
 * Tries — insert words one letter at a time (the heart of LeetCode 208).
 *
 * For every word we start at the root and, for each letter, ask one question:
 * does an edge with this letter already leave the current node? If yes we reuse
 * it (that is how words share their starts); if not we create a new node. When
 * the last letter is placed we mark that node as the end of a word.
 *
 * Scene: a TreeScene drawn as a trie (see ./shared.ts). Letters sit on the
 * edges, nodes are plain circles, a double ring marks "a word ends here". Node
 * ids come from the path (`t-`, `t-c`, `t-ca`, ...), so nothing jumps between
 * frames. Per letter: `check` (the decision), `create` (only when the edge was
 * missing), `step` (move down). Per word: `start` and `mark`.
 *
 * Layout matches the other tracers: input, frame helpers, `run`, `reference`.
 * Code lives in content/code/tries/insert.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type { Frame, MarkRole, ParseResult, PredictCandidate, Tracer, Val } from '@/lib/engine/types'
import {
  LIMITS,
  MAX_NODES,
  MAX_WORDS,
  MAX_WORD_LEN,
  TrieModel,
  idOf,
  parseWords,
  randomWords,
  sortedDistinct,
  treeScene,
  walkMarks,
  where,
} from './shared'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface InsertInput {
  words: string[]
}

export interface InsertResult {
  /** Nodes in the finished trie, root included. */
  nodes: number
  /** Distinct stored words, alphabetical. */
  words: string[]
}

function parseInput(raw: Record<string, string>): ParseResult<InsertInput> {
  const parsed = parseWords(raw.words ?? '', 'words')
  if (!parsed.ok) return parsed
  return { ok: true, value: { words: parsed.value } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const REUSE = 'Yes: reuse it'
const CREATE = 'No: create it'

function reuseOrCreatePredict(words: string[], wi: number, k: number): PredictCandidate {
  const word = words[wi]
  const p = word.slice(0, k)
  const ch = word[k]
  const earlier = words.slice(0, wi).find((w) => w.startsWith(p + ch))
  return {
    tag: 'reuse-or-create',
    kind: 'choice',
    prompt: `Is there already an edge for '${ch}' from ${where(p)}?`,
    options: [REUSE, CREATE],
    answer: earlier !== undefined ? REUSE : CREATE,
    why:
      earlier !== undefined
        ? `The earlier word '${earlier}' already built the path to '${p + ch}', so '${word}' shares it.`
        : `No earlier word starts with '${p + ch}', so there is no such edge yet and a node must be created.`,
    hint: `Look for a branch labelled '${ch}' leaving ${where(p)}.`,
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ words }: InsertInput) {
  const rec = createRecorder<InsertResult>()
  const model = new TrieModel()
  let wordsDone = 0
  let letters = 0

  let typed = ''
  let nodeCount = 1

  const emit = (
    at: string,
    say: string,
    extra: {
      pointerAt?: string | null
      marks?: Array<{ id: string; role: MarkRole }>
      edgeMarks?: NonNullable<ReturnType<typeof walkMarks>['edgeMarks']>
      annotations?: Array<{ target: string; text: string }>
    },
    word: string,
    predict?: PredictCandidate,
  ): void => {
    const pointerAt = extra.pointerAt === undefined ? null : extra.pointerAt
    const vars: Record<string, Val> = { word, typed, nodes: nodeCount }
    const frame: Frame = {
      scene: treeScene(model, {
        pointers: pointerAt === null ? [] : [{ name: 'node', target: idOf(pointerAt), role: 'ptrB' }],
        marks: extra.marks ?? [],
        edgeMarks: extra.edgeMarks ?? [],
        annotations: extra.annotations ?? [],
      }),
      vars,
      say,
      at,
      gauge: { value: wordsDone, max: words.length, label: 'Words inserted' },
    }
    if (predict) frame.predict = predict
    rec.frame(frame)
  }

  for (let wi = 0; wi < words.length && !rec.capped; wi++) {
    const word = words[wi]
    typed = ''
    let createdForWord = 0

    // start: node = root
    emit(
      'start',
      wi === 0 ? `Insert "${word}": start at the root, the empty prefix.` : `Insert "${word}": go back to the root and start again.`,
      { pointerAt: '', ...walkMarks(word, 0, 'focus') },
      word,
      reuseOrCreatePredict(words, wi, 0),
    )

    for (let k = 0; k < word.length && !rec.capped; k++) {
      const p = word.slice(0, k)
      const ch = word[k]
      const child = p + ch
      const exists = model.has(child)

      // check: is there an edge for ch?
      const walk = walkMarks(word, k, 'focus')
      if (exists) {
        emit(
          'check',
          `An edge '${ch}' already leaves ${where(p)}, so we reuse it. No new node.`,
          {
            pointerAt: p,
            marks: walk.marks,
            edgeMarks: [...walk.edgeMarks, { from: idOf(p), to: idOf(child), role: 'focus' }],
            annotations: [{ target: `node:${idOf(p)}`, text: `'${ch}' edge exists` }],
          },
          word,
        )
      } else {
        emit(
          'check',
          `No edge '${ch}' leaves ${where(p)} yet, so we must create a node for it.`,
          {
            pointerAt: p,
            marks: walk.marks,
            edgeMarks: walk.edgeMarks,
            annotations: [{ target: `node:${idOf(p)}`, text: `no '${ch}' edge yet` }],
          },
          word,
        )
        // create: node.children[ch] = new node
        model.add(child)
        nodeCount++
        createdForWord++
        emit(
          'create',
          `Create a new node and label the edge '${ch}'. It stands for '${child}'.`,
          {
            pointerAt: p,
            marks: [...walk.marks, { id: idOf(child), role: 'changed' }],
            edgeMarks: [...walk.edgeMarks, { from: idOf(p), to: idOf(child), role: 'changed' }],
            annotations: [{ target: `node:${idOf(child)}`, text: 'new node' }],
          },
          word,
        )
      }

      // step: node = node.children[ch]
      typed = child
      letters++
      const after = walkMarks(word, k + 1, 'focus')
      emit(
        'step',
        `Move down the '${ch}' edge: we are now at '${child}'.`,
        { pointerAt: child, marks: after.marks, edgeMarks: after.edgeMarks },
        word,
        k + 1 < word.length ? reuseOrCreatePredict(words, wi, k + 1) : undefined,
      )
    }
    if (rec.capped) break

    // mark: node.is_word = True
    const wasWord = model.isWord(word)
    const noNewNodes = !wasWord && createdForWord === 0
    model.setWord(word)
    wordsDone++
    const end = walkMarks(word, word.length, wasWord ? 'found' : 'changed')
    emit(
      'mark',
      wasWord
        ? `"${word}" was already stored: its end node already has a ring, so nothing changes.`
        : noNewNodes
          ? `Add the ring: "${word}" ends here. No new nodes, since it was already on the path of a longer word.`
          : `Add the double ring: a word ends at '${word}'.`,
      {
        pointerAt: word,
        marks: end.marks,
        edgeMarks: end.edgeMarks,
        annotations: [{ target: `node:${idOf(word)}`, text: wasWord ? 'already a word' : `end of "${word}"` }],
      },
      word,
    )
  }

  // return root
  const wordNodes = model.paths().filter((path) => model.isWord(path))
  const saved = letters - (nodeCount - 1)
  typed = ''
  emit(
    'done',
    saved > 0
      ? `All ${words.length} words stored: ${letters} letters typed, ${nodeCount - 1} nodes made, ${saved} letters rode on shared edges.`
      : `All ${words.length} words stored: no word shared a start, so every letter needed its own node.`,
    { pointerAt: null, marks: wordNodes.map((path) => ({ id: idOf(path), role: 'found' as const })) },
    '',
  )

  return rec.done({ nodes: model.size, words: sortedDistinct(words) })
}

/** Independent version: a trie has one node per distinct prefix, plus the root. */
function reference({ words }: InsertInput): InsertResult {
  const prefixes = new Set<string>()
  for (const w of words) for (let i = 1; i <= w.length; i++) prefixes.add(w.slice(0, i))
  return { nodes: 1 + prefixes.size, words: Array.from(new Set(words)).sort() }
}

const tracer: Tracer<InsertInput, InsertResult> = {
  id: 'tries/insert',
  title: 'Insert words',
  anchors: {
    start: 'Start at the root for each word',
    check: 'Is there an edge for this letter?',
    create: 'No: create a new node for it',
    step: 'Move down to that child',
    mark: 'Mark the last node as the end of a word',
    done: 'Return the finished trie',
  },
  vars: [
    { name: 'word', label: 'word', role: 'focus' },
    { name: 'typed', label: 'prefix so far', role: 'value' },
    { name: 'nodes', label: 'nodes (root included)', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 'words',
        label: 'Words to insert',
        kind: 'string-array',
        placeholder: 'e.g. cat, car, card, dog',
        help: `Up to ${MAX_WORDS} words of at most ${MAX_WORD_LEN} lowercase letters (a to z), separated by commas. The trie may have at most ${MAX_NODES} nodes.`,
      },
    ],
    parse: parseInput,
    format: ({ words }) => ({ words: words.join(', ') }),
    presets: [
      { label: 'Shared starts: cat, car, card, dog', value: { words: ['cat', 'car', 'card', 'dog'] } },
      { label: 'A prefix after its word: apple, app, apply, ape', value: { words: ['apple', 'app', 'apply', 'ape'] } },
      { label: 'Nothing in common: sun, map, hat', value: { words: ['sun', 'map', 'hat'] } },
    ],
    random(seed) {
      return { words: randomWords(mulberry32(seed), randInt) }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
