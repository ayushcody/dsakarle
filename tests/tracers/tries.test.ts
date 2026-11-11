/**
 * Extra checks for the tries tracers (insert, prefix-search). The generic
 * contract suite runs from registry.test.ts; the harness only deep-checks array
 * scenes, so this file checks the trie (tree) scenes: path-derived ids, labelled
 * edges in order, terminal rings that match the stored words, marks and notes
 * that point at real nodes, that predict answers are true, the teaching beats of
 * each default preset, and the input rules.
 */
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { lessonV2Schema } from '@/lib/content-schema'
import type { LessonV2 } from '@/types/learning'
import insert from '@/lib/tracers/tries/insert'
import type { InsertInput } from '@/lib/tracers/tries/insert'
import prefixSearch from '@/lib/tracers/tries/prefix-search'
import type { PrefixSearchInput } from '@/lib/tracers/tries/prefix-search'
import { MAX_NODES, nodeCountOf } from '@/lib/tracers/tries/shared'
import type { AnyTracer, Frame, TreeScene } from '@/lib/engine/types'

const tracers: AnyTracer[] = [insert, prefixSearch]

function tree(frame: Frame): TreeScene {
  if (frame.scene.kind !== 'tree') throw new Error(`expected a tree scene, got ${frame.scene.kind}`)
  return frame.scene
}

function allRuns<I>(tracer: AnyTracer): Array<{ input: I; frames: Frame[] }> {
  const inputs = [...tracer.input.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => tracer.input.random(i + 1))]
  return inputs.map((input) => ({ input: input as I, frames: tracer.run(input).frames }))
}

const idOf = (path: string): string => `t-${path}`

/** Paths of every node in a scene, from the ids. */
function pathsOf(scene: TreeScene): string[] {
  return scene.nodes.map((n) => n.id.slice(2))
}

/** Words ringed in a scene. */
function ringed(scene: TreeScene): string[] {
  return scene.nodes.filter((n) => n.terminal).map((n) => n.id.slice(2)).sort()
}

// ---------------------------------------------------------------------------
// Scene sanity
// ---------------------------------------------------------------------------

describe.each(tracers)('$id: trie scenes are well formed', (tracer) => {
  it('has path ids, ordered labelled edges, rings, and marks that point at real nodes', () => {
    for (const { frames } of allRuns(tracer)) {
      frames.forEach((frame, i) => {
        const where = `${tracer.id} frame ${i} (${frame.at})`
        const scene = tree(frame)
        expect(scene.root, `${where}: root`).toBe('t-')
        const ids = scene.nodes.map((n) => n.id)
        const known = new Set(ids)
        expect(known.size, `${where}: duplicate node ids`).toBe(ids.length)
        expect(known.has('t-'), `${where}: root node present`).toBe(true)
        expect(ids.length, `${where}: at most ${MAX_NODES} nodes`).toBeLessThanOrEqual(MAX_NODES)

        for (const n of scene.nodes) {
          expect(n.id, `${where}: node id`).toMatch(/^t-[a-z]*$/)
          expect(n.value, `${where}: letters live on edges, not in nodes`).toBe(n.id === 't-' ? '•' : '')
          expect(typeof n.terminal, `${where}: terminal is explicit`).toBe('boolean')
          expect(n.edgeLabels, `${where}: edge labels`).toBeDefined()
          expect(n.edgeLabels!.length).toBe(n.children.length)
          const path = n.id.slice(2)
          n.children.forEach((c, k) => {
            const label = n.edgeLabels![k]
            expect(label, `${where}: label`).toMatch(/^[a-z]$/)
            expect(c, `${where}: child id follows the path`).toBe(idOf(path + label))
            expect(known.has(c as string), `${where}: child ${c} exists`).toBe(true)
          })
          expect(n.edgeLabels, `${where}: children in alphabetical order`).toEqual([...n.edgeLabels!].sort())
          if (path !== '') expect(known.has(idOf(path.slice(0, -1))), `${where}: parent of ${path} exists`).toBe(true)
        }
        for (const m of scene.marks ?? []) expect(known.has(m.id), `${where}: mark on unknown node ${m.id}`).toBe(true)
        for (const p of scene.pointers ?? []) {
          if (p.target !== null) expect(known.has(p.target), `${where}: pointer ${p.name} targets unknown node`).toBe(true)
        }
        for (const e of scene.edgeMarks ?? []) {
          const parent = scene.nodes.find((n) => n.id === e.from)
          expect(parent?.children.includes(e.to), `${where}: edge mark ${e.from} -> ${e.to} is a real edge`).toBe(true)
        }
        for (const a of scene.annotations ?? []) {
          const [kind, id] = a.target.split(':')
          if (kind === 'node') expect(known.has(id), `${where}: note on unknown node ${id}`).toBe(true)
          expect(a.text.split(/\s+/).length, `${where}: note "${a.text}" is longer than 6 words`).toBeLessThanOrEqual(6)
        }
      })
    }
  })

  it('keeps node ids stable: a node never disappears while a word is inserted or searched', () => {
    for (const { frames } of allRuns(tracer)) {
      let before = new Set<string>()
      for (const frame of frames) {
        const now = new Set(tree(frame).nodes.map((n) => n.id))
        for (const id of before) expect(now.has(id), `${tracer.id}: node ${id} vanished`).toBe(true)
        before = now
      }
    }
  })
})

