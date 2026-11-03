#include <unordered_map>
#include <vector>

std::vector<int> twoSum(const std::vector<int>& nums, int target) {
    std::unordered_map<int, int> seen;                  // @init
    std::vector<int> answer;                            // @init
    for (int i = 0; i < (int)nums.size(); i++) {
        int need = target - nums[i];                    // @need
        auto it = seen.find(need);                      // @check
        if (it != seen.end()) {                         // @check
            answer = {it->second, i};                   // @found
            break;                                      // @found
        }
        seen[nums[i]] = i;                              // @store
    }
    return answer;                                      // @done
}
