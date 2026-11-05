import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

class Solution {
    int[] findOrder(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();            // @indegree
        for (int i = 0; i < numCourses; i++) {                  // @indegree
            adj.add(new ArrayList<>());                         // @indegree
        }
        int[] indegree = new int[numCourses];                   // @indegree
        for (int[] p : prerequisites) {                         // @indegree
            adj.get(p[1]).add(p[0]);                            // @indegree
            indegree[p[0]]++;                                   // @indegree
        }
        Queue<Integer> queue = new ArrayDeque<>();              // @seed
        for (int i = 0; i < numCourses; i++) {                  // @seed
            if (indegree[i] == 0) queue.add(i);                 // @seed
        }
        int[] order = new int[numCourses];                      // @seed
        int taken = 0;                                          // @seed
        while (!queue.isEmpty()) {
            int u = queue.poll();                               // @pop
            order[taken++] = u;                                 // @pop
            for (int v : adj.get(u)) {
                indegree[v]--;                                  // @drop
                if (indegree[v] == 0) {                         // @ready
                    queue.add(v);                               // @ready
                }
            }
        }
        return taken == numCourses ? order : new int[0];        // @finish
    }
}
