def unique_paths(m, n):
    dp = [[0] * n for _ in range(m)]            # @init
    for r in range(m):
        dp[r][0] = 1                            # @base
    for c in range(n):
        dp[0][c] = 1                            # @base
    for r in range(1, m):
        for c in range(1, n):
            up = dp[r - 1][c]                   # @look
            left = dp[r][c - 1]                 # @look
            dp[r][c] = up + left                # @fill
    return dp[m - 1][n - 1]                     # @done
