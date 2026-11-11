/**
 * Extra checks for the strings tracers (palindrome, char-frequency). The generic
 * contract suite (frames, anchors, code parity, parse, correctness...) runs from
 * registry.test.ts; the harness only deep-checks array scenes, so this file also
 * checks the composite scene of char-frequency (two arrays and a count table),
 * and that every predict answer is what the next frame actually does.
 */
import { describe, expect, it } from 'vitest'
import palindrome from '@/lib/tracers/strings/palindrome'
import type { PalindromeInput } from '@/lib/tracers/strings/palindrome'
import charFrequency from '@/lib/tracers/strings/char-frequency'
import type { CharFrequencyInput } from '@/lib/tracers/strings/char-frequency'
import type { ArrayScene, Frame, HashMapScene, Scene } from '@/lib/engine/types'

const M = 5
const SEEDS = 200

const isAlnum = (ch: string): boolean => /^[A-Za-z0-9]$/.test(ch)

function arrayOf(scene: Scene): ArrayScene {
  if (scene.kind !== 'array') throw new Error(`expected an array scene, got ${scene.kind}`)
  return scene
}

// ===========================================================================
// strings/palindrome
// ===========================================================================

const pal = palindrome.input
const palDefault = pal.presets[0].value as PalindromeInput

function allPalRuns(): Array<{ input: PalindromeInput; frames: Frame[]; result: boolean }> {
  const inputs: PalindromeInput[] = [...pal.presets.map((p) => p.value), ...Array.from({ length: SEEDS }, (_, i) => pal.random(i + 1))]
  return inputs.map((input) => ({ input, ...palindrome.run(input) }))
}

describe('strings/palindrome: default preset', () => {
  const { frames, result } = palindrome.run(palDefault)

  it('is "Race car!", which is a palindrome', () => {
    expect(palDefault.text).toBe('Race car!')
    expect(result).toBe(true)
  })

  it('walks init, skip, then three compare/match pairs, a second skip and done', () => {
    expect(frames.map((f) => f.at)).toEqual([
      'init', 'skip', 'compare', 'match', 'compare', 'match', 'compare', 'match', 'skip', 'done',
    ])
  })

  it('shows a space as a visible ␣ cell', () => {
    expect(arrayOf(frames[0].scene).cells).toEqual(['R', 'a', 'c', 'e', '␣', 'c', 'a', 'r', '!'])
  })

  it('skips the "!" first, discarding it, with the right pointer moving in', () => {
    const skip = arrayOf(frames[1].scene)
    expect(skip.marks).toContainEqual({ index: 8, role: 'discarded' })
    expect(skip.pointers).toEqual([
      { name: 'left', index: 0, role: 'ptrA' },
      { name: 'right', index: 7, role: 'ptrB' },
    ])
    expect(frames[1].say).toMatch(/'!'/)
  })

  it('compares R with r (case ignored) and says they match', () => {
    const compare = arrayOf(frames[2].scene)
    expect(compare.marks).toEqual(expect.arrayContaining([{ index: 0, role: 'compare' }, { index: 7, role: 'compare' }]))
    expect(frames[3].say).toMatch(/'R' and 'r' match once case is ignored/)
  })

  it('ends with every letter found and the skipped characters discarded', () => {
    const done = arrayOf(frames[frames.length - 1].scene)
    expect(done.pointers).toBeUndefined()
    const roles = new Map((done.marks ?? []).map((m) => [m.index, m.role]))
    expect(roles.get(4)).toBe('discarded')
    expect(roles.get(8)).toBe('discarded')
    expect(roles.get(0)).toBe('found')
    expect(frames[frames.length - 1].vars.result).toBe(true)
  })

  it('"Race a car" ends in an error mark on e and a', () => {
    const { frames: f, result: r } = palindrome.run(pal.presets[1].value as PalindromeInput)
    expect(r).toBe(false)
    const done = f[f.length - 1]
    expect(done.at).toBe('done')
    const marks = arrayOf(done.scene).marks ?? []
    expect(marks.filter((m) => m.role === 'error')).toHaveLength(2)
    expect(done.say).toMatch(/not a palindrome/)
  })

  it('"(Taco cat)" skips at both ends', () => {
    const { frames: f } = palindrome.run(pal.presets[2].value as PalindromeInput)
    const skips = f.filter((x) => x.at === 'skip').map((x) => x.say)
    expect(skips.some((s) => s.startsWith('Left'))).toBe(true)
    expect(skips.some((s) => s.startsWith('Right'))).toBe(true)
  })
})

