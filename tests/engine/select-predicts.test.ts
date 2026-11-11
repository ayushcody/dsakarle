import { describe, expect, it } from 'vitest'

import { selectPredicts } from '@/lib/engine/select-predicts'
import { mkFrame, mkFrames } from './helpers'

describe('selectPredicts', () => {
  it('returns [] when config is missing or empty', () => {
    const frames = mkFrames(10, [1, 2, 3])
    expect(selectPredicts(frames, undefined)).toEqual([])
    expect(selectPredicts(frames, null)).toEqual([])
    expect(selectPredicts(frames, { tags: [], max: 3 })).toEqual([])
    expect(selectPredicts(frames, { tags: ['decide'], max: 0 })).toEqual([])
  })

  it('filters by tag', () => {
    const frames = [mkFrame(0, { tag: 'a' }), mkFrame(1, { tag: 'b' }), mkFrame(2, { tag: 'a' }), mkFrame(3)]
    expect(selectPredicts(frames, { tags: ['a'], max: 5 })).toEqual([0, 2])
    expect(selectPredicts(frames, { tags: ['b'], max: 5 })).toEqual([1])
    expect(selectPredicts(frames, { tags: ['zzz'], max: 5 })).toEqual([])
  })

  it('never selects the last frame', () => {
    const frames = mkFrames(5, [3, 4])
    expect(selectPredicts(frames, { tags: ['decide'], max: 5 })).toEqual([3])
  })

  it('respects max and spreads picks across the run', () => {
    const idx = Array.from({ length: 30 }, (_, i) => i)
    const frames = mkFrames(31, idx)
    const out = selectPredicts(frames, { tags: ['decide'], max: 3 })
    expect(out).toHaveLength(3)
    expect(out).toEqual([...out].sort((a, b) => a - b))
    expect(new Set(out).size).toBe(3)
    // not bunched at the start: one in each third
    expect(out[0]).toBeLessThan(10)
    expect(out[1]).toBeGreaterThanOrEqual(10)
    expect(out[1]).toBeLessThan(20)
    expect(out[2]).toBeGreaterThanOrEqual(20)
  })

  it('returns all candidates when there are fewer than max', () => {
    const frames = mkFrames(10, [2, 5])
    expect(selectPredicts(frames, { tags: ['decide'], max: 4 })).toEqual([2, 5])
  })

  it('gives distinct indices for every n > max', () => {
    for (let n = 2; n < 40; n++) {
      for (let max = 1; max < n; max++) {
        const frames = mkFrames(n + 1, Array.from({ length: n }, (_, i) => i))
        const out = selectPredicts(frames, { tags: ['decide'], max })
        expect(new Set(out).size).toBe(max)
      }
    }
  })

  it('is deterministic', () => {
    const frames = mkFrames(50, Array.from({ length: 49 }, (_, i) => i))
    const cfg = { tags: ['decide'], max: 4 }
    expect(selectPredicts(frames, cfg)).toEqual(selectPredicts(frames, cfg))
  })
})
