/**
 * Extra checks for the greedy tracers (jump-game, interval-scheduling). The
 * generic contract suite (frames, anchors, code parity, parse, correctness...)
 * runs from registry.test.ts; this file asserts what only these tracers can
 * know: that their predict answers are true, that the scenes tell the story of
 * the algorithm, and the teaching beats of the default presets.
 */
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { lessonV2Schema } from '@/lib/content-schema'
import type { LessonV2 } from '@/types/learning'
import jumpGame from '@/lib/tracers/greedy/jump-game'
import type { JumpGameInput } from '@/lib/tracers/greedy/jump-game'
import scheduling from '@/lib/tracers/greedy/interval-scheduling'
import type { IntervalSchedulingInput } from '@/lib/tracers/greedy/interval-scheduling'
import type { AnyTracer, ArrayScene, Frame } from '@/lib/engine/types'

function arrayScene(frame: Frame): ArrayScene {
  if (frame.scene.kind !== 'array') throw new Error('expected an array scene')
  return frame.scene
}

function roles(frame: Frame, role: string): number[] {
  return (arrayScene(frame).marks ?? []).filter((m) => m.role === role).map((m) => m.index)
}

function count(frames: Frame[], at: string): number {
  return frames.filter((f) => f.at === at).length
}

// ===========================================================================
// greedy/jump-game
// ===========================================================================

const jInput = jumpGame.input
const jDefault = jInput.presets[0].value as JumpGameInput

function allJumpRuns(): Array<{ input: JumpGameInput; frames: Frame[]; result: boolean }> {
  const inputs: JumpGameInput[] = [...jInput.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => jInput.random(i + 1))]
  return inputs.map((value) => ({ input: value, ...jumpGame.run(value) }))
}

describe('greedy/jump-game: default preset', () => {
  const { frames, result } = jumpGame.run(jDefault)

  it('is the stuck-behind-the-zero example and returns false', () => {
    expect(jDefault).toEqual({ nums: [3, 2, 1, 0, 4] })
    expect(result).toBe(false)
  })

  it('walks init, 4 checks, 4 extends, stuck at index 4 and done', () => {
    expect(frames.map((f) => f.at)).toEqual(['init', 'check', 'extend', 'check', 'extend', 'check', 'extend', 'check', 'extend', 'stuck', 'done'])
    const stuck = frames[frames.length - 2]
    expect(stuck.vars).toEqual({ i: 4, reach: 3, last: 4 })
    expect(roles(stuck, 'error')).toEqual([4])
    expect(arrayScene(stuck).window).toEqual({ start: 0, end: 3 })
  })

  it('stretches reach to 3 on the first cell and never changes it after', () => {
    const reaches = frames.filter((f) => f.at === 'extend').map((f) => f.vars.reach)
    expect(reaches).toEqual([3, 3, 3, 3])
  })

  it('the reaches example grows and finishes with the last cell found', () => {
    const { frames: f, result: r } = jumpGame.run(jInput.presets[1].value as JumpGameInput)
    expect(r).toBe(true)
    expect(f.filter((x) => x.at === 'extend').map((x) => x.vars.reach)).toEqual([2, 4])
    expect(count(f, 'stuck')).toBe(0)
    const done = f[f.length - 1]
    expect(done.at).toBe('done')
    expect(roles(done, 'found')).toEqual([4])
    expect(arrayScene(done).window).toEqual({ start: 0, end: 4 })
  })

  it('"Hop over zeros" stops early once reach covers the last index', () => {
    const { frames: f, result: r } = jumpGame.run(jInput.presets[2].value as JumpGameInput)
    expect(r).toBe(true)
    const lastExtend = f.filter((x) => x.at === 'extend').pop()!
    expect(lastExtend.vars.i).toBe(4)
    expect(lastExtend.vars.reach).toBe(13)
    expect(f).toHaveLength(f.findIndex((x) => x === lastExtend) + 2)
  })
})

