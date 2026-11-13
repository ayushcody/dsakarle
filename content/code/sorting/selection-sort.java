class Solution {
    int[] selectionSort(int[] nums) {
        int n = nums.length;                    // @init
        for (int i = 0; i < n - 1; i++) {
            int lowest = i;                     // @outer
            for (int j = i + 1; j < n; j++) {
                if (nums[j] < nums[lowest]) {   // @scan
                    lowest = j;                 // @newmin
                }
            }
            int tmp = nums[i];                  // @swap
            nums[i] = nums[lowest];             // @swap
            nums[lowest] = tmp;                 // @swap
        }
        return nums;                            // @done
    }
}
