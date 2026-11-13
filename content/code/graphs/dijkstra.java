import java.util.ArrayList;
import java.util.List;

class Solution {
    int[] dijkstra(int n, int[][] edges, int src) {
        final int INF = 1_000_000_000;
        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            adj.add(new ArrayList<>());
        }
        for (int[] e : edges) {
            adj.get(e[0]).add(new int[]{e[1], e[2]});
            adj.get(e[1]).add(new int[]{e[0], e[2]});
        }
        int[] dist = new int[n];                                // @init
        java.util.Arrays.fill(dist, INF);                       // @init
        dist[src] = 0;                                          // @init
        boolean[] done = new boolean[n];
        while (true) {
            int u = -1;                                         // @pick
            for (int i = 0; i < n; i++) {                       // @pick
                if (!done[i] && dist[i] < INF && (u == -1 || dist[i] < dist[u])) {   // @pick
                    u = i;                                      // @pick
                }
            }
            if (u == -1) break;                                 // @pick
            done[u] = true;                                     // @settle
            for (int[] edge : adj.get(u)) {
                int v = edge[0];
                int w = edge[1];
                if (done[v]) continue;
                if (dist[u] + w < dist[v]) {                    // @relax
                    dist[v] = dist[u] + w;                      // @update
                }
            }
        }
        for (int i = 0; i < n; i++) {                           // @finish
            if (dist[i] == INF) dist[i] = -1;                   // @finish
        }
        return dist;                                            // @finish
    }
}
