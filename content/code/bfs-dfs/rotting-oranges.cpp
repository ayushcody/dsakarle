#include <queue>
#include <utility>
#include <vector>

int orangesRotting(const std::vector<std::vector<int>>& grid) {
    int rows = grid.size(), cols = grid[0].size();
    std::vector<std::vector<int>> minutes(rows, std::vector<int>(cols, -1));
    std::queue<std::pair<int, int>> queue;
    int fresh = 0;
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == 2) {
                minutes[r][c] = 0;
                queue.push({r, c});
            } else if (grid[r][c] == 1) {
                fresh++;
            }
        }
    }
    int last = 0;
    const int dirs[4][2] = {{-1, 0}, {0, 1}, {1, 0}, {0, -1}};
    while (!queue.empty()) {
        auto [r, c] = queue.front();
        queue.pop();
        for (const auto& d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
                continue;
            }
            if (grid[nr][nc] != 1 || minutes[nr][nc] != -1) {
                continue;
            }
            minutes[nr][nc] = minutes[r][c] + 1;
            last = minutes[nr][nc];
            fresh--;
            queue.push({nr, nc});
        }
    }
    return fresh == 0 ? last : -1;
}
