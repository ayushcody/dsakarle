/**
 * Extra checks for the heaps tracers (push, pop, kth-largest). The generic
 * contract suite (frames, anchors, code parity, parse, correctness...) runs from
 * registry.test.ts; this file checks what only these tracers can know:
 *   - every predict answer matches what the next frame actually does,
 *   - the tree and array views are the same heap (node ids h0..hN = array index,
 *     children [2i+1, 2i+2] or null), and the heap property holds at the end of
 *     every push, pop and sift,
 *   - swaps are drawn the agreed way (edge + both nodes + both cells 'changed'),
 *   - the teaching beats of each default preset.
 */
import { describe, expect, it } from 'vitest'
import kth from '@/lib/tracers/heaps/kth-largest'
import type { KthLargestInput } from '@/lib/tracers/heaps/kth-largest'
import pop from '@/lib/tracers/heaps/pop'
import type { PopInput } from '@/lib/tracers/heaps/pop'
import push from '@/lib/tracers/heaps/push'
import type { PushInput } from '@/lib/tracers/heaps/push'
import type { AnyTracer, ArrayScene, Frame, Scene, TreeScene } from '@/lib/engine/types'

function runsOf<I>(tracer: AnyTracer): Array<{ input: I; frames: Frame[] }> {
  const inputs: I[] = [...tracer.input.presets.map((p: { value: I }) => p.value), ...Array.from({ length: 200 }, (_, i) => tracer.input.random(i + 1) as I)]
  return inputs.map((input) => ({ input, frames: tracer.run(input).frames }))
}

interface HeapParts {
  tree: TreeScene
  array: ArrayScene
  stream?: ArrayScene
}

/** Splits a frame's composite scene into its tree, heap array and (kth-largest) stream. */
function parts(scene: Scene, where: string): HeapParts {
  expect(scene.kind, `${where}: composite`).toBe('composite')
  if (scene.kind !== 'composite') throw new Error('unreachable')
  expect(scene.layout, `${where}: column layout`).toBe('column')
  const tree = scene.parts.find((p) => p.scene.kind === 'tree')?.scene as TreeScene | undefined
  const arrays = scene.parts.filter((p) => p.scene.kind === 'array').map((p) => p.scene as ArrayScene)
  expect(tree, `${where}: has a tree part`).toBeDefined()
  const heapArray = arrays.find((a) => a.label === 'heap')
  expect(heapArray, `${where}: has a "heap" array part`).toBeDefined()
  return { tree: tree as TreeScene, array: heapArray as ArrayScene, stream: arrays.find((a) => a.label === 'nums') }
}

function isMinHeap(heap: ReadonlyArray<number | string | null>): boolean {
  return heap.every((v, i) => i === 0 || (heap[(i - 1) >> 1] as number) <= (v as number))
}

/** The tree and the array show the same heap, in the shape the contract promises. */
function checkSameHeap({ tree, array }: HeapParts, where: string): number[] {
  const heap = array.cells as number[]
  const n = heap.length
  expect(tree.nodes, `${where}: node count`).toHaveLength(n)
  expect(tree.root, `${where}: root`).toBe(n > 0 ? 'h0' : null)
  tree.nodes.forEach((node, i) => {
    expect(node.id, `${where}: node id`).toBe(`h${i}`)
    expect(node.value, `${where}: node h${i} value`).toBe(heap[i])
    expect(node.children, `${where}: children of h${i}`).toEqual([2 * i + 1 < n ? `h${2 * i + 1}` : null, 2 * i + 2 < n ? `h${2 * i + 2}` : null])
  })
  const ids = new Set(tree.nodes.map((node) => node.id))
  for (const m of tree.marks ?? []) expect(ids.has(m.id), `${where}: mark on ${m.id}`).toBe(true)
  for (const p of tree.pointers ?? []) expect(p.target !== null && ids.has(p.target), `${where}: pointer ${p.name}`).toBe(true)
  for (const e of tree.edgeMarks ?? []) {
    const parent = Number(e.from.slice(1))
    const child = Number(e.to.slice(1))
    expect(ids.has(e.from) && ids.has(e.to), `${where}: edge ${e.from}->${e.to} exists`).toBe(true)
    expect(tree.nodes[parent].children, `${where}: ${e.from} -> ${e.to} is a real edge`).toContain(e.to)
    expect(child).toBeGreaterThan(parent)
  }
  for (const a of tree.annotations ?? []) expect(ids.has(a.target.replace('node:', '')), `${where}: note target ${a.target}`).toBe(true)
  // The array shows the same marks and pointers as the tree.
  const treeMarks = (tree.marks ?? []).map((m) => `${m.id}:${m.role}`).sort()
  const arrayMarks = (array.marks ?? []).map((m) => `h${m.index}:${m.role}`).sort()
  expect(arrayMarks, `${where}: tree and array marks agree`).toEqual(treeMarks)
  expect((array.pointers ?? []).map((p) => `${p.name}:h${p.index}`), `${where}: pointers agree`).toEqual((tree.pointers ?? []).map((p) => `${p.name}:${p.target}`))
  if (array.capacity !== undefined) expect(array.capacity, `${where}: capacity beyond the cells`).toBeGreaterThan(n)
  return heap
}

