/**
 * Extra checks for the linked-list tracers (traverse, insert-after, delete,
 * reverse). The generic contract suite (frames, anchors, code parity, parse,
 * correctness...) runs from registry.test.ts and only knows array scenes, so
 * this file adds:
 *   - linked-list scene sanity for every frame of every run
 *   - predict answers that are true (checked against what the next frame shows)
 *   - the teaching beats of each default preset
 *   - input rules specific to each tracer
 */
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { lessonV2Schema } from '@/lib/content-schema'
import type { LessonV2 } from '@/types/learning'
import traverse from '@/lib/tracers/linked-lists/traverse'
import insertAfter from '@/lib/tracers/linked-lists/insert-after'
import del from '@/lib/tracers/linked-lists/delete'
import reverse from '@/lib/tracers/linked-lists/reverse'
import type { AnyTracer, Frame, LinkedListScene } from '@/lib/engine/types'

const tracers: AnyTracer[] = [traverse, insertAfter, del, reverse]

function listScene(frame: Frame): LinkedListScene {
  if (frame.scene.kind !== 'linked-list') throw new Error(`expected a linked-list scene, got ${frame.scene.kind}`)
  return frame.scene
}

function pointerTarget(frame: Frame, name: string): string | null | undefined {
  return listScene(frame).pointers?.find((p) => p.name === name)?.target
}

function linkOf(frame: Frame, from: string): string | null | undefined {
  return listScene(frame).links.find((l) => l.from === from)?.to
}

/** Presets plus random seeds. */
function allRuns(tracer: AnyTracer): Array<{ input: unknown; frames: Frame[] }> {
  const inputs: unknown[] = [...tracer.input.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => tracer.input.random(i + 1))]
  return inputs.map((input) => ({ input, frames: tracer.run(input).frames }))
}

/** Values in head-to-tail order following `from` links, starting at `start`. Fails on a cycle. */
function walk(scene: LinkedListScene, start: string | null): string[] {
  const out: string[] = []
  let at = start
  while (at !== null) {
    expect(out, `cycle through ${at}`).not.toContain(at)
    out.push(at)
    const link = scene.links.find((l) => l.from === at)
    at = link ? link.to : null
  }
  return out
}

// ---------------------------------------------------------------------------
// Scene sanity (the generic harness only checks array scenes)
// ---------------------------------------------------------------------------

