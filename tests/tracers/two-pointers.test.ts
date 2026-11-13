/**
 * Extra checks for the two-pointers tracers (pair-sum, then dedupe). The generic
 * contract suite (frames, anchors, code parity, parse, correctness...) runs from
 * registry.test.ts; this file asserts what only these tracers can know: that
 * their predict answers are true, and the teaching beats of the default presets.
 */
import { describe, expect, it } from 'vitest'
import pairSum from '@/lib/tracers/two-pointers/pair-sum'
import type { PairSumInput } from '@/lib/tracers/two-pointers/pair-sum'
import dedupe from '@/lib/tracers/two-pointers/dedupe'
import type { DedupeInput } from '@/lib/tracers/two-pointers/dedupe'
import container from '@/lib/tracers/two-pointers/container-water'
import type { Frame } from '@/lib/engine/types'

// ===========================================================================
// two-pointers/pair-sum
// ===========================================================================

const pairInput = pairSum.input
const pairDefault = pairInput.presets[0].value as PairSumInput

function allPairRuns(): Array<{ input: PairSumInput; frames: Frame[] }> {
  const inputs: PairSumInput[] = [
    ...pairInput.presets.map((p) => p.value),
    ...Array.from({ length: 200 }, (_, i) => pairInput.random(i + 1)),
  ]
  return inputs.map((value) => ({ input: value, frames: pairSum.run(value).frames }))
}

describe('two-pointers/pair-sum: presets', () => {
  it('has the three teaching presets and their 1-indexed answers', () => {
    expect(pairInput.presets.map((p) => p.value)).toEqual([
      { nums: [1, 2, 4, 6, 8, 10, 15], target: 18 },
      { nums: [2, 7, 11, 15], target: 9 },
      { nums: [1, 3, 5, 8], target: 10 },
    ])
    expect(pairInput.presets.map((p) => pairSum.run(p.value).result)).toEqual([
      [5, 6],
      [1, 2],
      [-1, -1],
    ])
  })

  it('default preset walks init, 6 compares, 4 left moves, 1 right move, found and done', () => {
    const { frames } = pairSum.run(pairDefault)
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect([count('init'), count('compare'), count('move-left'), count('move-right'), count('found'), count('done')]).toEqual([
      1, 6, 4, 1, 1, 1,
    ])
    expect(frames).toHaveLength(14)
    expect(frames[frames.length - 1].say).toBe('Return [5, 6] — the positions of 8 and 10, counting from 1.')
  })

  it('finishes on the found pair, 8 and 10', () => {
    const { frames } = pairSum.run(pairDefault)
    const done = frames[frames.length - 1]
    expect(done.at).toBe('done')
    if (done.scene.kind !== 'array') throw new Error('expected an array scene')
    const found = (done.scene.marks ?? []).filter((m) => m.role === 'found').map((m) => done.scene.kind === 'array' ? done.scene.cells[m.index] : null)
    expect(found).toEqual([8, 10])
  })

  it('no-solution preset: pointers meet, nothing is found, every cell is out of play', () => {
    const { frames, result } = pairSum.run({ nums: [1, 3, 5, 8], target: 10 })
    expect(result).toEqual([-1, -1])
    expect(frames.some((f) => f.at === 'found')).toBe(false)
    const done = frames[frames.length - 1]
    expect(done.say).toMatch(/no pair adds up to 10/)
    if (done.scene.kind !== 'array') throw new Error('expected an array scene')
    expect((done.scene.marks ?? []).filter((m) => m.role === 'discarded')).toHaveLength(4)
  })

  it('finds the outermost pair when several work, matching the reference', () => {
    expect(pairSum.run({ nums: [2, 2, 5, 5], target: 7 }).result).toEqual([1, 4])
    expect(pairSum.run({ nums: [3, 3], target: 6 }).result).toEqual([1, 2])
    expect(pairSum.run({ nums: [-3, -1, 0, 4], target: 3 }).result).toEqual([2, 4])
  })
})

