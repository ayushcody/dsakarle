def fib(n):
    memo = {}

    def go(k):
        if k < 2:
            return k
        if k not in memo:
            memo[k] = go(k - 1) + go(k - 2)
        return memo[k]

    return go(n)
