import java.util.ArrayList;
import java.util.List;

class Solution {
    List<List<Integer>> buildAdjacency(int n, int[][] edges, boolean directed) {
        List<List<Integer>> adj = new ArrayList<>();        // @init
        for (int i = 0; i < n; i++) {                       // @init
            adj.add(new ArrayList<>());                     // @init
        }
        for (int[] edge : edges) {                          // @read
            int u = edge[0], v = edge[1];                   // @read
            adj.get(u).add(v);                              // @forward
            if (!directed) {                                // @back
                adj.get(v).add(u);                          // @back
            }
        }
        return adj;                                         // @done
    }
}
