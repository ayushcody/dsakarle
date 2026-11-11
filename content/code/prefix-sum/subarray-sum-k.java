import java.util.HashMap;
import java.util.Map;

class Solution {
    public int subarraySum(int[] nums, int k) {
        Map<Integer, Integer> seen = new HashMap<>();
        seen.put(0, 1);                                          // @init
        int running = 0;                                         // @init
        int count = 0;                                           // @init
        for (int i = 0; i < nums.length; i++) {
            running += nums[i];                                  // @add
            count += seen.getOrDefault(running - k, 0);          // @check
            seen.put(running, seen.getOrDefault(running, 0) + 1); // @store
        }
        return count;                                            // @done
    }
}
