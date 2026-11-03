/**
 * Extra checks for the binary-search tracers (classic, first-true). The generic
 * contract suite (frames, anchors, code parity, parse, correctness...) runs from
 * registry.test.ts; this file asserts what only these tracers can know: that
 * their predict answers are true, the halving behaviour, and the teaching beats
 * of the default presets.
 */
import { describe, expect, it } from 'vitest'
import classic from '@/lib/tracers/binary-search/classic'
import type { ClassicInput } from '@/lib/tracers/binary-search/classic'
import firstTrue from '@/lib/tracers/binary-search/first-true'
import type { FirstTrueInput } from '@/lib/tracers/binary-search/first-true'
import type { ArrayScene, Frame } from '@/lib/engine/types'

function arrayScene(frame: Frame): ArrayScene {
  if (frame.scene.kind !== 'array') throw new Error('expected an array scene')
  return frame.scene
}

function roles(frame: Frame, role: string): number[] {
  return (arrayScene(frame).marks ?? []).filter((m) => m.role === role).map((m) => m.index)
}

// ===========================================================================
// binary-search/classic
// ===========================================================================

const cInput = classic.input
const cDefault = cInput.presets[0].value as ClassicInput

function allClassicRuns(): Array<{ input: ClassicInput; frames: Frame[]; result: number }> {
  const inputs: ClassicInput[] = [...cInput.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => cInput.random(i + 1))]
  return inputs.map((value) => ({ input: value, ...classic.run(value) }))
}

describe('binary-search/classic: default preset', () => {
  const { frames, result } = classic.run(cDefault)

  it('finds 23 at index 5 in three looks, using both moves', () => {
    expect(cDefault).toEqual({ nums: [2, 5, 8, 12, 16, 23, 38, 56, 72], target: 23 })
    expect(result).toBe(5)
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect([count('init'), count('mid'), count('check'), count('go-right'), count('go-left'), count('done')]).toEqual([1, 3, 3, 1, 1, 1])
    expect(frames.filter((f) => f.at === 'mid').map((f) => f.vars.mid)).toEqual([4, 6, 5])
  })

  it('explains the overflow-safe middle exactly once', () => {
    expect(frames.filter((f) => /overflow/i.test(f.say))).toHaveLength(1)
    expect(frames.find((f) => f.at === 'mid')!.say).toMatch(/overflow/)
  })

  it('ends with the target marked found and everything else out of play', () => {
    const done = frames[frames.length - 1]
    expect(done.at).toBe('done')
    expect(roles(done, 'found')).toEqual([5])
    expect(roles(done, 'discarded')).toHaveLength(8)
    expect(done.say).toMatch(/Found 23 at index 5/)
  })

  it('marks mid as compare on every check frame', () => {
    for (const frame of frames) {
      if (frame.at !== 'check') continue
      expect(roles(frame, 'compare')).toEqual([frame.vars.mid])
    }
  })
})

describe('binary-search/classic: halving', () => {
  it('discarded cells only ever pile up within a run (never shrink), and the gauge never grows', () => {
    for (const { frames } of allClassicRuns()) {
      let discarded = 0
      let candidates = Infinity
      for (const frame of frames) {
        if (frame.at === 'done') continue
        const count = roles(frame, 'discarded').length
        expect(count).toBeGreaterThanOrEqual(discarded)
        discarded = count
        expect(frame.gauge!.value).toBeLessThanOrEqual(candidates)
        candidates = frame.gauge!.value
        // Everything outside [lo, hi] is discarded, nothing inside it is.
        const lo = frame.vars.lo as number
        const hi = frame.vars.hi as number
        const n = arrayScene(frame).cells.length
        expect(count).toBe(n - Math.max(0, hi - lo + 1))
      }
    }
  })

  it('every look at least halves what is left, so the number of looks is at most floor(log2 n) + 1', () => {
    for (const { input, frames } of allClassicRuns()) {
      const looks = frames.filter((f) => f.at === 'mid').length
      expect(looks).toBeLessThanOrEqual(Math.floor(Math.log2(input.nums.length)) + 1)
    }
  })

  it('single element: one look, found; not found: lo passes hi', () => {
    const one = classic.run({ nums: [42], target: 42 })
    expect(one.result).toBe(0)
    expect(one.frames.filter((f) => f.at === 'mid')).toHaveLength(1)
    const miss = classic.run(cInput.presets[1].value as ClassicInput)
    expect(miss.result).toBe(-1)
    const done = miss.frames[miss.frames.length - 1]
    expect(done.at).toBe('done')
    expect(done.say).toMatch(/lo \(2\) has passed hi \(1\)/)
    expect(arrayScene(done).window ?? null).toBeNull()
    expect(roles(done, 'discarded')).toHaveLength(9)
  })
})