describe('heaps: scenes are the same heap, as a tree and as an array', () => {
  for (const tracer of [push, pop, kth] as AnyTracer[]) {
    it(`${tracer.id}: every frame is a column of tree + array and the two agree`, () => {
      for (const { frames } of runsOf<unknown>(tracer)) {
        frames.forEach((frame, i) => checkSameHeap(parts(frame.scene, `${tracer.id} frame ${i}`), `${tracer.id} frame ${i}`))
      }
    })
  }

  it('heaps/push: the heap is valid after every settle and at the end; swaps are drawn as agreed', () => {
    for (const { frames } of runsOf<PushInput>(push)) {
      frames.forEach((frame, i) => {
        const p = parts(frame.scene, `push frame ${i}`)
        const heap = p.array.cells as number[]
        if (frame.at === 'settle' || frame.at === 'done' || frame.at === 'init') expect(isMinHeap(heap), `push frame ${i} ${JSON.stringify(heap)}`).toBe(true)
        if (frame.at === 'swap') {
          expect(p.tree.edgeMarks?.map((e) => e.role), `push frame ${i} edge`).toEqual(['changed'])
          expect((p.tree.marks ?? []).map((m) => m.role), `push frame ${i} tree marks`).toEqual(['changed', 'changed'])
          expect((p.array.marks ?? []).map((m) => m.role), `push frame ${i} array marks`).toEqual(['changed', 'changed'])
          const [e] = p.tree.edgeMarks!
          // The swapped pair is the edge's two ends: the child now holds the old parent, which is bigger.
          const parent = Number(e.from.slice(1))
          const child = Number(e.to.slice(1))
          expect(heap[parent], `push frame ${i}: smaller value rose`).toBeLessThan(heap[child])
        }
      })
    }
  })

  it('heaps/pop: the heap is valid after every settle and at the end; swaps are drawn as agreed', () => {
    for (const { frames } of runsOf<PopInput>(pop)) {
      frames.forEach((frame, i) => {
        const p = parts(frame.scene, `pop frame ${i}`)
        const heap = p.array.cells as number[]
        if (frame.at === 'settle' || frame.at === 'done' || frame.at === 'init' || frame.at === 'take') {
          expect(isMinHeap(heap), `pop frame ${i} ${JSON.stringify(heap)}`).toBe(true)
        }
        if (frame.at === 'swap') {
          expect(p.tree.edgeMarks?.map((e) => e.role), `pop frame ${i} edge`).toEqual(['changed'])
          expect((p.tree.marks ?? []).map((m) => m.role), `pop frame ${i} tree marks`).toEqual(['changed', 'changed'])
          expect((p.array.marks ?? []).map((m) => m.role), `pop frame ${i} array marks`).toEqual(['changed', 'changed'])
          const [e] = p.tree.edgeMarks!
          expect(heap[Number(e.from.slice(1))], `pop frame ${i}: smaller value rose`).toBeLessThan(heap[Number(e.to.slice(1))])
        }
      })
    }
  })

  it('heaps/kth-largest: the heap is valid and never over k + 1 numbers; the stream pointer follows i', () => {
    for (const { input, frames } of runsOf<KthLargestInput>(kth)) {
      frames.forEach((frame, i) => {
        const p = parts(frame.scene, `kth frame ${i}`)
        const heap = p.array.cells as number[]
        expect(isMinHeap(heap), `kth frame ${i}`).toBe(true)
        expect(heap.length).toBeLessThanOrEqual(input.k + 1)
        expect(p.tree.nodes.length).toBeLessThanOrEqual(9)
        expect(p.stream?.cells, `kth frame ${i}: stream cells`).toEqual(input.nums)
        if (frame.at === 'push' || frame.at === 'pop') {
          expect(p.stream!.pointers, `kth frame ${i}: pointer i`).toEqual([{ name: 'i', index: frame.vars.i, role: 'ptrB' }])
          // After a pop the heap is back to k; after a push it is one more than before.
          if (frame.at === 'pop') expect(heap.length).toBe(input.k)
        }
      })
    }
  })
})

