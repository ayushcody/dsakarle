#include <vector>

int findMin(const std::vector<int>& nums) {
    int lo = 0;                                 // @init
    int hi = (int)nums.size() - 1;              // @init
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;           // @mid
        if (nums[mid] > nums[hi]) {             // @compare
            lo = mid + 1;                       // @go-right
        } else {
            hi = mid;                           // @go-left
        }
    }
    return nums[lo];                            // @done
}