describe('greedy/jump-game: scenes', () => {
  it('draw the reach window as [0, min(reach, last)], with the pointer on i', () => {
    for (const { frames, input } of allJumpRuns()) {
      const last = input.nums.length - 1
      frames.forEach((frame, k) => {
        const scene = arrayScene(frame)
        expect(scene.cells).toEqual(input.nums)
        const reach = frame.vars.reach as number
        const success = frame.at === 'done' && reach >= last
        expect(scene.window, `frame ${k} window`).toEqual({ start: 0, end: success ? last : Math.min(reach, last) })
        expect(scene.pointers).toEqual([{ name: 'i', index: frame.vars.i, role: 'focus' }])
      })
    }
  })

  it('reach never goes down, and only a grown extend flashes a changed cell', () => {
    for (const { frames } of allJumpRuns()) {
      let prev = 0
      frames.forEach((frame, k) => {
        const reach = frame.vars.reach as number
        expect(reach, `frame ${k}`).toBeGreaterThanOrEqual(prev)
        if (frame.at === 'extend') expect(roles(frame, 'changed').length === 1).toBe(reach > prev)
        else expect(roles(frame, 'changed')).toEqual([])
        prev = reach
      })
    }
  })

  it('stuck is shown exactly when i is past reach, with every later cell discarded', () => {
    let sawStuck = false
    for (const { frames, result } of allJumpRuns()) {
      const stuck = frames.filter((f) => f.at === 'stuck')
      expect(stuck.length).toBe(result ? 0 : 1)
      for (const frame of stuck) {
        sawStuck = true
        const i = frame.vars.i as number
        expect(i).toBeGreaterThan(frame.vars.reach as number)
        expect(roles(frame, 'error')).toEqual([i])
        const n = arrayScene(frame).cells.length
        expect(roles(frame, 'discarded')).toEqual(Array.from({ length: n - 1 - i }, (_, k) => i + 1 + k))
      }
      for (const frame of frames.filter((f) => f.at === 'check')) {
        expect(frame.vars.i as number).toBeLessThanOrEqual(frame.vars.reach as number)
      }
    }
    expect(sawStuck).toBe(true)
  })

  it('random inputs produce both outcomes', () => {
    const outcomes = new Set(allJumpRuns().map((r) => r.result))
    expect(outcomes).toEqual(new Set([true, false]))
  })

  it('the done frame reports the result, and the last cell is found only on success', () => {
    for (const { frames, result, input } of allJumpRuns()) {
      const done = frames[frames.length - 1]
      expect(done.at).toBe('done')
      expect(roles(done, 'found')).toEqual(result ? [input.nums.length - 1] : [])
    }
  })
})

describe('greedy/jump-game: predicts tell the truth', () => {
  it('reach: the answer is the next frame\'s reach, and every option is a number', () => {
    let asked = 0
    let sawStay = false
    let sawGrow = false
    for (const { frames } of allJumpRuns()) {
      frames.forEach((frame, k) => {
        const p = frame.predict
        if (p?.tag !== 'reach') return
        asked++
        const next = frames[k + 1]
        expect(frame.at).toBe('check')
        expect(next.at).toBe('extend')
        expect(p.answer).toBe(String(next.vars.reach))
        expect(p.options).toHaveLength(3)
        expect(new Set(p.options).size).toBe(3)
        expect(p.options!.every((o) => /^\d+$/.test(o))).toBe(true)
        if (next.vars.reach === frame.vars.reach) sawStay = true
        else sawGrow = true
      })
    }
    expect(asked).toBeGreaterThan(100)
    expect(sawStay && sawGrow).toBe(true)
  })

  it('stuck-or-not: "stuck" is the answer exactly when the next frame is stuck', () => {
    let asked = 0
    const answers = new Set<unknown>()
    for (const { frames } of allJumpRuns()) {
      frames.forEach((frame, k) => {
        const p = frame.predict
        if (p?.tag !== 'stuck-or-not') return
        asked++
        answers.add(p.answer)
        const next = frames[k + 1]
        expect(frame.at).toBe('extend')
        expect(p.answer === 'No, we are stuck').toBe(next.at === 'stuck')
        expect(next.at === 'stuck' || next.at === 'check').toBe(true)
        expect(next.vars.i).toBe((frame.vars.i as number) + 1)
      })
    }
    expect(asked).toBeGreaterThan(100)
    expect(answers.size).toBe(2)
  })

  it('the default preset asks both kinds of predict', () => {
    const tags = new Set(jumpGame.run(jDefault).frames.flatMap((f) => (f.predict ? [f.predict.tag] : [])))
    expect(tags).toEqual(new Set(['reach', 'stuck-or-not']))
  })
})

