/**
 * Extra checks for the fast-and-slow-pointer tracers (cycle, middle,
 * cycle-start). The generic contract suite runs from registry.test.ts and only
 * knows array scenes, so this file adds:
 *   - linked-list scene sanity (including the tail-to-pos cycle link)
 *   - predict answers checked against what the next frame shows
 *   - the teaching beats of each default preset
 *   - input rules (`pos`) and the lesson file wiring
 */
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { lessonV2Schema } from '@/lib/content-schema'
import type { LessonV2 } from '@/types/learning'
import cycle from '@/lib/tracers/fast-and-slow-pointers/cycle'
import middle from '@/lib/tracers/fast-and-slow-pointers/middle'
import cycleStart from '@/lib/tracers/fast-and-slow-pointers/cycle-start'
import type { AnyTracer, Frame, LinkedListScene } from '@/lib/engine/types'

const tracers: AnyTracer[] = [cycle, middle, cycleStart]

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

function allRuns(tracer: AnyTracer): Array<{ input: { values: number[]; pos?: number }; frames: Frame[] }> {
  const inputs: Array<{ values: number[]; pos?: number }> = [
    ...tracer.input.presets.map((p) => p.value),
    ...Array.from({ length: 200 }, (_, i) => tracer.input.random(i + 1)),
  ]
  return inputs.map((input) => ({ input, frames: tracer.run(input).frames }))
}

/** True when the frame's fast pointer has two nodes ahead (the loop test). */
function fastCanRace(frame: Frame): boolean {
  const fast = pointerTarget(frame, 'fast')
  return fast !== null && fast !== undefined && linkOf(frame, fast) !== null
}

// ---------------------------------------------------------------------------
// Scene sanity
// ---------------------------------------------------------------------------

describe.each(tracers)('$id: linked-list scenes are well formed', (tracer) => {
  it('draws n nodes, n links (the tail links to pos, or null) and both pointers on every frame', () => {
    for (const { input, frames } of allRuns(tracer)) {
      const n = input.values.length
      const pos = input.pos ?? -1
      frames.forEach((frame, i) => {
        const where = `${tracer.id} ${JSON.stringify(input)} frame ${i} (${frame.at})`
        const scene = listScene(frame)
        const ids = scene.nodes.map((node) => node.id)
        expect(ids, `${where}: nodes`).toEqual(Array.from({ length: n }, (_, k) => `n${k}`))
        expect(scene.nodes.map((node) => node.value), `${where}: values`).toEqual(input.values)
        expect(scene.links, `${where}: one next link per node`).toHaveLength(n)
        scene.links.forEach((link, k) => {
          const expected = k < n - 1 ? `n${k + 1}` : pos >= 0 ? `n${pos}` : null
          expect(link, `${where}: link of n${k}`).toEqual({ from: `n${k}`, to: expected })
        })
        expect(scene.floating, `${where}: floating`).toBeUndefined()
        const names = (scene.pointers ?? []).map((p) => p.name)
        expect(names, `${where}: pointers`).toEqual(['slow', 'fast'])
        for (const p of scene.pointers ?? []) {
          if (p.target !== null) expect(ids, `${where}: pointer ${p.name} target`).toContain(p.target)
        }
        expect(scene.pointers?.[0].role).toBe('ptrA')
        expect(scene.pointers?.[1].role).toBe('ptrB')
        for (const m of scene.marks ?? []) expect(ids, `${where}: mark`).toContain(m.id)
        for (const a of scene.annotations ?? []) {
          const [kind, id] = a.target.split(':')
          if (kind === 'node') expect(ids, `${where}: note on node`).toContain(id)
          if (kind === 'ptr') expect(names, `${where}: note on pointer`).toContain(id)
          expect(a.text.split(/\s+/).length, `${where}: note "${a.text}" longer than 6 words`).toBeLessThanOrEqual(6)
        }
      })
    }
  })

  it('slow is never null and, for a list without a cycle, only fast ever sits on null', () => {
    for (const { frames } of allRuns(tracer)) {
      for (const frame of frames) expect(pointerTarget(frame, 'slow')).not.toBeNull()
    }
  })

  it('narrates without leaking undefined or NaN and keeps the vars in step with the pointers', () => {
    for (const { input, frames } of allRuns(tracer)) {
      for (const frame of frames) {
        expect(frame.say).not.toMatch(/undefined|NaN/)
        const slow = pointerTarget(frame, 'slow')!
        expect(frame.vars.slow).toBe(input.values[Number(slow.slice(1))])
        const fast = pointerTarget(frame, 'fast')
        expect(frame.vars.fast).toBe(fast === null || fast === undefined ? null : input.values[Number(fast.slice(1))])
      }
    }
  })
})

