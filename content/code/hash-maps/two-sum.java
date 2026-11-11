import java.util.HashMap;
import java.util.Map;

class Solution {
    int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();   // @init
        int[] answer = {};                              // @init
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];                // @need
            if (seen.containsKey(need)) {               // @check
                answer = new int[] {seen.get(need), i}; // @found
                break;                                  // @found
            }
            seen.put(nums[i], i);                       // @store
        }
        return answer;                                  // @done
    }
}
