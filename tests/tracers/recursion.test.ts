/**
 * Extra checks for the recursion tracers (factorial, subsets). The generic
 * contract suite runs from registry.test.ts; this file adds: call-tree scene
 * sanity, the teaching shape of the default runs, and that every predict
 * answer matches what the next frame actually does.
 */
import { describe, expect, it } from 'vitest'
import factorial from '@/lib/tracers/recursion/factorial'
import type { FactorialInput } from '@/lib/tracers/recursion/factorial'
import subsets from '@/lib/tracers/recursion/subsets'
import type { SubsetsInput } from '@/lib/tracers/recursion/subsets'
import type { ArrayScene, CallTreeScene, Frame, Scene } from '@/lib/engine/types'

function callTreeOf(scene: Scene): CallTreeScene {
  if (scene.kind === 'call-tree') return scene
  if (scene.kind === 'composite') {
    const part = scene.parts.map((p) => p.scene).find((s) => s.kind === 'call-tree')
    if (part && part.kind === 'call-tree') return part
  }
  throw new Error('no call tree in scene')
}

function pathOf(scene: Scene): number[] {
  if (scene.kind !== 'composite') throw new Error('expected composite')
  const arr = scene.parts.map((p) => p.scene).find((s): s is ArrayScene => s.kind === 'array')
  return arr!.cells as number[]
}

/** Structural checks shared by both tracers. */
function checkCallTree(scene: CallTreeScene, where: string): void {
  const ids = new Set<string>()
  for (const c of scene.calls) {
    expect(ids.has(c.id), `${where}: duplicate call id ${c.id}`).toBe(false)
    ids.add(c.id)
  }
  scene.calls.forEach((c, i) => {
    if (c.parent === null) expect(i, `${where}: only the first call is a root`).toBe(0)
    else {
      const parentAt = scene.calls.findIndex((p) => p.id === c.parent)
      expect(parentAt, `${where}: parent of ${c.id} is an earlier call`).toBeGreaterThanOrEqual(0)
      expect(parentAt).toBeLessThan(i)
    }
    if (c.status === 'returned') expect(c.result, `${where}: ${c.id} returned without a result`).toBeDefined()
    else expect(c.result, `${where}: ${c.id} has a result but is ${c.status}`).toBeUndefined()
  })
  for (const id of scene.stack) expect(ids.has(id), `${where}: stack id ${id} is a call`).toBe(true)
  expect(new Set(scene.stack).size, `${where}: stack ids are unique`).toBe(scene.stack.length)
  // The stack is a root-to-leaf chain of unfinished calls; only its top is active.
  scene.stack.forEach((id, k) => {
    const c = scene.calls.find((x) => x.id === id)!
    expect(c.status, `${where}: ${id} on the stack`).toBe(k === scene.stack.length - 1 ? 'active' : 'pending')
    if (k > 0) expect(c.parent, `${where}: ${id} sits on its parent`).toBe(scene.stack[k - 1])
  })
  const onStack = new Set(scene.stack)
  for (const c of scene.calls) {
    if (c.status === 'active' || c.status === 'pending') expect(onStack.has(c.id), `${where}: ${c.id} is unfinished so it is on the stack`).toBe(true)
    if (c.status === 'returned' || c.status === 'pruned') expect(onStack.has(c.id), `${where}: ${c.id} is finished so it is off the stack`).toBe(false)
  }
  for (const m of scene.marks ?? []) expect(ids.has(m.id), `${where}: mark on unknown call ${m.id}`).toBe(true)
  for (const a of scene.annotations ?? []) {
    const match = /^call:(.+)$/.exec(a.target)
    expect(match, `${where}: annotation target ${a.target}`).not.toBeNull()
    if (match) expect(ids.has(match[1])).toBe(true)
  }
}

// ===========================================================================
// recursion/factorial
// ===========================================================================

const fa = factorial.input
const faInputs = (): FactorialInput[] => [...fa.presets.map((p) => p.value as FactorialInput), ...Array.from({ length: 50 }, (_, i) => fa.random(i + 1))]

