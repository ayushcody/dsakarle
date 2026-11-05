#include <vector>

void sortRange(std::vector<int>& nums, std::vector<int>& merged, int lo, int hi) {
    if (lo >= hi) {                                     // @base
        return;                                         // @base
    }
    int mid = (lo + hi) / 2;                            // @split
    sortRange(nums, merged, lo, mid);                   // @split
    sortRange(nums, merged, mid + 1, hi);               // @split
    int i = lo, j = mid + 1, k = lo;                    // @merge
    while (i <= mid && j <= hi) {
        if (nums[i] <= nums[j]) {                       // @take
            merged[k] = nums[i];                        // @take
            i++;                                        // @take
        } else {
            merged[k] = nums[j];                        // @take
            j++;                                        // @take
        }
        k++;                                            // @take
    }
    while (i <= mid) {                                  // @drain
        merged[k] = nums[i];                            // @drain
        i++;                                            // @drain
        k++;                                            // @drain
    }
    while (j <= hi) {                                   // @drain
        merged[k] = nums[j];                            // @drain
        j++;                                            // @drain
        k++;                                            // @drain
    }
    for (int p = lo; p <= hi; p++) {                    // @copy
        nums[p] = merged[p];                            // @copy
    }
}

std::vector<int> mergeSort(std::vector<int> nums) {
    std::vector<int> merged(nums.size());               // @init
    sortRange(nums, merged, 0, (int)nums.size() - 1);   // @init
    return nums;                                        // @done
}
