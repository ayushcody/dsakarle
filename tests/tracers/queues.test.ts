/**
 * Extra checks for the queues tracers (enqueue-dequeue, window-max). The generic
 * contract suite (frames, anchors, code parity, parse, correctness...) runs from
 * registry.test.ts; the harness only deep-checks array scenes, so this file also
 * checks the circular-buffer invariants, the composite scene of the deque, that
 * predict answers are true, and the teaching beats of the default presets.
 */
import { describe, expect, it } from 'vitest'
import enqueueDequeue from '@/lib/tracers/queues/enqueue-dequeue'
import type { EnqueueDequeueInput } from '@/lib/tracers/queues/enqueue-dequeue'
import windowMax from '@/lib/tracers/queues/window-max'
import type { WindowMaxInput } from '@/lib/tracers/queues/window-max'
import type { ArrayScene, Frame, Scene } from '@/lib/engine/types'

const CAPACITY = 6

/** The array scene of a frame (the first part of a composite). */
function arrayOf(scene: Scene): ArrayScene {
  if (scene.kind === 'array') return scene
  if (scene.kind === 'composite' && scene.parts[0].scene.kind === 'array') return scene.parts[0].scene
  throw new Error(`expected an array scene, got ${scene.kind}`)
}

const count = (frames: Frame[], at: string): number => frames.filter((f) => f.at === at).length

// ===========================================================================
// queues/enqueue-dequeue
// ===========================================================================

const eq = enqueueDequeue.input
const eqDefault = eq.presets[0].value as EnqueueDequeueInput

function allEqRuns(): Array<{ input: EnqueueDequeueInput; frames: Frame[] }> {
  const inputs: EnqueueDequeueInput[] = [...eq.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => eq.random(i + 1))]
  return inputs.map((value) => ({ input: value, frames: enqueueDequeue.run(value).frames }))
}

describe('queues/enqueue-dequeue: default preset', () => {
  const { frames, result } = enqueueDequeue.run(eqDefault)

  it('shows an early dequeue, an empty refusal, a wrap-around and a full refusal in 10 operations', () => {
    expect(eqDefault.ops).toHaveLength(10)
    expect(eqDefault.ops.slice(0, 4)).toEqual([{ op: 'enqueue', value: 4 }, { op: 'dequeue' }, { op: 'dequeue' }, { op: 'enqueue', value: 7 }])
    expect(result).toEqual({ served: [4, null], refused: 2, queue: [7, 2, 9, 5, 8, 3] })
  })

  it('records init, 7 enqueues, a dequeue, an empty refusal and a full refusal', () => {
    expect(frames).toHaveLength(11)
    expect(['init', 'enqueue', 'dequeue', 'empty', 'full'].map((at) => count(frames, at))).toEqual([1, 7, 1, 1, 1])
    expect(frames.map((f) => f.at)).toEqual([
      'init', 'enqueue', 'dequeue', 'empty', 'enqueue', 'enqueue', 'enqueue', 'enqueue', 'enqueue', 'enqueue', 'full',
    ])
  })

  it('starts with front 0, back 5 and an empty buffer, so the first enqueue lands in (5 + 1) % 6 = 0', () => {
    const init = frames[0]
    expect(init.vars).toEqual({ front: 0, back: 5, size: 0 })
    expect(arrayOf(init.scene).cells).toEqual([null, null, null, null, null, null])
    expect(init.say).toContain('(5 + 1) % 6 = 0')
  })

  it('wraps back from slot 5 to slot 0 on the sixth enqueue, and says so', () => {
    const wrap = frames[9]
    expect(wrap.at).toBe('enqueue')
    expect(frames[8].vars.back).toBe(5)
    expect(wrap.vars.back).toBe(0)
    expect(wrap.say).toContain('(5 + 1) % 6 = 0')
    expect(wrap.say).toMatch(/wrapped/)
    expect(arrayOf(wrap.scene).cells).toEqual([3, 7, 2, 9, 5, 8])
  })

  it('refuses the seventh item because (back + 1) % 6 is the front slot, and marks that slot', () => {
    const full = frames[10]
    expect(full.vars).toEqual({ front: 1, back: 0, size: 6 })
    expect(full.say).toContain('(0 + 1) % 6 = 1')
    expect(arrayOf(full.scene).cells).toEqual(arrayOf(frames[9].scene).cells)
    expect(arrayOf(full.scene).marks).toEqual([{ index: 1, role: 'error' }])
  })

  it('refuses a dequeue on an empty line without changing anything', () => {
    const before = frames[2]
    const empty = frames[3]
    expect(empty.vars).toEqual(before.vars)
    expect(arrayOf(empty.scene).cells).toEqual(arrayOf(before.scene).cells)
    expect(empty.say).toMatch(/empty/)
  })
})

