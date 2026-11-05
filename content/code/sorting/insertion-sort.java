class Solution {
    int[] insertionSort(int[] nums) {
        int n = nums.length;                    // @init
        for (int i = 1; i < n; i++) {
            int key = nums[i];                  // @pick
            int j = i - 1;                      // @pick
            while (j >= 0 && nums[j] > key) {   // @compare
                nums[j + 1] = nums[j];          // @shift
                j--;                            // @shift
            }
            nums[j + 1] = key;                  // @place
        }
        return nums;                            // @done
    }
}