describe('greedy/jump-game: input', () => {
  it('parses LeetCode-style brackets and rejects negative jumps kindly', () => {
    expect(jInput.parse({ nums: '[2, 3, 1, 1, 4]' })).toEqual({ ok: true, value: { nums: [2, 3, 1, 1, 4] } })
    const negative = jInput.parse({ nums: '2, -1, 3' })
    expect(negative.ok).toBe(false)
    if (!negative.ok) expect(negative.error).toMatch(/0 or more/)
  })

  it('handles a single cell: you are already at the end', () => {
    const { result, frames } = jumpGame.run({ nums: [0] })
    expect(result).toBe(true)
    expect(frames.map((f) => f.at)).toEqual(['init', 'check', 'extend', 'done'])
  })
})

// ===========================================================================
// greedy/interval-scheduling
// ===========================================================================

const sInput = scheduling.input
const sDefault = sInput.presets[0].value as IntervalSchedulingInput

function allScheduleRuns(): Array<{ input: IntervalSchedulingInput; frames: Frame[]; result: number }> {
  const inputs: IntervalSchedulingInput[] = [...sInput.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => sInput.random(i + 1))]
  return inputs.map((value) => ({ input: value, ...scheduling.run(value) }))
}

/** "3–5" back to [3, 5]. */
function toInterval(cell: ArrayScene['cells'][number]): [number, number] {
  const [a, b] = String(cell).split('–').map(Number)
  return [a, b]
}

describe('greedy/interval-scheduling: default preset', () => {
  const { frames, result } = scheduling.run(sDefault)

  it('is LeetCode 435 example 1 and removes 1 interval', () => {
    expect(sDefault).toEqual({ intervals: [[1, 2], [2, 3], [3, 4], [1, 3]] })
    expect(result).toBe(1)
  })

  it('shows the intervals as given, then sorted by end, then sweeps all four', () => {
    expect(frames.map((f) => f.at)).toEqual(['sort', 'sort', 'init', 'check', 'keep', 'check', 'keep', 'check', 'drop', 'check', 'keep', 'done'])
    expect(arrayScene(frames[0]).cells).toEqual(['1–2', '2–3', '3–4', '1–3'])
    expect(arrayScene(frames[1]).cells).toEqual(['1–2', '2–3', '1–3', '3–4'])
  })

  it('keeps touching intervals (2–3 after 1–2) and drops 1–3, which overlaps', () => {
    const done = frames[frames.length - 1]
    expect(roles(done, 'found')).toEqual([0, 1, 3])
    expect(roles(done, 'discarded')).toEqual([2])
    expect(done.vars.removed).toBe(1)
    expect(frames.find((f) => f.at === 'keep' && f.vars.last_end === 3)!.say).toMatch(/exactly when the last kept one ends/)
  })

  it('annotates the last end after each keep', () => {
    const keeps = frames.filter((f) => f.at === 'keep')
    expect(keeps.map((f) => arrayScene(f).annotations![0].text)).toEqual(['last end = 2', 'last end = 3', 'last end = 4'])
  })

  it('"A long meeting in the way" drops the early-starting 0–10 and keeps the three short ones', () => {
    const { result: r, frames: f } = scheduling.run(sInput.presets[1].value as IntervalSchedulingInput)
    expect(r).toBe(1)
    expect(arrayScene(f[1]).cells).toEqual(['1–3', '4–6', '7–9', '0–10'])
    expect(roles(f[f.length - 1], 'discarded')).toEqual([3])
  })

  it('"All the same slot" keeps one and removes the other two', () => {
    const { result: r } = scheduling.run(sInput.presets[2].value as IntervalSchedulingInput)
    expect(r).toBe(2)
  })
})

