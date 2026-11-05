import java.util.HashSet;
import java.util.Set;

class Solution {
    int longestConsecutive(int[] nums) {
        Set<Integer> values = new HashSet<>();
        for (int v : nums) {
            values.add(v);
        }
        int best = 0;
        for (int v : values) {
            if (!values.contains(v - 1)) {
                int length = 1;
                while (values.contains(v + length)) {
                    length++;
                }
                best = Math.max(best, length);
            }
        }
        return best;
    }
}
