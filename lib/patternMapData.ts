export interface MapNode {
  id: string;
  label: string;
  hindiLabel: string;
  category: 'linear' | 'tree' | 'graph' | 'search' | 'sort' | 'dp' | 'pattern';
  difficulty: 'foundational' | 'intermediate' | 'advanced';
  topicSlug?: string;
  description: string;
}

export interface MapEdge {
  source: string;
  target: string;
  type: 'extends' | 'uses' | 'prerequisite' | 'related';
  label?: string;
}

export const PATTERN_MAP_DATA: { nodes: MapNode[]; edges: MapEdge[] } = {
  nodes: [
    // FOUNDATIONAL
    { id: 'array', label: 'Arrays', hindiLabel: 'Arrays', category: 'linear', difficulty: 'foundational', topicSlug: 'arrays', description: 'Har cheez ka base. Index = address.' },
    { id: 'pointer', label: 'Pointer/Index', hindiLabel: 'Pointer', category: 'linear', difficulty: 'foundational', description: 'Loop variable i, j — itna hi hai' },

    // LINEAR PATTERNS
    { id: 'two-pointer', label: 'Two Pointers', hindiLabel: 'Do Pointer', category: 'pattern', difficulty: 'intermediate', topicSlug: 'two-pointers', description: 'L aur R andar aate hain. Sorted array mein pair dhundho.' },
    { id: 'sliding-window', label: 'Sliding Window', hindiLabel: 'Khisakti Khidki', category: 'pattern', difficulty: 'intermediate', topicSlug: 'sliding-window', description: 'Contiguous subarray with constraint.' },
    { id: 'prefix-sum', label: 'Prefix Sum', hindiLabel: 'Aage Ka Sum', category: 'pattern', difficulty: 'intermediate', topicSlug: 'prefix-sum', description: 'Range sum in O(1) after O(n) prep.' },

    // LINKED LIST
    { id: 'linked-list', label: 'Linked List', hindiLabel: 'Connected Nodes', category: 'linear', difficulty: 'intermediate', topicSlug: 'linked-lists', description: 'Scattered nodes connected by pointers.' },
    { id: 'slow-fast', label: 'Slow & Fast', hindiLabel: 'Kachua aur Khargosh', category: 'pattern', difficulty: 'intermediate', description: 'Cycle detection, middle finding.' },

    // STACK & QUEUE
    { id: 'stack', label: 'Stack', hindiLabel: 'Stack', category: 'linear', difficulty: 'foundational', topicSlug: 'stacks', description: 'LIFO. Last in, first out.' },
    { id: 'queue', label: 'Queue', hindiLabel: 'Queue', category: 'linear', difficulty: 'foundational', topicSlug: 'queues', description: 'FIFO. First in, first out.' },
    { id: 'monotonic-stack', label: 'Monotonic Stack', hindiLabel: 'Ek Direction', category: 'pattern', difficulty: 'advanced', description: 'Next greater element type problems.' },

    // SEARCH
    { id: 'binary-search', label: 'Binary Search', hindiLabel: 'Aadha Aadha', category: 'search', difficulty: 'intermediate', topicSlug: 'binary-search', description: 'Har step mein half cut. Sorted data.' },
    { id: 'hash-map', label: 'Hash Map', hindiLabel: 'Magic Dabba', category: 'linear', difficulty: 'intermediate', topicSlug: 'hash-maps', description: 'O(1) lookup. Key-value store.' },

    // TREES
    { id: 'tree', label: 'Binary Tree', hindiLabel: 'Parivar Ped', category: 'tree', difficulty: 'intermediate', topicSlug: 'trees', description: 'Hierarchical structure. Parent → children.' },
    { id: 'bst', label: 'BST', hindiLabel: 'Ordered Ped', category: 'tree', difficulty: 'intermediate', topicSlug: 'bst', description: 'Left chhota, right bada.' },
    { id: 'heap', label: 'Heap', hindiLabel: 'Priority Queue', category: 'tree', difficulty: 'intermediate', topicSlug: 'heaps', description: 'Parent always bigger (max) or smaller (min).' },
    { id: 'trie', label: 'Trie', hindiLabel: 'Word Tree', category: 'tree', difficulty: 'advanced', topicSlug: 'tries', description: 'Prefix-based search. Auto-complete.' },

    // GRAPHS
    { id: 'graph', label: 'Graphs', hindiLabel: 'Cities & Roads', category: 'graph', difficulty: 'intermediate', topicSlug: 'graphs', description: 'Nodes and edges. Networks.' },
    { id: 'bfs', label: 'BFS', hindiLabel: 'Level by Level', category: 'graph', difficulty: 'intermediate', topicSlug: 'bfs-dfs', description: 'Shortest path in unweighted graph.' },
    { id: 'dfs', label: 'DFS', hindiLabel: 'Gehraai Mein', category: 'graph', difficulty: 'intermediate', topicSlug: 'bfs-dfs', description: 'Explore deep. Backtrack. All paths.' },
    { id: 'dijkstra', label: "Dijkstra's", hindiLabel: 'Weighted Shortest', category: 'graph', difficulty: 'advanced', description: 'Shortest path with weights.' },

    // DP FAMILY
    { id: 'recursion', label: 'Recursion', hindiLabel: 'Khud Ko Bulao', category: 'dp', difficulty: 'intermediate', topicSlug: 'recursion', description: 'Function calls itself with smaller input.' },
    { id: 'memoization', label: 'Memoization', hindiLabel: 'Yaad Rakho', category: 'dp', difficulty: 'intermediate', description: 'Cache recursive results. Top-down DP.' },
    { id: 'dp', label: 'Dynamic Programming', hindiLabel: 'Step by Step', category: 'dp', difficulty: 'advanced', topicSlug: 'dynamic-programming', description: 'Overlapping subproblems + optimal substructure.' },
    { id: 'greedy', label: 'Greedy', hindiLabel: 'Abhi Best Lo', category: 'dp', difficulty: 'intermediate', topicSlug: 'greedy', description: 'Local optimal = global optimal (sometimes).' },
    { id: 'backtracking', label: 'Backtracking', hindiLabel: 'Try, Fail, Wapas', category: 'dp', difficulty: 'advanced', topicSlug: 'recursion', description: 'Explore all possibilities. Prune bad ones.' },
  ],
  edges: [
    // Array base
    { source: 'array', target: 'two-pointer', type: 'extends', label: 'two pointers on array' },
    { source: 'array', target: 'sliding-window', type: 'extends', label: 'window on array' },
    { source: 'array', target: 'prefix-sum', type: 'extends', label: 'precompute on array' },
    { source: 'array', target: 'binary-search', type: 'extends', label: 'on sorted array' },
    { source: 'two-pointer', target: 'sliding-window', type: 'extends', label: 'dynamic two-pointer' },

    // Stack & Queue
    { source: 'array', target: 'stack', type: 'uses', label: 'implemented with array' },
    { source: 'array', target: 'queue', type: 'uses', label: 'implemented with array' },
    { source: 'stack', target: 'monotonic-stack', type: 'extends', label: 'stack + ordering' },
    { source: 'queue', target: 'bfs', type: 'uses', label: 'BFS uses queue' },

    // Linked list
    { source: 'linked-list', target: 'slow-fast', type: 'extends', label: 'pointers on LL' },
    { source: 'linked-list', target: 'stack', type: 'related', label: 'stack via LL' },

    // Trees
    { source: 'graph', target: 'tree', type: 'prerequisite', label: 'tree = DAG' },
    { source: 'tree', target: 'bst', type: 'extends', label: 'ordered tree' },
    { source: 'tree', target: 'heap', type: 'extends', label: 'complete tree + property' },
    { source: 'tree', target: 'trie', type: 'extends', label: 'string prefix tree' },
    { source: 'bst', target: 'binary-search', type: 'related', label: 'O(log n) intuition' },

    // Graph
    { source: 'graph', target: 'bfs', type: 'uses', label: 'graph traversal' },
    { source: 'graph', target: 'dfs', type: 'uses', label: 'graph traversal' },
    { source: 'heap', target: 'dijkstra', type: 'uses', label: 'uses min-heap' },
    { source: 'dfs', target: 'backtracking', type: 'extends', label: 'DFS + pruning' },

    // DP family
    { source: 'recursion', target: 'memoization', type: 'extends', label: 'recursion + cache' },
    { source: 'memoization', target: 'dp', type: 'extends', label: 'bottom-up memo' },
    { source: 'recursion', target: 'backtracking', type: 'related', label: 'uses recursion' },
    { source: 'recursion', target: 'dfs', type: 'related', label: 'often recursive' },
    { source: 'greedy', target: 'dp', type: 'related', label: 'local = global' },

    // Hash map
    { source: 'hash-map', target: 'memoization', type: 'uses', label: 'memo uses hash map' },
  ],
};

export const NODE_COLORS: Record<string, string> = {
  linear: '#F0997B',
  tree: '#5DCAA5',
  graph: '#69B8F7',
  search: '#FAC775',
  sort: '#9F8EF2',
  dp: '#F09595',
  pattern: '#D85A30',
};

export const NODE_RADII: Record<string, number> = {
  foundational: 36,
  intermediate: 28,
  advanced: 22,
};