describe('recursion/factorial: default preset', () => {
  const input = fa.presets[0].value as FactorialInput
  const { frames, result } = factorial.run(input)

  it('is fact(4) = 24 with 12 frames: 4 calls, 4 checks, 1 base, 3 combines', () => {
    expect(input).toEqual({ n: 4, stop: 1 })
    expect(result).toBe(24)
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect([count('call'), count('check'), count('base'), count('combine')]).toEqual([4, 4, 1, 3])
    expect(frames).toHaveLength(12)
    expect(frames[0].at).toBe('call')
    expect(frames[frames.length - 1].at).toBe('combine')
  })

  it('grows the stack to 4, then unwinds it to empty with results 1, 2, 6, 24', () => {
    const depths = frames.map((f) => callTreeOf(f.scene).stack.length)
    expect(Math.max(...depths)).toBe(4)
    expect(depths[depths.length - 1]).toBe(0)
    const last = callTreeOf(frames[frames.length - 1].scene)
    expect(last.calls.map((c) => [c.label, c.result])).toEqual([
      ['fact(4)', '= 24'],
      ['fact(3)', '= 6'],
      ['fact(2)', '= 2'],
      ['fact(1)', '= 1'],
    ])
  })
})

describe('recursion/factorial: scenes', () => {
  it('are valid call trees: a chain of n calls, stack matches status, depth gauge matches the stack', () => {
    for (const input of faInputs()) {
      const { frames } = factorial.run(input)
      frames.forEach((frame, i) => {
        const tree = callTreeOf(frame.scene)
        checkCallTree(tree, `n=${input.n} frame ${i}`)
        expect(frame.gauge?.value).toBe(tree.stack.length)
      })
      const last = callTreeOf(frames[frames.length - 1].scene)
      expect(last.calls).toHaveLength(Math.max(1, input.n - input.stop + 1))
      expect(last.calls.every((c) => c.status === 'returned')).toBe(true)
    }
  })

  it('base and check frames agree about n <= 1', () => {
    for (const input of faInputs()) {
      for (const frame of factorial.run(input).frames) {
        if (frame.at === 'base') expect(frame.vars.n as number).toBeLessThanOrEqual(input.stop)
        if (frame.at === 'check') expect(frame.say.includes('is true')).toBe((frame.vars.n as number) <= input.stop)
      }
    }
  })
})

describe('recursion/factorial: predicts tell the truth', () => {
  it('base-case-yet: the next frame is the check, and its verdict matches the answer', () => {
    let asked = 0
    for (const input of faInputs()) {
      const { frames } = factorial.run(input)
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p || p.tag !== 'base-case-yet') return
        asked++
        const next = frames[i + 1]
        expect(frame.at).toBe('call')
        expect(next.at).toBe('check')
        const base = (next.vars.n as number) <= input.stop
        expect(p.answer).toBe(base ? 'Base case: return 1' : 'Recurse: call fact(n - 1)')
      })
    }
    expect(asked).toBeGreaterThan(20)
  })

  it('returns: the next frame is a combine and the answer is n × smaller', () => {
    let asked = 0
    for (const input of faInputs()) {
      const { frames } = factorial.run(input)
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p || p.tag !== 'returns') return
        asked++
        const next = frames[i + 1]
        expect(next.at).toBe('combine')
        expect(p.answer).toBe(String((next.vars.n as number) * (next.vars.smaller as number)))
        expect(next.vars.result).toBe(Number(p.answer))
        expect(new Set(p.options).size).toBe(p.options!.length)
        expect(p.options!.length).toBeGreaterThanOrEqual(2)
      })
    }
    expect(asked).toBeGreaterThan(20)
  })

  it('moving the base case shortens the chain: fact(5) stopping at 3 is 5 × 4 = 20 with three calls', () => {
    const { frames, result } = factorial.run({ n: 5, stop: 3 })
    expect(result).toBe(20)
    expect(callTreeOf(frames[frames.length - 1].scene).calls.map((c) => c.label)).toEqual(['fact(5)', 'fact(4)', 'fact(3)'])
  })

  it('the default preset asks "fact(2) gets 1 back" on the base frame', () => {
    const { frames } = factorial.run(fa.presets[0].value as FactorialInput)
    const base = frames.find((f) => f.at === 'base')!
    expect(base.predict?.prompt).toMatch(/fact\(1\) just gave 1 back to fact\(2\)/)
    expect(base.predict?.answer).toBe('2')
  })
})

// ===========================================================================
// recursion/subsets
// ===========================================================================

const ss = subsets.input
const ssInputs = (): SubsetsInput[] => [...ss.presets.map((p) => p.value as SubsetsInput), ...Array.from({ length: 200 }, (_, i) => ss.random(i + 1))]
const key = (s: number[]): string => s.join(',')

