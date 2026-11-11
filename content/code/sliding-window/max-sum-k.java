class Solution {
    int maxSumK(int[] nums, int k) {
        int window = 0;                         // @init
        int best = Integer.MIN_VALUE;           // @init
        int left = 0;                           // @init
        for (int right = 0; right < nums.length; right++) {
            window += nums[right];              // @expand
            if (right - left + 1 > k) {
                window -= nums[left];           // @shrink
                left++;                         // @shrink
            }
            if (right - left + 1 == k) {
                best = Math.max(best, window);  // @record
            }
        }
        return best;                            // @done
    }
}
