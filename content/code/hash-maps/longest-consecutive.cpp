#include <algorithm>
#include <unordered_set>
#include <vector>

int longestConsecutive(const std::vector<int>& nums) {
    std::unordered_set<int> values(nums.begin(), nums.end());
    int best = 0;
    for (int v : values) {
        if (!values.count(v - 1)) {
            int length = 1;
            while (values.count(v + length)) {
                length++;
            }
            best = std::max(best, length);
        }
    }
    return best;
}
