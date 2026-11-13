import java.util.*;

class Solution {
    int countIslands(String[] grid) {
        int rows = grid.length, cols = grid[0].length();
        int[][] label = new int[rows][cols];                       // @init
        int count = 0;                                             // @init
        int[][] dirs = {{-1, 0}, {0, 1}, {1, 0}, {0, -1}};
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r].charAt(c) != '1') {                    // @scan
                    continue;                                      // @scan
                }
                if (label[r][c] != 0) {                            // @counted
                    continue;                                      // @counted
                }
                count++;                                           // @island
                label[r][c] = count;                               // @island
                ArrayDeque<int[]> stack = new ArrayDeque<>();      // @island
                stack.push(new int[]{r, c});                       // @island
                while (!stack.isEmpty()) {
                    int[] cell = stack.pop();                      // @visit
                    for (int[] d : dirs) {
                        int nr = cell[0] + d[0], nc = cell[1] + d[1];
                        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
                            continue;
                        }
                        if (grid[nr].charAt(nc) != '1' || label[nr][nc] != 0) {
                            continue;
                        }
                        label[nr][nc] = count;                     // @push
                        stack.push(new int[]{nr, nc});             // @push
                    }
                }
            }
        }
        return count;                                              // @done
    }
}
