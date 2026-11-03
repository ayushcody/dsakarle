#include <vector>

int linearSearch(const std::vector<int>& nums, int target) {
    for (int i = 0; i < (int)nums.size(); i++) {   // @next
        if (nums[i] == target) {                   // @compare
            return i;                              // @done
        }
    }
    return -1;                                     // @done
}
