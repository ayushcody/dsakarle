#include <utility>
#include <vector>

void reverse(std::vector<int>& nums, int lo, int hi) {
    while (lo < hi) {
        std::swap(nums[lo], nums[hi]);
        lo++;
        hi--;
    }
}

void rotate(std::vector<int>& nums, int k) {
    int n = nums.size();
    k %= n;
    reverse(nums, 0, n - 1);
    reverse(nums, 0, k - 1);
    reverse(nums, k, n - 1);
}
