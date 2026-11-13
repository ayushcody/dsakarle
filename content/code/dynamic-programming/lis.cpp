#include <algorithm>
#include <vector>

std::vector<int> longestIncreasingSubsequence(std::vector<int> a) {
    int n = a.size();
    std::vector<int> dp(n, 1);                              // @init
    for (int i = 1; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (a[j] >= a[i]) {                             // @check
                continue;                                   // @skip
            }
            dp[i] = std::max(dp[i], dp[j] + 1);             // @extend
        }
    }
    int k = std::max_element(dp.begin(), dp.end()) - dp.begin();   // @trace
    std::vector<int> seq = {a[k]};                          // @trace
    while (dp[k] > 1) {                                     // @trace
        int j = k - 1;                                      // @trace
        while (!(a[j] < a[k] && dp[j] == dp[k] - 1)) {      // @trace
            j--;                                            // @trace
        }
        k = j;                                              // @trace
        seq.push_back(a[k]);                                // @trace
    }
    std::reverse(seq.begin(), seq.end());                   // @done
    return seq;                                             // @done
}
