#include <queue>
#include <string>
#include <utility>
#include <vector>

int shortestPath(const std::vector<std::string>& grid) {
    int rows = grid.size(), cols = grid[0].size();
    int sr = 0, sc = 0, er = 0, ec = 0;
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == 'S') { sr = r; sc = c; }
            if (grid[r][c] == 'E') { er = r; ec = c; }
        }
    }
    std::vector<std::vector<int>> dist(rows, std::vector<int>(cols, -1));  // @init
    dist[sr][sc] = 0;                                                       // @init
    std::queue<std::pair<int, int>> queue;                                  // @init
    queue.push({sr, sc});                                                   // @init
    const int dirs[4][2] = {{-1, 0}, {0, 1}, {1, 0}, {0, -1}};
    while (!queue.empty()) {
        auto [r, c] = queue.front();                                        // @pop
        queue.pop();                                                        // @pop
        if (r == er && c == ec) {                                           // @done
            return dist[r][c];                                              // @done
        }
        for (const auto& d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {             // @skip
                continue;                                                   // @skip
            }
            if (grid[nr][nc] == '#' || dist[nr][nc] != -1) {                // @skip
                continue;                                                   // @skip
            }
            dist[nr][nc] = dist[r][c] + 1;                                  // @discover
            queue.push({nr, nc});                                           // @discover
        }
    }
    return -1;                                                              // @done
}
