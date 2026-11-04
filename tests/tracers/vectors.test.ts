/**
 * Extra checks for the vectors tracers (push-back, pop-back). The generic
 * contract suite (frames, anchors, code parity, parse, correctness...) runs from
 * registry.test.ts; this file asserts what only these tracers can know:
 *   - predict answers are true (checked against what the next frames do)
 *   - the scenes tell the truth: one block of `capacity` slots, a composite
 *     "old / new" column while elements are copied
 *   - the amortised story: total copies stay under 2n
 *   - the teaching beats of each default preset
 *   - the lesson file wires up to these tracers
 */
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { lessonV2Schema } from '@/lib/content-schema'
import type { LessonV2 } from '@/types/learning'
import pushBack from '@/lib/tracers/vectors/push-back'
import type { PushBackInput, PushBackResult } from '@/lib/tracers/vectors/push-back'
import popBack from '@/lib/tracers/vectors/pop-back'
import type { PopBackInput, PopBackResult } from '@/lib/tracers/vectors/pop-back'
import type { AnyTracer, ArrayScene, CompositeScene, Frame, Scene } from '@/lib/engine/types'

function seeded<I>(spec: { presets: Array<{ value: I }>; random(seed: number): I }): I[] {
  return [...spec.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => spec.random(i + 1))]
}

function arrayScene(frame: Frame): ArrayScene {
  if (frame.scene.kind !== 'array') throw new Error(`expected an array scene, got ${frame.scene.kind} at "${frame.at}"`)
  return frame.scene
}

function compositeScene(frame: Frame): CompositeScene {
  if (frame.scene.kind !== 'composite') throw new Error(`expected a composite scene, got ${frame.scene.kind} at "${frame.at}"`)
  return frame.scene
}

function parts(frame: Frame): [ArrayScene, ArrayScene] {
  const scene = compositeScene(frame)
  expect(scene.layout).toBe('column')
  expect(scene.parts).toHaveLength(2)
  const [oldPart, newPart] = scene.parts.map((p) => {
    expect(p.scene.kind).toBe('array')
    return p.scene as ArrayScene
  })
  return [oldPart, newPart]
}

/** How many `copy` frames follow frame `index` without a break. */
function copyRun(frames: Frame[], index: number): number {
  let count = 0
  while (frames[index + 1 + count]?.at === 'copy') count++
  return count
}

const filled = (cells: Array<number | string | null>): number => cells.filter((c) => c !== null).length

// ===========================================================================
// vectors/push-back
// ===========================================================================

const pushDefault = pushBack.input.presets[0].value as PushBackInput

