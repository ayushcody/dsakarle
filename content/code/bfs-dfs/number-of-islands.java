class Solution {
    int numIslands(char[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        boolean[][] seen = new boolean[rows][cols];
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

    void sink(char[][] grid, boolean[][] seen, int r, int c) {
        int rows = grid.length, cols = grid[0].length;
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
}
