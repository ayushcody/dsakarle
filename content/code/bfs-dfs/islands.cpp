#include <stack>
#include <string>
#include <utility>
#include <vector>

int countIslands(const std::vector<std::string>& grid) {
    int rows = grid.size(), cols = grid[0].size();
    std::vector<std::vector<int>> label(rows, std::vector<int>(cols, 0));  // @init
    int count = 0;                                                         // @init
    const int dirs[4][2] = {{-1, 0}, {0, 1}, {1, 0}, {0, -1}};
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] != '1') {                                       // @scan
                continue;                                                  // @scan
            }
            if (label[r][c] != 0) {                                        // @counted
                continue;                                                  // @counted
            }
            count++;                                                       // @island
            label[r][c] = count;                                           // @island
            std::stack<std::pair<int, int>> stack;                         // @island
            stack.push({r, c});                                            // @island
            while (!stack.empty()) {
                auto [cr, cc] = stack.top();                               // @visit
                stack.pop();                                               // @visit
                for (const auto& d : dirs) {
                    int nr = cr + d[0], nc = cc + d[1];
                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
                        continue;
                    }
                    if (grid[nr][nc] != '1' || label[nr][nc] != 0) {
                        continue;
                    }
                    label[nr][nc] = count;                                 // @push
                    stack.push({nr, nc});                                  // @push
                }
            }
        }
    }
    return count;                                                          // @done
}