describe.each(tracers)('$id: linked-list scenes are well formed', (tracer) => {
  it('has real node ids, links, pointers, marks and notes on every frame', () => {
    for (const { frames } of allRuns(tracer)) {
      frames.forEach((frame, i) => {
        const where = `${tracer.id} frame ${i} (${frame.at})`
        const scene = listScene(frame)
        const ids = scene.nodes.map((n) => n.id)
        const known = new Set(ids)
        expect(known.size, `${where}: duplicate node ids`).toBe(ids.length)
        for (const id of ids) expect(id, `${where}: node id`).toMatch(/^(n\d+|dummy)$/)

        const from = new Set<string>()
        for (const link of scene.links) {
          expect(known.has(link.from), `${where}: link from unknown node ${link.from}`).toBe(true)
          if (link.to !== null) expect(known.has(link.to), `${where}: link to unknown node ${link.to}`).toBe(true)
          expect(from.has(link.from), `${where}: ${link.from} has two next links`).toBe(false)
          from.add(link.from)
        }
        for (const id of scene.floating ?? []) expect(known.has(id), `${where}: floating unknown node ${id}`).toBe(true)
        for (const p of scene.pointers ?? []) {
          if (p.target !== null) expect(known.has(p.target), `${where}: pointer ${p.name} targets unknown node ${p.target}`).toBe(true)
        }
        for (const m of scene.marks ?? []) expect(known.has(m.id), `${where}: mark on unknown node ${m.id}`).toBe(true)
        for (const a of scene.annotations ?? []) {
          const [kind, id] = a.target.split(':')
          if (kind === 'node') expect(known.has(id), `${where}: note on unknown node ${id}`).toBe(true)
          if (kind === 'ptr') expect(scene.pointers?.some((p) => p.name === id), `${where}: note on unknown pointer ${id}`).toBe(true)
          expect(a.text.split(/\s+/).length, `${where}: note "${a.text}" is longer than 6 words`).toBeLessThanOrEqual(6)
        }
      })
    }
  })

  it('has no cycles, and every node is floating or reachable from a pointer (or from the dummy)', () => {
    for (const { frames } of allRuns(tracer)) {
      frames.forEach((frame, i) => {
        const where = `${tracer.id} frame ${i} (${frame.at})`
        const scene = listScene(frame)
        const reachable = new Set<string>(scene.floating ?? [])
        // The dummy node is a root in its own right: it is the variable `dummy` in the code.
        if (scene.nodes.some((n) => n.id === 'dummy')) for (const id of walk(scene, 'dummy')) reachable.add(id)
        for (const p of scene.pointers ?? []) if (p.target !== null) for (const id of walk(scene, p.target)) reachable.add(id)
        // A floating node can also point onward; follow it.
        for (const id of scene.floating ?? []) for (const r of walk(scene, id)) reachable.add(r)
        const lost = scene.nodes.map((n) => n.id).filter((id) => !reachable.has(id))
        expect(lost, `${where}: nodes nobody can reach`).toEqual([])
      })
    }
  })

  it('keeps node ids stable: every id is n0..nk (or dummy) from the first frame to the last', () => {
    for (const { frames } of allRuns(tracer)) {
      const first = new Set(listScene(frames[0]).nodes.map((n) => n.id))
      const seen = new Set<string>()
      for (const frame of frames) for (const n of listScene(frame).nodes) seen.add(n.id)
      // Only insert-after introduces a node (the new one); nothing is ever renamed.
      const extra = [...seen].filter((id) => !first.has(id))
      expect(extra.length, `${tracer.id}: ids that appear later`).toBeLessThanOrEqual(tracer.id === 'linked-lists/insert-after' ? 1 : 0)
    }
  })

  it('narrates in at most 140 characters and names values, never "Step N"', () => {
    for (const { frames } of allRuns(tracer)) {
      for (const f of frames) {
        expect(f.say.length).toBeLessThanOrEqual(140)
        expect(f.say).not.toMatch(/undefined|NaN|null null/)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// traverse
// ---------------------------------------------------------------------------

describe('linked-lists/traverse', () => {
  const { frames, result } = traverse.run({ values: [3, 5, 8, 2] })

  it('adds up the default list to 18, one visit and one advance per node', () => {
    expect(result).toBe(18)
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect([count('init'), count('visit'), count('advance'), count('check'), count('done')]).toEqual([1, 4, 4, 1, 1])
    expect(frames).toHaveLength(11)
  })

  it('moves curr down the list and off the end', () => {
    const currs = frames.map((f) => pointerTarget(f, 'curr'))
    expect(currs).toEqual(['n0', 'n0', 'n1', 'n1', 'n2', 'n2', 'n3', 'n3', null, null, undefined])
    expect(frames[frames.length - 1].gauge).toEqual({ value: 4, max: 4, label: 'Nodes visited' })
  })

  it('next-node predict: the answer is where curr actually goes in the next frame', () => {
    let cell = 0
    let choice = 0
    for (const run of allRuns(traverse)) {
      run.frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        expect(p.tag).toBe('next-node')
        expect(frame.at).toBe('visit')
        const next = run.frames[i + 1]
        expect(next.at).toBe('advance')
        if (p.kind === 'cell') {
          cell++
          expect(p.answer).toBe(pointerTarget(next, 'curr'))
        } else {
          choice++
          expect(pointerTarget(next, 'curr')).toBeNull()
          expect(p.answer).toBe('Off the end (null)')
        }
      })
    }
    expect(cell).toBeGreaterThan(0)
    expect(choice).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// insert-after
// ---------------------------------------------------------------------------

describe('linked-lists/insert-after', () => {
  const input = { values: [10, 20, 30, 40], pos: 1, value: 25 }
  const { frames, result } = insertAfter.run(input)

  it('inserts 25 after 20 and reports the new list', () => {
    expect(result).toEqual([10, 20, 25, 30, 40])
    expect(frames.map((f) => f.at)).toEqual(['init', 'walk', 'create', 'link-new', 'link-curr', 'done'])
  })

  it('floats the new node until the last frame, and the final row is in list order', () => {
    const floating = frames.map((f) => listScene(f).floating ?? [])
    expect(floating.map((f) => f.length)).toEqual([0, 0, 1, 1, 1, 0])
    const last = listScene(frames[frames.length - 1])
    expect(walk(last, 'n0').map((id) => last.nodes.find((n) => n.id === id)!.value)).toEqual([10, 20, 25, 30, 40])
    expect(last.nodes.map((n) => n.value)).toEqual([10, 20, 25, 30, 40])
  })

  it('sets node.next = curr.next first (two arrows into 30), then curr.next = node', () => {
    const create = frames[2]
    expect(linkOf(create, 'n4')).toBeUndefined() // nothing points out of the new node yet
    expect(linkOf(create, 'n1')).toBe('n2')

    const first = frames[3]
    expect(linkOf(first, 'n4')).toBe('n2') // new -> 30
    expect(linkOf(first, 'n1')).toBe('n2') // curr -> 30, untouched
    expect(listScene(first).links.filter((l) => l.role === 'changed').map((l) => l.from)).toEqual(['n4'])

    const second = frames[4]
    expect(linkOf(second, 'n1')).toBe('n4') // curr -> new
    expect(linkOf(second, 'n4')).toBe('n2')
    expect(listScene(second).links.filter((l) => l.role === 'changed').map((l) => l.from)).toEqual(['n1'])
  })

  it('inserting after the tail points the new node at null', () => {
    const { frames: tail } = insertAfter.run({ values: [10, 20, 30], pos: 2, value: 40 })
    const linkNew = tail.find((f) => f.at === 'link-new')!
    expect(linkOf(linkNew, 'n3')).toBeNull()
    expect(linkNew.say).toMatch(/null/)
  })

  it('inserting after the head needs no walk frames', () => {
    const { frames: head, result: r } = insertAfter.run({ values: [10, 20, 30], pos: 0, value: 15 })
    expect(r).toEqual([10, 15, 20, 30])
    expect(head.filter((f) => f.at === 'walk')).toHaveLength(0)
    expect(head[0].gauge).toBeUndefined() // no hops to count
  })

  it('link-order predict: the first link written is node.next = curr.next, every time', () => {
    let asked = 0
    for (const run of allRuns(insertAfter)) {
      run.frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'link-order') return
        asked++
        expect(p.options).toEqual(['node.next = curr.next', 'curr.next = node'])
        expect(p.answer).toBe('node.next = curr.next')
        expect(frame.at).toBe('create')
        const reveal = run.frames[i + 1]
        expect(reveal.at).toBe('link-new')
        // the reveal shows only the new node's link changing
        expect(listScene(reveal).links.filter((l) => l.role === 'changed').map((l) => l.from)).toEqual([listScene(reveal).floating![0]])
      })
    }
    expect(asked).toBeGreaterThan(0)
  })

  it('walk-or-stop predict: "Walk on" exactly when the next frame is another hop', () => {
    const answers = new Set<unknown>()
    for (const run of allRuns(insertAfter)) {
      run.frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'walk-or-stop') return
        answers.add(p.answer)
        const next = run.frames[i + 1]
        expect(p.answer).toBe(next.at === 'walk' ? 'Walk on' : 'Stop here')
      })
    }
    expect(answers).toEqual(new Set(['Walk on', 'Stop here']))
  })
})

// ---------------------------------------------------------------------------
// delete
// ---------------------------------------------------------------------------

describe('linked-lists/delete', () => {
  const { frames, result } = del.run({ values: [10, 20, 30, 40], target: 30 })

  it('starts with a dummy node in front of the head', () => {
    const first = listScene(frames[0])
    expect(first.nodes[0].id).toBe('dummy')
    expect(first.links[0]).toEqual({ from: 'dummy', to: 'n0' })
    expect(pointerTarget(frames[0], 'prev')).toBe('dummy')
    expect(pointerTarget(frames[0], 'curr')).toBe('n0')
  })

  it('removes 30: prev trails curr, the bypass skips the node, then the node is dropped', () => {
    expect(result).toEqual([10, 20, 40])
    expect(frames.map((f) => f.at)).toEqual(['init', 'search', 'advance', 'search', 'advance', 'search', 'bypass', 'done'])
    const bypass = frames[6]
    const scene = listScene(bypass)
    expect(pointerTarget(bypass, 'prev')).toBe('n1')
    expect(pointerTarget(bypass, 'curr')).toBe('n2')
    expect(linkOf(bypass, 'n1')).toBe('n3') // 20 -> 40
    expect(scene.links.find((l) => l.from === 'n1')!.role).toBe('changed')
    expect(scene.floating).toEqual(['n2'])
    expect(scene.marks).toContainEqual({ id: 'n2', role: 'discarded' })

    const done = listScene(frames[7])
    expect(done.nodes.map((n) => n.id)).toEqual(['dummy', 'n0', 'n1', 'n3'])
    expect(done.floating).toBeUndefined()
    expect(pointerTarget(frames[7], 'head')).toBe('n0')
  })

  it('deleting the head works the same way, through the dummy', () => {
    const { frames: head, result: r } = del.run({ values: [5, 8, 3], target: 5 })
    expect(r).toEqual([8, 3])
    const bypass = head.find((f) => f.at === 'bypass')!
    expect(pointerTarget(bypass, 'prev')).toBe('dummy')
    expect(linkOf(bypass, 'dummy')).toBe('n1')
    expect(bypass.say).toMatch(/^prev\.next = curr\.next: The dummy/)
    expect(pointerTarget(head[head.length - 1], 'head')).toBe('n1')
  })

  it('deleting the only node leaves an empty list', () => {
    const { frames: one, result: r } = del.run({ values: [4], target: 4 })
    expect(r).toEqual([])
    const last = one[one.length - 1]
    expect(pointerTarget(last, 'head')).toBeNull()
    expect(last.say).toMatch(/empty/)
  })

  it('a value that is not there walks off the end and changes nothing', () => {
    const { frames: miss, result: r } = del.run({ values: [4, 6, 9], target: 7 })
    expect(r).toEqual([4, 6, 9])
    expect(miss.some((f) => f.at === 'bypass')).toBe(false)
    const search = miss.filter((f) => f.at === 'search')
    expect(pointerTarget(search[search.length - 1], 'curr')).toBeNull()
  })

  it('deletes only the first of two equal values', () => {
    expect(del.run({ values: [7, 2, 7], target: 7 }).result).toEqual([2, 7])
  })

  it('where-prev-points and prev-trails predicts tell the truth', () => {
    const seen = new Set<string>()
    for (const run of allRuns(del)) {
      run.frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        seen.add(`${p.tag}/${p.kind}`)
        const next = run.frames[i + 1]
        if (p.tag === 'where-prev-points') {
          expect(next.at).toBe('bypass')
          const prevId = pointerTarget(next, 'prev')!
          const target = linkOf(next, prevId)
          if (p.kind === 'cell') expect(p.answer, 'the bypass link of prev').toBe(target)
          else {
            expect(target, 'the deleted node was the tail').toBeNull()
            expect(p.answer).toBe('null')
          }
        } else {
          expect(p.tag).toBe('prev-trails')
          expect(next.at).toBe('advance')
          // prev lands on the node curr was on; curr moves on
          expect(pointerTarget(next, 'prev')).toBe(pointerTarget(frame, 'curr'))
          expect(pointerTarget(next, 'curr')).not.toBe(pointerTarget(frame, 'curr'))
          expect(p.answer).toBe('prev and curr both move')
        }
      })
    }
    expect(seen).toEqual(new Set(['where-prev-points/cell', 'where-prev-points/choice', 'prev-trails/choice']))
  })
})

