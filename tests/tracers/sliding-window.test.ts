/**
 * Extra checks for the sliding-window tracers (max-sum-k first, then min-len-target). The generic contract suite
 * (frames, anchors, code parity, parse, correctness...) runs from registry.test.ts;
 * this file asserts what only this tracer can know: that its predict answers are
 * true, and the teaching beats of the default preset.
 */
import { describe, expect, it } from 'vitest'
import tracer from '@/lib/tracers/sliding-window/max-sum-k'
import type { MaxSumKInput } from '@/lib/tracers/sliding-window/max-sum-k'
import minLen from '@/lib/tracers/sliding-window/min-len-target'
import type { MinLenTargetInput } from '@/lib/tracers/sliding-window/min-len-target'
import type { Frame } from '@/lib/engine/types'

const input = tracer.input
const defaultInput = input.presets[0].value as MaxSumKInput

/** Presets plus random seeds, as { input, frames }. */
function allRuns(): Array<{ input: MaxSumKInput; frames: Frame[] }> {
  const inputs: MaxSumKInput[] = [...input.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => input.random(i + 1))]
  return inputs.map((value) => ({ input: value, frames: tracer.run(value).frames }))
}

describe('sliding-window/max-sum-k: default preset', () => {
  const { frames, result } = tracer.run(defaultInput)

  it('finds 9, the window [5, 1, 3]', () => {
    expect(defaultInput).toEqual({ nums: [2, 1, 5, 1, 3, 2], k: 3 })
    expect(result).toBe(9)
    const done = frames[frames.length - 1]
    expect(done.at).toBe('done')
    expect(done.scene.kind).toBe('array')
    if (done.scene.kind !== 'array') return
    const foundIndexes = (done.scene.marks ?? []).filter((m) => m.role === 'found').map((m) => m.index)
    expect(foundIndexes.map((i) => (done.scene.kind === 'array' ? done.scene.cells[i] : null))).toEqual([5, 1, 3])
    expect(done.scene.window).toEqual({ start: 2, end: 4 })
  })

  it('walks init, 6 expands, 3 shrinks, 4 records and done', () => {
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect(frames).toHaveLength(15)
    expect([count('init'), count('expand'), count('shrink'), count('record'), count('done')]).toEqual([1, 6, 3, 4, 1])
  })

  it('never shows a shrink before the window overflows, and gauge overflows on expand', () => {
    frames.forEach((frame, i) => {
      if (frame.at !== 'shrink') return
      const prev = frames[i - 1]
      expect(prev.at).toBe('expand')
      expect(prev.gauge!.value).toBe(prev.gauge!.max + 1)
      expect(frame.gauge!.value).toBe(frame.gauge!.max)
    })
  })

  it('marks the newly added cell as changed and the dropped cell as discarded', () => {
    for (const frame of frames) {
      if (frame.scene.kind !== 'array') continue
      const roles = (frame.scene.marks ?? []).map((m) => m.role)
      if (frame.at === 'expand') expect(roles).toEqual(['changed'])
      if (frame.at === 'shrink') expect(roles).toEqual(['discarded'])
    }
  })
})

