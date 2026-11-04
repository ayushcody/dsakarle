#include <vector>

void dfs(const std::vector<std::vector<int>>& graph, int node,
         std::vector<bool>& visited, std::vector<int>& order) {
    visited[node] = true;                              // @visit
    order.push_back(node);                             // @visit
    for (int nxt : graph[node]) {
        if (visited[nxt]) {                            // @skip
            continue;                                  // @skip
        }
        dfs(graph, nxt, visited, order);               // @descend
    }
    return;                                            // @backtrack
}

std::vector<int> dfsOrder(const std::vector<std::vector<int>>& graph, int start) {
    std::vector<bool> visited(graph.size(), false);    // @init
    std::vector<int> order;                            // @init
    dfs(graph, start, visited, order);
    return order;                                      // @done
}
