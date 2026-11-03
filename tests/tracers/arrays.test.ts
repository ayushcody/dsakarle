/**
 * Extra checks for the arrays tracers (access, insert, delete, linear-search).
 * The generic contract suite (frames, anchors, code parity, parse, correctness...)
 * runs from registry.test.ts; this file asserts what only these tracers can
 * know: that predict answers are true, and the teaching beats of the presets.
 */
import { describe, expect, it } from 'vitest'
import access from '@/lib/tracers/arrays/access'
import type { AccessInput } from '@/lib/tracers/arrays/access'
import insert from '@/lib/tracers/arrays/insert'
import type { InsertInput } from '@/lib/tracers/arrays/insert'
import del from '@/lib/tracers/arrays/delete'
import type { DeleteInput } from '@/lib/tracers/arrays/delete'
import search from '@/lib/tracers/arrays/linear-search'
import type { LinearSearchInput } from '@/lib/tracers/arrays/linear-search'
import type { ArrayScene, Frame } from '@/lib/engine/types'

function arrayScene(frame: Frame): ArrayScene {
  if (frame.scene.kind !== 'array') throw new Error('expected an array scene')
  return frame.scene
}

function seeded<I>(spec: { presets: Array<{ value: I }>; random(seed: number): I }): I[] {
  return [...spec.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => spec.random(i + 1))]
}

// ===========================================================================
// arrays/access
// ===========================================================================

describe('arrays/access: default preset', () => {
  const input = access.input.presets[0].value as AccessInput
  const { frames, result } = access.run(input)

  it('reads index 3 of [7, 3, 9, 4, 1] at address 1012', () => {
    expect(input).toEqual({ nums: [7, 3, 9, 4, 1], i: 3 })
    expect(result).toBe(4)
    expect(frames.map((f) => f.at)).toEqual(['init', 'check', 'address', 'read'])
    expect(frames[2].vars.address).toBe(1012)
    expect(frames[2].say).toMatch(/1000 \+ 3 × 4 = 1012/)
  })

  it('shows the address row (base 1000, size 4) in every frame and focuses the cell', () => {
    for (const frame of frames) expect(arrayScene(frame).addresses).toEqual({ base: 1000, size: 4 })
    expect(arrayScene(frames[2]).marks).toEqual([{ index: 3, role: 'focus' }])
    expect(arrayScene(frames[3]).marks).toEqual([{ index: 3, role: 'found' }])
  })

  it('asks both predicts on the default preset', () => {
    expect(new Set(frames.flatMap((f) => (f.predict ? [f.predict.tag] : [])))).toEqual(new Set(['jump-or-count', 'which-address']))
  })
})

describe('arrays/access: address maths and predicts', () => {
  it('address = 1000 + i × 4 and the value read is nums[i] for every input', () => {
    for (const value of seeded<AccessInput>(access.input)) {
      const { frames, result } = access.run(value)
      const read = frames[frames.length - 1]
      expect(read.vars.address).toBe(1000 + value.i * 4)
      expect(read.vars.value).toBe(value.nums[value.i])
      expect(result).toBe(value.nums[value.i])
    }
  })

  it('which-address: exactly one option is the real address, options are distinct and sorted', () => {
    let asked = 0
    for (const value of seeded<AccessInput>(access.input)) {
      const { frames } = access.run(value)
      frames.forEach((frame, index) => {
        const p = frame.predict
        if (p?.tag !== 'which-address') return
        asked++
        expect(frames[index + 1].at).toBe('address')
        expect(p.answer).toBe(String(frames[index + 1].vars.address))
        expect(p.options).toHaveLength(3)
        expect(new Set(p.options).size).toBe(3)
        expect([...p.options!].sort((a, b) => Number(a) - Number(b))).toEqual(p.options)
      })
    }
    expect(asked).toBeGreaterThan(0)
  })

  it('jump-or-count is only asked when there is something to count (i > 0)', () => {
    for (const value of seeded<AccessInput>(access.input)) {
      const { frames } = access.run(value)
      const asked = frames.some((f) => f.predict?.tag === 'jump-or-count')
      expect(asked, JSON.stringify(value)).toBe(value.i > 0)
    }
  })
})