describe('vectors/push-back: presets', () => {
  it('has the three teaching presets and their answers', () => {
    expect(pushBack.input.presets.map((p) => pushBack.run(p.value).result)).toEqual([
      { items: [7, 3, 5, 8, 9, 2], capacity: 8, copies: 4 },
      { items: [5, 2, 8, 1, 9, 4, 7, 3, 6], capacity: 16, copies: 15 },
      { items: [4, 1, 6, 2], capacity: 4, copies: 0 },
    ])
  })

  it('default preset: four free pushes, then Size 4 / capacity 4 grows once to 8, copying 4', () => {
    const { frames } = pushBack.run(pushDefault)
    const rooms = frames.filter((f) => f.at === 'room')
    expect(rooms.map((f) => f.say)).toEqual([
      'Push 7: size is 0, capacity is 4. Is there a free slot?',
      'Push 3: size is 1, capacity is 4. Is there a free slot?',
      'Push 5: size is 2, capacity is 4. Is there a free slot?',
      'Push 8: size is 3, capacity is 4. Is there a free slot?',
      'Push 9: size is 4, capacity is 4. Is there a free slot?',
      'Push 2: size is 5, capacity is 8. Is there a free slot?',
    ])
    expect(frames.filter((f) => f.at === 'grow')).toHaveLength(1)
    expect(frames.filter((f) => f.at === 'copy')).toHaveLength(4)
    expect(frames.filter((f) => f.at === 'swap')).toHaveLength(1)
    expect(frames.filter((f) => f.at === 'write')).toHaveLength(6)
    expect(frames[frames.length - 1].say).toBe('6 pushes, 4 copies in total. That is under 2 × 6 = 12, so a push costs O(1) on average.')
  })

  it('asks "Size 4, capacity 4. Push 9" with the grow answer, and the guided run asks all three predicts', () => {
    const { frames } = pushBack.run(pushDefault)
    const ask = frames.find((f) => f.predict?.prompt === 'Size 4, capacity 4. Push 9 — what happens?')
    expect(ask?.predict?.options).toEqual(['Write it straight in', 'Grow to capacity 8, copy, then write'])
    expect(ask?.predict?.answer).toBe('Grow to capacity 8, copy, then write')
    const tags = frames.flatMap((f) => (f.predict ? [f.predict.tag] : []))
    expect(tags).toEqual(['room-or-resize', 'room-or-resize', 'copies'])
  })

  it('the 1, 2, 4, 8 preset doubles four times, copying 1 + 2 + 4 + 8', () => {
    const { frames } = pushBack.run(pushBack.input.presets[1].value)
    const grows = frames.filter((f) => f.at === 'grow')
    expect(grows.map((f) => f.say.match(/capacity (\d+),/)?.[1])).toEqual(['2', '4', '8', '16'])
    const copiesAtSwap = frames.filter((f) => f.at === 'swap').map((f) => f.vars.copies)
    expect(copiesAtSwap).toEqual([1, 3, 7, 15])
  })

  it('the exactly-fits preset never grows (the 4th push goes into the last free slot) and says so', () => {
    const { frames } = pushBack.run(pushBack.input.presets[2].value)
    expect(frames.some((f) => f.at === 'grow' || f.at === 'copy' || f.at === 'swap')).toBe(false)
    expect(frames[frames.length - 1].say).toMatch(/no copies/)
  })
})

describe('vectors/push-back: scenes tell the truth', () => {
  it('draws one block of exactly `capacity` slots, null where unused, and the size pointer at index size', () => {
    for (const input of seeded<PushBackInput>(pushBack.input)) {
      const { frames } = pushBack.run(input)
      frames.forEach((frame, index) => {
        const where = `${JSON.stringify(input)} frame ${index} (${frame.at})`
        const size = frame.vars.size as number
        const capacity = frame.vars.capacity as number
        if (frame.scene.kind === 'composite') {
          const [oldPart, newPart] = parts(frame)
          expect(oldPart.cells, `${where}: old block`).toHaveLength(capacity)
          expect(newPart.cells, `${where}: new block is 2×`).toHaveLength(capacity * 2)
          expect(filled(oldPart.cells), `${where}: old block is full`).toBe(capacity)
          return
        }
        const scene = arrayScene(frame)
        expect(scene.cells, `${where}: cells`).toHaveLength(capacity)
        expect(filled(scene.cells), `${where}: filled slots = size`).toBe(size)
        expect(scene.cells.slice(0, size).every((c) => c !== null), `${where}: filled from the front`).toBe(true)
        expect(scene.pointers?.find((p) => p.name === 'size')?.index, `${where}: size pointer`).toBe(size)
        expect(frame.gauge).toEqual({ value: size, max: capacity, label: 'Slots in use' })
      })
    }
  })

  it('while copying, the new block fills from the front and the old block is never touched', () => {
    for (const input of seeded<PushBackInput>(pushBack.input)) {
      const { frames } = pushBack.run(input)
      frames.forEach((frame, index) => {
        if (frame.at !== 'copy' && frame.at !== 'grow') return
        const where = `${JSON.stringify(input)} frame ${index} (${frame.at})`
        const [oldPart, newPart] = parts(frame)
        const done = frame.at === 'grow' ? 0 : (frame.vars.i as number) + 1
        expect(newPart.cells.slice(0, done), `${where}: copied prefix`).toEqual(oldPart.cells.slice(0, done))
        expect(filled(newPart.cells), `${where}: nothing else is in the new block`).toBe(done)
        if (frame.at === 'copy') {
          const i = frame.vars.i as number
          expect(oldPart.pointers).toEqual([{ name: 'i', index: i, role: 'ptrB' }])
          expect(newPart.marks).toEqual([{ index: i, role: 'changed' }])
        }
      })
    }
  })

  it('after the swap the single block is the new one, with the copied numbers in the same order', () => {
    for (const input of seeded<PushBackInput>(pushBack.input)) {
      const { frames } = pushBack.run(input)
      frames.forEach((frame, index) => {
        if (frame.at !== 'swap') return
        const before = parts(frames[index - 1])[1]
        expect(arrayScene(frame).cells).toEqual(before.cells)
      })
    }
  })

  it('the write frame marks exactly the slot it wrote', () => {
    for (const input of seeded<PushBackInput>(pushBack.input)) {
      const { frames } = pushBack.run(input)
      frames.forEach((frame) => {
        if (frame.at !== 'write') return
        const size = frame.vars.size as number
        expect(arrayScene(frame).marks).toEqual([{ index: size - 1, role: 'changed' }])
        expect(arrayScene(frame).cells[size - 1]).not.toBeNull()
      })
    }
  })
})