// ---------------------------------------------------------------------------
// cycle
// ---------------------------------------------------------------------------

describe('fast-and-slow-pointers/cycle', () => {
  const { frames, result } = cycle.run({ values: [3, 2, 0, -4], pos: 1 })

  it('finds the loop in 3, 2, 0, -4 (tail back to 2): init, 3 x (check, move, meet), done', () => {
    expect(result).toBe(true)
    expect(frames.map((f) => f.at)).toEqual(['init', 'check', 'move', 'meet', 'check', 'move', 'meet', 'check', 'move', 'meet', 'done'])
  })

  it('moves slow one node and fast two nodes each lap, and they meet on -4 (n3)', () => {
    const slows = frames.filter((f) => f.at === 'move').map((f) => pointerTarget(f, 'slow'))
    const fasts = frames.filter((f) => f.at === 'move').map((f) => pointerTarget(f, 'fast'))
    expect(slows).toEqual(['n1', 'n2', 'n3'])
    expect(fasts).toEqual(['n2', 'n1', 'n3'])
    const meet = frames[9]
    expect(pointerTarget(meet, 'slow')).toBe('n3')
    expect(pointerTarget(meet, 'fast')).toBe('n3')
    expect(listScene(meet).marks).toContainEqual({ id: 'n3', role: 'found' })
  })

  it('draws the cycle as a link from the tail back to node 1', () => {
    expect(linkOf(frames[0], 'n3')).toBe('n1')
  })

  it('a straight list ends with fast off the end and returns false', () => {
    const run = cycle.run({ values: [1, 2, 3, 4, 5], pos: -1 })
    expect(run.result).toBe(false)
    const last = run.frames[run.frames.length - 1]
    expect(last.at).toBe('done')
    expect(last.say).toMatch(/Return false/)
    expect(run.frames.some((f) => f.at === 'meet' && listScene(f).marks?.length)).toBe(false)
    expect(run.frames[run.frames.length - 2].at).toBe('check')
    expect(pointerTarget(run.frames[run.frames.length - 2], 'fast')).toBe('n4')
  })

  it('an even straight list ends with fast on null', () => {
    const run = cycle.run({ values: [1, 2, 3, 4], pos: -1 })
    const move = run.frames.filter((f) => f.at === 'move')
    expect(pointerTarget(move[move.length - 1], 'fast')).toBeNull()
    expect(run.result).toBe(false)
  })

  it('a single node that links to itself is a cycle, and a single node that does not is not', () => {
    expect(cycle.run({ values: [5], pos: 0 }).result).toBe(true)
    expect(cycle.run({ values: [5], pos: -1 }).result).toBe(false)
  })

  it('where-fast-lands predict: the answer is the node fast really lands on', () => {
    let asked = 0
    for (const run of allRuns(cycle)) {
      run.frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'where-fast-lands') return
        asked++
        expect(frame.at).toBe('check')
        expect(p.kind).toBe('cell')
        const next = run.frames[i + 1]
        expect(next.at).toBe('move')
        expect(p.answer).toBe(pointerTarget(next, 'fast'))
        expect(pointerTarget(next, 'fast')).not.toBeNull()
      })
    }
    expect(asked).toBeGreaterThan(0)
  })

  it('meet-or-null predict: "Fast runs out" exactly when the next loop test fails', () => {
    const answers = new Set<unknown>()
    for (const run of allRuns(cycle)) {
      run.frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'meet-or-null') return
        answers.add(p.answer)
        expect(frame.at).toBe('meet')
        expect(pointerTarget(frame, 'slow')).not.toBe(pointerTarget(frame, 'fast'))
        const next = run.frames[i + 1]
        expect(next.at).toBe('check')
        expect(p.answer).toBe(fastCanRace(next) ? 'Still racing' : 'Fast runs out')
      })
    }
    expect(answers).toEqual(new Set(['Still racing', 'Fast runs out']))
  })

  it('never takes more than n laps before the answer, so the run is O(n)', () => {
    for (const { input, frames: fs2 } of allRuns(cycle)) {
      expect(fs2.filter((f) => f.at === 'move').length).toBeLessThanOrEqual(input.values.length)
    }
  })
})

