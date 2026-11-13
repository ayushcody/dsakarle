class Solution {
    int find(int[] parent, int x) {
        int root = x;
        while (parent[root] != root) {                          // @find
            root = parent[root];                                // @find
        }
        while (parent[x] != root) {                             // @compress
            int next = parent[x];                               // @compress
            parent[x] = root;                                   // @compress
            x = next;                                           // @compress
        }
        return root;
    }

    int countGroups(int n, int[][] edges) {
        int[] parent = new int[n];                              // @init
        int[] size = new int[n];                                // @init
        for (int i = 0; i < n; i++) {                           // @init
            parent[i] = i;                                      // @init
            size[i] = 1;                                        // @init
        }
        int components = n;                                     // @init
        for (int[] e : edges) {
            int ra = find(parent, e[0]);
            int rb = find(parent, e[1]);
            if (ra == rb) continue;                             // @same
            if (size[ra] < size[rb]) {                          // @union
                int tmp = ra;                                   // @union
                ra = rb;                                        // @union
                rb = tmp;                                       // @union
            }
            parent[rb] = ra;                                    // @union
            size[ra] += size[rb];                               // @union
            components--;                                       // @union
        }
        return components;                                      // @finish
    }
}
