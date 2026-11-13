/**
 * Extra checks for the sorting tracers (insertion-sort, merge-sort, quick-sort).
 * The generic contract suite (frames, anchors, code parity, parse, correctness...)
 * runs from registry.test.ts; this file asserts what only these tracers can know:
 * that their predict answers are true, the scene is sane (composite buffer, window,
 * pointers), the sort invariants hold frame by frame, and the teaching beats of the
 * default presets.
 */
import { describe, expect, it } from 'vitest'
import insertion from '@/lib/tracers/sorting/insertion-sort'
import merge from '@/lib/tracers/sorting/merge-sort'
import quick from '@/lib/tracers/sorting/quick-sort'
import heapSort from '@/lib/tracers/sorting/heap-sort'
import bubble from '@/lib/tracers/sorting/bubble-sort'
import selection from '@/lib/tracers/sorting/selection-sort'
import type { SortInput } from '@/lib/tracers/sorting/shared'
import type { AnyTracer, ArrayScene, Frame } from '@/lib/engine/types'

function arrayScene(frame: Frame): ArrayScene {
  if (frame.scene.kind !== 'array') throw new Error('expected an array scene')
  return frame.scene
}

/** The `nums` and `merged` parts of a merge-sort frame. */
function parts(frame: Frame): { nums: ArrayScene; buffer: ArrayScene } {
  if (frame.scene.kind !== 'composite') throw new Error('expected a composite scene')
  const [a, b] = frame.scene.parts
  if (a.scene.kind !== 'array' || b.scene.kind !== 'array') throw new Error('expected array parts')
  return { nums: a.scene, buffer: b.scene }
}

function roles(scene: ArrayScene, role: string): number[] {
  return (scene.marks ?? []).filter((m) => m.role === role).map((m) => m.index)
}

function runs(tracer: AnyTracer): Array<{ input: SortInput; frames: Frame[]; result: number[] }> {
  const inputs: SortInput[] = [
    ...tracer.input.presets.map((p) => p.value as SortInput),
    ...Array.from({ length: 200 }, (_, i) => tracer.input.random(i + 1) as SortInput),
    { nums: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1] },
    { nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    { nums: [7, 7, 7, 7, 7, 7] },
    { nums: [2, 1] },
  ]
  return inputs.map((input) => ({ input, ...tracer.run(input) }))
}

const count = (frames: Frame[], at: string): number => frames.filter((f) => f.at === at).length

// ===========================================================================
// shared input rules
// ===========================================================================

describe('sorting: input rules', () => {
  const ok = (nums: string) => insertion.input.parse({ nums })

  it('accepts friendly formats, repeats and negatives', () => {
    expect(ok('[5, 2, 4]')).toEqual({ ok: true, value: { nums: [5, 2, 4] } })
    expect(ok('3 3 -1')).toEqual({ ok: true, value: { nums: [3, 3, -1] } })
    expect(ok('−4, 0')).toEqual({ ok: true, value: { nums: [-4, 0] } })
  })

  it('needs at least two numbers and names the limit when there are too many', () => {
    expect(ok('7')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/at least two/) })
    expect(ok(Array.from({ length: 13 }, (_, i) => i).join(','))).toMatchObject({ ok: false, error: expect.stringMatching(/at most 12/) })
    expect(ok('1, 100')).toMatchObject({ ok: false, error: expect.stringMatching(/-99 and 99/) })
    expect(ok('1, two')).toMatchObject({ ok: false, error: expect.stringMatching(/"two"/) })
  })

  it('all three tracers share the same input rules and presets stay within them', () => {
    for (const t of [insertion, merge, quick]) {
      expect(t.input.limits).toEqual({ maxN: 12, min: -99, max: 99 })
      expect(t.input.parse({ nums: '1' }).ok).toBe(false)
    }
  })
})

// ===========================================================================
// sorting/insertion-sort
// ===========================================================================

