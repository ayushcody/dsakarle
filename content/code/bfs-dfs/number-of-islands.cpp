#include <vector>

void sink(const std::vector<std::vector<char>>& grid, std::vector<std::vector<bool>>& seen, int r, int c) {
    int rows = grid.size(), cols = grid[0].size();
    if (r < 0 || r >= rows || c < 0 || c >= cols) {
        return;
    }
    if (grid[r][c] == '0' || seen[r][c]) {
        return;
    }
    seen[r][c] = true;
    sink(grid, seen, r - 1, c);
    sink(grid, seen, r + 1, c);
    sink(grid, seen, r, c - 1);
    sink(grid, seen, r, c + 1);
}

int numIslands(const std::vector<std::vector<char>>& grid) {
    int rows = grid.size(), cols = grid[0].size();
    std::vector<std::vector<bool>> seen(rows, std::vector<bool>(cols, false));
    int count = 0;
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == '1' && !seen[r][c]) {
                count++;
                sink(grid, seen, r, c);
            }
        }
    }
    return count;
}