describe('arrays/access: input rules', () => {
  const ok = (nums: string, i: string) => access.input.parse({ nums, i })

  it('accepts friendly formats', () => {
    expect(ok('[7, 3, 9]', '2')).toEqual({ ok: true, value: { nums: [7, 3, 9], i: 2 } })
    expect(ok('7 3 9', '0')).toEqual({ ok: true, value: { nums: [7, 3, 9], i: 0 } })
  })

  it('rejects an index outside the array and says the valid range', () => {
    expect(ok('7, 3, 9', '3')).toMatchObject({ ok: false, field: 'i', error: expect.stringMatching(/0 to 2/) })
    expect(ok('7, 3, 9', '-1')).toMatchObject({ ok: false, field: 'i' })
    expect(ok('7', '1')).toMatchObject({ ok: false, field: 'i', error: expect.stringMatching(/0 to 0/) })
    expect(ok('7, 3', '')).toMatchObject({ ok: false, field: 'i' })
  })
})

// ===========================================================================
// arrays/insert
// ===========================================================================

const insertInput = insert.input
const insertDefault = insertInput.presets[0].value as InsertInput

describe('arrays/insert: presets', () => {
  it('has the three teaching presets and their answers', () => {
    expect(insertInput.presets.map((p) => insert.run(p.value).result)).toEqual([
      [7, 3, 8, 9, 4, 1],
      [7, 3, 9, 4, 1, 8],
      [8, 7, 3, 9, 4, 1],
    ])
  })

  it('default preset: room, 3 shifts from the end, write, done', () => {
    const { frames } = insert.run(insertDefault)
    expect(frames.map((f) => f.at)).toEqual(['room', 'shift', 'shift', 'shift', 'write', 'done'])
    expect(frames[1].say).toMatch(/Move 1 from index 4 into index 5/)
    expect(frames[2].say).toMatch(/Move 4 from index 3 into index 4/)
    expect(frames[3].say).toMatch(/Move 9 from index 2 into index 3/)
  })

  it('insert at the end moves nothing, and still shows every rule it can', () => {
    const { frames } = insert.run({ nums: [7, 3, 9, 4, 1], index: 5, value: 8 })
    expect(frames.map((f) => f.at)).toEqual(['room', 'write', 'done'])
    expect(frames[1].say).toMatch(/Nothing had to move/)
  })

  it('insert at the front moves every number', () => {
    const { frames } = insert.run({ nums: [7, 3, 9, 4, 1], index: 0, value: 8 })
    expect(frames.filter((f) => f.at === 'shift')).toHaveLength(5)
  })
})

describe('arrays/insert: scene semantics', () => {
  it('keeps one free slot (null) and one ghost slot; the gap travels left until it reaches i', () => {
    for (const value of seeded<InsertInput>(insertInput)) {
      const { frames } = insert.run(value)
      const n = value.nums.length
      frames.forEach((frame) => {
        const scene = arrayScene(frame)
        expect(scene.cells).toHaveLength(n + 1)
        expect(scene.capacity).toBe(1)
        const gaps = scene.cells.flatMap((c, k) => (c === null ? [k] : []))
        if (frame.at === 'room') expect(gaps).toEqual([n])
        if (frame.at === 'shift') {
          expect(gaps).toHaveLength(1)
          const j = frame.vars.j as number
          expect(gaps[0]).toBe(j - 1)
          expect(scene.marks).toEqual([{ index: j, role: 'changed' }])
        }
        if (frame.at === 'write' || frame.at === 'done') expect(gaps).toEqual([])
      })
    }
  })

  it('shifts go last number first and never lose a number', () => {
    for (const value of seeded<InsertInput>(insertInput)) {
      const { frames } = insert.run(value)
      const shifts = frames.filter((f) => f.at === 'shift')
      expect(shifts.map((f) => f.vars.j)).toEqual(
        Array.from({ length: value.nums.length - value.index }, (_, k) => value.nums.length - k),
      )
      for (const frame of shifts) {
        const present = arrayScene(frame).cells.filter((c): c is number => c !== null)
        expect(present).toHaveLength(value.nums.length)
      }
    }
  })

  it('gauge counts slots in use and the size only grows when the value is written', () => {
    const { frames } = insert.run(insertDefault)
    expect(frames.map((f) => f.gauge)).toEqual([
      { value: 5, max: 7, label: 'Slots in use' },
      { value: 5, max: 7, label: 'Slots in use' },
      { value: 5, max: 7, label: 'Slots in use' },
      { value: 5, max: 7, label: 'Slots in use' },
      { value: 6, max: 7, label: 'Slots in use' },
      { value: 6, max: 7, label: 'Slots in use' },
    ])
  })
})

