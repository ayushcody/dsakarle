import type { Frame, PredictCandidate } from '@/lib/engine/types'

export function mkFrame(i: number, predict?: Partial<PredictCandidate>): Frame {
  return {
    scene: { kind: 'array', cells: [i, i + 1, i + 2] },
    vars: { i },
    say: `Frame ${i}.`,
    at: 'step',
    ...(predict
      ? {
          predict: {
            tag: 'decide',
            prompt: 'Which way?',
            kind: 'choice',
            options: ['left', 'right'],
            answer: 'left',
            why: 'Because.',
            hint: 'Think.',
            ...predict,
          },
        }
      : {}),
  }
}

/** n frames; frames at `predictIdx` carry a predict candidate. */
export function mkFrames(n: number, predictIdx: number[] = [], over: Partial<PredictCandidate> = {}): Frame[] {
  return Array.from({ length: n }, (_, i) => mkFrame(i, predictIdx.includes(i) ? over : undefined))
}
