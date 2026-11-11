import java.util.Arrays;

class Solution {
    int eraseOverlapIntervals(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));  // @sort
        int removed = 0;                            // @init
        int lastEnd = Integer.MIN_VALUE;            // @init
        for (int[] iv : intervals) {
            int start = iv[0];
            int end = iv[1];
            if (start >= lastEnd) {                 // @check
                lastEnd = end;                      // @keep
            } else {
                removed++;                          // @drop
            }
        }
        return removed;                             // @done
    }
}
