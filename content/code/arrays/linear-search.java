class Solution {
    int linearSearch(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) {    // @next
            if (nums[i] == target) {               // @compare
                return i;                          // @done
            }
        }
        return -1;                                 // @done
    }
}
