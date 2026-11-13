#include <unordered_map>

int fib(int k, std::unordered_map<int, int>& memo) {   // @call
    if (k < 2) {
        return k;                                      // @base
    }
    if (memo.count(k)) {
        return memo[k];                                // @hit
    }
    int a = fib(k - 1, memo);                          // @compute
    int b = fib(k - 2, memo);                          // @compute
    memo[k] = a + b;                                   // @store
    return memo[k];                                    // @store
}
