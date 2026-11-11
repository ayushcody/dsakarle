import java.util.*;

class Solution {
    int shortestPath(String[] grid) {
        int rows = grid.length, cols = grid[0].length();
        int sr = 0, sc = 0, er = 0, ec = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r].charAt(c) == 'S') { sr = r; sc = c; }
                if (grid[r].charAt(c) == 'E') { er = r; ec = c; }
            }
        }
        int[][] dist = new int[rows][cols];                        // @init
        for (int[] line : dist) Arrays.fill(line, -1);             // @init
        dist[sr][sc] = 0;                                          // @init
        ArrayDeque<int[]> queue = new ArrayDeque<>();              // @init
        queue.add(new int[]{sr, sc});                              // @init
        int[][] dirs = {{-1, 0}, {0, 1}, {1, 0}, {0, -1}};
        while (!queue.isEmpty()) {
            int[] cell = queue.poll();                             // @pop
            int r = cell[0], c = cell[1];                          // @pop
            if (r == er && c == ec) {                              // @done
                return dist[r][c];                                 // @done
            }
            for (int[] d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {  // @skip
                    continue;                                      // @skip
                }
                if (grid[nr].charAt(nc) == '#' || dist[nr][nc] != -1) {  // @skip
                    continue;                                      // @skip
                }
                dist[nr][nc] = dist[r][c] + 1;                     // @discover
                queue.add(new int[]{nr, nc});                      // @discover
            }
        }
        return -1;                                                 // @done
    }
}