describe('strings/palindrome: edge cases', () => {
  it('a single letter is a palindrome after just init and done', () => {
    const { frames, result } = palindrome.run({ text: 'x' })
    expect(result).toBe(true)
    expect(frames.map((f) => f.at)).toEqual(['init', 'done'])
  })

  it('text with letters only at one end still works', () => {
    expect(palindrome.run({ text: 'a!!!' }).result).toBe(true)
    expect(palindrome.run({ text: '!!!ab' }).result).toBe(false)
  })

  it('digits count as characters and case is ignored', () => {
    expect(palindrome.run({ text: 'A1b,B1a' }).result).toBe(true)
    expect(palindrome.run({ text: '0P' }).result).toBe(false)
  })

  it('rejects non-ASCII and text with no letters or digits, with a friendly message', () => {
    const noAlnum = pal.parse({ text: ' ,.! ' })
    expect(noAlnum.ok).toBe(false)
    if (!noAlnum.ok) expect(noAlnum.error).toMatch(/letter or digit/)
    const accents = pal.parse({ text: 'été' })
    expect(accents.ok).toBe(false)
    if (!accents.ok) expect(accents.error).toMatch(/plain keyboard/)
    expect(pal.parse({ text: 'Race car!' })).toEqual({ ok: true, value: { text: 'Race car!' } })
  })
})

describe('strings/palindrome: scenes', () => {
  it('keep the cells equal to the text and the pointers ordered by role', () => {
    for (const { input, frames } of allPalRuns()) {
      frames.forEach((frame, i) => {
        const scene = arrayOf(frame.scene)
        expect(scene.cells, `frame ${i}`).toEqual(input.text.split('').map((c) => (c === ' ' ? '␣' : c)))
        const left = frame.vars.left as number
        const right = frame.vars.right as number
        if (scene.pointers) {
          expect(scene.pointers).toEqual([
            { name: 'left', index: left, role: 'ptrA' },
            { name: 'right', index: right, role: 'ptrB' },
          ])
        }
        expect(left, `frame ${i} left`).toBeGreaterThanOrEqual(0)
        expect(right, `frame ${i} right`).toBeLessThanOrEqual(input.text.length - 1)
      })
    }
  })

  it('discarded cells are never letters or digits; error and found cells always are', () => {
    for (const { input, frames } of allPalRuns()) {
      for (const frame of frames) {
        for (const m of arrayOf(frame.scene).marks ?? []) {
          const ch = input.text[m.index]
          if (m.role === 'discarded') expect(isAlnum(ch), `${input.text}: "${ch}" discarded`).toBe(false)
          if (m.role === 'error' || m.role === 'compare') expect(isAlnum(ch), `${input.text}: "${ch}" ${m.role}`).toBe(true)
        }
      }
    }
  })

  it('every compare frame marks exactly two compare cells whose letters are the ones named', () => {
    for (const { input, frames } of allPalRuns()) {
      for (const frame of frames) {
        if (frame.at !== 'compare') continue
        const compare = (arrayOf(frame.scene).marks ?? []).filter((m) => m.role === 'compare')
        expect(compare).toHaveLength(2)
        const [a, b] = compare.map((m) => input.text[m.index])
        expect(frame.say).toContain(`'${a}'`)
        expect(frame.say).toContain(`'${b}'`)
      }
    }
  })

  it('every compare frame is followed by match, or by done with a real mismatch', () => {
    for (const { frames } of allPalRuns()) {
      frames.forEach((frame, i) => {
        if (frame.at !== 'compare') return
        const next = frames[i + 1]
        const compare = (arrayOf(frame.scene).marks ?? []).filter((m) => m.role === 'compare')
        const cells = arrayOf(frame.scene).cells
        const same = cells[compare[0].index]?.toString().toLowerCase() === cells[compare[1].index]?.toString().toLowerCase()
        expect(next.at).toBe(same ? 'match' : 'done')
      })
    }
  })

  it('every skip hops over exactly one character and moves exactly one pointer by one', () => {
    for (const { frames } of allPalRuns()) {
      frames.forEach((frame, i) => {
        if (frame.at !== 'skip') return
        const before = frames[i - 1].vars
        const after = frame.vars
        const dl = (after.left as number) - (before.left as number)
        const dr = (before.right as number) - (after.right as number)
        expect(dl + dr, `frame ${i}: one pointer moves one step`).toBe(1)
        expect(dl === 0 || dr === 0).toBe(true)
      })
    }
  })

  it('the gauge counts the characters between the pointers', () => {
    for (const { input, frames } of allPalRuns()) {
      for (const frame of frames) {
        const left = frame.vars.left as number
        const right = frame.vars.right as number
        expect(frame.gauge).toEqual({ value: Math.max(0, right - left + 1), max: input.text.length, label: 'Characters still to check' })
      }
    }
  })

  it('the final frame is done, and its result matches the run result', () => {
    for (const { frames, result } of allPalRuns()) {
      const last = frames[frames.length - 1]
      expect(last.at).toBe('done')
      expect(last.vars.result).toBe(result)
      expect(frames.filter((f) => f.at === 'done')).toHaveLength(1)
    }
  })
})