describe('queues/enqueue-dequeue: scenes are a true circular buffer', () => {
  it('draw 6 slots, with front/back pointers matching the variables and live items exactly from front for size slots', () => {
    for (const { frames } of allEqRuns()) {
      frames.forEach((frame, i) => {
        const where = `frame ${i}`
        const scene = arrayOf(frame.scene)
        expect(frame.scene.kind, where).toBe('array')
        expect(scene.cells, `${where} slots`).toHaveLength(CAPACITY)
        const { front, back, size } = frame.vars as { front: number; back: number; size: number }
        expect(scene.pointers, `${where} pointers`).toEqual([
          { name: 'front', index: front, role: 'ptrA' },
          { name: 'back', index: back, role: 'ptrB' },
        ])
        for (const v of [front, back]) expect(v >= 0 && v < CAPACITY, `${where} pointer in 0..5`).toBe(true)
        // The newest item is always `size - 1` steps after front.
        expect(back, `${where} back`).toBe((front + size - 1 + CAPACITY) % CAPACITY)
        scene.cells.forEach((cell, slot) => {
          const live = ((slot - front + CAPACITY) % CAPACITY) < size
          expect(cell !== null, `${where} slot ${slot} ${live ? 'should hold' : 'should be empty'}`).toBe(live)
        })
        expect(frame.gauge, where).toEqual({ value: size, max: CAPACITY, label: 'Slots in use' })
      })
    }
  })

  it('computes every enqueue and dequeue with % 6 in the narration and keeps the numbers honest', () => {
    for (const { frames } of allEqRuns()) {
      frames.forEach((frame, i) => {
        if (i === 0) return
        const prev = frames[i - 1].vars as { front: number; back: number; size: number }
        const now = frame.vars as { front: number; back: number; size: number }
        if (frame.at === 'enqueue') {
          expect(now.back, `frame ${i}`).toBe((prev.back + 1) % CAPACITY)
          expect(now.size, `frame ${i}`).toBe(prev.size + 1)
          expect(frame.say, `frame ${i}`).toContain(`(${prev.back} + 1) % 6 = ${now.back}`)
          expect(arrayOf(frame.scene).marks).toEqual([{ index: now.back, role: 'changed' }])
        } else if (frame.at === 'dequeue') {
          expect(now.front, `frame ${i}`).toBe((prev.front + 1) % CAPACITY)
          expect(now.size, `frame ${i}`).toBe(prev.size - 1)
          expect(frame.say, `frame ${i}`).toContain(`(${prev.front} + 1) % 6 = ${now.front}`)
          expect(arrayOf(frame.scene).marks).toEqual([{ index: prev.front, role: 'discarded' }])
        } else if (frame.at === 'full') {
          expect(prev.size).toBe(CAPACITY)
          expect(now).toEqual(prev)
          expect(arrayOf(frame.scene).marks).toEqual([{ index: now.front, role: 'error' }])
        } else if (frame.at === 'empty') {
          expect(prev.size).toBe(0)
          expect(now).toEqual(prev)
        }
      })
    }
  })

  it('serves in arrival order: the dequeue frame announces the oldest value in the line', () => {
    for (const { frames } of allEqRuns()) {
      frames.forEach((frame, i) => {
        if (frame.at !== 'dequeue') return
        const before = arrayOf(frames[i - 1].scene)
        const front = (frames[i - 1].vars as { front: number }).front
        const value = before.cells[front]
        expect(frame.say).toContain(`slot ${front} holds ${value}, so ${value} is served`)
      })
    }
  })
})

