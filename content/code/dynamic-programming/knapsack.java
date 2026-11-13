class Solution {
    int knapsack(int[] weights, int[] values, int capacity) {
        int n = weights.length;
        int[][] dp = new int[n + 1][capacity + 1];          // @init
        for (int w = 0; w <= capacity; w++) {
            dp[0][w] = 0;                                   // @base
        }
        for (int i = 1; i <= n; i++) {
            dp[i][0] = 0;                                   // @base
        }
        for (int i = 1; i <= n; i++) {
            int wt = weights[i - 1], val = values[i - 1];
            for (int w = 1; w <= capacity; w++) {
                if (wt > w) {
                    dp[i][w] = dp[i - 1][w];                // @skip
                    continue;
                }
                int skip = dp[i - 1][w];                    // @look
                int take = dp[i - 1][w - wt] + val;         // @look
                dp[i][w] = Math.max(skip, take);            // @pick
            }
        }
        return dp[n][capacity];                             // @done
    }
}
