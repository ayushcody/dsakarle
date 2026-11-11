#include <unordered_map>

int fibMemo(int k, std::unordered_map<int, int>& memo) {
    if (k < 2) {
        return k;
    }
    auto it = memo.find(k);
    if (it != memo.end()) {
        return it->second;
    }
    memo[k] = fibMemo(k - 1, memo) + fibMemo(k - 2, memo);
    return memo[k];
}

int fib(int n) {
    std::unordered_map<int, int> memo;
    return fibMemo(n, memo);
}
