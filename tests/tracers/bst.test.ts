/**
 * Extra checks for the binary-search-tree tracers (search, insert, delete). The
 * generic contract suite (frames, anchors, code parity, parse, correctness...)
 * runs from registry.test.ts and only knows array scenes, so this file adds:
 *   - tree scene sanity for every frame of every run
 *   - the BST invariant on every frame where it should hold
 *   - predict answers that are true (checked against what the next frame shows)
 *   - the teaching beats of each default preset
 *   - input rules specific to each tracer, and the lesson file's wiring
 */
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { lessonV2Schema } from '@/lib/content-schema'
import type { LessonV2 } from '@/types/learning'
import search from '@/lib/tracers/bst/search'
import insert from '@/lib/tracers/bst/insert'
import del from '@/lib/tracers/bst/delete'
import type { AnyTracer, Frame, TreeScene } from '@/lib/engine/types'

const tracers: AnyTracer[] = [search, insert, del]

function treeOf(frame: Frame): TreeScene {
  if (frame.scene.kind !== 'tree') throw new Error(`expected a tree scene, got ${frame.scene.kind}`)
  return frame.scene
}

function pointerTarget(frame: Frame, name: string): string | null | undefined {
  return treeOf(frame).pointers?.find((p) => p.name === name)?.target
}

function valueOf(scene: TreeScene, id: string): number {
  return scene.nodes.find((n) => n.id === id)!.value as number
}

/** Ids of the nodes linked into the tree (everything reachable from the root). Fails on a cycle or a shared node. */
function attached(scene: TreeScene): string[] {
  const out: string[] = []
  const visit = (id: string | null): void => {
    if (id === null) return
    expect(out, `node ${id} reached twice`).not.toContain(id)
    out.push(id)
    const node = scene.nodes.find((n) => n.id === id)
    expect(node, `child ${id} is not in nodes`).toBeDefined()
    for (const c of node!.children) visit(c)
  }
  visit(scene.root)
  return out
}

/** Values left to right. */
function inorder(scene: TreeScene, id: string | null = scene.root): number[] {
  if (id === null) return []
  const node = scene.nodes.find((n) => n.id === id)!
  return [...inorder(scene, node.children[0]), node.value as number, ...inorder(scene, node.children[1])]
}

function preorder(scene: TreeScene, id: string | null = scene.root): number[] {
  if (id === null) return []
  const node = scene.nodes.find((n) => n.id === id)!
  return [node.value as number, ...preorder(scene, node.children[0]), ...preorder(scene, node.children[1])]
}

function childOf(scene: TreeScene, parent: string, side: 0 | 1): string | null {
  return scene.nodes.find((n) => n.id === parent)!.children[side]
}

function parentOf(scene: TreeScene, id: string): string | null {
  return scene.nodes.find((n) => n.children.includes(id))?.id ?? null
}

/** Presets plus random seeds. */
function allRuns(tracer: AnyTracer): Array<{ input: unknown; frames: Frame[] }> {
  const inputs: unknown[] = [...tracer.input.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => tracer.input.random(i + 1))]
  return inputs.map((input) => ({ input, frames: tracer.run(input).frames }))
}

const isStrictlyIncreasing = (xs: number[]): boolean => xs.every((x, i) => i === 0 || xs[i - 1] < x)

// ---------------------------------------------------------------------------
// Scene sanity (the generic harness only checks array scenes)
// ---------------------------------------------------------------------------

