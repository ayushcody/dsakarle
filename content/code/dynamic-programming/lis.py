def longest_increasing_subsequence(a):
    n = len(a)
    dp = [1] * n                                            # @init
    for i in range(1, n):
        for j in range(i):
            if a[j] >= a[i]:                                # @check
                continue                                    # @skip
            dp[i] = max(dp[i], dp[j] + 1)                   # @extend
    k = dp.index(max(dp))                                   # @trace
    seq = [a[k]]                                            # @trace
    while dp[k] > 1:                                        # @trace
        j = k - 1                                           # @trace
        while not (a[j] < a[k] and dp[j] == dp[k] - 1):     # @trace
            j -= 1                                          # @trace
        k = j                                               # @trace
        seq.append(a[k])                                    # @trace
    return seq[::-1]                                        # @done
