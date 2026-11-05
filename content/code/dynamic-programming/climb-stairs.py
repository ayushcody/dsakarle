def climb_stairs(n):
    dp = [0] * (n + 1)                          # @init
    dp[0] = dp[1] = 1                           # @base
    for i in range(2, n + 1):
        one_step = dp[i - 1]                    # @look
        two_steps = dp[i - 2]                   # @look
        dp[i] = one_step + two_steps            # @fill
    return dp[n]                                # @done
