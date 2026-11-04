import java.util.Arrays;

class Solution {
    int coinChange(int[] coins, int amount) {
        Arrays.sort(coins);                         // @init
        int INF = amount + 1;                       // @init
        int[] dp = new int[amount + 1];             // @init
        Arrays.fill(dp, INF);                       // @init
        dp[0] = 0;                                  // @base
        for (int a = 1; a <= amount; a++) {
            for (int coin : coins) {
                if (coin > a) {
                    break;                          // @skip
                }
                int cand = dp[a - coin] + 1;        // @try
                dp[a] = Math.min(dp[a], cand);      // @keep
            }
        }
        return dp[amount] == INF ? -1 : dp[amount]; // @done
    }
}
