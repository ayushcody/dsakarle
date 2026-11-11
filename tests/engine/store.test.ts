import { describe, expect, it } from 'vitest'

import { createStageStore } from '@/lib/engine/store'
import type { StageStoreApi } from '@/lib/engine/store'
import { mkFrames } from './helpers'

/** 6 frames, predict on 1 and 3 (answer 'left'). */
function guided(predictAt: number[] = [1, 3], n = 6): StageStoreApi {
  const store = createStageStore()
  store.getState().load(mkFrames(n, predictAt), { mode: 'guided', predictAt })
  return store
}

describe('load', () => {
  it('resets state and sets mode defaults', () => {
    const store = guided()
    const s = store.getState()
    expect(s.index).toBe(0)
    expect(s.playing).toBe(false)
    expect(s.speed).toBe(1)
    expect(s.mode).toBe('guided')
    expect(s.predictEnabled).toBe(true)
    expect(Array.from(s.predictAt)).toEqual([1, 3])
    expect(s.prompt).toBeNull()
    expect(s.answered).toEqual({})
    expect(s.finished).toBe(false)

    store.getState().next()
    store.getState().next() // prompt at 1
    store.getState().setSpeed(2)
    store.getState().load(mkFrames(3), { mode: 'playground' })
    const t = store.getState()
    expect(t.index).toBe(0)
    expect(t.prompt).toBeNull()
    expect(t.answered).toEqual({})
    expect(t.mode).toBe('playground')
    expect(t.predictEnabled).toBe(false)
    expect(t.predictAt.size).toBe(0)
    expect(t.speed).toBe(1)
  })

  it('stores are independent', () => {
    const a = guided()
    const b = guided()
    a.getState().next()
    expect(a.getState().index).toBe(1)
    expect(b.getState().index).toBe(0)
  })
})

describe('navigation without predicts', () => {
  it('next/prev clamp and finish at the end', () => {
    const store = createStageStore()
    store.getState().load(mkFrames(3), { mode: 'playground' })
    const s = () => store.getState()
    s().prev()
    expect(s().index).toBe(0)
    s().next()
    expect(s().index).toBe(1)
    expect(s().finished).toBe(false)
    s().next()
    expect(s().index).toBe(2)
    expect(s().finished).toBe(true)
    s().next()
    expect(s().index).toBe(2)
    s().prev()
    expect(s().index).toBe(1)
  })

  it('seek clamps; first/last work', () => {
    const store = createStageStore()
    store.getState().load(mkFrames(5), { mode: 'playground' })
    store.getState().seek(99)
    expect(store.getState().index).toBe(4)
    expect(store.getState().finished).toBe(true)
    store.getState().seek(-3)
    expect(store.getState().index).toBe(0)
    store.getState().last()
    expect(store.getState().index).toBe(4)
    store.getState().first()
    expect(store.getState().index).toBe(0)
  })

  it('handles an empty run', () => {
    const store = createStageStore()
    store.getState().next()
    store.getState().play()
    store.getState().seek(3)
    expect(store.getState().index).toBe(0)
    expect(store.getState().playing).toBe(false)
  })

  it('does not gate in playground mode (predictEnabled false)', () => {
    const store = createStageStore()
    store.getState().load(mkFrames(4, [1]), { mode: 'playground', predictAt: [1] })
    store.getState().next()
    store.getState().next()
    expect(store.getState().index).toBe(2)
    expect(store.getState().prompt).toBeNull()
  })
})

describe('playback', () => {
  it('play / pause / toggle', () => {
    const store = createStageStore()
    store.getState().load(mkFrames(3), { mode: 'playground' })
    store.getState().play()
    expect(store.getState().playing).toBe(true)
    store.getState().pause()
    expect(store.getState().playing).toBe(false)
    store.getState().toggle()
    expect(store.getState().playing).toBe(true)
    store.getState().toggle()
    expect(store.getState().playing).toBe(false)
  })

  it('reaching the last frame pauses and finishes', () => {
    const store = createStageStore()
    store.getState().load(mkFrames(3), { mode: 'playground' })
    store.getState().play()
    store.getState().next()
    expect(store.getState().playing).toBe(true)
    store.getState().next()
    expect(store.getState().playing).toBe(false)
    expect(store.getState().finished).toBe(true)
  })

  it('play from the last frame restarts at 0', () => {
    const store = createStageStore()
    store.getState().load(mkFrames(3), { mode: 'playground' })
    store.getState().last()
    store.getState().play()
    expect(store.getState().index).toBe(0)
    expect(store.getState().playing).toBe(true)
  })

  it('setSpeed', () => {
    const store = createStageStore()
    store.getState().setSpeed(0.5)
    expect(store.getState().speed).toBe(0.5)
    store.getState().setSpeed(2)
    expect(store.getState().speed).toBe(2)
  })

  it('seeking to the end while playing pauses', () => {
    const store = createStageStore()
    store.getState().load(mkFrames(4), { mode: 'playground' })
    store.getState().play()
    store.getState().last()
    expect(store.getState().playing).toBe(false)
    expect(store.getState().finished).toBe(true)
  })
})

