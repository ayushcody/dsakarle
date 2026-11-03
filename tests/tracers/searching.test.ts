/**
 * Extra checks for the searching tracers (rotated-search, rotated-min). The generic
 * contract suite (frames, anchors, code parity, parse, correctness...) runs from
 * registry.test.ts; this file asserts what only these tracers can know: that
 * their predict answers are true, that the sorted-half and drop logic holds, and
 * the teaching beats of the default presets.
 */
import { describe, expect, it } from 'vitest'
import rotatedSearch from '@/lib/tracers/searching/rotated-search'
import type { RotatedSearchInput } from '@/lib/tracers/searching/rotated-search'
import rotatedMin from '@/lib/tracers/searching/rotated-min'
import type { RotatedMinInput } from '@/lib/tracers/searching/rotated-min'
import type { ArrayScene, Frame } from '@/lib/engine/types'

function arrayScene(frame: Frame): ArrayScene {
  if (frame.scene.kind !== 'array') throw new Error('expected an array scene')
  return frame.scene
}

function roles(frame: Frame, role: string): number[] {
  return (arrayScene(frame).marks ?? []).filter((m) => m.role === role).map((m) => m.index)
}

/** True when `nums` is a rotation of a strictly increasing list. */
function isRotatedSorted(nums: number[]): boolean {
  const sorted = [...nums].sort((a, b) => a - b)
  if (new Set(nums).size !== nums.length) return false
  for (let turn = 0; turn < nums.length; turn++) {
    if (nums.every((value, i) => value === sorted[(i + turn) % nums.length])) return true
  }
  return false
}

// ===========================================================================
// searching/rotated-search
// ===========================================================================

const sInput = rotatedSearch.input
const sDefault = sInput.presets[0].value as RotatedSearchInput

function allSearchRuns(): Array<{ input: RotatedSearchInput; frames: Frame[]; result: number }> {
  const inputs: RotatedSearchInput[] = [...sInput.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => sInput.random(i + 1))]
  return inputs.map((value) => ({ input: value, ...rotatedSearch.run(value) }))
}