describe('greedy/interval-scheduling: the algorithm is really greedy-by-end', () => {
  it('the sorted frame has cells in end order, and every later frame keeps that order', () => {
    for (const { frames } of allScheduleRuns()) {
      const sortedFrame = frames.filter((f) => f.at === 'sort').pop()!
      const ends = arrayScene(sortedFrame).cells.map((c) => toInterval(c)[1])
      expect(ends).toEqual([...ends].sort((a, b) => a - b))
      for (const frame of frames.slice(frames.indexOf(sortedFrame))) {
        expect(arrayScene(frame).cells).toEqual(arrayScene(sortedFrame).cells)
      }
    }
  })

  it('kept intervals never overlap, kept + removed = n, and last_end is the end of the latest kept interval', () => {
    for (const { frames, input, result } of allScheduleRuns()) {
      const done = frames[frames.length - 1]
      const scene = arrayScene(done)
      const kept = roles(done, 'found').map((k) => toInterval(scene.cells[k]))
      for (let a = 1; a < kept.length; a++) expect(kept[a][0]).toBeGreaterThanOrEqual(kept[a - 1][1])
      expect(kept.length + result).toBe(input.intervals.length)
      expect(roles(done, 'discarded')).toHaveLength(result)
      expect(done.vars.last_end).toBe(kept[kept.length - 1][1])
    }
  })

  it('every interval gets exactly one check and one verdict, in order', () => {
    for (const { frames, input } of allScheduleRuns()) {
      const n = input.intervals.length
      expect(count(frames, 'check')).toBe(n)
      expect(count(frames, 'keep') + count(frames, 'drop')).toBe(n)
      frames.forEach((frame, k) => {
        if (frame.at !== 'check') return
        expect(['keep', 'drop']).toContain(frames[k + 1].at)
        expect(arrayScene(frame).pointers).toEqual([{ name: 'i', index: frame.vars.i, role: 'focus' }])
        expect(roles(frame, 'compare')).toEqual([frame.vars.i])
      })
    }
  })

  it('the first interval is always kept', () => {
    for (const { frames } of allScheduleRuns()) {
      const first = frames.find((f) => f.at === 'check')!
      expect(frames[frames.indexOf(first) + 1].at).toBe('keep')
      expect(first.vars.last_end).toBe('−∞')
    }
  })
})

describe('greedy/interval-scheduling: predicts tell the truth', () => {
  it('keep-or-drop: the answer matches whether the next frame keeps or drops', () => {
    let asked = 0
    const answers = new Set<unknown>()
    for (const { frames } of allScheduleRuns()) {
      frames.forEach((frame, k) => {
        const p = frame.predict
        if (!p) return
        expect(p.tag).toBe('keep-or-drop')
        asked++
        answers.add(p.answer)
        const next = frames[k + 1]
        expect(frame.at).toBe('check')
        expect(p.answer === 'Keep it').toBe(next.at === 'keep')
        expect(p.answer === 'Drop it').toBe(next.at === 'drop')
        expect(p.prompt).toContain(`ends at ${frame.vars.last_end}`)
      })
    }
    expect(asked).toBeGreaterThan(100)
    expect(answers.size).toBe(2)
  })

  it('the default preset asks for the two decisions after the free first keep', () => {
    const { frames } = scheduling.run(sDefault)
    expect(frames.filter((f) => f.predict)).toHaveLength(3)
  })
})

describe('greedy/interval-scheduling: input', () => {
  it('accepts "1-3, 2-4, 3-5", en dashes and LeetCode brackets', () => {
    const expected = { ok: true, value: { intervals: [[1, 3], [2, 4], [3, 5]] } }
    expect(sInput.parse({ intervals: '1-3, 2-4, 3-5' })).toEqual(expected)
    expect(sInput.parse({ intervals: '1–3; 2–4; 3–5' })).toEqual(expected)
    expect(sInput.parse({ intervals: '[[1,3],[2,4],[3,5]]' })).toEqual(expected)
  })

  it('rejects intervals that go backwards, have no length, or are out of range', () => {
    for (const bad of ['5-3', '3-3', '1-100', '-1-3', '1-3, 4', '1-3,, x-y', '[[1,2],[3]]']) {
      const result = sInput.parse({ intervals: bad })
      expect(result.ok, `"${bad}" should be rejected`).toBe(false)
      if (!result.ok) expect(result.field).toBe('intervals')
    }
    const nine = sInput.parse({ intervals: Array.from({ length: 9 }, (_, k) => `${k}-${k + 1}`).join(', ') })
    expect(nine.ok).toBe(false)
  })

  it('handles one interval and already-sorted input with a single sort frame', () => {
    const one = scheduling.run({ intervals: [[4, 9]] })
    expect(one.result).toBe(0)
    expect(one.frames.map((f) => f.at)).toEqual(['sort', 'init', 'check', 'keep', 'done'])
  })
})

