class Solution {
    void siftDown(int[] nums, int i, int size) {
        while (2 * i + 1 < size) {
            int child = 2 * i + 1;                      // @sift
            if (child + 1 < size && nums[child + 1] > nums[child]) {  // @sift
                child++;                                // @sift
            }
            if (nums[child] <= nums[i]) {               // @sift
                return;
            }
            int tmp = nums[i];                          // @swap
            nums[i] = nums[child];                      // @swap
            nums[child] = tmp;                          // @swap
            i = child;                                  // @swap
        }
    }

    int[] heapSort(int[] nums) {
        int n = nums.length;
        for (int start = n / 2 - 1; start >= 0; start--) {
            siftDown(nums, start, n);                   // @build
        }
        for (int end = n - 1; end > 0; end--) {
            int top = nums[0];                          // @extract
            nums[0] = nums[end];                        // @extract
            nums[end] = top;                            // @extract
            siftDown(nums, 0, end);                     // @shrink
        }
        return nums;                                    // @done
    }
}
