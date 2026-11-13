#include <algorithm>
#include <vector>

int knapsack(std::vector<int> weights, std::vector<int> values, int capacity) {
    int n = weights.size();
    std::vector<std::vector<int>> dp(n + 1, std::vector<int>(capacity + 1, 0));   // @init
    for (int w = 0; w <= capacity; w++) {
        dp[0][w] = 0;                                       // @base
    }
    for (int i = 1; i <= n; i++) {
        dp[i][0] = 0;                                       // @base
    }
    for (int i = 1; i <= n; i++) {
        int wt = weights[i - 1], val = values[i - 1];
        for (int w = 1; w <= capacity; w++) {
            if (wt > w) {
                dp[i][w] = dp[i - 1][w];                    // @skip
                continue;
            }
            int skip = dp[i - 1][w];                        // @look
            int take = dp[i - 1][w - wt] + val;             // @look
            dp[i][w] = std::max(skip, take);                // @pick
        }
    }
    return dp[n][capacity];                                 // @done
}
