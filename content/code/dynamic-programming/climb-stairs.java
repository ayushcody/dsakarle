class Solution {
    int climbStairs(int n) {
        int[] dp = new int[n + 1];                  // @init
        dp[0] = 1;                                  // @base
        dp[1] = 1;                                  // @base
        for (int i = 2; i <= n; i++) {
            int oneStep = dp[i - 1];                // @look
            int twoSteps = dp[i - 2];               // @look
            dp[i] = oneStep + twoSteps;             // @fill
        }
        return dp[n];                               // @done
    }
}
