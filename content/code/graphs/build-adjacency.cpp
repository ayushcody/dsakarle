#include <vector>

std::vector<std::vector<int>> buildAdjacency(int n, const std::vector<std::vector<int>>& edges, bool directed) {
    std::vector<std::vector<int>> adj(n);       // @init
    for (const auto& edge : edges) {            // @read
        int u = edge[0], v = edge[1];           // @read
        adj[u].push_back(v);                    // @forward
        if (!directed) {                        // @back
            adj[v].push_back(u);                // @back
        }
    }
    return adj;                                 // @done
}
