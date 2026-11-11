#include <queue>
#include <vector>

std::vector<int> findOrder(int numCourses, const std::vector<std::vector<int>>& prerequisites) {
    std::vector<std::vector<int>> adj(numCourses);          // @indegree
    std::vector<int> indegree(numCourses, 0);               // @indegree
    for (const auto& p : prerequisites) {                   // @indegree
        adj[p[1]].push_back(p[0]);                          // @indegree
        indegree[p[0]]++;                                   // @indegree
    }
    std::queue<int> queue;                                  // @seed
    for (int i = 0; i < numCourses; i++) {                  // @seed
        if (indegree[i] == 0) queue.push(i);                // @seed
    }
    std::vector<int> order;                                 // @seed
    while (!queue.empty()) {
        int u = queue.front();                              // @pop
        queue.pop();                                        // @pop
        order.push_back(u);                                 // @pop
        for (int v : adj[u]) {
            indegree[v]--;                                  // @drop
            if (indegree[v] == 0) {                         // @ready
                queue.push(v);                              // @ready
            }
        }
    }
    return (int)order.size() == numCourses ? order : std::vector<int>{};   // @finish
}
