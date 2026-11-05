#include <algorithm>
#include <vector>

int coinChange(std::vector<int> coins, int amount) {
    std::sort(coins.begin(), coins.end());          // @init
    int INF = amount + 1;                           // @init
    std::vector<int> dp(amount + 1, INF);           // @init
    dp[0] = 0;                                      // @base
    for (int a = 1; a <= amount; a++) {
        for (int coin : coins) {
            if (coin > a) {
                break;                              // @skip
            }
            int cand = dp[a - coin] + 1;            // @try
            dp[a] = std::min(dp[a], cand);          // @keep
        }
    }
    return dp[amount] == INF ? -1 : dp[amount];     // @done
}