describe('arrays/insert: predicts tell the truth', () => {
  it('how-many-shift: the answer equals the number of shift frames', () => {
    let asked = 0
    for (const value of seeded<InsertInput>(insertInput)) {
      const { frames } = insert.run(value)
      frames.forEach((frame, index) => {
        const p = frame.predict
        if (p?.tag !== 'how-many-shift') return
        asked++
        expect(index).toBe(0)
        expect(p.answer).toBe(String(frames.filter((f) => f.at === 'shift').length))
        expect(p.options).toContain(p.answer)
        expect(new Set(p.options).size).toBe(p.options!.length)
        expect(p.options!.length).toBeGreaterThanOrEqual(2)
      })
    }
    expect(asked).toBe(201 + 2)
  })

  it('which-moves-next: the number that moves in the next shift is the one at the answer index', () => {
    let asked = 0
    for (const value of seeded<InsertInput>(insertInput)) {
      const { frames } = insert.run(value)
      frames.forEach((frame, index) => {
        const p = frame.predict
        if (p?.tag !== 'which-moves-next') return
        asked++
        const reveal = frames[index + 1]
        expect(reveal.at).toBe('shift')
        // the answer cell is where the mover sat before the reveal, and is the gap afterwards
        expect(arrayScene(frame).cells[p.answer as number]).not.toBeNull()
        expect(arrayScene(reveal).cells[p.answer as number]).toBeNull()
      })
    }
    expect(asked).toBeGreaterThan(0)
  })

  it('asks both predict kinds on the default preset', () => {
    const tags = new Set(insert.run(insertDefault).frames.flatMap((f) => (f.predict ? [f.predict.tag] : [])))
    expect(tags).toEqual(new Set(['how-many-shift', 'which-moves-next']))
  })
})

describe('arrays/insert: input rules', () => {
  const ok = (nums: string, index: string, value: string) => insertInput.parse({ nums, index, value })

  it('accepts friendly formats and index n (add at the end)', () => {
    expect(ok('[7, 3, 9]', '1', '8')).toEqual({ ok: true, value: { nums: [7, 3, 9], index: 1, value: 8 } })
    expect(ok('7 3 9', '3', '-4')).toEqual({ ok: true, value: { nums: [7, 3, 9], index: 3, value: -4 } })
  })

  it('rejects an index past the end, a bad value, and lists over 10 numbers', () => {
    expect(ok('7, 3, 9', '4', '8')).toMatchObject({ ok: false, field: 'index', error: expect.stringMatching(/0 to 3/) })
    expect(ok('7, 3, 9', '-1', '8')).toMatchObject({ ok: false, field: 'index' })
    expect(ok('7, 3, 9', '1', '100')).toMatchObject({ ok: false, field: 'value', error: expect.stringMatching(/-99 and 99/) })
    expect(ok('7, 3, 9', '1', '')).toMatchObject({ ok: false, field: 'value' })
    expect(ok(Array(11).fill('1').join(','), '0', '1')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/at most 10/) })
    expect(ok(Array(10).fill('1').join(','), '10', '1')).toMatchObject({ ok: true })
  })
})

// ===========================================================================
// arrays/delete
// ===========================================================================

const delInput = del.input
const delDefault = delInput.presets[0].value as DeleteInput

describe('arrays/delete: presets', () => {
  it('has the three teaching presets and their answers', () => {
    expect(delInput.presets.map((p) => del.run(p.value).result)).toEqual([
      [7, 9, 4, 1],
      [7, 3, 9, 4],
      [3, 9, 4, 1],
    ])
  })

  it('default preset: init, 3 slides from the front, clear, done', () => {
    const { frames } = del.run(delDefault)
    expect(frames.map((f) => f.at)).toEqual(['init', 'shift', 'shift', 'shift', 'clear', 'done'])
    expect(frames[1].say).toMatch(/Slide 9 from index 2 into index 1, covering the 3/)
  })

  it('deleting the last number slides nothing', () => {
    const { frames } = del.run({ nums: [7, 3, 9, 4, 1], index: 4 })
    expect(frames.map((f) => f.at)).toEqual(['init', 'clear', 'done'])
  })

  it('deleting the only number leaves an empty array', () => {
    const { frames, result } = del.run({ nums: [5], index: 0 })
    expect(result).toEqual([])
    expect(frames[frames.length - 1].say).toMatch(/empty/)
    expect(arrayScene(frames[frames.length - 1]).cells).toEqual([null])
  })
})