describe('sorting/insertion-sort: default preset', () => {
  const { frames, result } = insertion.run(insertion.input.presets[0].value)

  it('sorts [5, 2, 4, 6, 1, 3] and uses every rule', () => {
    expect(insertion.input.presets[0].value).toEqual({ nums: [5, 2, 4, 6, 1, 3] })
    expect(result).toEqual([1, 2, 3, 4, 5, 6])
    expect(frames).toHaveLength(33)
    for (const at of ['init', 'pick', 'compare', 'shift', 'place', 'done']) expect(count(frames, at), `rule ${at}`).toBeGreaterThan(0)
    expect(count(frames, 'pick')).toBe(5)
    expect(count(frames, 'place')).toBe(5)
  })

  it('shifts exactly as many times as there are inversions (Σ cards bigger and left of each)', () => {
    const nums = [5, 2, 4, 6, 1, 3]
    let inversions = 0
    for (let i = 0; i < nums.length; i++) for (let j = 0; j < i; j++) if (nums[j] > nums[i]) inversions++
    expect(count(frames, 'shift')).toBe(inversions)
  })

  it('best case (sorted) never shifts, worst case (reversed) shifts n(n-1)/2 times', () => {
    const sorted = insertion.run(insertion.input.presets[1].value)
    expect(sorted.result).toEqual([1, 2, 3, 4, 5, 6])
    expect(count(sorted.frames, 'shift')).toBe(0)
    const reversed = insertion.run(insertion.input.presets[2].value)
    expect(count(reversed.frames, 'shift')).toBe(15)
  })
})

describe('sorting/insertion-sort: scenes', () => {
  it('holds the key aside: the gap is an empty cell, and the sorted prefix is bracketed', () => {
    for (const { input, frames } of runs(insertion)) {
      const n = input.nums.length
      for (const frame of frames) {
        const scene = arrayScene(frame)
        const gaps = scene.cells.flatMap((c, i) => (c === null ? [i] : []))
        if (frame.at === 'init' || frame.at === 'place' || frame.at === 'done') {
          expect(gaps, `${frame.at} has no gap`).toEqual([])
        } else {
          expect(gaps.length, `${frame.at} has exactly one gap`).toBe(1)
          const key = frame.vars.key as number
          expect(scene.annotations?.[0]).toMatchObject({ target: `cell:${gaps[0]}`, text: `key = ${key}` })
          // The cells that are present plus the key are the original numbers.
          expect([...scene.cells.filter((c) => c !== null), key].sort((a, b) => (a as number) - (b as number))).toEqual([...input.nums].sort((a, b) => a - b))
        }
        if (frame.at === 'done') {
          expect(scene.window ?? null).toBeNull()
          expect(roles(scene, 'found')).toHaveLength(n)
        }
      }
    }
  })

  it('the sorted prefix really is sorted at every pick and place frame', () => {
    for (const { frames } of runs(insertion)) {
      for (const frame of frames) {
        if (frame.at !== 'pick' && frame.at !== 'place' && frame.at !== 'init') continue
        const scene = arrayScene(frame)
        const w = scene.window!
        const prefix = scene.cells.slice(w.start, w.end + 1) as number[]
        if (frame.at === 'pick') {
          expect(prefix).toEqual([...prefix].sort((a, b) => a - b))
        } else {
          expect(prefix.filter((c) => c !== null)).toEqual([...prefix].sort((a, b) => a - b))
        }
      }
    }
  })

  it('is stable: equal cards are never shifted past each other (strict comparison)', () => {
    for (const { frames } of runs(insertion)) {
      for (const frame of frames) {
        if (frame.at !== 'shift') continue
        // A shift is only narrated for a card strictly bigger than the key.
        expect(frame.say).toMatch(/is bigger than/)
      }
    }
  })

  it('frame counts stay well under the cap even for 12 reversed numbers', () => {
    const worst = insertion.run({ nums: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1] })
    expect(worst.frames.length).toBeLessThan(200)
  })
})

