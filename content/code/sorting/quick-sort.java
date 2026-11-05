class Solution {
    int[] quickSort(int[] nums) {
        sortRange(nums, 0, nums.length - 1);    // @init
        return nums;                            // @done
    }

    void sortRange(int[] nums, int lo, int hi) {
        if (lo >= hi) {                         // @base
            return;                             // @base
        }
        int pivot = nums[hi];                   // @pivot
        int i = lo;                             // @pivot
        for (int j = lo; j < hi; j++) {         // @scan
            if (nums[j] < pivot) {              // @scan
                int temp = nums[i];             // @swap
                nums[i] = nums[j];              // @swap
                nums[j] = temp;                 // @swap
                i++;                            // @swap
            }
        }
        int temp = nums[i];                     // @place
        nums[i] = nums[hi];                     // @place
        nums[hi] = temp;                        // @place
        sortRange(nums, lo, i - 1);             // @recurse
        sortRange(nums, i + 1, hi);             // @recurse
    }
}
