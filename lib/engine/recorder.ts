import { MAX_FRAMES } from './types'
import type { Frame, TraceResult } from './types'

/**
 * Frame recorder for tracers.
 *
 * `frame()` deep-clones the frame on push, so a tracer can keep mutating its
 * working arrays / vars after recording without rewriting earlier frames.
 * Once MAX_FRAMES are recorded further frames are dropped and `capped` is
 * true; tracers should check `rec.capped` in their loops and stop.
 */
export interface Recorder<R> {
  /** Record one frame (deep-cloned). Ignored once the cap is reached. */
  frame(f: Frame): void
  readonly frames: Frame[]
  /** True once MAX_FRAMES have been recorded (no more frames are accepted). */
  readonly capped: boolean
  /** Finish the run. */
  done(result: R): TraceResult<R>
}

export function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

export function createRecorder<R>(): Recorder<R> {
  const frames: Frame[] = []
  return {
    frame(f) {
      if (frames.length >= MAX_FRAMES) return
      frames.push(clone(f))
    },
    frames,
    get capped() {
      return frames.length >= MAX_FRAMES
    },
    done(result) {
      return { frames, result }
    },
  }
}

// ---------------------------------------------------------------------------
// Snapshot helpers — shallow copies for building scenes from working state.
// (frame() clones anyway; these just make intent explicit and keep scenes small.)
// ---------------------------------------------------------------------------

/** Copy of a flat cell array. */
export function arr<T extends number | string | null>(cells: readonly T[]): T[] {
  return cells.slice()
}

/** Copy of a vars record (values are plain JSON). */
export function vars<V extends Record<string, unknown>>(v: V): V {
  return clone(v)
}
