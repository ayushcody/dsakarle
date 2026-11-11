#include <vector>

void backtrack(const std::vector<int>& nums, std::vector<bool>& used,
               std::vector<int>& path, std::vector<std::vector<int>>& res) {
    if (path.size() == nums.size()) {
        res.push_back(path);
        return;
    }
    for (int i = 0; i < (int)nums.size(); i++) {
        if (used[i]) {
            continue;
        }
        used[i] = true;
        path.push_back(nums[i]);
        backtrack(nums, used, path, res);
        path.pop_back();
        used[i] = false;
    }
}

std::vector<std::vector<int>> permute(const std::vector<int>& nums) {
    std::vector<std::vector<int>> res;
    std::vector<int> path;
    std::vector<bool> used(nums.size(), false);
    backtrack(nums, used, path, res);
    return res;
}
