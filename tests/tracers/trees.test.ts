/**
 * Extra checks for the binary-tree tracers (dfs-order, level-order, max-depth).
 * The generic contract suite runs from registry.test.ts; the harness only
 * inspects array scenes, so this file also checks the tree scenes (every id
 * resolves, children are [left, right], the tree is a real tree, marks and
 * annotations point at real nodes), that predict answers are true, and the
 * walk-throughs themselves (orders, stack depth, queue contents, depth notes).
 */
import { describe, expect, it } from 'vitest'
import dfsOrder from '@/lib/tracers/trees/dfs-order'
import type { DfsInput, DfsOrder } from '@/lib/tracers/trees/dfs-order'
import levelOrder from '@/lib/tracers/trees/level-order'
import maxDepth from '@/lib/tracers/trees/max-depth'
import { buildObjects, buildTree, formatLevelValues, parseLevelValues, serializeTree } from '@/lib/tracers/trees/shared'
import type { LevelValues, ObjNode } from '@/lib/tracers/trees/shared'
import type { AnyTracer, ArrayScene, Frame, Scene, TreeScene } from '@/lib/engine/types'

const CLASSIC: LevelValues = [3, 9, 20, null, null, 15, 7]
const DFS_TREE: LevelValues = [7, 2, 9, 5, 1, null, 4]
const SEEDS = 150

// ---------------------------------------------------------------------------
// Scene helpers
// ---------------------------------------------------------------------------

function treeOf(scene: Scene): TreeScene {
  if (scene.kind === 'tree') return scene
  if (scene.kind === 'composite') {
    for (const part of scene.parts) if (part.scene.kind === 'tree') return part.scene
  }
  throw new Error('no tree scene in frame')
}

function arrayPart(scene: Scene, label: string): ArrayScene {
  if (scene.kind !== 'composite') throw new Error('not a composite scene')
  for (const part of scene.parts) if (part.scene.kind === 'array' && part.scene.label === label) return part.scene
  throw new Error(`no array scene labelled ${label}`)
}

/** Node id the `curr` pointer is on, or null. */
function currOf(frame: Frame): string | null {
  return treeOf(frame.scene).pointers?.find((p) => p.name === 'curr')?.target ?? null
}

function checkTree(scene: TreeScene, where: string): void {
  const ids = new Set(scene.nodes.map((n) => n.id))
  expect(ids.size, `${where}: duplicate node ids`).toBe(scene.nodes.length)
  if (scene.root === null) {
    expect(scene.nodes, `${where}: empty tree has no nodes`).toHaveLength(0)
    return
  }
  expect(ids.has(scene.root), `${where}: root ${scene.root} is not a node`).toBe(true)

  // Every node is reachable from the root exactly once: it is a real tree.
  const byId = new Map(scene.nodes.map((n) => [n.id, n]))
  const seen = new Set<string>()
  const walk = (id: string): void => {
    expect(seen.has(id), `${where}: node ${id} has two parents or a cycle`).toBe(false)
    seen.add(id)
    const node = byId.get(id)!
    expect(node.children, `${where}: ${id} children must be [left, right]`).toHaveLength(2)
    for (const child of node.children) {
      if (child === null) continue
      expect(ids.has(child), `${where}: ${id} points at unknown child ${child}`).toBe(true)
      walk(child)
    }
  }
  walk(scene.root)
  expect(seen.size, `${where}: some nodes are not reachable from the root`).toBe(scene.nodes.length)
  expect(scene.nodes.length, `${where}: at most 9 nodes`).toBeLessThanOrEqual(9)

  for (const p of scene.pointers ?? []) {
    if (p.target !== null) expect(ids.has(p.target), `${where}: pointer ${p.name} -> ${p.target}`).toBe(true)
  }
  for (const m of scene.marks ?? []) expect(ids.has(m.id), `${where}: mark on ${m.id}`).toBe(true)
  const markedTwice = new Set<string>()
  for (const m of scene.marks ?? []) {
    expect(markedTwice.has(m.id), `${where}: ${m.id} is marked twice`).toBe(false)
    markedTwice.add(m.id)
  }
  for (const e of scene.edgeMarks ?? []) {
    expect(byId.get(e.from)?.children.includes(e.to), `${where}: edge ${e.from} -> ${e.to} is not a tree edge`).toBe(true)
  }
  const noted = new Set<string>()
  for (const a of scene.annotations ?? []) {
    const match = /^node:(.+)$/.exec(a.target)
    expect(match, `${where}: annotation target "${a.target}"`).not.toBeNull()
    if (!match) continue
    expect(ids.has(match[1]), `${where}: annotation on unknown node ${match[1]}`).toBe(true)
    expect(noted.has(a.target), `${where}: two annotations on ${a.target}`).toBe(false)
    noted.add(a.target)
    expect(a.text.split(/\s+/).length, `${where}: annotation "${a.text}" is long`).toBeLessThanOrEqual(6)
  }
  expect(scene.floating ?? [], `${where}: nothing floats in these tracers`).toEqual([])
}

