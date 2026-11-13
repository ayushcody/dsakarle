class Solution {
    String longestCommonSubsequence(String a, String b) {
        int m = a.length(), n = b.length();
        int[][] dp = new int[m + 1][n + 1];                 // @init
        for (int j = 0; j <= n; j++) {
            dp[0][j] = 0;                                   // @base
        }
        for (int i = 1; i <= m; i++) {
            dp[i][0] = 0;                                   // @base
        }
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {   // @check
                    dp[i][j] = dp[i - 1][j - 1] + 1;        // @match
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);   // @mismatch
                }
            }
        }
        int i = m, j = n;
        StringBuilder lcs = new StringBuilder();
        while (i > 0 && j > 0) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) {
                lcs.append(a.charAt(i - 1));                // @trace
                i--;                                        // @trace
                j--;                                        // @trace
            } else if (dp[i - 1][j] >= dp[i][j - 1]) {
                i--;                                        // @trace
            } else {
                j--;                                        // @trace
            }
        }
        return lcs.reverse().toString();  // length dp[m][n] // @done
    }
}