describe('sorting/insertion-sort: predicts tell the truth', () => {
  it('shift-or-place: the reveal is a shift when the left card is bigger, else the place', () => {
    let shifts = 0
    let places = 0
    for (const { frames } of runs(insertion)) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        expect(p.tag).toBe('shift-or-place')
        expect(frame.at).toBe('compare')
        const next = frames[i + 1]
        if (p.answer === 'Shift it right') {
          shifts++
          expect(next.at).toBe('shift')
        } else {
          places++
          expect(next.at).toBe('place')
        }
        // The prompt names the key and the card on the left, and they decide the answer.
        const key = frame.vars.key as number
        const j = frame.vars.j as number
        const left = arrayScene(frame).cells[j] as number
        expect(p.prompt).toContain(`The key is ${key} and the card on its left is ${left}`)
        expect(p.answer).toBe(left > key ? 'Shift it right' : 'Place the key here')
      })
    }
    expect(shifts).toBeGreaterThan(0)
    expect(places).toBeGreaterThan(0)
  })

  it('asks on the default preset', () => {
    const tags = new Set(insertion.run(insertion.input.presets[0].value).frames.flatMap((f) => (f.predict ? [f.predict.tag] : [])))
    expect(tags).toEqual(new Set(['shift-or-place']))
  })
})

// ===========================================================================
// sorting/merge-sort
// ===========================================================================

describe('sorting/merge-sort: default preset', () => {
  const nums = [5, 2, 4, 7, 1, 3, 2, 6]
  const { frames, result } = merge.run({ nums })

  it('has the guided eight numbers and stays within the frame budget (<= 60)', () => {
    expect(merge.input.presets[0].value).toEqual({ nums })
    expect(result).toEqual([1, 2, 2, 3, 4, 5, 6, 7])
    expect(frames.length).toBeLessThanOrEqual(60)
    expect(frames).toHaveLength(48)
  })

  it('splits each range once (7 for n = 8), merges each once, and shows the base rule once', () => {
    expect(count(frames, 'split')).toBe(7)
    expect(count(frames, 'merge')).toBe(7)
    expect(count(frames, 'copy')).toBe(7)
    expect(count(frames, 'base')).toBe(1)
    expect(count(frames, 'init')).toBe(1)
    expect(count(frames, 'done')).toBe(1)
  })

  it('merge frames come after both halves were sorted, and the last copy yields the sorted row', () => {
    const copies = frames.filter((f) => f.at === 'copy')
    const last = copies[copies.length - 1]
    expect(parts(last).nums.cells).toEqual([1, 2, 2, 3, 4, 5, 6, 7])
  })

  it('the tie between the two 2s goes left first (stability) and says so', () => {
    expect(frames.some((f) => f.at === 'take' && /tie, so the left one goes first/.test(f.say))).toBe(true)
  })
})

