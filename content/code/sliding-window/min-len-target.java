class Solution {
    int minLenTarget(int[] nums, int target) {
        int window = 0;                         // @init
        int best = Integer.MAX_VALUE;           // @init
        int left = 0;                           // @init
        for (int right = 0; right < nums.length; right++) {
            window += nums[right];              // @expand
            while (window >= target) {          // @check
                best = Math.min(best, right - left + 1);  // @record
                window -= nums[left];           // @shrink
                left++;                         // @shrink
            }
        }
        return best == Integer.MAX_VALUE ? 0 : best;  // @done
    }
}
