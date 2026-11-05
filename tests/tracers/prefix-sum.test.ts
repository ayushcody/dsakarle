/**
 * Extra checks for the prefix-sum tracers (range-sum, subarray-sum-k). The generic
 * contract suite (frames, anchors, code parity, parse, correctness...) runs from
 * registry.test.ts; the harness only deep-checks array scenes, so this file also
 * checks the composite scenes (array + array, array + hash-map), that predict
 * answers match what the next frame does, and the teaching beats of the
 * default presets.
 */
import { describe, expect, it } from 'vitest'
import rangeSum from '@/lib/tracers/prefix-sum/range-sum'
import type { RangeSumInput } from '@/lib/tracers/prefix-sum/range-sum'
import subarraySumK from '@/lib/tracers/prefix-sum/subarray-sum-k'
import type { SubarraySumKInput } from '@/lib/tracers/prefix-sum/subarray-sum-k'
import type { ArrayScene, Frame, HashMapScene, Scene } from '@/lib/engine/types'

const MINUS = '−'

function partsOf(scene: Scene): Exclude<Scene, { kind: 'composite' }>[] {
  if (scene.kind !== 'composite') throw new Error(`expected a composite scene, got ${scene.kind}`)
  return scene.parts.map((p) => p.scene)
}

function arrayPart(scene: Scene, index: number): ArrayScene {
  const part = partsOf(scene)[index]
  if (part.kind !== 'array') throw new Error(`part ${index} is ${part.kind}, not array`)
  return part
}

function mapPart(scene: Scene, index: number): HashMapScene {
  const part = partsOf(scene)[index]
  if (part.kind !== 'hash-map') throw new Error(`part ${index} is ${part.kind}, not hash-map`)
  return part
}

// ===========================================================================
// prefix-sum/range-sum
// ===========================================================================

const rs = rangeSum.input
const rsDefault = rs.presets[0].value as RangeSumInput

function allRangeRuns(): Array<{ input: RangeSumInput; frames: Frame[] }> {
  const inputs: RangeSumInput[] = [...rs.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => rs.random(i + 1))]
  return inputs.map((value) => ({ input: value, frames: rangeSum.run(value).frames }))
}

describe('prefix-sum/range-sum: default preset', () => {
  const { frames, result } = rangeSum.run(rsDefault)

  it('uses the N+1 convention: prefix[0] = 0 and one extra cell', () => {
    expect(rsDefault).toEqual({ nums: [3, -1, 4, 1, 5, 9], queries: [{ l: 2, r: 4 }, { l: 0, r: 1 }, { l: 3, r: 5 }] })
    expect(result.prefix).toEqual([0, 3, 2, 6, 7, 12, 21])
    expect(result.answers).toEqual([10, 2, 15])
  })

  it('walks init, 6 builds, then two frames per query', () => {
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect(frames).toHaveLength(13)
    expect([count('init'), count('build'), count('query')]).toEqual([1, 6, 6])
    expect(frames[0].at).toBe('init')
  })

  it('subtracts prefix[r + 1] − prefix[l], including l = 0 with no special case', () => {
    const q = frames.filter((f) => f.at === 'query')
    // Query 0..1: prefix[2] − prefix[0] = 2 − 0.
    expect(q[2].say).toContain('prefix[2] = 2')
    expect(q[2].say).toContain('prefix[0] = 0')
    expect(q[3].say).toContain('no special case')
    expect(q[3].say).toContain(`2 ${MINUS} 0 = 2`)
  })

  it('shows the prefix row filling in: cells to the right stay empty until built', () => {
    const builds = frames.filter((f) => f.at === 'build')
    builds.forEach((frame, i) => {
      const cells = arrayPart(frame.scene, 1).cells
      expect(cells).toHaveLength(rsDefault.nums.length + 1)
      expect(cells.slice(0, i + 2)).toEqual(result.prefix.slice(0, i + 2))
      expect(cells.slice(i + 2).every((c) => c === null)).toBe(true)
    })
  })
})

