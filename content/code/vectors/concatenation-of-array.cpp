#include <vector>

std::vector<int> getConcatenation(const std::vector<int>& nums) {
    int n = (int)nums.size();
    std::vector<int> ans(2 * n);             // ask for all 2n slots once: no resizing
    for (int i = 0; i < n; i++) {
        ans[i] = nums[i];
        ans[i + n] = nums[i];
    }
    return ans;
}