describe('arrays/delete: scene semantics', () => {
  it('the gap travels right; the last slot is null from clear on; length never changes', () => {
    for (const value of seeded<DeleteInput>(delInput)) {
      const { frames } = del.run(value)
      const n = value.nums.length
      frames.forEach((frame) => {
        const scene = arrayScene(frame)
        expect(scene.cells).toHaveLength(n)
        const gaps = scene.cells.flatMap((c, k) => (c === null ? [k] : []))
        if (frame.at === 'init') expect(gaps).toEqual([])
        if (frame.at === 'shift') expect(gaps).toEqual([(frame.vars.j as number) + 1])
        if (frame.at === 'clear' || frame.at === 'done') expect(gaps).toEqual([n - 1])
      })
      const clear = frames.find((f) => f.at === 'clear')!
      expect(clear.vars.size).toBe(n - 1)
      expect(frames[0].vars.size).toBe(n)
    }
  })
})

describe('arrays/delete: predicts tell the truth', () => {
  it('how-many-shift: the answer equals the number of shift frames', () => {
    let asked = 0
    for (const value of seeded<DeleteInput>(delInput)) {
      const { frames } = del.run(value)
      frames.forEach((frame, index) => {
        const p = frame.predict
        if (p?.tag !== 'how-many-shift') return
        asked++
        expect(index).toBe(0)
        expect(p.answer).toBe(String(frames.filter((f) => f.at === 'shift').length))
        expect(p.options).toContain(p.answer)
        expect(new Set(p.options).size).toBe(p.options!.length)
      })
    }
    expect(asked).toBe(203)
  })

  it('which-moves-next: the number that slides in the next shift is the one at the answer index', () => {
    let asked = 0
    for (const value of seeded<DeleteInput>(delInput)) {
      const { frames } = del.run(value)
      frames.forEach((frame, index) => {
        const p = frame.predict
        if (p?.tag !== 'which-moves-next') return
        asked++
        const reveal = frames[index + 1]
        expect(reveal.at).toBe('shift')
        expect(arrayScene(frame).cells[p.answer as number]).not.toBeNull()
        expect(arrayScene(reveal).cells[p.answer as number]).toBeNull()
      })
    }
    expect(asked).toBeGreaterThan(0)
  })
})

describe('arrays/delete: input rules', () => {
  const ok = (nums: string, index: string) => delInput.parse({ nums, index })

  it('accepts friendly formats', () => {
    expect(ok('[7, 3, 9]', '2')).toEqual({ ok: true, value: { nums: [7, 3, 9], index: 2 } })
  })

  it('rejects an index outside the array and says the valid range', () => {
    expect(ok('7, 3, 9', '3')).toMatchObject({ ok: false, field: 'index', error: expect.stringMatching(/0 to 2/) })
    expect(ok('7, 3, 9', '-1')).toMatchObject({ ok: false, field: 'index' })
    expect(ok('7, 3, 9', '')).toMatchObject({ ok: false, field: 'index' })
  })
})

// ===========================================================================
// arrays/linear-search
// ===========================================================================

const searchInput = search.input
const searchDefault = searchInput.presets[0].value as LinearSearchInput

describe('arrays/linear-search: presets', () => {
  it('has the three teaching presets and their answers', () => {
    expect(searchInput.presets.map((p) => search.run(p.value).result)).toEqual([3, -1, 1])
  })

  it('default preset looks at 4 slots (next + compare each) and stops at the match', () => {
    const { frames } = search.run(searchDefault)
    expect(frames.map((f) => f.at)).toEqual(['next', 'compare', 'next', 'compare', 'next', 'compare', 'next', 'compare', 'done'])
    const compare = frames[frames.length - 2]
    expect(compare.say).toMatch(/Found it at index 3/)
    expect(arrayScene(compare).marks).toContainEqual({ index: 3, role: 'found' })
    expect(frames[frames.length - 1].say).toMatch(/index 3, found after looking at 4 slots/)
  })

  it('a missing target looks at every slot and answers -1', () => {
    const { frames, result } = search.run({ nums: [7, 3, 9, 4, 1], target: 6 })
    expect(result).toBe(-1)
    expect(frames.filter((f) => f.at === 'compare')).toHaveLength(5)
    expect(frames[frames.length - 1].say).toMatch(/answer is -1/)
    expect(arrayScene(frames[frames.length - 1]).pointers ?? []).toEqual([])
  })

  it('with duplicates the first match wins and later slots are never looked at', () => {
    const { frames, result } = search.run({ nums: [5, 2, 8, 2, 6, 2], target: 2 })
    expect(result).toBe(1)
    expect(frames.filter((f) => f.at === 'compare')).toHaveLength(2)
  })
})

