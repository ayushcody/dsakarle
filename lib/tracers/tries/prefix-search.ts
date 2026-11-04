/**
 * Tries — search(word) versus startsWith(prefix), plus autocomplete.
 *
 * The trie is already built from the word list. We walk it one letter of the
 * query at a time. If an edge is missing the search stops: nothing stored
 * matches. If every letter matches we have reached a node, and then the two
 * questions differ:
 *   word mode    search(word)       true only if that node has the end-of-word ring
 *   prefix mode  startsWith(prefix) true for any node; then we also list every
 *                stored word below that node with a depth-first walk (autocomplete)
 *
 * Words need not be leaves: "car" and "card" both end words, one on the path
 * of the other. Locating the node costs O(L); listing costs one visit per node
 * below it, so it grows with the output.
 *
 * Scene: the same trie as tries/insert (see ./shared.ts). Code lives in
 * content/code/tries/prefix-search.{py,java,cpp}.
 */
import { mulberry32, randInt } from '../rng'
import { createRecorder } from '@/lib/engine/recorder'
import type { Frame, MarkRole, ParseResult, PredictCandidate, Tracer, Val } from '@/lib/engine/types'
import {
  LIMITS,
  MAX_NODES,
  MAX_WORDS,
  MAX_WORD_LEN,
  buildModel,
  idOf,
  parseQuery,
  parseWords,
  randomWords,
  treeScene,
  walkMarks,
  where,
} from './shared'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export type SearchMode = 'word' | 'prefix'

export interface PrefixSearchInput {
  words: string[]
  query: string
  mode: SearchMode
}

export interface PrefixSearchResult {
  /** word mode: is the word stored? prefix mode: does any stored word start with it? */
  found: boolean
  /** word mode: [query] or []. prefix mode: every stored word starting with the query, alphabetical. */
  words: string[]
}

