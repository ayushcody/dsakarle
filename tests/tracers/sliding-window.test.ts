/**
 * Extra checks for sliding-window/max-sum-k. The generic contract suite
 * (frames, anchors, code parity, parse, correctness...) runs from registry.test.ts;
 * this file asserts what only this tracer can know: that its predict answers are
 * true, and the teaching beats of the default preset.
 */
import { describe, expect, it } from 'vitest'
import tracer from '@/lib/tracers/sliding-window/max-sum-k'
import type { MaxSumKInput } from '@/lib/tracers/sliding-window/max-sum-k'
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
