import { describe, expect, it } from 'vitest'
import { TRACER_IDS, TRACER_LOADERS, hasTracer, loadTracer } from '@/lib/tracers'
import { isStub } from '@/lib/tracers/stub'
import { describeTracer } from './harness'

/** The golden path. Changing this list means changing the registry deliberately. */
const GOLDEN_IDS = [
  'arrays/access',
  'arrays/insert',
  'arrays/delete',
  'arrays/linear-search',
  'two-pointers/pair-sum',
  'two-pointers/dedupe',
  'sliding-window/max-sum-k',
  'sliding-window/min-len-target',
  'linked-lists/traverse',
  'linked-lists/insert-after',
  'linked-lists/delete',
  'linked-lists/reverse',
  'hash-maps/put-get',
  'hash-maps/two-sum',
  'binary-search/classic',
  'binary-search/first-true',
]

// Top-level await: vitest runs ESM, but tsconfig sets no `target`, so tsc flags it (TS1378).
const loaded = await Promise.all(TRACER_IDS.map(async (id) => ({ id, tracer: await loadTracer(id) })))

describe('tracer registry', () => {
  it('registers every golden-path id', () => {
    expect([...TRACER_IDS].sort()).toEqual(Object.keys(TRACER_LOADERS).sort())
    for (const id of GOLDEN_IDS) expect(TRACER_IDS).toContain(id)
  })

  it('loads every id, and a tracer id always equals its registry key', () => {
    for (const { id, tracer } of loaded) expect(tracer.id, `registry key "${id}"`).toBe(id)
  })

  it('knows which ids it has', () => {
    expect(hasTracer('sliding-window/max-sum-k')).toBe(true)
    expect(hasTracer('nope/nothing')).toBe(false)
    expect(hasTracer('toString')).toBe(false)
  })

  it('rejects unknown ids with a readable message', async () => {
    await expect(loadTracer('nope/nothing')).rejects.toThrow(/Unknown tracer "nope\/nothing"/)
  })

  it('implements at least the pilot tracer', () => {
    expect(loaded.filter(({ tracer }) => !isStub(tracer)).map(({ id }) => id)).toContain('sliding-window/max-sum-k')
  })

  describe('stubs', () => {
    const stubs = loaded.filter(({ tracer }) => isStub(tracer))
    if (stubs.length === 0) {
      it('none left — every registered tracer is implemented', () => {
        expect(stubs).toEqual([])
      })
      return
    }
    it.each(stubs.map(({ id }) => id))('%s throws "not implemented" until the lesson is written', async (id) => {
      const tracer = await loadTracer(id)
      expect(() => tracer.run({})).toThrow(/not implemented/)
      expect(() => tracer.reference({})).toThrow(/not implemented/)
    })
  })
})

// The mechanism: every real (non-stub) tracer gets the full contract suite for free.
for (const { tracer } of loaded) {
  if (!isStub(tracer)) describeTracer(tracer)
}