describe('prefix-sum/range-sum: scenes', () => {
  it('are a column of nums and a prefix row one cell longer, with in-range pointers and marks', () => {
    for (const { input, frames } of allRangeRuns()) {
      frames.forEach((frame, f) => {
        const where = `frame ${f} (${JSON.stringify(input)})`
        expect(frame.scene.kind, where).toBe('composite')
        if (frame.scene.kind !== 'composite') return
        expect(frame.scene.layout, where).toBe('column')
        const nums = arrayPart(frame.scene, 0)
        const prefix = arrayPart(frame.scene, 1)
        expect(nums.cells, where).toEqual(input.nums)
        expect(prefix.cells.length, where).toBe(input.nums.length + 1)
        expect(prefix.cells[0], `${where}: prefix[0] is 0 from the first frame`).toBe(0)
      })
    }
  })

  it('shows the window over nums[l..r] and compare marks on exactly prefix[l] and prefix[r + 1] while querying', () => {
    for (const { input, frames } of allRangeRuns()) {
      const queryFrames = frames.filter((f) => f.at === 'query')
      expect(queryFrames).toHaveLength(input.queries.length * 2)
      queryFrames.forEach((frame, f) => {
        const { l, r } = input.queries[Math.floor(f / 2)]
        const nums = arrayPart(frame.scene, 0)
        const prefix = arrayPart(frame.scene, 1)
        expect(nums.window).toEqual({ start: l, end: r })
        const compare = (prefix.marks ?? []).filter((m) => m.role === 'compare').map((m) => m.index).sort((a, b) => a - b)
        expect(compare).toEqual([l, r + 1])
        // The two prefix cells really do subtract to the numbers in the window.
        const sum = (prefix.cells[r + 1] as number) - (prefix.cells[l] as number)
        expect(sum).toBe(input.nums.slice(l, r + 1).reduce((a, b) => a + b, 0))
        if (f % 2 === 1) expect(frame.vars.answer).toBe(sum)
      })
    }
  })

  it('has every frame match its variables: i while building, l and r while querying', () => {
    for (const { frames } of allRangeRuns()) {
      for (const frame of frames) {
        if (frame.at === 'build') {
          expect(typeof frame.vars.i).toBe('number')
          expect(frame.vars.l).toBeNull()
        }
        if (frame.at === 'query') {
          expect(typeof frame.vars.l).toBe('number')
          expect(typeof frame.vars.r).toBe('number')
        }
      }
    }
  })
})

describe('prefix-sum/range-sum: predicts', () => {
  it('next-prefix answers equal the prefix cell the next frame fills in', () => {
    let asked = 0
    for (const { frames } of allRangeRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p || p.tag !== 'next-prefix') return
        asked++
        const index = Number(/What goes into prefix\[(\d+)\]/.exec(p.prompt)![1])
        const next = frames[i + 1]
        expect(next.at).toBe('build')
        expect(arrayPart(next.scene, 1).cells[index]).toBe(Number(p.answer))
        expect(new Set(p.options).size, 'options are distinct').toBe(p.options!.length)
        expect(p.options!.length).toBe(3)
      })
    }
    expect(asked).toBeGreaterThan(0)
  })

  it('which-cells answers name the two prefix cells the next frame marks', () => {
    let asked = 0
    for (const { frames } of allRangeRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p || p.tag !== 'which-cells') return
        asked++
        const match = /sum\((\d+)\.\.(\d+)\)/.exec(p.prompt)!
        const l = Number(match[1])
        const r = Number(match[2])
        const next = frames[i + 1]
        expect(next.at).toBe('query')
        expect(arrayPart(next.scene, 0).window).toEqual({ start: l, end: r })
        const marked = (arrayPart(next.scene, 1).marks ?? []).filter((m) => m.role === 'compare').map((m) => m.index)
        expect(p.answer).toBe(`prefix[${Math.max(...marked)}] ${MINUS} prefix[${Math.min(...marked)}]`)
        expect(p.options).toContain(p.answer)
        expect(new Set(p.options).size).toBe(p.options!.length)
      })
    }
    expect(asked).toBeGreaterThan(0)
  })

  it('asks which-cells before the first query and after each query but the last', () => {
    const { frames } = rangeSum.run(rsDefault)
    const asks = frames.map((f, i) => (f.predict?.tag === 'which-cells' ? i : -1)).filter((i) => i >= 0)
    expect(asks).toEqual([6, 8, 10])
  })
})