describe('heaps: predicts tell the truth', () => {
  it('heaps/push swap-or-stop: the next frame is a swap, or the settle', () => {
    const answers = new Set<unknown>()
    for (const { frames } of runsOf<PushInput>(push)) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        expect(p.tag).toBe('swap-or-stop')
        expect(frame.at, 'asked on the compare frame').toBe('compare')
        answers.add(p.answer)
        const next = frames[i + 1]
        expect(next.at, `push frame ${i + 1}`).toBe(p.answer === 'Swap them and keep climbing' ? 'swap' : 'settle')
      })
    }
    expect([...answers].sort()).toEqual(['Stop: it stays here', 'Swap them and keep climbing'])
  })

  it('heaps/pop which-child: the answer is the node whose edge the compare frame highlights, and it is the smaller child', () => {
    let asked = 0
    const sides = new Set<number>()
    for (const { frames } of runsOf<PopInput>(pop)) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'which-child') return
        asked++
        expect(frame.at).toBe('children')
        expect(p.kind).toBe('cell')
        expect(typeof p.answer).toBe('string')
        const before = parts(frame.scene, 'children').array.cells as number[]
        const next = frames[i + 1]
        expect(next.at, 'reveal is the compare frame').toBe('compare')
        const tree = parts(next.scene, 'compare').tree
        expect(tree.edgeMarks, 'compare frame highlights one edge').toHaveLength(1)
        expect(tree.edgeMarks![0].to).toBe(p.answer)
        // It really is the smaller of the two children (the left one wins ties).
        const parent = Number(tree.edgeMarks![0].from.slice(1))
        const left = before[2 * parent + 1]
        const right = before[2 * parent + 2]
        expect(right, 'two children').toBeDefined()
        const chosen = before[Number((p.answer as string).slice(1))]
        expect(chosen).toBe(Math.min(left, right))
        expect(p.answer).toBe(right < left ? `h${2 * parent + 2}` : `h${2 * parent + 1}`)
        sides.add(Number((p.answer as string).slice(1)) - 2 * parent)
      })
    }
    expect(asked).toBeGreaterThan(50)
    expect([...sides].sort(), 'both left (1) and right (2) children get picked').toEqual([1, 2])
  })

  it('heaps/pop swap-or-stop: the next frame is a swap, or the settle', () => {
    const answers = new Set<unknown>()
    for (const { frames } of runsOf<PopInput>(pop)) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'swap-or-stop') return
        expect(frame.at).toBe('compare')
        answers.add(p.answer)
        expect(frames[i + 1].at).toBe(p.answer === 'Swap and sink further' ? 'swap' : 'settle')
      })
    }
    expect([...answers].sort()).toEqual(['Stop: it stays here', 'Swap and sink further'])
  })

  it('heaps/kth-largest push-then-pop: a pop follows exactly when the heap grew past k', () => {
    const answers = new Set<unknown>()
    for (const { input, frames } of runsOf<KthLargestInput>(kth)) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        expect(p.tag).toBe('push-then-pop')
        expect(frame.at).toBe('push')
        answers.add(p.answer)
        const size = (parts(frame.scene, 'push').array.cells as number[]).length
        expect(size === input.k + 1, 'the answer is "pop" iff size is k + 1').toBe(p.answer === 'Pop the smallest')
        expect(frames[i + 1].at).toBe(p.answer === 'Pop the smallest' ? 'pop' : frame.vars.i === input.nums.length - 1 ? 'done' : 'push')
      })
    }
    expect([...answers].sort()).toEqual(['Nothing: keep them all', 'Pop the smallest'])
  })
})

describe('heaps/push: default preset', () => {
  const { frames, result } = push.run(push.input.presets[0].value)
  it('builds the min-heap [2, 3, 4, 6, 5, 8] and shows every rule', () => {
    expect(push.input.presets[0].value).toEqual({ values: [5, 3, 8, 6, 2, 4] })
    expect(result).toEqual([2, 3, 4, 6, 5, 8])
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect([count('init'), count('append'), count('settle'), count('done')]).toEqual([1, 6, 6, 1])
    expect(count('swap')).toBe(4)
    expect(count('compare')).toBe(count('swap') + 3)
    expect(frames).toHaveLength(25)
  })
  it('ends with the smallest value highlighted at the root', () => {
    const done = parts(frames[frames.length - 1].scene, 'done')
    expect(done.tree.marks).toEqual([{ id: 'h0', role: 'found' }])
    expect(done.array.cells).toEqual([2, 3, 4, 6, 5, 8])
  })
})