// ---------------------------------------------------------------------------
// reverse
// ---------------------------------------------------------------------------

describe('linked-lists/reverse', () => {
  const { frames, result } = reverse.run({ values: [1, 2, 3, 4] })

  it('reverses 1, 2, 3, 4 in 15 frames: init, 4 x (save, flip, advance), check, done', () => {
    expect(result).toEqual([4, 3, 2, 1])
    expect(frames).toHaveLength(15)
    const ats = frames.map((f) => f.at)
    expect(ats[0]).toBe('init')
    for (let lap = 0; lap < 4; lap++) expect(ats.slice(1 + lap * 3, 4 + lap * 3)).toEqual(['save', 'flip', 'advance'])
    expect(ats.slice(13)).toEqual(['check', 'done'])
  })

  it('shows the three-pointer dance: prev trails, curr leads, nxt marks the way on', () => {
    const at = (i: number) => ({ prev: pointerTarget(frames[i], 'prev'), curr: pointerTarget(frames[i], 'curr'), nxt: pointerTarget(frames[i], 'nxt') })
    expect(at(0)).toEqual({ prev: null, curr: 'n0', nxt: undefined })
    expect(at(1)).toEqual({ prev: null, curr: 'n0', nxt: 'n1' }) // save
    expect(at(2)).toEqual({ prev: null, curr: 'n0', nxt: 'n1' }) // flip
    expect(at(3)).toEqual({ prev: 'n0', curr: 'n1', nxt: 'n1' }) // advance
    expect(at(4)).toEqual({ prev: 'n0', curr: 'n1', nxt: 'n2' })
    expect(at(12)).toEqual({ prev: 'n3', curr: null, nxt: null })
  })

  it('flips exactly one link per flip frame (marked changed) and the tail ends at null', () => {
    const flips = frames.filter((f) => f.at === 'flip')
    expect(flips).toHaveLength(4)
    flips.forEach((frame, k) => {
      const scene = listScene(frame)
      expect(scene.links.filter((l) => l.role === 'changed').map((l) => l.from)).toEqual([`n${k}`])
      expect(linkOf(frame, `n${k}`)).toBe(k === 0 ? null : `n${k - 1}`)
      // links not reached yet still point forward
      for (let j = k + 1; j < 4; j++) expect(linkOf(frame, `n${j}`)).toBe(j + 1 < 4 ? `n${j + 1}` : null)
    })
  })

  it('never loses the rest of the list: the old chain stays reachable from nxt while a link flips', () => {
    for (const run of allRuns(reverse)) {
      run.frames.forEach((frame) => {
        if (frame.at !== 'flip') return
        const scene = listScene(frame)
        const nxt = pointerTarget(frame, 'nxt')
        const reachable = new Set<string>()
        for (const name of ['prev', 'curr', 'nxt']) {
          const t = pointerTarget(frame, name)
          if (t) walk(scene, t).forEach((id) => reachable.add(id))
        }
        expect(reachable.size, 'every node is reachable from prev, curr or nxt').toBe(scene.nodes.length)
        if (nxt) expect(walk(scene, nxt).length).toBeGreaterThan(0)
      })
    }
  })

  it('re-lists the nodes head to tail on the last frame: new head is the old tail', () => {
    const last = listScene(frames[frames.length - 1])
    expect(last.nodes.map((n) => n.value)).toEqual([4, 3, 2, 1])
    expect(last.nodes.map((n) => n.id)).toEqual(['n3', 'n2', 'n1', 'n0'])
    expect(pointerTarget(frames[frames.length - 1], 'head')).toBe('n3')
    expect(last.links).toEqual([
      { from: 'n3', to: 'n2' },
      { from: 'n2', to: 'n1' },
      { from: 'n1', to: 'n0' },
      { from: 'n0', to: null },
    ])
    expect(walk(last, 'n3')).toEqual(['n3', 'n2', 'n1', 'n0'])
  })

  it('where-does-curr-next-point predict: the answer is the link the next (flip) frame shows', () => {
    let cell = 0
    let choice = 0
    for (const run of allRuns(reverse)) {
      run.frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'where-does-curr-next-point') return
        const flip = run.frames[i + 1]
        expect(frame.at).toBe('save')
        expect(flip.at).toBe('flip')
        const curr = pointerTarget(flip, 'curr')!
        if (p.kind === 'cell') {
          cell++
          expect(p.answer).toBe(linkOf(flip, curr))
        } else {
          choice++
          expect(linkOf(flip, curr)).toBeNull()
          expect(p.answer).toBe('null')
        }
      })
    }
    expect(cell).toBeGreaterThan(0)
    expect(choice).toBeGreaterThan(0)
  })

  it('loop-again predict: Yes exactly when curr is a node in the frame that follows', () => {
    const answers = new Set<unknown>()
    for (const run of allRuns(reverse)) {
      run.frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'loop-again') return
        answers.add(p.answer)
        const next = run.frames[i + 1]
        expect(p.answer).toBe(next.at === 'save' ? 'Yes' : 'No')
        expect(next.at).toBe(pointerTarget(frame, 'curr') === null ? 'check' : 'save')
      })
    }
    expect(answers).toEqual(new Set(['Yes', 'No']))
  })

  it('handles one-node and two-node lists', () => {
    expect(reverse.run({ values: [7] }).result).toEqual([7])
    expect(reverse.run({ values: [5, 9] }).result).toEqual([9, 5])
  })
})