describe('searching/rotated-search: presets', () => {
  it('has the three teaching presets and their answers', () => {
    expect(sInput.presets.map((p) => p.value)).toEqual([
      { nums: [6, 7, 8, 1, 2, 3, 4, 5], target: 2 },
      { nums: [4, 5, 6, 7, 0, 1, 2], target: 0 },
      { nums: [4, 5, 6, 7, 0, 1, 2], target: 3 },
    ])
    expect(sInput.presets.map((p) => rotatedSearch.run(p.value).result)).toEqual([4, 4, -1])
  })

  it('default preset shows BOTH sorted-half cases and both moves', () => {
    const { frames, result } = rotatedSearch.run(sDefault)
    expect(result).toBe(4)
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect([count('init'), count('mid'), count('check'), count('which'), count('inside'), count('go-left'), count('go-right'), count('done')]).toEqual([1, 3, 3, 2, 2, 1, 1, 1])
    const whichSays = frames.filter((f) => f.at === 'which').map((f) => f.say)
    expect(whichSays[0]).toMatch(/right half 1\.\.5 is sorted/)
    expect(whichSays[1]).toMatch(/left half 2\.\.3 is sorted/)
    expect(frames.filter((f) => f.at === 'mid').map((f) => f.vars.mid)).toEqual([3, 5, 4])
  })

  it('the classic preset is the LeetCode example: 0 in [4,5,6,7,0,1,2] is at index 4', () => {
    expect(rotatedSearch.run({ nums: [4, 5, 6, 7, 0, 1, 2], target: 0 }).result).toBe(4)
  })

  it('"not found" ends with lo passed hi and everything out of play', () => {
    const { frames, result } = rotatedSearch.run(sInput.presets[2].value as RotatedSearchInput)
    expect(result).toBe(-1)
    const done = frames[frames.length - 1]
    expect(done.at).toBe('done')
    expect(done.say).toMatch(/passed hi.*3 isn't here/)
    expect(arrayScene(done).window ?? null).toBeNull()
    expect(roles(done, 'discarded')).toHaveLength(7)
  })

  it('a found run ends with the target marked found', () => {
    const { frames } = rotatedSearch.run(sDefault)
    const done = frames[frames.length - 1]
    expect(roles(done, 'found')).toEqual([4])
    expect(roles(done, 'discarded')).toHaveLength(7)
    expect(done.say).toMatch(/Found 2 at index 4/)
  })

  it('single element works both ways', () => {
    expect(rotatedSearch.run({ nums: [5], target: 5 }).result).toBe(0)
    expect(rotatedSearch.run({ nums: [5], target: 9 }).result).toBe(-1)
  })
})

describe('searching/rotated-search: the sorted-half logic holds', () => {
  it('on every which frame the marked half really is in increasing order', () => {
    let seen = 0
    for (const { frames } of allSearchRuns()) {
      for (const frame of frames) {
        if (frame.at !== 'which') continue
        seen++
        const scene = arrayScene(frame)
        const cells = scene.cells as number[]
        const marked = roles(frame, 'compare').sort((a, b) => a - b)
        const values = marked.map((i) => cells[i])
        expect(values, `marked cells ${marked}`).toEqual([...values].sort((a, b) => a - b))
        const lo = frame.vars.lo as number
        const mid = frame.vars.mid as number
        const hi = frame.vars.hi as number
        // Left half is lo..mid, right half is mid..hi.
        expect(marked[0]).toBe(cells[lo] <= cells[mid] ? lo : mid)
        expect(marked[marked.length - 1]).toBe(cells[lo] <= cells[mid] ? mid : hi)
        expect(scene.annotations?.[0]?.text).toMatch(/^sorted /)
      }
    }
    expect(seen).toBeGreaterThan(0)
  })

  it('the cells outside [lo, hi] are exactly the discarded ones and pile up over time', () => {
    for (const { frames } of allSearchRuns()) {
      let discarded = 0
      for (const frame of frames) {
        if (frame.at === 'done' && roles(frame, 'found').length > 0) continue
        const count = roles(frame, 'discarded').length
        expect(count).toBeGreaterThanOrEqual(discarded)
        discarded = count
        const lo = frame.vars.lo as number
        const hi = frame.vars.hi as number
        const n = arrayScene(frame).cells.length
        expect(count).toBe(n - Math.max(0, hi - lo + 1))
      }
    }
  })

  it('never drops the target while it is in the array: it stays within [lo, hi] until found', () => {
    for (const { input, frames } of allSearchRuns()) {
      const where = input.nums.indexOf(input.target)
      if (where < 0) continue
      for (const frame of frames) {
        if (frame.at === 'done') continue
        expect(frame.vars.lo as number).toBeLessThanOrEqual(where)
        expect(frame.vars.hi as number).toBeGreaterThanOrEqual(where)
      }
    }
  })

  it('needs at most floor(log2 n) + 1 rounds', () => {
    for (const { input, frames } of allSearchRuns()) {
      const rounds = frames.filter((f) => f.at === 'mid').length
      expect(rounds).toBeLessThanOrEqual(Math.floor(Math.log2(input.nums.length)) + 1)
    }
  })

  it('every random input is a rotated sorted list', () => {
    for (let seed = 1; seed <= 200; seed++) expect(isRotatedSorted(sInput.random(seed).nums)).toBe(true)
  })
})

describe('searching/rotated-search: predicts tell the truth', () => {
  it('which-half-sorted (on check): the which frame marks that half, and only asks when the range has a drop', () => {
    let asked = 0
    const answers = new Set<unknown>()
    for (const { frames } of allSearchRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'which-half-sorted') return
        asked++
        answers.add(p.answer)
        expect(frame.at).toBe('check')
        expect(p.options).toEqual(['Left half', 'Right half'])
        const lo = frame.vars.lo as number
        const hi = frame.vars.hi as number
        const mid = frame.vars.mid as number
        const cells = arrayScene(frame).cells as number[]
        expect(cells[lo], 'asked on a range with no drop').toBeGreaterThan(cells[hi])
        const reveal = frames[i + 1]
        expect(reveal.at).toBe('which')
        const marked = roles(reveal, 'compare').sort((a, b) => a - b)
        if (p.answer === 'Left half') expect([marked[0], marked[marked.length - 1]]).toEqual([lo, mid])
        else expect([marked[0], marked[marked.length - 1]]).toEqual([mid, hi])
        // The sorted half the answer names is genuinely increasing.
        const values = marked.map((index) => cells[index])
        expect(values).toEqual([...values].sort((a, b) => a - b))
      })
    }
    expect(asked).toBeGreaterThan(0)
    expect(answers).toEqual(new Set(['Left half', 'Right half']))
  })

  it('go-where (on which): the answer is the half the very next move keeps', () => {
    let asked = 0
    const answers = new Set<unknown>()
    for (const { frames } of allSearchRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'go-where') return
        asked++
        answers.add(p.answer)
        expect(frame.at).toBe('which')
        expect(p.options).toEqual(['Left half', 'Right half'])
        expect(frames[i + 1].at).toBe('inside')
        const move = frames[i + 2]
        expect(move.at).toBe(p.answer === 'Left half' ? 'go-left' : 'go-right')
        const mid = frame.vars.mid as number
        if (p.answer === 'Left half') expect(move.vars.hi).toBe(mid - 1)
        else expect(move.vars.lo).toBe(mid + 1)
      })
    }
    expect(asked).toBeGreaterThan(0)
    expect(answers).toEqual(new Set(['Left half', 'Right half']))
  })

  it('is never asked when mid already holds the target or only one cell is left', () => {
    for (const { frames } of allSearchRuns()) {
      frames.forEach((frame, i) => {
        if (frame.at === 'check' && frame.say.includes('found it')) expect(frame.predict).toBeUndefined()
        if (frame.predict) expect(frame.vars.lo as number).toBeLessThan(frame.vars.hi as number)
        if (frame.predict) expect(frames[i + 1]).toBeDefined()
      })
    }
  })

  it('asks both tags on the default preset', () => {
    const tags = new Set(rotatedSearch.run(sDefault).frames.flatMap((f) => (f.predict ? [f.predict.tag] : [])))
    expect(tags).toEqual(new Set(['which-half-sorted', 'go-where']))
  })

  it('names the comparison in the which-half prompt', () => {
    const asked = rotatedSearch.run(sDefault).frames.find((f) => f.predict?.tag === 'which-half-sorted')!
    expect(asked.predict!.prompt).toBe('nums[lo] = 6 > nums[mid] = 1. Which half is sorted?')
  })
})