describe('sorting/merge-sort: merge scenes', () => {
  it('every frame is a column composite of nums and a same-length merged buffer', () => {
    for (const { input, frames } of runs(merge)) {
      for (const frame of frames) {
        expect(frame.scene.kind).toBe('composite')
        const { nums, buffer } = parts(frame)
        expect(nums.cells).toHaveLength(input.nums.length)
        expect(buffer.cells).toHaveLength(input.nums.length)
        expect(buffer.label).toBe('merged')
        if (frame.scene.kind === 'composite') expect(frame.scene.layout).toBe('column')
      }
    }
  })

  it('during a merge the buffer holds exactly the sorted prefix of the two halves, under their cells', () => {
    for (const { frames } of runs(merge)) {
      for (const frame of frames) {
        if (frame.at !== 'merge' && frame.at !== 'take' && frame.at !== 'drain' && frame.at !== 'copy') continue
        const { nums, buffer } = parts(frame)
        const win = nums.window!
        expect(buffer.window).toEqual(win)
        const k = frame.vars.k as number | null
        const filled = buffer.cells.flatMap((c, i) => (c === null ? [] : [i]))
        // Filled slots are contiguous lo..k-1 (or lo..hi at copy).
        const end = frame.at === 'copy' ? win.end + 1 : (k as number)
        expect(filled).toEqual(Array.from({ length: end - win.start }, (_, d) => win.start + d))
        const values = filled.map((i) => buffer.cells[i] as number)
        expect(values).toEqual([...values].sort((a, b) => a - b))
        // Nothing outside the bracketed range is filled.
        for (const i of filled) expect(i >= win.start && i <= win.end).toBe(true)
        // The buffer pointer k sits on the next free slot while taking.
        if (frame.at === 'merge' || frame.at === 'take') {
          expect(buffer.pointers?.[0]).toMatchObject({ name: 'k', index: k })
        }
      }
    }
  })

  it('i and j stay on their own halves, and a take consumes exactly one number', () => {
    for (const { frames } of runs(merge)) {
      let prevFilled = -1
      for (const frame of frames) {
        if (frame.at === 'merge') prevFilled = 0
        if (frame.at !== 'take') continue
        const { buffer } = parts(frame)
        const filled = buffer.cells.filter((c) => c !== null).length
        expect(filled, 'one more number per take').toBe(prevFilled + 1)
        prevFilled = filled
        expect(roles(buffer, 'changed')).toHaveLength(1)
        const lo = frame.vars.lo as number
        const mid = frame.vars.mid as number
        const hi = frame.vars.hi as number
        const i = frame.vars.i as number
        const j = frame.vars.j as number
        expect(i).toBeGreaterThanOrEqual(lo)
        expect(i).toBeLessThanOrEqual(mid + 1)
        expect(j).toBeGreaterThanOrEqual(mid + 1)
        expect(j).toBeLessThanOrEqual(hi + 1)
      }
    }
  })

  it('a drain only happens when exactly one half is used up, and it ends the compare phase', () => {
    for (const { frames } of runs(merge)) {
      frames.forEach((frame, idx) => {
        if (frame.at !== 'drain') return
        const mid = frame.vars.mid as number
        const hi = frame.vars.hi as number
        // After the drain both pointers are past their halves.
        expect(frame.vars.i).toBeGreaterThanOrEqual(mid + 1)
        expect(frame.vars.j).toBeGreaterThanOrEqual(hi + 1)
        expect(frames[idx + 1].at).toBe('copy')
        expect(frames[idx - 1].at === 'take' || frames[idx - 1].at === 'merge').toBe(true)
      })
    }
  })

  it('the first frame of a split run brackets the whole range with lo, mid, hi pointers', () => {
    const { frames } = merge.run({ nums: [5, 2, 4, 7, 1, 3, 2, 6] })
    const split = frames.find((f) => f.at === 'split')!
    const nums = parts(split).nums
    expect(nums.window).toEqual({ start: 0, end: 7 })
    expect(nums.pointers?.map((p) => [p.name, p.index])).toEqual([['lo', 0], ['mid', 3], ['hi', 7]])
  })

  it('stays well under the cap even for 12 numbers, and finishes with everything found', () => {
    for (const { frames } of runs(merge)) {
      expect(frames.length).toBeLessThan(120)
      const done = frames[frames.length - 1]
      expect(done.at).toBe('done')
      expect(roles(parts(done).nums, 'found')).toHaveLength(parts(done).nums.cells.length)
    }
  })
})

describe('sorting/merge-sort: predicts tell the truth', () => {
  it('which-goes-first: the reveal puts the predicted side into the buffer (ties go left)', () => {
    let left = 0
    let right = 0
    for (const { frames } of runs(merge)) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        expect(p.tag).toBe('which-goes-first')
        expect(['merge', 'take']).toContain(frame.at)
        const next = frames[i + 1]
        expect(next.at).toBe('take')
        const { nums } = parts(frame)
        const iPtr = frame.vars.i as number
        const jPtr = frame.vars.j as number
        const a = nums.cells[iPtr] as number
        const b = nums.cells[jPtr] as number
        expect(p.prompt).toBe(`Left has ${a}, right has ${b}. Which goes into the buffer next?`)
        expect(p.answer).toBe(a <= b ? 'Left' : 'Right')
        // The reveal: the left pointer moved on if Left, the right pointer if Right.
        if (p.answer === 'Left') {
          left++
          expect(next.vars.i).toBe(iPtr + 1)
          expect(next.vars.j).toBe(jPtr)
        } else {
          right++
          expect(next.vars.j).toBe(jPtr + 1)
          expect(next.vars.i).toBe(iPtr)
        }
        // The slot that was filled holds the number the answer promised.
        const slot = frame.vars.k as number
        expect(parts(next).buffer.cells[slot]).toBe(p.answer === 'Left' ? a : b)
      })
    }
    expect(left).toBeGreaterThan(0)
    expect(right).toBeGreaterThan(0)
  })

  it('is never asked when one half is used up (no choice left)', () => {
    for (const { frames } of runs(merge)) {
      for (const frame of frames) {
        if (!frame.predict) continue
        expect(frame.vars.i as number).toBeLessThanOrEqual(frame.vars.mid as number)
        expect(frame.vars.j as number).toBeLessThanOrEqual(frame.vars.hi as number)
      }
    }
  })

  it('asks on the default preset', () => {
    const tags = new Set(merge.run(merge.input.presets[0].value).frames.flatMap((f) => (f.predict ? [f.predict.tag] : [])))
    expect(tags).toEqual(new Set(['which-goes-first']))
  })
})