// ---------------------------------------------------------------------------
// tries/insert
// ---------------------------------------------------------------------------

describe('tries/insert: default preset', () => {
  const input = insert.input.presets[0].value as InsertInput
  const { frames, result } = insert.run(input)

  it('inserts cat, car, card, dog into a 9-node trie', () => {
    expect(input.words).toEqual(['cat', 'car', 'card', 'dog'])
    expect(result).toEqual({ nodes: 9, words: ['car', 'card', 'cat', 'dog'] })
    expect(frames).toHaveLength(43)
    expect(frames[0].at).toBe('start')
    expect(frames[frames.length - 1].at).toBe('done')
  })

  it('creates exactly the missing nodes: 8 creates, 5 reuses', () => {
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect(count('create')).toBe(8)
    expect(count('check')).toBe(13)
    expect(count('step')).toBe(13)
    expect(count('mark')).toBe(4)
    expect(count('start')).toBe(4)
    const reuses = frames.filter((f) => f.at === 'check' && f.say.includes('already leaves'))
    expect(reuses).toHaveLength(5)
  })

  it('grows one node per create frame and ends with every word ringed', () => {
    let nodes = 1
    for (const f of frames) {
      if (f.at === 'create') nodes++
      expect(tree(f).nodes, `${f.at}: node count`).toHaveLength(f.at === 'create' ? nodes : nodes)
    }
    expect(ringed(tree(frames[frames.length - 1]))).toEqual(['car', 'card', 'cat', 'dog'])
    expect(frames[frames.length - 1].vars.nodes).toBe(9)
  })
})

describe('tries/insert: rings and nodes follow the words', () => {
  it('rings a node only on its mark frame, and never rings a prefix that was not inserted', () => {
    for (const { input, frames } of allRuns<InsertInput>(insert)) {
      const stored = new Set<string>()
      frames.forEach((frame, i) => {
        if (frame.at === 'mark') stored.add(frame.vars.word as string)
        expect(ringed(tree(frame)), `frame ${i} (${frame.at}) ${JSON.stringify(input.words)}`).toEqual([...stored].sort())
      })
    }
  })

  it('the finished trie has one node per distinct prefix plus the root', () => {
    for (const { input, frames } of allRuns<InsertInput>(insert)) {
      const last = tree(frames[frames.length - 1])
      expect(last.nodes.length).toBe(nodeCountOf(input.words))
      expect(pathsOf(last).sort()).toEqual(
        Array.from(new Set(['', ...input.words.flatMap((w) => Array.from({ length: w.length }, (_, k) => w.slice(0, k + 1)))])).sort(),
      )
    }
  })

  it('the pointer follows the word: check and create sit on the parent, step on the child', () => {
    for (const { frames } of allRuns<InsertInput>(insert)) {
      for (const f of frames) {
        const at = tree(f).pointers?.[0]?.target ?? null
        if (f.at === 'check' || f.at === 'create' || f.at === 'step' || f.at === 'mark') {
          expect(at, `${f.at}`).not.toBeNull()
          expect((f.vars.typed as string).length <= (f.vars.word as string).length).toBe(true)
        }
        if (f.at === 'done') expect(at).toBeNull()
      }
    }
  })
})

describe('tries/insert: predicts tell the truth', () => {
  it('reuse-or-create matches whether the next frame creates a node', () => {
    let asked = 0
    for (const { frames } of allRuns<InsertInput>(insert)) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        asked++
        expect(p.tag).toBe('reuse-or-create')
        const next = frames[i + 1]
        expect(next.at, 'the reveal frame is the check').toBe('check')
        const reused = next.say.includes('already leaves')
        expect(p.answer, `${frame.say} / ${next.say}`).toBe(reused ? 'Yes: reuse it' : 'No: create it')
        // and the frame after a "create" answer really creates
        expect(frames[i + 2].at).toBe(reused ? 'step' : 'create')
        expect(p.prompt).toMatch(/^Is there already an edge for '[a-z]' from (the root|'[a-z]+')\?$/)
      })
    }
    expect(asked).toBeGreaterThan(100)
  })

  it('the default preset asks about r from ca', () => {
    const { frames } = insert.run(insert.input.presets[0].value)
    const prompts = frames.filter((f) => f.predict).map((f) => f.predict!.prompt)
    expect(prompts).toContain("Is there already an edge for 'r' from 'ca'?")
  })
})