describe('searching/rotated-search: input rules', () => {
  const ok = (nums: string, target: string) => sInput.parse({ nums, target })

  it('accepts friendly formats, including a list that was never rotated', () => {
    expect(ok('[4, 5, 6, 7, 0, 1, 2]', '0')).toEqual({ ok: true, value: { nums: [4, 5, 6, 7, 0, 1, 2], target: 0 } })
    expect(ok('3 1 2', '1')).toEqual({ ok: true, value: { nums: [3, 1, 2], target: 1 } })
    expect(ok('1, 2, 3', '2')).toEqual({ ok: true, value: { nums: [1, 2, 3], target: 2 } })
    expect(ok('−4, −2, −9', '−2')).toEqual({ ok: true, value: { nums: [-4, -2, -9], target: -2 } })
    expect(ok('7', '7')).toEqual({ ok: true, value: { nums: [7], target: 7 } })
  })

  it('rejects lists that are not a rotation of a sorted list, and says why', () => {
    expect(ok('1, 5, 3, 2', '3')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/rotated sorted list.*5 → 3 and again at 3 → 2/) })
    expect(ok('1, 5, 3, 4', '3')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/wraps around.*last number \(4\).*first \(1\)/) })
    expect(ok('5, 4, 3', '3')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/drops at 5 → 4 and again at 4 → 3/) })
    expect(ok('4, 5, 1, 6', '5')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/wraps around.*last number \(6\).*first \(4\)/) })
  })

  it('rejects repeats: this problem needs different values', () => {
    expect(ok('2, 2, 3', '2')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/each number once.*2 appears twice/) })
    expect(ok('3, 1, 2, 3', '2')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/3 appears twice/) })
  })

  it('names the limit when the list is too long, out of range or not a number', () => {
    expect(ok(Array.from({ length: 13 }, (_, i) => i).join(','), '2')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/at most 12/) })
    expect(ok('1, 100', '1')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/-99 and 99/) })
    expect(ok('1, two', '1')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/"two"/) })
    expect(ok('1, 2', '150')).toMatchObject({ ok: false, field: 'target' })
    expect(ok('1, 2', '')).toMatchObject({ ok: false, field: 'target' })
  })

  it('keeps every friendly error short enough to read', () => {
    const worst = [ok('99, -99, 98, -98', '0'), ok('-99, 99, -98, 98', '0'), ok('90, 91, -99, 99', '0')]
    for (const result of worst) {
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.length).toBeLessThanOrEqual(140)
    }
  })
})