describe('binary-search/classic: predicts tell the truth', () => {
  it('which-half: the reveal drops exactly the half the answer says is gone', () => {
    let asked = 0
    const answers = new Set<unknown>()
    for (const { frames } of allClassicRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        expect(p.tag).toBe('which-half')
        expect(p.options).toEqual(['Left half', 'Right half'])
        asked++
        answers.add(p.answer)
        const reveal = frames[i + 1]
        // Keeping the left half means the right half was dropped, and vice versa.
        expect(reveal.at).toBe(p.answer === 'Left half' ? 'go-left' : 'go-right')
        const mid = frame.vars.mid as number
        if (p.answer === 'Left half') expect(reveal.vars.hi).toBe(mid - 1)
        else expect(reveal.vars.lo).toBe(mid + 1)
      })
    }
    expect(asked).toBeGreaterThan(0)
    expect(answers).toEqual(new Set(['Left half', 'Right half']))
  })

  it('is not asked when mid already holds the target', () => {
    for (const { frames } of allClassicRuns()) {
      for (const frame of frames) {
        if (frame.at === 'check' && frame.vars.mid !== null && frame.say.includes('found it')) expect(frame.predict).toBeUndefined()
      }
    }
  })

  it('asks on the default preset', () => {
    const tags = new Set(classic.run(cDefault).frames.flatMap((f) => (f.predict ? [f.predict.tag] : [])))
    expect(tags).toEqual(new Set(['which-half']))
  })
})

describe('binary-search/classic: input rules', () => {
  const ok = (nums: string, target: string) => cInput.parse({ nums, target })

  it('accepts friendly formats', () => {
    expect(ok('[2, 5, 8]', '5')).toEqual({ ok: true, value: { nums: [2, 5, 8], target: 5 } })
    expect(ok('-4 0 7', '0')).toEqual({ ok: true, value: { nums: [-4, 0, 7], target: 0 } })
    expect(ok('−4, 0', '−4')).toEqual({ ok: true, value: { nums: [-4, 0], target: -4 } })
  })

  it('rejects unsorted numbers and says which pair is out of order', () => {
    expect(ok('1, 5, 3', '3')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/in order.*3 comes after 5/) })
  })

  it('rejects repeats with a message that says why', () => {
    expect(ok('1, 3, 3, 7', '3')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/each number once.*3 appears twice/) })
  })

  it('names the limit when the list is too long, out of range or not a number', () => {
    expect(ok(Array.from({ length: 13 }, (_, i) => i).join(','), '2')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/at most 12/) })
    expect(ok('1, 100', '1')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/-99 and 99/) })
    expect(ok('1, two', '1')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/"two"/) })
    expect(ok('1, 2', '150')).toMatchObject({ ok: false, field: 'target' })
  })
})

// ===========================================================================
// binary-search/first-true
// ===========================================================================

const fInput = firstTrue.input
const fDefault = fInput.presets[0].value as FirstTrueInput

function allFirstTrueRuns(): Array<{ input: FirstTrueInput; frames: Frame[]; result: number }> {
  const inputs: FirstTrueInput[] = [...fInput.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => fInput.random(i + 1))]
  return inputs.map((value) => ({ input: value, ...firstTrue.run(value) }))
}

