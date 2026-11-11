#include <unordered_map>
#include <vector>

int subarraySum(const std::vector<int>& nums, int k) {
    std::unordered_map<int, int> seen;
    seen[0] = 1;                                             // @init
    int running = 0;                                         // @init
    int count = 0;                                           // @init
    for (int i = 0; i < static_cast<int>(nums.size()); i++) {
        running += nums[i];                                  // @add
        auto it = seen.find(running - k);                    // @check
        if (it != seen.end()) {
            count += it->second;                             // @check
        }
        seen[running]++;                                     // @store
    }
    return count;                                            // @done
}