// ===========================================================================
// content/topics/greedy.json
// ===========================================================================

describe('content/topics/greedy.json', () => {
  const lesson = JSON.parse(
    fs.readFileSync(fileURLToPath(new URL('../../content/topics/greedy.json', import.meta.url)), 'utf8'),
  ) as LessonV2
  const byId = new Map<string, AnyTracer>([
    [jumpGame.id, jumpGame],
    [scheduling.id, scheduling],
  ])

  it('is a valid v2 lesson', () => {
    expect(lessonV2Schema.safeParse(lesson).success).toBe(true)
    expect(lesson.slug).toBe('greedy')
  })

  it('has two tracks, each asking predict tags its guided run really emits', () => {
    expect(lesson.stage.tracks.map((t) => t.tracer)).toEqual(['greedy/interval-scheduling', 'greedy/jump-game'])
    for (const track of lesson.stage.tracks) {
      const tracer = byId.get(track.tracer)!
      const { frames } = tracer.run(tracer.input.presets[track.preset ?? 0].value)
      const emitted = new Set(frames.slice(0, -1).map((f) => f.predict?.tag).filter(Boolean))
      for (const tag of track.predict?.tags ?? []) expect(emitted, `${track.id}: tag ${tag}`).toContain(tag)
    }
  })

  it('ties the template to the interval tracer anchors and replays both tracers in examples', () => {
    expect(lesson.template.tracer).toBe('greedy/interval-scheduling')
    const anchors = Object.keys(scheduling.anchors)
    for (const line of lesson.template.pseudocode) if (line.anchor) expect(anchors).toContain(line.anchor)
    expect(lesson.examples.map((e) => e.tracer)).toEqual(['greedy/jump-game', 'greedy/interval-scheduling', undefined])
  })

  it('shape callouts resolve to cells and pointers in the shape scene', () => {
    const scene = lesson.shape.scene
    expect(scene.kind).toBe('array')
    if (scene.kind !== 'array') return
    for (const { target, text } of lesson.shape.callouts) {
      expect(text.split(/\s+/).length).toBeLessThanOrEqual(6)
      const [kind, id] = target.split(':')
      if (kind === 'cell') expect(Number(id)).toBeLessThan(scene.cells.length)
      else if (kind === 'ptr') expect(scene.pointers?.map((p) => p.name)).toContain(id)
      else throw new Error(`unexpected callout target ${target}`)
    }
  })

  it('example 435 matches the default interval preset, and example 55 matches the default jump preset', () => {
    expect(lesson.examples[1].input).toBe('intervals = [[1,2],[2,3],[3,4],[1,3]]')
    expect(lesson.examples[1].output).toBe(String(scheduling.run(sDefault).result))
    expect(lesson.examples[0].input).toBe('nums = [3,2,1,0,4]')
    expect(lesson.examples[0].output).toBe(String(jumpGame.run(jDefault).result))
  })

  it('shows the coin-change counterexample honestly: greedy gives 3 coins where 2 is possible', () => {
    // Boring checks of the numbers quoted in the lesson (coins [1, 3, 4], amount 6).
    const coins = [1, 3, 4]
    const amount = 6
    let left = amount
    let greedy = 0
    for (const coin of [...coins].sort((a, b) => b - a)) {
      while (left >= coin) {
        left -= coin
        greedy++
      }
    }
    const best: number[] = [0]
    for (let a = 1; a <= amount; a++) best[a] = Math.min(...coins.filter((c) => c <= a).map((c) => best[a - c] + 1))
    expect([greedy, best[amount]]).toEqual([3, 2])
    expect(JSON.stringify(lesson)).toMatch(/4 \+ 1 \+ 1 = 3 coins/)
  })
})
