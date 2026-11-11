#include <algorithm>
#include <vector>

int jump(const std::vector<int>& nums) {
    int jumps = 0;
    int curEnd = 0;
    int farthest = 0;
    for (int i = 0; i < (int)nums.size() - 1; i++) {
        farthest = std::max(farthest, i + nums[i]);
        if (i == curEnd) {
            jumps++;
            curEnd = farthest;
        }
    }
    return jumps;
}
