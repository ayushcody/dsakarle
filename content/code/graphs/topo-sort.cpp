#include <queue>
#include <vector>

std::vector<int> topoOrder(int n, const std::vector<std::vector<int>>& edges) {
    std::vector<std::vector<int>> adj(n);                   // @indegree
    std::vector<int> indegree(n, 0);                        // @indegree
    for (const auto& e : edges) {                           // @indegree
        adj[e[0]].push_back(e[1]);                          // @indegree
        indegree[e[1]]++;                                   // @indegree
    }
    std::queue<int> queue;                                  // @seed
    for (int i = 0; i < n; i++) {                           // @seed
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
    return (int)order.size() == n ? order : std::vector<int>{};   // @finish
}
