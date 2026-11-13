import java.util.HashMap;
import java.util.Map;

class Solution {
    int fib(int k, Map<Integer, Integer> memo) {   // @call
        if (k < 2) {
            return k;                              // @base
        }
        if (memo.containsKey(k)) {
            return memo.get(k);                    // @hit
        }
        int a = fib(k - 1, memo);                  // @compute
        int b = fib(k - 2, memo);                  // @compute
        memo.put(k, a + b);                        // @store
        return memo.get(k);                        // @store
    }
}