describe('predict gating', () => {
  it('next() from a gated frame raises a prompt instead of advancing', () => {
    const store = guided()
    store.getState().next() // 0 -> 1
    expect(store.getState().index).toBe(1)
    store.getState().next() // gated
    const s = store.getState()
    expect(s.index).toBe(1)
    expect(s.prompt).toEqual({ frameIndex: 1, attempts: 0, status: 'asking' })
    expect(s.playing).toBe(false)
  })

  it('autoplay tick (next while playing) is gated and pauses playback', () => {
    const store = guided()
    store.getState().play()
    store.getState().next()
    store.getState().next()
    expect(store.getState().prompt?.status).toBe('asking')
    expect(store.getState().playing).toBe(false)
  })

  it('next() is a no-op while a prompt is open', () => {
    const store = guided()
    store.getState().seek(1)
    store.getState().next()
    store.getState().next()
    store.getState().next()
    expect(store.getState().index).toBe(1)
    expect(store.getState().prompt).toEqual({ frameIndex: 1, attempts: 0, status: 'asking' })
  })

  it('play() is a no-op while a prompt is open', () => {
    const store = guided()
    store.getState().seek(1)
    store.getState().next()
    store.getState().play()
    expect(store.getState().playing).toBe(false)
  })

  it('correct answer: status correct, answered, advances', () => {
    const store = guided()
    store.getState().seek(1)
    store.getState().next()
    store.getState().answer('left')
    const s = store.getState()
    expect(s.prompt).toMatchObject({ frameIndex: 1, status: 'correct', attempts: 1, chosen: 'left' })
    expect(s.answered[1]).toBe('correct')
    expect(s.index).toBe(2)
  })

  it('wrong first attempt gives a hint and does not advance', () => {
    const store = guided()
    store.getState().seek(1)
    store.getState().next()
    store.getState().answer('right')
    const s = store.getState()
    expect(s.prompt).toMatchObject({ frameIndex: 1, status: 'hint', attempts: 1, chosen: 'right' })
    expect(s.answered[1]).toBeUndefined()
    expect(s.index).toBe(1)
  })

  it('wrong then correct: correct on second attempt', () => {
    const store = guided()
    store.getState().seek(1)
    store.getState().next()
    store.getState().answer('right')
    store.getState().answer('left')
    const s = store.getState()
    expect(s.prompt).toMatchObject({ status: 'correct', attempts: 2 })
    expect(s.answered[1]).toBe('correct')
    expect(s.index).toBe(2)
  })

  it('wrong twice reveals and advances', () => {
    const store = guided()
    store.getState().seek(1)
    store.getState().next()
    store.getState().answer('right')
    store.getState().answer('right')
    const s = store.getState()
    expect(s.prompt).toMatchObject({ frameIndex: 1, status: 'revealed', attempts: 2 })
    expect(s.answered[1]).toBe('revealed')
    expect(s.index).toBe(2)
  })

  it('answer() does nothing without an open prompt or after a result', () => {
    const store = guided()
    store.getState().answer('left')
    expect(store.getState().index).toBe(0)
    expect(store.getState().answered).toEqual({})
    store.getState().seek(1)
    store.getState().next()
    store.getState().answer('left')
    store.getState().answer('right')
    expect(store.getState().prompt?.status).toBe('correct')
    expect(store.getState().index).toBe(2)
  })

  it('continueAfterPrompt clears the prompt', () => {
    const store = guided()
    store.getState().seek(1)
    store.getState().next()
    store.getState().answer('left')
    store.getState().continueAfterPrompt()
    expect(store.getState().prompt).toBeNull()
    expect(store.getState().index).toBe(2)
  })

  it('an answered frame is never asked again', () => {
    const store = guided()
    store.getState().seek(1)
    store.getState().next()
    store.getState().answer('left')
    store.getState().continueAfterPrompt()
    store.getState().prev() // 1
    store.getState().next() // answered: advances freely
    expect(store.getState().index).toBe(2)
    expect(store.getState().prompt).toBeNull()
  })

  it('next() after a result (before continue) advances and drops the prompt', () => {
    const store = guided()
    store.getState().seek(1)
    store.getState().next()
    store.getState().answer('left')
    store.getState().next()
    expect(store.getState().index).toBe(3)
    expect(store.getState().prompt).toBeNull()
  })

  it('cell predicts compare loosely (number vs string)', () => {
    const store = createStageStore()
    store.getState().load(mkFrames(3, [0], { kind: 'cell', answer: 3, options: undefined }), {
      mode: 'guided',
      predictAt: [0],
    })
    store.getState().next()
    store.getState().answer('3')
    expect(store.getState().answered[0]).toBe('correct')

    store.getState().load(mkFrames(3, [0], { kind: 'cell', answer: 'n2', options: undefined }), {
      mode: 'guided',
      predictAt: [0],
    })
    store.getState().next()
    store.getState().answer('n2')
    expect(store.getState().answered[0]).toBe('correct')
  })

  it('a predict that answers into the last frame finishes the run', () => {
    const store = guided([2], 4)
    store.getState().seek(2)
    store.getState().next()
    store.getState().answer('left')
    expect(store.getState().index).toBe(3)
    expect(store.getState().finished).toBe(true)
  })

  it('setPredictEnabled(false) drops an open prompt and stops gating', () => {
    const store = guided()
    store.getState().seek(1)
    store.getState().next()
    store.getState().setPredictEnabled(false)
    expect(store.getState().prompt).toBeNull()
    store.getState().next()
    expect(store.getState().index).toBe(2)
  })

  it('ignores predictAt indices whose frame has no predict', () => {
    const store = createStageStore()
    store.getState().load(mkFrames(4), { mode: 'guided', predictAt: [1] })
    store.getState().next()
    store.getState().next()
    expect(store.getState().index).toBe(2)
  })
})