describe('tries/insert: edge cases', () => {
  it('a word that is a prefix of an earlier word creates no node, only a ring', () => {
    const { frames, result } = insert.run({ words: ['apple', 'app'] })
    expect(result.nodes).toBe(6)
    const lastWord = frames.filter((f) => f.at === 'mark').pop()!
    expect(lastWord.say).toMatch(/No new nodes/)
    expect(frames.filter((f) => f.at === 'create')).toHaveLength(5)
  })

  it('inserting the same word twice changes nothing the second time', () => {
    const { frames, result } = insert.run({ words: ['cat', 'cat'] })
    expect(result).toEqual({ nodes: 4, words: ['cat'] })
    expect(frames.filter((f) => f.at === 'create')).toHaveLength(3)
    expect(frames.filter((f) => f.at === 'mark').pop()!.say).toMatch(/already stored/)
  })

  it('a single one-letter word still draws as a trie', () => {
    const { frames } = insert.run({ words: ['a'] })
    expect(tree(frames[0]).nodes.every((n) => n.terminal !== undefined)).toBe(true)
  })
})

describe('tries/insert: input rules', () => {
  const parse = (words: string) => insert.input.parse({ words })
  it('accepts commas, spaces and brackets', () => {
    expect(parse('cat car')).toEqual({ ok: true, value: { words: ['cat', 'car'] } })
    expect(parse('["cat", "car"]')).toEqual({ ok: true, value: { words: ['cat', 'car'] } })
  })
  it.each([
    ['uppercase', 'Cat, car', /lowercase/],
    ['digits', 'cat, c4r', /a to z/],
    ['a word over 6 letters', 'cat, abcdefg', /at most 6 letters/],
    ['six words', 'a, b, c, d, e, f', /at most 5 words/],
    ['too many nodes', 'abcdef, ghijkl, mnopqr', /nodes/],
  ])('rejects %s kindly', (_label, text, pattern) => {
    const r = parse(text)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error).toMatch(pattern)
      expect(r.field).toBe('words')
    }
  })
})

// ---------------------------------------------------------------------------
// tries/prefix-search
// ---------------------------------------------------------------------------

const ps = prefixSearch.input
const psPreset = (i: number): PrefixSearchInput => ps.presets[i].value as PrefixSearchInput

describe('tries/prefix-search: default presets', () => {
  it('prefix "car": 3 letters walked, then car and card are collected', () => {
    const { frames, result } = prefixSearch.run(psPreset(0))
    expect(result).toEqual({ found: true, words: ['car', 'card'] })
    expect(frames.map((f) => f.at)).toEqual([
      'start', 'check', 'step', 'check', 'step', 'check', 'step', 'verdict', 'collect', 'collect', 'done',
    ])
    expect(frames[frames.length - 1].say).toMatch(/car, card/)
    expect(tree(frames[frames.length - 1]).marks?.map((m) => m.id).sort()).toEqual(['t-car', 't-card'])
  })

  it('search "ca": the path exists but there is no ring, so false', () => {
    const { frames, result } = prefixSearch.run(psPreset(1))
    expect(result).toEqual({ found: false, words: [] })
    const verdict = frames.find((f) => f.at === 'verdict')!
    expect(verdict.say).toMatch(/no ring/)
    expect(tree(verdict).marks?.find((m) => m.id === 't-ca')?.role).toBe('error')
    expect(frames.map((f) => f.at)).toEqual(['start', 'check', 'step', 'check', 'step', 'verdict', 'done'])
  })

  it('search "cart": walks three edges, then fails on a missing t (error)', () => {
    const { frames, result } = prefixSearch.run(psPreset(2))
    expect(result).toEqual({ found: false, words: [] })
    const bad = frames.filter((f) => f.at === 'check').pop()!
    expect(bad.say).toMatch(/No edge 't' leaves 'car'/)
    expect(tree(bad).marks?.find((m) => m.id === 't-car')?.role).toBe('error')
    expect(frames.map((f) => f.at)).toEqual(['start', 'check', 'step', 'check', 'step', 'check', 'step', 'check', 'done'])
  })
})