describe('vectors/push-back: the amortised story', () => {
  it('total copies stay under 2n, and capacity is the first start × 2^k that fits', () => {
    for (const input of seeded<PushBackInput>(pushBack.input)) {
      const { result } = pushBack.run(input)
      const n = input.nums.length
      expect(result.copies, JSON.stringify(input)).toBeLessThan(2 * n)
      expect(result.items).toEqual(input.nums)
      expect(result.capacity).toBeGreaterThanOrEqual(n)
      expect(result.capacity % input.capacity).toBe(0)
      expect(Math.log2(result.capacity / input.capacity) % 1).toBe(0)
      if (result.capacity > input.capacity) expect(result.capacity / 2).toBeLessThan(n)
    }
  })

  it('every resize is exactly a doubling and copies as many numbers as the old size', () => {
    for (const input of seeded<PushBackInput>(pushBack.input)) {
      const { frames } = pushBack.run(input)
      frames.forEach((frame, index) => {
        if (frame.at !== 'grow') return
        const size = frame.vars.size as number
        const capacity = frame.vars.capacity as number
        expect(size).toBe(capacity)
        expect(copyRun(frames, index)).toBe(size)
        expect(frames[index + 1 + size].at).toBe('swap')
        expect(frames[index + 2 + size].vars.capacity).toBe(capacity * 2)
      })
    }
  })

  it('one more push after a doubling is cheap: the next write after a resize never needs another one', () => {
    for (const input of seeded<PushBackInput>(pushBack.input)) {
      const { frames } = pushBack.run(input)
      const sizesAtGrow = frames.filter((f) => f.at === 'grow').map((f) => f.vars.size as number)
      sizesAtGrow.forEach((size, k) => {
        if (k > 0) expect(size).toBe(sizesAtGrow[k - 1] * 2)
      })
    }
  })
})

describe('vectors/push-back: predicts are true', () => {
  it('room-or-resize: answer says grow exactly when size equals capacity, and the next frame agrees', () => {
    let asked = 0
    let grows = 0
    for (const input of seeded<PushBackInput>(pushBack.input)) {
      const { frames } = pushBack.run(input)
      frames.forEach((frame, index) => {
        const p = frame.predict
        if (p?.tag !== 'room-or-resize') return
        asked++
        expect(frame.at).toBe('room')
        const full = frame.vars.size === frame.vars.capacity
        expect(frames[index + 1].at).toBe(full ? 'grow' : 'write')
        expect(p.options![0]).toBe('Write it straight in')
        expect(p.options![1]).toBe(`Grow to capacity ${(frame.vars.capacity as number) * 2}, copy, then write`)
        expect(p.answer).toBe(full ? p.options![1] : p.options![0])
        if (full) grows++
        // Only asked when the answer is not obvious: the last free slot, or no slot at all.
        expect((frame.vars.size as number) >= (frame.vars.capacity as number) - 1).toBe(true)
      })
    }
    expect(asked).toBeGreaterThan(0)
    expect(grows).toBeGreaterThan(0)
  })

  it('copies: the answer is the old size, and that many copy frames follow', () => {
    let asked = 0
    for (const input of seeded<PushBackInput>(pushBack.input)) {
      const { frames } = pushBack.run(input)
      frames.forEach((frame, index) => {
        const p = frame.predict
        if (p?.tag !== 'copies') return
        asked++
        expect(frame.at).toBe('grow')
        expect(p.answer).toBe(String(frame.vars.size))
        expect(copyRun(frames, index)).toBe(Number(p.answer))
        expect(new Set(p.options).size).toBe(p.options!.length)
        expect([...p.options!].sort((a, b) => Number(a) - Number(b))).toEqual(p.options)
      })
    }
    expect(asked).toBeGreaterThan(0)
  })
})

