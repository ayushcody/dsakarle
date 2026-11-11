class Solution {
    int firstTrue(int[] nums, int target) {
        int lo = 0;                             // @init
        int hi = nums.length;                   // @init
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;       // @mid
            if (nums[mid] >= target) {          // @check
                hi = mid;                       // @keep
            } else {
                lo = mid + 1;                   // @skip
            }
        }
        return lo;                              // @done
    }
}
