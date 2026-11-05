#include <vector>

std::vector<int> pairSum(const std::vector<int>& nums, int target) {
    int left = 0;                               // @init
    int right = (int)nums.size() - 1;           // @init
    while (left < right) {
        int total = nums[left] + nums[right];   // @compare
        if (total == target) {                  // @found
            return {left + 1, right + 1};       // @done
        }
        if (total < target) {                   // @move-left
            left++;                             // @move-left
        } else {
            right--;                            // @move-right
        }
    }
    return {-1, -1};                            // @done
}
