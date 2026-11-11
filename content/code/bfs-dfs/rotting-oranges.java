import java.util.*;

class Solution {
    int orangesRotting(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        int[][] minutes = new int[rows][cols];
        ArrayDeque<int[]> queue = new ArrayDeque<>();
        int fresh = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                minutes[r][c] = -1;
                if (grid[r][c] == 2) {
                    minutes[r][c] = 0;
                    queue.add(new int[]{r, c});
                } else if (grid[r][c] == 1) {
                    fresh++;
                }
            }
        }
        int last = 0;
        int[][] dirs = {{-1, 0}, {0, 1}, {1, 0}, {0, -1}};
        while (!queue.isEmpty()) {
            int[] cell = queue.poll();
            int r = cell[0], c = cell[1];
            for (int[] d : dirs) {
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
                queue.add(new int[]{nr, nc});
            }
        }
        return fresh == 0 ? last : -1;
    }
}