// ===========================================================================
// sorting/quick-sort
// ===========================================================================

describe('sorting/quick-sort: default preset', () => {
  const nums = [4, 7, 1, 6, 2, 8, 3, 5]
  const { frames, result } = quick.run({ nums })

  it('sorts the guided eight numbers using every rule', () => {
    expect(quick.input.presets[0].value).toEqual({ nums })
    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(frames).toHaveLength(27)
    for (const at of ['init', 'base', 'pivot', 'scan', 'swap', 'place', 'recurse', 'done']) {
      expect(count(frames, at), `rule ${at}`).toBeGreaterThan(0)
    }
    expect(frames[0].at).toBe('init')
    expect(frames[frames.length - 1].at).toBe('done')
  })

  it('the first partition uses pivot 5 and places it at index 4', () => {
    const pivot = frames.find((f) => f.at === 'pivot')!
    expect(pivot.vars.pivot).toBe(5)
    const place = frames.find((f) => f.at === 'place')!
    expect(place.vars.i).toBe(4)
    expect(arrayScene(place).cells[4]).toBe(5)
    expect(roles(arrayScene(place), 'found')).toEqual([4])
  })
})

describe('sorting/quick-sort: partition invariants', () => {
  it('after every place frame the pivot has only smaller-or-equal on its left and only >= on its right (within the range)', () => {
    for (const { frames } of runs(quick)) {
      for (const frame of frames) {
        if (frame.at !== 'place') continue
        const scene = arrayScene(frame)
        const { lo, hi, i } = frame.vars as { lo: number; hi: number; i: number }
        const pivot = scene.cells[i] as number
        for (let x = lo; x < i; x++) expect(scene.cells[x] as number).toBeLessThan(pivot)
        for (let x = i + 1; x <= hi; x++) expect(scene.cells[x] as number).toBeGreaterThanOrEqual(pivot)
        expect(roles(scene, 'found')).toContain(i)
      }
    }
  })

  it('during the scan, everything in [lo, i) is smaller than the pivot and the pivot stays at hi', () => {
    for (const { frames } of runs(quick)) {
      for (const frame of frames) {
        if (frame.at !== 'scan' && frame.at !== 'swap' && frame.at !== 'pivot') continue
        const scene = arrayScene(frame)
        const { lo, hi, i, pivot } = frame.vars as { lo: number; hi: number; i: number; pivot: number }
        expect(scene.cells[hi]).toBe(pivot)
        expect(scene.window).toEqual({ start: lo, end: hi })
        for (let x = lo; x < i; x++) expect(scene.cells[x] as number).toBeLessThan(pivot)
        expect(roles(scene, 'focus')).toContain(hi)
      }
    }
  })

  it('swap frames flash changed cells; a self-swap changes only one cell', () => {
    for (const { frames } of runs(quick)) {
      for (const frame of frames) {
        if (frame.at !== 'swap') continue
        const changed = roles(arrayScene(frame), 'changed')
        const j = frame.vars.j as number
        const i = frame.vars.i as number // already moved on
        expect(changed).toContain(j)
        expect(changed.length).toBe(i - 1 === j ? 1 : 2)
      }
    }
  })

  it('cells outside the current range are discarded unless final, and every found cell already holds its sorted value', () => {
    for (const { input, frames } of runs(quick)) {
      const sorted = [...input.nums].sort((a, b) => a - b)
      for (const frame of frames) {
        if (frame.at === 'init') continue
        const scene = arrayScene(frame)
        for (const index of roles(scene, 'found')) expect(scene.cells[index], `found cell ${index}`).toBe(sorted[index])
        if (frame.at === 'done') continue
        const w = scene.window!
        for (const index of roles(scene, 'discarded')) expect(index < w.start || index > w.end).toBe(true)
        // Nothing final is ever discarded.
        expect(roles(scene, 'discarded').filter((index) => roles(scene, 'found').includes(index))).toEqual([])
      }
    }
  })

  it('the gauge counts numbers in their final place and ends full', () => {
    for (const { input, frames } of runs(quick)) {
      let last = 0
      for (const frame of frames) {
        expect(frame.gauge!.value).toBeGreaterThanOrEqual(last)
        last = frame.gauge!.value
      }
      expect(frames[frames.length - 1].gauge!.value).toBe(input.nums.length)
    }
  })

  it('sorted input is the worst case: each pivot is the biggest, so the work is quadratic', () => {
    const six = quick.run(quick.input.presets[1].value as SortInput)
    expect(quick.input.presets[1].value).toEqual({ nums: [1, 2, 3, 4, 5, 6] })
    // n + (n-1) + ... comparisons: 5 + 4 + 3 + 2 + 1 scanned numbers = 15 scan/swap frames.
    expect(count(six.frames, 'scan') + count(six.frames, 'swap')).toBe(15)
    const balanced = quick.run(quick.input.presets[2].value as SortInput)
    expect(count(balanced.frames, 'scan') + count(balanced.frames, 'swap')).toBeLessThan(15)
  })

  it('stays under the cap for 12 sorted numbers', () => {
    const worst = quick.run({ nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] })
    expect(worst.frames.length).toBeLessThan(200)
  })
})

