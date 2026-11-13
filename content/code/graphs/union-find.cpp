#include <numeric>
#include <utility>
#include <vector>

int find(std::vector<int>& parent, int x) {
    int root = x;
    while (parent[root] != root) {                          // @find
        root = parent[root];                                // @find
    }
    while (parent[x] != root) {                             // @compress
        int next = parent[x];                               // @compress
        parent[x] = root;                                   // @compress
        x = next;                                           // @compress
    }
    return root;
}

int countGroups(int n, const std::vector<std::vector<int>>& edges) {
    std::vector<int> parent(n);                             // @init
    std::iota(parent.begin(), parent.end(), 0);             // @init
    std::vector<int> size(n, 1);                            // @init
    int components = n;                                     // @init
    for (const auto& e : edges) {
        int ra = find(parent, e[0]);
        int rb = find(parent, e[1]);
        if (ra == rb) continue;                             // @same
        if (size[ra] < size[rb]) std::swap(ra, rb);         // @union
        parent[rb] = ra;                                    // @union
        size[ra] += size[rb];                               // @union
        components--;                                       // @union
    }
    return components;                                      // @finish
}