describe('sliding-window/max-sum-k: predicts tell the truth', () => {
  it('expand-or-shrink: a full window shrinks right after the next expand, a growing one does not', () => {
    let asked = 0
    const answers = new Set<unknown>()
    for (const { frames } of allRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'expand-or-shrink') return
        asked++
        answers.add(p.answer)
        const expand = frames[i + 1]
        expect(expand.at, 'the reveal frame is the expand').toBe('expand')
        const afterExpand = frames[i + 2]
        if (p.answer === 'Expand, then shrink from the left') {
          expect(afterExpand.at, 'shrink follows the expand').toBe('shrink')
          expect(frames[i + 3].at, 'a record follows the shrink').toBe('record')
        } else {
          expect(p.answer).toBe('Expand only')
          expect(afterExpand.at, 'no shrink when the window had room').not.toBe('shrink')
        }
      })
    }
    expect(asked).toBeGreaterThan(0)
    expect(answers).toEqual(new Set(['Expand only', 'Expand, then shrink from the left']))
  })

  it('new-best: the next record frame raises best exactly when the answer is Yes', () => {
    let yes = 0
    let no = 0
    for (const { frames } of allRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'new-best') return
        const record = frames[i + 1]
        expect(record.at, 'the reveal frame is the record').toBe('record')
        const before = frame.vars.best
        const after = record.vars.best
        const improved = before === null || (after as number) > (before as number)
        expect(p.answer).toBe(improved ? 'Yes' : 'No')
        expect(after).toBe(improved ? frame.vars.window : before)
        if (p.answer === 'Yes') yes++
        else no++
      })
    }
    expect(yes).toBeGreaterThan(0)
    expect(no).toBeGreaterThan(0)
  })

  it('asks every predict candidate on the default preset at least once per tag', () => {
    const tags = new Set(tracer.run(defaultInput).frames.flatMap((f) => (f.predict ? [f.predict.tag] : [])))
    expect(tags).toEqual(new Set(['expand-or-shrink', 'new-best']))
  })
})

describe('sliding-window/max-sum-k: input rules', () => {
  const ok = (nums: string, k: string) => input.parse({ nums, k })

  it('accepts friendly formats', () => {
    expect(ok('[2, 1, 5]', '2')).toEqual({ ok: true, value: { nums: [2, 1, 5], k: 2 } })
    expect(ok('2 1 5', '3')).toEqual({ ok: true, value: { nums: [2, 1, 5], k: 3 } })
    expect(ok('4, −1, 2', '1')).toEqual({ ok: true, value: { nums: [4, -1, 2], k: 1 } })
  })

  it('rejects k outside 1..n with a message that says why', () => {
    expect(ok('1, 2, 3', '0')).toMatchObject({ ok: false, field: 'k', error: expect.stringMatching(/at least 1/) })
    expect(ok('1, 2, 3', '4')).toMatchObject({ ok: false, field: 'k', error: expect.stringMatching(/bigger than/) })
    expect(ok('1, 2, 3', '-2')).toMatchObject({ ok: false, field: 'k' })
    expect(ok('1, 2, 3', '2.5')).toMatchObject({ ok: false, field: 'k' })
  })

  it('names the limit when the list is too long or out of range', () => {
    expect(ok(Array(13).fill('1').join(','), '2')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/at most 12/) })
    expect(ok('1, 100', '1')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/-99 and 99/) })
    expect(ok('1, two', '1')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/"two"/) })
  })
})

// ===========================================================================
// sliding-window/min-len-target
// ===========================================================================

const minInput = minLen.input
const minDefault = minInput.presets[0].value as MinLenTargetInput

function allMinRuns(): Array<{ input: MinLenTargetInput; frames: Frame[] }> {
  const inputs: MinLenTargetInput[] = [
    ...minInput.presets.map((p) => p.value),
    ...Array.from({ length: 200 }, (_, i) => minInput.random(i + 1)),
  ]
  return inputs.map((value) => ({ input: value, frames: minLen.run(value).frames }))
}

