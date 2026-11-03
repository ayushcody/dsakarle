import { describe, expect, it } from 'vitest'

import { arr, createRecorder } from '@/lib/engine/recorder'
import { MAX_FRAMES } from '@/lib/engine/types'
import type { ArrayScene, Frame } from '@/lib/engine/types'

describe('createRecorder', () => {
  it('records frames and returns them from done()', () => {
    const rec = createRecorder<number>()
    const f: Frame = { scene: { kind: 'array', cells: [1] }, vars: { a: 1 }, say: 'hi', at: 'x' }
    rec.frame(f)
    const out = rec.done(42)
    expect(out.result).toBe(42)
    expect(out.frames).toHaveLength(1)
    expect(out.frames).toBe(rec.frames)
  })

  it('isolates earlier frames from later mutation of scene and vars', () => {
    const rec = createRecorder<null>()
    const cells: number[] = [1, 2, 3]
    const list = [1, 2]
    const vars: Frame['vars'] = { n: 0, list }
    const scene: ArrayScene = { kind: 'array', cells, marks: [{ index: 0, role: 'focus' }] }
    rec.frame({ scene, vars, say: 'a', at: 'x' })
    cells[0] = 99
    cells.push(4)
    list.push(3)
    vars.n = 5
    scene.marks![0].role = 'error'
    rec.frame({ scene, vars, say: 'b', at: 'x' })

    const [a, b] = rec.frames
    expect((a.scene as ArrayScene).cells).toEqual([1, 2, 3])
    expect((a.scene as ArrayScene).marks![0].role).toBe('focus')
    expect(a.vars).toEqual({ n: 0, list: [1, 2] })
    expect((b.scene as ArrayScene).cells).toEqual([99, 2, 3, 4])
    expect(b.vars).toEqual({ n: 5, list: [1, 2, 3] })
  })

  it('stops accepting frames at MAX_FRAMES and reports capped', () => {
    const rec = createRecorder<null>()
    for (let i = 0; i < MAX_FRAMES - 1; i++) {
      rec.frame({ scene: { kind: 'array', cells: [i] }, vars: {}, say: '', at: 'x' })
    }
    expect(rec.capped).toBe(false)
    rec.frame({ scene: { kind: 'array', cells: [-1] }, vars: {}, say: '', at: 'x' })
    expect(rec.capped).toBe(true)
    rec.frame({ scene: { kind: 'array', cells: [-2] }, vars: {}, say: '', at: 'x' })
    expect(rec.frames).toHaveLength(MAX_FRAMES)
    expect((rec.frames[MAX_FRAMES - 1].scene as ArrayScene).cells).toEqual([-1])
  })

  it('arr() copies', () => {
    const a = [1, 2]
    const b = arr(a)
    b.push(3)
    expect(a).toEqual([1, 2])
  })
})
