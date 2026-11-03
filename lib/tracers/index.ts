/**
 * Tracer registry. Every golden-path id is registered here up front so lesson
 * authors only implement `lib/tracers/<id>.ts` and never edit this file.
 * Ids without a real implementation export `stubTracer(id)` (see stub.ts).
 */
import type { AnyTracer, TracerId } from '@/lib/engine/types'

type TracerLoader = () => Promise<{ default: AnyTracer }>

export const TRACER_LOADERS: Record<TracerId, TracerLoader> = {
  'arrays/access': () => import('./arrays/access'),
  'arrays/insert': () => import('./arrays/insert'),
  'arrays/delete': () => import('./arrays/delete'),
  'arrays/linear-search': () => import('./arrays/linear-search'),
  'two-pointers/pair-sum': () => import('./two-pointers/pair-sum'),
  'two-pointers/dedupe': () => import('./two-pointers/dedupe'),
  'sliding-window/max-sum-k': () => import('./sliding-window/max-sum-k'),
  'sliding-window/min-len-target': () => import('./sliding-window/min-len-target'),
  'linked-lists/traverse': () => import('./linked-lists/traverse'),
  'linked-lists/insert-after': () => import('./linked-lists/insert-after'),
  'linked-lists/delete': () => import('./linked-lists/delete'),
  'linked-lists/reverse': () => import('./linked-lists/reverse'),
  'hash-maps/put-get': () => import('./hash-maps/put-get'),
  'hash-maps/two-sum': () => import('./hash-maps/two-sum'),
  'binary-search/classic': () => import('./binary-search/classic'),
  'binary-search/first-true': () => import('./binary-search/first-true'),
}

export const TRACER_IDS = Object.keys(TRACER_LOADERS) as TracerId[]

export function hasTracer(id: string): id is TracerId {
  return Object.prototype.hasOwnProperty.call(TRACER_LOADERS, id)
}

/** Load a tracer by id. Rejects with a readable message for unknown ids. */
export async function loadTracer(id: string): Promise<AnyTracer> {
  if (!hasTracer(id)) throw new Error(`Unknown tracer "${id}". Known ids: ${TRACER_IDS.join(', ')}`)
  const mod = await TRACER_LOADERS[id]()
  return mod.default
}
