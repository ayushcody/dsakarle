#include <algorithm>
#include <numeric>
#include <vector>

int find(std::vector<int>& parent, int x) {
    while (parent[x] != x) {
        x = parent[x];
    }
    return x;
}

int kruskal(int n, std::vector<std::vector<int>> edges) {
    std::vector<int> parent(n);                              // @init
    std::iota(parent.begin(), parent.end(), 0);              // @init
    std::sort(edges.begin(), edges.end(), [](const auto& x, const auto& y) {  // @init
        if (x[2] != y[2]) return x[2] < y[2];                // @init
        int lx = std::min(x[0], x[1]), ly = std::min(y[0], y[1]);  // @init
        if (lx != ly) return lx < ly;                        // @init
        return std::max(x[0], x[1]) < std::max(y[0], y[1]);  // @init
    });                                                      // @init
    int total = 0;                                           // @init
    int used = 0;                                            // @init
    for (const auto& e : edges) {                            // @consider
        int a = e[0], b = e[1], w = e[2];                    // @consider
        int ra = find(parent, a);                            // @find
        int rb = find(parent, b);                            // @find
        if (ra == rb) continue;                              // @skip
        parent[rb] = ra;                                     // @take
        total += w;                                          // @take
        used++;                                              // @take
        if (used == n - 1) break;                            // @done
    }
    return total;                                            // @done
}