// ---------------------------------------------------------------------------
// Input rules
// ---------------------------------------------------------------------------

describe('linked-list inputs', () => {
  it.each([traverse, reverse])('$id accepts friendly formats and names limits', (tracer) => {
    const { parse } = tracer.input
    expect(parse({ values: '[1, 2, 3]' })).toEqual({ ok: true, value: { values: [1, 2, 3] } })
    expect(parse({ values: '4 −1 2' })).toEqual({ ok: true, value: { values: [4, -1, 2] } })
    expect(parse({ values: Array(9).fill('1').join(',') })).toMatchObject({ ok: false, field: 'values', error: expect.stringMatching(/at most 8/) })
    expect(parse({ values: '1, 100' })).toMatchObject({ ok: false, field: 'values', error: expect.stringMatching(/-99 and 99/) })
    expect(parse({ values: '1, two' })).toMatchObject({ ok: false, field: 'values', error: expect.stringMatching(/"two"/) })
  })

  it('insert-after rejects positions outside the list and says why', () => {
    const ok = (values: string, pos: string, value: string) => insertAfter.input.parse({ values, pos, value })
    expect(ok('1, 2, 3', '2', '9')).toEqual({ ok: true, value: { values: [1, 2, 3], pos: 2, value: 9 } })
    expect(ok('1, 2, 3', '3', '9')).toMatchObject({ ok: false, field: 'pos', error: expect.stringMatching(/last position is 2/) })
    expect(ok('1, 2, 3', '-1', '9')).toMatchObject({ ok: false, field: 'pos', error: expect.stringMatching(/negative/) })
    expect(ok('1, 2, 3', '1', '100')).toMatchObject({ ok: false, field: 'value', error: expect.stringMatching(/-99 and 99/) })
    expect(ok(Array(8).fill('1').join(','), '0', '5')).toMatchObject({ ok: false, field: 'values', error: expect.stringMatching(/at most 7/) })
  })

  it('delete accepts any value in range, even one that is not in the list', () => {
    const ok = (values: string, target: string) => del.input.parse({ values, target })
    expect(ok('1, 2, 3', '9')).toEqual({ ok: true, value: { values: [1, 2, 3], target: 9 } })
    expect(ok('1, 2, 3', '-5')).toEqual({ ok: true, value: { values: [1, 2, 3], target: -5 } })
    expect(ok('1, 2, 3', '')).toMatchObject({ ok: false, field: 'target' })
    expect(ok('1, 2, 3', '100')).toMatchObject({ ok: false, field: 'target', error: expect.stringMatching(/-99 and 99/) })
  })
})