describe('binary-search/first-true: presets', () => {
  it('has the three teaching presets and their answers', () => {
    expect(fInput.presets.map((p) => p.value)).toEqual([
      { nums: [1, 3, 5, 5, 5, 8, 12, 15, 20], target: 5 },
      { nums: [2, 5, 8, 12, 16, 23, 38, 56, 72], target: 10 },
      { nums: [2, 5, 8, 12], target: 50 },
    ])
    expect(fInput.presets.map((p) => firstTrue.run(p.value).result)).toEqual([2, 3, 4])
  })

  it('default preset finds the FIRST 5 among repeats, using keep and skip', () => {
    const { frames, result } = firstTrue.run(fDefault)
    expect(result).toBe(2)
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect([count('init'), count('mid'), count('check'), count('keep'), count('skip'), count('done')]).toEqual([1, 3, 3, 2, 1, 1])
    const done = frames[frames.length - 1]
    expect(roles(done, 'found')).toEqual([2])
    expect(done.say).toMatch(/first number that is 5 or more/)
  })

  it('"nothing big enough" returns n, one past the end, with hi starting off the end', () => {
    const { frames, result } = firstTrue.run({ nums: [2, 5, 8, 12], target: 50 })
    expect(result).toBe(4)
    expect(frames[0].vars.hi).toBe(4)
    expect(arrayScene(frames[0]).pointers!.find((p) => p.name === 'hi')!.index).toBe(4)
    const done = frames[frames.length - 1]
    expect(done.say).toMatch(/one past the end/)
    expect(roles(done, 'found')).toEqual([])
  })

  it('always ends with lo == hi and the half-open window empties exactly then', () => {
    for (const { frames } of allFirstTrueRuns()) {
      const done = frames[frames.length - 1]
      expect(done.vars.lo).toBe(done.vars.hi)
      expect(arrayScene(done).window ?? null).toBeNull()
      for (const frame of frames.slice(0, -1)) {
        const { lo, hi } = frame.vars as { lo: number; hi: number }
        expect(lo).toBeLessThanOrEqual(hi)
        // [lo, hi) is half-open: the window's last cell is hi − 1.
        expect(arrayScene(frame).window ?? null).toEqual(lo < hi ? { start: lo, end: hi - 1 } : null)
      }
    }
  })
})

describe('binary-search/first-true: predicts tell the truth', () => {
  it('which-half (on mid): the check frame shows whether mid was big enough', () => {
    let asked = 0
    const answers = new Set<unknown>()
    for (const { frames } of allFirstTrueRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'which-half') return
        asked++
        answers.add(p.answer)
        expect(frame.at).toBe('mid')
        const reveal = frames[i + 1]
        expect(reveal.at).toBe('check')
        expect(reveal.say).toMatch(p.answer === 'Left half' ? /big enough/ : /too small/)
        // The two halves afterwards: left keeps hi = mid, right moves lo past mid.
        const after = frames[i + 2]
        expect(after.at).toBe(p.answer === 'Left half' ? 'keep' : 'skip')
      })
    }
    expect(asked).toBeGreaterThan(0)
    expect(answers).toEqual(new Set(['Left half', 'Right half']))
  })

  it('boundary (on check): keep means hi = mid, skip means lo = mid + 1', () => {
    let keep = 0
    let skip = 0
    for (const { frames } of allFirstTrueRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'boundary') return
        expect(p.options).toEqual(['Yes — keep it (hi = mid)', 'No — skip it (lo = mid + 1)'])
        const mid = frame.vars.mid as number
        const reveal = frames[i + 1]
        if (p.answer === p.options![0]) {
          keep++
          expect(reveal.at).toBe('keep')
          expect(reveal.vars.hi).toBe(mid)
        } else {
          skip++
          expect(reveal.at).toBe('skip')
          expect(reveal.vars.lo).toBe(mid + 1)
        }
      })
    }
    expect(keep).toBeGreaterThan(0)
    expect(skip).toBeGreaterThan(0)
  })

  it('asks both tags on the default preset', () => {
    const tags = new Set(firstTrue.run(fDefault).frames.flatMap((f) => (f.predict ? [f.predict.tag] : [])))
    expect(tags).toEqual(new Set(['which-half', 'boundary']))
  })
})

describe('binary-search/first-true: input rules', () => {
  const ok = (nums: string, target: string) => fInput.parse({ nums, target })

  it('allows repeats (they are the interesting case) but not unsorted numbers', () => {
    expect(ok('1, 3, 3, 7', '3')).toEqual({ ok: true, value: { nums: [1, 3, 3, 7], target: 3 } })
    expect(ok('1, 5, 3', '3')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/in order/) })
  })
})