describe('strings/palindrome: predicts tell the truth', () => {
  it('skip-or-compare: the answer is what the next frame does', () => {
    let asked = 0
    const seen = new Set<unknown>()
    for (const { frames } of allPalRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p || p.tag !== 'skip-or-compare') return
        asked++
        const next = frames[i + 1]
        expect(['skip', 'compare']).toContain(next.at)
        expect(p.answer).toBe(next.at === 'skip' ? 'Skip a character' : 'Compare the two')
        seen.add(p.answer)
        // The prompt names the characters the pointers are on right now.
        const scene = arrayOf(frame.scene)
        const l = scene.cells[frame.vars.left as number] as string
        const r = scene.cells[frame.vars.right as number] as string
        const name = (c: string): string => (c === '␣' ? 'the space' : `'${c}'`)
        expect(p.prompt).toContain(`Left is on ${name(l)} and right is on ${name(r)}`)
      })
    }
    expect(asked).toBeGreaterThan(50)
    expect(seen.size, 'both answers occur').toBe(2)
  })

  it('match: the answer is whether the next frame is match or the failing done', () => {
    let asked = 0
    const seen = new Set<unknown>()
    for (const { frames } of allPalRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p || p.tag !== 'match') return
        asked++
        expect(frame.at).toBe('compare')
        const next = frames[i + 1]
        expect(p.answer).toBe(next.at === 'match' ? 'They match' : 'They differ')
        if (next.at !== 'match') expect(next.vars.result).toBe(false)
        seen.add(p.answer)
      })
    }
    expect(asked).toBeGreaterThan(50)
    expect(seen.size, 'both answers occur').toBe(2)
  })

  it('no predict is asked once the pointers have met', () => {
    for (const { frames } of allPalRuns()) {
      for (const frame of frames) {
        if (frame.predict?.tag === 'skip-or-compare') expect((frame.vars.left as number) < (frame.vars.right as number)).toBe(true)
      }
    }
  })
})

// ===========================================================================
// strings/char-frequency
// ===========================================================================

const cf = charFrequency.input
const cfDefault = cf.presets[0].value as CharFrequencyInput

function allCfRuns(): Array<{ input: CharFrequencyInput; frames: Frame[]; result: boolean }> {
  const inputs: CharFrequencyInput[] = [...cf.presets.map((p) => p.value), ...Array.from({ length: SEEDS }, (_, i) => cf.random(i + 1))]
  return inputs.map((input) => ({ input, ...charFrequency.run(input) }))
}

/** The three parts of an equal-length frame: s, t and the counts. */
function partsOf(frame: Frame): { s: ArrayScene; t: ArrayScene; map: HashMapScene } {
  if (frame.scene.kind !== 'composite') throw new Error('expected a composite scene')
  expect(frame.scene.layout).toBe('column')
  const [s, t, map] = frame.scene.parts.map((p) => p.scene)
  if (s.kind !== 'array' || t.kind !== 'array' || map.kind !== 'hash-map') throw new Error('expected array, array, hash-map')
  return { s, t, map }
}

