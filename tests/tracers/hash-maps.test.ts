/**
 * Extra checks for the hash-maps tracers (put-get, two-sum). The generic contract
 * suite (frames, anchors, code parity, parse, correctness...) runs from
 * registry.test.ts; the harness only inspects array scenes, so this file also
 * checks the hash-map scenes: bucket indices in range, slot indices valid,
 * every entry in the bucket its key hashes to, and that predict answers are true.
 */
import { describe, expect, it } from 'vitest'
import putGet from '@/lib/tracers/hash-maps/put-get'
import type { PutGetInput } from '@/lib/tracers/hash-maps/put-get'
import twoSum from '@/lib/tracers/hash-maps/two-sum'
import type { TwoSumInput } from '@/lib/tracers/hash-maps/two-sum'
import type { Frame, HashMapScene, Scene } from '@/lib/engine/types'

const M = 5

/** Every hash-map scene inside a scene (composites included). */
function hashMapsIn(scene: Scene): HashMapScene[] {
  if (scene.kind === 'hash-map') return [scene]
  if (scene.kind === 'composite') return scene.parts.flatMap((p) => hashMapsIn(p.scene))
  return []
}

/** Structural checks shared by both tracers. */
function checkHashMap(scene: HashMapScene, where: string): void {
  expect(scene.buckets, `${where}: bucket count`).toHaveLength(M)
  scene.buckets.forEach((chain, b) => {
    const keys = new Set<number | string>()
    for (const entry of chain) {
      expect(typeof entry.key, `${where}: key type`).toBe('number')
      expect((entry.key as number) % M, `${where}: key ${entry.key} sits in bucket ${b}`).toBe(b)
      expect(keys.has(entry.key), `${where}: duplicate key ${entry.key} in bucket ${b}`).toBe(false)
      keys.add(entry.key)
    }
  })
  if (scene.hashing) {
    const { key, hash, bucket } = scene.hashing
    expect(Number.isInteger(bucket) && bucket >= 0 && bucket < M, `${where}: hashing bucket ${bucket} out of 0..${M - 1}`).toBe(true)
    expect(hash, `${where}: hash(key) is the key itself`).toBe(key)
    expect(bucket, `${where}: hashing bucket is key % ${M}`).toBe((key as number) % M)
  }
  for (const m of scene.marks ?? []) {
    expect(Number.isInteger(m.bucket) && m.bucket >= 0 && m.bucket < M, `${where}: mark bucket ${m.bucket} out of 0..${M - 1}`).toBe(true)
    if (m.slot !== undefined) {
      const len = scene.buckets[m.bucket].length
      expect(Number.isInteger(m.slot) && m.slot >= 0 && m.slot < len, `${where}: mark slot ${m.slot} (bucket ${m.bucket}, role ${m.role}) out of 0..${len - 1}`).toBe(true)
    }
  }
  for (const a of scene.annotations ?? []) {
    const match = /^bucket:(\d+)$/.exec(a.target)
    expect(match, `${where}: annotation target "${a.target}"`).not.toBeNull()
    if (match) expect(Number(match[1]) < M, `${where}: annotation bucket in range`).toBe(true)
  }
}

function chainsOf(scene: Scene): Array<Array<[number, string | number | undefined]>> {
  const map = hashMapsIn(scene)[0]
  return map.buckets.map((chain) => chain.map((e): [number, string | number | undefined] => [e.key as number, e.value]))
}

// ===========================================================================
// hash-maps/put-get
// ===========================================================================

const pg = putGet.input
const pgDefault = pg.presets[0].value as PutGetInput

function allPutGetRuns(): Array<{ input: PutGetInput; frames: Frame[] }> {
  const inputs: PutGetInput[] = [...pg.presets.map((p) => p.value), ...Array.from({ length: 200 }, (_, i) => pg.random(i + 1))]
  return inputs.map((value) => ({ input: value, frames: putGet.run(value).frames }))
}

