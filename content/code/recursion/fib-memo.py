def fib(k, memo):                          # @call
    if k < 2:
        return k                           # @base
    if k in memo:
        return memo[k]                     # @hit
    a = fib(k - 1, memo)                   # @compute
    b = fib(k - 2, memo)                   # @compute
    memo[k] = a + b                        # @store
    return memo[k]                         # @store
