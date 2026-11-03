class Solution {
    int[] pairSum(int[] nums, int target) {
        int left = 0;                               // @init
        int right = nums.length - 1;                // @init
        while (left < right) {
            int total = nums[left] + nums[right];   // @compare
            if (total == target) {                  // @found
                return new int[]{left + 1, right + 1};  // @done
            }
            if (total < target) {                   // @move-left
                left++;                             // @move-left
            } else {
                right--;                            // @move-right
            }
        }
        return new int[]{-1, -1};                   // @done
    }
}
