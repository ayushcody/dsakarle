class Solution {
    int insert(int[] nums, int size, int i, int value) {
        if (size == nums.length) {         // @room
            return -1;                     // @room
        }
        for (int j = size; j > i; j--) {
            nums[j] = nums[j - 1];         // @shift
        }
        nums[i] = value;                   // @write
        return size + 1;                   // @done
    }
}
