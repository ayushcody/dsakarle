#include <algorithm>
#include <string>
#include <vector>

int editDistance(std::string a, std::string b) {
    int m = a.size(), n = b.size();
    std::vector<std::vector<int>> dp(m + 1, std::vector<int>(n + 1, 0));   // @init
    for (int j = 0; j <= n; j++) {
        dp[0][j] = j;                                       // @base
    }
    for (int i = 1; i <= m; i++) {
        dp[i][0] = i;                                       // @base
    }
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (a[i - 1] == b[j - 1]) {                     // @check
                dp[i][j] = dp[i - 1][j - 1];                // @match
            } else {
                dp[i][j] = 1 + std::min({dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]});   // @edit
            }
        }
    }
    return dp[m][n];                                        // @done
}