describe('sliding-window/min-len-target: presets', () => {
  it('has the three teaching presets and their answers', () => {
    expect(minInput.presets.map((p) => p.value)).toEqual([
      { nums: [2, 3, 1, 2, 4, 3], target: 7 },
      { nums: [1, 4, 4], target: 4 },
      { nums: [1, 1, 1, 1], target: 9 },
    ])
    expect(minInput.presets.map((p) => minLen.run(p.value).result)).toEqual([2, 1, 0])
  })

  it('default preset ends on the window [4, 3]', () => {
    const { frames, result } = minLen.run(minDefault)
    expect(result).toBe(2)
    const done = frames[frames.length - 1]
    expect(done.at).toBe('done')
    if (done.scene.kind !== 'array') throw new Error('expected an array scene')
    expect(done.scene.window).toEqual({ start: 4, end: 5 })
    const found = (done.scene.marks ?? []).filter((m) => m.role === 'found').map((m) => done.scene.kind === 'array' ? done.scene.cells[m.index] : null)
    expect(found).toEqual([4, 3])
  })

  it('shows every rule in the default preset, with a real shrink loop (several shrinks, one expand each at most)', () => {
    const { frames } = minLen.run(minDefault)
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect(count('init')).toBe(1)
    expect(count('expand')).toBe(6)
    expect(count('done')).toBe(1)
    expect(count('shrink')).toBeGreaterThanOrEqual(3)
    expect(count('record')).toBe(count('shrink'))
    expect(count('check')).toBe(count('expand') + count('shrink'))
  })

  it('impossible target: never records or shrinks, says 0', () => {
    const { frames, result } = minLen.run({ nums: [1, 1, 1, 1], target: 9 })
    expect(result).toBe(0)
    expect(frames.some((f) => f.at === 'record' || f.at === 'shrink')).toBe(false)
    const done = frames[frames.length - 1]
    expect(done.at).toBe('done')
    expect(done.say).toMatch(/answer is 0/)
    if (done.scene.kind === 'array') expect(done.scene.window ?? null).toBeNull()
  })

  it('can shrink to an empty window and keeps pointers legal', () => {
    const { frames } = minLen.run({ nums: [1, 4, 4], target: 4 })
    const emptied = frames.find((f) => f.at === 'shrink' && f.vars.window === 0)
    expect(emptied).toBeDefined()
    if (emptied?.scene.kind === 'array') expect(emptied.scene.window ?? null).toBeNull()
  })
})

describe('sliding-window/min-len-target: scene and gauge semantics', () => {
  it('marks the added cell changed, the dropped cell discarded; gauge is window sum vs target', () => {
    for (const { input: value, frames } of allMinRuns()) {
      for (const frame of frames) {
        if (frame.scene.kind !== 'array') continue
        const roles = (frame.scene.marks ?? []).map((m) => m.role)
        if (frame.at === 'expand') expect(roles).toEqual(['changed'])
        if (frame.at === 'shrink') expect(roles).toEqual(['discarded'])
        if (frame.at === 'check') expect(roles).toEqual([])
        if (frame.at !== 'done') {
          expect(frame.gauge).toEqual({ value: frame.vars.window, max: value.target, label: 'Window sum vs target' })
        }
      }
    }
  })

  it('window bracket always matches left..right and its sum matches the "sum N" note', () => {
    for (const { frames } of allMinRuns()) {
      for (const frame of frames) {
        if (frame.scene.kind !== 'array' || frame.at === 'done' || frame.at === 'init') continue
        const left = frame.vars.left as number
        const right = frame.vars.right as number
        if (right - left + 1 <= 0) {
          expect(frame.scene.window ?? null).toBeNull()
          continue
        }
        expect(frame.scene.window).toEqual({ start: left, end: right })
        const sum = frame.scene.cells.slice(left, right + 1).reduce<number>((a, b) => a + (b as number), 0)
        expect(sum).toBe(frame.vars.window)
        const note = (frame.scene.annotations ?? []).find((a) => a.target === 'window')
        if (note) expect(note.text).toBe(`sum ${sum}`)
      }
    }
  })

  it('the window sum is never below target after a check fails and never mixed up with best', () => {
    for (const { input: value, frames } of allMinRuns()) {
      frames.forEach((frame, i) => {
        if (frame.at !== 'record') return
        expect(frames[i - 1].at).toBe('check')
        expect(frame.vars.window as number).toBeGreaterThanOrEqual(value.target)
        expect(frames[i + 1].at).toBe('shrink')
      })
    }
  })
})