// ---------------------------------------------------------------------------
// middle
// ---------------------------------------------------------------------------

describe('fast-and-slow-pointers/middle', () => {
  it('odd list 1..5: slow ends on 3, fast on the last node', () => {
    const { frames, result } = middle.run({ values: [1, 2, 3, 4, 5] })
    expect(result).toBe(2)
    expect(frames.map((f) => f.at)).toEqual(['init', 'check', 'move', 'check', 'move', 'check', 'done'])
    const stop = frames[5]
    expect(pointerTarget(stop, 'slow')).toBe('n2')
    expect(pointerTarget(stop, 'fast')).toBe('n4')
    expect(frames[6].say).toMatch(/exact middle, 3/)
  })

  it('even list 1..6: returns the SECOND middle (4, index 3), with fast off the end', () => {
    const { frames, result } = middle.run({ values: [1, 2, 3, 4, 5, 6] })
    expect(result).toBe(3)
    const stop = frames[frames.length - 2]
    expect(pointerTarget(stop, 'slow')).toBe('n3')
    expect(pointerTarget(stop, 'fast')).toBeNull()
    expect(frames[frames.length - 1].say).toMatch(/second middle node, 4/)
  })

  it('one node is its own middle, with no laps', () => {
    const { frames, result } = middle.run({ values: [7] })
    expect(result).toBe(0)
    expect(frames.map((f) => f.at)).toEqual(['init', 'check', 'done'])
  })

  it('where-slow-ends predict: the answer is where slow really lands', () => {
    let asked = 0
    for (const run of allRuns(middle)) {
      run.frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'where-slow-ends') return
        asked++
        expect(frame.at).toBe('check')
        const next = run.frames[i + 1]
        expect(next.at).toBe('move')
        expect(p.answer).toBe(pointerTarget(next, 'slow'))
      })
    }
    expect(asked).toBeGreaterThan(0)
  })

  it('keep-going predict: "Yes" exactly when the next loop test passes', () => {
    const answers = new Set<unknown>()
    for (const run of allRuns(middle)) {
      run.frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'keep-going') return
        answers.add(p.answer)
        expect(frame.at).toBe('move')
        const next = run.frames[i + 1]
        expect(next.at).toBe('check')
        expect(p.answer).toBe(fastCanRace(next) ? 'Yes, another lap' : 'No, stop')
      })
    }
    expect(answers).toEqual(new Set(['Yes, another lap', 'No, stop']))
  })

  it('the middle index is always floor(n / 2) and slow takes floor(n / 2) steps', () => {
    for (const { input, frames } of allRuns(middle)) {
      const last = frames[frames.length - 1]
      expect(pointerTarget(last, 'slow')).toBe(`n${Math.floor(input.values.length / 2)}`)
      expect(frames.filter((f) => f.at === 'move')).toHaveLength(Math.floor(input.values.length / 2))
    }
  })
})

// ---------------------------------------------------------------------------
// cycle-start
// ---------------------------------------------------------------------------