describe('sorting/quick-sort: predicts tell the truth', () => {
  it('swap-or-not: the reveal is a swap exactly when the number is less than the pivot', () => {
    let swaps = 0
    let leaves = 0
    for (const { frames } of runs(quick)) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        expect(p.tag).toBe('swap-or-not')
        expect(['pivot', 'swap', 'scan']).toContain(frame.at)
        const next = frames[i + 1]
        const pivot = frame.vars.pivot as number
        const nextJ = next.vars.j as number
        const value = arrayScene(next).cells[nextJ] as number
        // The scene before the reveal has the same number at nextJ unless the swap itself moved it.
        expect(p.prompt).toContain(`The pivot is ${pivot}. Next j lands on `)
        if (p.answer === 'Swap it left') {
          swaps++
          expect(next.at).toBe('swap')
          expect(next.say).toMatch(new RegExp(`^${arrayScene(frame).cells[nextJ]} is less than ${pivot}`))
        } else {
          leaves++
          expect(next.at).toBe('scan')
          expect(next.say).toMatch(new RegExp(`^${value} is not less than ${pivot}`))
          expect(value).toBeGreaterThanOrEqual(pivot)
        }
      })
    }
    expect(swaps).toBeGreaterThan(0)
    expect(leaves).toBeGreaterThan(0)
  })

  it('is never asked for the frame that leads into the pivot placement', () => {
    for (const { frames } of runs(quick)) {
      frames.forEach((frame, i) => {
        if (frame.predict) expect(['swap', 'scan']).toContain(frames[i + 1].at)
      })
    }
  })

  it('asks on the default preset', () => {
    const tags = new Set(quick.run(quick.input.presets[0].value).frames.flatMap((f) => (f.predict ? [f.predict.tag] : [])))
    expect(tags).toEqual(new Set(['swap-or-not']))
  })
})

// ===========================================================================
// sorting/heap-sort
// ===========================================================================

