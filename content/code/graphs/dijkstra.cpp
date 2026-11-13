#include <utility>
#include <vector>

std::vector<int> dijkstra(int n, const std::vector<std::vector<int>>& edges, int src) {
    const int INF = 1000000000;
    std::vector<std::vector<std::pair<int, int>>> adj(n);
    for (const auto& e : edges) {
        adj[e[0]].push_back({e[1], e[2]});
        adj[e[1]].push_back({e[0], e[2]});
    }
    std::vector<int> dist(n, INF);                          // @init
    dist[src] = 0;                                          // @init
    std::vector<bool> done(n, false);
    while (true) {
        int u = -1;                                         // @pick
        for (int i = 0; i < n; i++) {                       // @pick
            if (!done[i] && dist[i] < INF && (u == -1 || dist[i] < dist[u])) {   // @pick
                u = i;                                      // @pick
            }
        }
        if (u == -1) break;                                 // @pick
        done[u] = true;                                     // @settle
        for (const auto& [v, w] : adj[u]) {
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
