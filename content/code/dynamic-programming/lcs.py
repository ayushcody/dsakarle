def longest_common_subsequence(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]              # @init
    for j in range(n + 1):
        dp[0][j] = 0                                        # @base
    for i in range(1, m + 1):
        dp[i][0] = 0                                        # @base
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:                        # @check
                dp[i][j] = dp[i - 1][j - 1] + 1             # @match
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])  # @mismatch
    i, j = m, n
    lcs = []
    while i > 0 and j > 0:
        if a[i - 1] == b[j - 1]:
            lcs.append(a[i - 1])                            # @trace
            i -= 1                                          # @trace
            j -= 1                                          # @trace
        elif dp[i - 1][j] >= dp[i][j - 1]:
            i -= 1                                          # @trace
        else:
            j -= 1                                          # @trace
    return "".join(reversed(lcs))  # length dp[m][n]       # @done
