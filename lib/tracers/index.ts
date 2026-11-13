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
  // Phase 5
  'vectors/push-back': () => import('./vectors/push-back'),
  'vectors/pop-back': () => import('./vectors/pop-back'),
  'strings/palindrome': () => import('./strings/palindrome'),
  'strings/char-frequency': () => import('./strings/char-frequency'),
  'stacks/push-pop': () => import('./stacks/push-pop'),
  'stacks/valid-parentheses': () => import('./stacks/valid-parentheses'),
  'stacks/next-greater': () => import('./stacks/next-greater'),
  'queues/enqueue-dequeue': () => import('./queues/enqueue-dequeue'),
  'queues/window-max': () => import('./queues/window-max'),
  'trees/dfs-order': () => import('./trees/dfs-order'),
  'trees/level-order': () => import('./trees/level-order'),
  'trees/max-depth': () => import('./trees/max-depth'),
  'bst/search': () => import('./bst/search'),
  'bst/insert': () => import('./bst/insert'),
  'bst/delete': () => import('./bst/delete'),
  'heaps/push': () => import('./heaps/push'),
  'heaps/pop': () => import('./heaps/pop'),
  'heaps/kth-largest': () => import('./heaps/kth-largest'),
  'graphs/build-adjacency': () => import('./graphs/build-adjacency'),
  'graphs/topo-sort': () => import('./graphs/topo-sort'),
  'tries/insert': () => import('./tries/insert'),
  'tries/prefix-search': () => import('./tries/prefix-search'),
  'fast-and-slow-pointers/cycle': () => import('./fast-and-slow-pointers/cycle'),
  'fast-and-slow-pointers/middle': () => import('./fast-and-slow-pointers/middle'),
  'fast-and-slow-pointers/cycle-start': () => import('./fast-and-slow-pointers/cycle-start'),
  'prefix-sum/range-sum': () => import('./prefix-sum/range-sum'),
  'prefix-sum/subarray-sum-k': () => import('./prefix-sum/subarray-sum-k'),
  'sorting/insertion-sort': () => import('./sorting/insertion-sort'),
  'sorting/merge-sort': () => import('./sorting/merge-sort'),
  'sorting/quick-sort': () => import('./sorting/quick-sort'),
  'searching/rotated-search': () => import('./searching/rotated-search'),
  'searching/rotated-min': () => import('./searching/rotated-min'),
  'recursion/factorial': () => import('./recursion/factorial'),
  'recursion/subsets': () => import('./recursion/subsets'),
  'bfs-dfs/bfs-grid': () => import('./bfs-dfs/bfs-grid'),
  'bfs-dfs/dfs-graph': () => import('./bfs-dfs/dfs-graph'),
  'greedy/jump-game': () => import('./greedy/jump-game'),
  'greedy/interval-scheduling': () => import('./greedy/interval-scheduling'),
  'dynamic-programming/climb-stairs': () => import('./dynamic-programming/climb-stairs'),
  'dynamic-programming/unique-paths': () => import('./dynamic-programming/unique-paths'),
  'dynamic-programming/coin-change': () => import('./dynamic-programming/coin-change'),
  // Tier 1 (the /visualize gallery round)
  'graphs/dijkstra': () => import('./graphs/dijkstra'),
  'graphs/union-find': () => import('./graphs/union-find'),
  'dynamic-programming/knapsack': () => import('./dynamic-programming/knapsack'),
  'dynamic-programming/lcs': () => import('./dynamic-programming/lcs'),
  'recursion/n-queens': () => import('./recursion/n-queens'),
  'greedy/merge-intervals': () => import('./greedy/merge-intervals'),
  'stacks/largest-rectangle': () => import('./stacks/largest-rectangle'),
  'sorting/heap-sort': () => import('./sorting/heap-sort'),
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