describe('queues/enqueue-dequeue: predicts tell the truth', () => {
  it('where-back-goes: the answer is (back + 1) % 6 and the next frame writes exactly there', () => {
    let asked = 0
    let wraps = 0
    for (const { frames } of allEqRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'where-back-goes') return
        asked++
        const next = frames[i + 1]
        const back = (frame.vars as { back: number }).back
        expect(p.kind).toBe('cell')
        expect(p.answer).toBe((back + 1) % CAPACITY)
        expect(next.at).toBe('enqueue')
        expect(next.vars.back).toBe(p.answer)
        expect(arrayOf(next.scene).cells[p.answer as number]).not.toBeNull()
        if ((p.answer as number) < back) wraps++
      })
    }
    expect(asked).toBeGreaterThan(0)
    expect(wraps, 'some predict asks about a wrap-around').toBeGreaterThan(0)
  })

  it('who-leaves: the answer is the front slot, which is occupied, and the next frame frees exactly it', () => {
    let asked = 0
    for (const { frames } of allEqRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'who-leaves') return
        asked++
        const next = frames[i + 1]
        expect(p.kind).toBe('cell')
        expect(p.answer).toBe(frame.vars.front)
        expect(arrayOf(frame.scene).cells[p.answer as number]).not.toBeNull()
        expect(next.at).toBe('dequeue')
        expect(arrayOf(next.scene).cells[p.answer as number]).toBeNull()
      })
    }
    expect(asked).toBeGreaterThan(0)
  })

  it('refused-or-ok: only asked when the next operation is refused, and it is', () => {
    let full = 0
    let empty = 0
    for (const { frames } of allEqRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'refused-or-ok') return
        const next = frames[i + 1]
        expect(p.answer).toMatch(/^Refused/)
        expect(['full', 'empty']).toContain(next.at)
        if (next.at === 'full') {
          full++
          expect(frame.vars.size).toBe(CAPACITY)
        } else {
          empty++
          expect(frame.vars.size).toBe(0)
        }
      })
    }
    expect(full).toBeGreaterThan(0)
    expect(empty).toBeGreaterThan(0)
  })

  it('every operation except the first is asked about at most once, on the frame before it', () => {
    for (const { input, frames } of allEqRuns()) {
      expect(frames).toHaveLength(input.ops.length + 1)
      frames.forEach((frame, i) => {
        if (i === frames.length - 1) expect(frame.predict).toBeUndefined()
        else expect(frame.predict, `frame ${i}`).toBeDefined()
      })
    }
  })

  it('asks every tag on the default preset or the other presets', () => {
    const tags = new Set(eq.presets.flatMap((p) => enqueueDequeue.run(p.value).frames.flatMap((f) => (f.predict ? [f.predict.tag] : []))))
    expect(tags).toEqual(new Set(['where-back-goes', 'who-leaves', 'refused-or-ok']))
  })
})

describe('queues/enqueue-dequeue: input rules', () => {
  const ok = (ops: string) => eq.parse({ ops })

  it('accepts commas, semicolons, new lines and any case', () => {
    expect(ok('Enqueue 4; DEQUEUE\nenqueue -7')).toEqual({ ok: true, value: { ops: [{ op: 'enqueue', value: 4 }, { op: 'dequeue' }, { op: 'enqueue', value: -7 }] } })
  })

  it('rejects unknown verbs, missing and extra values, decimals and out-of-range values kindly', () => {
    for (const bad of ['push 4', 'enqueue', 'enqueue 1 2', 'dequeue 3', 'enqueue 1.5', 'enqueue 100', 'enqueue -100', 'enqueue x']) {
      const result = ok(bad)
      expect(result.ok, bad).toBe(false)
      if (!result.ok) {
        expect(result.field).toBe('ops')
        expect(result.error.length).toBeLessThanOrEqual(140)
      }
    }
  })

  it('allows 10 operations and rejects an 11th', () => {
    expect(ok(Array.from({ length: 10 }, () => 'dequeue').join(', ')).ok).toBe(true)
    expect(ok(Array.from({ length: 11 }, () => 'dequeue').join(', ')).ok).toBe(false)
  })
})

// ===========================================================================
// queues/window-max
// ===========================================================================

const wm = windowMax.input
const wmDefault = wm.presets[0].value as WindowMaxInput

function allWmRuns(): Array<{ input: WindowMaxInput; frames: Frame[]; result: number[] }> {
  const inputs: WindowMaxInput[] = [...wm.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => wm.random(i + 1))]
  return inputs.map((value) => ({ input: value, ...windowMax.run(value) }))
}

/** Both parts of a window-max frame. */
function parts(frame: Frame): { input: ArrayScene; deque: ArrayScene } {
  expect(frame.scene.kind).toBe('composite')
  if (frame.scene.kind !== 'composite') throw new Error('not composite')
  expect(frame.scene.layout).toBe('column')
  expect(frame.scene.parts).toHaveLength(2)
  const [a, b] = frame.scene.parts.map((p) => p.scene)
  if (a.kind !== 'array' || b.kind !== 'array') throw new Error('parts must be array scenes')
  return { input: a, deque: b }
}