describe('vectors/push-back: input rules', () => {
  const ok = (nums: string, capacity: string) => pushBack.input.parse({ nums, capacity })

  it('accepts friendly formats', () => {
    expect(ok('[7, 3, 5]', '2')).toEqual({ ok: true, value: { nums: [7, 3, 5], capacity: 2 } })
    expect(ok('7 −3 5', '1')).toEqual({ ok: true, value: { nums: [7, -3, 5], capacity: 1 } })
  })

  it('rejects a starting capacity outside 1 to 4 and says the range', () => {
    expect(ok('7, 3', '0')).toMatchObject({ ok: false, field: 'capacity', error: expect.stringMatching(/1 to 4/) })
    expect(ok('7, 3', '5')).toMatchObject({ ok: false, field: 'capacity', error: expect.stringMatching(/1 to 4/) })
    expect(ok('7, 3', '-1')).toMatchObject({ ok: false, field: 'capacity' })
    expect(ok('7, 3', '')).toMatchObject({ ok: false, field: 'capacity' })
  })

  it('random inputs include resizes and runs with none', () => {
    const results = Array.from({ length: 200 }, (_, i) => pushBack.run(pushBack.input.random(i + 1)).result as PushBackResult)
    expect(results.some((r) => r.copies === 0)).toBe(true)
    expect(results.some((r) => r.copies > 0)).toBe(true)
    expect(Math.max(...results.map((r) => r.capacity))).toBeLessThanOrEqual(16)
  })
})

// ===========================================================================
// vectors/pop-back
// ===========================================================================

const popDefault = popBack.input.presets[0].value as PopBackInput

describe('vectors/pop-back: presets', () => {
  it('has the three teaching presets and their answers', () => {
    expect(popBack.input.presets.map((p) => popBack.run(p.value).result)).toEqual([
      { items: [7, 3, 9], capacity: 8, copies: 4, popped: [5, 6, 2, 8, 1, 4] },
      { items: [7, 3, 9], capacity: 8, copies: 0, popped: [1, 4] },
      { items: [], capacity: 2, copies: 3, popped: [3, 7, 4, 9, 1, 8, 2, 5] },
    ])
  })

  it('default preset: 6 pops from size 9 / capacity 16; the shrink fires exactly when size reaches 4', () => {
    const { frames } = popBack.run(popDefault)
    expect(frames.map((f) => f.at)).toEqual([
      'init',
      'pop', 'check',
      'pop', 'check',
      'pop', 'check',
      'pop', 'check',
      'pop', 'check', 'shrink', 'copy', 'copy', 'copy', 'copy', 'swap',
      'pop', 'check',
      'done',
    ])
    expect(frames[0].say).toBe('A vector holds 9 numbers in 16 slots. We will pop 6 times from the back.')
    expect(frames[1].say).toMatch(/Pop 5: size drops to 8. The 5 stays in its slot/)
    const shrink = frames.find((f) => f.at === 'shrink')!
    expect(shrink.vars).toMatchObject({ size: 4, capacity: 16 })
    expect(frames.find((f) => f.at === 'swap')!.vars).toMatchObject({ size: 4, capacity: 8, copies: 4 })
    expect(frames[frames.length - 1].say).toMatch(/only the shrink copied 4 numbers/)
  })

  it('pop-2-of-5 never shrinks and says nothing was copied', () => {
    const { frames } = popBack.run(popBack.input.presets[1].value)
    expect(frames.some((f) => f.at === 'shrink' || f.at === 'copy' || f.at === 'swap')).toBe(false)
    expect(frames[frames.length - 1].say).toMatch(/nothing was copied/)
  })

  it('pop-all-8 halves twice: 8 to 4 to 2, then stops because capacity 2 is below 4', () => {
    const { frames } = popBack.run(popBack.input.presets[2].value)
    const swaps = frames.filter((f) => f.at === 'swap').map((f) => f.vars.capacity)
    expect(swaps).toEqual([4, 2])
    const last = frames.filter((f) => f.at === 'check').pop()!
    expect(last.say).toMatch(/Capacity 2 is below 4/)
  })
})