describe('fast-and-slow-pointers/cycle-start', () => {
  const input = { values: [4, 8, 15, 16, 23, 42], pos: 2 }
  const { frames, result } = cycleStart.run(input)

  it('finds the entry, index 2 (value 15)', () => {
    expect(result).toBe(2)
    const last = frames[frames.length - 1]
    expect(last.at).toBe('done')
    expect(listScene(last).marks).toContainEqual({ id: 'n2', role: 'found' })
    expect(last.say).toMatch(/15/)
  })

  it('runs phase 1 (the race), then reset, then exactly pos walk frames, then done', () => {
    const ats = frames.map((f) => f.at)
    const reset = ats.indexOf('reset')
    expect(reset).toBeGreaterThan(0)
    expect(ats.slice(0, reset).every((a) => ['init', 'check', 'move', 'meet'].includes(a))).toBe(true)
    expect(ats.slice(reset + 1)).toEqual([...Array(input.pos).fill('walk'), 'done'])
  })

  it('reset puts slow on the head and leaves fast on the meeting point; walk then moves both one step', () => {
    const reset = frames.findIndex((f) => f.at === 'reset')
    const before = frames[reset - 1]
    expect(pointerTarget(frames[reset], 'slow')).toBe('n0')
    expect(pointerTarget(frames[reset], 'fast')).toBe(pointerTarget(before, 'fast'))
    const walks = frames.filter((f) => f.at === 'walk')
    let slow = 'n0'
    let fast = pointerTarget(frames[reset], 'fast')!
    for (const w of walks) {
      slow = linkOf(w, slow)!
      fast = linkOf(w, fast)!
      expect(pointerTarget(w, 'slow')).toBe(slow)
      expect(pointerTarget(w, 'fast')).toBe(fast)
    }
    expect(slow).toBe('n2')
    expect(fast).toBe('n2')
  })

  it('explains the distance argument in one sentence of at most 140 characters', () => {
    const reset = frames.find((f) => f.at === 'reset')!
    expect(reset.say).toMatch(/head to entry equals meeting point to entry/i)
    expect(reset.say.length).toBeLessThanOrEqual(140)
  })

  it('when the loop starts at the head, there are no walk frames', () => {
    const run = cycleStart.run({ values: [5, 9, 12], pos: 0 })
    expect(run.result).toBe(0)
    expect(run.frames.some((f) => f.at === 'walk')).toBe(false)
    expect(run.frames.some((f) => f.at === 'reset')).toBe(true)
  })

  it('no cycle: returns -1 (null) after fast runs off the end, with no phase 2', () => {
    const run = cycleStart.run({ values: [1, 2, 3, 4], pos: -1 })
    expect(run.result).toBe(-1)
    expect(run.frames.some((f) => f.at === 'reset' || f.at === 'walk')).toBe(false)
    expect(run.frames[run.frames.length - 1].say).toMatch(/Return null/)
  })

  it('phase 2 always takes exactly pos steps (head to entry), whatever the loop length', () => {
    for (const { input: inp, frames: fs2 } of allRuns(cycleStart)) {
      const pos = inp.pos ?? -1
      if (pos < 0) continue
      expect(fs2.filter((f) => f.at === 'walk'), JSON.stringify(inp)).toHaveLength(pos)
    }
  })

  it('where-they-meet predict: both pointers really land on the clicked node', () => {
    let asked = 0
    for (const run of allRuns(cycleStart)) {
      run.frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'where-they-meet') return
        asked++
        expect(['reset', 'walk']).toContain(frame.at)
        expect(p.kind).toBe('cell')
        const next = run.frames[i + 1]
        expect(next.at).toBe('walk')
        expect(pointerTarget(next, 'slow')).toBe(p.answer)
        expect(pointerTarget(next, 'fast')).toBe(p.answer)
      })
    }
    expect(asked).toBeGreaterThan(0)
  })

  it('speed-after-reset predict: fast takes one step on the frame after reset', () => {
    let asked = 0
    for (const run of allRuns(cycleStart)) {
      run.frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'speed-after-reset') return
        asked++
        expect(frame.at).toBe('reset')
        expect(p.answer).toBe('1 step')
        const next = run.frames[i + 1]
        expect(next.at).toBe('walk')
        expect(pointerTarget(next, 'fast')).toBe(linkOf(frame, pointerTarget(frame, 'fast')!))
      })
    }
    expect(asked).toBeGreaterThan(0)
  })

  it('meet-or-null and where-fast-lands predicts also tell the truth in phase 1', () => {
    for (const run of allRuns(cycleStart)) {
      run.frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        const next = run.frames[i + 1]
        if (p.tag === 'where-fast-lands') expect(p.answer).toBe(pointerTarget(next, 'fast'))
        if (p.tag === 'meet-or-null') expect(p.answer).toBe(fastCanRace(next) ? 'Still racing' : 'Fast runs out')
      })
    }
  })
})