// ===========================================================================
// searching/rotated-min
// ===========================================================================

const mInput = rotatedMin.input
const mDefault = mInput.presets[0].value as RotatedMinInput

function allMinRuns(): Array<{ input: RotatedMinInput; frames: Frame[]; result: number }> {
  const inputs: RotatedMinInput[] = [...mInput.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => mInput.random(i + 1))]
  return inputs.map((value) => ({ input: value, ...rotatedMin.run(value) }))
}

describe('searching/rotated-min: presets', () => {
  it('has the three teaching presets and their answers', () => {
    expect(mInput.presets.map((p) => p.value)).toEqual([
      { nums: [4, 5, 6, 7, 0, 1, 2] },
      { nums: [8, 9, 1, 2, 3, 4, 5, 6, 7] },
      { nums: [11, 13, 15, 17, 19] },
    ])
    expect(mInput.presets.map((p) => rotatedMin.run(p.value).result)).toEqual([0, 1, 11])
  })

  it('default preset moves lo once and hi twice, then lo meets hi on the minimum', () => {
    const { frames, result } = rotatedMin.run(mDefault)
    expect(result).toBe(0)
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect([count('init'), count('mid'), count('compare'), count('go-right'), count('go-left'), count('done')]).toEqual([1, 3, 3, 1, 2, 1])
    expect(frames.filter((f) => f.at === 'mid').map((f) => f.vars.mid)).toEqual([3, 5, 4])
    const done = frames[frames.length - 1]
    expect(roles(done, 'found')).toEqual([4])
    expect(roles(done, 'discarded')).toHaveLength(6)
    expect(done.say).toMatch(/0 is the minimum/)
  })

  it('a list that was never rotated keeps hi moving left until it hits index 0', () => {
    const { frames, result } = rotatedMin.run(mInput.presets[2].value as RotatedMinInput)
    expect(result).toBe(11)
    expect(frames.filter((f) => f.at === 'go-right')).toHaveLength(0)
    expect(frames[frames.length - 1].vars.lo).toBe(0)
  })

  it('single element: init and done only', () => {
    const { frames, result } = rotatedMin.run({ nums: [42] })
    expect(result).toBe(42)
    expect(frames.map((f) => f.at)).toEqual(['init', 'done'])
  })
})