describe('vectors/pop-back: pop does not erase, and the scenes tell the truth', () => {
  it('draws capacity slots; slots past size keep stale values marked discarded; size pointer at index size', () => {
    for (const input of seeded<PopBackInput>(popBack.input)) {
      const { frames } = popBack.run(input)
      frames.forEach((frame, index) => {
        const where = `${JSON.stringify(input)} frame ${index} (${frame.at})`
        const size = frame.vars.size as number
        const capacity = frame.vars.capacity as number
        if (frame.scene.kind === 'composite') {
          const [oldPart, newPart] = parts(frame)
          expect(oldPart.cells, `${where}: old block`).toHaveLength(capacity)
          expect(newPart.cells, `${where}: new block is half`).toHaveLength(capacity / 2)
          return
        }
        const scene = arrayScene(frame)
        expect(scene.cells, `${where}: cells`).toHaveLength(capacity)
        expect(scene.pointers?.find((p) => p.name === 'size')?.index, `${where}: size pointer`).toBe(size)
        scene.cells.forEach((cell, k) => {
          if (k < size) expect(cell, `${where}: slot ${k} is in use`).not.toBeNull()
        })
        for (const m of scene.marks ?? []) {
          if (m.role === 'discarded') expect(m.index, `${where}: discarded means past the end`).toBeGreaterThanOrEqual(size)
        }
      })
    }
  })

  it('a pop frame changes only size: the cells are identical to the frame before, and nothing is copied', () => {
    for (const input of seeded<PopBackInput>(popBack.input)) {
      const { frames } = popBack.run(input)
      frames.forEach((frame, index) => {
        if (frame.at !== 'pop') return
        const before = frames.slice(0, index).reverse().find((f) => f.scene.kind === 'array')!
        expect(arrayScene(frame).cells).toEqual(arrayScene(before).cells)
        expect(frame.vars.size).toBe((before.vars.size as number) - 1)
        expect(frame.vars.copies).toBe(before.vars.copies)
      })
    }
  })

  it('while copying, only the numbers still in use are copied, and the old block keeps its stale values', () => {
    for (const input of seeded<PopBackInput>(popBack.input)) {
      const { frames } = popBack.run(input)
      frames.forEach((frame, index) => {
        if (frame.at !== 'copy' && frame.at !== 'shrink') return
        const where = `${JSON.stringify(input)} frame ${index} (${frame.at})`
        const [oldPart, newPart] = parts(frame)
        const size = frame.vars.size as number
        const done = frame.at === 'shrink' ? 0 : (frame.vars.i as number) + 1
        expect(newPart.cells.slice(0, done), `${where}: copied prefix`).toEqual(oldPart.cells.slice(0, done))
        expect(filled(newPart.cells), `${where}: new block`).toBe(done)
        expect(done).toBeLessThanOrEqual(size)
      })
    }
  })
})

