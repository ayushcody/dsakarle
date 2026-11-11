#include <utility>
#include <vector>

void sortRange(std::vector<int>& nums, int lo, int hi) {
    if (lo >= hi) {                             // @base
        return;                                 // @base
    }
    int pivot = nums[hi];                       // @pivot
    int i = lo;                                 // @pivot
    for (int j = lo; j < hi; j++) {             // @scan
        if (nums[j] < pivot) {                  // @scan
            std::swap(nums[i], nums[j]);        // @swap
            i++;                                // @swap
        }
    }
    std::swap(nums[i], nums[hi]);               // @place
    sortRange(nums, lo, i - 1);                 // @recurse
    sortRange(nums, i + 1, hi);                 // @recurse
}

std::vector<int> quickSort(std::vector<int> nums) {
    sortRange(nums, 0, (int)nums.size() - 1);   // @init
    return nums;                                // @done
}
