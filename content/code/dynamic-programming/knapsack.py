def knapsack(weights, values, capacity):
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]       # @init
    for w in range(capacity + 1):
        dp[0][w] = 0                                        # @base
    for i in range(1, n + 1):
        dp[i][0] = 0                                        # @base
    for i in range(1, n + 1):
        wt, val = weights[i - 1], values[i - 1]
        for w in range(1, capacity + 1):
            if wt > w:
                dp[i][w] = dp[i - 1][w]                     # @skip
                continue
            skip = dp[i - 1][w]                             # @look
            take = dp[i - 1][w - wt] + val                  # @look
            dp[i][w] = max(skip, take)                      # @pick
    return dp[n][capacity]                                  # @done