describe('tries/prefix-search: results', () => {
  it('prefix mode lists words alphabetically, including a word that is also a prefix (cat and cats)', () => {
    const r = prefixSearch.run({ words: ['cats', 'cat', 'cow'], query: 'ca', mode: 'prefix' }).result
    expect(r).toEqual({ found: true, words: ['cat', 'cats'] })
    const w = prefixSearch.run({ words: ['cats', 'cat', 'cow'], query: 'cat', mode: 'word' }).result
    expect(w).toEqual({ found: true, words: ['cat'] })
  })

  it('collect frames add words in alphabetical order and annotate the prefix node', () => {
    for (const { input, frames } of allRuns<PrefixSearchInput>(prefixSearch)) {
      const collects = frames.filter((f) => f.at === 'collect')
      if (input.mode === 'word') expect(collects).toHaveLength(0)
      let seen: string[] = []
      for (const f of collects) {
        const words = f.vars.words as string[]
        expect(words.slice(0, seen.length)).toEqual(seen)
        expect(words).toEqual([...words].sort())
        seen = words
      }
    }
  })

  it('never lists more than the trie holds, and the done frame carries the result', () => {
    for (const { input, frames } of allRuns<PrefixSearchInput>(prefixSearch)) {
      const last = frames[frames.length - 1]
      expect(last.at).toBe('done')
      expect(last.vars.matched).toBeDefined()
      const result = prefixSearch.run(input).result
      if (input.mode === 'prefix' && result.found) expect(last.say).toContain(result.words.join(', '))
    }
  })
})

describe('tries/prefix-search: predicts tell the truth', () => {
  it('edge-exists is answered by the next (check) frame; is-word by the verdict frame', () => {
    let edge = 0
    let word = 0
    for (const { input, frames } of allRuns<PrefixSearchInput>(prefixSearch)) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        const next = frames[i + 1]
        if (p.tag === 'edge-exists') {
          edge++
          expect(next.at).toBe('check')
          const ok = next.say.startsWith('An edge')
          expect(p.answer, `${p.prompt} / ${next.say}`).toBe(ok ? 'Yes' : 'No')
          expect(frames[i + 2].at).toBe(ok ? 'step' : 'done')
          const m = /^We are at (?:the root|'([a-z]+)')\. Is there an edge '([a-z])' leaving it\?$/.exec(p.prompt)!
          expect(m, p.prompt).not.toBeNull()
          expect(input.words.some((w) => w.startsWith((m[1] ?? '') + m[2]))).toBe(ok)
        } else {
          word++
          expect(p.tag).toBe('is-word')
          expect(next.at).toBe('verdict')
          expect(p.answer).toBe(input.words.includes(input.query) ? 'A stored word' : 'Only a prefix')
          expect(tree(next).nodes.find((n) => n.id === idOf(input.query))?.terminal).toBe(input.words.includes(input.query))
          expect(p.prompt).toBe(`We reached '${input.query}'. Is '${input.query}' a stored word or just a prefix?`)
        }
      })
    }
    expect(edge).toBeGreaterThan(100)
    expect(word).toBeGreaterThan(50)
  })

  it('the guided run asks about "car": a stored word that also has words below it', () => {
    const { frames } = prefixSearch.run(psPreset(0))
    const p = frames.find((f) => f.predict?.tag === 'is-word')!.predict!
    expect(p.answer).toBe('A stored word')
    expect(p.why).toMatch(/card/)
  })
})

describe('tries/prefix-search: input rules', () => {
  const base = { words: 'cat, car, card, dog', query: 'car', mode: 'prefix' }
  it('accepts both modes', () => {
    expect(ps.parse(base).ok).toBe(true)
    expect(ps.parse({ ...base, mode: 'Word' }).ok).toBe(true)
  })
  it.each([
    ['unknown mode', { mode: 'search' }, 'mode'],
    ['uppercase query', { query: 'Car' }, 'query'],
    ['query over 6 letters', { query: 'abcdefg' }, 'query'],
    ['query with a space', { query: 'ca r' }, 'query'],
    ['too many words', { words: 'a, b, c, d, e, f' }, 'words'],
  ])('rejects %s', (_label, override, field) => {
    const r = ps.parse({ ...base, ...override })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.field).toBe(field)
  })
})

// ---------------------------------------------------------------------------
// The lesson file
// ---------------------------------------------------------------------------

describe('content/topics/tries.json', () => {
  const root = fileURLToPath(new URL('../../', import.meta.url))
  const lesson = JSON.parse(fs.readFileSync(`${root}content/topics/tries.json`, 'utf8')) as LessonV2

  it('is a v2 lesson that passes the schema', () => {
    expect(lesson.schemaVersion).toBe(2)
    expect(lessonV2Schema.safeParse(lesson).success).toBe(true)
  })

  it('draws its Picture as a trie, and every callout points at a node that exists', () => {
    const scene = lesson.shape.scene
    expect(scene.kind).toBe('tree')
    if (scene.kind !== 'tree') return
    const ids = new Set(scene.nodes.map((n) => n.id))
    expect(ids.has('t-')).toBe(true)
    for (const c of lesson.shape.callouts) {
      expect(c.target).toMatch(/^node:/)
      expect(ids.has(c.target.slice(5)), c.target).toBe(true)
      expect(c.text.split(/\s+/).length).toBeLessThanOrEqual(6)
    }
  })
})
