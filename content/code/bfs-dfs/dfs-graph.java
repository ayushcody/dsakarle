import java.util.*;

class Solution {
    void dfs(List<List<Integer>> graph, int node, boolean[] visited, List<Integer> order) {
        visited[node] = true;                          // @visit
        order.add(node);                               // @visit
        for (int nxt : graph.get(node)) {
            if (visited[nxt]) {                        // @skip
                continue;                              // @skip
            }
            dfs(graph, nxt, visited, order);           // @descend
        }
        return;                                        // @backtrack
    }

    List<Integer> dfsOrder(List<List<Integer>> graph, int start) {
        boolean[] visited = new boolean[graph.size()]; // @init
        List<Integer> order = new ArrayList<>();       // @init
        dfs(graph, start, visited, order);
        return order;                                  // @done
    }
}