function countsOf(map: HashMapScene): Record<string, number> {
  const out: Record<string, number> = {}
  for (const chain of map.buckets) for (const e of chain) out[e.key as string] = e.value as number
  return out
}

describe('strings/char-frequency: default preset', () => {
  const { frames, result } = charFrequency.run(cfDefault)

  it('is anagram / nagaram, which are anagrams', () => {
    expect(cfDefault).toEqual({ s: 'anagram', t: 'nagaram' })
    expect(result).toBe(true)
  })

  it('walks lengths, init, 7 counts, then 7 check + spend pairs, then done', () => {
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect(frames).toHaveLength(1 + 1 + 7 + 14 + 1)
    expect([count('lengths'), count('init'), count('count'), count('check'), count('spend'), count('done')]).toEqual([1, 1, 7, 7, 7, 1])
  })

  it('counts a:3 n:1 g:1 r:1 m:1 after the count phase, with r and m chained in bucket 4', () => {
    const lastCount = frames.filter((f) => f.at === 'count').pop()!
    const { map } = partsOf(lastCount)
    expect(countsOf(map)).toEqual({ a: 3, n: 1, g: 1, r: 1, m: 1 })
    expect(map.buckets[4].map((e) => e.key)).toEqual(['r', 'm'])
    expect(map.buckets[2].map((e) => e.key)).toEqual(['a'])
    expect(lastCount.gauge).toEqual({ value: 7, max: 7, label: 'Counts still to spend' })
  })

  it('ends with every count at 0 and every entry marked found', () => {
    const done = frames[frames.length - 1]
    const { map } = partsOf(done)
    expect(Object.values(countsOf(map)).every((c) => c === 0)).toBe(true)
    expect((map.marks ?? []).every((m) => m.role === 'found')).toBe(true)
    expect(map.marks).toHaveLength(5)
    expect(done.gauge?.value).toBe(0)
  })

  it('"rat" / "car" fails on the missing c with an error mark in its bucket', () => {
    const { frames: f, result: r } = charFrequency.run(cf.presets[2].value as CharFrequencyInput)
    expect(r).toBe(false)
    const done = f[f.length - 1]
    expect(done.at).toBe('done')
    expect(done.say).toMatch(/no 'c' in bucket 4/)
    const { map, t } = partsOf(done)
    expect(map.marks).toEqual([{ bucket: 4, role: 'error' }])
    expect(t.marks).toContainEqual({ index: 0, role: 'error' })
  })

  it('"aab" / "abb" fails on a letter whose count is already 0', () => {
    const { frames: f, result: r } = charFrequency.run(cf.presets[1].value as CharFrequencyInput)
    expect(r).toBe(false)
    const done = f[f.length - 1]
    expect(done.say).toMatch(/no count left/)
    const { map } = partsOf(done)
    expect(map.marks).toHaveLength(1)
    expect(map.marks![0].role).toBe('error')
    expect(map.marks![0].slot).toBeDefined()
  })

  it('different lengths stop after lengths and done, with the lengths in the narration', () => {
    const { frames: f, result: r } = charFrequency.run({ s: 'cat', t: 'cats' })
    expect(r).toBe(false)
    expect(f.map((x) => x.at)).toEqual(['lengths', 'done'])
    expect(f[0].say).toMatch(/s has 3 letters but t has 4/)
  })
})