describe('queues/window-max: default preset (LeetCode 239)', () => {
  const { frames, result } = windowMax.run(wmDefault)

  it('finds [3, 3, 5, 5, 6, 7] for [1, 3, -1, -3, 5, 3, 6, 7] with k = 3', () => {
    expect(wmDefault).toEqual({ nums: [1, 3, -1, -3, 5, 3, 6, 7], k: 3 })
    expect(result).toEqual([3, 3, 5, 5, 6, 7])
    const done = frames[frames.length - 1]
    expect(done.at).toBe('done')
    expect(parts(done).input.marks!.filter((m) => m.role === 'found').map((m) => m.index)).toEqual([1, 4, 6, 7])
  })

  it('walks init, 8 pushes, 6 records, 5 expire checks, 6 back pops and done', () => {
    expect(frames).toHaveLength(27)
    expect(['init', 'push', 'record', 'expire', 'pop-back', 'done'].map((at) => count(frames, at))).toEqual([1, 8, 6, 5, 6, 1])
  })

  it('shows one real front expiry (index 1 leaves for the window 2 to 4) and keeps the deque small', () => {
    const expiries = frames.filter((f, i) => f.at === 'expire' && (frames[i - 1].vars.deque as number[]).length > (f.vars.deque as number[]).length)
    expect(expiries).toHaveLength(1)
    expect(expiries[0].say).toMatch(/Front index 1 slid out/)
    for (const f of frames) expect(f.gauge!.max).toBe(3)
  })
})

describe('queues/window-max: scenes and invariants', () => {
  it('draw the numbers on top and k deque slots below, with front/back pointers and a window bracket', () => {
    for (const { input, frames } of allWmRuns()) {
      frames.forEach((frame, i) => {
        const where = `${JSON.stringify(input)} frame ${i}`
        const { input: top, deque } = parts(frame)
        const dq = frame.vars.deque as number[]
        expect(top.cells, where).toEqual(input.nums)
        expect(deque.cells, where).toHaveLength(input.k)
        expect(deque.cells.filter((c) => c !== null), `${where} deque contents`).toEqual(dq)
        expect(deque.pointers, where).toEqual([
          { name: 'front', index: 0, role: 'ptrA' },
          { name: 'back', index: dq.length - 1, role: 'ptrB' },
        ])
        expect(frame.gauge, where).toEqual({ value: dq.length, max: input.k, label: 'Deque size' })
        if (frame.at === 'done') {
          expect(top.window ?? null, where).toBeNull()
        } else if (frame.at !== 'init') {
          const cur = frame.vars.i as number
          expect(top.window, where).toEqual({ start: Math.max(0, cur - input.k + 1), end: cur })
          expect(top.pointers, where).toEqual([{ name: 'i', index: cur, role: 'ptrB' }])
        }
      })
    }
  })

  it('keeps the deque strictly inside the window and its values from biggest to smallest', () => {
    for (const { input, frames } of allWmRuns()) {
      frames.forEach((frame, i) => {
        const dq = frame.vars.deque as number[]
        for (let s = 1; s < dq.length; s++) {
          expect(dq[s], `${JSON.stringify(input)} frame ${i}: indexes increase`).toBeGreaterThan(dq[s - 1])
          expect(input.nums[dq[s]], `${JSON.stringify(input)} frame ${i}: values never go up`).toBeLessThanOrEqual(input.nums[dq[s - 1]])
        }
        if (frame.at === 'push' || frame.at === 'record') {
          const cur = frame.vars.i as number
          for (const idx of dq) {
            expect(idx, `frame ${i}: inside the window`).toBeGreaterThanOrEqual(cur - input.k + 1)
            expect(idx).toBeLessThanOrEqual(cur)
          }
          expect(dq[dq.length - 1], 'push puts the new index at the back').toBe(cur)
        }
      })
    }
  })

  it('records the true maximum of each window: the front of the deque', () => {
    for (const { input, frames, result } of allWmRuns()) {
      const records = frames.filter((f) => f.at === 'record')
      expect(records, JSON.stringify(input)).toHaveLength(input.nums.length - input.k + 1)
      records.forEach((frame, w) => {
        const dq = frame.vars.deque as number[]
        expect(input.nums[dq[0]]).toBe(result[w])
        expect(frame.say).toContain(`its max is ${result[w]}`)
        const { input: top, deque } = parts(frame)
        expect(top.marks).toContainEqual({ index: dq[0], role: 'found' })
        expect(deque.marks).toEqual([{ index: 0, role: 'found' }])
      })
    }
  })

  it('discards popped and expired numbers in the input row, and never pops an index twice', () => {
    for (const { input, frames } of allWmRuns()) {
      const last = frames[frames.length - 1]
      expect(last.at).toBe('done')
      const seen = new Set<number>()
      frames.forEach((frame, i) => {
        if (frame.at !== 'pop-back') return
        const before = frames[i - 1].vars.deque as number[]
        const after = frame.vars.deque as number[]
        const popped = before[before.length - 1]
        expect(after, `${JSON.stringify(input)} frame ${i}`).toEqual(before.slice(0, -1))
        expect(input.nums[popped]).toBeLessThan(input.nums[frame.vars.i as number])
        expect(parts(frame).input.marks).toContainEqual({ index: popped, role: 'discarded' })
        expect(seen.has(popped), 'an index is popped once').toBe(false)
        seen.add(popped)
      })
    }
  })

  it('does the work in O(n): every index is pushed once and leaves at most once', () => {
    for (const { input, frames } of allWmRuns()) {
      expect(count(frames, 'push'), JSON.stringify(input)).toBe(input.nums.length)
      const removals = frames.filter((f, i) => i > 0 && (f.at === 'pop-back' || f.at === 'expire') && (f.vars.deque as number[]).length < (frames[i - 1].vars.deque as number[]).length)
      expect(removals.length).toBeLessThanOrEqual(input.nums.length)
    }
  })
})

