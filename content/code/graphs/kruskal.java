import java.util.*;

class Solution {
    int find(int[] parent, int x) {
        while (parent[x] != x) {
            x = parent[x];
        }
        return x;
    }

    int kruskal(int n, int[][] edges) {
        int[] parent = new int[n];                           // @init
        for (int i = 0; i < n; i++) parent[i] = i;           // @init
        int[][] sorted = edges.clone();                      // @init
        Arrays.sort(sorted, (x, y) -> {                      // @init
            if (x[2] != y[2]) return x[2] - y[2];            // @init
            int lx = Math.min(x[0], x[1]), ly = Math.min(y[0], y[1]);  // @init
            if (lx != ly) return lx - ly;                    // @init
            return Math.max(x[0], x[1]) - Math.max(y[0], y[1]);  // @init
        });                                                  // @init
        int total = 0;                                       // @init
        int used = 0;                                        // @init
        for (int[] e : sorted) {                             // @consider
            int a = e[0], b = e[1], w = e[2];                // @consider
            int ra = find(parent, a);                        // @find
            int rb = find(parent, b);                        // @find
            if (ra == rb) {                                  // @skip
                continue;                                    // @skip
            }
            parent[rb] = ra;                                 // @take
            total += w;                                      // @take
            used++;                                          // @take
            if (used == n - 1) {                             // @done
                break;                                       // @done
            }
        }
        return total;                                        // @done
    }
}
