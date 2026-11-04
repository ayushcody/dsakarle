import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

class Solution {
    List<Integer> topoOrder(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();            // @indegree
        for (int i = 0; i < n; i++) {                           // @indegree
            adj.add(new ArrayList<>());                         // @indegree
        }
        int[] indegree = new int[n];                            // @indegree
        for (int[] e : edges) {                                 // @indegree
            adj.get(e[0]).add(e[1]);                            // @indegree
            indegree[e[1]]++;                                   // @indegree
        }
        Queue<Integer> queue = new ArrayDeque<>();              // @seed
        for (int i = 0; i < n; i++) {                           // @seed
            if (indegree[i] == 0) queue.add(i);                 // @seed
        }
        List<Integer> order = new ArrayList<>();                // @seed
        while (!queue.isEmpty()) {
            int u = queue.poll();                               // @pop
            order.add(u);                                       // @pop
            for (int v : adj.get(u)) {
                indegree[v]--;                                  // @drop
                if (indegree[v] == 0) {                         // @ready
                    queue.add(v);                               // @ready
                }
            }
        }
        return order.size() == n ? order : new ArrayList<>();   // @finish
    }
}