describe('queues/window-max: predicts tell the truth', () => {
  it('pop-back-or-keep: the next frame pops exactly when the back is smaller than the new number', () => {
    let pop = 0
    let keep = 0
    for (const { input, frames } of allWmRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'pop-back-or-keep') return
        const next = frames[i + 1]
        const dq = frame.vars.deque as number[]
        expect(dq.length, 'there is a back to compare with').toBeGreaterThan(0)
        const nextCur = next.vars.i as number
        expect(['pop-back', 'push']).toContain(next.at)
        const popped = input.nums[dq[dq.length - 1]] < input.nums[nextCur]
        expect(p.answer).toBe(popped ? 'Pop it: it is smaller' : 'Keep it: it is not smaller')
        expect(next.at).toBe(popped ? 'pop-back' : 'push')
        if (popped) pop++
        else keep++
      })
    }
    expect(pop).toBeGreaterThan(0)
    expect(keep).toBeGreaterThan(0)
  })

  it('front-expired: Yes exactly when the next frame is an expire that shortens the deque', () => {
    let yes = 0
    let no = 0
    for (const { frames } of allWmRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'front-expired') return
        const next = frames[i + 1]
        expect(next.at).toBe('expire')
        const shrank = (next.vars.deque as number[]).length < (frame.vars.deque as number[]).length
        expect(p.answer).toBe(shrank ? 'Yes: it slid out' : 'No: still inside')
        if (shrank) yes++
        else no++
      })
    }
    expect(yes).toBeGreaterThan(0)
    expect(no).toBeGreaterThan(0)
  })

  it('asks both tags on the default preset', () => {
    const tags = new Set(windowMax.run(wmDefault).frames.flatMap((f) => (f.predict ? [f.predict.tag] : [])))
    expect(tags).toEqual(new Set(['pop-back-or-keep', 'front-expired']))
  })

  it('never puts a predict on the final frame', () => {
    for (const { frames } of allWmRuns()) expect(frames[frames.length - 1].predict).toBeUndefined()
  })
})

describe('queues/window-max: input rules', () => {
  const ok = (nums: string, k: string) => wm.parse({ nums, k })

  it('accepts brackets, spaces and negatives', () => {
    expect(ok('[1, 3, -1, -3, 5]', '3')).toEqual({ ok: true, value: { nums: [1, 3, -1, -3, 5], k: 3 } })
  })

  it('rejects k that is zero, negative, a decimal or bigger than the array', () => {
    for (const k of ['0', '-1', '1.5', '6', 'x']) {
      const result = ok('1, 2, 3, 4, 5', k)
      expect(result.ok, k).toBe(false)
      if (!result.ok) expect(result.field).toBe('k')
    }
  })

  it('allows k equal to the array length and a one-number array', () => {
    expect(ok('4, 2, 9', '3').ok).toBe(true)
    expect(windowMax.run({ nums: [7], k: 1 }).result).toEqual([7])
  })

  it('handles k = 1 (every number is its own max) and ties', () => {
    expect(windowMax.run({ nums: [3, 1, 2], k: 1 }).result).toEqual([3, 1, 2])
    expect(windowMax.run({ nums: [2, 2, 4, 4, 6, 3], k: 2 }).result).toEqual([2, 4, 4, 6, 6])
  })
})