describe('recursion/subsets: presets', () => {
  it('LeetCode 78 preset returns all 8 subsets of [1,2,3] with 15 calls and no pruning', () => {
    const input = ss.presets[1].value as SubsetsInput
    const { frames, result } = subsets.run(input)
    expect(result.map(key).sort()).toEqual(['', '1', '1,2', '1,2,3', '1,3', '2', '2,3', '3'].sort())
    const tree = callTreeOf(frames[frames.length - 1].scene)
    expect(tree.calls).toHaveLength(15)
    expect(tree.calls.some((c) => c.status === 'pruned')).toBe(false)
    expect(frames.some((f) => f.at === 'prune')).toBe(false)
    expect(frames.filter((f) => f.at === 'found')).toHaveLength(8)
    expect(frames.filter((f) => f.at === 'choose')).toHaveLength(7)
    expect(frames.filter((f) => f.at === 'unchoose')).toHaveLength(7)
  })

  it('the default preset (size at most 2) prunes the branch that would take 3 after [1,2]', () => {
    const input = ss.presets[0].value as SubsetsInput
    expect(input).toEqual({ nums: [1, 2, 3], limit: 2 })
    const { frames, result } = subsets.run(input)
    expect(result).toEqual([[1, 2], [1, 3], [1], [2, 3], [2], [3], []])
    const prunes = frames.filter((f) => f.at === 'prune')
    expect(prunes).toHaveLength(1)
    expect(prunes[0].say).toMatch(/\[1,2\]/)
    const pruned = callTreeOf(frames[frames.length - 1].scene).calls.filter((c) => c.status === 'pruned')
    expect(pruned.map((c) => c.label)).toEqual(['i=3 [1,2,3]'])
    expect(frames.length).toBeLessThanOrEqual(45)
  })

  it('a limit of 0 prunes everything but the empty subset', () => {
    const { result, frames } = subsets.run({ nums: [5, 6], limit: 0 })
    expect(result).toEqual([[]])
    expect(frames.filter((f) => f.at === 'choose')).toHaveLength(0)
  })

  it('stays within about 120 frames at the biggest input', () => {
    const { frames } = subsets.run({ nums: [1, 2, 3, 4], limit: 4 })
    expect(frames.length).toBeLessThanOrEqual(120)
    expect(frames.filter((f) => f.at === 'found')).toHaveLength(16)
  })
})

describe('recursion/subsets: scenes', () => {
  it('are a call tree over the path array, with a consistent stack and path', () => {
    for (const input of ssInputs()) {
      const { frames } = subsets.run(input)
      frames.forEach((frame, i) => {
        const where = `${JSON.stringify(input)} frame ${i}`
        expect(frame.scene.kind).toBe('composite')
        const tree = callTreeOf(frame.scene)
        checkCallTree(tree, where)
        const path = pathOf(frame.scene)
        expect(frame.vars.path, `${where}: path var matches the array`).toEqual(path)
        expect(path.length, `${where}: path is never longer than the limit`).toBeLessThanOrEqual(Math.max(0, Math.min(input.limit, input.nums.length)))
        // The stack depth is the number of numbers decided so far, plus the root.
        const top = tree.calls.find((c) => c.id === tree.stack[tree.stack.length - 1])
        if (top) expect(top.label.startsWith(`i=${frame.vars.i} `), `${where}: top call label`).toBe(true)
      })
      const end = callTreeOf(frames[frames.length - 1].scene)
      expect(end.stack).toEqual([])
      expect(end.calls.every((c) => c.status === 'returned' || c.status === 'pruned')).toBe(true)
      expect(pathOf(frames[frames.length - 1].scene)).toEqual([])
    }
  })

  it('chose/unchose pairs balance, found frames save a copy, leaves print their subset', () => {
    for (const input of ssInputs()) {
      const { frames, result } = subsets.run(input)
      expect(frames.filter((f) => f.at === 'choose')).toHaveLength(frames.filter((f) => f.at === 'unchoose').length)
      expect(frames.filter((f) => f.at === 'found')).toHaveLength(result.length)
      const saved = frames.filter((f) => f.at === 'found').map((f) => f.vars.path)
      expect(saved).toEqual(result)
      const end = callTreeOf(frames[frames.length - 1].scene)
      const leaves = end.calls.filter((c) => c.result?.startsWith('✓')).map((c) => c.result)
      expect(leaves).toEqual(result.map((s) => `✓ [${s.join(',')}]`))
      expect(frames[frames.length - 1].gauge).toEqual({ value: result.length, max: result.length, label: 'Subsets saved' })
    }
  })

  it('the pruned chips are exactly the take-branches that would exceed the limit', () => {
    for (const input of ssInputs()) {
      const n = input.nums.length
      const cap = Math.min(input.limit, n)
      const { frames } = subsets.run(input)
      const end = callTreeOf(frames[frames.length - 1].scene)
      for (const c of end.calls.filter((x) => x.status === 'pruned')) {
        const inner = /^i=(\d+) \[(.*)\]$/.exec(c.label)!
        expect(inner[2].split(',').length).toBe(cap + 1)
      }
      expect(frames.filter((f) => f.at === 'prune').length).toBe(end.calls.filter((c) => c.status === 'pruned').length)
    }
  })
})