describe('sliding-window/min-len-target: predicts tell the truth', () => {
  it('expand-or-shrink: the check frame that follows shows the decision', () => {
    let shrinks = 0
    let expands = 0
    for (const { input: value, frames } of allMinRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'expand-or-shrink') return
        const reveal = frames[i + 1]
        expect(reveal.at, 'the reveal is the check').toBe('check')
        const sum = frame.vars.window as number
        expect(p.prompt).toBe(`Sum is ${sum}, target is ${value.target}. Expand or shrink?`)
        if (p.answer === 'Shrink from the left') {
          shrinks++
          expect(sum).toBeGreaterThanOrEqual(value.target)
          expect(frames[i + 2].at, 'record then shrink follow').toBe('record')
        } else {
          expands++
          expect(p.answer).toBe('Keep expanding')
          expect(sum).toBeLessThan(value.target)
          expect(frames[i + 2].at, 'the next number is added').toBe('expand')
        }
      })
    }
    expect(shrinks).toBeGreaterThan(0)
    expect(expands).toBeGreaterThan(0)
  })

  it('new-best: the next record frame lowers best exactly when the answer is Yes', () => {
    let yes = 0
    let no = 0
    for (const { frames } of allMinRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'new-best') return
        const record = frames[i + 1]
        expect(record.at).toBe('record')
        const before = frame.vars.best as number | null
        const after = record.vars.best as number
        const length = (frame.vars.right as number) - (frame.vars.left as number) + 1
        const improved = before === null || length < before
        expect(p.answer).toBe(improved ? 'Yes' : 'No')
        expect(after).toBe(improved ? length : before)
        if (improved) yes++
        else no++
      })
    }
    expect(yes).toBeGreaterThan(0)
    expect(no).toBeGreaterThan(0)
  })

  it('the default preset asks both predict kinds', () => {
    const tags = new Set(minLen.run(minDefault).frames.flatMap((f) => (f.predict ? [f.predict.tag] : [])))
    expect(tags).toEqual(new Set(['expand-or-shrink', 'new-best']))
  })

  it('never asks "expand or shrink" when there is nothing left to expand into', () => {
    for (const { input: value, frames } of allMinRuns()) {
      for (const frame of frames) {
        if (frame.predict?.tag !== 'expand-or-shrink') continue
        const right = frame.vars.right as number
        if (right === value.nums.length - 1) expect(frame.vars.window as number).toBeGreaterThanOrEqual(value.target)
      }
    }
  })
})

describe('sliding-window/min-len-target: input rules', () => {
  const ok = (nums: string, target: string) => minInput.parse({ nums, target })

  it('accepts friendly formats', () => {
    expect(ok('[2, 3, 1]', '5')).toEqual({ ok: true, value: { nums: [2, 3, 1], target: 5 } })
    expect(ok('2 3 1', '999')).toEqual({ ok: true, value: { nums: [2, 3, 1], target: 999 } })
  })

  it('rejects zero, negatives and out-of-range targets with a reason', () => {
    expect(ok('1, 0, 2', '3')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/between 1 and 99/) })
    expect(ok('1, -2, 2', '3')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/positive/) })
    expect(ok('1, 2', '0')).toMatchObject({ ok: false, field: 'target', error: expect.stringMatching(/between 1 and 999/) })
    expect(ok('1, 2', '1000')).toMatchObject({ ok: false, field: 'target' })
    expect(ok('1, 2', '2.5')).toMatchObject({ ok: false, field: 'target' })
    expect(ok('1, 2', '')).toMatchObject({ ok: false, field: 'target' })
  })

  it('names the limit when the list is too long', () => {
    expect(ok(Array(13).fill('1').join(','), '5')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/at most 12/) })
  })

  it('random inputs include impossible and trivially-easy targets', () => {
    const answers = Array.from({ length: 200 }, (_, i) => minLen.run(minInput.random(i + 1)).result)
    expect(answers.some((a) => a === 0)).toBe(true)
    expect(answers.some((a) => a === 1)).toBe(true)
    expect(answers.some((a) => a > 1)).toBe(true)
  })
})
