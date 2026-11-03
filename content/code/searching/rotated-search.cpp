#include <vector>

int search(const std::vector<int>& nums, int target) {
    int lo = 0;                                             // @init
    int hi = (int)nums.size() - 1;                          // @init
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;                       // @mid
        if (nums[mid] == target) {                          // @check
            return mid;                                     // @done
        }
        if (nums[lo] <= nums[mid]) {                        // @which
            if (nums[lo] <= target && target < nums[mid]) { // @inside
                hi = mid - 1;                               // @go-left
            } else {
                lo = mid + 1;                               // @go-right
            }
        } else {
            if (nums[mid] < target && target <= nums[hi]) { // @inside
                lo = mid + 1;                               // @go-right
            } else {
                hi = mid - 1;                               // @go-left
            }
        }
    }
    return -1;                                              // @done
}