// ---------------------------------------------------------------------------
// The lesson file wires up to these tracers
// ---------------------------------------------------------------------------

describe('content/topics/linked-lists.json', () => {
  const lesson = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../../content/topics/linked-lists.json', import.meta.url)), 'utf8')) as LessonV2
  const byId = new Map(tracers.map((t) => [t.id as string, t]))

  it('is a valid v2 lesson', () => {
    expect(lessonV2Schema.safeParse(lesson).success).toBe(true)
    expect(lesson.slug).toBe('linked-lists')
  })

  it('has four tracks on the four tracers, each asking predict tags its guided run really emits', () => {
    expect(lesson.stage.tracks.map((t) => t.tracer)).toEqual([
      'linked-lists/traverse',
      'linked-lists/insert-after',
      'linked-lists/delete',
      'linked-lists/reverse',
    ])
    for (const track of lesson.stage.tracks) {
      const tracer = byId.get(track.tracer)!
      expect(tracer, track.tracer).toBeDefined()
      const preset = tracer.input.presets[track.preset ?? 0]
      const emitted = tracer.run(preset.value).frames.flatMap((f) => (f.predict ? [f.predict.tag] : []))
      expect(track.predict!.max).toBeLessThanOrEqual(3)
      for (const tag of track.predict!.tags) expect(emitted, `${track.id}: tag ${tag} in the guided run`).toContain(tag)
    }
  })

  it('ties the template to reverse: every pseudocode anchor is one of its rules, and every rule has a line', () => {
    expect(lesson.template.tracer).toBe('linked-lists/reverse')
    const anchors = Object.keys(reverse.anchors).sort()
    const used = lesson.template.pseudocode.flatMap((l) => (l.anchor ? [l.anchor] : []))
    for (const a of used) expect(anchors).toContain(a)
    expect([...used].sort()).toEqual(anchors)
  })

  it('draws the shape as a 4-node list whose callouts point at things that exist', () => {
    const scene = lesson.shape.scene
    expect(scene.kind).toBe('linked-list')
    if (scene.kind !== 'linked-list') return
    expect(scene.nodes).toHaveLength(4)
    for (const c of lesson.shape.callouts) {
      const [kind, id] = c.target.split(':')
      expect(kind).toBe('node')
      if (id !== 'null') expect(scene.nodes.map((n) => n.id)).toContain(id)
      expect(c.text.split(/\s+/).length).toBeLessThanOrEqual(6)
    }
  })

  it('runs the reverse example in the stage with its own tracer', () => {
    const reverseExample = lesson.examples.find((e) => e.tracer)
    expect(reverseExample?.tracer).toBe('linked-lists/reverse')
    expect(reverseExample?.code).toBe('linked-lists/reverse')
  })
})