describe('two-pointers/pair-sum: scene semantics', () => {
  it('compare marks exactly left and right; found marks exactly the pair; discarded cells are outside left..right', () => {
    for (const { frames } of allPairRuns()) {
      for (const frame of frames) {
        if (frame.scene.kind !== 'array' || frame.at === 'init' || frame.at === 'done') continue
        const left = frame.vars.left as number
        const right = frame.vars.right as number
        const marks = frame.scene.marks ?? []
        const withRole = (role: string): number[] => marks.filter((m) => m.role === role).map((m) => m.index).sort((a, b) => a - b)
        if (frame.at === 'compare') expect(withRole('compare')).toEqual([left, right])
        if (frame.at === 'found') expect(withRole('found')).toEqual([left, right])
        const discarded = withRole('discarded')
        for (let i = 0; i < frame.scene.cells.length; i++) {
          expect(discarded.includes(i), `cell ${i} with left=${left}, right=${right} at "${frame.at}"`).toBe(i < left || i > right)
        }
      }
    }
  })

  it('the sum in vars is always nums[left] + nums[right] on compare frames', () => {
    for (const { input, frames } of allPairRuns()) {
      for (const frame of frames) {
        if (frame.at !== 'compare') continue
        expect(frame.vars.total).toBe(input.nums[frame.vars.left as number] + input.nums[frame.vars.right as number])
      }
    }
  })

  it('pointers only ever move inward, one step at a time', () => {
    for (const { frames } of allPairRuns()) {
      let prevLeft = 0
      let prevRight = (frames[0].vars.right as number)
      for (const frame of frames) {
        const left = frame.vars.left as number
        const right = frame.vars.right as number
        expect(left - prevLeft).toBeGreaterThanOrEqual(0)
        expect(left - prevLeft).toBeLessThanOrEqual(1)
        expect(prevRight - right).toBeGreaterThanOrEqual(0)
        expect(prevRight - right).toBeLessThanOrEqual(1)
        prevLeft = left
        prevRight = right
      }
    }
  })
})

describe('two-pointers/pair-sum: predicts tell the truth', () => {
  it('which-pointer-moves: the frame after the compare is the move the answer names', () => {
    let lefts = 0
    let rights = 0
    for (const { input, frames } of allPairRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        expect(p.tag).toBe('which-pointer-moves')
        expect(frame.at).toBe('compare')
        expect(p.options).toEqual(['Move left →', 'Move right ←'])
        const sum = frame.vars.total as number
        expect(p.prompt).toBe(`Sum is ${sum}, target is ${input.target}. Which pointer moves?`)
        const reveal = frames[i + 1]
        if (p.answer === 'Move left →') {
          lefts++
          expect(sum).toBeLessThan(input.target)
          expect(reveal.at).toBe('move-left')
        } else {
          rights++
          expect(p.answer).toBe('Move right ←')
          expect(sum).toBeGreaterThan(input.target)
          expect(reveal.at).toBe('move-right')
        }
      })
    }
    expect(lefts).toBeGreaterThan(0)
    expect(rights).toBeGreaterThan(0)
  })

  it('never asks when the sum already equals the target', () => {
    for (const { frames } of allPairRuns()) {
      frames.forEach((frame, i) => {
        if (frame.at === 'compare' && frames[i + 1].at === 'found') expect(frame.predict).toBeUndefined()
      })
    }
  })

  it('the default preset asks both answers', () => {
    const answers = new Set(pairSum.run(pairDefault).frames.flatMap((f) => (f.predict ? [f.predict.answer] : [])))
    expect(answers).toEqual(new Set(['Move left →', 'Move right ←']))
  })
})

describe('two-pointers/pair-sum: input rules', () => {
  const ok = (nums: string, target: string) => pairInput.parse({ nums, target })

  it('accepts friendly formats, equal neighbours and negatives', () => {
    expect(ok('[1, 2, 4, 6]', '6')).toEqual({ ok: true, value: { nums: [1, 2, 4, 6], target: 6 } })
    expect(ok('1 2 2 3', '4')).toEqual({ ok: true, value: { nums: [1, 2, 2, 3], target: 4 } })
    expect(ok('−3, −1, 4', '−4')).toEqual({ ok: true, value: { nums: [-3, -1, 4], target: -4 } })
  })

  it('rejects unsorted numbers with the friendly sorted message', () => {
    expect(ok('4, 1, 2', '5')).toEqual({ ok: false, field: 'nums', error: 'Two pointers needs the numbers sorted — try 1, 2, 4, 6' })
    expect(ok('1, 2, 4, 3', '5')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/sorted/) })
  })

  it('needs at least two numbers', () => {
    expect(ok('5', '5')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/at least two/) })
  })

  it('names the limit when the list is too long or out of range', () => {
    expect(ok(Array(13).fill('1').join(','), '2')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/at most 12/) })
    expect(ok('1, 100', '2')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/-99 and 99/) })
    expect(ok('1, two', '2')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/"two"/) })
  })

  it('checks the target', () => {
    expect(ok('1, 2', '')).toMatchObject({ ok: false, field: 'target' })
    expect(ok('1, 2', '2.5')).toMatchObject({ ok: false, field: 'target' })
    expect(ok('1, 2', '199')).toMatchObject({ ok: false, field: 'target', error: expect.stringMatching(/-198 and 198/) })
    expect(ok('1, 2', '198')).toMatchObject({ ok: true })
  })

  it('random inputs include matches and no-match runs, and both kinds of move', () => {
    const results = Array.from({ length: 200 }, (_, i) => pairSum.run(pairInput.random(i + 1)).result)
    expect(results.some((r) => r[0] === -1)).toBe(true)
    expect(results.some((r) => r[0] !== -1)).toBe(true)
  })
})

