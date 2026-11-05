import type { Frame } from './types'

export interface PredictSelection {
  tags: string[]
  max: number
}

/**
 * Choose which predict candidates to actually ask in a guided run.
 *
 * Candidates are frames whose `predict.tag` is in `tags`, excluding the last
 * frame (a prompt needs a following frame to reveal). If there are more than
 * `max`, pick evenly spaced ones (centre of each of `max` equal buckets) so
 * questions are spread across the run. Deterministic. Returns ascending frame
 * indices; [] when config is missing.
 */
export function selectPredicts(
  frames: readonly Frame[],
  config?: Partial<PredictSelection> | null,
): number[] {
  if (!config || !config.tags || config.tags.length === 0) return []
  const max = Math.floor(config.max ?? 0)
  if (!(max > 0)) return []
  const tags = new Set(config.tags)

  const candidates: number[] = []
  for (let i = 0; i < frames.length - 1; i++) {
    const p = frames[i].predict
    if (p && tags.has(p.tag)) candidates.push(i)
  }
  if (candidates.length <= max) return candidates

  const n = candidates.length
  const picked: number[] = []
  for (let k = 0; k < max; k++) {
    picked.push(candidates[Math.floor(((k + 0.5) * n) / max)])
  }
  return picked
}