function checkComposite(frame: Frame, labels: string[], where: string): void {
  expect(frame.scene.kind, where).toBe('composite')
  if (frame.scene.kind !== 'composite') return
  expect(frame.scene.layout, where).toBe('column')
  expect(frame.scene.parts.map((p) => p.scene.kind), where).toEqual(['tree', ...labels.map(() => 'array')])
  checkTree(treeOf(frame.scene), where)
  for (const label of labels) {
    const arr = arrayPart(frame.scene, label)
    for (const a of arr.annotations ?? []) expect(/^cell:\d+$/.test(a.target), `${where}: ${label} annotation ${a.target}`).toBe(true)
    for (const a of arr.annotations ?? []) {
      const index = Number(a.target.slice(5))
      expect(index < arr.cells.length && arr.cells[index] !== null, `${where}: ${label} annotation on an empty cell`).toBe(true)
    }
  }
}

function heightOf(node: ObjNode | null): number {
  return node === null ? 0 : 1 + Math.max(heightOf(node.l), heightOf(node.r))
}

// ---------------------------------------------------------------------------
// Shared input handling
// ---------------------------------------------------------------------------

describe('tree input (LeetCode level-order arrays)', () => {
  it('reads brackets, nulls and trailing nulls, and gives one canonical array', () => {
    expect(parseLevelValues('[3, 9, 20, null, null, 15, 7]')).toEqual({ ok: true, value: CLASSIC })
    expect(parseLevelValues('3 9 20 NULL none 15 7')).toEqual({ ok: true, value: [3, 9, 20, null, null, 15, 7] })
    expect(parseLevelValues('1, 2, null, null, null')).toEqual({ ok: true, value: [1, 2] })
    expect(parseLevelValues('−4, 5')).toEqual({ ok: true, value: [-4, 5] })
  })

  it('accepts the empty tree as [] or a lone null', () => {
    expect(parseLevelValues('[]')).toEqual({ ok: true, value: [] })
    expect(parseLevelValues('null')).toEqual({ ok: true, value: [] })
    expect(formatLevelValues([])).toBe('[]')
  })

  it('rejects mistakes kindly', () => {
    const bad: Array<[string, RegExp]> = [
      ['', /level by level/],
      ['null, 1, 2', /root/],
      ['1, null, null, 5', /no parent/],
      ['1, 2, 3, 4, 5, 6, 7, 8, 9, 10', /at most 9 nodes/],
      ['1, 2, x', /isn't a whole number/],
      ['1, 2.5', /isn't a whole number/],
      ['1, 100', /between -99 and 99/],
    ]
    for (const [text, message] of bad) {
      const result = parseLevelValues(text)
      expect(result.ok, `"${text}" should be rejected`).toBe(false)
      if (!result.ok) {
        expect(result.error).toMatch(message)
        expect(result.error.length).toBeLessThanOrEqual(140)
        expect(result.field).toBe('values')
      }
    }
  })

  it('allows 9 nodes even when nulls make the array longer than 9', () => {
    const chain = parseLevelValues('1, null, 2, null, 3, null, 4, null, 5, null, 6, null, 7, null, 8, null, 9')
    expect(chain.ok).toBe(true)
    if (chain.ok) expect(buildTree(chain.value).nodes).toHaveLength(9)
  })

  it('builds, serialises and rebuilds the same tree', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const values = dfsOrder.input.random(seed).values
      const tree = buildTree(values)
      expect(serializeTree(tree), `random(${seed})`).toEqual(values)
      expect(tree.nodes.length).toBeGreaterThanOrEqual(3)
      expect(tree.nodes.length).toBeLessThanOrEqual(9)
      expect(heightOf(buildObjects(values))).toBeGreaterThanOrEqual(2)
    }
  })

  it('dfs-order also needs a valid order', () => {
    const bad = dfsOrder.input.parse({ values: '1, 2, 3', order: 'sideways' })
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.field).toBe('order')
    for (const word of ['pre', 'In', 'POST', 'pre-order', 'inorder', 'post order']) {
      expect(dfsOrder.input.parse({ values: '1, 2, 3', order: word }).ok, word).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// dfs-order
// ---------------------------------------------------------------------------

describe('trees/dfs-order', () => {
  const EXPECTED: Record<DfsOrder, number[]> = {
    pre: [7, 2, 5, 1, 9, 4],
    in: [5, 2, 1, 7, 9, 4],
    post: [5, 1, 2, 4, 9, 7],
  }

  it.each(['pre', 'in', 'post'] as const)('%s-order of 7, 2, 9, 5, 1, null, 4', (order) => {
    const { frames, result } = dfsOrder.run({ values: DFS_TREE, order })
    expect(result).toEqual(EXPECTED[order])
    expect(frames[frames.length - 1].say).toContain(EXPECTED[order].join(', '))
  })

  it('keeps the tree and the call stack consistent in every frame', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const input = dfsOrder.input.random(seed)
      const { frames } = dfsOrder.run(input)
      const n = buildTree(input.values).nodes.length
      const visits = frames.filter((f) => f.at === 'visit')
      const backs = frames.filter((f) => f.at === 'back')
      expect(visits, `random(${seed}) visit frames`).toHaveLength(n)
      expect(backs, `random(${seed}) back frames`).toHaveLength(n)
      expect(frames.filter((f) => f.at === 'base'), `random(${seed}) base frames (n + 1 nulls)`).toHaveLength(n + 1)
      expect(frames[0].at).toBe('init')
      expect(frames[frames.length - 1].at).toBe('done')

      let maxDepth = 0
      frames.forEach((frame, i) => {
        const where = `random(${seed}) frame ${i}`
        checkComposite(frame, ['out'], where)
        const tree = treeOf(frame.scene)
        const depth = frame.vars.depth as number
        maxDepth = Math.max(maxDepth, depth)
        // The highlighted edges are exactly the call stack: one fewer edge than calls.
        expect((tree.edgeMarks ?? []).length, `${where}: stack edges`).toBe(Math.max(0, depth - 1))
        // The output array shows exactly the values written so far.
        const out = arrayPart(frame.scene, 'out')
        const written = frame.vars.out as number[]
        expect(out.cells.filter((c) => c !== null), `${where}: output cells`).toEqual(written)
        expect(out.cells.slice(0, written.length), `${where}: filled from the left`).toEqual(written)
        // The narration spells out the depth whenever the stack changes.
        if (frame.at === 'back' && depth > 0) expect(frame.say, where).toMatch(new RegExp(`Back up to .*${depth} deep`))
        if (frame.at === 'left' || frame.at === 'right') expect(frame.say, where).toContain(`${depth} deep`)
      })
      expect(maxDepth, `random(${seed}) deepest stack = tree height`).toBe(heightOf(buildObjects(input.values)))
      expect(frames[frames.length - 2].vars.depth, 'stack is empty before done').toBe(0)
    }
  })

  it('says "back up to" the parent in the guided run', () => {
    const { frames } = dfsOrder.run(dfsOrder.input.presets[0].value)
    expect(frames.some((f) => f.at === 'back' && /Back up to 2: the stack is 2 deep\./.test(f.say))).toBe(true)
    expect(frames.some((f) => f.at === 'back' && /Finished 7, the root\. The call stack is empty\./.test(f.say))).toBe(true)
  })

  it('every next-visit predict is true, never gives the answer away, and is a cell click', () => {
    let seen = 0
    for (const order of ['pre', 'in', 'post'] as const) {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const base = dfsOrder.input.random(seed)
        const input: DfsInput = { values: base.values, order }
        const { frames } = dfsOrder.run(input)
        frames.forEach((frame, i) => {
          const p = frame.predict
          if (!p) return
          seen++
          const where = `${order} random(${seed}) frame ${i}`
          expect(p.tag).toBe('next-visit')
          expect(p.kind).toBe('cell')
          expect(typeof p.answer).toBe('string')
          // The next visit after this frame is the answer...
          const nextVisit = frames.slice(i + 1).find((f) => f.at === 'visit')
          expect(currOf(nextVisit!), `${where}: next visit`).toBe(p.answer)
          // ...the very next frame already moves onto it, and the pointer is not on it yet.
          expect(currOf(frames[i + 1]), `${where}: pointer lands on the answer`).toBe(p.answer)
          expect(currOf(frame), `${where}: not a give-away`).not.toBe(p.answer)
        })
      }
    }
    expect(seen).toBeGreaterThan(100)
    for (const preset of dfsOrder.input.presets) {
      const asked = dfsOrder.run(preset.value).frames.filter((f) => f.predict).length
      expect(asked, `preset "${preset.label}" has predicts to choose from`).toBeGreaterThanOrEqual(3)
    }
  })

  it('handles an empty tree and a single node', () => {
    for (const order of ['pre', 'in', 'post'] as const) {
      const empty = dfsOrder.run({ values: [], order })
      expect(empty.result).toEqual([])
      expect(empty.frames.map((f) => f.at)).toEqual(['init', 'base', 'done'])
      empty.frames.forEach((f, i) => checkComposite(f, ['out'], `empty ${order} frame ${i}`))
      const one = dfsOrder.run({ values: [5], order })
      expect(one.result).toEqual([5])
      one.frames.forEach((f, i) => checkComposite(f, ['out'], `single ${order} frame ${i}`))
    }
  })
})

// ---------------------------------------------------------------------------
// level-order
// ---------------------------------------------------------------------------

describe('trees/level-order', () => {
  it('groups the classic example by level', () => {
    const { frames, result } = levelOrder.run({ values: CLASSIC })
    expect(result).toEqual([[3], [9, 20], [15, 7]])
    expect(frames[frames.length - 1].say).toBe('Done: [[3], [9, 20], [15, 7]].')
  })

  it('handles the empty tree without crashing (the legacy BFS bug)', () => {
    const { frames, result } = levelOrder.run({ values: [] })
    expect(result).toEqual([])
    expect(frames.map((f) => f.at)).toEqual(['init', 'check', 'done'])
    frames.forEach((f, i) => checkComposite(f, ['queue', 'output'], `empty frame ${i}`))
    expect(arrayPart(frames[0].scene, 'queue').cells).toEqual([])
    expect(levelOrder.reference({ values: [] })).toEqual([])
  })

  it('keeps tree, queue and output consistent in every frame', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const input = levelOrder.input.random(seed)
      const { frames, result } = levelOrder.run(input)
      const tree = buildTree(input.values)
      const n = tree.nodes.length
      expect(frames.filter((f) => f.at === 'pop'), `random(${seed}) pops`).toHaveLength(n)
      expect(frames.filter((f) => f.at === 'visit'), `random(${seed}) visits`).toHaveLength(n)
      expect(frames.filter((f) => f.at === 'group'), `random(${seed}) groups`).toHaveLength(result.length)
      expect(frames.filter((f) => f.at === 'push'), `random(${seed}) pushes (one per non-leaf)`).toHaveLength(
        tree.nodes.filter((x) => x.left !== null || x.right !== null).length,
      )

      let widest = 0
      frames.forEach((frame, i) => {
        const where = `random(${seed}) frame ${i}`
        checkComposite(frame, ['queue', 'output'], where)
        const queue = arrayPart(frame.scene, 'queue')
        widest = Math.max(widest, queue.cells.length)
        // front / back pointers sit on the first and last cell (none when the queue is empty)
        if (queue.cells.length === 0) expect(queue.pointers ?? [], where).toEqual([])
        else {
          expect(queue.pointers, where).toEqual([
            { name: 'front', index: 0, role: 'ptrA' },
            { name: 'back', index: queue.cells.length - 1, role: 'ptrB' },
          ])
        }
        expect(queue.cells.length + (queue.capacity ?? 0), `${where}: queue stays n slots wide`).toBe(n)
        expect(frame.vars.queue, `${where}: queue var`).toEqual(queue.cells)
        // the window is the level still being served, always at the front
        if (queue.window) {
          expect(queue.window.start, where).toBe(0)
          expect(queue.window.end, where).toBeLessThan(queue.cells.length)
        }
        // output annotations "level k" count up from 1 and sit on the first cell of each level
        const notes = arrayPart(frame.scene, 'output').annotations ?? []
        notes.forEach((a, k) => expect(a.text, where).toBe(`level ${k + 1}`))
      })

      // At the end the output reads level by level and each level has a note.
      const last = frames[frames.length - 1]
      const output = arrayPart(last.scene, 'output')
      expect(output.cells, `random(${seed}) final output`).toEqual(result.flat())
      const starts: number[] = []
      let total = 0
      for (const level of result) {
        starts.push(total)
        total += level.length
      }
      expect((output.annotations ?? []).map((a) => a.target), `random(${seed}) level notes`).toEqual(starts.map((s) => `cell:${s}`))
      // The level frame freezes size = the queue length at that moment.
      frames.forEach((frame, i) => {
        if (frame.at !== 'level') return
        expect(frame.vars.size, `random(${seed}) frame ${i}`).toBe((frame.vars.queue as number[]).length)
      })
      // The widest queue never exceeds the widest level.
      expect(widest).toBeLessThanOrEqual(Math.max(...result.map((l) => l.length)) + 2)
    }
  })

  it('every next-in-queue predict is true: the front node is the next to leave', () => {
    let seen = 0
    for (let seed = 1; seed <= SEEDS; seed++) {
      const { frames } = levelOrder.run(levelOrder.input.random(seed))
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        seen++
        const where = `random(${seed}) frame ${i}`
        expect(p.tag).toBe('next-in-queue')
        expect(p.kind).toBe('cell')
        const next = frames[i + 1]
        expect(next.at, `${where}: reveal frame is a pop`).toBe('pop')
        expect(currOf(next), `${where}: the answer is the node popped`).toBe(p.answer)
        expect((frame.vars.queue as number[]).length, `${where}: a real choice (two or more waiting)`).toBeGreaterThanOrEqual(2)
      })
    }
    expect(seen).toBeGreaterThan(100)
    expect(levelOrder.run(levelOrder.input.presets[0].value).frames.filter((f) => f.predict).length).toBeGreaterThanOrEqual(2)
  })
})

