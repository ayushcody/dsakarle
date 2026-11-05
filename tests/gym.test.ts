import { describe, expect, it } from 'vitest'

import {
  type Answer,
  type GymItem,
  applySession,
  bestStreak,
  breakdown,
  buildSession,
  emptyStore,
  itemsFromLesson,
  parseStore,
  scoreOf,
  seededShuffle,
  weightedPick,
} from '@/lib/gym'

const mk = (n: number): GymItem[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `l${i % 5}#${i}`,
    problem: `p${i}`,
    answer: `l${i % 5}`,
    options: [`l${i % 5}`, 'x', 'y', 'z'],
    explanation: 'e',
    sourceLesson: `l${i % 5}`,
  }))

describe('seededShuffle', () => {
  it('is deterministic and a permutation', () => {
    const a = seededShuffle([1, 2, 3, 4, 5, 6], 'abc')
    expect(seededShuffle([1, 2, 3, 4, 5, 6], 'abc')).toEqual(a)
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5, 6])
    expect(seededShuffle([1, 2, 3, 4, 5, 6], 'other')).not.toEqual(a)
  })
})

describe('weightedPick', () => {
  const items = mk(40)
  it('picks unique items, capped to pool size', () => {
    const p = weightedPick(items, 10, 's')
    expect(new Set(p.map((i) => i.id)).size).toBe(10)
    expect(weightedPick(items.slice(0, 3), 10, 's')).toHaveLength(3)
  })
  it('is deterministic per seed', () => {
    expect(weightedPick(items, 10, 's').map((i) => i.id)).toEqual(weightedPick(items, 10, 's').map((i) => i.id))
  })
  it('prefers previously missed items', () => {
    const missed = items.slice(0, 5).map((i) => i.id)
    let withMiss = 0
    let without = 0
    for (let s = 0; s < 200; s++) {
      withMiss += weightedPick(items, 5, `k${s}`, missed).filter((i) => missed.includes(i.id)).length
      without += weightedPick(items, 5, `k${s}`).filter((i) => missed.includes(i.id)).length
    }
    expect(withMiss).toBeGreaterThan(without * 1.5)
  })
})

describe('buildSession', () => {
  it('filters by allowed answers and shuffles options', () => {
    const s = buildSession(mk(40), { count: 10, seed: 'q', allowedAnswers: new Set(['l1', 'l2']) })
    expect(s.every((q) => q.answer === 'l1' || q.answer === 'l2')).toBe(true)
    expect(s.every((q) => [...q.shuffled].sort().join() === [...q.options].sort().join())).toBe(true)
  })
})

describe('scoring', () => {
  const answers: Answer[] = [
    { id: 'a#0', answer: 'a', chosen: 'a' },
    { id: 'a#1', answer: 'a', chosen: 'b' },
    { id: 'b#0', answer: 'b', chosen: 'b' },
    { id: 'b#1', answer: 'b', chosen: 'b' },
  ]
  it('scores, streaks and breaks down', () => {
    expect(scoreOf(answers)).toEqual({ right: 3, total: 4, percent: 75 })
    expect(bestStreak(answers)).toBe(2)
    expect(breakdown(answers)).toEqual({ a: { right: 1, total: 2 }, b: { right: 2, total: 2 } })
  })
  it('applySession updates the store', () => {
    const s = applySession({ ...emptyStore(), missed: ['b#0'] }, answers)
    expect(s.attempts).toBe(1)
    expect(s.bestScore).toBe(75)
    expect(s.perPattern.a).toEqual({ right: 1, total: 2 })
    expect(s.missed.sort()).toEqual(['a#1'])
  })
})

describe('defensive parsing', () => {
  it('parseStore survives junk', () => {
    expect(parseStore('nope')).toEqual(emptyStore())
    expect(parseStore(null)).toEqual(emptyStore())
    expect(parseStore('{"bestScore":"x","perPattern":{"a":{"right":1}}}')).toEqual(emptyStore())
  })
  it('itemsFromLesson tolerates missing/invalid quizzes', () => {
    expect(itemsFromLesson('a', {})).toEqual([])
    expect(itemsFromLesson('a', { recognise: { quiz: [{ problem: 'p', answer: 'q', options: ['x', 'y'], explanation: 'e' }] } })).toEqual([])
    const ok = itemsFromLesson('a', { recognise: { quiz: [{ problem: 'p', answer: 'x', options: ['x', 'y'], explanation: 'e' }] } })
    expect(ok[0].id).toBe('a#0')
  })
})
