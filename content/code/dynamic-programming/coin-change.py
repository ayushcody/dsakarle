def coin_change(coins, amount):
    coins = sorted(coins)                       # @init
    INF = amount + 1                            # @init
    dp = [INF] * (amount + 1)                   # @init
    dp[0] = 0                                   # @base
    for a in range(1, amount + 1):
        for coin in coins:
            if coin > a:
                break                           # @skip
            cand = dp[a - coin] + 1             # @try
            dp[a] = min(dp[a], cand)            # @keep
    return -1 if dp[amount] == INF else dp[amount]    # @done
