class Solution {
    int editDistance(String a, String b) {
        int m = a.length(), n = b.length();
        int[][] dp = new int[m + 1][n + 1];                 // @init
        for (int j = 0; j <= n; j++) {
            dp[0][j] = j;                                   // @base
        }
        for (int i = 1; i <= m; i++) {
            dp[i][0] = i;                                   // @base
        }
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {   // @check
                    dp[i][j] = dp[i - 1][j - 1];            // @match
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));   // @edit
                }
            }
        }
        return dp[m][n];                                    // @done
    }
}
