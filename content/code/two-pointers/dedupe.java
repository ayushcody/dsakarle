class Solution {
    int removeDuplicates(int[] nums) {
        int slow = 0;                               // @init
        for (int fast = 1; fast < nums.length; fast++) {  // @read
            if (nums[fast] != nums[slow]) {         // @compare
                slow++;                             // @write
                nums[slow] = nums[fast];            // @write
            }
        }
        return slow + 1;                            // @done
    }
}