// ===========================================================================
// two-pointers/dedupe
// ===========================================================================

const dedupeInput = dedupe.input
const dedupeDefault = dedupeInput.presets[0].value as DedupeInput

function allDedupeRuns(): Array<{ input: DedupeInput; frames: Frame[]; result: number }> {
  const inputs: DedupeInput[] = [
    ...dedupeInput.presets.map((p) => p.value),
    ...Array.from({ length: 200 }, (_, i) => dedupeInput.random(i + 1)),
  ]
  return inputs.map((value) => ({ input: value, ...dedupe.run(value) }))
}

describe('two-pointers/dedupe: presets', () => {
  it('has the three teaching presets and their answers', () => {
    expect(dedupeInput.presets.map((p) => p.value.nums)).toEqual([
      [0, 0, 1, 1, 1, 2, 2, 3, 3, 4],
      [1, 2, 3, 4],
      [7, 7, 7, 7, 7],
    ])
    expect(dedupeInput.presets.map((p) => dedupe.run(p.value).result)).toEqual([5, 4, 1])
  })

  it('default preset shows init, 9 reads and compares, 4 writes and done', () => {
    const { frames } = dedupe.run(dedupeDefault)
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect([count('init'), count('read'), count('compare'), count('write'), count('done')]).toEqual([1, 9, 9, 4, 1])
    expect(frames[frames.length - 1].say).toBe('Return 5 — the first 5 slots hold the unique numbers [0, 1, 2, 3, 4].')
  })

  it('writes the unique numbers into the first k slots', () => {
    for (const { input, frames, result } of allDedupeRuns()) {
      const last = frames[frames.length - 1]
      if (last.scene.kind !== 'array') throw new Error('expected an array scene')
      const unique = Array.from(new Set(input.nums))
      expect(last.scene.cells.slice(0, result)).toEqual(unique)
      expect(last.scene.window).toEqual({ start: 0, end: result - 1 })
    }
  })
})

describe('two-pointers/dedupe: scene semantics', () => {
  it('slow never passes fast; changed marks only the write; gauge counts the kept prefix', () => {
    for (const { input, frames } of allDedupeRuns()) {
      for (const frame of frames) {
        if (frame.scene.kind !== 'array') continue
        const slow = frame.vars.slow as number
        const fast = frame.vars.fast as number | null
        if (fast !== null && frame.at !== 'done') expect(slow).toBeLessThanOrEqual(fast)
        const roles = (frame.scene.marks ?? []).map((m) => m.role)
        if (frame.at === 'write') {
          expect(roles.filter((r) => r === 'changed')).toHaveLength(1)
          expect(frame.scene.cells[slow]).toBe(input.nums[fast as number])
        } else {
          expect(roles).not.toContain('changed')
        }
        if (frame.at === 'compare') expect(roles.filter((r) => r === 'compare')).toHaveLength(slow === fast ? 1 : 2)
        expect(frame.gauge).toEqual({ value: slow + 1, max: input.nums.length, label: 'Unique numbers kept' })
        if (frame.at !== 'done') expect(frame.scene.window).toEqual({ start: 0, end: slow })
      }
    }
  })
})

