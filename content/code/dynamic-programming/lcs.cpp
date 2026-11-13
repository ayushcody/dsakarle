#include <algorithm>
#include <string>
#include <vector>

std::string longestCommonSubsequence(std::string a, std::string b) {
    int m = a.size(), n = b.size();
    std::vector<std::vector<int>> dp(m + 1, std::vector<int>(n + 1, 0));   // @init
    for (int j = 0; j <= n; j++) {
        dp[0][j] = 0;                                       // @base
    }
    for (int i = 1; i <= m; i++) {
        dp[i][0] = 0;                                       // @base
    }
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (a[i - 1] == b[j - 1]) {                     // @check
                dp[i][j] = dp[i - 1][j - 1] + 1;            // @match
            } else {
                dp[i][j] = std::max(dp[i - 1][j], dp[i][j - 1]);   // @mismatch
            }
        }
    }
    int i = m, j = n;
    std::string lcs;
    while (i > 0 && j > 0) {
        if (a[i - 1] == b[j - 1]) {
            lcs += a[i - 1];                                // @trace
            i--;                                            // @trace
            j--;                                            // @trace
        } else if (dp[i - 1][j] >= dp[i][j - 1]) {
            i--;                                            // @trace
        } else {
            j--;                                            // @trace
        }
    }
    std::reverse(lcs.begin(), lcs.end());                   // @done
    return lcs;  // its length is dp[m][n]                  // @done
}