describe('vectors/pop-back: the shrink policy', () => {
  it('the check frame fires the shrink exactly when size × 4 ≤ capacity and capacity ≥ 4', () => {
    for (const input of seeded<PopBackInput>(popBack.input)) {
      const { frames } = popBack.run(input)
      frames.forEach((frame, index) => {
        if (frame.at !== 'check') return
        const size = frame.vars.size as number
        const capacity = frame.vars.capacity as number
        const shrinks = size * 4 <= capacity && capacity >= 4
        expect(frames[index + 1].at === 'shrink', `size ${size} capacity ${capacity}`).toBe(shrinks)
      })
    }
  })

  it('after a shrink the vector is half full or more: one pop or push cannot trigger another resize', () => {
    for (const input of seeded<PopBackInput>(popBack.input)) {
      const { frames } = popBack.run(input)
      frames.forEach((frame) => {
        if (frame.at !== 'swap') return
        const size = frame.vars.size as number
        const capacity = frame.vars.capacity as number
        expect(size * 2, `size ${size} in capacity ${capacity}`).toBeGreaterThanOrEqual(capacity)
        expect(size * 4).toBeGreaterThan(capacity) // does not shrink again straight away
      })
    }
  })

  it('every shrink copies as many numbers as the size, and pops themselves never copy', () => {
    for (const input of seeded<PopBackInput>(popBack.input)) {
      const { frames, result } = popBack.run(input)
      let total = 0
      frames.forEach((frame, index) => {
        if (frame.at !== 'shrink') return
        const size = frame.vars.size as number
        expect(copyRun(frames, index)).toBe(size)
        total += size
      })
      expect(result.copies).toBe(total)
      expect(result.items).toEqual(input.nums.slice(0, input.nums.length - input.pops))
      expect(result.popped).toEqual(input.nums.slice(input.nums.length - input.pops).reverse())
    }
  })
})

describe('vectors/pop-back: predicts are true', () => {
  it('shrink-or-keep: the answer matches whether the very next check leads to a shrink', () => {
    let asked = 0
    let shrinks = 0
    for (const input of seeded<PopBackInput>(popBack.input)) {
      const { frames } = popBack.run(input)
      frames.forEach((frame, index) => {
        const p = frame.predict
        if (p?.tag !== 'shrink-or-keep') return
        asked++
        expect(frame.at).toBe('pop')
        expect(frames[index + 1].at).toBe('check')
        const shrinks_ = frames[index + 2].at === 'shrink'
        expect(p.options).toEqual(['Keep the same array', `Shrink to capacity ${(frame.vars.capacity as number) / 2}`])
        expect(p.answer).toBe(shrinks_ ? p.options![1] : p.options![0])
        expect(p.prompt).toBe(`After this pop: size ${frame.vars.size}, capacity ${frame.vars.capacity}. Does the vector shrink?`)
        if (shrinks_) shrinks++
      })
    }
    expect(asked).toBeGreaterThan(0)
    expect(shrinks).toBeGreaterThan(0)
  })

  it('copies: the answer is the size left, and that many copy frames follow', () => {
    let asked = 0
    for (const input of seeded<PopBackInput>(popBack.input)) {
      const { frames } = popBack.run(input)
      frames.forEach((frame, index) => {
        const p = frame.predict
        if (p?.tag !== 'copies') return
        asked++
        expect(frame.at).toBe('shrink')
        expect(p.answer).toBe(String(frame.vars.size))
        expect(copyRun(frames, index)).toBe(Number(p.answer))
        expect(new Set(p.options).size).toBe(p.options!.length)
      })
    }
    expect(asked).toBeGreaterThan(0)
  })

  it('the guided run asks shrink-or-keep around the threshold and includes the real shrink', () => {
    const { frames } = popBack.run(popDefault)
    const tags = frames.flatMap((f, i) => (f.predict ? [`${f.predict.tag}@${i}`] : []))
    expect(tags.filter((t) => t.startsWith('shrink-or-keep')).length).toBeGreaterThanOrEqual(3)
    expect(tags.some((t) => t.startsWith('copies'))).toBe(true)
    expect(frames.some((f) => f.predict?.tag === 'shrink-or-keep' && f.predict.answer !== 'Keep the same array')).toBe(true)
  })
})

