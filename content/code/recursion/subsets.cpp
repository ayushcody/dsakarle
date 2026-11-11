#include <vector>

void explore(const std::vector<int>& nums, int limit, int i,
             std::vector<int>& path, std::vector<std::vector<int>>& res) {
    if (i == (int)nums.size()) {                        // @found
        res.push_back(path);                            // @found
        return;                                         // @found
    }
    if ((int)path.size() < limit) {                     // @prune
        path.push_back(nums[i]);                        // @choose
        explore(nums, limit, i + 1, path, res);         // @explore
        path.pop_back();                                // @unchoose
    }
    explore(nums, limit, i + 1, path, res);             // @skip
}

std::vector<std::vector<int>> subsets(const std::vector<int>& nums, int limit) {
    std::vector<std::vector<int>> res;                  // @init
    std::vector<int> path;                              // @init
    explore(nums, limit, 0, path, res);                 // @init
    return res;                                         // @done
}