describe('searching/rotated-min: the drop logic holds', () => {
  it('the minimum always stays inside [lo, hi] until the end', () => {
    for (const { input, frames, result } of allMinRuns()) {
      const where = input.nums.indexOf(result)
      for (const frame of frames) {
        expect(frame.vars.lo as number).toBeLessThanOrEqual(where)
        expect(frame.vars.hi as number).toBeGreaterThanOrEqual(where)
      }
    }
  })

  it('discarded cells are exactly those outside [lo, hi] (found frame excepted), and the gauge never grows', () => {
    for (const { frames } of allMinRuns()) {
      let candidates = Infinity
      for (const frame of frames) {
        const last = frame.at === 'done'
        const count = roles(frame, 'discarded').length
        const lo = frame.vars.lo as number
        const hi = frame.vars.hi as number
        const n = arrayScene(frame).cells.length
        expect(count).toBe(n - (hi - lo + 1))
        expect(frame.gauge!.value).toBeLessThanOrEqual(candidates)
        candidates = frame.gauge!.value
        if (last) expect(lo).toBe(hi)
      }
    }
  })

  it('compare frames mark mid and hi, and annotate the side that is sorted', () => {
    for (const { frames } of allMinRuns()) {
      for (const frame of frames) {
        if (frame.at !== 'compare') continue
        const mid = frame.vars.mid as number
        const hi = frame.vars.hi as number
        expect(roles(frame, 'compare').sort((a, b) => a - b)).toEqual([mid, hi])
        const cells = arrayScene(frame).cells as number[]
        const texts = (arrayScene(frame).annotations ?? []).map((a) => a.text)
        expect(texts[0]).toBe(`${cells[mid]} ${cells[mid] > cells[hi] ? '>' : '<'} ${cells[hi]}`)
        if (cells[mid] < cells[hi]) expect(texts).toContain('right half sorted')
      }
    }
  })

  it('needs at most floor(log2 n) + 1 rounds', () => {
    for (const { input, frames } of allMinRuns()) {
      const rounds = frames.filter((f) => f.at === 'mid').length
      expect(rounds).toBeLessThanOrEqual(Math.floor(Math.log2(input.nums.length)) + 1)
    }
  })

  it('every random input is a rotated sorted list', () => {
    for (let seed = 1; seed <= 200; seed++) expect(isRotatedSorted(mInput.random(seed).nums)).toBe(true)
  })
})

describe('searching/rotated-min: predicts tell the truth', () => {
  it('min-side (on mid): the next frame compares, then lo or hi moves the way the answer says', () => {
    let asked = 0
    const answers = new Set<unknown>()
    for (const { frames } of allMinRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        expect(p.tag).toBe('min-side')
        expect(frame.at).toBe('mid')
        expect(p.options).toEqual(['Right of mid', 'At mid or to its left'])
        asked++
        answers.add(p.answer)
        expect(frames[i + 1].at).toBe('compare')
        const move = frames[i + 2]
        const mid = frame.vars.mid as number
        if (p.answer === 'Right of mid') {
          expect(move.at).toBe('go-right')
          expect(move.vars.lo).toBe(mid + 1)
        } else {
          expect(move.at).toBe('go-left')
          expect(move.vars.hi).toBe(mid)
        }
      })
    }
    expect(asked).toBeGreaterThan(0)
    expect(answers).toEqual(new Set(['Right of mid', 'At mid or to its left']))
  })

  it('asks on the default preset', () => {
    const tags = new Set(rotatedMin.run(mDefault).frames.flatMap((f) => (f.predict ? [f.predict.tag] : [])))
    expect(tags).toEqual(new Set(['min-side']))
  })
})

describe('searching/rotated-min: input rules', () => {
  const ok = (nums: string) => mInput.parse({ nums })

  it('accepts friendly formats and rejects what is not a rotated sorted list', () => {
    expect(ok('[3, 4, 5, 1, 2]')).toEqual({ ok: true, value: { nums: [3, 4, 5, 1, 2] } })
    expect(ok('1, 3, 2, 4')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/rotated sorted list|wraps around/) })
    expect(ok('1, 1')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/1 appears twice/) })
  })
})