describe('two-pointers/dedupe: predicts tell the truth', () => {
  it('write-or-skip: the compare that follows is a duplicate exactly when the answer is Skip it', () => {
    let writes = 0
    let skips = 0
    for (const { input, frames } of allDedupeRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        expect(p.tag).toBe('write-or-skip')
        expect(frame.at).toBe('read')
        expect(p.options).toEqual(['Write it', 'Skip it'])
        const reveal = frames[i + 1]
        expect(reveal.at, 'the reveal is the compare').toBe('compare')
        const after = frames[i + 2]
        const slow = frame.vars.slow as number
        const fast = frame.vars.fast as number
        // frame.scene.cells reflects earlier writes; the value fast reads is still the original.
        const fastValue = input.nums[fast]
        const slowValue = (frame.scene as { cells: number[] }).cells[slow]
        expect(p.prompt).toBe(`slow is on ${slowValue}, fast just read ${fastValue}. Write it or skip it?`)
        if (p.answer === 'Write it') {
          writes++
          expect(fastValue).not.toBe(slowValue)
          expect(after.at, 'a write follows').toBe('write')
        } else {
          skips++
          expect(p.answer).toBe('Skip it')
          expect(fastValue).toBe(slowValue)
          expect(after.at, 'no write: fast reads on, or the run ends').not.toBe('write')
        }
      })
    }
    expect(writes).toBeGreaterThan(0)
    expect(skips).toBeGreaterThan(0)
  })

  it('every read frame carries the predict and the default preset asks both answers', () => {
    const frames = dedupe.run(dedupeDefault).frames
    expect(frames.filter((f) => f.at === 'read').every((f) => f.predict !== undefined)).toBe(true)
    const answers = new Set(frames.flatMap((f) => (f.predict ? [f.predict.answer] : [])))
    expect(answers).toEqual(new Set(['Write it', 'Skip it']))
  })
})

describe('two-pointers/dedupe: input rules', () => {
  const ok = (nums: string) => dedupeInput.parse({ nums })

  it('accepts friendly formats, repeats and a single number', () => {
    expect(ok('[0, 0, 1]')).toEqual({ ok: true, value: { nums: [0, 0, 1] } })
    expect(ok('1 1 1')).toEqual({ ok: true, value: { nums: [1, 1, 1] } })
    expect(ok('7')).toEqual({ ok: true, value: { nums: [7] } })
    expect(ok('−2, −2, 3')).toEqual({ ok: true, value: { nums: [-2, -2, 3] } })
  })

  it('rejects unsorted numbers with the friendly sorted message', () => {
    expect(ok('2, 1, 1')).toEqual({ ok: false, field: 'nums', error: 'Two pointers needs the numbers sorted — try 0, 0, 1, 1, 2' })
  })

  it('names the limit when the list is too long or out of range', () => {
    expect(ok(Array(13).fill('1').join(','))).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/at most 12/) })
    expect(ok('1, 100')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/-99 and 99/) })
  })

  it('random inputs include runs with and without duplicates', () => {
    const runs = Array.from({ length: 200 }, (_, i) => {
      const { nums } = dedupeInput.random(i + 1)
      return { n: nums.length, k: dedupe.run({ nums }).result }
    })
    expect(runs.some((r) => r.k < r.n)).toBe(true)
    expect(runs.some((r) => r.k === r.n)).toBe(true)
  })
})

// ===========================================================================
// two-pointers/container-water
// ===========================================================================

describe('two-pointers/container-water', () => {
  const t = container
  const runs = [
    ...t.input.presets.map((p) => p.value),
    ...Array.from({ length: 200 }, (_, i) => t.input.random(i + 1)),
  ].map((value) => ({ input: value, frames: t.run(value).frames }))

  it('gives the classic answers for the presets', () => {
    expect(t.input.presets.map((p) => t.run(p.value).result)).toEqual([49, 1, 16])
  })

  it('guided preset has 15 to 45 frames and uses every anchor', () => {
    const frames = t.run(t.input.presets[0].value).frames
    expect(frames.length).toBeGreaterThanOrEqual(15)
    expect(frames.length).toBeLessThanOrEqual(45)
    expect(new Set(frames.map((f) => f.at))).toEqual(new Set(Object.keys(t.anchors)))
  })

  it('predict answers are true in the next frame', () => {
    for (const { frames } of runs) {
      frames.forEach((f, i) => {
        if (f.predict?.tag === 'which-pointer-moves') {
          expect(frames[i + 1].at).toBe(f.predict.answer === 'Move left →' ? 'move-left' : 'move-right')
        }
        if (f.predict?.tag === 'new-best') {
          expect(Number(frames[i + 1].vars.best) > Number(f.vars.best)).toBe(f.predict.answer === 'Yes')
        }
      })
    }
  })

  it('rejects bad input kindly', () => {
    expect(t.input.parse({ heights: '5' }).ok).toBe(false)
    expect(t.input.parse({ heights: '1, 2, 99' }).ok).toBe(false)
    expect(t.input.parse({ heights: '1, x' }).ok).toBe(false)
  })
})
