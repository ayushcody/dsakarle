#include <vector>

int binarySearch(const std::vector<int>& nums, int target) {
    int lo = 0;                                 // @init
    int hi = (int)nums.size() - 1;              // @init
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;           // @mid
        if (nums[mid] == target) {              // @check
            return mid;                         // @done
        } else if (nums[mid] < target) {        // @check
            lo = mid + 1;                       // @go-right
        } else {
            hi = mid - 1;                       // @go-left
        }
    }
    return -1;                                  // @done
}
