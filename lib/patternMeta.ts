export type PatternTag =
  | 'two-pointers'
  | 'sliding-window'
  | 'binary-search'
  | 'bfs-dfs'
  | 'dynamic-programming'
  | 'greedy'
  | 'backtracking'
  | 'heaps'
  | 'hash-maps'
  | 'prefix-sum'
  | 'stacks'
  | 'linked-lists'
  | 'trees'
  | 'sorting';

export interface PatternInfo {
  label: string;
  icon: string;
  trigger: string;
  notThisWhen: string;
  color: string;
}

export const PATTERN_META: Record<string, PatternInfo> = {
  'two-pointers': {
    label: 'Two Pointers',
    icon: '👈👉',
    trigger: 'Sorted array + find pair with target sum/difference',
    notThisWhen: 'Array is unsorted and you cannot sort it',
    color: 'var(--surface-coral)',
  },
  'sliding-window': {
    label: 'Sliding Window',
    icon: '🪟',
    trigger: 'Contiguous subarray/substring with a constraint (max, min, exactly k)',
    notThisWhen: "Elements don't need to be contiguous",
    color: 'var(--surface-teal)',
  },
  'binary-search': {
    label: 'Binary Search',
    icon: '🔍',
    trigger: 'Sorted data + find target OR minimize/maximize a value',
    notThisWhen: 'Data is unsorted and sorting changes the answer',
    color: 'var(--surface-amber)',
  },
  'bfs-dfs': {
    label: 'BFS / DFS',
    icon: '🌊',
    trigger: 'Tree/graph traversal, all paths, connected components, cycle detection',
    notThisWhen: 'You need shortest weighted path (use Dijkstra)',
    color: 'var(--surface-teal)',
  },
  'dynamic-programming': {
    label: 'Dynamic Programming',
    icon: '🧠',
    trigger: 'Overlapping subproblems + optimal substructure (maximize/minimize/count ways)',
    notThisWhen: 'Subproblems are independent (use divide & conquer)',
    color: 'var(--surface-coral)',
  },
  'greedy': {
    label: 'Greedy',
    icon: '⚡',
    trigger: 'Local optimal choice leads to global optimal (interval scheduling, huffman)',
    notThisWhen: 'You need to consider all combinations (use DP/backtracking)',
    color: 'var(--surface-amber)',
  },
  'backtracking': {
    label: 'Backtracking',
    icon: '🔄',
    trigger: 'Generate all permutations/combinations, constraint satisfaction',
    notThisWhen: 'You only need one optimal answer (likely DP or Greedy)',
    color: 'var(--surface-coral)',
  },
  'heaps': {
    label: 'Heap / Priority Queue',
    icon: '📊',
    trigger: 'Find k-th largest/smallest, merge sorted lists, scheduling',
    notThisWhen: 'You need exact ordering, not just min/max access',
    color: 'var(--surface-teal)',
  },
  'hash-maps': {
    label: 'Hash Map',
    icon: '🗄️',
    trigger: 'Count frequencies, check existence in O(1), two sum pattern',
    notThisWhen: 'Order matters and you need sorted traversal',
    color: 'var(--surface-amber)',
  },
  'prefix-sum': {
    label: 'Prefix Sum',
    icon: '📈',
    trigger: 'Range sum queries, subarray sum equals target',
    notThisWhen: 'Array elements change frequently (use segment tree)',
    color: 'var(--surface-teal)',
  },
  'stacks': {
    label: 'Stack',
    icon: '📚',
    trigger: 'Matching brackets, next greater element, undo operations',
    notThisWhen: 'You need FIFO access (use Queue)',
    color: 'var(--surface-coral)',
  },
  'linked-lists': {
    label: 'Linked List',
    icon: '🔗',
    trigger: 'In-place pointer manipulation, merge, cycle detection',
    notThisWhen: 'You need random access by index (use array)',
    color: 'var(--surface-amber)',
  },
  'trees': {
    label: 'Trees',
    icon: '🌳',
    trigger: 'Hierarchical data, BST operations, lowest common ancestor',
    notThisWhen: 'Data has cycles (use graph algorithms)',
    color: 'var(--surface-teal)',
  },
  'sorting': {
    label: 'Sorting',
    icon: '↕️',
    trigger: 'Order elements, binary search prerequisite, merge intervals',
    notThisWhen: 'Input is already sorted or order is irrelevant',
    color: 'var(--surface-amber)',
  },
};