describe('prefix-sum/range-sum: input', () => {
  const base = rs.format(rsDefault)
  const bad = (override: Record<string, string>): string => {
    const result = rs.parse({ ...base, ...override })
    expect(result.ok, `should reject ${JSON.stringify(override)}`).toBe(false)
    return result.ok ? '' : result.error
  }

  it('rejects out-of-range, reversed, malformed and too many queries kindly', () => {
    expect(bad({ queries: '0-99' })).toMatch(/too big/)
    expect(bad({ queries: '4-2' })).toMatch(/smaller first/)
    expect(bad({ queries: '2 to 4' })).toMatch(/2-4/)
    expect(bad({ queries: '0-1, 1-2, 2-3, 3-4' })).toMatch(/at most 3/)
    expect(bad({ queries: '-1-2' })).toMatch(/2-4/)
  })

  it('accepts spaces, brackets and typographic dashes', () => {
    const result = rs.parse({ nums: '[3, -1, 4, 1]', queries: ' 0 – 2 ,1-3 ' })
    expect(result).toEqual({ ok: true, value: { nums: [3, -1, 4, 1], queries: [{ l: 0, r: 2 }, { l: 1, r: 3 }] } })
  })

  it('handles a single number and the extreme values', () => {
    const one = rangeSum.run({ nums: [-99], queries: [{ l: 0, r: 0 }] })
    expect(one.result).toEqual({ prefix: [0, -99], answers: [-99] })
    const big = Array.from({ length: 10 }, () => 99)
    const run = rangeSum.run({ nums: big, queries: [{ l: 0, r: 9 }] })
    expect(run.result.answers).toEqual([990])
    for (const frame of run.frames) expect(frame.say.length).toBeLessThanOrEqual(140)
  })
})

// ===========================================================================
// prefix-sum/subarray-sum-k
// ===========================================================================

const bucketOf = (sum: number): number => ((sum % 5) + 5) % 5

const sk = subarraySumK.input
const skDefault = sk.presets[0].value as SubarraySumKInput

function allSubarrayRuns(): Array<{ input: SubarraySumKInput; frames: Frame[] }> {
  const inputs: SubarraySumKInput[] = [...sk.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => sk.random(i + 1))]
  return inputs.map((value) => ({ input: value, frames: subarraySumK.run(value).frames }))
}

describe('prefix-sum/subarray-sum-k: default preset', () => {
  const { frames, result } = subarraySumK.run(skDefault)

  it('counts 4: [2,-3,4], [4,1,-2], [-3,4,1,-2,3] and [3]', () => {
    expect(skDefault).toEqual({ nums: [2, -3, 4, 1, -2, 3], k: 3 })
    expect(result).toBe(4)
    expect(frames[frames.length - 1].say).toBe('Done: 4 stretches of nums add up to 3.')
  })

  it('walks init, then add, check and store for each of 6 numbers, then done', () => {
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect(frames).toHaveLength(20)
    expect([count('init'), count('add'), count('check'), count('store'), count('done')]).toEqual([1, 6, 6, 6, 1])
    expect(frames[0].at).toBe('init')
  })

  it('starts with 0 seen once and shows a repeat count of 2 for the running sum 2', () => {
    expect(mapPart(frames[0].scene, 1).buckets[0]).toEqual([{ key: 0, value: 1 }])
    const last = frames[frames.length - 1]
    const buckets = mapPart(last.scene, 1).buckets
    // Running sums: 0 (initial), 2, -1, 3, 4, 2, 5. The sum 2 was seen twice.
    expect(buckets[2]).toEqual([{ key: 2, value: 2 }])
  })

  it('explains the negative-bucket arithmetic exactly once', () => {
    const mentions = frames.filter((f) => f.say.includes('% 5) + 5) % 5'))
    expect(mentions).toHaveLength(1)
    expect(mentions[0].at).toBe('check')
    expect(mentions[0].say).toContain('((-1 % 5) + 5) % 5 = 4')
  })
})

