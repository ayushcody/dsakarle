/**
 * Extra checks for the stacks tracers (push-pop, valid-parentheses,
 * next-greater). The generic contract suite (frames, anchors, code parity,
 * parse, correctness...) runs from registry.test.ts and only deep-checks array
 * scenes, so this file adds:
 *   - stack scene sanity for every frame of every run (including inside composites)
 *   - predict answers that are true (checked against what the next frame shows)
 *   - the teaching beats of each default preset
 *   - input rules specific to each tracer
 *   - the lesson file wiring
 */
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { lessonV2Schema } from '@/lib/content-schema'
import type { LessonV2 } from '@/types/learning'
import pushPop from '@/lib/tracers/stacks/push-pop'
import type { PushPopInput } from '@/lib/tracers/stacks/push-pop'
import validParens from '@/lib/tracers/stacks/valid-parentheses'
import type { ValidParenthesesInput } from '@/lib/tracers/stacks/valid-parentheses'
import nextGreater from '@/lib/tracers/stacks/next-greater'
import type { NextGreaterInput } from '@/lib/tracers/stacks/next-greater'
import largestRect from '@/lib/tracers/stacks/largest-rectangle'
import type { LargestRectangleInput } from '@/lib/tracers/stacks/largest-rectangle'
import type { AnyTracer, ArrayScene, Frame, Scene, StackScene } from '@/lib/engine/types'

const tracers: AnyTracer[] = [pushPop, validParens, nextGreater, largestRect]

/** Every stack scene inside a scene (composites included). */
function stacksIn(scene: Scene): StackScene[] {
  if (scene.kind === 'stack') return [scene]
  if (scene.kind === 'composite') return scene.parts.flatMap((p) => stacksIn(p.scene))
  return []
}

function stackOf(frame: Frame): StackScene {
  const stacks = stacksIn(frame.scene)
  expect(stacks, 'exactly one stack per frame').toHaveLength(1)
  return stacks[0]
}

function checkStack(scene: StackScene, where: string): void {
  const n = scene.items.length
  for (const m of scene.marks ?? []) {
    expect(Number.isInteger(m.index) && m.index >= 0 && m.index < n, `${where}: mark index ${m.index} (${m.role}) outside 0..${n - 1}`).toBe(true)
  }
  for (const a of scene.annotations ?? []) {
    expect(a.target, `${where}: annotation target`).toMatch(/^(top|incoming|item:\d+)$/)
    const m = /^item:(\d+)$/.exec(a.target)
    if (m) expect(Number(m[1]) < n, `${where}: annotation item in range`).toBe(true)
    if (a.target === 'top') expect(n, `${where}: a "top" note needs an item`).toBeGreaterThan(0)
    if (a.target === 'incoming') expect(scene.incoming, `${where}: an "incoming" note needs an incoming item`).toBeTruthy()
  }
  if (scene.incoming) expect(['push', 'pop']).toContain(scene.incoming.direction)
}

/** Presets plus random seeds. */
function allRuns<I>(tracer: AnyTracer): Array<{ input: I; frames: Frame[] }> {
  const inputs: I[] = [...tracer.input.presets.map((p) => p.value as I), ...Array.from({ length: 200 }, (_, i) => tracer.input.random(i + 1) as I)]
  return inputs.map((input) => ({ input, frames: tracer.run(input).frames }))
}

describe('stack scenes', () => {
  it.each(tracers.map((t) => [t.id, t] as const))('%s: marks, notes and incoming stay valid on every frame', (_id, tracer) => {
    for (const { frames } of allRuns(tracer)) {
      frames.forEach((frame, i) => checkStack(stackOf(frame), `frame ${i}`))
    }
  })
})

// ===========================================================================
// stacks/push-pop
// ===========================================================================

