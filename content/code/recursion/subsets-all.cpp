#include <vector>

void backtrack(const std::vector<int>& nums, int start,
               std::vector<int>& path, std::vector<std::vector<int>>& res) {
    res.push_back(path);
    for (int i = start; i < (int)nums.size(); i++) {
        path.push_back(nums[i]);
        backtrack(nums, i + 1, path, res);
        path.pop_back();
    }
}

std::vector<std::vector<int>> subsets(const std::vector<int>& nums) {
    std::vector<std::vector<int>> res;
    std::vector<int> path;
    backtrack(nums, 0, path, res);
    return res;
}
