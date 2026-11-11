def factorial(n, stop):
    if n <= stop:                           # @check
        return 1                            # @base
    smaller = factorial(n - 1, stop)        # @call
    return n * smaller                      # @combine