// ---------------------------------------------------------------------------
// max-depth
// ---------------------------------------------------------------------------

describe('trees/max-depth', () => {
  it('finds the depth of the preset trees', () => {
    expect(maxDepth.run({ values: CLASSIC }).result).toBe(3)
    expect(maxDepth.run({ values: [8, 4, 12, 2, null, null, null, 1] }).result).toBe(4)
    expect(maxDepth.run({ values: [1, null, 2, null, 3, null, 4] }).result).toBe(4)
    expect(maxDepth.run({ values: [5] }).result).toBe(1)
    expect(maxDepth.run({ values: [] }).result).toBe(0)
  })

  it('handles the empty tree', () => {
    const { frames } = maxDepth.run({ values: [] })
    expect(frames.map((f) => f.at)).toEqual(['init', 'base'])
    frames.forEach((f, i) => checkTree(treeOf(f.scene), `empty frame ${i}`))
  })

  it('writes "depth k" on a node exactly when it has answered, and k is its true depth', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const input = maxDepth.input.random(seed)
      const { frames, result } = maxDepth.run(input)
      const tree = buildTree(input.values)
      const objects = buildObjects(input.values)!
      const trueDepth = new Map<string, number>()
      // depth of each node by the same ids the scene uses (level order of the same array)
      const queue: Array<{ node: ObjNode; id: string }> = [{ node: objects, id: 'n0' }]
      let next = 1
      for (let head = 0; head < queue.length; head++) {
        const { node, id } = queue[head]
        trueDepth.set(id, heightOf(node))
        for (const child of [node.l, node.r]) if (child) queue.push({ node: child, id: `n${next++}` })
      }

      let answered = 0
      frames.forEach((frame, i) => {
        const where = `random(${seed}) frame ${i}`
        const scene = treeOf(frame.scene)
        checkTree(scene, where)
        const depthNotes = (scene.annotations ?? []).filter((a) => /^depth \d+$/.test(a.text))
        for (const a of depthNotes) {
          const id = a.target.slice(5)
          expect(Number(a.text.slice(6)), `${where}: depth note on ${id}`).toBe(trueDepth.get(id))
        }
        expect(depthNotes.length, `${where}: notes never disappear`).toBeGreaterThanOrEqual(answered)
        answered = depthNotes.length
        if (frame.at === 'combine') {
          expect(frame.vars.ret, `${where}: returns what the note says`).toBe(trueDepth.get(currOf(frame)!))
        }
      })
      expect(answered, `random(${seed}) every node answered`).toBe(tree.nodes.length)
      expect(frames[frames.length - 1].vars.ret).toBe(result)
      // the last frame lights up one longest path, root to a leaf, with result nodes on it
      const lastScene = treeOf(frames[frames.length - 1].scene)
      expect((lastScene.marks ?? []).filter((m) => m.role === 'found'), `random(${seed}) longest path`).toHaveLength(result)
    }
  })

  it('every depth-here predict is true and offers the right answer among 2-3 options', () => {
    let seen = 0
    for (let seed = 1; seed <= SEEDS; seed++) {
      const { frames } = maxDepth.run(maxDepth.input.random(seed))
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        seen++
        const where = `random(${seed}) frame ${i}`
        const next = frames[i + 1]
        expect(p.tag).toBe('depth-here')
        expect(p.kind).toBe('choice')
        expect(next.at, `${where}: reveal frame is the combine`).toBe('combine')
        const node = currOf(next)!
        const note = (treeOf(next.scene).annotations ?? []).find((a) => a.target === `node:${node}`)
        expect(note?.text, `${where}: answer is the depth the node returns`).toBe(`depth ${p.answer}`)
        expect(p.options!.length).toBeGreaterThanOrEqual(2)
        expect(p.options!.length).toBeLessThanOrEqual(3)
        expect(new Set(p.options).size).toBe(p.options!.length)
        expect(p.options).toContain(p.answer)
        expect(treeOf(frame.scene).annotations?.some((a) => a.target === `node:${node}` && a.text.startsWith('depth')), `${where}: node has not answered yet`).toBeFalsy()
      })
    }
    expect(seen).toBeGreaterThan(300)
  })
})

// ---------------------------------------------------------------------------
// Whole-tracer sanity on the presets
// ---------------------------------------------------------------------------

describe('trees presets', () => {
  it.each([dfsOrder, levelOrder, maxDepth] as AnyTracer[])('$id: guided runs are 8-40 frames', (tracer) => {
    const first = tracer.run(tracer.input.presets[0].value)
    expect(first.frames.length).toBeGreaterThanOrEqual(8)
    expect(first.frames.length).toBeLessThanOrEqual(40)
    for (const preset of tracer.input.presets) {
      expect(tracer.run(preset.value).frames.length, preset.label).toBeLessThanOrEqual(60)
    }
  })
})