describe('seek / prev / skip around prompts', () => {
  it('seek, prev, last never raise prompts', () => {
    const store = guided()
    store.getState().seek(1)
    store.getState().seek(2)
    expect(store.getState().prompt).toBeNull()
    store.getState().prev()
    store.getState().prev()
    expect(store.getState().prompt).toBeNull()
    store.getState().last()
    expect(store.getState().prompt).toBeNull()
    expect(store.getState().index).toBe(5)
  })

  it('seeking forward past an unanswered predict marks it skipped', () => {
    const store = guided()
    store.getState().seek(4)
    expect(store.getState().answered).toEqual({ 1: 'skipped', 3: 'skipped' })
  })

  it('seeking onto a predict frame does not skip it', () => {
    const store = guided()
    store.getState().seek(3)
    expect(store.getState().answered).toEqual({ 1: 'skipped' })
    store.getState().next()
    expect(store.getState().prompt?.frameIndex).toBe(3)
  })

  it('seek does not overwrite an existing answer; backward seek skips nothing', () => {
    const store = guided()
    store.getState().seek(1)
    store.getState().next()
    store.getState().answer('left')
    store.getState().continueAfterPrompt()
    store.getState().last()
    expect(store.getState().answered).toEqual({ 1: 'correct', 3: 'skipped' })
    store.getState().first()
    expect(store.getState().answered).toEqual({ 1: 'correct', 3: 'skipped' })
  })

  it('seek does not mark skipped when predicts are disabled', () => {
    const store = guided()
    store.getState().setPredictEnabled(false)
    store.getState().last()
    expect(store.getState().answered).toEqual({})
  })

  it('seek clears an open prompt and skips its frame when moving forward', () => {
    const store = guided()
    store.getState().seek(1)
    store.getState().next()
    store.getState().seek(2)
    expect(store.getState().prompt).toBeNull()
    expect(store.getState().answered[1]).toBe('skipped')
  })

  it('prev clears an open prompt', () => {
    const store = guided()
    store.getState().seek(1)
    store.getState().next()
    store.getState().answer('right') // hint
    store.getState().prev()
    expect(store.getState().prompt).toBeNull()
    expect(store.getState().index).toBe(0)
    expect(store.getState().answered[1]).toBeUndefined()
  })

  it('skipPrompt marks skipped and advances', () => {
    const store = guided()
    store.getState().seek(1)
    store.getState().next()
    store.getState().skipPrompt()
    const s = store.getState()
    expect(s.prompt).toBeNull()
    expect(s.answered[1]).toBe('skipped')
    expect(s.index).toBe(2)
  })

  it('skipPrompt is a no-op without an open prompt', () => {
    const store = guided()
    store.getState().skipPrompt()
    expect(store.getState().index).toBe(0)
    expect(store.getState().answered).toEqual({})
  })

  it('finished is latched until load', () => {
    const store = guided()
    store.getState().last()
    expect(store.getState().finished).toBe(true)
    store.getState().prev()
    expect(store.getState().finished).toBe(true)
    store.getState().load(mkFrames(3))
    expect(store.getState().finished).toBe(false)
  })
})