describe.each(tracers)('$id: tree scenes are well formed', (tracer) => {
  it('has real node ids, binary children, pointers, marks, edges and notes on every frame', () => {
    for (const { frames } of allRuns(tracer)) {
      frames.forEach((frame, i) => {
        const where = `${tracer.id} frame ${i} (${frame.at})`
        const scene = treeOf(frame)
        const ids = scene.nodes.map((n) => n.id)
        const known = new Set(ids)
        expect(known.size, `${where}: duplicate node ids`).toBe(ids.length)
        expect(ids.length, `${where}: more than 9 nodes`).toBeLessThanOrEqual(9)
        for (const id of ids) expect(id, `${where}: node id`).toMatch(/^n\d+$/)
        if (scene.root !== null) expect(known.has(scene.root), `${where}: root ${scene.root} unknown`).toBe(true)

        for (const node of scene.nodes) {
          expect(node.children, `${where}: ${node.id} is binary [left, right]`).toHaveLength(2)
          for (const c of node.children) if (c !== null) expect(known.has(c), `${where}: ${node.id} has unknown child ${c}`).toBe(true)
          expect(typeof node.value, `${where}: value type`).toBe('number')
        }

        for (const id of scene.floating ?? []) {
          expect(known.has(id), `${where}: floating unknown node ${id}`).toBe(true)
          expect(scene.nodes.find((n) => n.id === id)!.children, `${where}: floating node ${id} has children`).toEqual([null, null])
        }
        for (const p of scene.pointers ?? []) {
          if (p.target !== null) expect(known.has(p.target), `${where}: pointer ${p.name} targets unknown node ${p.target}`).toBe(true)
        }
        for (const m of scene.marks ?? []) expect(known.has(m.id), `${where}: mark on unknown node ${m.id}`).toBe(true)
        for (const e of scene.edgeMarks ?? []) {
          expect(known.has(e.from) && known.has(e.to), `${where}: edge ${e.from} -> ${e.to} unknown`).toBe(true)
          expect(scene.nodes.find((n) => n.id === e.from)!.children, `${where}: edge ${e.from} -> ${e.to} is not a link`).toContain(e.to)
        }
        for (const a of scene.annotations ?? []) {
          const [kind, id] = a.target.split(':')
          if (kind === 'node') expect(known.has(id), `${where}: note on unknown node ${id}`).toBe(true)
          expect(a.text.split(/\s+/).length, `${where}: note "${a.text}" is longer than 6 words`).toBeLessThanOrEqual(6)
        }
      })
    }
  })

  it('links every node into the tree exactly once, or floats it (nothing is lost, no cycles)', () => {
    for (const { frames } of allRuns(tracer)) {
      frames.forEach((frame, i) => {
        const where = `${tracer.id} frame ${i} (${frame.at})`
        const scene = treeOf(frame)
        const linked = new Set(attached(scene))
        const floating = new Set(scene.floating ?? [])
        for (const id of floating) expect(linked.has(id), `${where}: ${id} is floating and linked`).toBe(false)
        const lost = scene.nodes.map((n) => n.id).filter((id) => !linked.has(id) && !floating.has(id))
        expect(lost, `${where}: nodes nobody can reach`).toEqual([])
      })
    }
  })

  it('keeps node ids stable, with at most one new node (insert) from the first frame to the last', () => {
    for (const { frames } of allRuns(tracer)) {
      const first = new Set(treeOf(frames[0]).nodes.map((n) => n.id))
      const seen = new Set<string>()
      for (const frame of frames) for (const n of treeOf(frame).nodes) seen.add(n.id)
      const extra = [...seen].filter((id) => !first.has(id))
      expect(extra.length, `${tracer.id}: ids that appear later`).toBeLessThanOrEqual(tracer.id === 'bst/insert' ? 1 : 0)
    }
  })

  it('keeps the tree a valid BST on every frame (delete may hold a duplicate for one frame, after the copy)', () => {
    for (const { frames } of allRuns(tracer)) {
      let copied = false
      frames.forEach((frame, i) => {
        if (frame.at === 'copy') copied = true
        if (frame.at === 'relink') copied = false
        if (copied) return
        const scene = treeOf(frame)
        expect(isStrictlyIncreasing(inorder(scene)), `${tracer.id} frame ${i} (${frame.at}): in-order is ${inorder(scene)}`).toBe(true)
      })
    }
  })

  it('narrates in at most 140 characters and never says undefined or NaN', () => {
    for (const { frames } of allRuns(tracer)) {
      for (const f of frames) {
        expect(f.say.length).toBeLessThanOrEqual(140)
        expect(f.say).not.toMatch(/undefined|NaN|null null/)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// search
// ---------------------------------------------------------------------------

describe('bst/search', () => {
  const { frames, result } = search.run({ values: [8, 3, 10, 1, 6, 14, 4, 7, 13], key: 6 })

  it('finds 6 in the default tree: root, left to 3, right to 6, then found', () => {
    expect(result).toBe(true)
    expect(frames.map((f) => f.at)).toEqual(['init', 'compare', 'left', 'compare', 'right', 'compare', 'done'])
    const currs = frames.map((f) => pointerTarget(f, 'curr'))
    expect(currs).toEqual(['n0', 'n0', 'n1', 'n1', 'n4', 'n4', 'n4'])
    expect(frames[frames.length - 1].say).toMatch(/found it after 3 compares/)
  })

  it('draws the path taken as edge marks, and rules out the other subtree with each step', () => {
    const afterLeft = treeOf(frames[2])
    expect(afterLeft.edgeMarks).toEqual([{ from: 'n0', to: 'n1', role: 'focus' }])
    // 10, 14, 13 (n2, n5, n8) are the right subtree of 8: all out after the first move
    const out = (frame: Frame): string[] => (treeOf(frame).marks ?? []).filter((m) => m.role === 'discarded').map((m) => m.id).sort()
    expect(out(frames[2])).toEqual(['n2', 'n5', 'n8'])
    // 3's right child is 6, so 1 (the left subtree of 3) joins the discarded set
    expect(out(frames[4])).toEqual(['n2', 'n3', 'n5', 'n8'])
    expect(treeOf(frames[2]).marks).toContainEqual({ id: 'n0', role: 'visited' })
    const done = treeOf(frames[frames.length - 1])
    expect(done.marks).toContainEqual({ id: 'n4', role: 'found' })
    expect(done.edgeMarks!.every((e) => e.role === 'found')).toBe(true)
    expect(done.edgeMarks).toHaveLength(2)
  })

  it('counts the nodes still possible down to the one that was found', () => {
    expect(frames.map((f) => f.gauge!.value)).toEqual([9, 9, 5, 5, 3, 3, 1])
    expect(frames.every((f) => f.gauge!.max === 9)).toBe(true)
  })

  it('a missing key walks off the tree: curr becomes null and nothing is found', () => {
    const miss = search.run({ values: [8, 3, 10, 1, 6, 14, 4, 7, 13], key: 5 })
    expect(miss.result).toBe(false)
    const last = miss.frames[miss.frames.length - 1]
    expect(last.at).toBe('done')
    expect(last.say).toMatch(/fell off the tree/)
    expect(pointerTarget(miss.frames[miss.frames.length - 2], 'curr')).toBeNull()
    expect(treeOf(last).marks?.some((m) => m.role === 'found')).toBe(false)
  })

  it('sorted input makes a chain: finding 7 takes 7 compares', () => {
    const chain = search.run({ values: [1, 2, 3, 4, 5, 6, 7], key: 7 })
    expect(chain.frames.filter((f) => f.at === 'compare')).toHaveLength(7)
    expect(chain.frames.filter((f) => f.at === 'right')).toHaveLength(6)
    expect(chain.frames.filter((f) => f.at === 'left')).toHaveLength(0)
  })

  it('a single-node tree: found at the root, or missed in one step', () => {
    expect(search.run({ values: [4], key: 4 }).frames.map((f) => f.at)).toEqual(['init', 'compare', 'done'])
    expect(search.run({ values: [4], key: 9 }).frames.map((f) => f.at)).toEqual(['init', 'compare', 'right', 'done'])
  })

  it('left-or-right predict: the answer is the side the next frame goes to, and equal keys ask nothing', () => {
    const answers = new Set<unknown>()
    let asked = 0
    for (const run of allRuns(search)) {
      run.frames.forEach((frame, i) => {
        if (frame.at === 'compare') {
          const equalHere = pointerTarget(run.frames[i + 1], 'curr') === pointerTarget(frame, 'curr')
          expect(frame.predict === undefined, 'predict exactly when the key differs').toBe(equalHere)
        }
        const p = frame.predict
        if (!p) return
        asked++
        expect(p.tag).toBe('left-or-right')
        expect(frame.at).toBe('compare')
        const next = run.frames[i + 1]
        expect(['left', 'right']).toContain(next.at)
        expect(p.answer).toBe(next.at === 'left' ? 'Go left' : 'Go right')
        answers.add(p.answer)
      })
    }
    expect(asked).toBeGreaterThan(0)
    expect(answers).toEqual(new Set(['Go left', 'Go right']))
  })
})

// ---------------------------------------------------------------------------
// insert
// ---------------------------------------------------------------------------

describe('bst/insert', () => {
  const input = { values: [8, 3, 10, 1, 6, 14], val: 7 }
  const { frames, result } = insert.run(input)

  it('inserts 7: left to 3, right to 6, right again into an empty spot, link, done', () => {
    expect(result).toEqual([8, 3, 1, 6, 7, 10, 14])
    expect(frames.map((f) => f.at)).toEqual(['init', 'compare', 'left', 'compare', 'right', 'compare', 'right', 'link', 'done'])
  })

  it('floats the new node until the link frame, then it is a leaf under 6', () => {
    const floating = frames.map((f) => treeOf(f).floating ?? [])
    expect(floating.map((f) => f.length)).toEqual([1, 1, 1, 1, 1, 1, 1, 0, 0])
    expect(floating[0]).toEqual(['n6'])
    const link = treeOf(frames[7])
    expect(childOf(link, 'n4', 1)).toBe('n6')
    expect(link.edgeMarks).toEqual([{ from: 'n4', to: 'n6', role: 'changed' }])
    expect(link.marks).toContainEqual({ id: 'n6', role: 'changed' })
    expect(inorder(treeOf(frames[8]))).toEqual([1, 3, 6, 7, 8, 10, 14])
    expect(frames[8].say).toMatch(/1, 3, 6, 7, 8, 10, 14: still sorted/)
  })

  it('the link frame changes exactly one link in the whole tree', () => {
    const before = treeOf(frames[6])
    const after = treeOf(frames[7])
    const diffs: string[] = []
    for (const node of after.nodes) {
      const was = before.nodes.find((n) => n.id === node.id)!
      node.children.forEach((c, side) => {
        if (c !== was.children[side]) diffs.push(`${node.id}[${side}]: ${was.children[side]} -> ${c}`)
      })
    }
    expect(diffs).toEqual(['n4[1]: null -> n6'])
  })

  it('parent trails curr: it is absent at the root and sits on the node curr just left', () => {
    expect(pointerTarget(frames[0], 'parent')).toBeUndefined()
    expect(pointerTarget(frames[1], 'parent')).toBeUndefined()
    expect(pointerTarget(frames[2], 'parent')).toBe('n0')
    expect(pointerTarget(frames[2], 'curr')).toBe('n1')
    expect(pointerTarget(frames[6], 'parent')).toBe('n4')
    expect(pointerTarget(frames[6], 'curr')).toBeNull()
  })

  it('a new smallest value goes left all the way down, and a sorted input makes a chain', () => {
    const small = insert.run({ values: [8, 3, 10, 1, 6, 14], val: 0 })
    expect(small.frames.filter((f) => f.at === 'left')).toHaveLength(3)
    expect(small.result).toEqual([8, 3, 1, 0, 6, 10, 14])
    const chain = insert.run({ values: [1, 2, 3, 4, 5, 6, 7, 8], val: 9 })
    expect(chain.frames.filter((f) => f.at === 'compare')).toHaveLength(8)
    expect(chain.result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('a one-node tree takes the new value as its only child', () => {
    const one = insert.run({ values: [5], val: 9 })
    expect(one.frames.map((f) => f.at)).toEqual(['init', 'compare', 'right', 'link', 'done'])
    expect(one.result).toEqual([5, 9])
  })

  it('left-or-right and where-it-lands predicts tell the truth', () => {
    const seen = new Set<string>()
    for (const run of allRuns(insert)) {
      run.frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        seen.add(`${p.tag}/${p.kind}`)
        const next = run.frames[i + 1]
        if (p.tag === 'left-or-right') {
          expect(frame.at).toBe('compare')
          expect(['left', 'right']).toContain(next.at)
          expect(p.answer).toBe(next.at === 'left' ? 'Go left' : 'Go right')
        } else {
          expect(p.tag).toBe('where-it-lands')
          expect(frame.at === 'left' || frame.at === 'right').toBe(true)
          expect(pointerTarget(frame, 'curr'), 'curr fell off the tree').toBeNull()
          expect(next.at).toBe('link')
          // the answer is the node the new one ends up hanging under
          const scene = treeOf(next)
          const newId = `n${(run.input as { values: number[] }).values.length}`
          expect(scene.nodes.map((n) => n.id)).toContain(newId)
          expect(parentOf(scene, newId)).toBe(p.answer)
        }
      })
    }
    expect(seen).toEqual(new Set(['left-or-right/choice', 'where-it-lands/cell']))
  })
})

// ---------------------------------------------------------------------------
// delete
// ---------------------------------------------------------------------------

describe('bst/delete', () => {
  const tree = [8, 3, 10, 1, 6, 4, 7, 14, 13]
  // ids: 8:n0 3:n1 10:n2 1:n3 6:n4 4:n5 7:n6 14:n7 13:n8

  describe('case 3: two children (the default preset)', () => {
    const { frames, result } = del.run({ values: tree, key: 3 })

    it('walks to 3, finds the successor 4, copies it up, and removes the old 4', () => {
      expect(result).toEqual([8, 4, 1, 6, 7, 10, 14, 13])
      expect(frames.map((f) => f.at)).toEqual(['init', 'search', 'walk', 'search', 'case', 'successor', 'copy', 'relink', 'done'])
      expect(frames[3].say).toMatch(/curr is 3: that's the node to delete/)
      expect(frames[4].say).toMatch(/^Case 3, two children \(1 and 6\)/)
    })

    it('finds the successor by going right once, then left as far as possible', () => {
      const succ = frames[5]
      expect(pointerTarget(succ, 'succ')).toBe('n5')
      expect(pointerTarget(succ, 'curr')).toBe('n1')
      expect(treeOf(succ).edgeMarks).toEqual([
        { from: 'n1', to: 'n4', role: 'focus' },
        { from: 'n4', to: 'n5', role: 'focus' },
      ])
      expect(succ.say).toMatch(/6 → 4/)
    })

    it('copies the value into the same node (same id) and leaves a duplicate for one frame', () => {
      const copy = treeOf(frames[6])
      expect(valueOf(copy, 'n1')).toBe(4)
      expect(valueOf(copy, 'n5')).toBe(4)
      expect(copy.marks).toContainEqual({ id: 'n1', role: 'changed' })
      expect(copy.marks).toContainEqual({ id: 'n5', role: 'discarded' })
      expect(pointerTarget(frames[6], 'curr')).toBe('n5')
      expect(pointerTarget(frames[6], 'parent')).toBe('n4')
    })

    it('relink lifts the old 4 out of the tree and the last frame drops it', () => {
      const relink = treeOf(frames[7])
      expect(relink.floating).toEqual(['n5'])
      expect(childOf(relink, 'n4', 0)).toBeNull()
      expect(relink.marks).toContainEqual({ id: 'n5', role: 'discarded' })
      expect(frames[7].say).toMatch(/^6's left link now points at null/)
      const done = treeOf(frames[8])
      expect(done.nodes.map((n) => n.id).sort()).toEqual(['n0', 'n1', 'n2', 'n3', 'n4', 'n6', 'n7', 'n8'])
      expect(done.pointers ?? []).toEqual([])
      expect(preorder(done)).toEqual(result)
      expect(inorder(done)).toEqual([1, 4, 6, 7, 8, 10, 13, 14])
    })

    it('a successor that is the right child itself needs no leftward walk', () => {
      const r = del.run({ values: [8, 3, 10, 1, 6], key: 3 })
      const succ = r.frames.find((f) => f.at === 'successor')!
      expect(pointerTarget(succ, 'succ')).toBe('n4')
      expect(succ.say).toMatch(/^Go right to 6\. It has no left child/)
      expect(r.result).toEqual([8, 6, 1, 10])
    })
  })

  describe('case 1: a leaf', () => {
    const { frames, result } = del.run({ values: tree, key: 13 })
    it('cuts the link from the parent and skips successor and copy', () => {
      expect(result).toEqual([8, 3, 1, 6, 4, 7, 10, 14])
      expect(frames.map((f) => f.at)).toEqual(['init', 'search', 'walk', 'search', 'walk', 'search', 'walk', 'search', 'case', 'relink', 'done'])
      expect(frames[frames.length - 3].say).toMatch(/^Case 1, leaf/)
      const relink = treeOf(frames[frames.length - 2])
      expect(childOf(relink, 'n7', 0)).toBeNull()
      expect(relink.floating).toEqual(['n8'])
    })
  })

  describe('case 2: one child', () => {
    const { frames, result } = del.run({ values: tree, key: 10 })
    it('lifts the only child into the gap', () => {
      expect(result).toEqual([8, 3, 1, 6, 4, 7, 14, 13])
      expect(frames.map((f) => f.at)).toEqual(['init', 'search', 'walk', 'search', 'case', 'relink', 'done'])
      expect(frames[4].say).toMatch(/^Case 2, one child \(14\)/)
      const relink = treeOf(frames[5])
      expect(childOf(relink, 'n0', 1)).toBe('n7')
      expect(relink.edgeMarks).toEqual([{ from: 'n0', to: 'n7', role: 'changed' }])
      expect(frames[5].say).toMatch(/^8's right link now points at 14/)
    })
  })

  describe('edges of the algorithm', () => {
    it('deleting the root with two children copies the successor into it', () => {
      const r = del.run({ values: tree, key: 8 })
      expect(r.result).toEqual([10, 3, 1, 6, 4, 7, 14, 13])
      const copy = treeOf(r.frames.find((f) => f.at === 'copy')!)
      expect(valueOf(copy, 'n0')).toBe(10)
    })

    it('deleting a root with one child makes that child the new root', () => {
      const r = del.run({ values: [5, 8, 9], key: 5 })
      expect(r.result).toEqual([8, 9])
      const relink = r.frames.find((f) => f.at === 'relink')!
      expect(treeOf(relink).root).toBe('n1')
      expect(relink.say).toMatch(/becomes the new root/)
    })

    it('deleting the only node leaves an empty tree', () => {
      const r = del.run({ values: [4], key: 4 })
      expect(r.result).toEqual([])
      const last = r.frames[r.frames.length - 1]
      expect(treeOf(last).root).toBeNull()
      expect(treeOf(last).nodes).toEqual([])
      expect(last.say).toMatch(/empty/)
    })

    it('a missing key walks off the tree and changes nothing', () => {
      const r = del.run({ values: tree, key: 5 })
      expect(r.result).toEqual(preorder(treeOf(del.run({ values: tree, key: 5 }).frames[0])))
      expect(r.frames.some((f) => f.at === 'case' || f.at === 'relink')).toBe(false)
      const search = r.frames.filter((f) => f.at === 'search')
      expect(pointerTarget(search[search.length - 1], 'curr')).toBeNull()
      expect(r.frames[r.frames.length - 1].say).toMatch(/wasn't there/)
    })

    it('the node count drops by exactly one when the key is present, and never changes otherwise', () => {
      for (const { input, frames } of allRuns(del)) {
        const { values, key } = input as { values: number[]; key: number }
        const first = attached(treeOf(frames[0])).length
        const last = attached(treeOf(frames[frames.length - 1])).length
        expect(last, JSON.stringify(input)).toBe(values.includes(key) ? first - 1 : first)
      }
    })
  })

  it('which-case and successor predicts tell the truth', () => {
    const seen = new Set<string>()
    for (const run of allRuns(del)) {
      run.frames.forEach((frame, i) => {
        const p = frame.predict
        if (!p) return
        seen.add(`${p.tag}/${p.kind}/${p.answer}`.replace(/\/n\d+$/, '/node'))
        const next = run.frames[i + 1]
        if (p.tag === 'which-case') {
          expect(frame.at).toBe('search')
          expect(next.at).toBe('case')
          const n = Number(/^Case (\d)/.exec(next.say)![1])
          expect(p.answer).toBe(n === 1 ? 'Leaf: no children' : n === 2 ? 'One child' : 'Two children')
          // and the scene agrees: count the children of curr
          const scene = treeOf(frame)
          const curr = scene.nodes.find((x) => x.id === pointerTarget(frame, 'curr'))!
          expect(curr.children.filter((c) => c !== null).length).toBe(n === 1 ? 0 : n === 2 ? 1 : 2)
        } else {
          expect(p.tag).toBe('successor')
          expect(p.kind).toBe('cell')
          expect(frame.at).toBe('case')
          expect(next.at).toBe('successor')
          expect(p.answer).toBe(pointerTarget(next, 'succ'))
          // the smallest value bigger than the key, among the values in the tree
          const scene = treeOf(frame)
          const curr = valueOf(scene, pointerTarget(frame, 'curr')!)
          const bigger = inorder(scene).filter((v) => v > curr)
          expect(valueOf(scene, p.answer as string)).toBe(Math.min(...bigger))
        }
      })
    }
    expect(seen).toEqual(
      new Set(['which-case/choice/Leaf: no children', 'which-case/choice/One child', 'which-case/choice/Two children', 'successor/cell/node']),
    )
  })
})

// ---------------------------------------------------------------------------
// Input rules
// ---------------------------------------------------------------------------

describe('bst inputs', () => {
  const second = (tracer: AnyTracer): string => tracer.input.fields[1].name

  it.each(tracers)('$id accepts friendly formats and names limits', (tracer) => {
    const key = second(tracer)
    const { parse } = tracer.input
    const max = tracer.input.limits.maxN
    expect(parse({ values: '[8, 3, 10]', [key]: '20' })).toEqual({ ok: true, value: { values: [8, 3, 10], [key]: 20 } })
    expect(parse({ values: '4 −1 2', [key]: '9' })).toEqual({ ok: true, value: { values: [4, -1, 2], [key]: 9 } })
    expect(parse({ values: Array.from({ length: max + 1 }, (_, i) => String(i)).join(','), [key]: '1' })).toMatchObject({
      ok: false,
      field: 'values',
      error: expect.stringMatching(new RegExp(`at most ${max}`)),
    })
    expect(parse({ values: '1, 100', [key]: '1' })).toMatchObject({ ok: false, field: 'values', error: expect.stringMatching(/-99 and 99/) })
    expect(parse({ values: '1, two', [key]: '1' })).toMatchObject({ ok: false, field: 'values', error: expect.stringMatching(/"two"/) })
    expect(parse({ values: '3, 5, 3', [key]: '1' })).toMatchObject({ ok: false, field: 'values', error: expect.stringMatching(/3 appears twice/) })
    expect(parse({ values: '3, 5', [key]: '' })).toMatchObject({ ok: false, field: key })
    expect(parse({ values: '3, 5', [key]: '100' })).toMatchObject({ ok: false, field: key, error: expect.stringMatching(/-99 and 99/) })
  })

  it('search and delete take up to 9 values, insert takes up to 8 so the result stays at 9 nodes', () => {
    expect(search.input.limits.maxN).toBe(9)
    expect(del.input.limits.maxN).toBe(9)
    expect(insert.input.limits.maxN).toBe(8)
    for (let seed = 1; seed <= 200; seed++) {
      const { values, val } = insert.input.random(seed) as { values: number[]; val: number }
      expect(values.length + 1).toBeLessThanOrEqual(9)
      expect(values).not.toContain(val)
    }
  })

  it('search and delete accept a key that is not in the tree', () => {
    expect(search.input.parse({ values: '1, 2, 3', key: '9' })).toEqual({ ok: true, value: { values: [1, 2, 3], key: 9 } })
    expect(del.input.parse({ values: '1, 2, 3', key: '-5' })).toEqual({ ok: true, value: { values: [1, 2, 3], key: -5 } })
  })

  it('insert refuses a value that is already in the tree, and says why', () => {
    expect(insert.input.parse({ values: '1, 2, 3', val: '2' })).toMatchObject({
      ok: false,
      field: 'val',
      error: expect.stringMatching(/2 is already in the tree/),
    })
    expect(insert.input.parse({ values: '1, 2, 3', val: '4' })).toEqual({ ok: true, value: { values: [1, 2, 3], val: 4 } })
  })
})

// ---------------------------------------------------------------------------
// The lesson file wires up to these tracers
// ---------------------------------------------------------------------------

describe('content/topics/bst.json', () => {
  const lesson = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../../content/topics/bst.json', import.meta.url)), 'utf8')) as LessonV2
  const byId = new Map(tracers.map((t) => [t.id as string, t]))

  it('is a valid v2 lesson', () => {
    expect(lessonV2Schema.safeParse(lesson).success).toBe(true)
    expect(lesson.slug).toBe('bst')
  })

  it('has three tracks on the three tracers, each asking predict tags its guided run really emits', () => {
    expect(lesson.stage.tracks.map((t) => t.tracer)).toEqual(['bst/search', 'bst/insert', 'bst/delete'])
    for (const track of lesson.stage.tracks) {
      const tracer = byId.get(track.tracer)!
      expect(tracer, track.tracer).toBeDefined()
      const preset = tracer.input.presets[track.preset ?? 0]
      const emitted = tracer.run(preset.value).frames.flatMap((f) => (f.predict ? [f.predict.tag] : []))
      expect(track.predict!.max).toBeLessThanOrEqual(4)
      for (const tag of track.predict!.tags) expect(emitted, `${track.id}: tag ${tag} in the guided run`).toContain(tag)
    }
  })

  it('shows every rule of every tracer in its guided (first) preset', () => {
    for (const tracer of tracers) {
      const used = new Set(tracer.run(tracer.input.presets[0].value).frames.map((f) => f.at))
      expect(Object.keys(tracer.anchors).filter((a) => !used.has(a)), tracer.id).toEqual([])
    }
  })

  it('ties the template to insert: every pseudocode anchor is one of its rules, and every rule has a line', () => {
    expect(lesson.template.tracer).toBe('bst/insert')
    const anchors = Object.keys(insert.anchors).sort()
    const used = lesson.template.pseudocode.flatMap((l) => (l.anchor ? [l.anchor] : []))
    for (const a of used) expect(anchors).toContain(a)
    expect([...new Set(used)].sort()).toEqual(anchors)
  })

  it('draws the shape as a valid 6-node BST whose callouts point at nodes that exist', () => {
    const scene = lesson.shape.scene
    expect(scene.kind).toBe('tree')
    if (scene.kind !== 'tree') return
    expect(scene.nodes).toHaveLength(6)
    expect(attached(scene)).toHaveLength(6)
    expect(isStrictlyIncreasing(inorder(scene))).toBe(true)
    expect(lesson.shape.callouts.length).toBeGreaterThanOrEqual(2)
    expect(lesson.shape.callouts.length).toBeLessThanOrEqual(3)
    for (const c of lesson.shape.callouts) {
      const [kind, id] = c.target.split(':')
      expect(kind).toBe('node')
      expect(scene.nodes.map((n) => n.id)).toContain(id)
      expect(c.text.split(/\s+/).length).toBeLessThanOrEqual(6)
    }
  })

  it('runs the search and delete examples in the stage with their own tracers, and the code refs exist', () => {
    const find = (title: string) => lesson.examples.find((e) => e.title === title)!
    expect(find('Search in a Binary Search Tree').tracer).toBe('bst/search')
    expect(find('Search in a Binary Search Tree').code).toBe('bst/search')
    expect(find('Delete Node in a BST').tracer).toBe('bst/delete')
    expect(find('Delete Node in a BST').code).toBe('bst/delete')
    expect(find('Validate Binary Search Tree').code).toBe('bst/validate')
  })

  it('the Delete Node example is what the tracer does: [5,3,6,2,4,null,7] minus 3 is [5,4,6,2,null,null,7]', () => {
    // values inserted in this order build exactly that tree
    const r = del.run({ values: [5, 3, 6, 2, 4, 7], key: 3 })
    expect(r.result).toEqual([5, 4, 2, 6, 7])
  })

  it('mentions the worst case wherever it quotes O(log n)', () => {
    const text = JSON.stringify(lesson)
    expect(text).toMatch(/O\(n\)/)
    expect(lesson.template.time).toMatch(/O\(h\)/)
    expect(lesson.template.notes!.join(' ')).toMatch(/balanced/)
  })
})