describe('stacks/push-pop: default preset', () => {
  const input = pushPop.input.presets[0].value as PushPopInput
  const { frames, result } = pushPop.run(input)

  it('is push 3, push 7, pop, peek, push 1, then three pops, the last on an empty stack', () => {
    expect(pushPop.input.format(input).ops).toBe('push 3, push 7, pop, peek, push 1, pop, pop, pop')
    expect(result).toEqual([7, 3, 1, 3, null])
  })

  it('shows every rule once or more, with the underflow on the last pop', () => {
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect(frames).toHaveLength(13)
    expect([count('init'), count('push'), count('pop'), count('peek'), count('underflow'), count('done')]).toEqual([1, 6, 3, 1, 1, 1])
    expect(frames[frames.length - 2].at).toBe('underflow')
    expect(stackOf(frames[frames.length - 2]).items).toEqual([])
  })

  it('a push is two frames: the slab waits beside the stack, then lands on top', () => {
    const waiting = frames[3]
    const landed = frames[4]
    expect(stackOf(waiting).items).toEqual([3])
    expect(stackOf(waiting).incoming).toEqual({ value: 7, direction: 'push' })
    expect(stackOf(landed).items).toEqual([3, 7])
    expect(stackOf(landed).incoming ?? null).toBeNull()
    expect(stackOf(landed).marks).toEqual([{ index: 1, role: 'changed' }])
  })

  it('a pop shows the item that left beside the stack; peek leaves the stack alone', () => {
    const pop = frames[5]
    expect(stackOf(pop).items).toEqual([3])
    expect(stackOf(pop).incoming).toEqual({ value: 7, direction: 'pop' })
    const peek = frames[6]
    expect(stackOf(peek).items).toEqual([3])
    expect(stackOf(peek).incoming ?? null).toBeNull()
    expect(stackOf(peek).marks).toEqual([{ index: 0, role: 'compare' }])
  })
})