describe('heaps/pop: default preset', () => {
  const { frames, result } = pop.run(pop.input.presets[0].value)
  it('pops 2 then 3 from a heap of seven', () => {
    expect(pop.input.presets[0].value).toEqual({ values: [6, 2, 3, 4, 5, 9, 7], pops: 2 })
    expect(result).toEqual([2, 3])
    expect(frames.filter((f) => f.at === 'take')).toHaveLength(2)
    expect(frames.filter((f) => f.at === 'move')).toHaveLength(2)
  })
  it('takes the root, moves the last element up, and ends with a valid heap of five', () => {
    const first = frames.findIndex((f) => f.at === 'take')
    const before = parts(frames[first].scene, 'take').array.cells as number[]
    const moved = parts(frames[first + 1].scene, 'move').array.cells as number[]
    expect(moved).toHaveLength(before.length - 1)
    expect(moved[0]).toBe(before[before.length - 1])
    const last = parts(frames[frames.length - 1].scene, 'done').array.cells as number[]
    expect(last).toHaveLength(5)
    expect(isMinHeap(last)).toBe(true)
  })
  it('shows a stop by comparison, a one-child node, and both children being chosen', () => {
    expect(frames.some((f, i) => f.at === 'settle' && frames[i - 1].at === 'compare')).toBe(true)
    expect(frames.some((f) => f.at === 'children' && /just one child/.test(f.say))).toBe(true)
    const picked = frames.filter((f) => f.predict?.tag === 'which-child').map((f) => f.predict!.answer)
    expect(new Set(picked).size).toBeGreaterThan(1)
  })
  it('draining a heap leaves an empty tree', () => {
    const drained = pop.run({ values: [4, 2, 7], pops: 3 })
    expect(drained.result).toEqual([2, 4, 7])
    const end = parts(drained.frames[drained.frames.length - 1].scene, 'done')
    expect(end.tree.root).toBeNull()
    expect(end.tree.nodes).toEqual([])
    expect(end.array.cells).toEqual([])
  })
})

describe('heaps/kth-largest: default preset', () => {
  const { frames, result } = kth.run(kth.input.presets[0].value)
  it('is LeetCode 215 example 2: the 4th largest of [3,2,3,1,2,4,5,5,6] is 4', () => {
    expect(kth.input.presets[0].value).toEqual({ nums: [3, 2, 3, 1, 2, 4, 5, 5, 6], k: 4 })
    expect(result).toBe(4)
    expect(frames.filter((f) => f.at === 'push')).toHaveLength(9)
    expect(frames.filter((f) => f.at === 'pop')).toHaveLength(5)
  })
  it('marks popped numbers as discarded in the stream and the answer as found at the end', () => {
    const end = parts(frames[frames.length - 1].scene, 'done')
    expect(end.tree.marks).toEqual([{ id: 'h0', role: 'found' }])
    const roles = new Map((end.stream!.marks ?? []).map((m) => [m.index, m.role]))
    const discarded = [...roles].filter(([, role]) => role === 'discarded').length
    expect(discarded).toBe(5)
    expect(roles.size).toBe(9)
  })
  it('never pops when k equals the length', () => {
    const run = kth.run({ nums: [7, 1, 9], k: 3 })
    expect(run.result).toBe(1)
    expect(run.frames.some((f) => f.at === 'pop')).toBe(false)
  })
})

describe('heaps: parse rules specific to these tracers', () => {
  const reject = (tracer: AnyTracer, override: Record<string, string>): void => {
    const base = tracer.input.format(tracer.input.presets[0].value)
    const result = tracer.input.parse({ ...base, ...override })
    expect(result.ok, JSON.stringify(override)).toBe(false)
  }
  it('pop: pops must be between 1 and the number of values', () => {
    reject(pop, { pops: '0' })
    reject(pop, { pops: '99' })
  })
  it('kth-largest: k must be between 1 and min(length, 8)', () => {
    reject(kth, { k: '0' })
    reject(kth, { k: '99' })
    reject(kth, { nums: '1, 2, 3', k: '4' })
    expect(kth.input.parse({ nums: '1, 2, 3, 4, 5, 6, 7, 8, 9, 10', k: '9' }).ok).toBe(false)
    expect(kth.input.parse({ nums: '1, 2, 3, 4, 5, 6, 7, 8, 9, 10', k: '8' }).ok).toBe(true)
  })
  it('accepts brackets and typographic minus signs', () => {
    expect(push.input.parse({ values: '[5, −3, 8]' })).toEqual({ ok: true, value: { values: [5, -3, 8] } })
  })
})
