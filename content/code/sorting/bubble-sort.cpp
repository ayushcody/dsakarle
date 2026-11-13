#include <utility>
#include <vector>

std::vector<int> bubbleSort(std::vector<int> nums) {
    int n = (int)nums.size();                   // @init
    for (int end = n - 1; end > 0; end--) {
        bool swapped = false;                   // @pass
        for (int j = 0; j < end; j++) {
            if (nums[j] > nums[j + 1]) {        // @compare
                std::swap(nums[j], nums[j + 1]);  // @swap
                swapped = true;                 // @swap
            }
        }
        if (!swapped) {                         // @check
            break;                              // @early
        }
    }
    return nums;                                // @done
}