describe('stacks/push-pop: the other presets and the stack itself', () => {
  it('"Last in, first out" pops 4, 3, 2, 1: the reverse of the pushes', () => {
    const { result } = pushPop.run(pushPop.input.presets[1].value)
    expect(result).toEqual([4, 3, 2, 1])
  })

  it('"Pop from nothing" underflows on the first pop and recovers', () => {
    const { frames, result } = pushPop.run(pushPop.input.presets[2].value)
    expect(result).toEqual([null, 5, 5])
    expect(frames.filter((f) => f.at === 'underflow')).toHaveLength(1)
  })

  it('stack contents follow the operations on every run; underflow changes nothing', () => {
    for (const { input, frames } of allRuns<PushPopInput>(pushPop)) {
      const model: number[] = []
      let frame = 1
      for (const op of input.ops) {
        if (op.op === 'push') {
          expect(stackOf(frames[frame]).items).toEqual(model) // waiting beside the stack
          model.push(op.value)
          expect(stackOf(frames[frame + 1]).items).toEqual(model) // landed
          frame += 2
        } else if (model.length === 0) {
          expect(frames[frame].at).toBe('underflow')
          expect(stackOf(frames[frame]).items).toEqual([])
          frame += 1
        } else if (op.op === 'pop') {
          const top = model.pop() as number
          expect(frames[frame].at).toBe('pop')
          expect(stackOf(frames[frame]).items).toEqual(model)
          expect(stackOf(frames[frame]).incoming).toEqual({ value: top, direction: 'pop' })
          frame += 1
        } else {
          expect(frames[frame].at).toBe('peek')
          expect(stackOf(frames[frame]).items).toEqual(model)
          frame += 1
        }
      }
      expect(frames[frame].at).toBe('done')
      expect(frames).toHaveLength(frame + 1)
    }
  })

  it('rejects unknown operations, missing and out-of-range values, and numbers after pop or peek', () => {
    const parse = (ops: string) => pushPop.input.parse({ ops })
    expect(parse('push 3, pop')).toEqual({ ok: true, value: { ops: [{ op: 'push', value: 3 }, { op: 'pop' }] } })
    expect(parse('PUSH -4 ; Peek\npop')).toMatchObject({ ok: true })
    expect(parse('top')).toEqual({ ok: true, value: { ops: [{ op: 'peek' }] } })
    expect(parse('push')).toMatchObject({ ok: false, field: 'ops', error: expect.stringMatching(/push needs one number/) })
    expect(parse('push 100')).toMatchObject({ ok: false, error: expect.stringMatching(/-99 to 99/) })
    expect(parse('push 1.5')).toMatchObject({ ok: false })
    expect(parse('pop 3')).toMatchObject({ ok: false, error: expect.stringMatching(/pop takes no number/) })
    expect(parse('jump')).toMatchObject({ ok: false, error: expect.stringMatching(/isn't an operation/) })
    expect(parse(Array.from({ length: 9 }, () => 'pop').join(', '))).toMatchObject({ ok: false, error: expect.stringMatching(/at most 8/) })
  })
})

describe('stacks/push-pop: predicts', () => {
  const asked = (tag: string): Array<{ frame: Frame; next: Frame }> => {
    const out: Array<{ frame: Frame; next: Frame }> = []
    for (const { frames } of allRuns<PushPopInput>(pushPop)) {
      frames.forEach((frame, i) => {
        if (frame.predict?.tag === tag) out.push({ frame, next: frames[i + 1] })
      })
    }
    return out
  }

  it('what-pops: the answer is the value the next frame shows leaving the stack, and it is the top', () => {
    const cases = asked('what-pops')
    expect(cases.length).toBeGreaterThan(50)
    for (const { frame, next } of cases) {
      expect(next.at).toBe('pop')
      expect(frame.predict!.answer).toBe(String((next.scene as StackScene).incoming!.value))
      const before = stackOf(frame).items
      expect(frame.predict!.answer).toBe(String(before[before.length - 1]))
      expect(new Set(frame.predict!.options).size, 'options are distinct').toBe(frame.predict!.options!.length)
    }
  })

  it('what-pops is only asked when the stack holds two different values', () => {
    for (const { frame } of asked('what-pops')) expect(new Set(stackOf(frame).items).size).toBeGreaterThanOrEqual(2)
  })

  it('pop-empty: the next frame is an underflow on an empty stack', () => {
    const cases = asked('pop-empty')
    expect(cases.length).toBeGreaterThan(5)
    for (const { frame, next } of cases) {
      expect(stackOf(frame).items).toEqual([])
      expect(next.at).toBe('underflow')
      expect(frame.predict!.answer).toBe('It reports an underflow')
    }
  })

  it('peek-removes: the next frame is a peek and the stack is unchanged', () => {
    const cases = asked('peek-removes')
    expect(cases.length).toBeGreaterThan(5)
    for (const { frame, next } of cases) {
      expect(next.at).toBe('peek')
      expect(stackOf(next).items).toEqual(stackOf(frame).items)
      expect(frame.predict!.answer).toBe('No, it stays')
    }
  })

  it('options flip around so the right answer is not always in the same slot', () => {
    const positions = new Set<number>()
    for (const { frame } of [...asked('what-pops'), ...asked('pop-empty'), ...asked('peek-removes')]) {
      positions.add(frame.predict!.options!.indexOf(frame.predict!.answer as string))
    }
    expect(positions.size).toBeGreaterThanOrEqual(2)
  })
})

// ===========================================================================
// stacks/valid-parentheses
// ===========================================================================

function parenParts(frame: Frame): { array: ArrayScene; stack: StackScene } {
  if (frame.scene.kind !== 'composite') throw new Error('expected a composite scene')
  expect(frame.scene.layout).toBe('column')
  expect(frame.scene.parts).toHaveLength(2)
  const [a, b] = frame.scene.parts.map((p) => p.scene)
  if (a.kind !== 'array' || b.kind !== 'stack') throw new Error('expected an array over a stack')
  return { array: a, stack: b }
}

describe('stacks/valid-parentheses: default preset', () => {
  const input = validParens.input.presets[0].value as ValidParenthesesInput
  const { frames, result } = validParens.run(input)

  it('is {[()]}() : nested and matched, so valid', () => {
    expect(input.s).toBe('{[()]}()')
    expect(result).toBe(true)
  })

  it('walks init, 4 pushes, 4 checks, 4 pops, done, and the stack peaks at 3 openers', () => {
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect(frames).toHaveLength(14)
    expect([count('init'), count('push'), count('check'), count('pop'), count('done')]).toEqual([1, 4, 4, 4, 1])
    expect(Math.max(...frames.map((f) => parenParts(f).stack.items.length))).toBe(3)
    expect(parenParts(frames[3]).stack.items).toEqual(['{', '[', '('])
  })

  it('a check frame compares the closer with the top; a pop frame shows the opener that left', () => {
    const check = parenParts(frames[4])
    expect(check.array.marks).toEqual(expect.arrayContaining([{ index: 3, role: 'compare' }, { index: 2, role: 'compare' }]))
    expect(check.stack.marks).toEqual([{ index: 2, role: 'compare' }])
    const pop = parenParts(frames[5])
    expect(pop.stack.items).toEqual(['{', '['])
    expect(pop.stack.incoming).toEqual({ value: '(', direction: 'pop' })
    expect(pop.array.marks).toEqual(expect.arrayContaining([{ index: 3, role: 'found' }, { index: 2, role: 'found' }]))
  })

  it('ends with every cell found and an empty stack', () => {
    const last = parenParts(frames[frames.length - 1])
    expect(last.stack.items).toEqual([])
    expect(last.array.marks).toHaveLength(8)
    expect(last.array.marks!.every((m) => m.role === 'found')).toBe(true)
  })
})

describe('stacks/valid-parentheses: how it fails', () => {
  it('"([)]" stops on a mismatch at the check rule, with the closer and the top marked as errors', () => {
    const { frames, result } = validParens.run({ s: '([)]' })
    expect(result).toBe(false)
    const last = frames[frames.length - 1]
    expect(last.at).toBe('check')
    expect(last.say).toMatch(/\[ is on top, but \) needs \(/)
    const { array, stack } = parenParts(last)
    expect(array.marks).toEqual(expect.arrayContaining([{ index: 2, role: 'error' }, { index: 1, role: 'error' }]))
    expect(stack.marks).toEqual([{ index: 1, role: 'error' }])
    expect(frames.every((f) => f.at !== 'done')).toBe(true)
  })

  it('"(()" ends with one opener left over: done, answer false, leftovers marked as errors', () => {
    const { frames, result } = validParens.run({ s: '(()' })
    expect(result).toBe(false)
    const last = frames[frames.length - 1]
    expect(last.at).toBe('done')
    expect(last.say).toMatch(/never closed/)
    const { array, stack } = parenParts(last)
    expect(stack.items).toEqual(['('])
    expect(array.marks).toEqual(expect.arrayContaining([{ index: 0, role: 'error' }]))
  })

  it('a closer on an empty stack is its own failure, with nothing to compare', () => {
    const { frames, result } = validParens.run({ s: '())' })
    expect(result).toBe(false)
    const last = frames[frames.length - 1]
    expect(last.at).toBe('check')
    expect(last.say).toMatch(/stack is empty/)
    expect(last.predict).toBeUndefined()
  })

  it('the stack always holds exactly the openers read so far that are still unmatched', () => {
    for (const { input, frames } of allRuns<ValidParenthesesInput>(validParens)) {
      for (const frame of frames) {
        const { array, stack } = parenParts(frame)
        const i = array.pointers?.[0]?.index ?? -1
        // Independent model: process s[0..i] with a plain array. A pop frame is already past its closer.
        const model: string[] = []
        const upto = frame.at === 'check' && !/needs|empty/.test(frame.say) ? i - 1 : i
        let ok = true
        for (let k = 0; k <= upto; k++) {
          const ch = input.s[k]
          if ('([{'.includes(ch)) model.push(ch)
          else if (model.length && model[model.length - 1] === { ')': '(', ']': '[', '}': '{' }[ch]) model.pop()
          else ok = false
        }
        if (ok && frame.at !== 'init' && frame.at !== 'done') expect(stack.items, `s=${input.s} at i=${i} (${frame.at})`).toEqual(model)
        expect(stack.items.every((c) => '([{'.includes(c as string))).toBe(true)
      }
    }
  })
})

describe('stacks/valid-parentheses: predicts', () => {
  const asked = (tag: string): Array<{ frame: Frame; next: Frame; s: string }> => {
    const out: Array<{ frame: Frame; next: Frame; s: string }> = []
    for (const { input, frames } of allRuns<ValidParenthesesInput>(validParens)) {
      frames.forEach((frame, i) => {
        if (frame.predict?.tag === tag) out.push({ frame, next: frames[i + 1], s: input.s })
      })
    }
    return out
  }

  it('push-or-pop: openers are pushed, closers go to a check', () => {
    const cases = asked('push-or-pop')
    expect(cases.length).toBeGreaterThan(200)
    for (const { frame, next } of cases) {
      const opener = frame.predict!.answer === 'Push'
      expect(next.at, frame.predict!.prompt).toBe(opener ? 'push' : 'check')
    }
  })

  it('match: yes means the next frame pops the pair, no means the run fails right there', () => {
    const cases = asked('match')
    expect(cases.length).toBeGreaterThan(100)
    for (const { frame, next } of cases) {
      if (frame.predict!.answer === 'Yes') {
        expect(next.at).toBe('pop')
      } else {
        expect(next.at).toBe('check')
        expect(next.say).toMatch(/don't match/)
      }
    }
    expect(cases.some((c) => c.frame.predict!.answer === 'No')).toBe(true)
  })

  it('options flip around so the right answer is not always first', () => {
    const positions = new Set(asked('push-or-pop').map(({ frame }) => frame.predict!.options!.indexOf(frame.predict!.answer as string)))
    expect(positions).toEqual(new Set([0, 1]))
  })
})

describe('stacks/valid-parentheses: input rules', () => {
  const parse = (s: string) => validParens.input.parse({ s })
  it('accepts brackets (ignoring spaces and quotes) and rejects anything else kindly', () => {
    expect(parse('"()[]{}"')).toEqual({ ok: true, value: { s: '()[]{}' } })
    expect(parse(' ( [ ] ) ')).toEqual({ ok: true, value: { s: '([])' } })
    expect(parse('(a)')).toMatchObject({ ok: false, field: 's', error: expect.stringMatching(/"a" isn't a bracket/) })
    expect(parse('<>')).toMatchObject({ ok: false })
    expect(parse('(((((((((((((')).toMatchObject({ ok: false, error: expect.stringMatching(/at most 12/) })
    expect(parse('')).toMatchObject({ ok: false })
  })

  it('random inputs cover valid, crossed, leftover and empty-stack cases', () => {
    const outcomes = new Set<string>()
    for (let seed = 1; seed <= 200; seed++) {
      const frames = validParens.run(validParens.input.random(seed)).frames
      const last = frames[frames.length - 1]
      outcomes.add(last.at === 'done' ? (last.say.includes('true') ? 'valid' : 'leftover') : last.say.includes('empty') ? 'empty-stack' : 'mismatch')
    }
    expect(outcomes).toEqual(new Set(['valid', 'leftover', 'empty-stack', 'mismatch']))
  })
})

// ===========================================================================
// stacks/next-greater
// ===========================================================================

function ngParts(frame: Frame): { temps: ArrayScene; answer: ArrayScene; stack: StackScene } {
  if (frame.scene.kind !== 'composite') throw new Error('expected a composite scene')
  expect(frame.scene.layout).toBe('column')
  expect(frame.scene.parts).toHaveLength(3)
  const [a, b, c] = frame.scene.parts.map((p) => p.scene)
  if (a.kind !== 'array' || b.kind !== 'array' || c.kind !== 'stack') throw new Error('expected temps, answer, stack')
  return { temps: a, answer: b, stack: c }
}

/** "day 3 · 71" → { day: 3, temp: 71 } */
function parseItem(item: number | string): { day: number; temp: number } {
  const m = /^day (\d+) · (-?\d+)$/.exec(String(item))
  if (!m) throw new Error(`unexpected stack item "${item}"`)
  return { day: Number(m[1]), temp: Number(m[2]) }
}

describe('stacks/next-greater: default preset', () => {
  const input = nextGreater.input.presets[0].value as NextGreaterInput
  const { frames, result } = nextGreater.run(input)

  it('is the LeetCode 739 example', () => {
    expect(input.temps).toEqual([73, 74, 75, 71, 69, 72, 76, 73])
    expect(result).toEqual([1, 1, 4, 2, 1, 1, 0, 0])
  })

  it('walks init, 8 pushes, 11 compares, 6 pops, done', () => {
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect(frames).toHaveLength(26)
    expect([count('init'), count('push'), count('compare'), count('pop'), count('done')]).toEqual([1, 8, 10, 6, 1])
  })

  it('a pop frame writes answer[j] = i - j, marks the answer slot changed, and discards the day', () => {
    const pop = frames.find((f) => f.at === 'pop')!
    expect(pop.say).toMatch(/74 beats 73: day 0 waited 1 day, so answer\[0\] = 1/)
    const { temps, answer, stack } = ngParts(pop)
    expect(answer.cells).toEqual([1, 0, 0, 0, 0, 0, 0, 0])
    expect(answer.marks).toEqual([{ index: 0, role: 'changed' }])
    expect(temps.marks).toEqual(expect.arrayContaining([{ index: 0, role: 'discarded' }, { index: 1, role: 'focus' }]))
    expect(stack.items).toEqual([])
    expect(stack.incoming).toEqual({ value: 'day 0 · 73', direction: 'pop' })
  })

  it('the last frame says which days never found a warmer day', () => {
    const last = frames[frames.length - 1]
    expect(last.at).toBe('done')
    expect(last.say).toMatch(/2 days never see a warmer day/)
    expect(ngParts(last).stack.items).toEqual(['day 6 · 76', 'day 7 · 73'])
  })
})

describe('stacks/next-greater: the stack stays monotonic', () => {
  it('temperatures never rise from bottom to top, and days strictly rise, on every frame', () => {
    for (const { frames } of allRuns<NextGreaterInput>(nextGreater)) {
      for (const frame of frames) {
        const items = ngParts(frame).stack.items.map(parseItem)
        for (let k = 1; k < items.length; k++) {
          expect(items[k].temp, 'temps never rise bottom → top').toBeLessThanOrEqual(items[k - 1].temp)
          expect(items[k].day, 'days rise bottom → top').toBeGreaterThan(items[k - 1].day)
        }
      }
    }
  })

  it('discarded cells are exactly the days that have an answer written, and labels match the temps', () => {
    for (const { input, frames } of allRuns<NextGreaterInput>(nextGreater)) {
      for (const frame of frames) {
        const { temps, answer, stack } = ngParts(frame)
        expect(temps.cells).toEqual(input.temps)
        const discarded = (temps.marks ?? []).filter((m) => m.role === 'discarded').map((m) => m.index)
        for (const d of discarded) expect(answer.cells[d], `answer[${d}] written for a discarded day`).toBeGreaterThan(0)
        for (const item of stack.items.map(parseItem)) {
          expect(item.temp).toBe(input.temps[item.day])
          expect(discarded, 'a day on the stack is not discarded').not.toContain(item.day)
        }
      }
    }
  })

  it('"Colder every day" never pops; "Warmer every day" pops once per day after the first', () => {
    const cold = nextGreater.run(nextGreater.input.presets[1].value)
    expect(cold.frames.filter((f) => f.at === 'pop')).toHaveLength(0)
    expect(cold.result).toEqual([0, 0, 0, 0, 0])
    const warm = nextGreater.run(nextGreater.input.presets[2].value)
    expect(warm.frames.filter((f) => f.at === 'pop')).toHaveLength(4)
    expect(warm.result).toEqual([1, 1, 1, 1, 0])
  })

  it('equal temperatures do not pop: it takes a strictly warmer day', () => {
    const { result } = nextGreater.run({ temps: [70, 70, 71] })
    expect(result).toEqual([2, 1, 0])
  })
})

describe('stacks/next-greater: predicts', () => {
  it('pop-or-stay: Pop exactly when the next frame is a pop, Stay when it is the push', () => {
    let pops = 0
    let stays = 0
    for (const { frames } of allRuns<NextGreaterInput>(nextGreater)) {
      frames.forEach((frame, i) => {
        if (!frame.predict) return
        expect(frame.predict.tag).toBe('pop-or-stay')
        expect(frame.at).toBe('compare')
        const next = frames[i + 1]
        if (frame.predict.answer === 'Pop') {
          pops++
          expect(next.at).toBe('pop')
        } else {
          stays++
          expect(next.at).toBe('push')
          expect(next.say).toMatch(/keeps waiting/)
        }
      })
    }
    expect(pops).toBeGreaterThan(100)
    expect(stays).toBeGreaterThan(100)
  })

  it('options flip around so the right answer is not always first', () => {
    const positions = new Set<number>()
    for (const { frames } of allRuns<NextGreaterInput>(nextGreater)) {
      for (const f of frames) if (f.predict) positions.add(f.predict.options!.indexOf(f.predict.answer as string))
    }
    expect(positions).toEqual(new Set([0, 1]))
  })
})

// ---------------------------------------------------------------------------
// The lesson file wires up to these tracers
// ---------------------------------------------------------------------------

describe('content/topics/stacks.json', () => {
  const lesson = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../../content/topics/stacks.json', import.meta.url)), 'utf8')) as LessonV2
  const byId = new Map(tracers.map((t) => [t.id as string, t]))

  it('is a valid v2 lesson for the stacks slug', () => {
    expect(lessonV2Schema.safeParse(lesson).success).toBe(true)
    expect(lesson.slug).toBe('stacks')
  })

  it('has a track per tracer, each asking predict tags its guided run really emits', () => {
    expect(lesson.stage.tracks.map((t) => t.tracer)).toEqual(['stacks/push-pop', 'stacks/valid-parentheses', 'stacks/next-greater', 'stacks/largest-rectangle'])
    for (const track of lesson.stage.tracks) {
      const tracer = byId.get(track.tracer)!
      const preset = tracer.input.presets[track.preset ?? 0]
      const emitted = tracer.run(preset.value).frames.flatMap((f) => (f.predict ? [f.predict.tag] : []))
      expect(track.predict!.max).toBeLessThanOrEqual(4)
      for (const tag of track.predict!.tags) expect(emitted, `${track.id}: tag ${tag} in the guided run`).toContain(tag)
    }
  })

  it('ties the template to valid-parentheses: every rule has a pseudocode line', () => {
    expect(lesson.template.tracer).toBe('stacks/valid-parentheses')
    const anchors = Object.keys(validParens.anchors).sort()
    const used = lesson.template.pseudocode.flatMap((l) => (l.anchor ? [l.anchor] : []))
    for (const a of used) expect(anchors).toContain(a)
    expect([...used].sort()).toEqual(anchors)
  })

  it('draws the shape as a stack of 3 with one item arriving, and its callouts resolve', () => {
    const scene = lesson.shape.scene
    expect(scene.kind).toBe('stack')
    if (scene.kind !== 'stack') return
    expect(scene.items).toHaveLength(3)
    expect(scene.incoming?.direction).toBe('push')
    expect(scene.capacity).toBeGreaterThan(scene.items.length + 1) // capacity is total slots, so there is room to push
    for (const c of lesson.shape.callouts) {
      expect(c.target).toMatch(/^(top|incoming|item:\d+)$/)
      const m = /^item:(\d+)$/.exec(c.target)
      if (m) expect(Number(m[1])).toBeLessThan(scene.items.length)
      expect(c.text.split(/\s+/).length).toBeLessThanOrEqual(6)
    }
    expect(lesson.shape.callouts.length).toBeGreaterThanOrEqual(2)
    expect(lesson.shape.callouts.length).toBeLessThanOrEqual(3)
  })

  it('glossary has 5–8 terms and covers the vocabulary of the lesson', () => {
    const terms = lesson.mentalModel.glossary.map((g) => g.term)
    expect(terms.length).toBeGreaterThanOrEqual(5)
    expect(terms.length).toBeLessThanOrEqual(8)
    for (const t of ['push', 'pop', 'LIFO', 'underflow', 'monotonic stack']) expect(terms).toContain(t)
  })

  it('replays Valid Parentheses and Daily Temperatures in the stage with their own tracers', () => {
    const replays = lesson.examples.filter((e) => e.tracer).map((e) => [e.title, e.tracer, e.code])
    expect(replays).toEqual([
      ['Valid Parentheses', 'stacks/valid-parentheses', 'stacks/valid-parentheses'],
      ['Daily Temperatures', 'stacks/next-greater', 'stacks/next-greater'],
    ])
    expect(lesson.examples.map((e) => e.code)).toContain('stacks/min-stack')
  })

  it('the Daily Temperatures example output is what the tracer returns', () => {
    const ex = lesson.examples.find((e) => e.title === 'Daily Temperatures')!
    const temps = (/\[(.*)\]/.exec(ex.input)![1].split(',').map(Number))
    expect(`[${nextGreater.run({ temps }).result.join(',')}]`).toBe(ex.output)
  })

  it('the recognition quiz is right about stacks roughly half the time, and never leaves the answer in one slot', () => {
    const quiz = lesson.recognise.quiz
    expect(quiz.length).toBeGreaterThanOrEqual(4)
    const stacksAnswers = quiz.filter((q) => q.answer === 'stacks').length
    expect(stacksAnswers / quiz.length).toBeGreaterThanOrEqual(0.3)
    expect(stacksAnswers / quiz.length).toBeLessThanOrEqual(0.6)
    expect(new Set(quiz.map((q) => q.options.indexOf(q.answer))).size).toBeGreaterThanOrEqual(3)
  })

  it('does not teach java.util.Stack and mentions ArrayDeque; "FILO" is not a quiz option', () => {
    const text = JSON.stringify(lesson)
    expect(text).toMatch(/ArrayDeque/)
    expect(text).not.toMatch(/FILO/)
    expect(lesson.conceptQuiz).toHaveLength(5)
  })

  it('practice has 6–8 problems with mixed difficulty', () => {
    expect(lesson.practice.length).toBeGreaterThanOrEqual(6)
    expect(lesson.practice.length).toBeLessThanOrEqual(8)
    expect(new Set(lesson.practice.map((p) => p.difficulty)).size).toBe(3)
  })
})

// ===========================================================================
// stacks/largest-rectangle
// ===========================================================================

function lrParts(frame: Frame): { bars: ArrayScene; stack: StackScene } {
  if (frame.scene.kind !== 'composite') throw new Error('expected a composite scene')
  const [a, b] = frame.scene.parts.map((p) => p.scene)
  if (a.kind !== 'array' || b.kind !== 'stack') throw new Error('expected heights, stack')
  return { bars: a, stack: b }
}

describe('stacks/largest-rectangle: default preset', () => {
  const input = largestRect.input.presets[0].value as LargestRectangleInput
  const { frames, result } = largestRect.run(input)

  it('is the LeetCode 84 example: area 10', () => {
    expect(input.heights).toEqual([2, 1, 5, 6, 2, 3])
    expect(result).toBe(10)
  })

  it('stays within the guided frame budget and uses every anchor', () => {
    expect(frames.length).toBeGreaterThanOrEqual(15)
    expect(frames.length).toBeLessThanOrEqual(40)
    expect(new Set(frames.map((f) => f.at))).toEqual(new Set(Object.keys(largestRect.anchors)))
  })

  it('the 5 x 2 rectangle is measured with window over bars 2..3 and marked found at the end', () => {
    const measure = frames.find((f) => f.at === 'measure' && /= 10/.test(f.say))!
    expect(lrParts(measure).bars.window).toEqual({ start: 2, end: 3 })
    const last = frames[frames.length - 1]
    expect(last.at).toBe('done')
    expect(lrParts(last).bars.window).toEqual({ start: 2, end: 3 })
    expect(lrParts(last).bars.marks).toEqual(expect.arrayContaining([{ index: 2, role: 'found' }, { index: 3, role: 'found' }]))
  })
})

describe('stacks/largest-rectangle: invariants', () => {
  it('heights never fall from bottom to top of the stack', () => {
    for (const { input, frames } of allRuns<LargestRectangleInput>(largestRect)) {
      for (const frame of frames) {
        const hs = lrParts(frame).stack.items.map((it) => {
          const m = /^bar (\d+) · (\d+)$/.exec(String(it))
          if (!m) throw new Error(`unexpected item ${it}`)
          expect(input.heights[Number(m[1])]).toBe(Number(m[2]))
          return Number(m[2])
        })
        for (let k = 1; k < hs.length; k++) expect(hs[k]).toBeGreaterThanOrEqual(hs[k - 1])
      }
    }
  })

  it('handles zeros, a single bar and equal bars', () => {
    expect(largestRect.run({ heights: [0] }).result).toBe(0)
    expect(largestRect.run({ heights: [7] }).result).toBe(7)
    expect(largestRect.run({ heights: [4, 4, 4] }).result).toBe(12)
    expect(largestRect.run({ heights: [2, 0, 2] }).result).toBe(2)
  })
})

describe('stacks/largest-rectangle: predicts', () => {
  it('push-or-pop matches the next frame, and rect-width matches the measured width', () => {
    const seen = new Set<string>()
    for (const { frames } of allRuns<LargestRectangleInput>(largestRect)) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        seen.add(p.tag)
        const next = frames[i + 1]
        if (p.tag === 'push-or-pop') {
          expect(frame.at).toBe('compare')
          expect(next.at).toBe(p.answer === 'Pop' ? 'pop' : 'push')
        } else {
          expect(p.tag).toBe('rect-width')
          expect(next.at).toBe('measure')
          expect(next.say).toContain(`Width ${p.answer} `)
          expect(new Set(p.options).size).toBe(p.options!.length)
        }
      })
    }
    expect(seen).toEqual(new Set(['push-or-pop', 'rect-width']))
  })
})

describe('stacks/largest-rectangle: input rules and lesson wiring', () => {
  it('rejects heights above 9 with a friendly message', () => {
    const r = largestRect.input.parse({ heights: '2, 10' })
    expect(r.ok).toBe(false)
  })

  it('the stacks lesson has a largest-rectangle track', () => {
    const file = fileURLToPath(new URL('../../content/topics/stacks.json', import.meta.url))
    const lesson = JSON.parse(fs.readFileSync(file, 'utf8')) as LessonV2
    const track = lesson.stage.tracks.find((t) => t.tracer === 'stacks/largest-rectangle')
    expect(track?.predict?.tags).toEqual(['push-or-pop', 'rect-width'])
  })
})