function parseInput(raw: Record<string, string>): ParseResult<PrefixSearchInput> {
  const words = parseWords(raw.words ?? '', 'words')
  if (!words.ok) return words
  const mode = (raw.mode ?? '').trim().toLowerCase()
  if (mode !== 'word' && mode !== 'prefix') {
    return { ok: false, field: 'mode', error: 'Type word (is it stored?) or prefix (what starts with it?).' }
  }
  const query = parseQuery(raw.query ?? '', 'query', mode)
  if (!query.ok) return query
  return { ok: true, value: { words: words.value, query: query.value, mode } }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

const YES = 'Yes'
const NO = 'No'
const A_WORD = 'A stored word'
const ONLY_PREFIX = 'Only a prefix'

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`

function edgeExistsPredict(words: string[], query: string, k: number): PredictCandidate {
  const p = query.slice(0, k)
  const ch = query[k]
  const through = words.find((w) => w.startsWith(p + ch))
  return {
    tag: 'edge-exists',
    kind: 'choice',
    prompt: `We are at ${where(p)}. Is there an edge '${ch}' leaving it?`,
    options: [YES, NO],
    answer: through !== undefined ? YES : NO,
    why:
      through !== undefined
        ? `The stored word '${through}' starts with '${p + ch}', so its path uses that edge.`
        : `No stored word starts with '${p + ch}', so there is no such edge and the walk stops here.`,
    hint: `Look for a branch labelled '${ch}' below ${where(p)}.`,
  }
}

function isWordPredict(words: string[], query: string): PredictCandidate {
  const stored = words.includes(query)
  const longer = Array.from(new Set(words)).filter((w) => w !== query && w.startsWith(query)).sort()
  return {
    tag: 'is-word',
    kind: 'choice',
    prompt: `We reached '${query}'. Is '${query}' a stored word or just a prefix?`,
    options: [A_WORD, ONLY_PREFIX],
    answer: stored ? A_WORD : ONLY_PREFIX,
    why: stored
      ? longer.length > 0
        ? `'${query}' has a double ring, so it was stored as a word, even though ${longer.join(', ')} continue below it.`
        : `'${query}' has a double ring: a word ends here.`
      : `No ring here. '${query}' is only the start of ${longer.join(', ')}, so it was never stored on its own.`,
    hint: 'Look for the double ring on the node.',
  }
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

function run({ words, query, mode }: PrefixSearchInput) {
  const rec = createRecorder<PrefixSearchResult>()
  const model = buildModel(words)
  const L = query.length
  let matched = ''
  let collected: string[] = []

  const emit = (
    at: string,
    say: string,
    extra: {
      pointerAt?: string | null
      marks?: Array<{ id: string; role: MarkRole }>
      edgeMarks?: NonNullable<ReturnType<typeof walkMarks>['edgeMarks']>
      annotations?: Array<{ target: string; text: string }>
    },
    predict?: PredictCandidate,
  ): void => {
    const pointerAt = extra.pointerAt === undefined ? null : extra.pointerAt
    const vars: Record<string, Val> = { query, matched, words: collected.slice() }
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
      gauge: { value: matched.length, max: L, label: 'Letters matched' },
    }
    if (predict) frame.predict = predict
    rec.frame(frame)
  }

  // start: node = root
  emit(
    'start',
    `${mode === 'word' ? 'search' : 'startsWith'}("${query}"): start at the root and follow the letters one at a time.`,
    { pointerAt: '', ...walkMarks(query, 0, 'focus') },
    edgeExistsPredict(words, query, 0),
  )

  for (let k = 0; k < L && !rec.capped; k++) {
    const p = query.slice(0, k)
    const ch = query[k]
    const child = p + ch
    const walk = walkMarks(query, k, 'focus')

    // check: is there an edge for ch?
    if (!model.has(child)) {
      emit(
        'check',
        `No edge '${ch}' leaves ${where(p)}, so no stored word starts with '${child}'.`,
        {
          pointerAt: p,
          marks: [...walk.marks.slice(0, -1), { id: idOf(p), role: 'error' }],
          edgeMarks: walk.edgeMarks,
          annotations: [{ target: `node:${idOf(p)}`, text: `no '${ch}' edge` }],
        },
      )
      // return nothing
      emit(
        'done',
        mode === 'word'
          ? `Return false: "${query}" is not stored, because no '${ch}' edge leaves ${where(p)}.`
          : `Return nothing: no stored word starts with "${query}".`,
        {
          pointerAt: p,
          marks: [...walk.marks.slice(0, -1), { id: idOf(p), role: 'error' }],
          edgeMarks: walk.edgeMarks,
        },
      )
      return rec.done({ found: false, words: [] })
    }
    emit(
      'check',
      `An edge '${ch}' leaves ${where(p)}: some stored word starts with '${child}'.`,
      {
        pointerAt: p,
        marks: walk.marks,
        edgeMarks: [...walk.edgeMarks, { from: idOf(p), to: idOf(child), role: 'focus' }],
      },
    )

    // step: node = node.children[ch]
    matched = child
    const after = walkMarks(query, k + 1, 'focus')
    emit(
      'step',
      `Follow the '${ch}' edge: we are now at '${child}'.`,
      { pointerAt: child, marks: after.marks, edgeMarks: after.edgeMarks },
      k + 1 < L ? edgeExistsPredict(words, query, k + 1) : isWordPredict(words, query),
    )
  }
  if (rec.capped) return rec.done({ found: false, words: [] })

  // verdict: every letter matched. Does the node end a word?
  const isWord = model.isWord(query)
  const below = model.wordsUnder(query).filter((w) => w !== query)
  const full = walkMarks(query, L, 'found')
  if (mode === 'word') {
    if (isWord) {
      emit('verdict', `'${query}' has the double ring: a word ends here, so search is true.`, {
        pointerAt: query,
        marks: full.marks,
        edgeMarks: full.edgeMarks,
        annotations: [{ target: `node:${idOf(query)}`, text: 'ring: a stored word' }],
      })
      emit('done', `Return true: "${query}" is a stored word.`, { pointerAt: query, marks: full.marks, edgeMarks: full.edgeMarks })
      return rec.done({ found: true, words: [query] })
    }
    const errMarks = [...full.marks.slice(0, -1), { id: idOf(query), role: 'error' as const }]
    emit('verdict', `All ${plural(L, 'letter', 'letters')} matched, but '${query}' has no ring: it is only the start of ${below.join(', ')}.`, {
      pointerAt: query,
      marks: errMarks,
      edgeMarks: full.edgeMarks,
      annotations: [{ target: `node:${idOf(query)}`, text: 'no ring: not a word' }],
    })
    emit('done', `Return false: "${query}" is only a prefix, not a stored word.`, { pointerAt: query, marks: errMarks, edgeMarks: full.edgeMarks })
    return rec.done({ found: false, words: [] })
  }

  emit(
    'verdict',
    isWord
      ? `All ${plural(L, 'letter', 'letters')} matched, so '${query}' is a valid prefix. It is also a word itself.`
      : `All ${plural(L, 'letter', 'letters')} matched, so '${query}' is a valid prefix. Now list every word below it.`,
    { pointerAt: query, marks: full.marks, edgeMarks: full.edgeMarks },
  )

  // collect: depth-first walk below the prefix node, alphabetical
  const foundNodes: string[] = []
  const subtree = model.paths().filter((path) => path.startsWith(query))
  for (const path of subtree) {
    if (rec.capped) break
    if (model.isWord(path)) {
      collected = [...collected, path]
      foundNodes.push(path)
    }
    const ends = model.isWord(path)
    emit(
      'collect',
      ends
        ? `Visit '${path}': it has a ring, so add it. Found so far: ${collected.join(', ')}.`
        : `Visit '${path}': no ring here, so just keep walking down.`,
      {
        pointerAt: path,
        marks: [
          ...walkMarks(query, L, 'visited').marks.slice(0, -1),
          { id: idOf(query), role: 'visited' as const },
          ...foundNodes.map((id) => ({ id: idOf(id), role: 'found' as const })),
          { id: idOf(path), role: 'focus' as const },
        ],
        edgeMarks: walkMarks(query, L, 'visited').edgeMarks,
        annotations: collected.length > 0 ? [{ target: `node:${idOf(query)}`, text: `found: ${collected.join(', ')}` }] : [],
      },
    )
  }

  // return words
  emit(
    'done',
    `Autocomplete for "${query}": ${collected.join(', ')}. Reaching "${query}" took ${plural(L, 'step', 'steps')}, then we visited ${plural(subtree.length, 'node', 'nodes')}.`,
    {
      pointerAt: null,
      marks: foundNodes.map((id) => ({ id: idOf(id), role: 'found' as const })),
      edgeMarks: walkMarks(query, L, 'visited').edgeMarks,
      annotations: [{ target: `node:${idOf(query)}`, text: `found: ${collected.join(', ')}` }],
    },
  )
  return rec.done({ found: true, words: collected })
}

/** Independent version: filter the plain word list, no trie involved. */
function reference({ words, query, mode }: PrefixSearchInput): PrefixSearchResult {
  const distinct = Array.from(new Set(words)).sort()
  if (mode === 'word') {
    const hit = distinct.includes(query)
    return { found: hit, words: hit ? [query] : [] }
  }
  const matches = distinct.filter((w) => w.startsWith(query))
  return { found: matches.length > 0, words: matches }
}

const tracer: Tracer<PrefixSearchInput, PrefixSearchResult> = {
  id: 'tries/prefix-search',
  title: 'Search & autocomplete',
  anchors: {
    start: 'Start at the root',
    check: 'Is there an edge for the next letter?',
    step: 'Follow it to the child',
    verdict: 'All letters matched: does this node end a word?',
    collect: 'Prefix mode: collect every word below (depth-first)',
    done: 'Return the result',
  },
  vars: [
    { name: 'query', label: 'query', role: 'focus' },
    { name: 'matched', label: 'letters matched', role: 'value' },
    { name: 'words', label: 'words found', role: 'best' },
  ],
  input: {
    fields: [
      {
        name: 'words',
        label: 'Stored words',
        kind: 'string-array',
        placeholder: 'e.g. cat, car, card, dog',
        help: `Up to ${MAX_WORDS} words of at most ${MAX_WORD_LEN} lowercase letters (a to z), separated by commas. The trie may have at most ${MAX_NODES} nodes.`,
      },
      {
        name: 'query',
        label: 'Word or prefix to look for',
        kind: 'string',
        placeholder: 'e.g. car',
        help: `Up to ${MAX_WORD_LEN} lowercase letters.`,
      },
      {
        name: 'mode',
        label: 'Mode',
        kind: 'string',
        placeholder: 'word or prefix',
        help: 'word asks "is this exact word stored?" (search). prefix asks "does anything start with this?" and lists the matches (startsWith + autocomplete).',
      },
    ],
    parse: parseInput,
    format: ({ words, query, mode }) => ({ words: words.join(', '), query, mode }),
    presets: [
      { label: 'Autocomplete: prefix "car"', value: { words: ['cat', 'car', 'card', 'dog'], query: 'car', mode: 'prefix' } },
      { label: 'A prefix is not a word: search "ca"', value: { words: ['cat', 'car', 'card', 'dog'], query: 'ca', mode: 'word' } },
      { label: 'Falls off the trie: search "cart"', value: { words: ['cat', 'car', 'card', 'dog'], query: 'cart', mode: 'word' } },
    ],
    random(seed) {
      const rand = mulberry32(seed)
      const words = randomWords(rand, randInt)
      const mode: SearchMode = rand() < 0.5 ? 'word' : 'prefix'
      const base = words[randInt(rand, 0, words.length - 1)]
      const roll = rand()
      let query: string
      if (roll < 0.55) {
        // a stored word (word mode) or a prefix of one (prefix mode)
        query = mode === 'word' ? base : base.slice(0, randInt(rand, 1, base.length))
      } else if (roll < 0.8) {
        // a prefix of a stored word: search says false, startsWith says true
        query = base.slice(0, randInt(rand, 1, base.length))
      } else {
        // a near miss: change the last letter, or add one
        const letter = String.fromCharCode(97 + randInt(rand, 0, 25))
        query = base.length < MAX_WORD_LEN && rand() < 0.5 ? base + letter : base.slice(0, -1) + letter
        if (query === '') query = letter
      }
      return { words, query, mode }
    },
    limits: LIMITS,
  },
  run,
  reference,
}

export default tracer