describe('strings/char-frequency: input', () => {
  it('rejects capitals, digits, spaces and too-long words with a friendly message naming the field', () => {
    const base = cf.format(cfDefault)
    for (const [field, value, pattern] of [
      ['s', 'Anagram', /lowercase/],
      ['t', 'nag4ram', /lowercase/],
      ['s', 'ana gram', /lowercase/],
      ['t', 'abcdefghijk', /at most 10/],
    ] as const) {
      const result = cf.parse({ ...base, [field]: value })
      expect(result.ok, `${field}=${value}`).toBe(false)
      if (!result.ok) {
        expect(result.field).toBe(field)
        expect(result.error).toMatch(pattern)
      }
    }
  })

  it('accepts words of different lengths and trims stray spaces', () => {
    expect(cf.parse({ s: ' cat ', t: 'cats' })).toEqual({ ok: true, value: { s: 'cat', t: 'cats' } })
  })

  it('random inputs cover anagrams, near misses and different lengths', () => {
    const kinds = { anagram: 0, sameLength: 0, differentLength: 0 }
    for (let seed = 1; seed <= SEEDS; seed++) {
      const { s, t } = cf.random(seed)
      if (s.length !== t.length) kinds.differentLength++
      else if (charFrequency.reference({ s, t })) kinds.anagram++
      else kinds.sameLength++
    }
    expect(kinds.anagram).toBeGreaterThan(30)
    expect(kinds.sameLength).toBeGreaterThan(20)
    expect(kinds.differentLength).toBeGreaterThan(10)
  })
})

describe('strings/char-frequency: scenes', () => {
  it('every frame past the length check is a column of s, t and a 5-bucket table of counts', () => {
    for (const { input, frames } of allCfRuns()) {
      for (const frame of frames) {
        const { s, t, map } = partsOf(frame)
        expect(s.cells).toEqual(input.s.split(''))
        expect(t.cells).toEqual(input.t.split(''))
        expect(map.buckets).toHaveLength(M)
      }
    }
  })

  it('every entry sits in the bucket code % 5, counts never go negative, keys are unique, and the gauge adds them up', () => {
    for (const { input, frames } of allCfRuns()) {
      for (const frame of frames) {
        const { map } = partsOf(frame)
        const keys = new Set<string>()
        let total = 0
        map.buckets.forEach((chain, b) => {
          for (const e of chain) {
            const key = e.key as string
            expect((key.charCodeAt(0)) % M, `key ${key} in bucket ${b}`).toBe(b)
            expect(keys.has(key), `duplicate key ${key}`).toBe(false)
            keys.add(key)
            expect(e.value as number).toBeGreaterThanOrEqual(0)
            total += e.value as number
          }
        })
        expect(frame.gauge).toEqual({ value: total, max: input.s.length, label: 'Counts still to spend' })
      }
    }
  })

  it('hashing, marks and notes point at real buckets and slots, and hashing is code % 5', () => {
    for (const { frames } of allCfRuns()) {
      for (const frame of frames) {
        const { map } = partsOf(frame)
        if (map.hashing) {
          const key = map.hashing.key as string
          expect(map.hashing.hash).toBe(key.charCodeAt(0))
          expect(map.hashing.bucket).toBe(key.charCodeAt(0) % M)
        }
        for (const m of map.marks ?? []) {
          expect(m.bucket >= 0 && m.bucket < M).toBe(true)
          if (m.slot !== undefined) expect(m.slot >= 0 && m.slot < map.buckets[m.bucket].length).toBe(true)
        }
        for (const a of map.annotations ?? []) expect(a.target).toMatch(/^bucket:[0-4]$/)
      }
    }
  })

  it('the count phase raises one letter by one; the spend phase lowers one letter by one', () => {
    for (const { frames } of allCfRuns()) {
      frames.forEach((frame, i) => {
        if (frame.at !== 'count' && frame.at !== 'spend') return
        const before = countsOf(partsOf(frames[i - 1]).map)
        const after = countsOf(partsOf(frame).map)
        const ch = frame.vars.ch as string
        const delta = frame.at === 'count' ? 1 : -1
        expect(after[ch], `frame ${i}`).toBe((before[ch] ?? 0) + delta)
        for (const other of Object.keys(after)) if (other !== ch) expect(after[other]).toBe(before[other])
        expect(Object.keys(after).length).toBeGreaterThanOrEqual(Object.keys(before).length)
        // The changed mark lands on the letter's own slot.
        const mark = partsOf(frame).map.marks!.find((m) => m.role === 'changed')!
        expect(partsOf(frame).map.buckets[mark.bucket][mark.slot!].key).toBe(ch)
      })
    }
  })

  it('count frames walk s in order and spend frames walk t in order', () => {
    for (const { input, frames } of allCfRuns()) {
      const counted = frames.filter((f) => f.at === 'count').map((f) => f.vars.ch)
      const checked = frames.filter((f) => f.at === 'check').map((f) => f.vars.ch)
      const failed = frames[frames.length - 1].vars.result === false && frames[frames.length - 1].at === 'done' && checked.length > 0
      if (input.s.length === input.t.length) expect(counted).toEqual(input.s.split(''))
      expect(checked).toEqual(input.t.split('').slice(0, checked.length))
      if (!failed && input.s.length === input.t.length) expect(checked).toHaveLength(input.t.length)
    }
  })

  it('check frames hash t[j] and compare its slot, or focus the bucket when the letter is missing', () => {
    for (const { frames } of allCfRuns()) {
      for (const frame of frames) {
        if (frame.at !== 'check') continue
        const { map } = partsOf(frame)
        const ch = frame.vars.ch as string
        const roles = (map.marks ?? []).map((m) => m.role)
        expect(map.hashing?.key).toBe(ch)
        const present = map.buckets[ch.charCodeAt(0) % M].some((e) => e.key === ch)
        expect(roles).toEqual([present ? 'compare' : 'focus'])
      }
    }
  })

  it('pointer i walks s while counting and t while checking, and the other array has none', () => {
    for (const { frames } of allCfRuns()) {
      frames.forEach((frame, idx) => {
        if (!['count', 'check', 'spend'].includes(frame.at)) return
        const { s, t } = partsOf(frame)
        const mine = frame.at === 'count' ? s : t
        const other = frame.at === 'count' ? t : s
        expect(mine.pointers, `frame ${idx}`).toHaveLength(1)
        expect(mine.pointers![0].index).toBe(frame.vars.i)
        expect(other.pointers).toBeUndefined()
      })
    }
  })

  it('the run ends on one done frame that carries the result', () => {
    for (const { frames, result } of allCfRuns()) {
      const last = frames[frames.length - 1]
      expect(last.at).toBe('done')
      expect(last.vars.result).toBe(result)
      expect(frames.filter((f) => f.at === 'done')).toHaveLength(1)
    }
  })
})