describe('hash-maps/put-get: default preset', () => {
  const { frames, result } = putGet.run(pgDefault)

  it('has the teaching ops: a clean insert, a collision, an update, two lookups', () => {
    expect(pgDefault.ops).toEqual([
      { op: 'put', key: 12, value: 'a' },
      { op: 'put', key: 8, value: 'b' },
      { op: 'put', key: 17, value: 'c' },
      { op: 'put', key: 12, value: 'd' },
      { op: 'get', key: 17 },
      { op: 'get', key: 22 },
    ])
  })

  it('ends with 12 and 17 chained in bucket 2, 8 in bucket 3; get 17 finds c, get 22 finds nothing', () => {
    expect(result.gets).toEqual(['c', null])
    expect(result.table).toEqual([[], [], [[12, 'd'], [17, 'c']], [[8, 'b']], []])
  })

  it('walks init, 6 hashes, 6 compares, 3 inserts, update, found, missing', () => {
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect(frames).toHaveLength(19)
    expect([count('init'), count('hash'), count('walk'), count('insert'), count('update'), count('found'), count('missing')]).toEqual([1, 6, 6, 3, 1, 1, 1])
    expect(frames[0].at).toBe('init')
  })

  it('shows the chain growing in bucket 2 on the third put', () => {
    const insert = frames.filter((f) => f.at === 'insert')[2]
    expect(chainsOf(insert.scene)[2]).toEqual([[12, 'a'], [17, 'c']])
    expect(insert.say).toMatch(/chains 2 entries/)
  })

  it('"Everything collides" puts four keys in one chain of four, more entries than buckets is possible', () => {
    const { result: r, frames: f } = putGet.run(pg.presets[1].value as PutGetInput)
    expect(r.table[0]).toEqual([[5, 'a'], [10, 'b'], [15, 'c'], [20, 'd']])
    expect(f[f.length - 1].at).toBe('found')
    // Finding 20 means comparing against all four entries.
    expect(f.filter((x) => x.at === 'walk').length).toBeGreaterThanOrEqual(4 + 3 + 2 + 1)
  })
})

describe('hash-maps/put-get: scenes', () => {
  it('keep bucket indices, slot indices and hashing in range with every entry in key % 5', () => {
    for (const { frames } of allPutGetRuns()) {
      frames.forEach((frame, i) => {
        const maps = hashMapsIn(frame.scene)
        expect(maps, `frame ${i} has exactly one hash-map`).toHaveLength(1)
        checkHashMap(maps[0], `frame ${i}`)
      })
    }
  })

  it('hash frames focus the bucket; walk frames compare one slot; insert/update flash the entry; found/missing resolve', () => {
    for (const { frames } of allPutGetRuns()) {
      for (const frame of frames) {
        const map = hashMapsIn(frame.scene)[0]
        const marks = map.marks ?? []
        const roles = marks.map((m) => m.role)
        const bucket = map.hashing?.bucket
        if (frame.at === 'init') {
          expect(map.hashing ?? null).toBeNull()
          expect(map.buckets.every((c) => c.length === 0)).toBe(true)
        }
        if (frame.at === 'hash') expect(marks).toEqual([{ bucket, role: 'focus' }])
        if (frame.at === 'walk') {
          expect(roles.filter((r) => r === 'compare')).toHaveLength(1)
          expect(roles.every((r) => r === 'compare' || r === 'visited')).toBe(true)
        }
        if (frame.at === 'insert' || frame.at === 'update') {
          expect(marks).toHaveLength(1)
          expect(marks[0].role).toBe('changed')
          expect(marks[0].slot).toBeDefined()
        }
        if (frame.at === 'found') expect(marks.map((m) => m.role)).toEqual(['found'])
        if (frame.at === 'missing') expect(marks).toEqual([{ bucket, role: 'error' }])
      }
    }
  })

  it('the gauge tracks entries vs 5 buckets and matches the number of entries drawn', () => {
    for (const { frames } of allPutGetRuns()) {
      for (const frame of frames) {
        const drawn = hashMapsIn(frame.scene)[0].buckets.reduce((a, c) => a + c.length, 0)
        expect(frame.gauge).toEqual({ value: drawn, max: M, label: `Entries vs ${M} buckets` })
        expect(frame.vars.size).toBe(drawn)
      }
    }
  })

  it('walk compares exactly the keys of one chain, in chain order, and stops at a match', () => {
    for (const { frames } of allPutGetRuns()) {
      frames.forEach((frame, i) => {
        if (frame.at !== 'hash') return
        const map = hashMapsIn(frame.scene)[0]
        const key = frame.vars.key as number
        const chain = map.buckets[key % M]
        const walks: Frame[] = []
        for (let j = i + 1; frames[j]?.at === 'walk'; j++) walks.push(frames[j])
        const matchAt = chain.findIndex((e) => e.key === key)
        expect(walks).toHaveLength(matchAt >= 0 ? matchAt + 1 : chain.length)
        walks.forEach((w, s) => {
          const compare = (hashMapsIn(w.scene)[0].marks ?? []).find((m) => m.role === 'compare')!
          expect(compare.slot).toBe(s)
          expect(compare.bucket).toBe(key % M)
        })
      })
    }
  })

  it('every put or get ends with exactly one outcome frame', () => {
    for (const { input, frames } of allPutGetRuns()) {
      const outcomes = frames.filter((f) => ['insert', 'update', 'found', 'missing'].includes(f.at))
      expect(outcomes).toHaveLength(input.ops.length)
      const hashes = frames.filter((f) => f.at === 'hash')
      expect(hashes.map((f) => f.vars.key)).toEqual(input.ops.map((o) => o.key))
    }
  })
})

