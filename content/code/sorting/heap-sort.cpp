#include <utility>
#include <vector>

void siftDown(std::vector<int>& nums, int i, int size) {
    while (2 * i + 1 < size) {
        int child = 2 * i + 1;                          // @sift
        if (child + 1 < size && nums[child + 1] > nums[child]) {  // @sift
            child++;                                    // @sift
        }
        if (nums[child] <= nums[i]) {                   // @sift
            return;
        }
        std::swap(nums[i], nums[child]);                // @swap
        i = child;                                      // @swap
    }
}

std::vector<int> heapSort(std::vector<int> nums) {
    int n = (int)nums.size();
    for (int start = n / 2 - 1; start >= 0; start--) {
        siftDown(nums, start, n);                       // @build
    }
    for (int end = n - 1; end > 0; end--) {
        std::swap(nums[0], nums[end]);                  // @extract
        siftDown(nums, 0, end);                         // @shrink
    }
    return nums;                                        // @done
}