describe('sorting/heap-sort', () => {
  const heap = heapSort
  const guided = heap.run(heap.input.presets[0].value)

  it('guided preset is 20-45 frames and uses every anchor', () => {
    expect(guided.frames.length).toBeGreaterThanOrEqual(20)
    expect(guided.frames.length).toBeLessThanOrEqual(45)
    expect(new Set(guided.frames.map((f) => f.at)).size).toBe(Object.keys(heap.anchors).length)
  })

  it('sorts every run, shrinks the heap once per extract and stays under the frame cap', () => {
    for (const { input, frames, result } of runs(heap)) {
      expect(result).toEqual([...input.nums].sort((a, b) => a - b))
      expect(count(frames, 'extract')).toBe(input.nums.length - 1)
      expect(count(frames, 'shrink')).toBe(input.nums.length - 1)
      expect(frames.length).toBeLessThan(400)
    }
  })

  it('rejects more than 8 numbers kindly', () => {
    expect(heap.input.parse({ nums: '1,2,3,4,5,6,7,8,9' })).toMatchObject({ ok: false, error: expect.stringMatching(/at most 8/) })
  })
})

// ===========================================================================
// sorting/bubble-sort and sorting/selection-sort
// ===========================================================================

describe('sorting/bubble-sort', () => {
  const guided = bubble.run(bubble.input.presets[0].value)

  it('guided preset is 15-45 frames, uses every anchor and exits early', () => {
    expect(guided.frames.length).toBeGreaterThanOrEqual(15)
    expect(guided.frames.length).toBeLessThanOrEqual(45)
    expect(new Set(guided.frames.map((f) => f.at)).size).toBe(Object.keys(bubble.anchors).length)
  })

  it('stops after one pass on sorted input', () => {
    const { frames, result } = bubble.run({ nums: [1, 2, 3, 4, 5, 6] })
    expect(result).toEqual([1, 2, 3, 4, 5, 6])
    expect(count(frames, 'pass')).toBe(1)
    expect(count(frames, 'compare')).toBe(5)
    expect(count(frames, 'swap')).toBe(0)
    expect(count(frames, 'early')).toBe(1)
  })

  it('swaps once per inversion and stays under the frame cap', () => {
    for (const { input, frames, result } of runs(bubble)) {
      expect(result).toEqual([...input.nums].sort((a, b) => a - b))
      let inversions = 0
      input.nums.forEach((x, i) => input.nums.slice(i + 1).forEach((y) => { if (x > y) inversions++ }))
      expect(count(frames, 'swap')).toBe(inversions)
      expect(frames.length).toBeLessThan(400)
    }
  })

  it('predict answers match the next frame', () => {
    for (const { frames } of runs(bubble)) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        const next = frames[i + 1]
        if (p.tag === 'swap-or-not') expect(next.at === 'swap').toBe(p.answer === 'Swap them')
        else expect(next.at).toBe(p.answer === 'Yes, stop now' ? 'early' : 'pass')
      })
    }
  })

  it('rejects more than 8 numbers kindly', () => {
    expect(bubble.input.parse({ nums: '1,2,3,4,5,6,7,8,9' })).toMatchObject({ ok: false, error: expect.stringMatching(/at most 8/) })
  })
})

describe('sorting/selection-sort', () => {
  const guided = selection.run(selection.input.presets[0].value)

  it('guided preset is 15-45 frames and uses every anchor', () => {
    expect(guided.frames.length).toBeGreaterThanOrEqual(15)
    expect(guided.frames.length).toBeLessThanOrEqual(45)
    expect(new Set(guided.frames.map((f) => f.at)).size).toBe(Object.keys(selection.anchors).length)
  })

  it('does n-1 swaps and n(n-1)/2 scans, and stays under the frame cap', () => {
    for (const { input, frames, result } of runs(selection)) {
      const n = input.nums.length
      expect(result).toEqual([...input.nums].sort((a, b) => a - b))
      expect(count(frames, 'swap')).toBe(n - 1)
      expect(count(frames, 'scan')).toBe((n * (n - 1)) / 2)
      expect(frames.length).toBeLessThan(400)
    }
  })

  it('predict answers match the next frame', () => {
    for (const { frames } of runs(selection)) {
      frames.forEach((frame, i) => {
        if (frame.predict) expect(frames[i + 1].at === 'newmin').toBe(frame.predict.answer === 'New minimum')
      })
    }
  })

  it('rejects more than 8 numbers kindly', () => {
    expect(selection.input.parse({ nums: '1,2,3,4,5,6,7,8,9' })).toMatchObject({ ok: false, error: expect.stringMatching(/at most 8/) })
  })
})