describe('vectors/pop-back: input rules', () => {
  const ok = (nums: string, pops: string) => popBack.input.parse({ nums, pops })

  it('accepts friendly formats', () => {
    expect(ok('[7, 3, 9]', '2')).toEqual({ ok: true, value: { nums: [7, 3, 9], pops: 2 } })
    expect(ok('7 −3 9', '3')).toEqual({ ok: true, value: { nums: [7, -3, 9], pops: 3 } })
  })

  it('rejects popping more than the vector holds, and says how many', () => {
    expect(ok('7, 3, 9', '4')).toMatchObject({ ok: false, field: 'pops', error: expect.stringMatching(/at most 3 times/) })
    expect(ok('7', '2')).toMatchObject({ ok: false, field: 'pops', error: expect.stringMatching(/at most 1 time:/) })
    expect(ok('7, 3', '0')).toMatchObject({ ok: false, field: 'pops' })
    expect(ok('7, 3', '')).toMatchObject({ ok: false, field: 'pops' })
  })

  it('random inputs include shrinks and runs with none', () => {
    const results = Array.from({ length: 200 }, (_, i) => popBack.run(popBack.input.random(i + 1)).result as PopBackResult)
    expect(results.some((r) => r.copies === 0)).toBe(true)
    expect(results.some((r) => r.copies > 0)).toBe(true)
  })
})

// ===========================================================================
// The lesson file wires up to these tracers
// ===========================================================================

describe('content/topics/vectors.json', () => {
  const lesson = JSON.parse(
    fs.readFileSync(fileURLToPath(new URL('../../content/topics/vectors.json', import.meta.url)), 'utf8'),
  ) as LessonV2
  const byId = new Map<string, AnyTracer>([
    [pushBack.id, pushBack],
    [popBack.id, popBack],
  ])

  it('is a valid v2 lesson for the vectors slug', () => {
    expect(lessonV2Schema.safeParse(lesson).success).toBe(true)
    expect(lesson.slug).toBe('vectors')
  })

  it('has two tracks, each asking predict tags its guided run really emits', () => {
    expect(lesson.stage.tracks.map((t) => t.tracer)).toEqual(['vectors/push-back', 'vectors/pop-back'])
    for (const track of lesson.stage.tracks) {
      const tracer = byId.get(track.tracer)!
      expect(tracer, track.tracer).toBeDefined()
      const preset = tracer.input.presets[track.preset ?? 0]
      const emitted = tracer.run(preset.value).frames.flatMap((f) => (f.predict ? [f.predict.tag] : []))
      expect(track.predict!.max).toBeLessThanOrEqual(3)
      for (const tag of track.predict!.tags) expect(emitted, `${track.id}: tag ${tag} in the guided run`).toContain(tag)
    }
  })

  it('ties the template to push-back: every pseudocode anchor is one of its rules, and every rule has a line', () => {
    expect(lesson.template.tracer).toBe('vectors/push-back')
    const anchors = Object.keys(pushBack.anchors).sort()
    const used = lesson.template.pseudocode.flatMap((l) => (l.anchor ? [l.anchor] : []))
    for (const a of used) expect(anchors).toContain(a)
    expect([...used].sort()).toEqual(anchors)
  })

  it('draws the shape as a size-4, capacity-8 block whose callouts point at things that exist', () => {
    const scene: Scene = lesson.shape.scene
    expect(scene.kind).toBe('array')
    if (scene.kind !== 'array') return
    expect(scene.cells).toHaveLength(8)
    expect(filled(scene.cells)).toBe(4)
    expect(scene.pointers?.find((p) => p.name === 'size')?.index).toBe(4)
    for (const c of lesson.shape.callouts) {
      expect(c.text.split(/\s+/).length).toBeLessThanOrEqual(6)
      const [kind, id] = c.target.split(':')
      if (kind === 'cell') expect(Number(id)).toBeLessThan(scene.cells.length)
      else expect(kind).toBe('ptr')
      if (kind === 'ptr') expect(scene.pointers?.map((p) => p.name)).toContain(id)
    }
  })

  it('does not ship the legacy mistakes', () => {
    const text = JSON.stringify(lesson)
    expect(text).not.toMatch(/design-an-array/)
    expect(text).not.toMatch(/"url":\s*"#"/)
    // The 4th push into capacity 4 does not grow: growth happens on the 5th, when it is full.
    expect(text).not.toMatch(/capacity 8[^.]{0,40}4th/i)
  })
})