describe('recursion/subsets: predicts tell the truth', () => {
  it('include-or-skip: the next frame is choose, or skip right after unchoose', () => {
    let entering = 0
    let afterUnchoose = 0
    for (const input of ssInputs()) {
      const { frames } = subsets.run(input)
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p || p.tag !== 'include-or-skip') return
        const next = frames[i + 1]
        if (frame.at === 'unchoose') {
          afterUnchoose++
          expect(next.at).toBe('skip')
          expect(p.answer).toMatch(/^Skip /)
        } else {
          entering++
          expect(['init', 'explore', 'skip']).toContain(frame.at)
          expect(next.at).toBe('choose')
          expect(p.answer).toMatch(/^Take /)
          expect((next.vars.path as number[]).length).toBe((frame.vars.path as number[]).length + 1)
        }
      })
    }
    expect(entering).toBeGreaterThan(50)
    expect(afterUnchoose).toBeGreaterThan(50)
  })

  it('prune-or-take: asked only when the path is full, and the next frame prunes', () => {
    let asked = 0
    for (const input of ssInputs()) {
      const cap = Math.min(input.limit, input.nums.length)
      const { frames } = subsets.run(input)
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p || p.tag !== 'prune-or-take') return
        asked++
        expect(frames[i + 1].at).toBe('prune')
        expect((frame.vars.path as number[]).length).toBe(cap)
        expect(p.answer).toBe('No, prune it')
      })
    }
    expect(asked).toBeGreaterThan(20)
  })

  it('what-unchoose-does: the next frame is unchoose and it pops exactly the last choice', () => {
    let asked = 0
    for (const input of ssInputs()) {
      const { frames } = subsets.run(input)
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p || p.tag !== 'what-unchoose-does') return
        asked++
        const next = frames[i + 1]
        expect(frame.at).toBe('found')
        expect(next.at).toBe('unchoose')
        const before = frame.vars.path as number[]
        const after = next.vars.path as number[]
        // found is at a leaf; unchoose may undo an earlier choice than the leaf's last, so compare to the prompt's path.
        expect(after.length).toBeLessThan(before.length + 1)
        const last = (/path is \[(.*?)\]/.exec(p.prompt)![1].split(',').pop() ?? '').trim()
        expect(p.answer).toBe(`Remove ${last} (the last choice)`)
        expect(after).toEqual(/path is \[(.*?)\]/.exec(p.prompt)![1].split(',').slice(0, -1).filter((x) => x !== '').map(Number))
        expect(new Set(p.options).size).toBe(3)
      })
    }
    expect(asked).toBeGreaterThan(50)
  })

  it('the default preset asks every kind of predict at least once', () => {
    const { frames } = subsets.run(ss.presets[0].value as SubsetsInput)
    const tags = new Set(frames.filter((f): f is Frame & { predict: NonNullable<Frame['predict']> } => !!f.predict).map((f) => f.predict.tag))
    expect([...tags].sort()).toEqual(['include-or-skip', 'prune-or-take', 'what-unchoose-does'])
  })
})

describe('recursion/subsets: input', () => {
  it('rejects duplicates, a missing limit and a limit above 4 with friendly messages', () => {
    const base = ss.format(ss.presets[0].value)
    const dup = ss.parse({ ...base, nums: '1, 2, 1' })
    expect(dup.ok).toBe(false)
    if (!dup.ok) expect(dup.error).toMatch(/twice/)
    const big = ss.parse({ ...base, limit: '5' })
    expect(big.ok).toBe(false)
    const neg = ss.parse({ ...base, limit: '-1' })
    expect(neg.ok).toBe(false)
    expect(ss.parse({ nums: '[3, -2]', limit: '1' })).toEqual({ ok: true, value: { nums: [3, -2], limit: 1 } })
  })
})
