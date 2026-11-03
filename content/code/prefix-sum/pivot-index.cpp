#include <numeric>
#include <vector>

int pivotIndex(const std::vector<int>& nums) {
    int total = std::accumulate(nums.begin(), nums.end(), 0);
    int left = 0;
    for (int i = 0; i < static_cast<int>(nums.size()); i++) {
        if (left == total - left - nums[i]) {
            return i;
        }
        left += nums[i];
    }
    return -1;
}
