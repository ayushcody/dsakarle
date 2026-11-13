class Solution {
    int[] bubbleSort(int[] nums) {
        int n = nums.length;                    // @init
        for (int end = n - 1; end > 0; end--) {
            boolean swapped = false;            // @pass
            for (int j = 0; j < end; j++) {
                if (nums[j] > nums[j + 1]) {    // @compare
                    int tmp = nums[j];          // @swap
                    nums[j] = nums[j + 1];      // @swap
                    nums[j + 1] = tmp;          // @swap
                    swapped = true;             // @swap
                }
            }
            if (!swapped) {                     // @check
                break;                          // @early
            }
        }
        return nums;                            // @done
    }
}