describe('hash-maps/put-get: predicts tell the truth', () => {
  it('which-bucket: the answer is key % 5 and the next frame hashes to that bucket', () => {
    let asked = 0
    const answers = new Set<unknown>()
    for (const { input, frames } of allPutGetRuns()) {
      let opIndex = 0
      frames.forEach((frame, i) => {
        if (frame.at === 'hash') opIndex++
        const p = frame.predict
        if (p?.tag !== 'which-bucket') return
        asked++
        const next = frames[i + 1]
        expect(next.at, 'the reveal is the hash frame').toBe('hash')
        const op = input.ops[opIndex] // opIndex counts hashes seen so far, so this is the upcoming op
        expect(p.kind).toBe('cell')
        expect(typeof p.answer).toBe('number')
        expect(p.answer).toBe(op.key % M)
        expect(next.vars.key).toBe(op.key)
        expect(hashMapsIn(next.scene)[0].hashing?.bucket).toBe(p.answer)
        expect(p.prompt).toContain(`key ${op.key}`)
        answers.add(p.answer)
      })
      // Every operation (except none) is asked about: one per op.
      expect(frames.filter((f) => f.predict?.tag === 'which-bucket')).toHaveLength(input.ops.length)
    }
    expect(asked).toBeGreaterThan(0)
    expect(answers.size, 'answers vary across buckets').toBeGreaterThanOrEqual(4)
  })

  it('collision: only asked for a new key in an occupied bucket, and the entry is chained, not overwritten', () => {
    let asked = 0
    for (const { frames } of allPutGetRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'collision') return
        asked++
        expect(frame.at).toBe('hash')
        expect(p.kind).toBe('choice')
        expect(p.options).toContain(p.answer)
        expect(p.answer).toMatch(/^Chain it after \d+$/)
        const key = frame.vars.key as number
        const before = hashMapsIn(frame.scene)[0].buckets[key % M]
        expect(before.length, 'bucket is occupied').toBeGreaterThan(0)
        expect(before.some((e) => e.key === key), 'key is new').toBe(false)
        expect(p.answer).toBe(`Chain it after ${before[before.length - 1].key}`)
        expect(p.prompt).toContain(`${key} lands in bucket ${key % M}`)
        // The reveal is the first compare; the entry lands at the end of the chain.
        expect(frames[i + 1].at).toBe('walk')
        const insert = frames.slice(i + 1).find((f) => f.at === 'insert')!
        const after = hashMapsIn(insert.scene)[0].buckets[key % M]
        expect(after.map((e) => e.key)).toEqual([...before.map((e) => e.key), key])
      })
    }
    expect(asked).toBeGreaterThan(0)
  })

  it('collision: the right answer is not always in the same position', () => {
    const positions = new Set<number>()
    for (const { frames } of allPutGetRuns()) {
      for (const frame of frames) {
        const p = frame.predict
        if (p?.tag === 'collision') positions.add(p.options!.indexOf(p.answer as string))
      }
    }
    expect(positions).toEqual(new Set([0, 1]))
  })

  it('the default preset asks both predict kinds, and no collision question for a key already stored', () => {
    const tags = new Set(putGet.run(pgDefault).frames.flatMap((f) => (f.predict ? [f.predict.tag] : [])))
    expect(tags).toEqual(new Set(['which-bucket', 'collision']))
    // put 12 d (key already present) must not ask about collisions.
    const frames = putGet.run(pgDefault).frames
    const hashes = frames.filter((f) => f.at === 'hash')
    expect(hashes[3].vars.key).toBe(12)
    expect(hashes[3].predict).toBeUndefined()
    expect(hashes[2].predict?.tag).toBe('collision')
    expect(hashes[2].predict?.prompt).toBe('17 lands in bucket 2, where 12 already lives. What happens?')
  })
})