// ---------------------------------------------------------------------------
// Input rules
// ---------------------------------------------------------------------------

describe('fast-and-slow-pointers inputs', () => {
  it.each([cycle, cycleStart])('$id parses values and pos, and says what is wrong with pos', (tracer) => {
    const { parse } = tracer.input
    expect(parse({ values: '[3, 2, 0, -4]', pos: '1' })).toEqual({ ok: true, value: { values: [3, 2, 0, -4], pos: 1 } })
    expect(parse({ values: '1 2 3', pos: '-1' })).toEqual({ ok: true, value: { values: [1, 2, 3], pos: -1 } })
    expect(parse({ values: '1 2 3', pos: '−1' })).toEqual({ ok: true, value: { values: [1, 2, 3], pos: -1 } })
    expect(parse({ values: '1, 2, 3', pos: '3' })).toMatchObject({ ok: false, field: 'pos', error: expect.stringMatching(/-1 \(no cycle\) or 0 to 2/) })
    expect(parse({ values: '1, 2, 3', pos: '-2' })).toMatchObject({ ok: false, field: 'pos' })
    expect(parse({ values: '1, 2, 3', pos: '' })).toMatchObject({ ok: false, field: 'pos' })
    expect(parse({ values: '1, 2, 3', pos: 'x' })).toMatchObject({ ok: false, field: 'pos', error: expect.stringMatching(/"x"/) })
    expect(parse({ values: Array(9).fill('1').join(','), pos: '0' })).toMatchObject({ ok: false, field: 'values', error: expect.stringMatching(/at most 8/) })
    expect(parse({ values: '1, 100', pos: '0' })).toMatchObject({ ok: false, field: 'values', error: expect.stringMatching(/-99 and 99/) })
  })

  it('middle needs only values', () => {
    expect(middle.input.fields.map((f) => f.name)).toEqual(['values'])
    expect(middle.input.parse({ values: '1, 2, 3' })).toEqual({ ok: true, value: { values: [1, 2, 3] } })
    expect(middle.input.parse({ values: '1, two' })).toMatchObject({ ok: false, field: 'values', error: expect.stringMatching(/"two"/) })
  })
})

// ---------------------------------------------------------------------------
// The lesson file wires up to these tracers
// ---------------------------------------------------------------------------

describe('content/topics/fast-and-slow-pointers.json', () => {
  const lesson = JSON.parse(
    fs.readFileSync(fileURLToPath(new URL('../../content/topics/fast-and-slow-pointers.json', import.meta.url)), 'utf8'),
  ) as LessonV2
  const byId = new Map(tracers.map((t) => [t.id as string, t]))

  it('is a valid v2 lesson', () => {
    expect(lessonV2Schema.safeParse(lesson).success).toBe(true)
    expect(lesson.slug).toBe('fast-and-slow-pointers')
  })

  it('has three tracks on the three tracers, each asking predict tags its guided run really emits', () => {
    expect(lesson.stage.tracks.map((t) => t.tracer)).toEqual([
      'fast-and-slow-pointers/cycle',
      'fast-and-slow-pointers/middle',
      'fast-and-slow-pointers/cycle-start',
    ])
    for (const track of lesson.stage.tracks) {
      const tracer = byId.get(track.tracer)!
      const { frames } = tracer.run(tracer.input.presets[track.preset ?? 0].value)
      const emitted = new Set(frames.slice(0, -1).map((f) => f.predict?.tag).filter(Boolean))
      for (const tag of track.predict?.tags ?? []) expect(emitted, `${track.id}: tag ${tag}`).toContain(tag)
    }
  })

  it('has examples that replay the tracers and a template tied to the cycle tracer', () => {
    expect(lesson.template.tracer).toBe('fast-and-slow-pointers/cycle')
    for (const example of lesson.examples) if (example.tracer) expect(byId.has(example.tracer)).toBe(true)
  })
})
