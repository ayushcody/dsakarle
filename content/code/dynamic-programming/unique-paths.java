class Solution {
    int uniquePaths(int m, int n) {
        int[][] dp = new int[m][n];                 // @init
        for (int r = 0; r < m; r++) {
            dp[r][0] = 1;                           // @base
        }
        for (int c = 0; c < n; c++) {
            dp[0][c] = 1;                           // @base
        }
        for (int r = 1; r < m; r++) {
            for (int c = 1; c < n; c++) {
                int up = dp[r - 1][c];              // @look
                int left = dp[r][c - 1];            // @look
                dp[r][c] = up + left;               // @fill
            }
        }
        return dp[m - 1][n - 1];                    // @done
    }
}
