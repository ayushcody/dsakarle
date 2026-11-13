import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
    int[][] merge(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));  // @sort
        List<int[]> merged = new ArrayList<>();
        merged.add(new int[] {intervals[0][0], intervals[0][1]});       // @start
        for (int i = 1; i < intervals.length; i++) {
            int start = intervals[i][0];
            int end = intervals[i][1];
            int[] last = merged.get(merged.size() - 1);
            if (start <= last[1]) {                 // @check
                last[1] = Math.max(last[1], end);   // @extend
            } else {
                merged.add(new int[] {start, end}); // @push
            }
        }
        return merged.toArray(new int[0][]);        // @done
    }
}