describe('prefix-sum/subarray-sum-k: scenes', () => {
  it('are a column of nums and a 5-bucket map; every key sits in ((sum % 5) + 5) % 5', () => {
    for (const { input, frames } of allSubarrayRuns()) {
      frames.forEach((frame, f) => {
        const where = `frame ${f} (${JSON.stringify(input)})`
        expect(frame.scene.kind, where).toBe('composite')
        const nums = arrayPart(frame.scene, 0)
        const map = mapPart(frame.scene, 1)
        expect(nums.cells, where).toEqual(input.nums)
        expect(map.buckets, where).toHaveLength(5)
        map.buckets.forEach((chain, b) => {
          const keys = new Set<number | string>()
          for (const entry of chain) {
            expect(bucketOf(entry.key as number), `${where}: key ${entry.key} in bucket ${b}`).toBe(b)
            expect(keys.has(entry.key), `${where}: duplicate key`).toBe(false)
            keys.add(entry.key)
            expect(Number.isInteger(entry.value) && (entry.value as number) >= 1, `${where}: count`).toBe(true)
          }
        })
        if (map.hashing) {
          expect(map.hashing.bucket, where).toBe(bucketOf(map.hashing.key as number))
          expect(map.hashing.hash, where).toBe(map.hashing.key)
        }
        for (const m of map.marks ?? []) {
          expect(m.bucket >= 0 && m.bucket < 5, where).toBe(true)
          if (m.slot !== undefined) expect(m.slot >= 0 && m.slot < map.buckets[m.bucket].length, `${where}: slot ${m.slot}`).toBe(true)
        }
      })
    }
  })

  it('counts every running sum seen so far (n + 1 by the end), and the stored total matches', () => {
    for (const { input, frames } of allSubarrayRuns()) {
      frames.forEach((frame) => {
        const map = mapPart(frame.scene, 1)
        const total = map.buckets.flat().reduce((sum, e) => sum + (e.value as number), 0)
        const stored = frames.filter((f) => f.at === 'store' && frames.indexOf(f) <= frames.indexOf(frame)).length
        expect(total).toBe(1 + stored)
      })
      const last = frames[frames.length - 1]
      expect(mapPart(last.scene, 1).buckets.flat().reduce((sum, e) => sum + (e.value as number), 0)).toBe(input.nums.length + 1)
    }
  })

  it('keeps the running sum and need in the variables, and need = running − k on check frames', () => {
    for (const { input, frames } of allSubarrayRuns()) {
      let running = 0
      for (const frame of frames) {
        if (frame.at === 'add') {
          running += input.nums[frame.vars.i as number]
          expect(frame.vars.running).toBe(running)
        }
        if (frame.at === 'check') expect(frame.vars.need).toBe((frame.vars.running as number) - input.k)
      }
    }
  })

  it('keeps narration within 140 characters even with the biggest allowed numbers', () => {
    const run = subarraySumK.run({ nums: [-99, -99, -99, -99, -99, -99, -99, -99, -99, -99], k: 99 })
    for (const frame of run.frames) expect(frame.say.length, frame.say).toBeLessThanOrEqual(140)
    const zeros = subarraySumK.run({ nums: Array.from({ length: 10 }, () => 0), k: 0 })
    expect(zeros.result).toBe(55)
    for (const frame of zeros.frames) expect(frame.say.length, frame.say).toBeLessThanOrEqual(140)
  })
})

describe('prefix-sum/subarray-sum-k: predicts', () => {
  it('seen-it answers match whether the next (check) frame finds the key', () => {
    let yes = 0
    let no = 0
    for (const { frames } of allSubarrayRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        expect(p.tag).toBe('seen-it')
        expect(p.options).toEqual(['Yes', 'No'])
        const next = frames[i + 1]
        expect(next.at).toBe('check')
        const found = (mapPart(next.scene, 1).marks ?? []).some((m) => m.role === 'found')
        expect(p.answer).toBe(found ? 'Yes' : 'No')
        const match = /Running sum (-?\d+), k = (-?\d+): is (-?\d+) in the map\?/.exec(p.prompt)!
        expect(Number(match[3])).toBe(Number(match[1]) - Number(match[2]))
        expect(next.vars.need).toBe(Number(match[3]))
        if (found) yes++
        else no++
      })
    }
    expect(yes).toBeGreaterThan(0)
    expect(no).toBeGreaterThan(0)
  })

  it('asks seen-it on every add frame', () => {
    const { frames } = subarraySumK.run(skDefault)
    frames.forEach((f) => expect(Boolean(f.predict)).toBe(f.at === 'add'))
  })
})

describe('prefix-sum/subarray-sum-k: input', () => {
  const base = sk.format(skDefault)

  it('rejects k out of range, and accepts negative k and typographic minus', () => {
    expect(sk.parse({ ...base, k: '100' }).ok).toBe(false)
    expect(sk.parse({ ...base, k: '-100' }).ok).toBe(false)
    expect(sk.parse({ ...base, k: '−3' })).toEqual({ ok: true, value: { nums: skDefault.nums, k: -3 } })
  })

  it('"Zeros pile up" counts all 10 stretches', () => {
    expect(subarraySumK.run(sk.presets[1].value as SubarraySumKInput).result).toBe(10)
  })
})
