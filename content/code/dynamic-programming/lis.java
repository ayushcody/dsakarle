import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

class Solution {
    List<Integer> longestIncreasingSubsequence(int[] a) {
        int n = a.length;
        int[] dp = new int[n];
        for (int i = 0; i < n; i++) {
            dp[i] = 1;                                      // @init
        }
        for (int i = 1; i < n; i++) {
            for (int j = 0; j < i; j++) {
                if (a[j] >= a[i]) {                         // @check
                    continue;                               // @skip
                }
                dp[i] = Math.max(dp[i], dp[j] + 1);         // @extend
            }
        }
        int k = 0;                                          // @trace
        for (int i = 1; i < n; i++) {
            if (dp[i] > dp[k]) {
                k = i;                                      // @trace
            }
        }
        List<Integer> seq = new ArrayList<>();
        seq.add(a[k]);                                      // @trace
        while (dp[k] > 1) {                                 // @trace
            int j = k - 1;                                  // @trace
            while (!(a[j] < a[k] && dp[j] == dp[k] - 1)) {  // @trace
                j--;                                        // @trace
            }
            k = j;                                          // @trace
            seq.add(a[k]);                                  // @trace
        }
        Collections.reverse(seq);                           // @done
        return seq;                                         // @done
    }
}