describe('strings/char-frequency: predicts tell the truth', () => {
  it('which-bucket: three options with the right one among them, and the next frame hashes into it', () => {
    let asked = 0
    const answers = new Set<unknown>()
    for (const { frames } of allCfRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p || p.tag !== 'which-bucket') return
        asked++
        const next = frames[i + 1]
        expect(['count', 'check']).toContain(next.at)
        const { map } = partsOf(next)
        expect(map.hashing).not.toBeNull()
        expect(p.kind).toBe('choice')
        expect(p.options).toHaveLength(3)
        expect(new Set(p.options).size).toBe(3)
        expect(p.answer).toBe(`Bucket ${map.hashing!.bucket}`)
        expect(p.options).toContain(p.answer)
        expect(p.prompt).toContain(`'${next.vars.ch as string}'`)
        expect(p.prompt).toContain(`code ${(next.vars.ch as string).charCodeAt(0)}`)
        answers.add(p.answer)
      })
    }
    expect(asked).toBeGreaterThan(100)
    expect(answers.size, 'all five buckets come up').toBe(5)
  })

  it('anagram-yet: Yes exactly when the next frame is a spend, No when it is the failing done', () => {
    let asked = 0
    const seen = new Set<unknown>()
    for (const { frames } of allCfRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p || p.tag !== 'anagram-yet') return
        asked++
        expect(frame.at).toBe('check')
        const next = frames[i + 1]
        expect(p.answer).toBe(next.at === 'spend' ? 'Yes, spend one' : 'No, give up')
        if (next.at === 'done') expect(next.vars.result).toBe(false)
        seen.add(p.answer)
      })
    }
    expect(asked).toBeGreaterThan(100)
    expect(seen.size, 'both answers occur').toBe(2)
  })

  it('every check frame asks anagram-yet, and the last frame before done never asks', () => {
    for (const { frames } of allCfRuns()) {
      for (const frame of frames) {
        if (frame.at === 'check') expect(frame.predict?.tag).toBe('anagram-yet')
      }
      expect(frames[frames.length - 1].predict).toBeUndefined()
    }
  })
})