describe('arrays/linear-search: scene semantics', () => {
  it('visited slots stay marked, the gauge counts slots checked', () => {
    for (const value of seeded<LinearSearchInput>(searchInput)) {
      const { frames } = search.run(value)
      frames.forEach((frame) => {
        if (frame.at !== 'compare') return
        const k = frame.vars.i as number
        const marks = arrayScene(frame).marks ?? []
        expect(marks.filter((m) => m.role === 'visited').map((m) => m.index)).toEqual(Array.from({ length: k }, (_, x) => x))
        expect(marks.filter((m) => m.index === k)).toHaveLength(1)
        expect(frame.gauge!.value).toBe(k + 1)
      })
    }
  })
})

describe('arrays/linear-search: predicts tell the truth', () => {
  it('found-yet: Stop exactly when the next compare finds the target', () => {
    let stop = 0
    let keep = 0
    for (const value of seeded<LinearSearchInput>(searchInput)) {
      const { frames } = search.run(value)
      frames.forEach((frame, index) => {
        const p = frame.predict
        if (p?.tag !== 'found-yet') return
        const reveal = frames[index + 1]
        expect(reveal.at).toBe('compare')
        const matched = (arrayScene(reveal).marks ?? []).some((m) => m.role === 'found')
        expect(p.answer).toBe(matched ? 'Stop, found it' : 'Keep looking')
        if (matched) stop++
        else keep++
      })
    }
    expect(stop).toBeGreaterThan(0)
    expect(keep).toBeGreaterThan(0)
  })

  it('where-stop: asked only when the target exists, answered with the first match', () => {
    let asked = 0
    for (const value of seeded<LinearSearchInput>(searchInput)) {
      const { frames, result } = search.run(value)
      const p = frames[0].predict
      if (result === -1) {
        expect(p?.tag).toBe('found-yet')
        continue
      }
      if (p?.tag === 'where-stop') {
        asked++
        expect(p.kind).toBe('cell')
        expect(p.answer).toBe(value.nums.indexOf(value.target))
      }
    }
    expect(asked).toBeGreaterThan(0)
  })

  it('the default preset asks both predict kinds', () => {
    const tags = new Set(search.run(searchDefault).frames.flatMap((f) => (f.predict ? [f.predict.tag] : [])))
    expect(tags).toEqual(new Set(['where-stop', 'found-yet']))
  })
})

describe('arrays/linear-search: input rules', () => {
  const ok = (nums: string, target: string) => searchInput.parse({ nums, target })

  it('accepts friendly formats, negatives and a target that is not in the list', () => {
    expect(ok('[7, 3, 9]', '4')).toEqual({ ok: true, value: { nums: [7, 3, 9], target: 4 } })
    expect(ok('7 −3 9', '-3')).toEqual({ ok: true, value: { nums: [7, -3, 9], target: -3 } })
  })

  it('rejects a bad target with a reason', () => {
    expect(ok('7, 3', '')).toMatchObject({ ok: false, field: 'target' })
    expect(ok('7, 3', '100')).toMatchObject({ ok: false, field: 'target', error: expect.stringMatching(/-99 and 99/) })
    expect(ok('7, 3', 'x')).toMatchObject({ ok: false, field: 'target' })
  })

  it('random inputs include misses and hits', () => {
    const results = Array.from({ length: 200 }, (_, i) => search.run(searchInput.random(i + 1)).result)
    expect(results.some((r) => r === -1)).toBe(true)
    expect(results.some((r) => r === 0)).toBe(true)
    expect(results.some((r) => r > 0)).toBe(true)
  })
})
