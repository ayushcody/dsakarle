import { createStore } from 'zustand/vanilla'
import type { StoreApi } from 'zustand/vanilla'

import type { Frame } from './types'

/**
 * Per-stage playback + predict state. One store per stage (never global), so
 * several stages can live on one lesson page. Pure: no timers here; autoplay
 * is driven by StageProvider calling `next()` on an interval.
 */

export type Speed = 0.5 | 1 | 2
export type StageMode = 'guided' | 'playground'
export type PromptStatus = 'asking' | 'hint' | 'correct' | 'revealed'
export type AnswerState = 'correct' | 'revealed' | 'skipped'

export interface PredictPrompt {
  /** The frame the question is attached to; the reveal is frameIndex + 1. */
  frameIndex: number
  /** Number of answers submitted so far for this prompt. */
  attempts: number
  status: PromptStatus
  /** The learner's most recent answer. */
  chosen?: string | number
}

export interface StageState {
  frames: Frame[]
  index: number
  playing: boolean
  speed: Speed
  mode: StageMode
  predictEnabled: boolean
  predictAt: Set<number>
  prompt: PredictPrompt | null
  answered: Record<number, AnswerState>
  /** Latched: true once the last frame has been reached (reset by load). */
  finished: boolean
}

export interface StageActions {
  /** Replace the run and reset everything. predictEnabled defaults to mode === 'guided'. */
  load(frames: Frame[], opts?: { mode?: StageMode; predictAt?: Iterable<number>; predictEnabled?: boolean }): void
  /** Advance one frame, or raise a predict prompt if this frame is gated. */
  next(): void
  prev(): void
  seek(i: number): void
  first(): void
  last(): void
  /** Start autoplay. From the last frame, restarts at frame 0. No-op while a prompt is open. */
  play(): void
  pause(): void
  toggle(): void
  setSpeed(s: Speed): void
  setPredictEnabled(on: boolean): void
  /** Submit an answer to the open prompt (choice string, or cell index / id). */
  answer(choice: string | number): void
  /** Close the prompt once its reveal / stamp has been shown. */
  continueAfterPrompt(): void
  /** Give up on the open prompt: mark skipped and advance. */
  skipPrompt(): void
}

export type StageStore = StageState & StageActions
export type StageStoreApi = StoreApi<StageStore>

export interface StageInit {
  frames?: Frame[]
  mode?: StageMode
  predictAt?: Iterable<number>
  predictEnabled?: boolean
}

function freshState(frames: Frame[], opts: StageInit = {}): StageState {
  const mode = opts.mode ?? 'guided'
  return {
    frames,
    index: 0,
    playing: false,
    speed: 1,
    mode,
    predictEnabled: opts.predictEnabled ?? mode === 'guided',
    predictAt: new Set(opts.predictAt ?? []),
    prompt: null,
    answered: {},
    finished: false,
  }
}

function isOpen(p: PredictPrompt | null): p is PredictPrompt {
  return !!p && (p.status === 'asking' || p.status === 'hint')
}

/** Loose equality so 3 and "3" both match. */
function same(a: string | number, b: string | number): boolean {
  return String(a) === String(b)
}

export function createStageStore(init: StageInit = {}): StageStoreApi {
  return createStore<StageStore>((set, get) => {
    /** State patch for landing on frame i (sets finished / pauses at the end). */
    const land = (i: number): Partial<StageState> => {
      const lastIdx = get().frames.length - 1
      return i >= lastIdx ? { index: lastIdx, finished: true, playing: false } : { index: i }
    }

    /** Answers to record for unanswered predict frames passed over in [from, to). */
    const skippedBetween = (from: number, to: number): Record<number, AnswerState> => {
      const s = get()
      if (!s.predictEnabled) return s.answered
      let out = s.answered
      s.predictAt.forEach((k) => {
        if (k >= from && k < to && out[k] === undefined && s.frames[k]?.predict) {
          if (out === s.answered) out = { ...s.answered }
          out[k] = 'skipped'
        }
      })
      return out
    }

    const gated = (i: number): boolean => {
      const s = get()
      return s.predictEnabled && s.predictAt.has(i) && s.answered[i] === undefined && !!s.frames[i]?.predict
    }

    return {
      ...freshState(init.frames ?? [], init),

      load(frames, opts = {}) {
        set({ ...freshState(frames, opts) })
      },

      next() {
        const s = get()
        if (s.frames.length === 0 || isOpen(s.prompt)) return
        const i = s.index
        if (i >= s.frames.length - 1) {
          set({ playing: false, finished: true, prompt: null })
          return
        }
        if (gated(i)) {
          set({ prompt: { frameIndex: i, attempts: 0, status: 'asking' }, playing: false })
          return
        }
        set({ ...land(i + 1), prompt: null })
      },

      prev() {
        const s = get()
        set({ index: Math.max(0, s.index - 1), prompt: null })
      },

      seek(j) {
        const s = get()
        if (s.frames.length === 0) return
        const target = Math.max(0, Math.min(Math.trunc(j) || 0, s.frames.length - 1))
        set({
          ...land(target),
          answered: target > s.index ? skippedBetween(s.index, target) : s.answered,
          prompt: null,
        })
      },

      first() {
        get().seek(0)
      },

      last() {
        get().seek(get().frames.length - 1)
      },

      play() {
        const s = get()
        if (s.frames.length === 0 || isOpen(s.prompt)) return
        const atEnd = s.index >= s.frames.length - 1
        set({ playing: true, prompt: null, ...(atEnd ? { index: 0 } : {}) })
      },

      pause() {
        set({ playing: false })
      },

      toggle() {
        const s = get()
        if (s.playing) s.pause()
        else s.play()
      },

      setSpeed(speed) {
        set({ speed })
      },

      setPredictEnabled(on) {
        const s = get()
        set({ predictEnabled: on, prompt: !on && isOpen(s.prompt) ? null : s.prompt })
      },

      answer(choice) {
        const s = get()
        const p = s.prompt
        if (!isOpen(p)) return
        const i = p.frameIndex
        const target = s.frames[i]?.predict
        if (!target) return
        const attempts = p.attempts + 1

        if (same(choice, target.answer)) {
          set({
            prompt: { frameIndex: i, attempts, status: 'correct', chosen: choice },
            answered: { ...s.answered, [i]: 'correct' },
            ...land(i + 1),
          })
        } else if (attempts === 1) {
          set({ prompt: { frameIndex: i, attempts, status: 'hint', chosen: choice } })
        } else {
          set({
            prompt: { frameIndex: i, attempts, status: 'revealed', chosen: choice },
            answered: { ...s.answered, [i]: 'revealed' },
            ...land(i + 1),
          })
        }
      },

      continueAfterPrompt() {
        set({ prompt: null })
      },

      skipPrompt() {
        const s = get()
        if (!isOpen(s.prompt)) return
        const i = s.prompt.frameIndex
        set({ prompt: null, answered: { ...s.answered, [i]: 'skipped' }, ...land(i + 1) })
      },
    }
  })
}