describe('hash-maps/put-get: input rules', () => {
  const ok = (ops: string) => pg.parse({ ops })

  it('accepts friendly formats', () => {
    expect(ok('put 12 a, get 12')).toEqual({ ok: true, value: { ops: [{ op: 'put', key: 12, value: 'a' }, { op: 'get', key: 12 }] } })
    expect(ok('PUT 3 x7; Get 3\nget 4')).toEqual({
      ok: true,
      value: { ops: [{ op: 'put', key: 3, value: 'x7' }, { op: 'get', key: 3 }, { op: 'get', key: 4 }] },
    })
    expect(ok('  put 0 a ,, get 99  ')).toMatchObject({ ok: true })
  })

  it('rejects unknown operations, wrong arity, bad keys and values, with a reason', () => {
    expect(ok('delete 3')).toMatchObject({ ok: false, field: 'ops', error: expect.stringMatching(/"delete" isn't an operation/) })
    expect(ok('put 3')).toMatchObject({ ok: false, field: 'ops', error: expect.stringMatching(/key and a value/) })
    expect(ok('put 12 a put 7 b')).toMatchObject({ ok: false, field: 'ops', error: expect.stringMatching(/Separate operations with commas/) })
    expect(ok('get')).toMatchObject({ ok: false, field: 'ops', error: expect.stringMatching(/just a key/) })
    expect(ok('get 3 4')).toMatchObject({ ok: false, field: 'ops', error: expect.stringMatching(/just a key/) })
    expect(ok('put 100 a')).toMatchObject({ ok: false, field: 'ops', error: expect.stringMatching(/0 to 99/) })
    expect(ok('put -1 a')).toMatchObject({ ok: false, field: 'ops', error: expect.stringMatching(/0 to 99/) })
    expect(ok('get 1.5')).toMatchObject({ ok: false, field: 'ops', error: expect.stringMatching(/"1.5"/) })
    expect(ok('put 3 abcd')).toMatchObject({ ok: false, field: 'ops', error: expect.stringMatching(/1 to 3 letters or digits/) })
    expect(ok('put 3 a-b')).toMatchObject({ ok: false, field: 'ops' })
    expect(ok('')).toMatchObject({ ok: false, field: 'ops', error: expect.stringMatching(/at least one/) })
  })

  it('names the limit when there are too many operations', () => {
    expect(ok(Array(9).fill('get 1').join(', '))).toMatchObject({ ok: false, field: 'ops', error: expect.stringMatching(/at most 8/) })
    expect(ok(Array(8).fill('get 1').join(', '))).toMatchObject({ ok: true })
  })

  it('keeps the error short even for a very long token', () => {
    const result = ok(`put 3 ${'z'.repeat(200)}`)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.length).toBeLessThanOrEqual(140)
  })

  it('random inputs mix puts and gets, hits and misses, collisions and updates', () => {
    const runs = allPutGetRuns()
    const has = (at: string): boolean => runs.some((r) => r.frames.some((f) => f.at === at))
    for (const at of ['insert', 'update', 'found', 'missing', 'walk']) expect(has(at), at).toBe(true)
    expect(runs.some((r) => r.frames.some((f) => f.predict?.tag === 'collision'))).toBe(true)
    for (const { input } of runs) {
      expect(input.ops.length).toBeGreaterThanOrEqual(1)
      expect(input.ops.length).toBeLessThanOrEqual(8)
    }
  })
})

// ===========================================================================
// hash-maps/two-sum
// ===========================================================================

const ts = twoSum.input
const tsDefault = ts.presets[0].value as TwoSumInput

function allTwoSumRuns(): Array<{ input: TwoSumInput; frames: Frame[] }> {
  const inputs: TwoSumInput[] = [
    ...ts.presets.map((p) => p.value),
    ...Array.from({ length: 200 }, (_, i) => ts.random(i + 1)),
    // Repeated values and partners below zero.
    { nums: [3, 3], target: 6 },
    { nums: [4, 4, 4, 1], target: 5 },
    { nums: [9, 8, 1], target: 3 },
  ]
  return inputs.map((value) => ({ input: value, frames: twoSum.run(value).frames }))
}

/** The array part and the map part of a two-sum frame. */
function parts(frame: Frame) {
  if (frame.scene.kind !== 'composite') throw new Error('expected a composite scene')
  const [arrayPart, mapPart] = frame.scene.parts.map((p) => p.scene)
  if (arrayPart.kind !== 'array' || mapPart.kind !== 'hash-map') throw new Error('expected array + hash-map parts')
  return { array: arrayPart, map: mapPart }
}

describe('hash-maps/two-sum: presets', () => {
  it('has the three teaching presets and their answers', () => {
    expect(ts.presets.map((p) => p.value)).toEqual([
      { nums: [8, 3, 2, 4, 6], target: 9 },
      { nums: [2, 7, 11, 15], target: 9 },
      { nums: [5, 1, 3, 4], target: 10 },
    ])
    expect(ts.presets.map((p) => twoSum.run(p.value).result)).toEqual([[1, 4], [0, 1], []])
  })

  it('default preset: five lookups, four misses then a hit, with 8 and 3 chained in bucket 3', () => {
    const { frames, result } = twoSum.run(tsDefault)
    expect(result).toEqual([1, 4])
    const count = (at: string): number => frames.filter((f) => f.at === at).length
    expect([count('init'), count('need'), count('check'), count('store'), count('found'), count('done')]).toEqual([1, 5, 5, 4, 1, 1])
    expect(frames).toHaveLength(17)
    const storeThree = frames.filter((f) => f.at === 'store')[1]
    expect(chainsOf(storeThree.scene)[3]).toEqual([[8, 0], [3, 1]])
    const lastCheck = frames.filter((f) => f.at === 'check')[4]
    expect(lastCheck.say).toBe('Look only in bucket 3: 3 is there, stored from index 1.')
    const found = frames.find((f) => f.at === 'found')!
    expect(found.say).toBe('3 + 6 = 9, so indices 1 and 4 are the pair.')
    expect(frames[frames.length - 1].say).toBe('Done — return [1, 4]: 3 + 6 = 9.')
  })

  it('a number never pairs with itself: [5, 1, 3, 4] with target 10 finds nothing', () => {
    const { frames, result } = twoSum.run({ nums: [5, 1, 3, 4], target: 10 })
    expect(result).toEqual([])
    expect(frames.some((f) => f.at === 'found')).toBe(false)
    const first = frames.find((f) => f.at === 'need')!
    expect(first.say).toBe('Index 0 holds 5. To make 10 we need 10 − 5 = 5.')
    // The map was empty when 5 asked for its partner, so the lookup misses.
    const check = frames.find((f) => f.at === 'check')!
    expect(check.say).toMatch(/it is empty/)
    expect(frames[frames.length - 1].at).toBe('done')
    expect(frames[frames.length - 1].say).toMatch(/no two numbers add up to 10/)
  })
})

describe('hash-maps/two-sum: scenes', () => {
  it('every frame is an array + hash-map column; buckets, slots and hashing are valid', () => {
    for (const { frames } of allTwoSumRuns()) {
      frames.forEach((frame, i) => {
        expect(frame.scene.kind).toBe('composite')
        if (frame.scene.kind === 'composite') expect(frame.scene.layout).toBe('column')
        const { map } = parts(frame)
        checkHashMap(map, `frame ${i}`)
      })
    }
  })

  it('the map holds exactly the numbers before i (latest index wins), each with its index', () => {
    for (const { input, frames } of allTwoSumRuns()) {
      for (const frame of frames) {
        const { array, map } = parts(frame)
        expect(array.cells).toEqual(input.nums)
        const i = frame.vars.i as number | null
        // How many numbers have been stored: all before i, and i itself right after the store frame.
        const stored = frame.at === 'init' ? 0 : frame.at === 'store' ? (i as number) + 1 : frame.at === 'done' && frame.vars.answer === null ? input.nums.length : (i as number)
        const expected = new Map<number, number>()
        for (let k = 0; k < stored; k++) expected.set(input.nums[k], k)
        const drawn = new Map<number, number>()
        for (const chain of map.buckets) for (const e of chain) drawn.set(e.key as number, e.value as number)
        expect(drawn, `${frame.at} at i=${i}`).toEqual(expected)
        expect(map.buckets.reduce((a, c) => a + c.length, 0)).toBe(expected.size)
      }
    }
  })

  it('the pointer follows i; cells before i are visited; the current cell is focused until it is stored', () => {
    for (const { frames } of allTwoSumRuns()) {
      for (const frame of frames) {
        const { array } = parts(frame)
        const i = frame.vars.i as number | null
        const roleAt = (index: number) => (array.marks ?? []).find((m) => m.index === index)?.role
        if (frame.at === 'init') {
          expect(array.pointers ?? []).toEqual([])
          expect(array.marks ?? []).toEqual([])
        } else if (frame.at !== 'done') {
          expect(array.pointers).toEqual([{ name: 'i', index: i, role: 'ptrB' }])
        } else {
          expect(array.pointers ?? []).toEqual([])
        }
        if (frame.at === 'need' || frame.at === 'check') expect(roleAt(i as number)).toBe('focus')
        if (frame.at === 'store') expect(roleAt(i as number)).toBe('visited')
        if (frame.at === 'found') {
          const answer = frame.vars.answer as number[]
          expect(answer[1]).toBe(i)
          expect(answer.map(roleAt)).toEqual(['found', 'found'])
        }
        if (frame.at === 'need' || frame.at === 'check' || frame.at === 'store') {
          for (let k = 0; k < (i as number); k++) expect(roleAt(k), `cell ${k}`).toBe('visited')
        }
      }
    }
  })

  it('check hashes the partner we need and looks only in its bucket; store hashes the number being saved', () => {
    for (const { frames } of allTwoSumRuns()) {
      for (const frame of frames) {
        const { map } = parts(frame)
        const need = frame.vars.need as number | null
        if (frame.at === 'check' && need !== null && need >= 0) {
          expect(map.hashing).toEqual({ key: need, hash: need, bucket: need % M })
          const marks = map.marks ?? []
          expect(marks).toHaveLength(1)
          expect(marks[0].bucket).toBe(need % M)
          expect(marks[0].role).toBe(map.buckets[need % M].some((e) => e.key === need) ? 'compare' : 'focus')
          if (marks[0].slot !== undefined) expect(map.buckets[need % M][marks[0].slot].key).toBe(need)
        }
        if (frame.at === 'check' && need !== null && need < 0) {
          expect(map.hashing ?? null).toBeNull()
          expect(frame.say).toMatch(/below zero/)
        }
        if (frame.at === 'store') {
          const key = (parts(frame).array.cells[frame.vars.i as number] as number)
          expect(map.hashing).toEqual({ key, hash: key, bucket: key % M })
          const mark = (map.marks ?? [])[0]
          expect(mark.role).toBe('changed')
          expect(map.buckets[key % M][mark.slot as number]).toEqual({ key, value: frame.vars.i })
        }
      }
    }
  })

  it('found marks the stored partner in the map; vars show target, i, need and answer', () => {
    for (const { input, frames } of allTwoSumRuns()) {
      for (const frame of frames) {
        expect(frame.vars.target).toBe(input.target)
        if (frame.at === 'need' || frame.at === 'check' || frame.at === 'found') {
          const i = frame.vars.i as number
          expect(frame.vars.need).toBe(input.target - input.nums[i])
        }
        if (frame.at === 'found') {
          const { map } = parts(frame)
          const need = frame.vars.need as number
          expect(map.marks).toEqual([{ bucket: need % M, slot: map.buckets[need % M].findIndex((e) => e.key === need), role: 'found' }])
        }
      }
    }
  })
})

describe('hash-maps/two-sum: predicts tell the truth', () => {
  it('seen-it: Yes exactly when the next check frame finds the partner, and then a found frame follows', () => {
    let yes = 0
    let no = 0
    for (const { input, frames } of allTwoSumRuns()) {
      frames.forEach((frame, i) => {
        const p = frame.predict
        if (p?.tag !== 'seen-it') return
        expect(frame.at).toBe('need')
        const reveal = frames[i + 1]
        expect(reveal.at, 'the reveal is the check').toBe('check')
        const idx = frame.vars.i as number
        const need = input.target - input.nums[idx]
        expect(p.prompt).toBe(`Need ${input.target} − ${input.nums[idx]} = ${need}. Is ${need} in the map?`)
        expect(p.options).toEqual(['Yes', 'No'])
        const inMap = input.nums.slice(0, idx).includes(need)
        expect(p.answer).toBe(inMap ? 'Yes' : 'No')
        if (inMap) {
          yes++
          expect(frames[i + 2].at).toBe('found')
          expect(reveal.say).toMatch(/is there, stored from index/)
        } else {
          no++
          expect(frames[i + 2].at).toBe('store')
        }
      })
      // One question per lookup.
      expect(frames.filter((f) => f.predict?.tag === 'seen-it')).toHaveLength(frames.filter((f) => f.at === 'need').length)
    }
    expect(yes).toBeGreaterThan(0)
    expect(no).toBeGreaterThan(0)
  })

  it('the default preset asks one seen-it question per lookup, and only the last answer is Yes', () => {
    const asked = twoSum.run(tsDefault).frames.flatMap((f) => (f.predict ? [f.predict] : []))
    expect(asked.map((p) => p.prompt)).toEqual([
      'Need 9 − 8 = 1. Is 1 in the map?',
      'Need 9 − 3 = 6. Is 6 in the map?',
      'Need 9 − 2 = 7. Is 7 in the map?',
      'Need 9 − 4 = 5. Is 5 in the map?',
      'Need 9 − 6 = 3. Is 3 in the map?',
    ])
    expect(asked.map((p) => p.answer)).toEqual(['No', 'No', 'No', 'No', 'Yes'])
  })
})

describe('hash-maps/two-sum: edge cases', () => {
  it('repeated values: [3, 3] with target 6 returns [0, 1]; the second 3 finds the first', () => {
    const { result, frames } = twoSum.run({ nums: [3, 3], target: 6 })
    expect(result).toEqual([0, 1])
    expect(frames.map((f) => f.at)).toEqual(['init', 'need', 'check', 'store', 'need', 'check', 'found', 'done'])
  })

  it('repeated values that do not pair update the stored index (latest wins)', () => {
    const { frames, result } = twoSum.run({ nums: [4, 4, 4, 1], target: 5 })
    expect(result).toEqual([2, 3])
    const updates = frames.filter((f) => f.at === 'store' && /already stored/.test(f.say))
    expect(updates).toHaveLength(2)
    expect(updates[0].say).toBe('4 is already stored, so update its index to 1.')
  })

  it('a partner below zero is never hashed and the check says why', () => {
    const { frames, result } = twoSum.run({ nums: [9, 8, 1], target: 3 })
    expect(result).toEqual([])
    const first = frames.find((f) => f.at === 'check')!
    expect(first.vars.need).toBe(-6)
    expect(first.say).toBe("-6 is below zero, and every stored number is 0 or more, so it can't be in the map.")
  })

  it('random inputs include real pairs, no-pair runs, collisions in the map and repeated values', () => {
    const runs = allTwoSumRuns()
    const results = runs.map((r) => twoSum.run(r.input).result)
    expect(results.some((r) => r.length === 2)).toBe(true)
    expect(results.some((r) => r.length === 0)).toBe(true)
    expect(runs.some((r) => r.frames.some((f) => f.at === 'store' && f.say.includes('chained after')))).toBe(true)
    expect(runs.some((r) => r.frames.some((f) => /already stored/.test(f.say)))).toBe(true)
  })
})

describe('hash-maps/two-sum: input rules', () => {
  const ok = (nums: string, target: string) => ts.parse({ nums, target })

  it('accepts friendly formats', () => {
    expect(ok('[2, 7, 11]', '9')).toEqual({ ok: true, value: { nums: [2, 7, 11], target: 9 } })
    expect(ok('2 7 11', '0')).toEqual({ ok: true, value: { nums: [2, 7, 11], target: 0 } })
    expect(ok('0, 99', '198')).toEqual({ ok: true, value: { nums: [0, 99], target: 198 } })
  })

  it('rejects negatives, big values and bad targets with a reason', () => {
    expect(ok('1, -2, 2', '3')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/between 0 and 99/) })
    expect(ok('1, 100', '3')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/between 0 and 99/) })
    expect(ok('1, two', '3')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/"two"/) })
    expect(ok('1, 2', '-1')).toMatchObject({ ok: false, field: 'target', error: expect.stringMatching(/between 0 and 198/) })
    expect(ok('1, 2', '199')).toMatchObject({ ok: false, field: 'target' })
    expect(ok('1, 2', '2.5')).toMatchObject({ ok: false, field: 'target' })
    expect(ok('1, 2', '')).toMatchObject({ ok: false, field: 'target' })
  })

  it('names the limit when the list is too long', () => {
    expect(ok(Array(9).fill('1').join(','), '5')).toMatchObject({ ok: false, field: 'nums', error: expect.stringMatching(/at most 8/) })
  })
})
